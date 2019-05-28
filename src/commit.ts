// pit: not module. https://www.jianshu.com/p/78268bd9af0a
const Ora = require('ora')
const prompt = require('inquirer').createPromptModule()

const { runCmd, openBrowser } = require('./utils/util')
const { getCache, setProjectScript } = require('./utils/cache')
const { getCommitIdLog, getBr, hasStaged, getCurrentBr, pull, push, cherryPickCommit, checkout } = require('./utils/git')
const { checkPrFileChanges, checkCommitIds } = require('./pr')
const cmd = require('./utils/cmd-constant')
const config = require('./config')
const build = require('./build')
const spinner = new Ora()

import { Config } from './utils/cache'

async function isBranchExist (branch: string): Promise<void> {
  // 检查branch是否存在
  const brArr = await getBr()
  if (!brArr.includes(branch)) {
    spinner.fail(`分支${branch}不存在`)
    process.exit(0)
  }
}

async function needBuild (branch: string, cache: Config) {
  // const mainBrList = getField('mainBrList')
  let isNeedBuild: boolean = false
  if (cache.mainBrList.includes(branch)) {
    // 目标分支存在且为主分支
    // 目标分支不存在，当前分支为主分支
    const buildQuaRes = await prompt({ ...config.needBuild, default: cache.isNeedBuild })
    isNeedBuild = buildQuaRes.isNeedBuild
  }
  return isNeedBuild
}

export const commit = async (branch?: string) => {
  // const project = getProjectRoot()
  if (branch) {
    // 检查branch是否存在
    await isBranchExist(branch)
  }

  // 检查是否存在可提交信息
  const hasChanges = await hasStaged()
  if (!hasChanges) {
    // commit stage
    spinner.info('当前工作区没有可提交修改')
    process.exit(0)
  }

  const cache = getCache()
  // const getField = getScriptField(cache, project)
  const prFileChanges = await checkPrFileChanges(cache.prFilePath)
  const prBrList: Array<string> = cache.prBr

  const currentBr: string = await getCurrentBr()
  if (prBrList.includes(currentBr)) {
    spinner.fail('不允许直接在需要pr的分支上提交修改')
    process.exit(0)
  }

  const { ciType } = await prompt({ ...config.ciType, default: cache.ciType })
  const { ciMessage } = await prompt({ ...config.ciMessage, default: cache.ciMessage })
  setProjectScript({ ciType, ciMessage })
  spinner.start('提交当前分支')

  const commitMessageCommand = cmd.gitCi(ciType, ciMessage, currentBr)
  let commitResult = await runCmd([cmd.GIT_ADD, commitMessageCommand])
  commitResult = commitResult.match(/\[(.*)\]/)[1].split(' ')
  // commitResult[0] 为当前分支
  // commitResult[1] 为commit_id
  spinner.succeed(`提交完成[${commitResult[1]}]\n  ${commitMessageCommand.match(/"(.*)"/)[1]}`)

  const needPr = prFileChanges && branch && currentBr !== branch && prBrList.includes(branch)
  if (needPr) {
    spinner.info('当前改动需要提交 pull request 合并分支.')
    await openBrowser()
    await push(currentBr)
    process.exit(0)
  }

  // const mainBrList = getField('mainBrList')
  const isNeedBuild: boolean = await needBuild(branch || currentBr, cache)
  const doPush = (needCheck: boolean) => { pushCommit(needCheck, isNeedBuild, currentBr, branch, commitResult[1]) }
  if (branch && currentBr !== branch) {
    // 为了使改动的配置文件被提交
    setProjectScript({ isNeedBuild })
    // checkout pull cherry-pick build push checkout
    doPush(true)
  } else if (cache.mainBrList.includes(currentBr)) {
    // pull build push
    doPush(false)
  }
}

export const cherryPick = async (commitEndId: string, branch: string, commitStartId?: string) => {
  // const project = getProjectRoot()
  await isBranchExist(branch)

  const hasChanges: boolean = await hasStaged()
  if (hasChanges) {
    // 判断是否存在未提交的修改
    spinner.info(`当前工作区存在修改未提交，请先暂存或提交`)
    process.exit(0)
  }

  const currentBr: string = await getCurrentBr()
  if (branch === currentBr) {
    spinner.info('cherry-pick 不能在同一个分支上进行')
    process.exit(0)
  }

  // 判断commitId是否存在
  const idArr = await getCommitIdLog()
  let commitIds
  let startIndex = commitStartId ? idArr.findIndex((x: string): boolean => x === commitStartId) : 0
  let endIndex = idArr.findIndex((x: string): boolean => x === commitEndId)

  if (startIndex > endIndex) {
    [startIndex, endIndex] = [endIndex, startIndex]
  }
  if (endIndex > -1) {
    // 收集 commit ids
    commitIds = idArr.slice(startIndex, endIndex + 1)
  } else {
    spinner.fail(`commitId [${commitEndId}] 不在最近 20 条 log 中`)
    process.exit(0)
  }

  const cache = getCache()
  // const getField = getScriptField(cache, project)

  // 检查 commitIds 的改动是否需要 pr
  const prBrList: string[] = cache.prBr
  if (prBrList.includes(branch)) {
    const exist = await checkCommitIds(commitIds, cache.prFilePath)
    if (exist) {
      spinner.info('当前改动需要提交 pull request 合并分支.')
      await openBrowser()
      await push(currentBr)
      process.exit(0)
    }
  }

  const isNeedBuild: boolean = await needBuild(branch || currentBr, cache)
  // checkout pull cherry-pick build push checkout
  await pushCommit(true, isNeedBuild, currentBr, branch, commitIds)
}

async function pushCommit (
  isNeedCheckout: boolean,
  isNeedBuild: boolean,
  currentBranch: string,
  targetBranch?: string,
  commitId?: string | string[]
): Promise<void> {
  if (isNeedCheckout) {
    // checkout pull cherry-pick build commit push checkout
    await checkout(targetBranch)
    await pull()
    await cherryPickCommit(commitId)
    if (isNeedBuild) {
      await build()
    }
    await push()
    await checkout(currentBranch)
  } else {
    await pull()
    if (isNeedBuild) {
      await build()
    }
    await push()
  }
  process.exit(0)
}

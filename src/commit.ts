// pit: not module. https://www.jianshu.com/p/78268bd9af0a
const Ora = require('ora')
const prompt = require('inquirer').createPromptModule()

const { getProjectRoot, runCmd } = require('./utils/util')
const { getCache, getScriptField, setProjectScript } = require('./utils/cache')
const { getCommitIdLog, getBr, hasStaged, getCurrentBr, pull, push, cherryPickCommit } = require('./utils/git')
const cmd = require('./utils/cmd-constant')
const config = require('./config')
const build = require('./build')
const spinner = new Ora()

async function isBranchExist (branch: string): Promise<void> {
  // 检查branch是否存在
  const brArr = await getBr()
  if (!brArr.includes(branch)) {
    spinner.fail(`分支${branch}不存在`)
    process.exit(0)
  }
}

async function needBuild (branch: string, getField: (x: string) => any) {
  const mainBrList = getField('mainBrList')
  let isNeedBuild: boolean = false
  if (mainBrList.includes(branch)) {
    // 目标分支存在且为主分支
    // 目标分支不存在，当前分支为主分支
    const buildQuaRes = await prompt({ ...config.needBuild, default: getField('isNeedBuild') })
    isNeedBuild = buildQuaRes.isNeedBuild
  }
  return isNeedBuild
}

export const commit = async (branch?: string) => {
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

  const project = getProjectRoot()
  const cache = getCache()
  const getField = getScriptField(cache, project)
  const currentBr: string = await getCurrentBr()
  // 提交当前工作区
  const { ciType } = await prompt({ ...config.ciType, default: getField('ciType') })
  const { ciMessage } = await prompt({ ...config.ciMessage, default: getField('ciMessage') })
  spinner.start('提交当前分支')
  const commitMessageCommand = cmd.gitCi(ciType, ciMessage, currentBr)
  let commitResult = await runCmd([cmd.GIT_ADD, commitMessageCommand])
  commitResult = commitResult.match(/\[(.*)\]/)[1].split(' ')
  // commitResult[0] 为当前分支
  // commitResult[1] 为commit_id
  spinner.succeed(`提交完成[${commitResult[1]}]\n  ${commitMessageCommand.match(/"(.*)"/)[1]}`)

  const mainBrList = getField('mainBrList')
  const isNeedBuild: boolean = await needBuild(branch || currentBr, getField)
  // 将操作记录写入缓存
  setProjectScript(project, { ciType, ciMessage, isNeedBuild }, cache)

  const doPush = (needCheck: boolean) => { pushCommit(needCheck, isNeedBuild, currentBr, branch, commitResult[1]) }
  if (branch && currentBr !== branch) {
    // checkout pull cherry-pick build push checkout
    doPush(true)
  } else if (mainBrList.includes(currentBr)) {
    // pull build push
    doPush(false)
  }
}

export const cherryPick = async (commitId?: string, branch?: string) => {
  if (!commitId) {
    spinner.fail('commitId 不存在')
    process.exit(0)
  } else if (!branch) {
    spinner.fail('目标 branch 不存在')
    process.exit(0)
  } else if (branch) {
    await isBranchExist(branch)
  }

  // 检查是否存在可提交信息
  const hasChanges: boolean = await hasStaged()
  if (hasChanges) {
    // 判断是否存在未提交的修改
    spinner.info(`当前工作区存在修改未提交，使用 git status 查看`)
    process.exit(0)
  }

  const currentBr: string = await getCurrentBr()
  if (branch === currentBr) {
    spinner.info('cherry-pick 不能在同一个分支上进行')
    process.exit(0)
  }

  // 判断commitId是否存在
  const idArr = await getCommitIdLog()
  if (!idArr.includes(commitId)) {
    spinner.fail(`cherry-pick [${commitId}] 不存在`)
    process.exit(0)
  }

  const project = getProjectRoot()
  const cache = getCache()
  const getField = getScriptField(cache, project)
  const isNeedBuild: boolean = await needBuild(branch || currentBr, getField)
  // checkout pull cherry-pick build push checkout
  await pushCommit(true, isNeedBuild, currentBr, branch, commitId)
}

async function pushCommit (
  isNeedCheckout: boolean,
  isNeedBuild: boolean,
  currentBranch: string,
  targetBranch?: string,
  commitId?: string
): Promise<void> {
  if (isNeedCheckout) {
    // checkout pull cherry-pick build commit push checkout
    await cherryPickCommit(targetBranch, commitId)

    if (isNeedBuild) {
      await build()
      const hasChanges = await hasStaged()
      if (hasChanges) {
        await runCmd([
          cmd.GIT_ADD,
          cmd.gitCi('build', '打包', currentBranch),
          cmd.GIT_PUSH
        ])
      }
    }

    await push()
    spinner.start(`切回 ${currentBranch} 分支`)
    await runCmd(cmd.gitCo(currentBranch))
    spinner.succeed(`切回 ${currentBranch} 分支成功`)
  } else {
    await pull()
    if (isNeedBuild) {
      await build()
    }
    await push()
  }
}

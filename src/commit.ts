const Ora = require('ora')
const prompt = require('inquirer').createPromptModule()

const { getProjectRoot, runCmd } = require('./utils/util')
const { getCache, getScriptField, setProjectScript } = require('./utils/cache')
const { getCommitIdLog, getBr, hasStaged, getCurrentBr, pull, push, cherryPickCommit } = require('./utils/git')
const cmd = require('./utils/cmdConstant')
const config = require('./config')
const spinner = new Ora()

async function isBranchExist (branch: string): Promise<void> {
  // 检查branch是否存在
  const brArr = await getBr()
  if (!brArr.includes(branch)) {
    spinner.fail(`分支${branch}不存在`)
    process.exit(0)
  }
}

async function pushCommit (
  isNeedBuild: boolean,
  currentBranch: string,
  targetBranch?: string,
  commitId?: string
): Promise<void> {
  if (targetBranch && currentBranch !== targetBranch) {
    await cherryPickCommit(targetBranch, commitId)
  } else {
    await pull()
  }

  if (isNeedBuild) {
    console.log('build')
  }

  await push()
}

export const commit = async (branch?: string) => {
  const project = getProjectRoot()
  const cache = getCache()
  const getField = getScriptField(cache, project)

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
  let isNeedBuild: boolean = false
  if (mainBrList.includes(branch || currentBr)) {
    // 目标分支存在且为主分支
    // 目标分支不存在，当前分支为主分支
    const buildQuaRes = await prompt({ ...config.needBuild, default: getField('isNeedBuild') })
    isNeedBuild = buildQuaRes.isNeedBuild
  }

  await pushCommit(isNeedBuild, currentBr, branch, commitResult[1])

  // 将操作记录写入缓存
  setProjectScript(project, { ciType, ciMessage, isNeedBuild }, cache)
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
}

// pit: not module. https://www.jianshu.com/p/78268bd9af0a
// export = commit

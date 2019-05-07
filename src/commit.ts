import get = Reflect.get;

const Ora = require('ora')
const prompt = require('inquirer').createPromptModule()

const { getProjectRoot, runCmd } = require('./utils/util')
const { getCache, getScriptField } = require('./utils/cache')
const { getCommitIdLog, getBr, hasStaged } = require('./utils/git')
const cmd = require('./utils/cmdConstant')
const config = require('./config')
const spinner = new Ora()

async function commit (branch: string, commitId: string) {
  let currentBr: string = ''

  const project = getProjectRoot()
  const cache = getCache()
  const getField = getScriptField(cache, project)

  if (branch) {
    // 检查branch是否存在
    const brArr = await getBr()
    if (!brArr.includes(branch)) {
      spinner.fail(`分支${branch}不存在`)
      process.exit(0)
    }
  } else {
    currentBr = await runCmd(cmd.GIT_HEAD)
    currentBr = currentBr.trim()
  }

  // 检查是否存在可提交信息
  const hasChanges = await hasStaged()
  if (branch && commitId) {
    // cherry-pick commit_id
    if (hasChanges) {
      // 判断是否存在未提交的修改
      spinner.info(`当前工作区存在修改未提交，使用 git status 查看`)
      process.exit(0)
    }

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

    // await doWidthBr(branch, currentBr, commitId, isNeedBuild, mainBrList)
  } else if (!hasChanges) {
    // commit stage
    spinner.info('当前工作区没有可提交修改')
    process.exit(0)
  }

  // 提交当前工作区
  const { ciType } = await prompt({ ...config.ciType, default: getField('ciType') })
  const { ciMessage } = await prompt({ ...config.ciMessage, default: getField('ciMessage') })
  spinner.start('提交当前分支')
  const commitMessageCommand = cmd.gitCi(ciType, ciMessage, currentBr)
  let brResult = await runCmd([cmd.GIT_ADD, commitMessageCommand])
  brResult = brResult.match(/\[(.*)\]/)[1].split(' ')
  // brResult[0] 为当前分支
  // brResult[1] 为commit_id
  spinner.succeed(`提交完成[${brResult[1]}]\n  ${commitMessageCommand.match(/"(.*)"/)[1]}`)

  const mainBrList = getField('mainBrList')
  // 询问是否需要打包
  if (mainBrList.includes(branch || currentBr)) {
    // 目标分支存在且为主分支
    // 目标分支不存在，当前分支为主分支
    const buildQuaRes = await prompt({ ...config.needBuild, default: getField('isNeedBuild') })
    // isNeedBuild = buildQuaRes.isNeedBuild
    console.log(buildQuaRes)
  }

  // 将操作记录写入缓存
  // await setProjectScript(projectName, { ciType, ciMessage, isNeedBuild }, cache)
}

// pit: not module. https://www.jianshu.com/p/78268bd9af0a
export = commit

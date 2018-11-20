const Ora = require('ora')
const prompt = require('inquirer').createPromptModule()
const config = require('./config')
const cmd = require('./cmdConstant')
const { getCache, setProjectScript } = require('./utils/cache.js')
const { runCmd, getBr, getCommitIdLog, hasStaged, getProjectRoot } = require('./utils/util')
const build = require('./build')
const spinner = new Ora()

module.exports = async (branch, commitId) => {
  let isNeedBuild
  const projectName = await getProjectRoot()
  const cache = await getCache()
  const mainBrList = cache.script &&
    cache.script[projectName] &&
    cache.script[projectName].mainBrList ||
    config.mainBr

  if (branch) {
    // 检查branch是否存在
    const brArr = await getBr()
    if (!brArr.includes(branch)) {
      spinner.fail(`分支${branch}不存在`)
      process.exit(0)
    }
  }

  let currentBr = await runCmd(cmd.GIT_HEAD)
  currentBr = currentBr.trim()
  if (mainBrList.includes(branch || currentBr)) {
    // 目标分支存在且为主分支
    // 目标分支不存在，当前分支为主分支
    const buildQuaRes = await prompt({
      ...config.needBuild,
      default: cache.script &&
        cache.script[projectName] &&
        cache.script[projectName].isNeedBuild
    })
    isNeedBuild = buildQuaRes.needBuild
  }

  // 检查是否存在可提交信息
  const hasChanges = await hasStaged()
  if (commitId && branch) {
    // cp commit_id
    if (hasChanges) {
      // 判断是否存在未提交的修改
      spinner.info(`当前工作区存在修改未提交，使用git status查看`)
      process.exit(0)
    }

    if (branch === currentBr) {
      spinner.info('cherry-pick 不能在同一个分支上进行')
      process.exit(0)
    }

    // 判断commitId是否存在
    const idArr = await getCommitIdLog()
    if (idArr.includes(commitId)) {
      await doWidthBr(branch, currentBr, commitId, isNeedBuild, mainBrList)
    } else {
      spinner.fail(`提交${commitId}不存在，commitId为前7位，可使用git log --oneline查看`)
    }
    return
  }

  if (!hasChanges) {
    spinner.info('没有可提交信息')
    process.exit(0)
  }

  // 判断缓存type 和 message是否存在
  const { ciType } = await prompt({
    ...config.ciType,
    default: cache.script &&
      cache.script[projectName] &&
      cache.script[projectName].ciType
  })
  const { ciMessage } = await prompt({
    ...config.ciMessage,
    default: cache.script &&
      cache.script[projectName] &&
      cache.script[projectName].ciMessage
  })

  try {
    spinner.start('提交当前分支')
    const message = cmd.gitCi(ciType, ciMessage, currentBr)
    let brResult = await runCmd([cmd.GIT_ADD, message])
    brResult = brResult.match(/\[(.*)\]/)[1].split(' ')
    // brResult[0] 为当前分支
    // brResult[1] 为commit_id
    spinner.succeed(`提交完成[${brResult[1]}]\n  ${message.match(/"(.*)"/)[1]}`)
    // 写入缓存
    await setProjectScript(projectName, { ciType, ciMessage, isNeedBuild }, cache)
    // 根据当前分支做操作
    await doWidthBr(branch, brResult[0], brResult[0], isNeedBuild, mainBrList)
  } catch(e) {
    spinner.fail('提交异常')
    throw e
  }
}

async function backToCurrentBr(currentBrName) {
  spinner.start(`切回${currentBrName}分支`)
  await runCmd([cmd.GIT_PUSH, cmd.gitCo(currentBrName)]).catch(err => {
    console.log('\n' + err)
    spinner.fail(`切回失败`)
    process.exit(0)
  })
  spinner.succeed(`切回${currentBrName}分支成功`)
  process.exit(0)
}

/**
 * 根据当前分支做操作
 * @param targetBranch
 * @param currentBrName
 * @param commitId
 * @param needBuild
 * @returns {Promise<void>}
 */
async function doWidthBr(
  targetBranch,
  currentBrName,
  commitId,
  needBuild,
  mainBrList
) {
  // 当前分支为主分支直接push，否则
  // target分支存在，cherry-pick
  if (mainBrList.includes(currentBrName)) {
    if (needBuild) {
      // 打包之后以2次提交一起推送
      build()
    } else {
      // 不需要打包直接推送
      spinner.start(`拉取并推送到${currentBrName}`)
      await runCmd([
        cmd.GIT_PULL,
        cmd.GIT_PUSH
      ]).catch(err => {
        console.log('\n' + err)
        spinner.fail(`推送失败`)
        process.exit(0)
      })
      spinner.succeed(`拉取并推送完成[${currentBrName}]`)
    }
  } else if (targetBranch) {
    // cherry-pick本次提交到targetBranch
    spinner.start(`cherry-pick ${commitId}`)
    await runCmd([
      cmd.gitCo(targetBranch),
      cmd.GIT_PULL,
      cmd.gitCp(commitId)
    ]).catch(err => {
      console.log('\n' + err)
      spinner.fail(`cherry-pick 失败`)
      process.exit(0)
    })
    spinner.succeed(`cherry-pick完成`)

    if (needBuild) {
      // 等待打包完成
      build(async () => {
        await backToCurrentBr(currentBrName)
      })
    } else {
      spinner.start(`推送分支`)
      await runCmd(cmd.GIT_PUSH).catch(err => {
        console.log('\n' + err)
        spinner.fail(`推送失败`)
        process.exit(0)
      })
      spinner.succeed(`完成推送`)
      await backToCurrentBr(currentBrName)
    }
  }
}



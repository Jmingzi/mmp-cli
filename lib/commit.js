const cmd = require('./cmdConstant')
const prompt = require('inquirer').createPromptModule()
const config = require('./config')
const { getCache, setCache } = require('./utils/cache.js')
const Ora = require('ora')
const spinner = new Ora()
const { runCmd, getBr, getCommitIdLog } = require('./utils/util')

module.exports = async (branch, commitId) => {
  if (branch) {
    // 检查branch是否存在
    const brArr = await getBr()
    if (!brArr.includes(branch)) {
      spinner.fail(`分支${branch}不存在`)
      return
    }
  }

  const currentBr = await runCmd(cmd.GIT_HEAD)
  if (commitId && branch) {
    // cp commit_id
    const idArr = await getCommitIdLog()
    if (idArr.includes(commitId)) {
      await doWidthBr(branch, currentBr, commitId)
    } else {
      spinner.fail(`提交${commitId}不存在`)
    }
    return
  }

  // 判断缓存type 和 message是否存在
  const defaultMessage = await getCache()
  const { ciType } = await prompt(config.ciType)
  const { ciMessage } = await prompt({ ...config.ciMessage, default: defaultMessage.ciMessage })
  try {
    spinner.start('提交当前分支')
    await runCmd('cd ..')
    const message = cmd.gitCi(ciType, ciMessage, currentBr)
    let brResult = await runCmd([cmd.GIT_ADD, message])
    brResult = brResult.match(/\[(.*)\]/)[1].split(' ')
    // brResult[0] 为当前分支
    // brResult[1]  为commit_id
    spinner.succeed(`提交完成：${message.match(/"(.*)"/)[1]}`)
    setCache({ ciType, ciMessage })
    await doWidthBr(branch, brResult[0], brResult[0])
  } catch(e) {
    spinner.fail('提交异常')
    throw e
  }
}

async function doWidthBr(targetBranch, currentBrName, commitId) {
  const isMainBr = config.mainBr.some(name => RegExp(name).test(currentBrName))
  // 当前分支为主分支直接push
  // 否则
  // target分支存在，cherry-pick
  if (isMainBr) {
    spinner.start(`推送到${currentBrName}`)
    await runCmd('cd ..')
    await runCmd(cmd.GIT_PUSH)
    spinner.succeed(`推送完成`)
  } else if (targetBranch) {
    // cherry-pick本次提交到targetBranch
    spinner.start(`cherry-pick`)
    await runCmd([
      cmd.gitCo(targetBranch),
      cmd.gitCp(commitId),
      cmd.GIT_PUSH,
      cmd.gitCo(currentBrName)
    ])
    spinner.succeed(`cherry-pick完成`)
  }
}


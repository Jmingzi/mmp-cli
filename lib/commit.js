const Ora = require('ora')
const prompt = require('inquirer').createPromptModule()
const config = require('./config')
const cmd = require('./cmdConstant')
const { getCache, setCache } = require('./utils/cache.js')
const { runCmd, getBr, getCommitIdLog, hasStaged } = require('./utils/util')
const build = require('./build')
const spinner = new Ora()

module.exports = async (branch, commitId) => {
  if (branch) {
    // 检查branch是否存在
    const brArr = await getBr()
    if (!brArr.includes(branch)) {
      spinner.fail(`分支${branch}不存在`)
	    process.exit(0)
    }
  }

  let isNeedBuild
  let currentBr = await runCmd(cmd.GIT_HEAD)
	currentBr = currentBr.trim()
	if (config.mainBr.includes(branch || currentBr)) {
	  // 目标分支存在且为主分支
    // 目标分支不存在，当前分支为主分支
		const buildQuaRes = await prompt({ ...config.needBuild })
		isNeedBuild = buildQuaRes.isNeedBuild
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
      await doWidthBr(branch, currentBr, commitId, isNeedBuild)
    } else {
      spinner.fail(`提交${commitId}不存在，commitId为前7位，可使用git log --oneline查看`)
    }
    return
  }

	if (!hasChanges) {
		spinner.info('没有可提交信息')
		return
	}

  // 判断缓存type 和 message是否存在
  const defaultMessage = await getCache()
  const { ciType } = await prompt(config.ciType)
  const { ciMessage } = await prompt({ ...config.ciMessage, default: defaultMessage.ciMessage })

  try {
    spinner.start('提交当前分支')
    const message = cmd.gitCi(ciType, ciMessage, currentBr)
    let brResult = await runCmd([cmd.GIT_ADD, message])
    brResult = brResult.match(/\[(.*)\]/)[1].split(' ')
    // brResult[0] 为当前分支
    // brResult[1] 为commit_id
    spinner.succeed(`提交完成[${brResult[1]}]\n  ${message.match(/"(.*)"/)[1]}`)
    setCache({ ...defaultMessage, ciType, ciMessage, needBuild: isNeedBuild })
    await doWidthBr(branch, brResult[0], brResult[0], isNeedBuild)
  } catch(e) {
    spinner.fail('提交异常')
    throw e
  }
}

async function doWidthBr(
  targetBranch,
  currentBrName,
  commitId,
  needBuild
) {
  // 当前分支为主分支直接push，否则
  // target分支存在，cherry-pick
  if (config.mainBr.includes(currentBrName)) {
    console.log(needBuild)
    if (needBuild) {
      // 打包之后以2次提交一起推送
      build()
    } else {
      // 不需要打包直接推送
      spinner.start(`推送到${currentBrName}`)
      await runCmd(cmd.GIT_PUSH).catch(err => {
        console.log('\n' + err)
        spinner.fail(`推送失败`)
	      process.exit(0)
      })
      spinner.succeed(`推送完成`)
    }
  } else if (targetBranch) {
    // cherry-pick本次提交到targetBranch
    spinner.start(`cherry-pick ${commitId}`)
    await runCmd([cmd.gitCo(targetBranch), cmd.gitCp(commitId)]).catch(err => {
      console.log('\n' + err)
      spinner.fail(`cherry-pick 失败`)
	    process.exit(0)
    })
    spinner.succeed(`cherry-pick完成`)

    if (needBuild) {
      build()
    } else {
      spinner.start(`推送并切回${currentBrName}分支`)
      await runCmd([cmd.GIT_PUSH, cmd.gitCo(currentBrName)]).catch(err => {
        console.log('\n' + err)
        spinner.fail(`推送并切回失败`)
	      process.exit(0)
      })
      spinner.succeed(`完成推送并切回${currentBrName}分支`)
    }
  }
}


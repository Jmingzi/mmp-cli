const cmd = require('./cmdConstant')
const prompt = require('inquirer').createPromptModule()
const config = require('./config')
const { print } = require('./utils/output.js')
const { getCache, setCache } = require('./utils/cache.js')
const Ora = require('ora')
const spinner = new Ora()
const childProcess = require('child_process')
const Promise = require('bluebird')

Promise.promisifyAll(childProcess)

module.exports = async branch => {
  // function _doWidthMessage(ciType, ciMessage, fullObj) {
  //   spinner.start('处理提交中...')
  //   runCmd([
  //     'git add .',
  //     `git commit -m '${ciType}: ${ciMessage}'`,
  //   ])
  //   spinner.succeed('处理完成...')
  //   // spinner.start('写入缓存...\n')
  //   setCache(fullObj)
  //   spinner.succeed('写入缓存完成...')
  //   spinner.start('处理分支...\n')
  //   doWidthBr(branch)
  // }

  // 判断缓存type 和 message是否存在
  const defaultMessage = await getCache()
  const { ciType } = await prompt(config.ciType)
  const { ciMessage } = await prompt({ ...config.ciMessage, default: defaultMessage.ciMessage })
  // _doWidthMessage(ciType, ciMessage, { ciType, ciMessage })
  spinner.start('提交当前分支')
  try {
    await runCmd('cd ..')
    const currentBr = await runCmd(cmd.GIT_HEAD)
    let brResult = await runCmd([cmd.GIT_ADD, cmd.gitCi(ciType, ciMessage, currentBr)])
    brResult = brResult.match(/\[(.*)\]/)[1].split(' ')
    // brResult[0] 为当前分支
    // brResult[1]  为commit_id
    spinner.succeed(`提交完成，得到commit_id: ${brResult[1]}`)
    setCache({ ciType, ciMessage })
    // spinner.start('check分支')
    await doWidthBr(branch, brResult[0], brResult[0])
    // spinner.succeed('处理完成')
  } catch(e) {
    spinner.stop('处理异常')
    throw e
  }
}


function runCmd(cmdArr) {
  // 需要注意当前执行目录是否为根目录
  let cmd
  if (typeof cmdArr === 'string') {
    cmd = `${cmdArr}`
  } else if (cmdArr instanceof Array) {
    cmd = cmdArr.join(' && ')
  }
  // 这一步需要同步执行
  return new Promise(resolve => {
    childProcess.exec(cmd, (err, stdout) => {
      if (err) throw err
      resolve(stdout)
    })
  })
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
    // 检查targetBranch是否存在
    const br = await runCmd(cmd.GIT_BR)
    const brArr = br.toString().trim().split('\n')
    if (brArr.some(x => new RegExp(targetBranch).test(x))) {
      await runCmd([
        cmd.gitCo(targetBranch),
        cmd.gitCp(commitId),
        cmd.GIT_PUSH,
        cmd.gitCo(currentBrName)
      ])
      spinner.succeed(`cherry-pick完成`)
    } else {
      spinner.fail(`分支${targetBranch}不存在`)
    }
  }
}


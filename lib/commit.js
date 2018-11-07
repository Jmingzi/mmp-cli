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
  const defaultMessage = await getCache().ciMessage
  const { ciType } = await prompt(config.ciType)
  const { ciMessage } = await prompt({ ...config.ciMessage, default: defaultMessage })
  // _doWidthMessage(ciType, ciMessage, { ciType, ciMessage })
  spinner.start('提交当前分支')
  try {
    await runCmd([cmd.GIT_ADD, cmd.gitCi(ciType, ciMessage)])
    spinner.succeed('提交完成，得到commit_id')
    setCache({ ciType, ciMessage })
    spinner.start('check分支')
    await doWidthBr(branch)
    spinner.succeed('处理完成')
  } catch(e) {
    spinner.stop('处理异常')
    throw e
  }
}


function runCmd(cmdArr) {
  cmdArr.unshift('cd ..')
  const cmd = cmdArr.join(' && ')
  console.log(`\n当前目录：${__dirname}`)
  // 这一步需要同步执行
  // return Promise.all(cmdArr.map(cmd => childProcess.execAsync(cmd)))
  return new Promise(resolve => {
    childProcess.exec(cmd, (err, stdout) => {
      if (err) {
        throw err
      }
      resolve(stdout)
    })
  })
}

async function doWidthBr(branch) {
  // const exec = require('child_process').execSync
  const currentBr = await runCmd([cmd.GIT_HEAD])
  const currentBrName = currentBr.toString().trim()
  // console.log(currentBrName)
  const isMainBr = config.mainBr.some(name => RegExp(name).test(currentBrName))
  if (currentBrName === branch) {
    // 在当前分支操作
    if (isMainBr) {
      runCmd(['git push'])
    }
  } else if (isMainBr) {
    runCmd(['git push'])
  } else {
    // 检查branch是否存在
    const brList = exec('git branch').toString().trim().split('\n')
    const reg = new RegExp(branch)
    if (brList.some(x => reg.test(x))) {
      // 得到当前commit id
      const id = exec('git rev-parse --short HEAD')
      spinner.text = `cherry-pick ${id}`
      runCmd([
        `git checkout ${branch}`,
        `git cherry-pick ${id}`,
        `git push`,
        `git checkout ${currentBrName}`
      ])
      spinner.succeed(`push完成.，切回${currentBrName}分支`)
    } else {
      print('red')('该分支不存在')
    }
  }
  spinner.succeed(`处理完成...`)
}


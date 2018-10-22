const prompt = require('inquirer').createPromptModule()
const config = require('./config')
const { print } = require('./utils/output.js')
const { getCache, setCache } = require('./utils/cache.js')
const Ora = require('ora')
const spinner = new Ora()

module.exports = branch => {
  function _doWidthMessage(ciType, ciMessage, fullObj) {
    spinner.start('处理提交中...')
    runCmd([
      'git add .',
      `git commit -m '${ciType}: ${ciMessage}'`,
    ])
    spinner.succeed('处理完成...')
    // spinner.start('写入缓存...\n')
    setCache(fullObj)
    spinner.succeed('写入缓存完成...')
    spinner.start('处理分支...\n')
    doWidthBr(branch)
  }

  // 判断缓存type 和 message是否存在
  getCache().then(res => {
    const { ciMessage } = res
    prompt(config.ciType).then(({ ciType }) => {
      prompt({ ...config.ciMessage, default: ciMessage }).then(({ ciMessage }) => {
        _doWidthMessage(ciType, ciMessage, { ciType, ciMessage })
      })
    })
  })
}

function runCmd(options) {
  const { execSync } = require('child_process')
  options.unshift('cd ..')
  options.forEach(execSync)
  // 新建sh脚本去执行
}

function doWidthBr(branch) {
  const exec = require('child_process').execSync
  const currentBrName = exec('git rev-parse --abbrev-ref HEAD').toString().trim()
  const isMainBr = config.mainBr.some(name => {
    const reg = new RegExp(name)
    return reg.test(currentBrName)
  })
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


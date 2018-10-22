const prompt = require('inquirer').createPromptModule()
const config = require('./config')
const { print } = require('../lib/utils/output.js')
const ora = require('ora')
// const cmdList = [
//   'git add .',
//   'git commit'
// ]
let spinner

module.exports = branch => {
  // git symbolic-ref --short -q HEAD
  // console.log(currentBrName)
  prompt(config.ciType).then(({ ciType }) => {
    prompt(config.ciMessage).then(({ ciMessage }) => {
      spinner = ora('处理提交中...').start()
      runCmd([
        'git add .',
        `git commit -m '${ciType}: ${ciMessage}'`,
      ])
      spinner.text = '处理分支...'
      doWidthBr(branch)
    })
  })
}

function runCmd(options) {
  const { execSync } = require('child_process')
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
        `git push`
      ])
    } else {
      print('red')('该分支不存在')
    }
  }
  spinner.text = `处理完成...`
  spinner.stop()
}
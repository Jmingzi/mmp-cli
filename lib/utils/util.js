const cmdConstant = require('../cmdConstant')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const stat = util.promisify(require('fs').stat)
const chalk = require('chalk')

exports.getProjectRoot = async function() {
  const pathArr = process.cwd().split('/')

  async function check(path) {
    const stats = await stat(`${path}/package.json`).catch(() => {
      return false
    })
    if (stats === false) {
      return stats
    }
    return stats.isFile()
  }

  const isFile = await check(process.cwd())
  if (isFile) {
    return exports.getProcessDir()
  } else {
    let remainPath
    let root
    while (remainPath !== process.env.HOME && !root) {
      pathArr.pop()
      remainPath = pathArr.join('/')
      root = await check(remainPath)
    }
    if (remainPath === process.env.HOME) {
      console.log(`  请在项目根目录下执行命令`)
      process.exit(0)
    }
    return exports.getProcessDir(remainPath)
  }
}

exports.getBr = async function() {
  const br = await exports.runCmd(cmd.GIT_BR)
  return br.toString().trim().split('\n').map(x => {
    const xSplit = x.split(' ')
    if (xSplit.length > 1) {
      return xSplit[xSplit.length - 1]
    }
    return x
  })
}

exports.runCmd = async function(cmdArr) {
  // 需要注意当前执行目录是否为根目录
  let cmd
  if (typeof cmdArr === 'string') {
    cmd = `${cmdArr}`
  } else if (cmdArr instanceof Array) {
    cmd = cmdArr.join(' && ')
  }
  const res = await exec(cmd).catch(err => {
    return Promise.reject(err)
  })

  if (new RegExp(cmdConstant.GIT_PUSH).test(cmd)) {
    console.log(`${chalk.green('\n\n推送返回:\n')}\n${res.stdout}`)
  }

  return res && res.stdout
}

exports.getCommitIdLog = async function() {
  const idStr = await exports.runCmd(cmd.GIT_LOG)
  return idStr.toString().trim().split('\n').map(x => x.split(' ')[0])
}

exports.hasStaged = async function() {
  const res = await exports.runCmd('git status')
  // console.log(/Changes not staged for commit/i.test(res))
  return /Changes not staged for commit/i.test(res)
}

exports.getLastCmd = function (str) {
  const arr = str.split(' ')
  return arr[arr.length - 1]
}

exports.getConfigNotice = function (br) {
  return `package.json的scripts中不存在${br}分支打包命令
  
  例如：package.json
    "scripts": {
      "dev": "npm run dev",
      "build": "npm run build"
    }
  那么这里配置npm run dev和npm run build即可  
  `
}

exports.hasPullChange = function (str) {
  return !/Already up to date/.test(str)
}

exports.getProcessDir = function (path) {
  const str = path || process.cwd()
  const index = str.lastIndexOf('/')
  return str.substring(index + 1)
}



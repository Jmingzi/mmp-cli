const cmd = require('../cmdConstant')
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const appRoot = require('app-root-path')
const pkg = require(appRoot.resolve('package.json'))

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
  // if (res.stderr) {
	//   return Promise.reject(res.stderr)
  // }
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

exports.projectName = pkg.name


exports.hasPullChange = function (str) {
  return !/Already up to date/.test(str)
}

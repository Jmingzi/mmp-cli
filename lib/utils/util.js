const cmd = require('../cmdConstant')
const childProcess = require('child_process')
const Promise = require('bluebird')
Promise.promisifyAll(childProcess)

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
  // 这一步需要同步执行
  return new Promise(resolve => {
    childProcess.exec(cmd, (err, stdout) => {
      if (err) throw err
      resolve(stdout)
    })
  })
}

exports.getCommitIdLog = async function() {
  const idStr = await exports.runCmd(cmd.GIT_LOG)
  return idStr.toString().trim().split('\n').map(x => x.split(' ')[0])
}

exports.noStaged = async function() {
  const res = await exports.runCmd('git status')
  // console.log(/Changes not staged for commit/i.test(res))
  return /Changes not staged for commit/i.test(res)
}

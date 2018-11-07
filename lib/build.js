const Ora = require('ora')
const cmd = require('./cmdConstant')
const { runCmd, hasStaged } = require('./utils/util')
const { getCache } = require('./utils/cache')
const childProcess = require('child_process')
const spinner = new Ora()

module.exports = async () => {
  const currentBr = await runCmd(cmd.GIT_HEAD)
  const cache = await getCache()
  build(cache.script[currentBr.trim()], async () => {
    const hasCommit = await hasStaged()
    if (!hasCommit) {
      spinner.info('没有可提交信息')
      return ''
    }

    spinner.start('提交打包信息')
    try {
      await runCmd([
        cmd.GIT_ADD,
        cmd.gitCi('build', '打包', currentBr),
        cmd.GIT_PUSH
      ])
      spinner.succeed('提交并且推送成功')
    } catch(e) {
      console.log(e)
      spinner.fail('提交打包信息失败')
    }
  })
}

function build(cmd, cb) {
  spinner.start('打包中')
  const subBuild = childProcess.fork(
    `${__dirname}/utils/buildScript.js`, {
      cwd: process.cwd()
    }
  )
  subBuild.send({ cmd })
  subBuild.on('message', async res => {
    if (res.ok) {
      await runCmd('clear')
      spinner.succeed('打包完成')
      cb()
    } else {
      spinner.fail(res.msg + '\n  ' + res.e.cmd)
    }
    subBuild.kill('SIGHUP')
  })
}

const Ora = require('ora')
const cmd = require('./cmdConstant')
const { runCmd, hasStaged, projectName } = require('./utils/util')
const { getCache } = require('./utils/cache')
const initConfig = require('./init')
const childProcess = require('child_process')
const spinner = new Ora()

module.exports = async function execBuild() {
  const currentBr = await runCmd(cmd.GIT_HEAD)
  const cache = await getCache()

  // 校验配置是否存在
  let buildCmd = cache.script &&
      cache.script[projectName] &&
      cache.script[projectName][currentBr.trim()]
  if (!buildCmd) {
    spinner.info('还没有初始化配置，请先配置')
    const ok = await initConfig()
    if (!ok) return ''
    // 递归调用
    await execBuild()
  }

  // console.log(buildCmd)
  build(buildCmd, async () => {
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
      process.exit(0)
    } catch(e) {
      console.log(e)
      spinner.fail('提交打包信息失败')
	    process.exit(0)
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
    spinner.info(`子进程退出码: ${res.e.code}`)
    if (res.ok) {
      await runCmd('clear')
      spinner.succeed('打包完成')
	    cb()
    } else {
	    spinner.fail(res.msg + '\n  ' + res.e.cmd)
    }
  })
}

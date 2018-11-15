const Ora = require('ora')
const cmd = require('./cmdConstant')
const { runCmd, hasStaged, hasPullChange, getProjectRoot } = require('./utils/util')
const { getCache } = require('./utils/cache')
const initConfig = require('./init')
const childProcess = require('child_process')
const spinner = new Ora()

module.exports = async function execBuild(callback) {
  const projectName = await getProjectRoot()

  // 先pull是否有更新
  spinner.start('拉取更新')
  const pullRes = await runCmd(cmd.GIT_PULL).catch(() => {
    spinner.fail('拉取更新失败')
    process.exit(0)
  })
  spinner.succeed(hasPullChange(pullRes) ? '远程仓库有更新，已拉取到本地' : '远程仓库无更新')

  let currentBr = await runCmd(cmd.GIT_HEAD)
  currentBr = currentBr.trim()
  const cache = await getCache()

  // 校验配置是否存在
  let buildCmd = cache.script &&
    cache.script[projectName] &&
    cache.script[projectName][currentBr]
  if (!buildCmd) {
    spinner.info('还没有配置打包命令，请修改配置增加打包命令')
    const ok = await initConfig()
    if (!ok) return ''
    // 递归调用
    await execBuild(callback)
  }

  build(buildCmd, async () => {
    const hasCommit = await hasStaged()
    if (!hasCommit) {
      spinner.info('没有可提交信息')
      process.exit(0)
    }

    spinner.start('提交打包信息')
    try {
      await runCmd([
        cmd.GIT_ADD,
        cmd.gitCi('build', '打包', currentBr),
        cmd.GIT_PUSH
      ])
      spinner.succeed('提交并且推送成功')
      // 根据build来源判断是否需要进行后续操作
      if (callback && typeof callback === 'function') {
        callback()
      } else {
        process.exit(0)
      }
    } catch(e) {
      console.log(e)
      spinner.fail('提交打包信息失败')
      process.exit(0)
    }
  })
}

function build(cmd, cb) {
  if (!cmd) {
    // 递归执行完毕后 cmd 为空
    return
  }

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
      await cb().catch(e => {
        console.log(e)
      })
    } else {
      spinner.fail(res.msg + '\n  ' + res.e.cmd)
      process.exit(0)
    }
  })
  subBuild.on('error', e => {
    console.log(e)
  })
}

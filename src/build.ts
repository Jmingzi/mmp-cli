const Ora = require('ora')
const path = require('path')
const childProcess = require('child_process')

const cmd = require('./utils/cmd-constant')
const { getProjectRoot, runCmd } = require('./utils/util')
const { getCache, getScriptField } = require('./utils/cache')
const { getCurrentBr, hasStaged } = require('./utils/git')
const { initSingleBr } = require('./init')
const spinner = new Ora()

import { SpawnResult } from './utils/build-script'

const build = async (buildImmediate?: boolean) => {
  const project = getProjectRoot()
  const cache = getCache()
  const getField = getScriptField(cache, project)
  const currentBr = await getCurrentBr()

  // 非主分支不能打包
  const mainBrList = getField('mainBrList')
  if (!mainBrList.includes(currentBr)) {
    spinner.fail(`当前分支 ${currentBr} 不是主分支，不能执行打包命令`)
    process.exit(0)
  }

  // 校验配置是否存在
  let buildCmd = getField(currentBr)
  if (!buildCmd) {
    spinner.info('当前分支还没有配置打包命令')
    buildCmd = await initSingleBr(currentBr)
  }

  await buildScript(buildCmd)

  const hasChanges = await hasStaged()
  spinner.start('提交打包结果')
  if (hasChanges) {
    await runCmd([
      cmd.GIT_ADD,
      cmd.gitCi('build', '打包', currentBr),
      cmd.GIT_PUSH
    ])
    spinner.succeed('提交打包结果成功')
  } else {
    spinner.info('📦 打包后无可提交信息')
  }
  if (buildImmediate) {
    process.exit(0)
  }
}

function buildScript (cmd: string) {
  return new Promise((resolve, reject) => {
    spinner.start('打包中')
    const subBuild = childProcess.fork(path.resolve(__dirname, './utils/build-script'), {
      cwd: process.cwd()
    })

    subBuild.send({ cmd })
    subBuild.on('message', async (res: SpawnResult) => {
      spinner.info(`子进程退出码: ${res.e.code}`)
      if (res.ok) {
        await runCmd('clear')
        spinner.succeed(res.msg)
        resolve()
      } else {
        spinner.fail(res.msg + '\n  ' + res.e.cmd)
        reject()
        process.exit(0)
      }
    })
    subBuild.on('error', (e: Error) => {
      reject(e)
      process.exit(0)
    })
  })
}

export = build

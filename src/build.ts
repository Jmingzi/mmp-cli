const Ora = require('ora')
const path = require('path')
const childProcess = require('child_process')

const { getProjectRoot, runCmd } = require('./utils/util')
const { getCache, getScriptField } = require('./utils/cache')
const { getCurrentBr } = require('./utils/git')
const { initSingleBr } = require('./init')
const spinner = new Ora()

import { SpawnResult } from './utils/build-script'

const build = async () => {
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

  await buildScript(buildCmd).catch((e: Error) => {
    console.log(e)
    process.exit(0)
  })
}

function buildScript (cmd: string) {
  return new Promise((resolve, reject) => {
    spinner.start('打包中')
    const subBuild = childProcess.fork(path.resolve(__dirname, './utils/buildScript.js'), {
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

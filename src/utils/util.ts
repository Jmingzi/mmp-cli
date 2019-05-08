const fs = require('fs')
const util = require('util')
const path = require('path')
const childProcess = require('child_process')
const boxen = require('boxen')
const colors = require('colors/safe')
// const cmdConstant = require('./cmd-constant')

interface Api {
  [x: string]: any
}

const promisify = (api: any[]): Api => {
  const result: Api = {}
  api.forEach(fn => {
    result[fn.name] = util.promisify(fn)
  })
  return result
}
const asyncApi = promisify([
  childProcess.exec
])

const self = {
  configPath: `${process.env.HOME}/.mmprc`,

  ...asyncApi,

  runCmd: async (cmd: string | string[]): Promise<string> => {
    if (typeof cmd === 'string') {
      cmd = [cmd]
    }
    cmd = cmd.join(' && ')
    const { stdout } = await asyncApi.exec(cmd)
    return stdout
  },

  // 提示参考 https://github.com/KohPoll/pkg-updater/blob/master/lib/index.js
  noticeUpdate: (current: string, latest: string) => {
    const msg = 'mmp-cli 有更新的版本可以使用: \n' +
      `${colors.dim(current)} -> ${colors.green(latest)}\n` +
      `运行 ${colors.cyan('npm update mmp-cli -g')} 更新.`

    console.log(boxen(msg, {
      padding: 1,
      margin: 1,
      borderColor: 'yellow',
      borderStyle: 'classic'
    }))
  },

  getPathDir (path: string = process.cwd(), index: number = 0): string {
    const arr = path.split('/')
    return arr[arr.length - 1 + index]
  },

  isRoot: (p: string): boolean => fs.existsSync(path.join(p, 'package.json')),

  getProjectRoot (): string {
    const cwd = process.cwd()
    if (self.isRoot(cwd)) {
      return self.getPathDir()
    } else {
      // 向上查找
      let result = ''
      let remain = cwd
      const pathItem = cwd.split('/')
      while (!result && remain !== process.env.HOME) {
        pathItem.pop()
        remain = pathItem.join('/')
        if (self.isRoot(remain)) {
          result = self.getPathDir(remain)
        }
      }
      return result
    }
  }
}

export = self

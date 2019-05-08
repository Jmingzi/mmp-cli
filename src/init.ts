const Ora = require('ora')
const prompt = require('inquirer').createPromptModule()

const { getCache, setProjectScript, getScriptField, defaultConfigItem } = require('./utils/cache')
const { getProjectRoot } = require('./utils/util')
const config = require('./config')
const spinner = new Ora()

interface Api {
  [x: string]: any
}

export async function initSingleBr(currentBr: string): Promise<string> {
  let cache = getCache()
  const project = getProjectRoot()

  // 当前项目配置文件不存在
  if (cache.script && !cache.script[project]) {
    setProjectScript(project, defaultConfigItem, cache)
    cache = getCache()
  }

  const cmd = await notice(currentBr)
  setProjectScript(project, { [currentBr]: cmd }, cache)
  return cmd
}

export async function initConfig() {
  let cache = getCache()
  const project = getProjectRoot()

  // 当前项目配置文件不存在
  if (cache.script && !cache.script[project]) {
    setProjectScript(project, defaultConfigItem, cache)
    cache = getCache()
  }

  const getField = getScriptField(cache, project)
  const mainBrList = getField('mainBrList')
  const { scriptBranch } = await prompt({
    ...config.scriptBranch,
    default: mainBrList instanceof Array ? mainBrList.join(' ') : defaultConfigItem.mainBrList
  })

  // 需要构建主分支所有的命令
  const mainBrArr = scriptBranch.split(' ')
  const mainBrScriptMap: Api = {}
  let i = 0
  async function doNotice(name: string) {
    mainBrScriptMap[name] = await notice(name)
    i ++
    if (i < mainBrArr.length) {
      await doNotice(mainBrArr[i])
    }
  }
  await doNotice(mainBrArr[i])

  setProjectScript(project, { ...mainBrScriptMap, mainBrList: mainBrArr }, cache)
  spinner.succeed('初始化配置完成. 可使用 mmp ls 查看详情')
}

async function notice(name: string) {
  const cmdName = await prompt({
    type: 'input',
    name,
    message: `请输入${name}分支打包命令`,
    validate(input: string) {
      const done = this.async()
      if (!input) {
        done('命令不能为空！')
        return
      }
      done(null, true)
    }
  })
  return cmdName[name]
}

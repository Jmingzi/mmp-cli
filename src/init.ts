const Ora = require('ora')
const prompt = require('inquirer').createPromptModule()

const { setCache, getCache, setProjectScript, getScriptField, defaultConfigItem } = require('./utils/cache')
const { getProjectRoot } = require('./utils/util')
const config = require('./config')
const spinner = new Ora()

interface Api {
  [x: string]: any
}

async function notice(name: string, brCmd?: string) {
  const cmdName = await prompt({
    type: 'input',
    name,
    message: `请输入${name}分支打包命令`,
    default: brCmd,
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
    mainBrScriptMap[name] = await notice(name, getField(name))
    i ++
    if (i < mainBrArr.length) {
      await doNotice(mainBrArr[i])
    }
  }
  await doNotice(mainBrArr[i])

  setProjectScript(project, { ...mainBrScriptMap, mainBrList: mainBrArr }, cache)
  spinner.succeed('初始化配置完成. 可使用 mmp ls 查看详情')
}

export const addMainBr = async function(branch: string) {
  const project = await getProjectRoot()
  const cache = await getCache()
  const getField = getScriptField(cache, project)

  const mainBrList = getField('mainBrList')
  if (!mainBrList.includes(branch)) {
    mainBrList.push(branch)
    setProjectScript(project, { mainBrList }, cache)
    spinner.succeed(`新增${branch}到mainBrList成功`)
  } else {
    spinner.fail(`${branch}在mainBrList中已存在`)
  }
}

export const delMainBr = async (branch: string) => {
  if (defaultConfigItem.mainBrList.includes(branch)) {
    spinner.info('不能删除默认主分支')
    process.exit(0)
  }

  // 删除主分支及其命令
  const project = await getProjectRoot()
  const cache = await getCache()
  const getField = getScriptField(cache, project)

  const mainBrList = getField('mainBrList')
  const index = mainBrList.findIndex((x: string) => x === branch)
  if (index > -1) {
    mainBrList.splice(index, 1)
    delete cache.script[project][branch]
    setProjectScript(project, { mainBrList }, cache)
    spinner.succeed(`删除主分支 ${branch} 及其命令成功`)
  } else {
    spinner.fail(`${branch}不存在mainBrList中`)
  }
}

export const delProject = async () => {
  const project = await getProjectRoot()
  const cache = await getCache()

  delete cache.script[project]
  setCache(cache)
  spinner.succeed(`删除项目配置成功`)
}

export const ls = async () => {
  const projectName = await getProjectRoot()
  const cache = await getCache()
  const result = cache.script && cache.script[projectName]
  if (result) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    spinner.info('项目配置未初始化，执行 mmp init.')
  }
}

export const setBrCmd = async function(branch: string, cmd_value: string) {
  const project = await getProjectRoot()
  const cache = await getCache()
  const getField = getScriptField(cache, project)

  const mainBrList = getField('mainBrList')
  // 校验branch是否存在于本地分支列表
  if (!mainBrList.includes(branch)) {
    spinner.fail(`${branch}不存在本项目的主分支列表中`)
    process.exit(0)
  }

  setProjectScript(project, { [branch]: cmd_value }, cache)
  spinner.succeed(`设置 ${branch}=${cmd_value} 成功`)
}

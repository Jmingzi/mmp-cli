const Ora = require('ora')
const prompt = require('inquirer').createPromptModule()

const { setCache, getCache, setProjectScript, defaultConfig } = require('./utils/cache')
const { getProjectRoot } = require('./utils/util')
const config = require('./config')
const spinner = new Ora()

const configMap = {
  prfile: 'prFilePath',
  prbranch: 'prBr',
  branch: 'mainBrList'
}

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
  getProjectRoot()
  // const { config, localConfig } = getCache(project)

  // 当前项目配置文件不存在
  // if (cache.script && !cache.script[project]) {
  //   setProjectScript(project, defaultConfigItem, cache)
  //   cache = getCache()
  // }

  const cmd = await notice(currentBr)
  setProjectScript(true,{ [currentBr]: cmd })
  return cmd
}

export async function initConfig() {
  getProjectRoot()
  const cache = getCache()

  // 当前项目配置文件不存在
  // if (cache.script && !cache.script[project]) {
  //   setProjectScript(project, defaultConfigItem, cache)
  //   cache = getCache()
  // }

  // const getField = getScriptField(cache, project)
  // const mainBrList = getField('mainBrList')
  const { scriptBranch } = await prompt({
    ...config.scriptBranch,
    default: cache.localConfig.mainBrList instanceof Array
      ? cache.localConfig.mainBrList.join(' ')
      : defaultConfig.mainBrList
  })

  // 需要构建主分支所有的命令
  const mainBrArr = scriptBranch.split(' ')
  const mainBrScriptMap: Api = {}
  let i = 0
  async function doNotice(name: string) {
    mainBrScriptMap[name] = await notice(name, cache[name])
    i ++
    if (i < mainBrArr.length) {
      await doNotice(mainBrArr[i])
    }
  }
  await doNotice(mainBrArr[i])

  setProjectScript(true, { ...mainBrScriptMap, mainBrList: mainBrArr })
  spinner.succeed('初始化配置完成. 可使用 mmp ls 查看详情')
}

export const addConfig = async function(value: string, type: 'prfile' | 'prbranch' | 'branch') {
  await getProjectRoot()
  const cache = await getCache()
  // const getField = getScriptField(cache, project)
  const field = configMap[type]

  const fieldValue: string[] = cache.localConfig[field] || []
  if (!fieldValue.includes(value)) {
    fieldValue.push(value)
    setProjectScript(true,{ [field]: fieldValue })
    spinner.succeed(`新增 ${value} 到 ${field} 成功`)
  } else {
    spinner.fail(`${value} 在 ${field} 中已存在`)
  }
}

export const delConfig = async (value: string, type: 'prfile' | 'prbranch' | 'branch') => {
  const isBranch = type === 'branch'
  if (isBranch && defaultConfig.mainBrList.includes(value)) {
    spinner.info('不能删除默认主分支')
    process.exit(0)
  }

  const field = configMap[type]
  // const project = await getProjectRoot()
  const cache = await getCache()
  // const getField = getScriptField(cache, project)
  const fieldValue = cache[field]

  const index = fieldValue.findIndex((x: string) => x === value)
  if (index > -1) {
    fieldValue.splice(index, 1)

    if (isBranch) {
      // 删除主分支命令
      delete cache[value]
    }

    setProjectScript(true, { [field]: fieldValue })
    spinner.succeed(`从 ${field} 中删除 ${value} 成功`)
  } else {
    spinner.fail(`${value} 不存在 ${field} 中`)
  }
}

// export const delProject = async () => {
  // getProjectRoot()
  // const cache = await getCache()
  //
  // delete cache.localConfig.script[project]
  // setCache(cache)
  // spinner.succeed(`删除项目配置成功`)
// }

export const ls = async () => {
  // const projectName = await getProjectRoot()
  const cache = await getCache()
  // const result = cache.script && cache.script[projectName]
  if (cache) {
    console.log(JSON.stringify(cache, null, 2))
  } else {
    spinner.info('项目配置未初始化，执行 mmp init.')
  }
}

export const setBrCmd = async function(branch: string, cmd_value: string) {
  // const project = await getProjectRoot()
  const cache = await getCache()
  // const getField = getScriptField(cache, project)

  // const mainBrList = getField('mainBrList')
  // 校验branch是否存在于本地分支列表
  if (!cache.localConfig.mainBrList.includes(branch)) {
    spinner.fail(`${branch}不存在本项目的主分支列表中`)
    process.exit(0)
  }

  setProjectScript({ [branch]: cmd_value })
  spinner.succeed(`设置 ${branch}=${cmd_value} 成功`)
}

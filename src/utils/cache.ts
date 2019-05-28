const fs = require('fs')
// const Ora = require('ora')
const { configPath, projectConfig } = require('./util')
// const spinner = new Ora()

interface ConfigItem {
  ciType: string
  ciMessage: string
  isNeedBuild: boolean
}

export interface Config {
  lastCheckTs: number
  [name: string]: ConfigItem | number
}

export interface ConfigLocal {
  prFilePath: string[]
  prBr: string[]
  develop?: string
  master?: string
  mainBrList: string[]
}

interface Cache {
  localConfig: ConfigLocal,
  config: Config
}

export const defaultConfigItem: ConfigItem = {
  ciType: 'fix',
  ciMessage: '',
  isNeedBuild: false
}

export const defaultLocalConfig: ConfigLocal = {
  prFilePath: [],
  prBr: [],
  mainBrList: ['master', 'develop']
}

let projectConfigPath: string
export const getProjectConfigPath = () => {
  return projectConfigPath || `${projectConfig()}/.mmprc.json`
}

export const setCache = (isLocal: boolean = true, fullObj: ConfigLocal | Config) => {
  fs.writeFileSync(
    isLocal ? getProjectConfigPath() : configPath,
    JSON.stringify(fullObj, null, 2)
  )
}

export const getCache = (project: string): Cache => {
  let localConfig
  let config
  try {
    localConfig = JSON.parse(fs.readFileSync(getProjectConfigPath(), 'utf8'))
  } catch (e) {
    setCache(true, defaultLocalConfig)
    localConfig = defaultLocalConfig
  }
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (e) {
    const tmp = { lastCheckTs: 0, [project]: defaultConfigItem }
    setCache(false, tmp)
    config = tmp
  }
  return {
    localConfig,
    config
  }
}

export const setProjectScript = (project: string, isLocal: boolean, obj: Config): void => {
  const { config, localConfig } = getCache(project)
  if (isLocal) {
    setCache(true, { ...localConfig, ...obj })
  } else {
    // @ts-ignore
    config[project] = { ...config[project], ...obj }
    setCache(false, config)
  }
}

// export const getScriptField = (field: string, fullObj?: Config) => {
  // return fullObj ? fullObj[field] :
  // return (field: string) => {
    // if (fullObj && fullObj.script[project]) {
    //   return fullObj.script[project][field]
    // }
  // spinner.info('项目配置不存在，初始化默认配置')
  // console.log(JSON.stringify(defaultConfigItem, null, 2))
  // setProjectScript(project, {}, fullObj)
  // return defaultConfigItem[field]
  // }
// }

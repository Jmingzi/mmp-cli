const fs = require('fs')
// const Ora = require('ora')
const { configPath, projectConfig } = require('./util')
// const spinner = new Ora()

// interface ConfigItem {
//   ciType: string
//   ciMessage: string
//   isNeedBuild: boolean
// }

export interface Config {
  lastCheckTs: number
  ciType: string
  ciMessage: string
  isNeedBuild: boolean
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

export const defaultConfig: Config = {
  lastCheckTs: 0,
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

export const getCache = (): Cache => {
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
    setCache(false, defaultConfig)
    config = defaultConfig
  }
  return {
    localConfig,
    config
  }
}

export const setProjectScript = (isLocal: boolean, obj: Config): void => {
  const { config, localConfig } = getCache()
  if (isLocal) {
    setCache(true, { ...localConfig, ...obj })
  } else {
    setCache(false, { ...config, ...obj })
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

const fs = require('fs')
const Ora = require('ora')
const { configPath } = require('./util')
const spinner = new Ora()

interface ConfigItem {
  ciType?: string,
  ciMessage?: string,
  develop?: string,
  master?: string,
  isNeedBuild?: boolean,
  mainBrList?: string[],
  [branch: string]: string | boolean | string[] | void
}

interface Config {
  lastCheckTs: number,
  script: {
    [project: string]: ConfigItem
  }
}

export const defaultConfig: Config = {
  lastCheckTs: 0,
  script: {}
}

export const defaultConfigItem: ConfigItem = {
  ciType: 'fix',
  ciMessage: '',
  isNeedBuild: false,
  mainBrList: ['master', 'develop']
}

export const setCache = (fullObj: Config) => {
  fs.writeFileSync(configPath, JSON.stringify(fullObj, null, 2))
}

export const getCache = (): void | Config => {
  try {
    const res = fs.readFileSync(configPath, 'utf8')
    return res ? JSON.parse(res) : null
  } catch (e) {
    // 创建配置文件
    setCache(defaultConfig)
    return defaultConfig
  }
}

export const setProjectScript = (
  projectName: string,
  messageObj: ConfigItem,
  fullObj: Config
): void => {
  if (!fullObj.script[projectName]) {
    fullObj.script[projectName] = defaultConfigItem
  }
  fullObj.script[projectName] = {
    ...fullObj.script[projectName],
    ...messageObj
  }
  setCache(fullObj)
}

export const getScriptField = (fullObj: Config, project: string) => {
  return (field: string) => {
    if (fullObj && fullObj.script[project]) {
      return fullObj.script[project][field]
    }
    spinner.info('项目配置不存在，初始化默认配置')
    console.log(JSON.stringify(defaultConfigItem, null, 2))
    setProjectScript(project, {}, fullObj)
    return defaultConfigItem[field]
  }
}

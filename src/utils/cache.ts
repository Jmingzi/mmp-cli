const fs = require('fs')
const { configPath } = require('./util')

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
    setCache(defaultConfig)
    return defaultConfig
  }
}

export const setProjectScript = (
  projectName: string,
  messageObj: ConfigItem,
  fullObj: Config
): void => {
  if (!fullObj.script) {
    fullObj.script = {
      [projectName]: {}
    }
  }
  fullObj.script[projectName] = {
    ...(fullObj.script[projectName] || null),
    ...messageObj
  }
  setCache(fullObj)
}

export const getScriptField = (fullObj: Config, project: string) => {
  return (field: string) => fullObj && fullObj.script[project] ? fullObj.script[project][field] : null
}

const fs = require('fs')
// const Ora = require('ora')
const { configPath, projectConfig } = require('./util')
// const spinner = new Ora()

export interface Config {
  lastCheckTs?: number
  ciType: string
  ciMessage: string
  develop?: string
  master?: string
  isNeedBuild: boolean
  mainBrList: string[]
  prFilePath: string[]
  prBr: string[]
  // [branch: string]: string | boolean | string[] | void
}

// interface Config {
//   lastCheckTs: number,
//   script: {
//     [project: string]: ConfigItem
//   }
// }

// export const defaultConfig: Config = {
//   lastCheckTs: 0,
//   script: {}
// }

export const defaultConfig: Config = {
  ciType: 'fix',
  ciMessage: '',
  isNeedBuild: false,
  prFilePath: [],
  prBr: [],
  mainBrList: ['master', 'develop']
}

let projectConfigPath: string
export const getProjectConfigPath = () => {
  return projectConfigPath || `${projectConfig()}/.mmprc.json`
}

export const setCache = (fullObj: Config) => {
  fs.writeFileSync(getProjectConfigPath(), JSON.stringify(fullObj, null, 2))
}

export const getCache = (): Config => {
  try {
    const res = fs.readFileSync(getProjectConfigPath(), 'utf8')
    return JSON.parse(res)
  } catch (e) {
    setCache(defaultConfig)
    return defaultConfig
  }
  // try {
  //   const res = fs.readFileSync(getProjectConfigPath(), 'utf8')
  //   return res ? JSON.parse(res) : null
  // } catch (e) {
  //   // 创建配置文件
  //   setCache(defaultConfig)
  //   return defaultConfig
  // }
}

export const setProjectScript = (obj: Config): void => {
  setCache({ ...getCache(), ...obj })
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

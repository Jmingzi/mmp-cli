const { getCache, setCache } = require('./utils/cache')
const { getLastCmd } = require('./utils/util')
const prompt = require('inquirer').createPromptModule()
const config = require('./config')
const Ora = require('ora')
const spinner = new Ora()

module.exports = async function initConfig(defaultConfig) {
  // 判断配置文件是否存在
  const cache = await getCache()
  // console.log(cache)
  if (cache.script && !defaultConfig) {
    console.log(cache.script)
    const { initRepeat } = await prompt(config.initRepeat)
    if (initRepeat) {
      const ok = await initConfig(cache.script)
      ok && spinner.succeed('修改配置成功')
    }
  } else {
    // 初始化命令
    const { scriptDevelop } = await prompt({ ...config.scriptDevelop, default: defaultConfig && defaultConfig.develop })
    const { scriptMaster } = await prompt({ ...config.scriptMaster, default: defaultConfig && defaultConfig.master })
    // 从package.json中校验命令
    const { scripts } = require('../package')
    if (!Object.keys(scripts).includes(getLastCmd(scriptDevelop))) {
      spinner.fail('develop命令 => package.json的scripts中不存在这条命令')
      return false
    }
    if (!Object.keys(scripts).includes(getLastCmd(scriptMaster))) {
      spinner.fail('master命令 => package.json的scripts中不存在这条命令')
      return false
    }
    setCache({ ...cache, script: {
      develop: scriptDevelop,
      master: scriptMaster
    }})
    !defaultConfig && spinner.succeed('初始化完成')
    return true
  }
}

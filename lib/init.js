const { getCache, setProjectScript } = require('./utils/cache')
const { getProjectRoot } = require('./utils/util')
const prompt = require('inquirer').createPromptModule()
const config = require('./config')
const Ora = require('ora')
const spinner = new Ora()

module.exports = async function initConfig(defaultConfig) {
  const projectName = await getProjectRoot()

  // 判断配置文件是否存在
  const cache = await getCache()
  if (
    cache.script &&
    cache.script[projectName] &&
    !defaultConfig
  ) {
    // 提示已存在
    const { initRepeat } = await prompt(config.initRepeat)
    if (initRepeat) {
      const ok = await initConfig(cache.script[projectName])
      ok && spinner.succeed('修改配置成功')
      return true
    }
  } else {
    // 初始化命令
    spinner.info('不会去校验命令的准确性')
    const { scriptBranch } = await prompt({
      ...config.scriptBranch,
      default: defaultConfig &&
        defaultConfig.mainBrList &&
        defaultConfig.mainBrList.join(' ') ||
        'master develop'
    })
    const { scriptDevelop } = await prompt({
      ...config.scriptDevelop,
      default: defaultConfig && defaultConfig.develop
    })
    const { scriptMaster } = await prompt({
      ...config.scriptMaster,
      default: defaultConfig && defaultConfig.master
    })

    // 需要构建主分支所有的命令
    const scriptBrArr = scriptBranch.split(' ')
    const scriptOther = {}
    if (scriptBrArr.length > 2) {
      let i = 2
      async function notice(name) {
        const cmdName = await prompt({
          type: 'input',
          name,
          message: `请输入${name}分支打包命令`
        })
        scriptOther[name] = cmdName[name]
        i ++

        if (i >= scriptBrArr.length) {
          return
        }
        await notice(scriptBrArr[i])
      }
      await notice(scriptBrArr[i])
    }

    setProjectScript(projectName, {
      develop: scriptDevelop,
      master: scriptMaster,
      ...scriptOther,
      mainBrList: scriptBrArr
    }, cache)
    !defaultConfig && spinner.succeed('初始化完成')
    return true
  }
}

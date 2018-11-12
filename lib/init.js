const { getCache, setProjectScript } = require('./utils/cache')
const { getLastCmd, getConfigNotice, getProjectRoot } = require('./utils/util')
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
		// console.log(cache.script[projectName])
		const { initRepeat } = await prompt(config.initRepeat)
		if (initRepeat) {
			const ok = await initConfig(cache.script[projectName])
			ok && spinner.succeed('修改配置成功')
			return true
		}
	} else {
		// 初始化命令
		const { scriptDevelop } = await prompt({ ...config.scriptDevelop, default: defaultConfig && defaultConfig.develop })
		const { scriptMaster } = await prompt({ ...config.scriptMaster, default: defaultConfig && defaultConfig.master })
		// 从package.json中校验命令
		const { scripts } = require('../package')
		if (!Object.keys(scripts).includes(getLastCmd(scriptDevelop))) {
			spinner.fail(getConfigNotice('develop'))
			return false
		}
		if (!Object.keys(scripts).includes(getLastCmd(scriptMaster))) {
			spinner.fail(getConfigNotice('master'))
			return false
		}
		setProjectScript(projectName, {
			develop: scriptDevelop,
			master: scriptMaster
		}, cache)
		!defaultConfig && spinner.succeed('初始化完成')
		return true
	}
}

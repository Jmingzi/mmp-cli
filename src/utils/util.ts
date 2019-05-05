const util = require('util')
const childProcess = require('child_process')
const boxen = require('boxen')
const colors = require('colors/safe')

interface Api {
	[x: string]: any
}

const promisify = (api: any[]): Api => {
	const result: Api = {}
	api.forEach(fn => {
		result[fn.name] = util.promisify(fn)
	})
	return result
}
const asyncApi = promisify([
	childProcess.exec
])

export = {
	...asyncApi,

	runCmd: async (cmd: string | string[]) => {
		if (typeof cmd === 'string') {
			cmd = [cmd]
		}
		cmd = cmd.join(' && ')
		const { stdout } = await asyncApi.exec(cmd)
		return stdout
	},

	// 提示参考 https://github.com/KohPoll/pkg-updater/blob/master/lib/index.js
	noticeUpdate: (current: string, latest: string) => {
		const msg = 'mmp-cli 有更新的版本可以使用: \n' +
			`${colors.dim(current)} -> ${colors.green(latest)}\n` +
			`运行 ${colors.cyan('npm update mmp-cli -g')} 更新.`

		console.log(boxen(msg, {
			padding: 1,
			margin: 1,
			borderColor: 'yellow',
			borderStyle: 'classic'
		}))
	}
}

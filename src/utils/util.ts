const util = require('util')
const childProcess = require('child_process')

interface Api {
	[x: string]: any
}

const promisify = (api: any[]) => {
	const result: Api = {}
	api.forEach(fn => {
		result[fn.name] = util.promisify(fn)
	})
	return result
}

const apiList = [
	childProcess.exec
]

export = {
	...promisify(apiList)
}

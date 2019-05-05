const http = require('https')
const semver = require('semver')
const Ora = require('ora')
// const { getCache, setCache } = require('./utils/cache')
const { runCmd, noticeUpdate } = require('./utils/util')
const spinner = new Ora()

// function setCheckTs(cache: any) {
// 	setCache({ ...cache, lastCheckTs: Date.now() })
// }

export const checkNode = async () => {
	spinner.start('校验 node 版本')
	const result = await runCmd('node -v')
	const ok = semver.gte(result.substring(1), '10.0.0')
	if (!ok) {
		spinner.fail('node 版本必须大于 v10.0.0')
		process.exit(0)
	}
}

export const check = async () => {
	// const cache = await getCache()
	// if (
	// 	cache.lastCheckTs &&
	// 	Date.now() - cache.lastCheckTs <= 60 * 60 * 1000
	// ) {
	// 	// 1 小时只更新一次
	// 	return Promise.resolve()
	// }

	// 检查 Node 版本 v10.0.0
	await checkNode()

	spinner.start('校验 mmp 版本')
	return new Promise((resolve, reject) => {
		http.get('https://registry.npm.taobao.org/mmp-cli/latest', (res: any) => {
			res.setEncoding('utf8')
			if (res.statusCode !== 200) {
				spinner.fail(res.statusMessage)
				process.exit(0)
			}
			spinner.succeed('校验版本完成')

			let rawData = ''
			res.on('data', (chunk: any) => { rawData += chunk })
			res.on('end', async () => {
				try {
					const parsedData = JSON.parse(rawData)
					const localVersion = await runCmd('mmp -V')

					if (semver.lt(localVersion, parsedData.version)) {
						noticeUpdate(localVersion.trim(), parsedData.version)
					}
					// setCheckTs(cache)
					resolve()
				} catch (e) {
					// console.error(e.message)
					reject(e)
				}
			})
		})
	})
}

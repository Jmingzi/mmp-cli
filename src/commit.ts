const semver = require('semver')
const pro = require('./utils/util')

async function commit (branch: string, commitId: string) {
	// 检查 Node 版本 v10.0.0
	// @ts-ignore
	// todo
	const { stdout } = await pro.exec('node -v')
	if (semver.lt(stdout.substring(1), '10.0.0')) {
		// console.log(a, version)
	}
}

commit('1', '2')

// pit: not module. https://www.jianshu.com/p/78268bd9af0a
export = commit

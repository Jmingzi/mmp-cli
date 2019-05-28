const semver = require('semver')
const Ora = require('ora')

const { getCache, setCache } = require('./utils/cache')
const { runCmd, noticeUpdate } = require('./utils/util')
const { get } = require('./utils/http')
const spinner = new Ora()

export const checkNode = async (): Promise<void> => {
  spinner.start('校验 node 版本')
  const result = await runCmd('node -v')
  const ok = semver.gte(result.substring(1), '10.0.0')
  if (!ok) {
    spinner.fail('node 版本必须大于 v10.0.0')
    process.exit(0)
  }
}

export const check = async (): Promise<void> => {
  const cache = getCache()
  if (
  	cache.lastCheckTs &&
  	Date.now() - cache.lastCheckTs <= 60 * 60 * 1000 * 6
  ) {
    // console.log(colors.grey('\n   版本更新校验缓存 6 小时\n'))
  	return Promise.resolve()
  }
  await checkNode()

  spinner.start('校验 mmp 版本')
  const { version } = await get('https://registry.npm.taobao.org/mmp-cli/latest')
  const localVersion = await runCmd('mmp -V')
  if (semver.lt(localVersion, version)) {
    noticeUpdate(localVersion.trim(), version)
  }
  spinner.succeed('校验版本完成')
  setCache({ ...cache, lastCheckTs: Date.now() })
}

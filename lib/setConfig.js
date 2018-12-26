const { getCache, setCache } = require('./utils/cache')
const { getProjectRoot } = require('./utils/util')
const Ora = require('ora')
const spinner = new Ora()

module.exports = async function(branch, cmd_value) {
  const projectName = await getProjectRoot()
  const cache = await getCache()
  const result = cache.script && cache.script[projectName]

  // 校验branch是否存在于本地分支列表
  if (!result || !result.mainBrList || result.mainBrList.every(x => x !== branch)) {
    spinner.fail(`${branch}不存在本项目的主分支列表中`)
    process.exit(0)
  }

  if (!cache.script) {
    cache.script = {}
  }
  if (!cache.script[projectName]) {
    cache.script[projectName] = {}
  }
  cache.script[projectName][branch] = cmd_value
  await setCache(cache)
  spinner.succeed(`设置${branch}=${cmd_value}成功`)
}

const { getCache } = require('./utils/cache')
const { getProjectRoot } = require('./utils/util')

module.exports = async function() {
  const projectName = await getProjectRoot()
  const cache = await getCache()
  const result = cache.script && cache.script[projectName]

  console.log(JSON.stringify(result, null, 4))
}

const path = require('path')
const fs = require('fs')
const Promise = require('bluebird')
const cacheDir = path.resolve(__dirname, '../../cached')
const filePath = `${cacheDir}/cache.json`

Promise.promisifyAll(fs)

async function handleReadFile() {
  try {
    await fs.readFileAsync(filePath, { encoding: 'utf8' })
    return res ? JSON.parse(res) : {}
  } catch (e) {
    await fs.writeFileAsync(filePath, '')
    return {}
  }
}

module.exports = {
  async getCache() {
    try {
      await fs.readdirAsync(cacheDir)
      return handleReadFile()
    } catch(e) {
      await fs.mkdirAsync(cacheDir)
      return handleReadFile()
    }
  },

  // 前提先调用getCache
  setCache(fullObj) {
    return fs.writeFileAsync(filePath, JSON.stringify(fullObj))
  }
}

const path = require('path')
const fs = require('fs')
const Promise = require('bluebird')
const cacheDir = path.resolve(__dirname, '../../cached')
const filePath = `${cacheDir}/cache.json`

Promise.promisifyAll(fs)

function common(cb) {
  return fs.readdirAsync(cacheDir)
    .then(eval(cb))
    .catch(() => {
      return fs.mkdirAsync(cacheDir).then(eval(cb))
    })
}

function handleReadFile() {
  return fs.readFileAsync(filePath, { encoding: 'utf8' })
    .then(res => {
      return res ? JSON.parse(res) : {}
    })
    .catch(() => {
      return fs.writeFileAsync(filePath, '').then(() => {
        return {}
      })
    })
}

module.exports = {
  getCache() {
    return common('handleReadFile')
  },

  // 前提先调用getCache
  setCache(fullObj) {
    return fs.writeFileAsync(filePath, JSON.stringify(fullObj))
  }
}
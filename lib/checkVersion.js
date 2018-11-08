const http = require('https')
const { runCmd } = require('./utils/util')
const boxen = require('boxen')
const colors = require('colors/safe')
const { getCache, setCache } = require('./utils/cache')

// 提示参考 https://github.com/KohPoll/pkg-updater/blob/master/lib/index.js

function noticeUpdate(current, latest) {
  const msg = 'mmp-cli有更新的版本可以使用: \n' +
  `${colors.dim(current)} -> ${colors.green(latest)}\n` +
  `运行 ${colors.cyan('npm update mmp-cli -g')} 更新.`

  console.log(boxen(msg, {
    padding: 1,
    margin: 1,
    borderColor: 'yellow',
    borderStyle: 'classic'
  }))
}

// noticeUpdate('v1.0.0', 'v2.0.0')

function setCheckTs(cache) {
  setCache({ ...cache, lastCheckTs: Date.now() })
}

module.exports = async () => {
  const cache = await getCache()
  if (
      cache.lastCheckTs &&
      Date.now() - cache.lastCheckTs <= 24 * 3600 * 1000
  ) {
    // 24 小时只更新一次
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    http.get('https://registry.npm.taobao.org/mmp-cli/latest', res => {
      res.setEncoding('utf8')
      let rawData = ''
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', async () => {
        try {
          const parsedData = JSON.parse(rawData)
          let localVersion = await runCmd('mmp -V').catch(() => {
            noticeUpdate(`v1.0.0`, `v${parsedData.version}`)
            setCheckTs(cache)
            resolve()
          })
          localVersion = localVersion.toString().trim()
          if (localVersion !== parsedData.version) {
            noticeUpdate(localVersion, parsedData.version)
          }
          setCheckTs(cache)
          resolve()
        } catch (e) {
          console.error(e.message)
          reject(e)
        }
      })
    })
  })
}



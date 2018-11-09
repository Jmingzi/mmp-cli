const http = require('https')
const { runCmd } = require('./utils/util')
const boxen = require('boxen')
const colors = require('colors/safe')
const { getCache, setCache } = require('./utils/cache')
const Ora = require('ora')
const spinner = new Ora()

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

// console.log(compareVersion('2.0.0', '2.0.0'))
// noticeUpdate('2.1.0', '2.0.0')

function setCheckTs(cache) {
  setCache({ ...cache, lastCheckTs: Date.now() })
}

function compareVersion(localVersion, newVersion) {
	if (!localVersion) {
		return false
	}
	localVersion = localVersion.split('.')
	newVersion = newVersion.split('.')

	for (let i = 0; i < localVersion.length; i++) {
		if (parseInt(localVersion[i]) < parseInt(newVersion[i])) {
			return false
		}
	}
	return true
}

module.exports = async () => {
  const cache = await getCache()
  if (
  	cache.lastCheckTs &&
	  Date.now() - cache.lastCheckTs <= 60 * 1000
  ) {
    // 24 小时只更新一次
    return Promise.resolve()
  }
	spinner.start('校验版本')
  return new Promise((resolve, reject) => {
    http.get('https://registry.npm.taobao.org/mmp-cli/latest', res => {
      res.setEncoding('utf8')
	    if (res.statusCode !== 200) {
	    	spinner.fail(res.statusMessage)
		    process.exit(0)
	    }
	    spinner.stop()

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
          if (!compareVersion(localVersion, parsedData.version)) {
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



const fs = require('fs')
const Promise = require('bluebird')
const filePath = `${process.env.HOME}/.mmprc`
Promise.promisifyAll(fs)

module.exports = {
  async getCache() {
    try {
	    const res = await fs.readFileAsync(filePath, { encoding: 'utf8' })
      return res ? JSON.parse(res) : {}
	  } catch (e) {
	    await fs.writeFileAsync(filePath, '')
      return {}
	  }
  },

  // 前提先调用getCache
  setCache(fullObj) {
    return fs.writeFileAsync(filePath, JSON.stringify(fullObj))
  }
}

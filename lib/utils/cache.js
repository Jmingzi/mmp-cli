const fs = require('fs')
const Promise = require('bluebird')
const filePath = `${process.env.HOME}/.mmprc`
Promise.promisifyAll(fs)

function setCache(fullObj) {
	return fs.writeFileAsync(filePath, JSON.stringify(fullObj))
}

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

	setCache,

	async setProjectScript(projectName, messageObj, fullObj) {
  	if (!fullObj.script) {
		  fullObj.script = {
		  	[projectName]: {}
		  }
	  }
		fullObj.script[projectName] = {
			...fullObj.script[projectName],
			...messageObj
		}
  	return setCache(fullObj)
	}
}

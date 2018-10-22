const chalk = require('chalk')

module.exports = {
  print(type = 'white') {
    return msg => {
      console.log(chalk[type](msg))
    }
  }
}
module.exports = branch => {
  // console.log()
  const exec = require('child_process').execSync;
  // const name = exec('git rev-parse --abbrev-ref HEAD').toString().trim()
  const name = exec('git branch').toString().trim()
  // git symbolic-ref --short -q HEAD
  console.log(name)
}
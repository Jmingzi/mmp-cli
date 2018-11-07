exports.GIT_ADD = 'git add .'
exports.GIT_CI = 'git commit -m'

exports.gitCi = (type, msg) => {
  return `${exports.GIT_CI} '${type}: ${msg}'`
}

exports.GIT_ADD = 'git add .'
exports.GIT_CI = 'git commit -m'
exports.GIT_HEAD = 'git rev-parse --abbrev-ref HEAD'
exports.gitCi = (type, msg) => {
  return `${exports.GIT_CI} '${type}: ${msg}'`
}

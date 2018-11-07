exports.GIT_ADD = 'git add .'
exports.GIT_CI = 'git commit -m'
exports.GIT_HEAD = 'git rev-parse --abbrev-ref HEAD'
exports.GIT_PUSH = 'git push'
exports.gitCi = (type, msg, br) => {
  return `${exports.GIT_CI} '${type}: ${br ? `{${br}` : ''}${msg}'`
}

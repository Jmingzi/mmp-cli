exports.GIT_ADD = 'git add .'
exports.GIT_CI = 'git commit -m'
exports.GIT_HEAD = 'git rev-parse --abbrev-ref HEAD'
exports.GIT_PUSH = 'git push'
exports.GIT_BR = 'git branch'
exports.gitCi = (type, msg, br) => {
  return `${exports.GIT_CI} "${type}: ${br ? `(${br.trim()})` : ''}${msg}"`
}
exports.gitCo = name => {
  return `git checkout ${name}`
}
exports.gitCp = id => {
  return `git cherry-pick ${id}`
}

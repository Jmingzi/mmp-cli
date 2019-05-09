exports.GIT_ADD = 'git add .'
exports.GIT_CI = 'git commit -m'
exports.GIT_HEAD = 'git rev-parse --abbrev-ref HEAD'
exports.GIT_PUSH = 'git push'
exports.GIT_BR = 'git branch'
exports.GIT_ST = 'git status'
exports.GIT_LOG = 'git log --oneline -20'
exports.GIT_PULL = 'git pull'
exports.GIT_PULL_REBASE = 'git pull --rebase'
exports.gitCi = (type: string, msg: string, br: string) => {
  return `${exports.GIT_CI} "${type}: ${br ? `(${br.trim()})` : ''}${msg}"`
}
exports.gitCo = (name: string) => {
  return `git checkout ${name}`
}
exports.gitCp = (id: string) => {
  return `git cherry-pick ${id}`
}

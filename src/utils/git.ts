const Ora = require('ora')
const cmdConstant = require('./cmdConstant')
const { runCmd } = require('./util')
const spinner = new Ora()

export const getCommitIdLog = async function (): Promise<string[]> {
  const idStr = await runCmd(cmdConstant.GIT_LOG)
  return idStr.toString().trim().split('\n').map((x: string): string => x.split(' ')[0])
}

export const getBr = async (): Promise<string[]> => {
  const br = await runCmd(cmdConstant.GIT_BR)
  return br.toString().trim().split('\n').map((x: string): string => {
    const xSplit = x.split(' ')
    return xSplit.length ? xSplit[xSplit.length - 1] : x
  })
}

export const hasStaged = async (): Promise<boolean> => {
  const res = await runCmd('git status')
  return /Changes not staged for commit|Changes to be committed/i.test(res)
}

export const getCurrentBr = async (): Promise<string> => {
  let currentBr = await runCmd(cmdConstant.GIT_HEAD)
  return currentBr.toString().trim()
}

export const pull = async (isRebase: boolean = true) => {
  const cmd = isRebase ? cmdConstant.GET_PULL_REBASE : cmdConstant.GIT_PULL
  spinner.start(`拉取远程 ${cmd}`)
  await runCmd(cmd)
  spinner.succeed('拉取成功')
}

export const push = async () => {
  spinner.start('推送到远程')
  await runCmd(cmdConstant.GIT_PUSH).catch((err: Error) => {
    console.log('\n' + err)
    spinner.fail(`推送失败`)
    process.exit(0)
  })
  spinner.succeed('推送成功')
}

export const cherryPickCommit = async (targetBranch: string, commitId: string) => {
  spinner.start(`cherry-pick ${commitId}`)
  try {
    await runCmd(cmdConstant.gitCo(targetBranch))
    await pull()
    await runCmd(cmdConstant.gitCp(commitId))
  } catch (e) {
    console.log('\n' + e)
    spinner.fail(`cherry-pick 失败`)
    process.exit(0)
  }
  spinner.succeed(`cherry-pick 完成`)
}

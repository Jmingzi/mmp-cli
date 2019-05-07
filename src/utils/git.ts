const cmdConstant = require('./cmdConstant')
const { runCmd } = require('./util')

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

export const hasStaged = async () => {
  const res = await runCmd('git status')
  return /Changes not staged for commit|Changes to be committed/i.test(res)
}

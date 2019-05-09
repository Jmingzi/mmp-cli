const Ora = require('ora')
const cmdConstant = require('./cmd-constant')
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
  const cmd = isRebase ? cmdConstant.GIT_PULL_REBASE : cmdConstant.GIT_PULL
  spinner.start(`拉取远程 ${cmd}`)
  const pullRes = await runCmd(cmd).catch((err: Error) => {
    console.log('\n' + err)
    spinner.fail(`拉取失败`)
    process.exit(0)
  })
  spinner.succeed(/up to date/.test(pullRes) ? '远程仓库无更新' : '远程仓库有更新，已拉取到本地')
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

export const cherryPickCommit = async (commitIds: string | string[]) => {
  const innerCheck = async (commitId: string, i: number) => {
    spinner.start(`  cherry-pick [${commitId}]`)
    try {
      await runCmd(cmdConstant.gitCp(commitId))
    } catch (e) {
      let msg = `cherry-pick [${commitId}] 失败. 处理完这条commit，`
      const remainLen = i !== -1 ? commitIds.length - 1 - i : 0
      if (remainLen) {
        msg += `还剩 ${remainLen} 条待处理，执行 mmp cp ${commitIds[i + 1]} ${remainLen > 1 ? commitIds[commitIds.length - 1] : ''} [branch]`
      } else {
        msg += '即完成了全部操作.'
      }

      console.log('\n' + e)
      spinner.fail(msg)
      process.exit(0)
    }
    spinner.succeed(`  cherry-pick ${commitId} 完成`)
  }
  if (Array.isArray(commitIds)) {
    spinner.info(`cherry-pick 共 ${commitIds.length} 条提交`)
    for (let i = 0; i < commitIds.length; i++) {
      await innerCheck(commitIds[i], i)
    }
    spinner.succeed(`cherry-pick 完成`)
  } else {
    await innerCheck(commitIds, -1)
  }
}

export const checkout = async (branch: string) => {
  spinner.start(`切换到 ${branch} 分支`)
  await runCmd(cmdConstant.gitCo(branch))
  spinner.succeed(`切换到 ${branch} 分支成功`)
}

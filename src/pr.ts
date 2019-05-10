// const colors = require('colors/safe')
const { getStageFileList, runCmd } = require('./utils/util')
const cmd = require('./utils/cmd-constant')

const checkProject = async () => {
  // const gitUrl = await runCmd(cmd.GIT_URL)
  // if (!/git\.shinemo\.com/.test(gitUrl)) {
  //   console.log(colors.blue('   git.shinemo.com 的项目才需要 pr'))
  //   return false
  // }
  return true
}

export async function checkPrFileChanges(
  prFilePath?: string[],
  fileList?: string[]
): Promise<boolean> {
  const valid = await checkProject()
  if (!valid) {
    return false
  }

  if (!fileList) {
    fileList = await getStageFileList()
  }

  const regArr = prFilePath || []
  return !!regArr.length && (<string[]>fileList).some((file: string) =>
    regArr.some((reg: string): boolean => new RegExp(reg).test(file)))
}

export async function checkCommitIds(
  commitIds: string | string[],
  prFilePath?: string[]
): Promise<boolean> {
  const valid = await checkProject()
  if (!valid) {
    return false
  }

  commitIds = typeof commitIds === 'string' ? [commitIds] : commitIds
  for (let i = 0; i < commitIds.length; i++) {
    const diff = await runCmd(cmd.diff(commitIds[i]))
    const changeFileList = diff.split('\n').filter((x: string) => /\-\-\-|\+\+\+/.test(x))
    const exist = await checkPrFileChanges(prFilePath, changeFileList)
    if (exist) {
      return true
    }
  }
  return false
}

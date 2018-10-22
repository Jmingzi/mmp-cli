const ciTypeList = [
  { name: 'init, 初始化', value: 'init' },
  { name: 'fix, 修复', value: 'fix' },
  { name: 'feat, 新功能或模块', value: 'feat' },
  { name: 'debug, 调试', value: 'debug' },
  { name: 'build, 构建项目', value: 'build' },
  { name: 'doc, 文档', value: 'doc' }
]

module.exports = {
  mainBr: ['develop', 'master'],
  ciType: {
    type: 'list',
    name: 'ciType',
    message: '请选择提交类型',
    // default: ciTypeList[1],
    choices: ciTypeList
  },
  ciMessage: {
    type: 'input',
    name: 'ciMessage',
    message: '请输入提交信息',
    validate(input) {
      const done = this.async()
      if (!input.toString().trim()) {
        done('提交信息必填')
        return
      }
      done(null, true)
    }
  }
}
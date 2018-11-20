const ciTypeList = [
  { name: 'fix, 修复', value: 'fix' },
  { name: 'debug, 调试', value: 'debug' },
  { name: 'build, 构建项目', value: 'build' },
  { name: 'feat, 新功能或模块', value: 'feat' },
  { name: 'init, 初始化', value: 'init' },
  { name: 'doc, 文档', value: 'doc' }
]

module.exports = {
  mainBr: ['develop', 'master'],
  ciType: {
    type: 'list',
    name: 'ciType',
    message: '请选择提交类型',
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
  },
  scriptDevelop: {
    type: 'input',
    name: 'scriptDevelop',
    message: '请输入develop分支打包命令',
    validate(input) {
      const done = this.async()
      if (!/^[a-zA-Z\s0-9]+$/.test(input.toString())) {
        done('命令输入不正确，请重新输入')
        return
      }
      done(null, true)
    }
  },
  scriptMaster: {
    type: 'input',
    name: 'scriptMaster',
    message: '请输入master分支打包命令',
    validate(input) {
      const done = this.async()
      if (!/^[a-zA-Z\s0-9]+$/.test(input.toString())) {
        done('命令输入不正确，请重新输入')
        return
      }
      done(null, true)
    }
  },
  scriptBranch: {
    type: 'input',
    name: 'scriptBranch',
    message: '请输入主分支名称，空格分隔',
    validate(input) {
      const done = this.async()
      const res = input.split(' ')
      if (res.length < 2) {
        done('主分支至少存在2个')
        return
      } else if (!res.includes('master')) {
        done('必须包含master')
        return
      } else if (!res.includes('develop')) {
        done('必须包含develop')
        return
      }
      done(null, true)
    }
  },
  initRepeat: {
    type: 'confirm',
    name: 'initRepeat',
    message: '配置已存在，是否修改？'
  },
  needBuild: {
    type: 'confirm',
    name: 'needBuild',
    message: '是否需要打包？'
  }
}

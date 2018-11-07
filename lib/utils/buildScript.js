// const { runCmd } = require('./util')
const { spawn } = require('child_process')

process.on('message', async ({ cmd }) => {
  const build = spawn(cmd, { shell: true })
  build.stdout.on('data', (data) => {
    console.log(data.toString())
  })

  build.stderr.on('data', (data) => {
    console.log(data.toString())
  })

  build.on('close', (code) => {
    process.send({ ok: !Boolean(code), msg: code ? '打包失败' : '打包成功', e: { code, cmd } })
  })
})

// process.on('error', (e) => {
//   console.log(e)
//   process.send({ ok: false, msg: '打包失败', e })
// })

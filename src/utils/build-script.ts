const { spawn } = require('child_process')

export interface SpawnResult {
  ok: boolean,
  msg: string,
  e: {
    code: number,
    cmd: string
  }
}

process.on('message', ({ cmd }) => {
  const build = spawn(cmd, { shell: true })
  console.log('\n')
  build.stdout.on('data', (data: string) => {
    console.log(data.toString())
  })

  build.stderr.on('data', (data: string) => {
    console.log(data.toString())
  })

  build.on('close', (code: number) => {
    process.send && process.send({
      ok: !Boolean(code),
      msg: code ? '打包失败' : '打包完成',
      e: { code, cmd }
    } as SpawnResult)
  })
})

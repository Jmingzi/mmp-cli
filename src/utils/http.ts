// Types
import * as http from 'http'
const https = require('https')

export const get = (url: string): Promise<void> => new Promise((resolve, reject) => {
  https.get(url, (res: http.IncomingMessage): void => {
    res.setEncoding('utf8')
    if (res.statusCode !== 200) {
      reject(new Error(res.statusMessage))
    }

    let rawData: string = ''
    res.on('data', (chunk: string) => { rawData += chunk })
    res.on('end', () => { resolve(JSON.parse(rawData)) })
    res.on('error', e => { reject(e) })
  })
})

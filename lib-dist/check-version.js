"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require('https');
const semver = require('semver');
const { runCmd } = require('./utils/util');
const boxen = require('boxen');
const colors = require('colors/safe');
const Ora = require('ora');
const spinner = new Ora();
function noticeUpdate(current, latest) {
    const msg = 'mmp-cli有更新的版本可以使用: \n' +
        `${colors.dim(current)} -> ${colors.green(latest)}\n` +
        `运行 ${colors.cyan('npm update mmp-cli -g')} 更新.`;
    console.log(boxen(msg, {
        padding: 1,
        margin: 1,
        borderColor: 'yellow',
        borderStyle: 'classic'
    }));
}
module.exports = async () => {
    spinner.start('校验版本');
    return new Promise((resolve, reject) => {
        http.get('https://registry.npm.taobao.org/mmp-cli/latest', (res) => {
            res.setEncoding('utf8');
            if (res.statusCode !== 200) {
                spinner.fail(res.statusMessage);
                process.exit(0);
            }
            spinner.succeed('校验版本完成');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', async () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    let localVersion = await runCmd('mmp -V').catch(() => {
                        noticeUpdate(`v1.0.0`, `v${parsedData.version}`);
                        resolve();
                    });
                    localVersion = localVersion.toString().trim();
                    if (semver.lt(localVersion, parsedData.version)) {
                        noticeUpdate(localVersion, parsedData.version);
                    }
                    resolve();
                }
                catch (e) {
                    console.error(e.message);
                    reject(e);
                }
            });
        });
    });
};
exports.checkNode = async () => {
};

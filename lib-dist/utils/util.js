"use strict";
const util = require('util');
const childProcess = require('child_process');
const boxen = require('boxen');
const colors = require('colors/safe');
const promisify = (api) => {
    const result = {};
    api.forEach(fn => {
        result[fn.name] = util.promisify(fn);
    });
    return result;
};
const asyncApi = promisify([
    childProcess.exec
]);
module.exports = {
    ...asyncApi,
    runCmd: async (cmd) => {
        if (typeof cmd === 'string') {
            cmd = [cmd];
        }
        cmd = cmd.join(' && ');
        const { stdout } = await asyncApi.exec(cmd);
        return stdout;
    },
    noticeUpdate: (current, latest) => {
        const msg = 'mmp-cli 有更新的版本可以使用: \n' +
            `${colors.dim(current)} -> ${colors.green(latest)}\n` +
            `运行 ${colors.cyan('npm update mmp-cli -g')} 更新.`;
        console.log(boxen(msg, {
            padding: 1,
            margin: 1,
            borderColor: 'yellow',
            borderStyle: 'classic'
        }));
    }
};

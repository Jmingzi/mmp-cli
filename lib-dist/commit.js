"use strict";
const semver = require('semver');
const pro = require('./utils/util');
async function commit(branch, commitId) {
    const { stdout } = await pro.exec('node -v');
    if (semver.lt(stdout.substring(1), '10.0.0')) {
    }
}
commit('1', '2');
module.exports = commit;

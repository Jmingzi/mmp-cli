"use strict";
const util = require('util');
const childProcess = require('child_process');
const promisify = (api) => {
    const result = {};
    api.forEach(fn => {
        result[fn.name] = util.promisify(fn);
    });
    return result;
};
const apiList = [
    childProcess.exec
];
module.exports = {
    ...promisify(apiList)
};

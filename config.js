/*
 * config.js
 * =========
 * Helper for loading the configuration
 */

var fs = require("fs");

module.exports = function () {
    return JSON.parse(fs.readFileSync("config.json"));
};

/*
 * config.js
 * =========
 * Helper for loading the configuration
 */

var fs = require("fs"),
    path = require("path");

module.exports = function () {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")));
};

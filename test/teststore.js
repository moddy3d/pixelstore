var fs = require("fs");
var Store = require("../db/store.js");

function random() {
    var id = "";
    var characters = "0123456789";

    for (var i = 0; i < 5; i++)
        id += characters.charAt(Math.floor(Math.random() * characters.length));

    return id;
}

module.exports = {

    setUp: function (callback) {
        var config = JSON.parse(fs.readFileSync("../config.json"));
        this.store = new Store(config.cassandra);
        this.keyspace = config.cassandra.keyspace + "_" + random();

        this.store.setup(this.keyspace, function () {
            callback();
        });
    },

    tearDown: function (callback) {
        var this_ = this;
        this.store.shutdown();
        callback();
    },

    testRemoveImage: function (test) {
        test.ok(true, "true");
        test.done();
    },

    testGetImageByTag: function (test) {
        test.ok(true, "true");
        test.done();
    },

    testGetImagesByTag: function (test) {
        test.ok(true, "true");
        test.done();
    },

    testAddTags: function (test) {
        test.ok("yes");
        test.done();
    },

    testRemoveTags: function (test) {
        test.ok("yes");
        test.done();
    },

    testRemoveTags: function (test) {
        test.ok("yes");
        test.done();
    },
};


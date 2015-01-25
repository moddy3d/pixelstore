/*
 * teststore.js
 *
 * This testing module which purely tests the database transaction
 * integrity of the Store class. These are fairly simple and lower level tests.
 */

var fs = require("fs"),
    uuid = require("node-uuid"),
    async = require("async");

var utils = require("./utils.js");
var Store = require("../db/store.js");

module.exports = {

    setUp: function (callback) {
        var config = JSON.parse(fs.readFileSync(__dirname + "/../config.json"));
        this.store = new Store(config.cassandra);
        this.keyspace = config.cassandra.keyspace + "_" + utils.random();
        
        console.log("Setting up keyspace " + this.keyspace);
        this.store.setup(this.keyspace, function () {
            callback();
        });
    },

    tearDown: function (callback) {
        this.store.shutdown();
        callback();
    },
    
    testAddImage: function (test) {
            
        var this_ = this,
            id = 'image_id',
            user = "foo",
            tags = ["tag1", "tag2"],
            type = "image/jpeg";
    
        try  {
            var data = fs.readFileSync(__dirname + "/image.jpg");
        } catch (e) {
            console.log(e.message);
            throw Error(e);
        }

        console.log("creating image with id " + id);

        async.waterfall([

            function (done) {
                this_.store.addImage(id, user, tags, data, type, done);
            },
            
            function (done) {
                this_.store.getImage(id, done);
            },

            function (image, done) {
                test.equals(image.id, id);
                test.equals(image.user, user);
                test.ok(utils.compareArrays(image.tags, tags));
                test.equals(image.type, type);
                test.equals(image.data.toString(), data.toString());
                done();
            }
        ], function (error, results) {
            if (error) return console.error(error);
            test.done();
        });
    }

    /*
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
    */
};


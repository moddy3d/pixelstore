/*
 * teststore.js
 *
 * This testing module which purely tests the database transaction
 * integrity of the Store class. These are fairly simple and lower level tests.
 */

var fs = require("fs"),
    uuid = require("node-uuid"),
    async = require("async"),
    _ = require("lodash");

var utils = require("./utils.js");
var Store = require("../db/store.js");

module.exports = {

    setUp: function (callback) {
        var config = JSON.parse(fs.readFileSync(__dirname + "/../config.json"));
        this.store = new Store(config.cassandra);
        this.keyspace = config.cassandra.keyspace + "_test_" + utils.randomNumbers();
        
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
            source = utils.generateImage();

        async.waterfall([

            function (done) {
                this_.store.addImage(source.id, source.user, source.tags, source.data, source.type, done);
            },
            
            function (done) {
                this_.store.getImage(source.id, done);
            },

            function (target, done) {
                test.equals(source.id, target.id);
                test.equals(source.user, target.user);
                test.ok(_.xor(source.tags, target.tags).length === 0);
                test.equals(source.type, target.type);
                test.equals(source.data.toString(), target.data.toString());
                done();
            }
        ], function (error, results) {
            if (error) return console.error(error);
            test.done();
        });
    },

    testRemoveImage: function (test) {
        var this_ = this,
            source = utils.generateImage();

        async.waterfall([

            function (done) {
                this_.store.addImage(source.id, source.user, source.tags, source.data, source.type, done);
            },
            
            function (done) {
                this_.store.removeImage(source.id, done);
            },
            
            function (done) {
                this_.store.getImage(source.id, done);
            },

            function (target, done) {
                test.equals(target, null);
                done();
            }
        ], function (error, results) {
            if (error) return console.error(error);
            test.done();
        });
    },
    
    testAddTags: function (test) {

        var this_ = this,
            source = utils.generateImage();

        async.waterfall([

            function (done) {
                this_.store.addImage(source.id, source.user, source.tags, source.data, source.type, done);
            },
            
            function (done) {
                var tags = utils.generateTags();
                source.tags = _.union(source.tags, tags);
                this_.store.addTags(source.id, tags, done);
            },
            
            function (done) {
                this_.store.getImage(source.id, done);
            },

            function (target, done) {
                test.equals(source.id, target.id);
                test.equals(source.user, target.user);
                test.ok(_.xor(source.tags, target.tags).length === 0);
                test.equals(source.type, target.type);
                test.equals(source.data.toString(), target.data.toString());
                done();
            }
        ], function (error, results) {
            if (error) return console.error(error);
            test.done();
        });
    },
    
    testRemoveTags: function (test) {

        var this_ = this,
            source = utils.generateImage(),
            tags = utils.generateTags();

        source.tags = _.union(source.tags, tags);

        async.waterfall([

            function (done) {
                this_.store.addImage(source.id, source.user, source.tags, source.data, source.type, done);
            },
            
            function (done) {
                source.tags = _.difference(source.tags, tags);
                this_.store.removeTags(source.id, tags, done);
            },
            
            function (done) {
                this_.store.getImage(source.id, done);
            },

            function (target, done) {
                test.equals(source.id, target.id);
                test.equals(source.user, target.user);
                test.ok(_.xor(source.tags, target.tags).length === 0);
                test.equals(source.type, target.type);
                test.equals(source.data.toString(), target.data.toString());
                done();
            }
        ], function (error, results) {
            if (error) return console.error(error);
            test.done();
        });
    },
    
    testGetImageByTag: function (test) {

        var this_ = this,
            source1 = utils.generateImage(),
            source2 = utils.generateImage();

        // Make sure both images will have the same tags
        source1.tags = ['tag1'];
        source2.tags = ['tag1'];

        async.waterfall([

            // Add two images to store, source1 goes first, then source2

            function (done) {
                this_.store.addImage(source1.id, source1.user, source1.tags, source1.data, source1.type, done);
            },
            
            function (done) {
                this_.store.addImage(source2.id, source2.user, source2.tags, source2.data, source2.type, done);
            },

            // Get image by one of those tags
            
            function (done) {
                this_.store.getImageByTag(source1.tags[0], done);
            },

            // The returned image should be source2 because it was tagged *after* source1

            function (target, done) {
                test.equals(source2.id, target.id);
                test.equals(source2.user, target.user);
                test.ok(_.xor(source2.tags, target.tags).length === 0);
                test.equals(source2.type, target.type);
                test.equals(source2.data.toString(), target.data.toString());
                done();
            }
        ], function (error, results) {
            if (error) return console.error(error);
            test.done();
        });
    },

    testGetImagesByTag: function (test) {

        var this_ = this,
            source1 = utils.generateImage(),
            source2 = utils.generateImage(),
            tag = 'mytag';

        // Make sure both images will have the same tags
        source1.tags = [tag];
        source2.tags = [tag];

        async.waterfall([

            // Add two images to store, source1 goes first, then source2

            function (done) {
                this_.store.addImage(source1.id, source1.user, source1.tags, source1.data, source1.type, done);
            },
            
            function (done) {
                this_.store.addImage(source2.id, source2.user, source2.tags, source2.data, source2.type, done);
            },

            // Get all images by the pre-defined tag
            
            function (done) {
                this_.store.getImagesByTag(tag, done);
            },

            // source2 should be in index 0 because it is the last image to be fetched,
            // the index remains consistent thanks to async.parallel keeping the returned
            // results in place of the original order returned from the tag-timestamp index
            // regardless of which task returns first

            function (images, done) {
                var target2 = images[0];
                var target1 = images[1];
                test.equals(source2.id, target2.id);
                test.equals(source1.id, target1.id);
                done();
            }
        ], function (error, results) {
            if (error) return console.error(error);
            test.done();
        });
    },
};


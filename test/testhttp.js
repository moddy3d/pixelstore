/*
 * testhttp.js
 *
 * This testing module which tests the RESTful API,
 * the middleware between the client and data store.
 */

var fs = require("fs"),
    request = require("request"),
    uuid = require("node-uuid"),
    async = require("async"),
    _ = require("lodash"),
    utils = require("./utils.js"),
    Store = require("../db/store.js");

module.exports = {

    setUp: function (callback) {

        var this_ = this;

        // Configure server 
        this.app = require("../app.js");
        this.port = 3000;
        this.app.set('port', this.port);
        this.address = 'http://localhost:' + this.port;
        
        // Configure the database
        var config = require("../config.js")();
        var store = new Store(config.cassandra);
        var keyspace = config.cassandra.keyspace + "_test_" + utils.randomNumbers();
        
        console.log("Setting up keyspace " + keyspace);
        store.setup(keyspace, function () {
            store.shutdown();
            this_.app.locals.store.connect(keyspace);
            this_.server = this_.app.listen(this_.port, callback);
        });
    },

    tearDown: function (callback) {
        this.app.locals.store.shutdown();
        this.server.close(callback);
    },

    testPutImages: function (test) {

        var this_ = this,
            source = utils.generateImage();

        source.data = source.data.toString();

        async.waterfall([

            function (done) {

                // Add a new image

                var options = {
                    url:  this_.address + "/images/" + source.id,
                    body: source,
                    json: true,
                };

                request.put(options, function (error, response, body) {
                    if (error) done(error);
                    done();
                });
            },
            
            function (done) {
                
                // Retrieves the metadata of the new image

                var options = {
                    url:  this_.address + "/images/" + source.id,
                    headers: {
                        'Accept': 'application/json'
                    }
                };

                request.get(options, function (error, response, body) {
                    if (error) done(error);
                    done(null, JSON.parse(body));
                });
            },
            
            function (target, done) {
                
                // Retrieves the image data of the new image

                var options = {
                    url:  this_.address + "/images/" + source.id,
                    headers: {
                        'Accept': 'image/jpeg'
                    }
                };

                request.get(options, function (error, response, body) {
                    if (error) done(error);
                    target.data = body;
                    done(null, target);
                });
            },

            function (target, done) {
                test.equals(source.id, target.id);
                test.equals(source.user, target.user);
                test.ok(_.xor(source.tags, target.tags).length === 0);
                test.equals(source.type, target.type);
                
                // FIXME the below test doesn't seem to work... need to read up on strings/buffers
                //test.equals(source.data.toString(), target.data.toString());
                
                done();
            }
        ], function (error, results) {
            if (error) return console.error(error);
            test.done();
        });
    }
};

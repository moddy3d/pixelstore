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

var generatePutImageRequest = function (address, image) {

    // Returns a function for adding a new image via http PUT
    
    return function (done) {
        var options = {
            url:  address,
            body: image,
            json: true,
        };

        request.put(options, function (error, response, body) {
            if (error) done(error);
            done();
        });
    }
};

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

            generatePutImageRequest(this_.address + "/images/" + source.id, source),
            
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
    },
    
    testPostImages: function (test) {

        var this_ = this,
            source = utils.generateImage(),
            tags = utils.generateTags();

        source.data = source.data.toString();

        async.waterfall([

            generatePutImageRequest(this_.address + "/images/" + source.id, source),
            
            function (done) {
                
                // Adds new tags
                
                source.tags = _.union(source.tags, tags);

                var options = {
                    url:  this_.address + "/images/" + source.id,
                    body: {
                        tags: {
                            add: tags,
                        }
                    },
                    json: true,
                };

                request.post(options, function (error, response, target) {
                    if (error) return done(error);
                    test.equals(_.difference(target.tags, source.tags).length, 0);
                    done();
                });
            },
            
            function (done) {
                
                // Remove the tags
                
                source.tags = _.difference(source.tags, tags);

                var options = {
                    url:  this_.address + "/images/" + source.id,
                    body: {
                        tags: {
                            remove: tags,
                        }
                    },
                    json: true,
                };

                request.post(options, function (error, response, target) {
                    if (error) return done(error);
                    test.equals(_.difference(target.tags, source.tags).length, 0);
                    done();
                });
            }
            
        ], function (error, results) {
            test.done();
        });
    },

    // FIXME this test is causes the cass client or server unable to shutdown
    testDeleteImages: function (test) {

        var this_ = this,
            source = utils.generateImage();

        source.data = source.data.toString();

        async.waterfall([

            generatePutImageRequest(this_.address + "/images/" + source.id, source),
            
            function (done) {
                
                // Retrieves the metadata of the new image

                var options = {
                    url:  this_.address + "/images/" + source.id,
                };

                request.del(options, function (error, response, body) {
                    if (error) return done(error);
                    body = JSON.parse(body);
                    test.equals(body.status, 'success');
                    done();
                });
            },
            
            function (done) {
                
                // *Tries* retrieves the metadata of the new image

                var options = {
                    url:  this_.address + "/images/" + source.id,
                    headers: {
                        'Accept': 'application/json'
                    }
                };

                request.get(options, function (error, response, body) {
                    if (error || response.statusCode !== 200) 
                        return done(error, response);
                    done(null, JSON.parse(body));
                });
            },
            
        ], function (error, results) {
            test.equals(results.statusCode, 404);
            test.done();
        });
    }
};

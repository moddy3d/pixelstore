var fs = require("fs");
var uuid = require("node-uuid");
var Store = require("../db/store.js");

function random() {
    var id = "";
    var characters = "0123456789";

    for (var i = 0; i < 5; i++)
        id += characters.charAt(Math.floor(Math.random() * characters.length));

    return id;
}

function compareArrays(arrayA, arrayB) {

    function is(a, b) {
        return a === b && (a !== 0 || 1 / a === 1 / b)
               || a !== a && b !== b; 
    }

    if (arrayA.length == arrayB.length && arrayA.every(function(u, i) {
            return is(u, arrayB[i]);
        })
    ) {
        return true;
    } else {
        return false;
    }
}

module.exports = {

    setUp: function (callback) {
        var config = JSON.parse(fs.readFileSync(__dirname + "/../config.json"));
        this.store = new Store(config.cassandra);
        this.keyspace = config.cassandra.keyspace + "_" + random();
        
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

        this.store.addImage(id, user, tags, data, type, getImage);

        function getImage() {
            setTimeout( function () {
                this_.store.getImage(id, verifyImage);
            }, 1000);
        }

        function verifyImage( image ) {
            test.equals(image.id, id);
            test.equals(image.user, user);
            test.ok(compareArrays(image.tags, tags));
            test.equals(image.type, type);
            test.equals(image.data.toString(), data.toString());
            test.done();
        };
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


/*
 * store.js
 * ========
 * This is the store module, interfacing cassandra's client
 */

var cassandra = require("cassandra-driver");
var async = require("async");

var Store = function ( options ) {

    this.contactPoints = options.contactPoints;
    this.client = new cassandra.Client({contactPoints: this.contactPoints});

};

Store.prototype.connect = function ( keyspace ) {

    /* Connect Store to a particular keyspace */

    this.keyspace = keyspace;
    this.client.keyspace = this.keyspace;

};

Store.prototype.shutdown = function () {

    /* Shutdown the store */

    this.client.shutdown();

};

Store.prototype.setup = function ( keyspace, callback ) {
    
    /* Setup the store */

    var this_ = this;

    async.waterfall([

        // Create the keyspace 

        function (done) { 

            var query = "CREATE KEYSPACE " + keyspace +
                        "    WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 }";

            this_.client.execute(query, [], {prepare: true}, function (err) {
                if (err) return done(err);
                this_.connect(keyspace);
                done();
            });
        },

        // Create images table

        function (done) {

            var query = "CREATE TABLE IMAGES (" +
                        "    ID VARCHAR PRIMARY KEY," +
                        "    USER VARCHAR," +
                        "    CREATED TIMESTAMP," +
                        "    TAGS SET<VARCHAR>," +
                        "    DATA BLOB," +
                        "    TYPE VARCHAR," +
                        ");";

            this_.client.execute(query, [], {prepare: true}, function (err) {
                if (err) return done(err);
                done();
            });
        },
        
        // Create tag index
        
        function (done) {
            
            var query = "CREATE TABLE TAG_IMAGE_INDEX (" +
                        "    TAG VARCHAR," +
                        "    TIMESTAMP TIMEUUID," +
                        "    IMAGE VARCHAR," +
                        "    PRIMARY KEY (TAG, TIMESTAMP)" +
                        ")" +
                        "WITH CLUSTERING ORDER BY (TIMESTAMP DESC);";

            this_.client.execute(query, [], {prepare: true}, function (err) {
                if (err) return done(err);
                done();
            });
        }
    ], function (error, results) {
        if (error) return console.error(error);
        if (callback) callback();
    });
};
    
Store.prototype.destroy = function ( keyspace, callback ) {

    /* Destroy the store */

    var destroy = "DROP KEYSPACE " + keyspace + ";";
    
    this.client.execute(destroy, [], {prepare: true}, function (err) {
        if (err) 
            console.log(err);

        if (callback)
            callback();
    });
};

Store.prototype.addImage = function ( id, user, tags, data, type, callback ) {
    
    /* Add a new image to the database */
    
    var query = "INSERT INTO IMAGES (id, user, created, tags, data, type) " +
                "VALUES (?, ?, ?, ?, ?, ?);";
    var parameters = [id, user, new Date(), tags, data, type];

    this.client.execute(query, parameters, {prepare: true}, function (err) {
        if (err) return callback(err); 
        callback();
    });
};

Store.prototype.removeImage = function ( id, callback ) {
    
    /* Remove an image from the database by id */

    var query = "DELETE FROM IMAGES WHERE id = ?;";
    var parameters = [id];

    this.client.execute(query, parameters, {prepare: true}, function (err) {
        if (err) return callback(err); 
        callback();
    });
};

Store.prototype.addTags = function ( id, tags, callback ) {
    
    /* Add tags to an image */

};

Store.prototype.removeTags = function ( id, tags, callback ) {
    
    /* Remove tags from an image */

};

Store.prototype.getImage = function ( id, callback ) {
    
    /* Retreives an image by id */
    
    var query = "SELECT * FROM IMAGES WHERE id = ? LIMIT 1;";
    var parameters = [id];
    var image = null;

    this.client.eachRow(query, parameters, function (i, row) {
        image = row;
    }, function (err) {
        if (err) return callback(err); 
        callback(null, image);
    });
};

Store.prototype.getImageByTag = function ( tag, callback ) {
    
    /* Retreives the latest image tagged by 'tag' */

};

Store.prototype.getImagesByTag = function ( tag, callback ) {

    /* Retrieves all images by specified tag */

};

module.exports = Store;

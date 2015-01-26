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
        
        // Create tag-timestamp image index
        
        function (done) {
            
            var query = "CREATE TABLE TAG_TIMESTAMP_IMAGE_INDEX (" +
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
        },

        // Create image-tag timestamp index
        
        function (done) {
            
            var query = "CREATE TABLE IMAGE_TAG_TIMESTAMP_INDEX (" +
                        "    IMAGE VARCHAR," +
                        "    TAG VARCHAR," +
                        "    TIMESTAMP TIMEUUID," +
                        "    PRIMARY KEY (IMAGE, TAG)" +
                        ");";

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

    var this_ = this;
    
    async.waterfall([

        // Create the keyspace 

        function (done) { 

            var query = "INSERT INTO IMAGES (id, user, created, tags, data, type) " +
                        "VALUES (?, ?, ?, {}, ?, ?);";
            var parameters = [id, user, new Date(), data, type];

            this_.client.execute(query, parameters, {prepare: true}, function (err) {
                if (err) return done(err); 
                done();
            });
        },

        function (done) {
            this_.addTags( id, tags, done );
        }
    ], function (error, results) {
        if (error) return callback(error);
        callback();
    });

};

Store.prototype.removeImage = function ( id, callback ) {
    
    /* Remove an image from the database by id */
    
    var this_ = this;

    async.waterfall([

        // Select tags, 
        
        function (done) {
       
            var query = "SELECT TAGS FROM IMAGES WHERE id = ? LIMIT 1;";
            var parameters = [id];
            var tags = null;

            this_.client.eachRow(query, parameters, function (i, row) {
                tags = row.tags;
            }, function (err) {
                if (err) return done(err); 
                done(null, tags);
            });

        },

        // .. and delete from indices first
        
         function (tags, done) {
            this_.removeTags(id, tags, done);
         },

        // finally, delete from images table

        function (done) {

            var query = "DELETE FROM IMAGES WHERE id = ?;";
            var parameters = [id];

            this_.client.execute(query, parameters, {prepare: true}, function (err) {
                if (err) return done(err); 
                done();
            });
        },

    ], function (error, results) {
        if (error) return callback(error);
        callback();
    });
};

Store.prototype.addTags = function ( id, tags, callback ) {
    
    /* Add tags to an image */

    var queries = [
        {
            query: "UPDATE IMAGES SET tags = tags + ? WHERE id = ?;",
            params: [tags, id]
        }
    ];

    tags.forEach( function (tag) {

        queries.push({
            query: "INSERT INTO TAG_TIMESTAMP_IMAGE_INDEX (tag, \"timestamp\", image) " +
                   "VALUES (?, now(), ?);",
            params: [tag, id]
        });
        
        queries.push({
            query: "INSERT INTO IMAGE_TAG_TIMESTAMP_INDEX (image, tag, \"timestamp\") " +
                   "VALUES (?, ?, now());",
            params: [id, tag]
        });

    });
    
    var options = { consistency: cassandra.types.consistencies.quorum };

    this.client.batch(queries, options, function (error) {
        if (error) return callback(error);
        callback();
    });

};

Store.prototype.removeTags = function ( id, tags, callback ) {
    
    /* Remove tags from an image */

    var this_ = this;

    async.waterfall([

        // Find the tag-timestamp entries from the reverse index

        function (done) {
            var query = "SELECT TAG, TIMESTAMP FROM IMAGE_TAG_TIMESTAMP_INDEX WHERE image = ? AND tag IN ?;";
            var parameters = [id, tags];
            var rows = [];

            this_.client.eachRow(query, parameters, function (i, row) {
                rows.push(row);
            }, function (err) {
                if (err) return callback(err); 
                done(null, rows); 
            });
        },

        // Delete from tag-timestamp index, and from images table
        
        function (rows, done) {
            
            var queries = [];

            rows.forEach( function (row) {

                queries.push({
                    query: "DELETE FROM TAG_TIMESTAMP_IMAGE_INDEX WHERE tag = ? AND timestamp = ?;",
                    params: [row.tag, row.timestamp]
                });

                console.log(row.tag + ": " + row.timestamp);

                queries.push({
                    query: "DELETE FROM IMAGE_TAG_TIMESTAMP_INDEX WHERE image = ? AND tag = ?;",
                    params: [id, row.tag]
                });

            });

            queries.push({
                query: "UPDATE IMAGES SET tags = tags - ? WHERE id = ?;",
                params: [tags, id]
            });

            var options = { consistency: cassandra.types.consistencies.quorum };

            this_.client.batch(queries, options, function (error) {
                if (error) return callback(error);
                done();
            });
        },

    ], function (error, results) {
        if (error) return callback(error);
        callback();
    });

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

/*
 * store.js
 * ========
 * This is the store module, interfacing cassandra's client
 */

var cassandra = require("cassandra-driver");

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

    var create = "CREATE KEYSPACE " + keyspace +
                 "    WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 }";
    
    this.client.execute(create, [], {prepare: true}, function (err) {
        if (err) {
            // Error creating the keyspace, let's shutdown the client
            console.log(err);
            this_.client.shutdown();
        } else {
            console.log("Keyspace " + keyspace + " created.");

            // The keyspace has been successfully created, let's connect to it 
            this_.connect(keyspace);

            // ... and begin creating the tables
            createImagesTable();
        }
        
        // Create Tables
        
        function createImagesTable() {
            var table = "CREATE TABLE IMAGES (" +
                        "    ID VARCHAR PRIMARY KEY," +
                        "    USER VARCHAR," +
                        "    CREATED TIMESTAMP," +
                        "    TAGS SET<VARCHAR>," +
                        "    DATA BLOB," +
                        "    TYPE VARCHAR," +
                        ");";

            this_.client.execute(table, [], {prepare: true}, function (err) {

                if (err) {
                    console.log(err);
                } else {
                    console.log("Created IMAGES table.");
                    createTagImageIndexTable();
                }
            });
        };

        function createTagImageIndexTable () {
            
            var table = "CREATE TABLE TAG_IMAGE_INDEX (" +
                        "    TAG VARCHAR," +
                        "    TIMESTAMP TIMEUUID," +
                        "    IMAGE VARCHAR," +
                        "    PRIMARY KEY (TAG, TIMESTAMP)" +
                        ")" +
                        "WITH CLUSTERING ORDER BY (TIMESTAMP DESC);";

            this_.client.execute(table, [], {prepare: true}, function (err) {

                if (err)
                    console.log(err);
                else
                    console.log("Created TAG_IMAGE_INDEX table.");

                if (callback)
                    callback();
            });
        };
    });
};
    
Store.prototype.destroy = function ( keyspace, callback ) {

    /* Destroy the store */

    var destroy = "DROP KEYSPACE " + keyspace + ";";
    
    this.client.execute(destroy, [], {prepare: true}, function (err) {
        if (err) 
            console.log(err);
        else
            console.log("Keyspace " + config.cassandra.keyspace + " destroyed...");

        if (callback)
            callback();
    });
};

Store.prototype.addImage = function ( id, user, tags, data, type ) {
    
    /* Add a new image to the database */

};

Store.prototype.removeImage = function ( id, user, tags, data, type ) {
    
    /* Remove an image from the database */

};

Store.prototype.addTags = function ( id, tags ) {
    
    /* Add tags to an image */

};

Store.prototype.removeTags = function ( id, tags ) {
    
    /* Remove tags from an image */

};

Store.prototype.getImage = function ( id ) {
    
    /* Retreives an image by id */

};

Store.prototype.getImageByTag = function ( tag ) {
    
    /* Retreives the latest image tagged by 'tag' */

};

Store.prototype.getImagesByTag = function ( tag ) {

    /* Retrieves all images by specified tag */

};

module.exports = Store;

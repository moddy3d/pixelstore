/*
 * setup.js
 * ========
 * This is a setup script to create the keyspace for our
 * store and to set-up the tables.
 */

var cassandra = require("cassandra-driver");
var fs = require("fs");

console.log("\n===================")
console.log("Store Set-up Script")
console.log("===================\n")

// create or destroy
var command = process.argv[2];

// Load configuration file
var data = fs.readFileSync("../config.json");
var config = JSON.parse(data);

console.log("keyspace: " + config.cassandra.keyspace);
console.log("contactPoints: " + config.cassandra.contactPoints.join(", ") + "\n");

var client = new cassandra.Client({contactPoints: config.cassandra.contactPoints});

if (command === 'create') {    

    console.log("Creating keyspace...");

    var create = "CREATE KEYSPACE " + config.cassandra.keyspace + " " +
                 "    WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 1 }";
    console.log("Executing: \n" + create + "\n");
    
    client.execute(create, [], {prepare: true}, function (err) {
        if (err) {
            console.log(err);
            client.shutdown();
        } else {
            console.log("Keyspace " + config.cassandra.keyspace + " created...");
            client.keyspace = config.cassandra.keyspace;
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

            console.log("Executing: \n" + table + "\n");

            client.execute(table, [], {prepare: true}, function (err) {

                if (err) {
                    console.log(err);
                    client.shutdown();
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
            
            console.log("Executing: \n" + table + "\n");

            client.execute(table, [], {prepare: true}, function (err) {

                if (err)
                    console.log(err);
                else
                    console.log("Created TAG_IMAGE_INDEX table.");

                client.shutdown();
            });
        };
    });

} else if (command === 'destroy') {

    console.log("Destroying keyspace...");

    var destroy = "DROP KEYSPACE " + config.cassandra.keyspace + ";";
    console.log("Executing: \n" + destroy + "\n");
    
    client.execute(destroy, [], {prepare: true}, function (err) {
        if (err) 
            console.log(err);
        else
            console.log("Keyspace " + config.cassandra.keyspace + " destroyed...");
        client.shutdown();
    });

} else {
    console.log("Unknown command '" + command + "'.\aAvailable commands: 'create', 'destroy'");
}

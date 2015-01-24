/*
 * access.js
 * ========
 * This is the database access module, which provides functionality
 * to add, modify, or manipulate the data in Cassandra.
 */

var cassandra = require("cassandra-driver");

var Access = function ( config ) {

    this.keyspace = config.cassandra.keyspace;
    this.contactPoints = config.cassandra.contactPoints;

    this.client = new cassandra.Client({contactPoints: this.contactPoints, keyspace: this.keyspace});
};

Access.prototype.addImage = function ( id, user, tags, data, type ) {
    
    /* Add a new image to the database */

};

Access.prototype.removeImage = function ( id, user, tags, data, type ) {
    
    /* Remove an image from the database */

};

Access.prototype.addTags = function ( id, tags ) {
    
    /* Add tags to an image */

};

Access.prototype.removeTags = function ( id, tags ) {
    
    /* Remove tags from an image */

};

Access.prototype.getImage = function ( id ) {
    
    /* Retreives an image by id */

};

Access.prototype.getImageByTag = function ( tag ) {
    
    /* Retreives the latest image tagged by 'tag' */

};

Access.prototype.getImagesByTag = function ( tag ) {

    /* Retrieves all images by specified tag */

};

module.exports = Access;

/*
 * utils.js
 *
 * Testing Utility Functions
 */

var fs = require("fs");

function random (characters, count) {
    count = count || 5;
    var id = "";
    for (var i = 0; i < count; i++)
        id += characters.charAt(Math.floor(Math.random() * characters.length));
    return id;
};

exports.randomNumbers = function (count) {
    return random("0123456789", count);
}

exports.randomCharacters = function (count) {
    return random("abcdefghijklmnopqrstuvwxyz", count);
}

exports.generateImage = function () {
    
    /* Generate some image data for testing */

    var image = {
        id: 'image_id',
        user: "foo",
        tags: ["tag1", "tag2"],
        type: "image/jpeg"
    }

    try  {
        image.data = fs.readFileSync(__dirname + "/image.jpg");
    } catch (e) {
        console.log(e.message);
        throw Error(e);
    }
    
    return image;
};

exports.generateTags = function () {

    /* Generate some tags for testing */

    return ['tag3', 'tag4'];
};

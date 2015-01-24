/*
 * utils.js
 *
 * Testing Utility Functions
 */


exports.random = function () {
    var id = "";
    var characters = "0123456789";

    for (var i = 0; i < 5; i++)
        id += characters.charAt(Math.floor(Math.random() * characters.length));

    return id;
}

exports.compareArrays = function (arrayA, arrayB ) {

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

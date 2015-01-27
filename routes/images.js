var express = require('express');
var async = require('async');
var router = express.Router();

/* GET images */
router.get(/\/(.*)/, function(req, res, next) {
    var id = req.params[0];
    async.waterfall([
        function (done) {
            var image = res.locals.store.getImage(id, done);
        },
    ], function (error, image) {
        if (error || !image) return next();
        res.set('Content-Type', image.type);
        res.send(image.data);
    });
});

module.exports = router;

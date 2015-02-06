var express = require('express');
var async = require('async');
var router = express.Router();


router.route('/:image_id')

    /* POST image by id 
     * Pushes a new image to the store
     */

    .post(function (req, res, next) {
        var id = req.params.image_id;
        var image = req.body;
        image.data = new Buffer(image.data);
        res.locals.store.addImage(id, image.user, image.tags, 
                                  image.data, image.type, function (error, results) {
            if (error) return next();
            res.end();
        });
    })

    /* GET image by id */

    .get(function(req, res, next) {
        var id = req.params.image_id;

        res.locals.store.getImage(id, function (error, image) {
            if (error || !image) return next();

            if (req.headers.accept == 'application/json') {
                delete image.data;
                res.json(image);
            } else {
                res.set('Content-Type', image.type);
                res.send(image.data);
            }
        });
    });

module.exports = router;

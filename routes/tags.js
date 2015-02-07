var express = require('express');
var async = require('async');
var router = express.Router();

router.route('/:tag')

    /* GET image by tag */

    .get(function(req, res, next) {
        var tag = req.params.tag;

        // TODO Allow selective column retrieval for optimization
        res.locals.store.getImageByTag(tag, function (error, image) {
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

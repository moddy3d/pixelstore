var express = require('express');
var async = require('async');
var router = express.Router();


router.route('/:image_id')

    /* PUT image by id 
     * Pushes a new image to the store
     */

    .put(function (req, res, next) {
        var id = req.params.image_id;
        var image = req.body;

        // TODO Maybe a validation step here?
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

        // TODO Allow selective column retrieval for optimization
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
    })
    
    /* POST (update) image by id */

    .post(function(req, res, next) {

        var id = req.params.image_id;
        var actions = [];

        if (req.body.tags) {

            // Add tags action
            if (req.body.tags.add) {
                actions.push( function (done) {
                    res.locals.store.addTags(id, req.body.tags.add, done);
                });
            }

            // Remove tags action
            if (req.body.tags.remove) {
                actions.push( function (done) {
                    res.locals.store.removeTags(id, req.body.tags.remove, done);
                });
            }
        }

        // We would like to return the users the metadata of the 
        // image after the update 
        actions.push( function (done) {
            res.locals.store.getImage(id, done);
        });

        async.waterfall(actions, function (error, image) {
            if (error || !image) return next();
            delete image.data;
            res.json(image);
        });
    })
    
    /* DELETE image by id */
    
    .delete(function(req, res, next) {
        var id = req.params.image_id;
        res.locals.store.removeImage(id, function (error) {
            if (error) return next();
            res.json({
                status: 'success'
            });
        });
    });

module.exports = router;

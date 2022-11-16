const { validationResult } = require('express-validator/check');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    res.status(200).json({ // 200 only success
        posts: [
            {
                _id: '1',
                title: 'first post',
                content: 'the content of the post',
                imageUrl: 'images/haloba.jpg',
                creator: {
                    name: 'Halbo'
                },
                createdAt: new Date()
            }   
        ]
    });
};

exports.postPost = (req, res, next) => {
    const errros = validationResult(req);
    if(!errros.isEmpty()){
        return res
            .status(422) //validation failure
            .json({
                message: 'Validation failed, review entered data',
                errros: errros.array()
            })
    }
    const title = req.body.title;
    const content = req.body.content;
    // create post in db
    const post = new Post({
        title,
        imageUrl: 'images/haloba.jpg',
        content,
        creator: {
            name: 'Halbo'
        }
    });

    post
    .save()
        .then(result => {
            console.log(result);
            res.status(201).json({ // 201 success and resource created
                message: 'created successfully',
                post: {
                    _id: new Date().toISOString(),
                    title,
                    content,
                    creator: {
                        name: 'Halbo'
                    },
                    createdAt: new Date()
                }
            });
        })
        .catch(err => console.log(err));
};
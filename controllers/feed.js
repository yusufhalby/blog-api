const fs = require('fs');
const path = require('path');

const {
    validationResult
} = require('express-validator');

const Post = require('../models/post');
const User = require('../models/user');


exports.getPosts = async (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    try{
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
        .skip((currentPage - 1) * perPage)
        .limit(perPage);

        if(!posts){
            const error = new Error('Could not find posts.');
            error.statusCode = 404;
            throw error; //throw the error to catch block
        }
        res.status(200).json({message: 'posts fetched.', posts, totalItems});
        console.log('Authenticated!');
    } catch(err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
    
    

};

exports.postPost = (req, res, next) => {
    const errros = validationResult(req);
    if (!errros.isEmpty()) {
        const error = new Error('Validation failed, review entered data');
        error.statusCode = 422;
        throw error;
    }
    if(!req.file){
        const error = new Error('No image provided.');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path.replace('\\', '/');
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    // create post in db
    const post = new Post({
        title,
        // imageUrl: 'images/haloba.jpg',
        imageUrl,
        content,
        creator: req.userId //because of is-auth middleware
    });

    post
        .save()
        .then(result => {
            return User.findById(req.userId);
        })
        .then(user=>{
            creator = user
            user.posts.push(post);
            return user.save();
        })
        .then(result =>{
            // console.log(result);
            res.status(201).json({ // 201 success and resource created
                message: 'created successfully',
                post: post,
                creator: {
                    _id: creator._id,
                    name: creator.name
                }
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error; //throw the error to catch block
        }
        res.status(200).json({message: 'post fetched.', post});
    })
    .catch(err=>{
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });
};

exports.updatePost = (req, res, next) => {
    const errros = validationResult(req);
    if (!errros.isEmpty()) {
        const error = new Error('Validation failed, review entered data');
        error.statusCode = 422;
        throw error;
    }

    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file){
        imageUrl = req.file.path.replace('\\', '/');
    }
    if(!imageUrl){
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }

    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error; //throw the error to catch block
        }
        if(post.creator.toString() !== req.userId){
            const error = new Error('Not authorized.');
            error.statusCode = 403;
            throw error;
        }
        if(imageUrl !== post.imageUrl){
            clearImage(post.imageUrl);
        }
        post.title = title; 
        post.imageUrl = imageUrl; 
        post.content = content; 
        return post.save();


    })
    .then(result=>{
        res.status(200).json({message: 'post updated.', post: result});
    })
    .catch(err=>{
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });

};

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    // let imageUrl;
    Post.findById(postId)
    .then(post => {
        if(!post){
            const error = new Error('Could not find post.');
            error.statusCode = 404;
            throw error; //throw the error to catch block
        }
        //check the logged in user
        if(post.creator.toString() !== req.userId){
            const error = new Error('Not authorized.');
            error.statusCode = 403;
            throw error;
        }
        // imageUrl = post.imageUrl;
        clearImage(post.imageUrl);
        return Post.findOneAndDelete(postId);
    })
    .then(result=>{
        return User.findById(req.userId);
    })
    .then(user => {
        // clearing post user relation
        user.posts.pull(postId);
        return user.save();
    })
    .then(result=>{
        res.status(200).json({message: 'post deleted.'});
    })
    .catch(err=>{
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    });


};


//helper function
const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};










// exports.getPosts = (req, res, next) => {
//     const currentPage = req.query.page || 1;
//     const perPage = 2;
//     let totalItems;
//     Post.find()
//     .countDocuments()
//     .then(count => {
//         totalItems = count; 
//         return Post.find()
//         .skip((currentPage - 1) * perPage)
//         .limit(perPage);
//     })
//     .then(posts => {
//         if(!posts){
//             const error = new Error('Could not find posts.');
//             error.statusCode = 404;
//             throw error; //throw the error to catch block
//         }
//         res.status(200).json({message: 'posts fetched.', posts, totalItems});
//         console.log('Authenticated!');
//     })
//     .catch(err=>{
//         if (!err.statusCode) {
//             err.statusCode = 500;
//         }
//         next(err);
//     });
    
    

// };

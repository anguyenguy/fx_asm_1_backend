const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');

const Post = require('../models/post');
const User = require('../models/user');
const { create } = require('../models/user');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    Post.find()
        .countDocuments()
        .then( count => {
            totalItems = count;
            return Post.find()
                .skip((currentPage -1)*perPage)
                .limit(perPage)
                .then(posts =>{
                    res.status(200).json({message: "succesfull", posts: posts, totalItems: totalItems});
                })
        })
        .catch( err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err); 
        });
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).json({
            message: 'Validation failed, entered data is incorrect.',
            errors: errors.array()
        });
    }
    console.log(req.file);
    if(!req.file){
        const error = new Error('No image provided!');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path.replace("\\" ,"/");
    const title = req.body.title;
    const content = req.body.content;
    let creator;

    const post = new Post({
    title: title, 
    content: content,
    imageUrl: imageUrl,
    creator: req.userId
  });
  post.save()
        .then(
      result => {
          return User.findById(req.userId);
      })
      .then( 
          user => {
            creator = user;
            user.posts.push(post);
            return user.save();
    })
    .then(
        result => {
            res.status(201).json({
                message: 'Post created successfully!',
                post: post,
                creator: {_id: creator._id, name: creator.name}
            });
        }
    )
    .catch(err => {
      console.log(err);
  });
};

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(
            post => {
                if(!post ){
                    const error = new Error('Could not find post.');
                    error.statusCode = 404;
                    throw error;
                }
                res.status(200).json({message: 'Post fetched!', post: post});
            }
        )
        .catch(
            err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            }
        );
};


exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    console.log('Update Post');
    if (req.file) {
        imageUrl = req.file.path.replace("\\","/");
    }
    if (!imageUrl){
        const error = new Error('No file picked.');
        error.statusCode = 422;
        throw error;
    }

    Post.findById(postId)
        .then(
            post => {
                if(!post){
                    const error = new Error('Could not find post.');
                    error.statusCode = 404;
                    throw error;   
                }
                if(post.creator.toString() !== req.userId){
                    const error = new Error('Not authorized!');
                    error.statusCode = 403;
                    throw error;
                };
                if(imageUrl !== post.imageUrl){
                    clearImage(post.imageUrl);
                }
                post.title = title;
                post.imageUrl = imageUrl;
                post.content = content;
                return post.save();
            }
        )
        .then(
            result => {
                res.status(200).json({
                    message: 'Edit successfull',
                    post: result
                });
            }
        )
        .catch(
            err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
            }
        )
};

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
};


exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            // Check logged in user
            if(!post){
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;   
            };
            if(post.creator.toString() !== req.userId){
                const error = new Error('Not authorized!');
                error.statusCode = 403;
                throw error;
            };
            clearImage(post.imageUrl);
            return Post.findByIdAndRemove(postId);
        })
        .then( result => {
            console.log(result);
            res.status(200).json({
                message: 'Delete successfull'
            });
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
};


exports.getStatus = (req, res, next) => {
    const userId = req.params.userId;
    console.log(userId);
    User.findById(userId)
        .then(user => {
            console.log(user); 
            if(!user.status){
                const error = new Error('Could not find status.');
                error.statusCode = 404;
                throw error;   
            };
            res.status(200).json({
                message: 'Get status successful',
                status: user.status
            });
        })
        .catch(
            err => {
                if(!err.statusCode){
                    err.statusCode = 500;
                }
                next(err);
        });

};

exports.getLike = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            // Check logged in user
            if(!post.likes){
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;   
            };        
            if(post.likes.includes(req.userId)){
                const index = post.likes.indexOf(req.userId);
                post.likes.splice(index,1);
            }else{
                post.likes.push(req.userId);
            }
            post.save();
            return post;
        })
        .then( post => {
            res.status(200).json({
                message: 'Click like successfull',
                post: post
            });
        })
        .catch(err => {
            if(!err.statusCode){
                err.statusCode = 500;
            }
            next(err);
        });
};
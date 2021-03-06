const express = require('express');

const { body } = require('express-validator/check');

const feedController = require('../controllers/feed');

const isAuth = require('../middlewares/is-auth');

const router = express.Router();

// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

// POST /feed/post
router.post('/post', isAuth,[
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
], feedController.createPost);

router.get('/post/:postId', isAuth, feedController.getPost);

router.put('/post/:postId', isAuth, [
    body('title').trim().isLength({min: 5}),
    body('content').trim().isLength({min: 5})
], feedController.updatePost);

router.delete('/post/:postId', isAuth, feedController.deletePost);

router.get('/status/:userId', isAuth, feedController.getStatus);

router.get('/likes/:postId', isAuth, feedController.getLike);

module.exports = router;
const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load Post model
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
// Validation
const validatePostInput = require('../../validation/post');

// @route GET api/posts/test
// @desc test post route
// @access public
router.get("/test", (req, res) => res.json({ msg: "Posts Working fine!!!" }));

// @route GET api/posts
// @desc Get posts
// @access public
router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.status(200).json(posts))
    .catch(err => res.status(400).json({ nopostfound: 'No post found' }))
});


// @route GET api/posts/:id
// @desc Get posts by post id
// @access public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(posts => res.status(200).json(posts))
    .catch(err => res.status(400).json({ nopostfound: 'No post found with that ID' }))
});


// @route POST api/posts
// @desc Create post
// @access private
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);
  if (!isValid) return res.status(400).json(errors);

  const newPost = new Post({
    text: req.body.text,
    name: req.body.name,
    avatar: req.body.avatar,
    user: req.user.id
  });

  newPost.save()
    .then(post => res.status(200).json(post))
    .catch(err => res.status(400).json(err))
});

// @route POST api/posts
// @desc Create post
// @access private
router.delete('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ notauthorized: 'User not authorized' })
          }

          // Delete
          post.remove()
            .then(() => res.status(200).json({ success: true }))
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }))
    })
    .catch()
});


// @route POST api/posts/likes/:id
// @desc Create post likes
// @access private
router.post('/like/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(404).json({ alreadyliked: 'User already liked this post' })
          }

          // Add user id to like array
          post.likes.unshift({ user: req.user.id })
          post.save()
            .then(post => res.status(200).json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }))
    });
});

// @route POST api/posts/unlike/:id
// @desc Create post unlike
// @access private
router.post('/unlike/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Profile.findOne({ user: req.user.id })
    .then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
            return res.status(404).json({ notliked: 'You have not yet liked this post' })
          }

          // find out index of likes
          // const removeIndex = post.likes
          //   .map(item => item.user.toString())
          //   .indexOf(req.user.id);
          const removeIndex = post.likes.findIndex(item => item.user.toString() === req.user.id)
          console.log('remove Index', removeIndex);
          // splice out of array
          post.likes.splice(removeIndex, 1);
          post.save()
            .then(post => res.status(200).json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: 'No post found' }))
    })
});


// @route POST api/posts/comment/:id
// @desc Add comments to post
// @access private
router.post('/comment/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validatePostInput(req.body);
  // Check validataion
  if (!isValid) return res.status(400).json(errors);

  Post.findById(req.params.id)
    .then(post => {
      const newComment = {
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
      }
      // Add comment to array
      post.comments.unshift(newComment);
      // Save comment
      post.save().then(post => res.status(200).json(post))
    })
    .catch(err => res.status(404).json({ postnotfound: 'No post found' }))
});


// @route DELETE api/posts/comment/:id/:comment_id
// @desc Delete comments from post
// @access private
router.delete('/comment/:id/:comment_id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Post.findById(req.params.id)
    .then(post => {
      // If comment exist
      if (post.comments.filter(comment => comment._id.toString() === req.params.comment_id) === 0) {
        return res.status(404).json({ commentnotexist: 'Comment does not exist' })
      }

      // Get remove index
      const removeIndex = post.comments.findIndex(comment => comment._id.toString() === req.params.comment_id);
      // Remove post 
      post.comments.splice(removeIndex, 1);
      //Save comment form post
      post.save().then(post => res.status(200).json(post))
    })
    .catch(err => res.status(404).json({ postnotfound: 'No post found' }))
});

module.exports = router;

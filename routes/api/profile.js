const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

// Load Profile Model
const Profile = require("../../models/Profile");
// Load User Profile
const User = require("../../models/User");
// Load Input Validation
const validteProfileInput = require("../../validation/profile");
const validateExperienceInput = require("../../validation/experience");
const validateEducationInput = require("../../validation/education");
// @route GET api/profile/test
// @desc test profile route
// @access public
router.get("/test", (req, res) => res.json({ msg: "Profile Working fine!!!" }));

// @route GET api/profile
// @desc Get current user profile
// @access public
router.get("/", passport.authenticate('jwt', { session: false }), (req, res) => {
  const errors = {};

  Profile.findOne({ user: req.user.id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(400).json(errors);
      }
      res.status(200).json(profile);
    })
    .catch(err => res.status(404).json(err));
});

// @route GET api/profile/hadle/:handle
// @desc Get profile by handle
// @access public
router.get('/handle/:handle', (req, res) => {
  const errors = {};
  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors)
      }
      res.status(200).json(profile)
    })
    .catch(err => res.status(500).json(err))
})


// @route GET api/profile/user/:user_id
// @desc Get profile by user ID
// @access public
router.get('/user/:user_id', (req, res) => {
  Profile.findOne({ user: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.noprofile = 'There is no profile for this user';
        return res.status(404).json(errors)
      }
      res.status(200).json(profile)
    })
    .catch(err => res.status(500).json({ profile: 'There is no profile for this user' }))
});

// @route GET api/profile/all
// @desc Get all profile
// @access public
router.get('/all', (req, res) => {
  const errors = {};

  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = 'There are no profiles';
        return res.status(404).json(errors)
      }
      res.status(200).json(profiles);
    })
    .catch(err => res.status(500).json({ profile: 'There is no profiles' }))
})

// @route POST api/profile
// @desc Create user profile
// @access public
router.post("/", passport.authenticate('jwt', { session: false }), (req, res) => {
  // const errors = {}
  const { errors, isValid } = validteProfileInput(req.body);
  // Check 
  if (!isValid) return res.status(400).json(errors);

  // Get fields 
  const profileFields = {};
  profileFields.user = req.user.id;
  if (req.body.handle) profileFields.handle = req.body.handle;
  if (req.body.company) profileFields.company = req.body.company;
  if (req.body.website) profileFields.website = req.body.website;
  if (req.body.location) profileFields.location = req.body.location;
  if (req.body.bio) profileFields.bio = req.body.bio;
  if (req.body.status) profileFields.status = req.body.status;
  if (req.body.githubusername) profileFields.githubusername = req.body.githubusername;

  // Skills split into array
  if (typeof req.body.skills !== 'undefined')
    profileFields.skills = req.body.skills.split(',');

  // Social
  profileFields.social = {};
  if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
  if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
  if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
  if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
  if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      if (profile) {
        // Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true })
          .then(profile => res.status(200).json(profile))
        // .catch(err => res.status(400).json(err))
      } else {
        // Handle 
        Profile.findOne({ handle: profileFields.handle })
          .then(profile => {
            if (profile) {
              errors.handle = 'That handle already exists';
              return res.status(400).json(errors)
            }

            // Save Profile
            new Profile(profileFields).save().then(profile => res.status(201).json(profile))
            // .catch(err => res.status(400).json(err))
          })
      }
    })
    .catch(err => res.status(400).json(err));
});


// @route POST api/profile/experience
// @desc Create user experience
// @access public
router.post('/experience', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateExperienceInput(req.body);
  if (!isValid) return res.status(400).json(errors);

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const newExp = {
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      }

      // Add to experience array
      profile.experience.unshift(newExp);
      profile.save()
        .then(profile => res.status(200).json(profile))
        .catch(err => res.status(400).json(err))
    })
});


// @route POST api/profile/education
// @desc Create user education
// @access public
router.post('/education', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { errors, isValid } = validateEducationInput(req.body);
  if (!isValid) return res.status(400).json(errors);

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      const newEdu = {
        school: req.body.school,
        degree: req.body.degree,
        fieldofstudy: req.body.fieldofstudy,
        from: req.body.from,
        to: req.body.to,
        current: req.body.current,
        description: req.body.description
      }

      // Add to experience array
      profile.education.unshift(newEdu);
      profile.save()
        .then(profile => res.status(200).json(profile))
        .catch(err => res.status(400).json(err))
    })
});

// @route POST api/profile/experience/:exp_id
// @desc Delte user experience
// @access public
router.delete('/experience/:exp_id', passport.authenticate('jwt', { session: false }), (req, res) => {

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      // Get remove index
      const removeIndex = profile.experience
        .map(item => item.id)
        .indexOf(req.params.exp_id)
      //Splice out of array
      profile.experience.splice(removeIndex, 1);

      profile.save()
        .then(profile => res.status(200).json(profile))
        .catch(err => res.status(404).json(err))
    })
});

// @route POST api/profile/education/edu_id
// @desc Delete user education
// @access public
router.delete('/education/:edu_id', passport.authenticate('jwt', { session: false }), (req, res) => {

  Profile.findOne({ user: req.user.id })
    .then(profile => {
      // Get remove index
      const removeIndex = profile.education.findIndex(item => item.id === req.params.edu_id)
      // Splice out of education array
      profile.education.splice(removeIndex, 1)
      profile.save()
        .then(profile => res.status(200).json(profile))
        .catch(err => res.status(404).json(err))
    })
});

// @route POST api/profile
// @desc Delete user and profile
// @access public
router.delete('/', passport.authenticate('jwt', { session: false }), (req, res) => {

  Profile.findOneAndDelete({ user: req.user.id }).then(profile => {
    User.findByIdAndDelete({ _id: req.user.id })
      .then(() => res.status(200).json({ status: true }));

  })
})
module.exports = router;


const express = require('express');
const router = express.Router();
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../../../core/middlewares/auth');
const { authLimiter } = require('../../../core/middlewares/ratelimit');
const { validate } = require('../../../core/middlewares/validation');
const authController = require('../authController');
const {
  registerValidation,
  loginValidation,
  refreshValidation,
  changePasswordValidation,
} = require('../authValidator');


router.post('/register', authLimiter, registerValidation, validate, authController.register);
router.post('/login', authLimiter, loginValidation, validate, authController.login);
router.post('/refresh', refreshValidation, validate, authController.refresh);


router.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${req.user.accessToken}`);
});

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${req.user.accessToken}`);
});


router.get('/me', authenticate, authController.getProfile);
router.put('/profile', authenticate, validate, authController.updateProfile);
router.put('/password', authenticate, changePasswordValidation, validate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

module.exports = router;

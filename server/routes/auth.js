const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../controllers/authController');

router.post('/register', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password too short')
], auth.register);

router.post('/login', [
  body('email').isEmail(),
  body('password').exists()
], auth.login);

router.post('/send-otp', [
  body('email').isEmail().withMessage('Valid email required')
], auth.sendOtp);

router.post('/verify-otp', [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid OTP required')
], auth.verifyOtp);

router.post('/reset-password', [
  body('email').isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid reset code required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password too short')
], auth.resetPassword);

module.exports = router;

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

module.exports = router;

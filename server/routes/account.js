const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/accountController');

router.put('/', auth, [
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password too short')
], controller.updateAccount);

module.exports = router;

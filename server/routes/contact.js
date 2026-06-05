const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const controller = require('../controllers/contactController');

router.post('/', [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('message').notEmpty()
], controller.submitContact);

module.exports = router;

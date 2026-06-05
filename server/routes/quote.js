const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const controller = require('../controllers/quoteController');

router.post('/', [
  body('clientName').notEmpty(),
  body('email').isEmail(),
  body('projectType').notEmpty()
], controller.submitQuote);

module.exports = router;

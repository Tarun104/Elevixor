const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const controller = require('../controllers/serviceInquiryController');

router.post('/', [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('serviceType').notEmpty().withMessage('Service type is required')
], controller.submitInquiry);

module.exports = router;

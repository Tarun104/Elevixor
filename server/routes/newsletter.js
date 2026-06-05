const express = require('express');
const router = express.Router();
const controller = require('../controllers/newsletterController');

router.post('/', controller.subscribe);

module.exports = router;

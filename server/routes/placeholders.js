const express = require('express');
const router = express.Router();
const controller = require('../controllers/placeholderController');

router.get('/resume-analysis', controller.notImplemented);
router.get('/ai-career-guidance', controller.notImplemented);
router.get('/business-solutions', controller.notImplemented);
router.get('/portfolio-generation', controller.notImplemented);
router.get('/ai-chat', controller.notImplemented);

module.exports = router;

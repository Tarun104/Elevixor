const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/dashboardController');

router.get('/profile', auth, controller.profile);
router.get('/quotes', auth, controller.quotes);

module.exports = router;

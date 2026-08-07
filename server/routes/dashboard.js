const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/dashboardController');
const multer = require('multer');
const path = require('path');

// configure multer storage to uploads/ directory
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, '..', '..', 'uploads'));
	},
	filename: function (req, file, cb) {
		const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
		cb(null, safe);
	}
});
const upload = multer({ storage: storage });

router.get('/profile', auth, controller.profile);
router.get('/quotes', auth, controller.quotes);
router.post('/profile/avatar', auth, upload.single('avatar'), controller.uploadAvatar);

module.exports = router;

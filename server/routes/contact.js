const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const router = express.Router();
const controller = require('../controllers/contactController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    callback(null, allowedTypes.includes(file.mimetype));
  }
});

router.post('/', upload.single('resumeFile'), [
  body('name').notEmpty(),
  body('email').isEmail(),
  body('message').notEmpty()
], controller.submitContact);

module.exports = router;

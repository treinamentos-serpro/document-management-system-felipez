const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const multer = require('multer');
const controller = require('../controllers/documentController');

function getStorageDirectory() {
  return path.resolve(process.env.DMS_STORAGE_DIR || path.join(__dirname, '../../storage'));
}

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const directory = getStorageDirectory();
    fs.mkdir(directory, { recursive: true }, (error) => callback(error, directory));
  },
  filename(req, file, callback) {
    callback(null, crypto.randomUUID());
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 2 },
});

const router = require('express').Router();
router.post('/upload', upload.single('file'), controller.upload);
router.get('/documents', controller.list);
router.get('/documents/:id/download', controller.download);

module.exports = router;
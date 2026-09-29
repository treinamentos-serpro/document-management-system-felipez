const express = require('express');
const multer = require('multer');
const { randomUUID } = require('node:crypto');
const ApplicationError = require('../services/applicationError');
const createDocumentController = require('../controllers/documentController');

function createDocumentRouter({ documentService, storageDir, maxFileSizeBytes }) {
  const router = express.Router();
  const storage = multer.diskStorage({
    destination: storageDir,
    filename: (req, file, callback) => callback(null, randomUUID()),
  });
  const upload = multer({
    storage,
    limits: {
      fileSize: maxFileSizeBytes,
      files: 1,
      fields: 0,
      parts: 2,
    },
  });
  const controller = createDocumentController(documentService);
  const parseUpload = (req, res, next) => {
    upload.single('file')(req, res, (error) => {
      if (!error) {
        return next();
      }

      if (error instanceof multer.MulterError) {
        return next(error);
      }

      if (['EACCES', 'EMFILE', 'ENFILE', 'ENOSPC', 'EROFS'].includes(error.code)) {
        return next(error);
      }

      return next(new ApplicationError(
        400,
        'INVALID_REQUEST',
        'A requisição multipart é inválida.',
      ));
    });
  };

  router.post('/upload', parseUpload, controller.upload);
  router.get('/documents', controller.list);
  router.get('/documents/:id/download', controller.download);

  return router;
}

module.exports = { createDocumentRouter };
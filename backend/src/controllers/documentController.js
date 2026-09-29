const service = require('../services/documentService');

async function upload(req, res, next) {
  if (!req.file) {
    return res.status(400).json({ error: 'Envie um arquivo no campo "file".' });
  }

  try {
    const document = await service.createDocument(req.file, req.user.id);
    return res.status(201).json(document);
  } catch (error) {
    return next(error);
  }
}

function list(req, res) {
  return res.json(service.listDocuments(req.user.id));
}

function download(req, res, next) {
  const result = service.getDownload(req.params.id, req.user.id);
  if (!result) {
    return res.status(404).json({ error: 'Documento não encontrado.' });
  }

  return res.download(result.filePath, result.document.originalName, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    },
  }, (error) => {
    if (error && !res.headersSent) {
      next(error);
    }
  });
}

module.exports = { download, list, upload };
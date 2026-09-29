const ApplicationError = require('../services/applicationError');

function createDocumentController(documentService) {
  return {
    upload: async (req, res) => {
      if (!req.file) {
        throw new ApplicationError(400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
      }

      const document = await documentService.createDocument(req.file, req.user.id);
      return res.status(201).json({ document });
    },

    list: (req, res) => {
      return res.status(200).json({
        documents: documentService.listDocuments(req.user.id),
      });
    },

    download: async (req, res, next) => {
      const { document, filePath } = await documentService.getDownload(req.params.id, req.user.id);
      return res.download(filePath, document.originalName, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, no-store',
        },
      }, (error) => {
        if (!error) {
          return;
        }

        if (res.headersSent) {
          return res.destroy(error);
        }

        const code = error.code === 'ENOENT' ? 'FILE_NOT_FOUND' : 'DOWNLOAD_FAILED';
        const status = error.code === 'ENOENT' ? 404 : 500;
        return next(new ApplicationError(
          status,
          code,
          status === 404
            ? 'Arquivo do documento não encontrado.'
            : 'Não foi possível baixar o documento.',
        ));
      });
    },
  };
}

module.exports = createDocumentController;
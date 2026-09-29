// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const path = require('node:path');
const DocumentRepository = require('./repositories/documentRepository');
const LocalFileRepository = require('./repositories/localFileRepository');
const DocumentService = require('./services/documentService');
const ApplicationError = require('./services/applicationError');
const { createDocumentRouter } = require('./routes/documentRoutes');
const { createAuthenticate } = require('./middleware/authenticate');

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_STORAGE_BYTES = 1024 * 1024 * 1024;
const DEFAULT_MAX_DOCUMENTS_PER_OWNER = 500;

function getMaxFileSizeBytes(options) {
  const configuredValue = options.maxFileSizeBytes ?? (
    Number(process.env.MAX_FILE_SIZE_MB || 10) * 1024 * 1024
  );

  return Number.isSafeInteger(configuredValue) && configuredValue > 0
    ? configuredValue
    : DEFAULT_MAX_FILE_SIZE_BYTES;
}

function getPositiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getUserTokens(options) {
  const configuredTokens = options.userTokens ?? process.env.DMS_USER_TOKENS;
  if (configuredTokens === undefined || configuredTokens === '') {
    return null;
  }

  if (typeof configuredTokens !== 'string') {
    return configuredTokens;
  }

  try {
    return JSON.parse(configuredTokens);
  } catch {
    return null;
  }
}

function createApp(options = {}) {
  const app = express();
  const storageDir = options.storageDir
    || process.env.DMS_STORAGE_DIR
    || path.resolve(__dirname, '../storage');
  const documentRepository = new DocumentRepository();
  const fileRepository = new LocalFileRepository(storageDir);
  const documentService = new DocumentService({
    documentRepository,
    fileRepository,
    owner: options.owner || process.env.DMS_DEFAULT_OWNER || 'local',
    maxStorageBytes: options.maxStorageBytes ?? getPositiveInteger(
      Number(process.env.MAX_STORAGE_MB || 1024) * 1024 * 1024,
      DEFAULT_MAX_STORAGE_BYTES,
    ),
    maxDocumentsPerOwner: options.maxDocumentsPerOwner ?? getPositiveInteger(
      process.env.MAX_DOCUMENTS_PER_OWNER,
      DEFAULT_MAX_DOCUMENTS_PER_OWNER,
    ),
  });

  app.use(express.json());
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(createAuthenticate(getUserTokens(options)));
  app.use(createDocumentRouter({
    documentService,
    storageDir,
    maxFileSizeBytes: getMaxFileSizeBytes(options),
  }));
  app.use((error, req, res, next) => {
    if (res.headersSent) {
      return next(error);
    }

    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      return res.status(tooLarge ? 413 : 400).json({
        error: {
          code: tooLarge ? 'FILE_TOO_LARGE' : 'INVALID_REQUEST',
          message: tooLarge
            ? 'O arquivo excede o tamanho máximo permitido.'
            : 'A requisição de upload é inválida.',
        },
      });
    }

    if (error instanceof ApplicationError) {
      return res.status(error.status).json({
        error: { code: error.code, message: error.message },
      });
    }

    console.error(error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocorreu um erro interno.',
      },
    });
  });

  return app;
}

const app = createApp();
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;

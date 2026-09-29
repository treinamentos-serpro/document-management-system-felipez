const { randomUUID } = require('node:crypto');
const path = require('node:path');
const ApplicationError = require('./applicationError');

function getOriginalName(originalName) {
  return path.basename(originalName.replace(/\\/g, '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim() || 'document';
}

class DocumentService {
  constructor({ documentRepository, fileRepository, owner }) {
    this.documentRepository = documentRepository;
    this.fileRepository = fileRepository;
    this.owner = owner;
  }

  async createDocument(file) {
    if (file.size === 0) {
      await this.fileRepository.remove(file.filename);
      throw new ApplicationError(400, 'FILE_EMPTY', 'O arquivo enviado está vazio.');
    }

    const document = {
      id: randomUUID(),
      originalName: getOriginalName(file.originalname),
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner: this.owner,
    };

    try {
      this.documentRepository.save(document, file.filename);
    } catch (error) {
      try {
        await this.fileRepository.remove(file.filename);
      } catch (cleanupError) {
        console.error(cleanupError);
      }

      throw new ApplicationError(500, 'UPLOAD_FAILED', 'Não foi possível salvar o documento.');
    }

    return document;
  }

  listDocuments() {
    return this.documentRepository.findAll().sort((first, second) => {
      const dateOrder = Date.parse(second.uploadedAt) - Date.parse(first.uploadedAt);
      return dateOrder || first.id.localeCompare(second.id);
    });
  }

  async getDownload(id) {
    const document = this.documentRepository.findById(id);
    if (!document) {
      throw new ApplicationError(404, 'DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
    }

    if (!await this.fileRepository.exists(document.storageName)) {
      throw new ApplicationError(404, 'FILE_NOT_FOUND', 'Arquivo do documento não encontrado.');
    }

    return {
      document,
      filePath: this.fileRepository.getPath(document.storageName),
    };
  }
}

module.exports = DocumentService;
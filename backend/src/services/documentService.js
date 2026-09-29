const { randomUUID } = require('node:crypto');
const ApplicationError = require('./applicationError');
const sanitizeFileName = require('../utils/sanitizeFileName');

class DocumentService {
  constructor({ documentRepository, fileRepository, owner, maxStorageBytes, maxDocumentsPerOwner }) {
    this.documentRepository = documentRepository;
    this.fileRepository = fileRepository;
    this.owner = owner;
    this.maxStorageBytes = maxStorageBytes;
    this.maxDocumentsPerOwner = maxDocumentsPerOwner;
  }

  async removeUploadedFile(fileName) {
    try {
      await this.fileRepository.remove(fileName);
    } catch (error) {
      console.error(error);
    }
  }

  async createDocument(file, owner = this.owner) {
    if (file.size === 0) {
      await this.removeUploadedFile(file.filename);
      throw new ApplicationError(400, 'FILE_EMPTY', 'O arquivo enviado está vazio.');
    }

    const documents = this.documentRepository.findAll();
    const ownerDocuments = documents.filter((document) => document.owner === owner);
    if (ownerDocuments.length >= this.maxDocumentsPerOwner) {
      await this.removeUploadedFile(file.filename);
      throw new ApplicationError(429, 'DOCUMENT_LIMIT_REACHED', 'O limite de documentos foi atingido.');
    }

    const storedBytes = await this.fileRepository.getUsageBytes();
    if (storedBytes > this.maxStorageBytes) {
      await this.removeUploadedFile(file.filename);
      throw new ApplicationError(413, 'STORAGE_QUOTA_EXCEEDED', 'A cota de armazenamento foi atingida.');
    }

    const document = {
      id: randomUUID(),
      originalName: sanitizeFileName(file.originalname),
      size: file.size,
      uploadedAt: new Date().toISOString(),
      owner,
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

  listDocuments(owner = this.owner) {
    return this.documentRepository.findAll()
      .filter((document) => document.owner === owner)
      .sort((first, second) => {
      const dateOrder = Date.parse(second.uploadedAt) - Date.parse(first.uploadedAt);
      return dateOrder || first.id.localeCompare(second.id);
    });
  }

  async getDownload(id, owner = this.owner) {
    const document = this.documentRepository.findById(id);
    if (!document || document.owner !== owner) {
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
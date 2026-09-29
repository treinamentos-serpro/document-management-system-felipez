const path = require('node:path');
const repository = require('../repositories/documentRepository');

async function createDocument(file, owner) {
  const document = {
    id: file.filename,
    originalName: path.basename(file.originalname.replaceAll('\\', '/')).replace(/[\u0000-\u001f\u007f]/g, '').trim() || 'documento',
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
  };

  try {
    return await repository.save(document);
  } catch (error) {
    await repository.removeFile(file.filename).catch(() => {});
    throw error;
  }
}

function listDocuments(owner) {
  return repository.findByOwner(owner);
}

function getDownload(id, owner) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return undefined;
  }

  const document = repository.findById(id);
  if (!document || document.owner !== owner) {
    return undefined;
  }

  return { document, filePath: repository.getFilePath(document.id) };
}

module.exports = { createDocument, getDownload, listDocuments };
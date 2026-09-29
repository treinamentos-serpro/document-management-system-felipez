const fs = require('node:fs/promises');
const path = require('node:path');

const documents = new Map();

function getStorageDirectory() {
  return path.resolve(process.env.DMS_STORAGE_DIR || path.join(__dirname, '../../storage'));
}

async function save(document) {
  documents.set(document.id, document);
  return document;
}

function findById(id) {
  return documents.get(id);
}

function findByOwner(owner) {
  return Array.from(documents.values())
    .filter((document) => document.owner === owner)
    .map(({ id, originalName, size, uploadedAt, owner }) => ({
      id,
      originalName,
      size,
      uploadedAt,
      owner,
    }));
}

async function removeFile(id) {
  await fs.rm(path.join(getStorageDirectory(), id), { force: true });
}

function getFilePath(id) {
  return path.join(getStorageDirectory(), id);
}

module.exports = { findById, findByOwner, getFilePath, removeFile, save };
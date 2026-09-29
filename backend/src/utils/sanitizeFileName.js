const path = require('node:path');

function sanitizeFileName(fileName) {
  return path.basename(fileName.replace(/\\/g, '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim() || 'document';
}

module.exports = sanitizeFileName;
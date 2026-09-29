const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class LocalFileRepository {
  constructor(storageDir) {
    this.storageDir = path.resolve(storageDir);
    fs.mkdirSync(this.storageDir, { recursive: true });
  }

  getPath(storageName) {
    if (!UUID_PATTERN.test(storageName)) {
      throw new Error('Nome físico de arquivo inválido.');
    }

    return path.join(this.storageDir, storageName);
  }

  async exists(storageName) {
    try {
      return (await fsPromises.lstat(this.getPath(storageName))).isFile();
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  }

  async remove(storageName) {
    try {
      await fsPromises.unlink(this.getPath(storageName));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}

module.exports = LocalFileRepository;
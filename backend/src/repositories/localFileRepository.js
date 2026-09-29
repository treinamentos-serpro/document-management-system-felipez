const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class LocalFileRepository {
  constructor(storageDir) {
    this.storageDir = path.resolve(storageDir);
    fs.mkdirSync(this.storageDir, { recursive: true, mode: 0o700 });
    const storageStat = fs.lstatSync(this.storageDir);
    if (!storageStat.isDirectory() || storageStat.isSymbolicLink()) {
      throw new Error('O caminho de storage deve ser um diretório local real.');
    }
    if (process.platform !== 'win32' && (storageStat.mode & 0o077) !== 0) {
      fs.chmodSync(this.storageDir, 0o700);
    }
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

  async getUsageBytes() {
    const entries = await fsPromises.readdir(this.storageDir, { withFileTypes: true });
    let totalBytes = 0;

    for (const entry of entries) {
      if (!entry.isFile() || !UUID_PATTERN.test(entry.name)) continue;

      try {
        const fileStat = await fsPromises.lstat(path.join(this.storageDir, entry.name));
        if (fileStat.isFile() && !fileStat.isSymbolicLink()) {
          totalBytes += fileStat.size;
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }

    return totalBytes;
  }
}

module.exports = LocalFileRepository;
class DocumentRepository {
  constructor() {
    this.documents = new Map();
  }

  save(document, storageName) {
    this.documents.set(document.id, { ...document, storageName });
    return { ...document };
  }

  findAll() {
    return Array.from(this.documents.values(), ({ storageName, ...document }) => ({
      ...document,
    }));
  }

  findById(id) {
    const document = this.documents.get(id);
    return document ? { ...document } : null;
  }
}

module.exports = DocumentRepository;
class ApplicationError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'ApplicationError';
    this.status = status;
    this.code = code;
  }
}

module.exports = ApplicationError;
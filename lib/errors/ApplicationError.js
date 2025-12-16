export default class ApplicationError extends Error {
  constructor(message = 'Application error occurred') {
    super(message);
    this.name = 'ApplicationError';
  }
}

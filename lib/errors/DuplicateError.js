export default class DuplicateError extends Error {
  constructor(message = 'Data already exists.') {
    super(message);
    this.name = 'DuplicateError';
  }
}

export default class UnavailableError extends Error {
  constructor(message = 'Resource unavailable. Please verify its availability and permissions.') {
    super(message);
    this.name = 'UnavailableError';
  }
}

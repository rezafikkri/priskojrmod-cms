export default class UnknownError extends Error {
  constructor(message = 'An unexpected error occurred. Please try again.') {
    super(message);
    this.name = 'UnknownError';
  }
}

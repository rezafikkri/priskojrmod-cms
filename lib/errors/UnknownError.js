export default class UnknownError extends Error {
  constructor(message = 'Something went wrong. Please try again.') {
    super(message);
    this.name = 'UnknownError';
  }
}

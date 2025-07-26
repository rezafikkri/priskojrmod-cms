export default class NotAllowedError extends Error {
  constructor(message = 'Action is not allowed.') {
    super(message);
    this.name = 'NotAllowedError';
  }
}

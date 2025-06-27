export default class PinLimitExceededError extends Error {
  constructor(message = 'Pin limit exceeded.') {
    super(message);
    this.name = 'PinLimitExceededError';
  }
}

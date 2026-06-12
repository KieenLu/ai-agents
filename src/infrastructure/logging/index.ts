export class InvalidClaimError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidClaimError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 503);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: string) {
    super(message, 503, details);
  }
}

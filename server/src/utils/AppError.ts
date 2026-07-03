export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly errors: any[];

  constructor(message: string, statusCode: number, errorCode: string, errors: any[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;

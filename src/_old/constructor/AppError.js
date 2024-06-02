class AppError extends Error {
  constructor(info, statusCode, name = "") {
    super(name);
    this.info = info;
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

exports.AppError = AppError;

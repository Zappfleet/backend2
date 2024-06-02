const { AppError } = require("../constructor/AppError");
const { banUser } = require("../utils/userHelper");
const logger = require("./logger");

const NODE_ENV = process.env.NODE_ENV;

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err, req, res) => {
  logger.error(`info:${err.info}stack: ${err.stack}user_id:${req?.user?._id}`);
  res.status(err.statusCode).json({
    info: err.info,
    stack: err.stack,
  });
};

const sendErrorProd = async (err, req, res) => {
  logger.error(`info:${err.info}stack: ${err.stack} user_id:${req?.user?._id}`);
  if (err.statusCode === 409) await banUser(req.user._id);
  if (err.isOperational) {
    res.status(err.statusCode).send({
      info: err.info,
    });
    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.error("ERROR 💥", err);
    // 2) Send generic message
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

const errorLogger = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (!NODE_ENV || NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (NODE_ENV === "production") {
    let error = { ...err };
    if (error.name === "CastError") error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();
    sendErrorProd(error, req, res);
  }
};
exports.errorLogger = errorLogger;

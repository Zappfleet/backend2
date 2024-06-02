const { createLogger, format, transports } = require("winston");
const { printf } = format;

require("express-async-errors");

const myFormat = printf((e) => {
  return `${e.timestamp}  ${e.level}: ${e.message} \n`;
});
const logger = createLogger({
  format: format.combine(format.timestamp(), myFormat),
  transports: [
    new transports.File({ filename: "logs/error.log", level: "error" }),
    new transports.File({ filename: "logs/mixed.log", level: "info" }),
    new transports.Console(),
  ],
  exceptionHandlers: [
    new transports.File({ filename: "logs/exceptions.log" }),
    new transports.Console(),
  ],
  rejectionHandlers: [
    new transports.File({ filename: "logs/rejections.log" }),
    new transports.Console(),
  ],
  exitOnError: false,
});
module.exports = logger;

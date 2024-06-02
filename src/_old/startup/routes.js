const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const csp = require("helmet-csp");
const logging = require("./logging");
const compression = require("compression");
var bodyParser = require("body-parser");
const { errorLogger } = require("../middleware/error");
const { queryParser } = require("express-query-parser");
const arabicCharacterFix = require("../middleware/arabicTextFix")

const MODULES = [
  "auth",
  "request",
  "trip",
  "area",
  "car",
  "user",
  "location",
  "var",
  "restriction",
  "statistics",
  "reports",
];

module.exports = function (app) {
  app.use(logging);
  app.use(cors());
  app.use(helmet());
  app.use(csp());
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(compression());
  require("./brute");
  app.set("trust proxy", 1); // Don't set to "true", it's not secure. Make sure it matches your environment
  app.use(
    queryParser({
      parseNull: true,
      parseUndefined: true,
      parseBoolean: true,
    })
  );
  app.use(arabicCharacterFix());
  const oldApiRouter = express.Router();

  MODULES.forEach((moduleName) => {
    const appModule = require(`../modules/${moduleName}`); // eslint-disable-line
    if (typeof appModule.configure === "function") {
      appModule.configure(oldApiRouter);
    }
  });
  app.use("/api/v1", oldApiRouter);
  app.use(errorLogger);
};

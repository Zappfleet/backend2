const express = require("express");
const { missionsRouter } = require("./mission-routes");
const { requestsRouter } = require("./request-routes");


const router = express.Router();

router.use("/missions", missionsRouter);

router.use("/requests", requestsRouter);

module.exports = { serviceRouter: router }
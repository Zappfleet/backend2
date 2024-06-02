const { default: axios } = require("axios");
const { Router } = require("express");
const https = require("https");
const crypto = require("crypto");
const { getZappBearerToken } = require("./lib");

const axiosInstance = axios.create({
  // axios options
  httpsAgent: new https.Agent({
    // for self signed you could also add
    // rejectUnauthorized: false,

    // allow legacy server
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  }),
});

const verySpecialAuth = (req, res, next) => {
  const token = req.header("Authorization");
  if (token == "veryspecialaccesstoken") {
    next();
  } else {
    res.status(401).send("invalid auth token");
  }
};

const irisaRouter = Router();

irisaRouter.get("/employee-detils", verySpecialAuth, async (req, res) => {
  const employeeNumber = req.query.username;

  const zappIrisaToken = await getZappBearerToken();

  const response = await axiosInstance.post(
    "https://frame.irisaco.com/api/sql2cs/do/erp_employee/rest/v1.0",
    { employeeNumber },
    { headers: { Authorization: zappIrisaToken } }
  );

  const modifiedData = response.data;
  modifiedData.data = JSON.parse(modifiedData.data);
  res.status(200).send(modifiedData.data[0]);
});

module.exports = { irisaRouter };

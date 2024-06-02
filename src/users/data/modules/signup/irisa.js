const { default: axios } = require("axios");
const { Router } = require("express");
const https = require("https");
const crypto = require("crypto");

const axiosInstance = axios.create({
  // axios options
  httpsAgent: new https.Agent({
    // for self signed you could also add
    // rejectUnauthorized: false,

    // allow legacy server
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  }),
});

const getZappToken = async () => {
  return await axiosInstance.post(
    "https://frame.irisaco.com/api/auth/token/rest/v1.0",
    {
      username: "zapptaxi",
      password: "NEWZ@PPT@x!%23123",
    }
  );
};

// const verySpecialAuth = (req, res, next) => {
//     const token = req.header("Authorization");
//     if (token == "veryspecialaccesstoken") {
//         next();
//     } else {
//         res.status(401).send("invalid auth token");
//     }
// }

// const irisaRouter = Router();

// irisaRouter.get("/employee-detils", verySpecialAuth, async (req, res) => {
//     const employeeNumber = req.query.username;

//     const zappIrisaToken = `Bearer ${(await getZappToken()).data.token}`

//     const response = await axiosInstance.post("https://frame.irisaco.com/api/sql2cs/do/erp_employee/rest/v1.0", { employeeNumber }, { headers: { Authorization: zappIrisaToken } })

//     const modifiedData = response.data;
//     modifiedData.data = JSON.parse(modifiedData.data);
//     res.status(200).send(modifiedData.data[0]);
// })

module.exports = async function ({ phone, nat_num, personel_code }) {
  const zappIrisaToken = `Bearer ${(await getZappToken()).data.token}`;
  const employeeNumber = personel_code;
  const response = await axiosInstance.post(
    "https://frame.irisaco.com/api/sql2cs/do/erp_employee/rest/v1.0",
    { employeeNumber },
    { headers: { Authorization: zappIrisaToken } }
  );
  const modifiedData = response.data;
  modifiedData.data = JSON.parse(modifiedData.data);

  const details = modifiedData.data[0];

  details.nat_num = details.COD_NAT_EMPL;
  delete details.COD_NAT_EMPL;

  details.personel_code = details.NUM_PRSN_EMPL;
  delete details.NUM_PRSN_EMPL;

  const username = details.USER_NAME.toLowerCase();
  const password = nat_num;

  if (details.nat_num != nat_num) {
    return { error: "کد ملی وارد شده با سیستم مطابقت ندارد." };
  }

  return {
    details,
    username,
    password,
    full_name: `${details.NAM_EMPL} ${details.NAM_SNAM_EMPL}`,
  };
};

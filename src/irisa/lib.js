const { default: axios } = require("axios");
const https = require("https");
const crypto = require("crypto");


const getZappToken = async () => {
  return await axios.post(
    "https://frame.irisaco.com/api/auth/token/rest/v1.0",
    {
      username: "zapptaxi",
      password: "NEWZ@PPT@x!%23123",
    }
  );
};

const getEmployeeCostCenter = async (personel_code) => {
  const empManager = await getEmployeeManager(personel_code);
  try {
    return await getCostCenterInfo(empManager.COD_CC_EMPL);
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getEmployeeManager = async (personel_code, token) => {
  try {
    const response = await axios.post(
      "https://frame.irisaco.com/api/sql2cs/do/erp_organization_manager/rest/v1.0",
      { employeeNumber: parseInt(personel_code) },
      { headers: { Authorization: token || (await getZappBearerToken()) } }
    );
    return JSON.parse(response.data.data)[0];
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getProjCodeInfo = async (projectNumber, token) => {
  try {
    const response = await axios.post(
      "https://frame.irisaco.com/api/sql2cs/do/erp_project_info/rest/v1.0",
      { projectNumber: parseInt(projectNumber) },
      { headers: { Authorization: token || (await getZappBearerToken()) } }
    );
    return JSON.parse(response.data.data)[0];
  } catch (e) {
    console.log(e);
    return null;
  }
};



const axiosInstance = axios.create({
  timeout: 30000,
  httpsAgent: new https.Agent({
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  }),
});

// const getIrisaToken = async () => {
//   try {
//     request = await axiosInstance({
//       method: "post",
//       url: "https://frame.irisaco.com/api/auth/token/rest/v1.0",
//       data: {
//         username: "zapptaxi",
//         password: "NEWZ@PPT@x!%23123",
//       },
//     });
//     return request.data.token;
//   } catch (error) {
//     console.log("message", error.message);
//     throw new AppError("خطا در اتصال به سرور اصلی ", 400);
//   }
// }


const getListOfCostCenters = async (irisaToken) => {
 // console.log(332);
  if (irisaToken == null) {
    irisaToken = await getZappBearerToken();
  }
  try {
    const axiosInstance = axios.create({
      timeout: 30000,
      httpsAgent: new https.Agent({
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      }),
    });

    const request = await axiosInstance.get(
      "https://frame.irisaco.com/api/sql2cs/do/oa_costcenter/rest/v1.0",
      {
        headers: {
          Authorization: irisaToken,
        },
      }
    );
    return request.data;
  } catch (error) {
    console.log(error);
    throw new AppError("خطا در دریافت اطلاعات  مدیران", 406);
  }
}


const getCostCenterInfo = async (costCenterId, token) => {
  try {
    const { data: costCenters } = await axios.get(
      "https://frame.irisaco.com/api/sql2cs/do/oa_costcenter/rest/v1.0",
      { headers: { Authorization: token || (await getZappBearerToken()) } }
    );
    return costCenters
      .find((item) => {
        return item.COD_CC == costCenterId;
      });
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getIrisaPersonelList = async () => {

  irisaToken = await getZappBearerToken();
  try {
    const axiosInstance = axios.create({
      timeout: 30000,
      httpsAgent: new https.Agent({
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      }),
    });

    const request = await axiosInstance.get(
      "https://frame.irisaco.com/api/sql2cs/do/oa_emploee/rest/v1.0",
      {
        headers: {
          Authorization: irisaToken,
        },
      }
    );
    return request.data;
  } catch {
    return 'error'
  }
};

const getZappBearerToken = async () => {
  return `Bearer ${(await getZappToken()).data.token}`;
};
module.exports = {
  getZappToken,
  getZappBearerToken,
  getProjCodeInfo,
  getCostCenterInfo,
  getIrisaPersonelList,
  getEmployeeCostCenter,
  getListOfCostCenters
};

const { default: axios } = require("axios");

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

const getCostCenterInfo = async (costCenterId, token) => {
  try {
    const { data: costCenters } = await axios.get(
      "https://frame.irisaco.com/api/sql2cs/do/oa_costcenter/rest/v1.0",
      { headers: { Authorization: token || (await getZappBearerToken()) } }
    );
    return costCenters.find((item) => {
      return item.COD_CC == costCenterId;
    });
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getIrisaPersonelList = async () => {
  return await axios.get(
    "https://frame.irisaco.com/api/sql2cs/do/oa_emploee/rest/v1.0",
    { headers: { Authorization: await getZappBearerToken() } }
  );
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
};

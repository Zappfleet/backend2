const { default: mongoose } = require("mongoose");
const {
  getZappBearerToken,
  getCostCenterInfo,
  getProjCodeInfo,
  getEmployeeCostCenter,
  sendMyIrisaManagerNotification,
} = require("../../irisa/lib");
const { getUserById } = require("../../users/data/user");

const moment = require("moment");
const { serviceRequestStatus } = require("../constatns");
const { getRegionById } = require("../../regions/routes/region-controller");
const { getRegionDocById } = require("../../regions/data");
const Region = require("../../regions/data/region-model");
const { UserAccount } = require("../../users/data/models/user-model");

async function irisaRequestProcessor(request) {
  //console.log(11);
  const token = await getZappBearerToken();
  let managerCode=null
  if (!request.details) request.details = {};

  let flag = true
  if (request.details?.proj_code) {
    flag = false
    //console.log(33, request.details?.proj_code);
    const project = await getProjCodeInfo(request.details?.proj_code, token);
     console.log(33, project);
    if (project === null || project === undefined) {
      // console.log(300, "Project is undefined");
      return { status: 300, error: "Project is undefined" };
    }
    const isNotSubmittedByAdmins = request.details?.direct_request !== false;
    if (
      moment(project.FINISH_DATE_G).isBefore(moment()) &&
      isNotSubmittedByAdmins
    ) {
      console.log(301, '"Project is expired"');
      return { status: 301, error: "Project is expired" };
    }
    request.details.project = project;
    managerCode=project?.EMPLOYEE_NUMBER
    //   console.log(332);
  }
  if (request.details?.cost_center) {
    flag = false
    // console.log(44);
    const costCenter = await getCostCenterInfo(
      request.details?.cost_center,
      token
    );
    console.log(555, costCenter);
    if (costCenter === null || costCenter === undefined) {
      console.log(400, "costCenter is undefined");
      return { status: 400, error: "costCenter is undefined" };
    }
    request.details.costCenter = costCenter;
    managerCode=costCenter?.NUM_PRSN_RSPNS_CC
  }

  if (flag === true) {
    // console.log(55);
    const requestOwner = await getUserById(request.submitted_by);
    if (requestOwner?.details?.personel_code) {
      const employeeCostCenter = await getEmployeeCostCenter(
        requestOwner?.details?.personel_code,
        token
      );
      request.details.costCenter = employeeCostCenter;
    }
  }

  // console.log(660, request);
  //sgh

  console.log(150, request?.area?._id);
  const regionInfo = await Region.findOne({ _id: request?.area?._id })
  const personel_code = regionInfo ? await (UserAccount.find({ _id: regionInfo?.dispatcher }))?.personel_code : ''
  console.log(1550, regionInfo);
  if (regionInfo && regionInfo?.properties?.need_manager_confirmation !== "yes") {
    request.status = serviceRequestStatus.ASSIGNED_TO_MISSION.key;
    request.confirmed_by = regionInfo.dispatcher;
  }

  return  { status: 200, data: managerCode };
}

module.exports = irisaRequestProcessor;

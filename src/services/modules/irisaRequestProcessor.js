const { default: mongoose } = require("mongoose");
const {
  getZappBearerToken,
  getCostCenterInfo,
  getProjCodeInfo,
  getEmployeeCostCenter,
} = require("../../irisa/lib");
const { getUserById } = require("../../users/data/user");
const moment = require("moment");
const { serviceRequestStatus } = require("../constatns");

async function irisaRequestProcessor(request) {
  //console.log(11);
  const token = await getZappBearerToken();
  //console.log(22);
  if (!request.details) request.details = {};

  let flag = true
  if (request.details?.proj_code) {
    flag = false
    console.log(33, request.details?.proj_code);
    const project = await getProjCodeInfo(request.details?.proj_code, token);
    if (project === null || project === undefined) {
      console.log(300, "Project is undefined");
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
  }

  if (flag === true) {
    // console.log(55);
    const requestOwner = await getUserById(request.submitted_by);
    if (requestOwner?.details?.details?.personel_code) {
      const employeeCostCenter = await getEmployeeCostCenter(
        requestOwner?.details?.details?.personel_code,
        token
      );
      request.details.costCenter = employeeCostCenter;
    }
  }

  // console.log(660, request);
  //sgh
  if (request.area && request.area?.properties?.need_manager_confirmation != "yes") {
    request.status = serviceRequestStatus.CONFIRM.key;
    request.confirmed_by = request.area.dispatcher;
  }
}

module.exports = irisaRequestProcessor;

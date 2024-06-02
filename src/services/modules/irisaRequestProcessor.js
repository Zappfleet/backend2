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

  if (request.details?.proj_code) {
   // console.log(33, request.details);
    const project = await getProjCodeInfo(request.details?.proj_code, token);
   // console.log(331, project);
    const isNotSubmittedByAdmins = request.details?.direct_request !== false;
    if (
      moment(project.FINISH_DATE_G).isBefore(moment()) &&
      isNotSubmittedByAdmins
    ) {
      return { error: "Project is expired" };
    }
    request.details.project = project;
 //   console.log(332);
  } else if (request.details?.cost_center) {
   // console.log(44);
    const costCenter = await getCostCenterInfo(
      request.details?.cost_center,
      token
    );
    request.details.costCenter = costCenter;
  } else {
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

const R = require("../resources/R");

const serviceMissionStatus = {
  DRAFT: {
    key: "DRAFT",
    title: R.string.draft,
  },
  PUBLISHED: {
    key: "PUBLISHED",
    title: R.string.published,
  },
  READY: {
    key: "READY",
    title: R.string.ready,
  },
  ON_ROUTE: {
    key: "ON_ROUTE",
    title: R.string.on_route,
  },
  DONE: {
    key: "DONE",
    title: R.string.done,
  },
  HIDDEN: {
    key: "HIDDEN",
    title: R.string.hidden,
  },
};

const assignedRequestStatus = {
  PENDING: {
    key: "PENDING",
    title: R.string.pending,
  },
  ON_ROUTE: {
    key: "ON_ROUTE",
    title: R.string.on_route,
  },
  DONE: {
    key: "DONE",
    title: R.string.done,
  },
};

const serviceRequestStatus = {
  PENDING: {
    key: "PENDING",
    title: R.string.pending,
  },
  CANCEL_USER: {
    key: "CANCEL_USER",
    title: R.string.cancel_by_user,
  },
  REJECT: {
    key: "REJECT",
    title: R.string.rejected,
  },
  CONFIRM: {
    key: "CONFIRM",
    title: R.string.confirmed,
  },
  SEEN: {
    key: "SEEN",
    title: R.string.seen,
  },
  ASSIGNED_TO_MISSION: {
    key: "ASSIGNED_TO_MISSION",
    title: R.string.assigned,
  },
  HIDDEN: {
    key: "HIDDEN",
    title: R.string.hidden,
  },
};

const statusUpdateType = {
  MISSION_STATUS_UPDATE: {
    key: "MISSION_STATUS_UPDATE",
    title: R.string.mission_status_update,
  },
  REQUEST_STATUS_UPDATE: {
    key: "REQUEST_STATUS_UPDATE",
    title: R.string.request_status_update,
  },
  DRIVER_LOCATION_UPDATE: {
    key: "DRIVER_LOCATION_UPDATE",
    title: R.string.request_driver_location_update,
  },
};

const directlySetableStatuses = (function () {
  const { CANCEL_USER, REJECT, CONFIRM } = serviceRequestStatus;
  return [CANCEL_USER.key, REJECT.key, CONFIRM.key];
})();

const nonEditableStatuses = (function () {
  const { CANCEL_USER, REJECT } = serviceRequestStatus;
  return [CANCEL_USER.key, REJECT.key];
})();

const prohibitedMissionStatusOnVehicleUpdate = (function () {
  return [serviceMissionStatus.ON_ROUTE.key, serviceMissionStatus.DONE.key];
})();

module.exports.serviceRequestStatus = serviceRequestStatus;
module.exports.nonEditableStatuses = nonEditableStatuses;
module.exports.directlySetableStatuses = directlySetableStatuses;
module.exports.serviceMissionStatus = serviceMissionStatus;
module.exports.assignedRequestStatus = assignedRequestStatus;
module.exports.prohibitedMissionStatusOnVehicleUpdate =
  prohibitedMissionStatusOnVehicleUpdate;
module.exports.statusUpdateType = statusUpdateType;

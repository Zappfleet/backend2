const { ObjectId } = require("mongodb");
const {
  notifyServiceRequestUpdate,
  notifyNewServiceRequest,
} = require("../../notification-service/emits");

const {
  notifyAPIDeleteApproveRequest,
  notifyAPIChangeTimeOfTripByDispature
} = require("../../notification-service/notif-API");
const {
  filterObject,
  datesAreInSameDay,
  getSortFromQuery,
} = require("../../utils");
const { findVehicleById } = require("../../vehicles/data");
const roles = require("../../_old/global_values/roles");
const { serviceRequestStatus, serviceMissionStatus } = require("../constatns");
const {
  createServiceRequest,
  listServiceRequests,
  readRequestDetails,
  updateServiceRequest,
  updateServiceStatus,
  getRequestServiceMissionIfExists,
  readRequestUpdateHistory,
  vehicleMissionCompatiblityCheck,
} = require("../data");
const { checkForPermissions } = require("../../users/data/user");
const { getRegionsAssignedToUser } = require("../../regions/data");
const { PermissionSet } = require("../../users/data/constants/permissions");
const { sendMyIrisaNotification } = require("../../_old/utils/irisaHelper");

class RequestController {
  async submitRequest(req, res) {
    const { locations, service, gmt_for_date, details = {} } = req.body;

    const no_details_is_assigned = Object.keys(details).length == 0;
    if (no_details_is_assigned) {
      details.names = [req.auth.full_name];
      details.mobile = req.auth.phone;
      details.direct_request = true;
    }

    const submitted_by = req.auth._id;

    const results = await Promise.all(
      gmt_for_date.map(async (date) => {
        // console.log(521, date, submitted_by, locations, service, details);
        return await createServiceRequest(
          submitted_by,
          locations,
          service,
          date,
          details
        );
      })
    );
    //  console.log(99, results);
    if (
      results.some((item) => {
        if (item.error != null) {
          results.status = item.status;
          results.error = item.error;
        }
        return item.error != null;
      })
    ) {
      res.status(results.status).send({ error: results.error });
    } else {
      res.status(200).send(results);
      results.map((result) => {
        notifyNewServiceRequest(result._id);
      });
    }
  }

  async getRequestHistory(req, res) {
    const { request_id } = req.params;
    const requestUpdateHistory = await readRequestUpdateHistory(request_id);
    res
      .status(requestUpdateHistory == null ? 404 : 200)
      .send({ history: requestUpdateHistory });
  }

  async updateRequest(req, res) {
    const { locations, service, gmt_for_date, details, type, submitted_by } = req.body;
    const _id = req.params.id;

    const existingMission = await getRequestServiceMissionIfExists(_id);

    //sgh
    // checkPermissions
    const isPermittedFor = type === 'update' ? true : await checkForPermissions(req.auth, [
      PermissionSet.SERVICE.DIRECT_EDIT,
    ]);

    const isCreatorOfRequest = type === 'update' ? req.auth._id === submitted_by.id ? true : false : true
    //console.log(400,isPermittedFor,isCreatorOfRequest);
    if (isPermittedFor === false || isCreatorOfRequest === false) {
      return res.status(403).send({ error: "Not Allowed" });
    }


    const ignoreStatus =
      existingMission?.status == serviceMissionStatus.DRAFT.key;

    if (existingMission != null && gmt_for_date != null) {
      const serviceRequests =
        await existingMission.getDetailedServiceRequests();
      const existingDates = serviceRequests
        .filter((request) => !request._id.equals(_id))
        .map((item) => item.gmt_for_date);
      existingDates.push(new Date(gmt_for_date));
      if (!datesAreInSameDay(existingDates)) {
        return res
          .status(405)
          .send({ error: "all requests must start in the same day" });
      }
    }
    if (
      existingMission != null &&
      existingMission.vehicle_id != null &&
      service != null
    ) {
      const vechileDetails = await findVehicleById(existingMission.vehicle_id);
      if (
        vechileDetails.services.find((item) => item.service == service) == null
      ) {
        return res.status(405).send({
          error: `mission vechile does not support this service : ${service}`,
        });
      }
    }

    const result = await updateServiceRequest(
      _id,
      locations,
      service,
      gmt_for_date,
      details,
      ignoreStatus
    );
    if (result.error) {
      res.status(result.status).send({ error: result.error });
    } else {
      res.status(200).send(result);
      notifyServiceRequestUpdate(_id);

      //sgh تغییر ساعت توسط دیسپاچر
      if (existingMission != null && gmt_for_date != null) {
        if (isCreatorOfRequest === false) {
          await notifyAPIChangeTimeOfTripByDispature(_id)
        }
      }

    }
  }

  async confirmRequest(req, res) {
    return await statusChange(req, res, serviceRequestStatus.CONFIRM.key);
  }

  async rejectRequest(req, res) {
    const status = serviceRequestStatus.REJECT.key;
    return await statusChange(req, res, status);
  }

  async cancelRequest(req, res) {
    return await statusChange(req, res, serviceRequestStatus.CANCEL_USER.key);
  }
  async getRequests(req, res) {
    const filterQueries = [
      "area_id",
      "gmt_from",
      "gmt_to",
      "service",
      "submitted_by",
      "search",
    ];
    const filter = filterObject(req.query, filterQueries);

    if (req.query.status != null && req.query.status.trim().length > 0) {
      const statuses = req.query.status.split(",");
      filter.status = statuses;
    }

    const isPermittedFor = await checkForPermissions(req.auth, [
      PermissionSet.SERVICE.ORG.GET.AREA_FULL,
      PermissionSet.SERVICE.ORG.GET.AREA_LIMITED,
    ]);

    const hasNoArealPermission =
      isPermittedFor[PermissionSet.SERVICE.ORG.GET.AREA_FULL] == false &&
      isPermittedFor[PermissionSet.SERVICE.ORG.GET.AREA_LIMITED] == false;

    if (hasNoArealPermission) return res.status(200).send({ docs: [] });

    if (
      isPermittedFor[PermissionSet.SERVICE.ORG.GET.AREA_LIMITED] &&
      !isPermittedFor[PermissionSet.SERVICE.ORG.GET.AREA_FULL]
    ) {
      const { regions } = await getRegionsAssignedToUser(req.auth._id);
      if (regions.length == 0) return res.status(200).send({ docs: [] });
      filter.area = { $in: regions.map(({ _id }) => _id) };
    }

    const sort = req.query.sort;
    const page = parseInt(req.query.page || 0);
    const result = await listServiceRequests(filter, sort, page);
    res.status(200).send(result);
  }

  async getMyReservedRequests(req, res) {
    const filterQueries = [
      "area_id",
      "gmt_from",
      "gmt_to",
      "service",
      "submitted_by",
    ];
    req.query.submitted_by = req.auth._id;
    const filter = filterObject(req.query, filterQueries);

    const sort = req.query.sort;
    const page = req.query.page;
    const result = await listServiceRequests(filter, sort, page);
    res.status(200).send(result);
  }

  async getRequestDetails(req, res) {
    const result = await readRequestDetails(req.params.id);
    res.status(200).send(result);
  }
}

async function statusChange(req, res, status) {
  const _id = req.params.id;
  const result = await updateServiceStatus(req.params.id, status, req.auth._id);
  if (result.error) {
    res.status(result.status).send({ error: result.error });
  } else {
    res.status(200).send(result);
    notifyServiceRequestUpdate(_id);
    console.log(22, status);
    if (status === 'CONFIRM' || status === 'REJECT') {
      notifyAPIDeleteApproveRequest(_id, status)
    }
  }
}

module.exports = new RequestController();

const { ObjectId } = require("mongodb");
const {
  notifyServiceMissionUpdate,
  notifyNewServiceMission,
  notifyErrorMessageToSpecificUser,
} = require("../../notification-service/emits");
const {
  readDateFilterFromQuery,
  getSortFromQuery,
  readStatusFilterFromQuery,
  parseSort,
} = require("../../utils");
const {
  listVehicles,
  listVechilesNoPagination,
} = require("../../vehicles/data");
const roles = require("../../_old/global_values/roles");
const Area = require("../../_old/modules/area/model");
const {
  serviceMissionStatus,
  assignedRequestStatus,
  serviceRequestStatus,
} = require("../constatns");
const moment = require("moment");
const {
  createDraftMission,
  appendRequestToMission,
  removeRequestFromMission,
  setMissionStatus,
  readMissionDetails,
  assignVehicleToMission,
  removeVehicleFromMission,
  listMissions,
  readRequestDetails,
  setMissionRequestStatus,
  readMissionUpdateHistory,
  listServiceRequests,
  createServiceRequest,
  createHiddenMission,
  fullDeleteMission,
} = require("../data");
const { ServiceMission } = require("../data/mission-model");
const {
  Restriction,
} = require("../../_old/modules/restriction/restriction.model");
const { notifyMissionUpdate } = require("./utils");
const {
  checkForPermissions,
  getUserById,
  getExternalSourceUser,
} = require("../../users/data/user");
const { PermissionSet } = require("../../users/data/constants/permissions");
const { getRegionsAssignedToUser } = require("../../regions/data");
const { default: mongoose } = require("mongoose");
const { notifyAPIStartTripByDriver, notifyAPIArriveToSource } = require("../../notification-service/notif-API");

const sendEmptyResults = (res) => res.status(200).send({ docs: [] });

class MissionController {
  async buildFullMission(req, res) {


    const { data: requestsList, extra, vehicle_id } = req.body;

    const hiddenMission = await createHiddenMission(req.auth._id, extra);

    const fullResult = await Promise.all(
      requestsList.map(async (data) => {
        const { locations, service, gmt_for_date, submitted_for } = data;

        const submitted_by = await (async function () {
          if (submitted_for.is_external) {
            return await getExternalSourceUser(submitted_for);
          } else {
            return await getUserById(submitted_for._id);
          }
        })();
        console.log(4007);
        const details = {
          direct_request: false,
          indirectly_submitted_by: req.auth._id,
        };
        console.log(4008, gmt_for_date, 'problem in get date');
        const results = await Promise.all(
          gmt_for_date.map(async (date) => {
            return await createServiceRequest(
              submitted_by,
              locations,
              service,
              date,
              details,
              serviceRequestStatus.HIDDEN.key,
              req.auth._id
            );
          })
        );
        console.log(4009);
        return results;
      })
    );
    console.log(9000);
    async function deleteAll() {
      await fullDeleteMission(
        hiddenMission._id,
        fullResult.map((service) => service[0]._id)
      );
    }
    for (let i = 0; i < fullResult.length; i++) {
      const service = fullResult[i];
      if (service.error) {
        res.status(service.status).send(service.error);
        await deleteAll();
        return;
      }
      const appendResult = await appendRequestToMission(
        hiddenMission._id,
        service[0]._id,
        req.auth._id
      );

      if (appendResult.error) {
        res.status(appendResult.status).send(appendResult.error);
        await deleteAll();
        return;
      }
    }

    const vehicleAssignResult = await assignVehicleToMission(
      hiddenMission._id,
      vehicle_id,
      req.auth._id
    );
    if (vehicleAssignResult.error) {
      res.status(vehicleAssignResult.status).send(vehicleAssignResult.error);
      await deleteAll();
      return;
    }

    const isAssignedToAgency = vehicleAssignResult.vehicle.isAgencyVehicle();

    await updateMissionStatusWithResponse(
      res,
      req.auth._id,
      hiddenMission._id,
      isAssignedToAgency
        ? serviceMissionStatus.DONE.key
        : serviceMissionStatus.READY.key
    );
  }
  /////////////
  async getDriverMissions(req, res) {
    const isPermittedForDriving = await checkForPermissions(req.auth, [
      PermissionSet.DRIVER,
    ]);

    if (isPermittedForDriving == false) return sendEmptyResults(res);

    const driverVehicles = await listVehicles({ driver_user: req.auth._id });

    if (driverVehicles.docs.length == 0) return sendEmptyResults(res);

    const dateFilter = readDateFilterFromQuery(req.query);

    const filter = {
      vehicle_id: { $in: driverVehicles.docs.map((vehcile) => vehcile._id) },
      ...dateFilter,
    };

    const missionList = await listMissions(
      filter,
      req.query.sort,
      parseInt(req.query.page || 0)
    );
    res.status(200).send(missionList);
  }

  async getMissions_by_StatusAndDriverID(req, res) {
    const { status, driverID } = req.query;
    let missionsFilter = {}
    if (driverID === undefined) {
      missionsFilter = {
        // driver_id: new ObjectId(user_id),
        status: status,
      };
    }
    else {
      missionsFilter = {
        driver_id: new ObjectId(driverID),
        status: status,
      };
    }

    const missionList = await ServiceMission.find(missionsFilter);
    res.status(200).send(missionList);
  }

  async getMissionsConcerningPassenger(req, res) {
    const requestFilter = {
      submitted_by: req.auth._id,
      status: serviceRequestStatus.ASSIGNED_TO_MISSION.key,
    };
    const serviceRequests = await listServiceRequests(requestFilter, {
      gmt_for_date: 1,
    });

    const missionFilter = {
      "service_requests.request_id": {
        $in: serviceRequests.docs.map((r) => r._id),
      },
      status: {
        $in: [
          serviceMissionStatus.READY.key,
          serviceMissionStatus.ON_ROUTE.key,
        ],
      },
    };

    const { sort, page, include_status_history } = req.query;
    const serviceMissions = await listMissions(
      missionFilter,
      sort,
      page,
      include_status_history
    );
    res.status(200).send(serviceMissions);
  }

  async getMissionsConcerningArea(req, res) {
    const authenticated_user = req.auth._id;

    const dateFilter = readDateFilterFromQuery(req.query);
    const page = parseInt(req.query.page || 1);
    const statusList = readStatusFilterFromQuery(req.query);

    const isPermittedFor = await checkForPermissions(req.auth, [
      PermissionSet.SERVICE.ORG.GET.AREA_FULL,
      PermissionSet.SERVICE.ORG.GET.AREA_LIMITED,
    ]);

    const filter = {
      ...dateFilter,
      status: { $in: statusList },
    };

    if (statusList.length == 0) delete filter.status;

    const hasNoArealPermission =
      isPermittedFor[PermissionSet.SERVICE.ORG.GET.AREA_FULL] == false &&
      isPermittedFor[PermissionSet.SERVICE.ORG.GET.AREA_LIMITED] == false;

    if (hasNoArealPermission) {
      return res.status(200).send({ docs: [] });
    }

    if (
      isPermittedFor[PermissionSet.SERVICE.ORG.GET.AREA_LIMITED] &&
      !isPermittedFor[PermissionSet.SERVICE.ORG.GET.AREA_FULL]
    ) {
      const { regions } = await getRegionsAssignedToUser(authenticated_user);
      if (regions.length == 0) return res.status(200).send({ docs: [] });
      filter.area = { $in: regions.map(({ _id }) => _id) };
    }

    const sort = getSortFromQuery(req.query);

    const missionList = await listMissions(filter, sort, page, true);
    res.status(200).send(missionList);
  }

  async buildMissionDraft(req, res) {
    const userId = req.auth._id;
    const draftMission = await createDraftMission(userId);
    res.status(200).send(draftMission);
    notifyNewServiceMission(draftMission._id);
  }

  async addRequestToMission(req, res) {
    const { mission_id, request_id } = req.params;
    const result = await appendRequestToMission(
      mission_id,
      request_id,
      req.auth._id
    );
    if (result.error) {
      res.status(result.status).send({ error: result.error });
    } else {
      res.status(200).send(result);
      notifyServiceMissionUpdate(mission_id);
    }
  }

  async removeMissionRequest(req, res) {
    const { mission_id, request_id } = req.params;
    const result = await removeRequestFromMission(mission_id, request_id);
    if (result.error) {
      res.status(result.status).send({ error: result.error });
    } else {
      res.status(200).send(result);
      notifyServiceMissionUpdate(mission_id);
    }
  }

  async setMissionOnRoute(req, res) {
    const { mission_id } = req.params;

    const mission = await ServiceMission.findById(mission_id);
    const restriction = await Restriction.findOne({ key: 5 });
    if (restriction?.value != null) {

      const missionTime = moment(mission.gmt_for_date);
      const restrictionMoment = missionTime
        .clone()
        .subtract(restriction.value, "minutes");
      const currenTime = moment();
      if (currenTime.isBefore(restrictionMoment)) {
        notifyErrorMessageToSpecificUser(
          req.auth._id.toString(),
          `امکان شروع ماموریت زود تر از ${restriction.value} دقیقه پیش زمان آن وجود ندارد.`
        );
        return res
          .status(405)
          .send({ error: "you cannot start the mission yet" });
      }
    }

    await updateMissionStatusWithResponse(
      res,
      req.auth._id,
      mission_id,
      serviceMissionStatus.ON_ROUTE.key
    );

    //sgh شروع سفر توسظ راننده
    await notifyAPIStartTripByDriver(mission.service_requests[0].request_id)

  }

  async setMissionReady(req, res) {
    const { mission_id } = req.params;
    await updateMissionStatusWithResponse(
      res,
      req.auth._id,
      mission_id,
      serviceMissionStatus.READY.key
    );
  }

  async setMissionDraft(req, res) {
    const { mission_id } = req.params;
    await updateMissionStatusWithResponse(
      res,
      req.auth._id,
      mission_id,
      serviceMissionStatus.DRAFT.key
    );
  }

  async publishMission(req, res) {
    const { mission_id } = req.params;
    await updateMissionStatusWithResponse(
      res,
      req.auth._id,
      mission_id,
      serviceMissionStatus.PUBLISHED.key
    );
  }

  async setMissionRequestOnRoute(req, res) {
    const { mission_id, request_id } = req.params;
    await updateMissionRequestStatus(
      res,
      req.auth._id,
      mission_id,
      request_id,
      assignedRequestStatus.ON_ROUTE.key,
      null
    );
  }

  async setMissionRequestLocationIndex(req, res) {
    const { mission_id, request_id, index } = req.params;
    await updateMissionRequestStatus(
      res,
      req.auth._id,
      mission_id,
      request_id,
      null,
      parseInt(index)
    );
  }

  async getMissionHistory(req, res) {
    const { mission_id } = req.params;
    const missionUpdateHisotry = await readMissionUpdateHistory(mission_id);
    res
      .status(missionUpdateHisotry == null ? 404 : 200)
      .send({ history: missionUpdateHisotry });
  }

  async getMissionDetails(req, res) {
    const { mission_id } = req.params;
    const mission = await readMissionDetails(mission_id);
    res.status(mission == null ? 404 : 200).send({ mission });
  }

  async removeMissionVehicle(req, res) {
    const { mission_id } = req.params;
    const result = await removeVehicleFromMission(mission_id);
    if (result.error) {
      res.status(result.status).send({ error: result.error });
    } else {
      res.status(200).send(result);
      notifyServiceMissionUpdate(mission_id);
    }
  }

  async setMissionVehilce(req, res) {
    const { mission_id, vehicle_id } = req.params;

    const authenticated_user = req.auth._id;
    const result = await assignVehicleToMission(
      mission_id,
      vehicle_id,
      authenticated_user
    );
    if (result.error) {
      res.status(result.status).send({ error: result.error });
    } else {
      res.status(200).send(result);
      const notif = {
        title: "ماموریت",
        message: "ماموریت جدید به شما اختصاص یافت",
      };
      notifyServiceMissionUpdate(mission_id, notif);
    }
  }

  async getAssignableVechilesForMission(req, res) {
    const { mission_id } = req.params;

    const mission =
      mission_id != "undefined" && (await readMissionDetails(mission_id));

    const filter = {};
    const sort = {};

    await (async function () {
      if (!mission) return;

      const request_id = mission.service_requests[0]?.request?._id;
      if (!request_id) return;

      const firstRequestDetails = await readRequestDetails(request_id);

      const mission_area_id = firstRequestDetails.areas[0]?._id;

      if (!mission_area_id) return;

      filter["latest_location_info.area"] = mission_area_id;
      sort["latest_location_info.gmt_entrance"] = "asc";
    })();

    const operatableVechiles = await listVechilesNoPagination(filter, sort);
    res.status(200).send(operatableVechiles);
  }
}

async function updateMissionStatusWithResponse(
  res,
  applied_by_user,
  mission_id,
  status
) {
  const result = await setMissionStatus(applied_by_user, mission_id, status);
  if (result.error) {
    res.status(result.status).send({ error: result.error });
  } else {
    res.status(200).send(result);
    notifyMissionUpdate(result, mission_id);
  }
}

async function updateMissionRequestStatus(
  res,
  applied_by_user,
  mission_id,
  request_id,
  status,
  index
) {
  const result = await setMissionRequestStatus(
    applied_by_user,
    mission_id,
    request_id,
    status,
    index
  );
  if (result.error) {
    res.status(result.status).send({ error: result.error });
  } else {
    res.status(200).send(result);
    notifyMissionUpdate(result, mission_id);

    //sgh  حرکت به سمت مبدا
    if (status === assignedRequestStatus.ON_ROUTE.key) {
      const mission = await ServiceMission.findById(mission_id);
      // console.log(5566, mission.service_requests[0].request_id);
      await notifyAPIArriveToSource(mission.service_requests[0].request_id)
    }

  }
}



module.exports = new MissionController();

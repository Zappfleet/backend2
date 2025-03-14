const { ObjectId, MongoDecompressionError } = require("mongodb");
const { default: mongoose } = require("mongoose");
const { PAGE_SIZE } = require("../../constants");
const {
  datesAreInSameDay,
  getMongoosePaginateOptions,
} = require("../../utils");
const { findVehicleById } = require("../../vehicles/data");
const { Vehicle } = require("../../vehicles/data/vehicle-model");
const { User } = require("../../_old/modules/user/model");
const moment = require("moment");

const {
  nonEditableStatuses,
  serviceRequestStatus,
  directlySetableStatuses,
  serviceMissionStatus,
  prohibitedMissionStatusOnVehicleUpdate,
  assignedRequestStatus,
  statusUpdateType,
} = require("../constatns");
const { ServiceMission } = require("./mission-model");
const { ServiceRequest } = require("./service-request-model");
const { ServiceStatusHistory } = require("./service-status-history-model");
const { UserAccount } = require("../../users/data/models/user-model");
const Region = require("../../regions/data/region-model");
const { OrgDataSource } = require("../../org-modules/constants/OrgDataSource");
const { getListOfUsers } = require("../../users/data/user");
const { calculateRequestDistance } = require("../../_old/utils/DistanceHelper");
const { notifyAPIArriveToDestination } = require("../../notification-service/notif-API");
const { sendMyIrisaManagerNotification } = require("../../irisa/lib");

const MISSION_NOT_FOUND = { error: "Specified mission not found", status: 404 };
const REQUEST_NOT_FOUND = { error: "Service Request Not Found", status: 404 };
const VEHICLE_NOT_FOUND = { error: "Specified vehicle Not found", status: 404 };

const VEHICLE_UPDATE_NOT_ALLOWED = (status) => {
  return {
    error: {
      error: `you cannot assign, change, remove a vehicle on missions with status ${status}`,
      status: 405,
    },
    status: 404,
  };
};

async function listMissions(
  filter = {},
  sort,
  page = 1,
  include_status_history = false,
  paging
) {

  const paginateOptions = getMongoosePaginateOptions(page, sort);

  paginateOptions.populate = [
    { path: "vehicle_id", populate: { path: "driver_user" } },
    {
      path: "service_requests",
      populate: { path: "request_id", populate: { path: "submitted_by" } },
    },
    { path: "area" },
    { path: "assigned_by" },
    { path: "created_by" },
  
  ];

  // console.log(600, paging, !(paging == 'false' || paging == false));
  const result = (paging == 'false' || paging == false) ?// await ServiceMission.find(filter) 
    await ServiceMission.aggregate([
      {
        $match: filter // Apply the filter here
      },
      // First lookup to join servicerequests with servicemissions
      {
        $lookup: {
          from: "servicerequests",
          localField: "service_requests.request_id",
          foreignField: "_id",
          as: "result"
        }
      },
      // Unwind the result array to process individual service requests
      {
        $unwind: "$result"
      },
      // First lookup to get projectManager details
      {
        $lookup: {
          from: "useraccounts",
          let: { employeeNumber: "$result.details.project.EMPLOYEE_NUMBER" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$details.personel_code", "$$employeeNumber"]
                }
              }
            },
            {
              $project: {
                full_name: 1
              }
            }
          ],
          as: "projectManager"
        }
      },
      // Second lookup to join useraccounts with the result
      {
        $lookup: {
          from: "useraccounts",
          localField: "result.submitted_by",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      // Unwind the userDetails array to get individual user details
      {
        $unwind: "$userDetails"
      },
      //////////////////assigned_by
      {
        $lookup: {
          from: "useraccounts",
          localField: "assigned_by",
          foreignField: "_id",
          as: "assigned_by_FullName"
        }
      },
      // Unwind the userDetails array to get individual user details
      {
        "$unwind": {
          "path": "$assigned_by_FullName",
          "preserveNullAndEmptyArrays": true
        }
      },
      //////////////////vehicle
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle_id",
          foreignField: "_id",
          as: "vehicleDetails"
        }
      },
      // Unwind the userDetails array to get individual user details
      {
        "$unwind": {
          "path": "$vehicleDetails",
          "preserveNullAndEmptyArrays": true
        }
      },
      //////////////////driverInfo
      {
        $lookup: {
          from: "useraccounts",
          localField: "driver_id",
          foreignField: "_id",
          as: "DriverInfo"
        }
      },
      // Unwind the userDetails array to get individual user details
      {
        "$unwind": {
          "path": "$DriverInfo",
          "preserveNullAndEmptyArrays": true
        }
      },
      // Add the final fields using the data from previous lookups
      {
        $addFields: {
          managerOfProject: {
            $cond: {
              if: {
                $and: [
                  { $ne: [{ $type: "$result.details.project" }, "missing"] },
                  { $ne: ["$result.details.project", undefined] }
                ]
              },
              then: {
                $arrayElemAt: ["$projectManager.full_name", 0] // Getting the full_name from projectManager
              },
              else: {
                $cond: {
                  if: {
                    $and: [
                      { $ne: [{ $type: "$result.details.costCenter" }, "missing"] },
                      { $ne: ["$result.details.costCenter", undefined] }
                    ]
                  },
                  then: "$result.details.costCenter.MANGER_NAME",
                  else: null
                }
              }
            }
          }
        }
      },
      // Project the fields you need
      {
        $project: {
          id: "$_id",
          mission_date: "$result.gmt_for_date", // Renaming gmt_for_date to mission_date
          created_by: "$userDetails.full_name",  // Renaming full_name to created_by
          distance: { $ifNull: ["$result.details.distance", null] },
          dispature: {
            $cond: {
              if: { $or: [{ $eq: ["$assigned_by_FullName.full_name", ""] }, { $eq: ["$assigned_by_FullName.full_name", null] }] },
              then: "$assigned_by_FullName.username",
              else: "$assigned_by_FullName.full_name"
            }
          },
          status: "$status",
          project_Code: "$result.details.proj_code",
          proj_desc: "$result.details.proj_desc",
          manager_emp_num: "$result.details.manager_emp_num",
          cost_center: "$result.details.cost_center",
          desc: "$result.details.desc",
          cost: "$extra.cost",
          driverName: {
            $cond: {
              if: { $eq: ["$vehicleDetails.group", "agency"] },
              then: "$vehicleDetails.extra.agency_name",
              else: "$DriverInfo.full_name"
            }
          },
          managerOfProject: 1, // Just passing the managerOfProject field
          vehicleID: "$vehicleDetails._id",
          locations: "$result.locations",
          vehiclePlaque: "$vehicleDetails.plaque",
          vehicleName: "$vehicleDetails.extra.name",
          vehicleColor: "$vehicleDetails.extra.color",
          extra: "$extra",
          service_requests: "$service_requests",
          request: "$result"
        }
      }
    ])

    :
    await ServiceMission.aggregate([
      {
        $match: filter || {}// Apply the filter here
      }]);

  //console.log(77, paging, typeof paging, filter, paging == false, result);


  if (paging == 'false' || paging == false) {
    // console.log(5649871, result);
    return result;
  }

  if (include_status_history) {
    const historyFilter = {
      type: statusUpdateType.MISSION_STATUS_UPDATE.key,
      service_mission: {
        $in: result?.docs?.map((document) => {
          return document._id;
        }),
      },
    };
    const historyUpdates = await ServiceStatusHistory.find(historyFilter)
      .sort({ createdAt: -1 })
      .populate("applied_by_user");
    const historyUpdateKeyValuePairs = {};
    historyUpdates.map((updateItem) => {
      const service_mission_id = updateItem.service_mission.toString();
      if (historyUpdateKeyValuePairs[service_mission_id] == null)
        historyUpdateKeyValuePairs[service_mission_id] = [];

      historyUpdateKeyValuePairs[service_mission_id].push(updateItem);
    });
    result.mission_status_history = historyUpdateKeyValuePairs;
  }

  return result;
}
async function readRequestUpdateHistory(service_id) {
  const history = await ServiceStatusHistory.find({
    service_request: new ObjectId(service_id),
  })
    .populate({ path: "applied_by_user", select: "-password" })
    .populate("service_request");
  return history;
}

async function readMissionUpdateHistory(mission_id) {
  const history = await ServiceStatusHistory.find({
    service_mission: new ObjectId(mission_id),
  })
    .populate({ path: "applied_by_user", select: "-password" })
    .populate("service_request");
  return history;
}

async function getMissionDetailsMongoObject(mission_id) {
  if(!mission_id || !mongoose.Types.ObjectId.isValid(mission_id)){
    throw new Error ('invalid mission Id')
  }
  const mission = await ServiceMission.findById(mission_id)
    .populate("service_requests.request_id")
    .populate({ path: "assigned_by", select: "-password" })
    .populate({ path: "created_by", select: "-password" })
    .populate({
      path: "vehicle_id",
      populate: { path: "driver_user", select: "-password" },
    });
  return mission;
}

async function readMissionDetails(mission_id) {
  const mission = await getMissionDetailsMongoObject(mission_id);
  if (mission == null) return null;

  const missionObj = mission.toObject();

  missionObj.vehicle = missionObj.vehicle_id;
  delete missionObj.vehicle_id;

  missionObj.service_requests = await Promise.all(
    missionObj.service_requests.map(async (item) => {
      const processed = { ...item, request: item.request_id };
      processed.request.submitted_by = await UserAccount.findById(
        processed.request.submitted_by
      ).select("-password");
      delete processed.request_id;
      return processed;
    })
  );

  return missionObj;
}

async function createHiddenMission(created_by_id, extra) {
  return await ServiceMission.create({
    created_by: created_by_id,
    status: serviceMissionStatus.HIDDEN.key,
    extra,
  });
}

async function createDraftMission(created_by) {
  if (created_by == null) throw { message: "please specify created_by" };

  const created_by_id = new ObjectId(created_by);
  const existingDraft = await ServiceMission.findOne({
    created_by: created_by_id,
    status: serviceMissionStatus.DRAFT.key,
  });
  if (existingDraft != null) {
    return await readMissionDetails(existingDraft._id);
  }
  return await ServiceMission.create({ created_by: created_by_id });
}

async function createImmediateMission(args) {
  return await ServiceMission.create(args);
}

async function fullDeleteMission(mission_id, request_ids) {
  await ServiceMission.findByIdAndDelete(mission_id);
  await ServiceRequest.deleteMany({ _id: { $in: request_ids } });
}

async function appendRequestToMission(mission_id, request_id, assigner_id) {
  const mission = await ServiceMission.findById(mission_id);
  const request = await ServiceRequest.findById(request_id);
  if (mission == null) return MISSION_NOT_FOUND;
  if (request == null) return REQUEST_NOT_FOUND;

  if (request.status == serviceRequestStatus.ASSIGNED_TO_MISSION.key) {
    return { error: "Request already assigned", status: 405 };
  }

  //sgh distance
  // Adding or updating the distance property in mission.extra
  mission.extra.distance = request.details.distance;
  if (request.details.is_free) {
    mission.extra.is_free = request.details.is_free
    mission.extra.free_fullname = request.details.free_fullname
  }



  const otherServiceRequests = await mission.getDetailedServiceRequests();
  const existingDates = otherServiceRequests.map((item) => item.gmt_for_date);
  existingDates.push(new Date(request.gmt_for_date));
  if (!datesAreInSameDay(existingDates)) {
    return { error: "all requests must start in the same day", status: 405 };
  }

  if (mission.vehicle_id != null) {
    const vechileDetails = await findVehicleById(mission.vehicle_id);
    if (
      vechileDetails.services.find((item) => item.service == request.service) ==
      null
    ) {
      return {
        error: `mission vechile does not support this service : ${request.service}`,
        status: 405,
      };
    }
  }


  mission.service_requests.push({
    request_id: request._id,
  });

  const missionResult = await ServiceMission.findByIdAndUpdate(
    { _id: mission._id },
    {
      $push: { service_requests: { request_id: request._id } },
      $set: { extra: mission.extra } // Use $set to update the extra field
    },
    { new: true }
  );


  const old_status = request.status;
  const new_status = serviceRequestStatus.ASSIGNED_TO_MISSION.key;

  const requestResult = await ServiceRequest.findByIdAndUpdate(
    request._id,
    { $set: { status: new_status } },
    { new: true }
  );
  await insertMissionServiceStatusHistoryEntry(
    assigner_id,
    missionResult._id,
    request._id,
    old_status,
    new_status
  );

  return { mission: missionResult, serviceRequest: requestResult };
}

async function removeRequestFromMission(mission_id, request_id) {
  const { mission, request, error } = await checkIfRequestExistsInMission(
    mission_id,
    request_id
  );

  if (error) return error;

  const missionResult = await ServiceMission.findByIdAndUpdate(
    mission._id,
    { $pull: { service_requests: { request_id: request._id } } },
    { new: true }
  );
  const requestResult = await ServiceRequest.findByIdAndUpdate(
    request._id,
    { $set: { status: serviceRequestStatus.CONFIRM.key } },
    { new: true }
  );

  return { mission: missionResult, serviceRequest: requestResult };
}

async function assignVehicleToMission(mission_id, vehicle_id, assigner_id) {
  if (assigner_id == null)
    throw { message: "Programmer error : please set assigner_id" };

  const mission = await ServiceMission.findById(mission_id);
  const vehicle = await Vehicle.findById(vehicle_id).populate("driver_user");

  if (mission == null) return MISSION_NOT_FOUND;
  if (vehicle == null) return VEHICLE_NOT_FOUND;

  if (!vehicle.isAgencyVehicle() && vehicle.driver_user == null) {
    return { error: "Specified vehicle does not have a driver", status: 405 };
  }

  if (prohibitedMissionStatusOnVehicleUpdate.includes(mission.status)) {
    return VEHICLE_UPDATE_NOT_ALLOWED(mission.status);
  }

  const compatibilityCheck = await vehicleMissionCompatiblityCheck(
    mission,
    vehicle
  );

  if (!vehicle.isAgencyVehicle() && compatibilityCheck?.error) {
    return { error: compatibilityCheck.error, status: 405 };
  }

  const updatedMission = await ServiceMission.findByIdAndUpdate(
    mission._id,
    {
      $set: {
        vehicle_id: vehicle._id,
        driver_id: vehicle.driver_user?._id,
        assigned_by: new ObjectId(assigner_id),
      },
    },
    { new: true }
  );

  // await insertMissionStatusHistoryEntry(assigner_id , mission._id , )

  if (vehicle.latest_location_info != null) {
    vehicle.latest_location_info.gmt_entrance = new Date();
    vehicle.markModified("latest_location_info");
    await vehicle.save();
  }

  return { mission: updatedMission, vehicle };
}

async function removeVehicleFromMission(mission_id) {
  const mission = await ServiceMission.findById(mission_id);
  if (mission == null) return MISSION_NOT_FOUND;

  if (prohibitedMissionStatusOnVehicleUpdate.includes(mission.status)) {
    return VEHICLE_UPDATE_NOT_ALLOWED(mission.status);
  }

  const updatedMission = await ServiceMission.findByIdAndUpdate(
    mission._id,
    { $set: { vehicle_id: null } },
    { new: true }
  );

  return { mission: updatedMission };
}
 


async function setMissionStatus(applied_by_user, mission_id, status) {
  const mission = await ServiceMission.findById(mission_id).populate(
    "service_requests.request_id"
  );
  if (mission == null) return MISSION_NOT_FOUND;

  if (mission.status == serviceMissionStatus.DONE.key) {
    return {
      error: "the mission status is done and cannot be changed",
      status: 405,
    };
  }

  if (
    mission.status == serviceMissionStatus.DRAFT.key &&
    status == serviceMissionStatus.ON_ROUTE.key
  ) {
    return { error: "you cannot set a draft mission to on route", status: 405 };
  }

  if (status == serviceMissionStatus.PUBLISHED.key) {
    const compatibilityCheck = await missionRequestDatesCompatiblityCheck(
      mission
    );
    if (compatibilityCheck?.error) {
      return { error: compatibilityCheck.error, status: 405 };
    }
  }

  if (status == null) {
    return {
      error: `You cannot directly set a mission's status as ${status}`,
      status: 405,
    };
  }

  const args = { status };

  if (status == serviceMissionStatus.DRAFT.key) {
    args.gmt_for_date = null;
    args.area = null;
  }

  if (status == serviceMissionStatus.PUBLISHED.key) {
    args.gmt_for_date = minimumDateTimeOf(mission);
    args.area = (await locateMissionArea(mission))._id;
  }

  const status_from = mission.status;
  const updatedMission = await ServiceMission.findByIdAndUpdate(
    mission._id,
    { $set: args },
    { new: true }
  );
  const history_entry = await insertMissionStatusHistoryEntry(
    applied_by_user,
    mission._id,
    status_from,
    status
  );

  return { mission: updatedMission, history_entry };
}

async function readTimingInfoFor(mission_id) {
  const missionStatusUpdates = await ServiceStatusHistory.find({
    service_mission: new ObjectId(mission_id),
  }).sort({ createdAt: 1 });
  const timing = {};
  for (let i = 0; i < missionStatusUpdates.length; i++) {
    if (
      missionStatusUpdates[i].update_info.status_to ==
      serviceMissionStatus.ON_ROUTE.key
    ) {
      timing.mission_start = missionStatusUpdates[i].createdAt;
    }
  }
  for (let i = missionStatusUpdates.length - 1; i >= 0; i--) {
    if (
      missionStatusUpdates[i].update_info.status_to ==
      serviceMissionStatus.DONE.key
    ) {
      timing.mission_end = missionStatusUpdates[i].createdAt;
    }
  }
  if (timing.mission_start && timing.mission_end) {
    const duration = moment.duration(
      moment(timing.mission_end).diff(moment(timing.mission_start))
    );
    timing.mission_duration = duration.asMinutes();
    timing.mission_duration_formatted = moment
      .utc(duration.asMilliseconds())
      .format("HH:mm:ss");
  }
  return timing;
}

async function setMissionRequestStatus(
  applied_by_user,
  mission_id,
  request_id,
  status,
  current_location_index
) {
  const { mission, request, error } = await checkIfRequestExistsInMission(
    mission_id,
    request_id
  );
  if (error) return error;

  const missionRequestItem = mission.service_requests.find((item) =>
    item.request_id.equals(request_id)
  );

  const status_from = missionRequestItem.status;
  let status_to = status;
  let location_index_from = null;
  let location_index_to = null;

  if (status) missionRequestItem.status = status;

  if (!Number.isNaN(parseInt(current_location_index))) {
    location_index_from = missionRequestItem.current_location_index;
    location_index_to = current_location_index;

    missionRequestItem.current_location_index = current_location_index;
    if (current_location_index == request.locations.length - 1) {
      missionRequestItem.status = assignedRequestStatus.DONE.key;
    }
  }

  if (mission.allRequestsAreDone()) {
    mission.status = serviceMissionStatus.DONE.key;
    status_to = serviceMissionStatus.DONE.key;
  }

  await mission.save();

  const history_entry = [];
  if (location_index_to != null) {
    history_entry.push(
      await insertMissionServiceDriverLocationHistoryEntry(
        applied_by_user,
        mission_id,
        request_id,
        location_index_from,
        location_index_to
      )
    );
  }

  if (status_to) {
    history_entry.push(
      await insertMissionServiceStatusHistoryEntry(
        applied_by_user,
        mission_id,
        request_id,
        status_from,
        status_to
      )
    );
  }

  if ((status_to = serviceMissionStatus.DONE.key)) {
    mission.extra = {
      ...mission.extra,
      ...(await readTimingInfoFor(mission._id)),
    };
  }
  await mission.save();

  //sgh سفر به پایان رسید
  if ((status_to = serviceMissionStatus.DONE.key)) {
    await notifyAPIArriveToDestination(mission.service_requests[0].request_id)
  }

  return { mission, history_entry };
}

async function checkIfRequestExistsInMission(mission_id, request_id) {
  const result = {};

  const mission = await ServiceMission.findById(mission_id);
  const request = await ServiceRequest.findById(request_id);
  if (mission == null) result.error = MISSION_NOT_FOUND;
  if (request == null) result.error = REQUEST_NOT_FOUND;

  const requestNotAssigned =
    mission.service_requests.find((request) => {
      return request.request_id.equals(request_id);
    }) == null;
  if (requestNotAssigned) {
    result.error = {
      error: "This request is not placed in this mission",
      status: 405,
    };
  }

  result.mission = mission;
  result.request = request;

  return result;
}

async function readRequestDetails(_id) {
  // console.log(45);
  const serviceRequest = await ServiceRequest.findById(_id);
  if (!serviceRequest) return null;

  const requestDetails = serviceRequest.toObject();

  requestDetails.submitted_by = await UserAccount.findOne({
    _id: new ObjectId(requestDetails.submitted_by),
  });

  requestDetails.areas = await locateRequestAreas(requestDetails);

  return requestDetails;
}

async function listServiceRequests(
  filter = {},
  sort = { gmt_for_date: -1 },
  page = 0,
  paging
) {
  const {
    area_id,
    gmt_from,
    gmt_to,
    service,
    submitted_by,
    status,
    search,
    ...extra
  } = filter;

  const effectiveFilter = { ...extra };
  if (area_id) {
    const area = await Region.findOne({ _id: new ObjectId(area_id) });
    effectiveFilter["locations.coordinates"] = {
      $geoIntersects: { $geometry: area.location },
    };
  }

  if (gmt_from || gmt_to) {
    effectiveFilter.gmt_for_date = {};
    gmt_from && (effectiveFilter.gmt_for_date["$gte"] = new Date(gmt_from));
    gmt_to && (effectiveFilter.gmt_for_date["$lt"] = new Date(gmt_to));
  }

  service && (effectiveFilter.service = service);
  submitted_by && (effectiveFilter.submitted_by = new ObjectId(submitted_by));

  if (status != null) {
    if (Array.isArray(status)) {
      effectiveFilter.$or = status.map((s) => {
        return { status: s };
      });
    } else {
      effectiveFilter.status = status;
    }
  }

  const paginateOptions = getMongoosePaginateOptions(page, sort);

  paginateOptions.populate = [
    {
      path: "submitted_by",
      select: ["-password"],
    },
    {
      path: "confirmed_by",
      select: ["-password"], // اطمینان از بازیابی full_name
    },

  ];

  if (search?.trim().length > 0) {
    const usersFilter = {
      $or: [
        { username: { $regex: search.trim() } },
        { full_name: { $regex: search.trim() } },
        { "details.details.personel_code": { $regex: search.trim() } },
      ],
    };
    const users = await getListOfUsers(usersFilter);
    effectiveFilter.submitted_by = { $in: users.map(({ _id }) => _id) };
  }


  //console.log(852, paging);
  const result = paging ?
    // await ServiceRequest.aggregate([
    //   {
    //     $match: effectiveFilter, // اعمال فیلتر اولیه
    //   },
    //   {
    //     $lookup: {
    //       from: "users", // نام مجموعه‌ی مربوط به کاربر
    //       localField: "confirmed_by", // فیلدی که باید مرتبط شود
    //       foreignField: "_id", // کلید اصلی در مجموعه کاربران
    //       as: "confirmed_by", // نام خروجی
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "users",
    //       localField: "rejected_by",
    //       foreignField: "_id",
    //       as: "rejected_by",
    //     },
    //   },
    //   {
    //     $addFields: {
    //       managerOfProject: {
    //         $cond: {
    //           if: {
    //             $and: [
    //               { $ne: [{ $type: "$details.project" }, "missing"] },
    //               { $ne: ["$details.project", undefined] },
    //             ],
    //           },
    //           then: {
    //             $arrayElemAt: ["$projectManager.full_name", 0],
    //           },
    //           else: {
    //             $cond: {
    //               if: {
    //                 $and: [
    //                   { $ne: [{ $type: "$details.costCenter" }, "missing"] },
    //                   { $ne: ["$details.costCenter", undefined] },
    //                 ],
    //               },
    //               then: "$details.costCenter.MANGER_NAME",
    //               else: null,
    //             },
    //           },
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       confirmed_by: 1,
    //       rejected_by: 1,
    //       managerOfProject: 1,
    //       otherFields: 1, // سایر فیلدهایی که نیاز دارید
    //     },
    //   },
    // ])

     await ServiceRequest.find(effectiveFilter).populate([
      { path: "confirmed_by", select: "full_name" }, // بازیابی full_name
      { path: "rejected_by", select: "full_name" },
      { path: "submitted_by", select: "-password" },
    ])
    :
    await ServiceRequest.paginate(
      effectiveFilter,
      paginateOptions
    )


  return result;
}




async function createServiceRequest(
  submitted_by,
  locations,
  service,
  gmt_for_date,
  details = {},
  status,
  confirmed_by
) {

  // console.log(800, submitted_by);
  try {
    const doc = {
      locations,
      service,
      details,
      gmt_for_date: new Date(gmt_for_date),
      submitted_by: new Object(submitted_by),
      status,
      confirmed_by,
    };

    //sgh calculate distance 

    // console.log("Number of locations:", locations.length);
    let Total_distance = 0
    await Promise.all(
      locations.map(async (location, index) => {
        if (index < locations.length - 1) {
          let newlocation = {};
          let distance;

          newlocation = {
            start: {
              lnglat: [location.coordinates[1], location.coordinates[0]]
            },
            finish: {
              lnglat: [locations[index + 1].coordinates[1], locations[index + 1].coordinates[0]]
            }
          };

          distance = await calculateRequestDistance(newlocation);
          Total_distance += distance ? distance.distance : 0;
        }
      })
    )

    doc.details.distance = Total_distance

    ///////////////////////////////////////////////



    const regions = await locateRequestAreas(doc);
    doc.area = regions[0];
    // console.log(1);

    let managerCode = null
    if (OrgDataSource.requestProcessorModule) {
      //  console.log(2);
      const processor = require(`../modules/${OrgDataSource.requestProcessorModule}`);
      // console.log(3, doc);
      const processResult = await processor(doc);
      //  console.log(7000,processResult);
      if (processResult?.error) {
        switch (processResult?.status) {
          case 300: return { error: 'پروژه منقضی شده است', status: 300 };
          case 301: return { error: 'پروژه وجود ندارد', status: 301 };
          case 400: return { error: 'مرکز هزینه وجود ندارد', status: 400 };
        }
        return { error: 'خطایی رخ داده است', status: 4402 };
      }
      managerCode = processResult?.status === 200 ? processResult?.data : null
    }

    const newRequest = await ServiceRequest.create(doc);
    // console.log(3576878, managerCode);
    const regionInfo = await Region.findOne({ _id: newRequest?.area?._id })
    const managerID = await UserAccount.findOne({
      "details.personel_code": { $exists: true, $eq: managerCode }
    })
    // console.log(888888, managerID, managerCode);
    const needApprove = (regionInfo && regionInfo?.properties?.need_manager_confirmation) ? false : true
    const manager = {
      _id: managerID?._id,
      personel_code: managerCode
    }
    await sendMyIrisaManagerNotification(newRequest, manager, needApprove)
    //  console.log(4444, newRequest);
    return newRequest;
  } catch (e) {
    const dbError = e.error?.errors?.extra?.properties?.message;
    return { error: dbError || e.message, status: dbError ? 422 : 500 };
  }
}

async function updateServiceStatus(_id, new_status, updater_id) {


  const serviceRequest = await ServiceRequest.findById(_id);
  // console.log(5555555555, _id);
  const old_status = serviceRequest.status;

  const error = await generalUpdateValidationCheck(serviceRequest);
  if (error) {
    return error;
  }

  // console.log(88888888);

  if (!directlySetableStatuses.includes(new_status)) {
    return {
      error: `you cannot directly set status to ${new_status}`,
      status: 405,
    };
  }
  let args = { $set: { status: new_status } };

  const updater_key = (function () {
    switch (new_status) {
      case serviceRequestStatus.REJECT.key:
        return "rejected_by";
      case serviceRequestStatus.CONFIRM.key:
        return "confirmed_by";
      default:
        return null;
    }
  })();

  // console.log(3333333333, updater_key);

  if (updater_key != null) {
    args.$set[updater_key] = new ObjectId(updater_id);
  }



  //console.log(444444444, _id, args);

  const newRequest = await ServiceRequest.findByIdAndUpdate(
    new ObjectId(_id),
    args,
    { new: true }
  );

  if (!newRequest) {
    console.log(9999, "Document not found or update failed");
  } else {
    console.log(99999, "Update successful", newRequest);
  }

  insertMissionServiceStatusHistoryEntry(
    updater_id,
    null,
    _id,
    old_status,
    new_status
  );

  return newRequest;
}

async function getRequestServiceMissionIfExists(request_id) {
  return await ServiceMission.findOne({
    "service_requests.request_id": new ObjectId(request_id),
  });
}

async function updateServiceRequest(
  _id,
  locations,
  service,
  gmt_for_date,
  details,
  ignoreStatus = false
) {
  const serviceRequest = await ServiceRequest.findById(_id);

  const error = await generalUpdateValidationCheck(serviceRequest);
  if (error && !ignoreStatus) {
    return error;
  }

  try {
    const args = {
      confirmed_by: null,
      status: serviceRequestStatus.PENDING.key,
    };
    locations && (args.locations = locations);
    service && (args.service = service);
    details && (args.details = details);
    gmt_for_date && (args.gmt_for_date = gmt_for_date);
    const newRequest = await ServiceRequest.findByIdAndUpdate(
      new ObjectId(_id),
      { $set: args },
      { new: true, runValidators: true }
    );
    return newRequest;
  } catch (e) {
    const dbError = e.error?.errors?.extra?.properties?.message;
    return { error: dbError || e.message, status: dbError ? 422 : 500 };
  }
}

function minimumDateTimeOf(mission) {
  const minDate = mission.service_requests.reduce((min, currentValue) => {
    if (min == null) return currentValue.request_id.gmt_for_date;
    const minTime = min.getTime();
    const currentTime = currentValue.request_id.gmt_for_date.getTime();
    return currentTime < minTime ? currentValue.request_id.gmt_for_date : min;
  }, null);
  return minDate;
}

async function generalUpdateValidationCheck(serviceRequest) {
  if (serviceRequest == null) {
    return REQUEST_NOT_FOUND;
  }

  // console.log(546, process.env.MODE !== "development");

  // if (process.env.MODE !== "development") {
  //   return false
  // }

  if (nonEditableStatuses.includes(serviceRequest.status)) {
    return {
      error: `Status update to ${serviceRequest.status} not permitted`,
      status: 422,
    };
  }
  // serviceRequest.status
  if (serviceRequestStatus.ASSIGNED_TO_MISSION.key == serviceRequest.status) {
    const mission = await getRequestServiceMissionIfExists(serviceRequest._id);
    if (
      serviceMissionStatus.PUBLISHED.key != mission.status &&
      serviceMissionStatus.DRAFT.key != mission.status
    ) {
      return {
        error: `Status update to ${serviceRequest.status} when mission is set as ready`,
        status: 422,
      };
    }
  }

}

async function insertMissionServiceDriverLocationHistoryEntry(
  applied_by_user,
  service_mission,
  service_request,
  location_index_from,
  location_index_to
) {
  const historyEntriy = await ServiceStatusHistory.create({
    type: statusUpdateType.DRIVER_LOCATION_UPDATE.key,
    update_info: {
      location_index_from,
      location_index_to,
    },
    service_request,
    service_mission,
    applied_by_user,
  });
  return historyEntriy;
}

async function insertMissionServiceStatusHistoryEntry(
  applied_by_user,
  service_mission,
  service_request,
  status_from,
  status_to
) {
  const historyEntriy = await ServiceStatusHistory.create({
    type: statusUpdateType.REQUEST_STATUS_UPDATE.key,
    update_info: {
      status_from,
      status_to,
    },
    service_request,
    service_mission,
    applied_by_user,
  });
  return historyEntriy;
}

async function insertMissionStatusHistoryEntry(
  applied_by_user,
  service_mission,
  status_from,
  status_to
) {
  const historyEntriy = await ServiceStatusHistory.create({
    type: statusUpdateType.MISSION_STATUS_UPDATE.key,
    update_info: {
      status_from,
      status_to,
    },
    service_mission,
    applied_by_user,
  });
  return historyEntriy;
}

async function locateRequestAreas(requestDetails) {
  const regions = await Region.find({
    geometry: {
      $geoIntersects: {
        $geometry: {
          type: "LineString",
          coordinates: requestDetails.locations.map((loc) => {
            return [loc.coordinates[1], loc.coordinates[0]];
          }),
        },
      },
    },
    is_active: true,
  });
  return regions;
}

async function locateMissionArea(mission) {
  const request = await ServiceRequest.findById(
    mission.service_requests[0].request_id
  );
  const areas = await locateRequestAreas(request);
  return areas[0];
}

async function missionRequestDatesCompatiblityCheck(mission) {
  const serviceRequests = await mission.getDetailedServiceRequests();
  if (datesAreInSameDay(serviceRequests.map((item) => item.gmt_for_date))) {
    return null;
  }
  return {
    error: `all requests must start in the same day`,
  };
}

async function vehicleMissionCompatiblityCheck(mission, vehicle) {
  const serviceRequests = await mission.getDetailedServiceRequests();

  if (vehicle == null) {
    vehicle = await Vehicle.findById(mission.vehicle_id);
  }

  const vehicleServices = vehicle.services;
  const vechileServiceTypes = vehicleServices.map((item) => item.service);
  const requestedServiceTypes = serviceRequests.map((item) => item.service);

  for (let i = 0; i < requestedServiceTypes.length; i++) {
    const isIncluded = vechileServiceTypes.includes(requestedServiceTypes[i]);
    if (!isIncluded) {
      return {
        error: `the vehicle does not support all requested services : ${requestedServiceTypes[i]}`,
      };
    }
  }

  const requestedServiceRequiredCapacity = {};
  for (let i = 0; i < serviceRequests.length; i++) {
    if (requestedServiceRequiredCapacity[serviceRequests[i].service] == null) {
      requestedServiceRequiredCapacity[serviceRequests[i].service] = 0;
    }
    requestedServiceRequiredCapacity[serviceRequests[i].service] +=
      serviceRequests[i].getRequiredCapacity();
  }

  for (let i = 0; i < vehicleServices.length; i++) {
    if (
      requestedServiceRequiredCapacity[vehicleServices[i].service] >
      vehicleServices[i].capacity
    ) {
      return {
        error: `not enough capacity : ${requestedServiceRequiredCapacity[vehicleServices[i].service]
          }`,
      };
    }
  }

  return null;
}

module.exports.createServiceRequest = createServiceRequest;
module.exports.updateServiceRequest = updateServiceRequest;
module.exports.updateServiceStatus = updateServiceStatus;
module.exports.listServiceRequests = listServiceRequests;
module.exports.readRequestDetails = readRequestDetails;

module.exports.createDraftMission = createDraftMission;
module.exports.appendRequestToMission = appendRequestToMission;
module.exports.removeRequestFromMission = removeRequestFromMission;
module.exports.assignVehicleToMission = assignVehicleToMission;
module.exports.removeVehicleFromMission = removeVehicleFromMission;
module.exports.setMissionStatus = setMissionStatus;
module.exports.readMissionDetails = readMissionDetails;
module.exports.listMissions = listMissions;
module.exports.createImmediateMission = createImmediateMission;

module.exports.getRequestServiceMissionIfExists =
  getRequestServiceMissionIfExists;

module.exports.setMissionRequestStatus = setMissionRequestStatus;

module.exports.readMissionUpdateHistory = readMissionUpdateHistory;

module.exports.readRequestUpdateHistory = readRequestUpdateHistory;

module.exports.getMissionDetailsMongoObject = getMissionDetailsMongoObject;

module.exports.createHiddenMission = createHiddenMission;

module.exports.fullDeleteMission = fullDeleteMission;

const { ObjectId } = require("mongodb");
const {
  notifyServiceMissionUpdate,
  notifyNewServiceMission,
  notifyErrorMessageToSpecificUser,
  sendNotificationToUsers,
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
const { ServiceRequest } = require("../data/service-request-model");
const { UserAccount } = require("../../users/data/models/user-model");

const sendEmptyResults = (res) => res.status(200).send({ docs: [] });

class MissionController {
  async buildFullMission(req, res) {


    let { data: requestsList, extra, vehicle_id } = req.body;


    //console.log(66, requestsList, extra, vehicle_id);
    const hiddenMission = await createHiddenMission(req.auth._id, extra);



    const fullResult = await Promise.all(
      requestsList?.map(async (data) => {
        let { locations, service, gmt_for_date, submitted_for } = data;

        if (1 === 1) {
          //sgh taksisroys
          service = "taksisroys"
        }
        const submitted_by = await (async function () {
          //console.log(333, submitted_for);
          if (!submitted_for.is_free) {
            if (submitted_for.is_external) {
              return await getExternalSourceUser(submitted_for);
            } else {

              //  console.log(55, submitted_for);
              return await getUserById(submitted_for._id);
            }
          }
          else {
            return req.auth._id
          }

        })();

        //console.log(1,submitted_by);

        const details = {
          direct_request: false,
          indirectly_submitted_by: req.auth._id,
        };

        if (submitted_for.is_free) {
          details.is_free = true;
          details.free_fullname = submitted_for.full_name
        }

        //  console.log(4008, gmt_for_date, 'problem in get date');

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
        // console.log(188, results);
        return results;
      })
    );


    // console.log(9000);
    async function deleteAll() {
      await fullDeleteMission(
        hiddenMission._id,
        fullResult.map((service) => service[0]._id)
      );
    }

    // console.log(5666, fullResult);
    for (let i = 0; i < fullResult.length; i++) {
      const service = fullResult[i];
      // console.log(2011, i, service);
      if (service.error) {
        res.status(service.status).send(service.error);
        await deleteAll();
        return;
      }
      //console.log(9001);
      const appendResult = await appendRequestToMission(
        hiddenMission._id,
        service[0]._id,
        req.auth._id
      );
      // console.log(9002, appendResult.error);

      if (appendResult.error) {
        res.status(appendResult.status).send(appendResult.error);
        await deleteAll();
        return;
      }
      // console.log(9003);
    }

    // console.log(9898);
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

    //console.log(300, driverVehicles.docs);
    const dateFilter = readDateFilterFromQuery(req.query);

    const filter = {
      vehicle_id: { $in: driverVehicles.docs.map((vehcile) => vehcile._id) },
      ...dateFilter,
    };




    const missionList = await listMissions(
      filter,
      req.query.sort,
      parseInt(req.query.page || 0),
      undefined,
      req.query.paging
    );

    res.status(200).send(missionList);
  }

  async getMissions_by_StatusAndDriverID(req, res) {
    try {
      const { status, driverID } = req.query;
      let missionsFilter = {};

      if (driverID) {
        missionsFilter.driver_id = new ObjectId(driverID);
      }

      if (status) {
        missionsFilter.status = status;
      }

      const missionList = await ServiceMission.aggregate([
        {
          $match: missionsFilter
        },
        {
          $lookup: {
            from: 'useraccounts', // The name of the users collection
            localField: 'driver_id',
            foreignField: '_id',
            as: 'driver'
          }
        },
        {
          $unwind: {
            path: '$driver',
            preserveNullAndEmptyArrays: true // Preserves missions without drivers
          }
        },
        {
          $project: {
            _id: 1,
            service_requests: 1,
            vehicle_id: 1,
            driver_id: 1,
            assigned_by: 1,
            created_by: 1,
            gmt_for_date: 1,
            status: 1,
            reviews: 1,
            extra: 1,
            createdAt: 1,
            updatedAt: 1,
            driver_full_name: '$driver.full_name',// Include the driver's full name
            driver_phone: '$driver.phone'
          }
        }
      ]);

      res.status(200).send(missionList);
    } catch (error) {
      console.error('Error fetching missions:', error);
      res.status(500).send({ error: 'Internal Server Error' });
    }
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
            /*serviceMissionStatus.READY.key,*/
            serviceMissionStatus.ON_ROUTE.key,
          ],
        },
      };
  
      const { sort, page, include_status_history, paging } = req.query;
      const serviceMissions = await listMissions(
        missionFilter,
        sort,
        page,
        include_status_history,
        paging
      );
      res.status(200).send(serviceMissions);
    }

  async getMissionsConcerningArea(req, res) {

    const authenticated_user = req.auth._id;
    const paging = req.query.paging;

    //console.log(7800, paging);

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

    console.log(21, filter, statusList);

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


    const missionList = paging ? await listMissions(filter, sort, page, false, paging) :
      await listMissions(filter, sort, page, true, undefined);
    console.log(7876, missionList);

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

  async saveMissionComment(req, res) {
    const { mission_id, comment } = req.body;

    const mission = await readMissionDetails(mission_id)

    const missionResult = await ServiceMission.findByIdAndUpdate(
      { _id: mission._id }, // The query object
      { $push: { "extra.comments": comment } }, // The update object
      { new: true } // The options object
    );

    await res.status(200).send({
      status: 200,
      data: missionResult
    });;
  }

  async getMissionComment(req, res) {
    const { mission_id } = req.query;

    const mission = await readMissionDetails(mission_id)
    await res.status(200).send({
      status: 200,
      data: mission.extra.comments
    });;
  }

  async addInvoiceToMission (req, res) {

     const  mission_id  =  req.params.mission_id;
      // دریافت شناسه سفر از پارامترهای درخواست 
      const finalState = req.body;
        // دریافت اطلاعات فاکتور از بدنه درخواست 
         try { // یافتن سفر موردنظر 
          const mission = await ServiceMission.findById(mission_id);
          
          if (!mission) { 
            return res.status(404).json({ message: "Mission not found" });
           }else{
            console.log("mission ID in backend:",mission_id)
           }
            // extraافزودن اطلاعات فاکتور به قسمت 
             if(!mission.extra){
              mission.extra={};
             };
            const extra = mission.extra||{};
            const status = mission.status;

           if(Object.keys(extra).length===6 || status !== 'READY'){
            return res.status(400).json({message:'فاکتور قبلا ثبت شده'})
           };
             // ذخیره تغییرات در دیتابیس 
             const missionInvoice = await ServiceMission.findByIdAndUpdate(
              { _id: mission._id }, // The query object
              { $set: { 
                "extra": {...mission.extra ,...finalState},
                "status":"DONE"
              }}, // The update object

              { new: true , upsert:true} // The options object
            );
            console.log("mission missionInvoice:",missionInvoice)

              res.status(200).json({ message: "Invoice added successfully" ,missionInvoice});
             } catch (error) { console.error("Error adding invoice:", error);
               res.status(500).json({ message: "Server error", error });
              
        }};

 async updateMissionStatusToRejected(req, res) {
    const mission_id = req.params.mission_id;
    const finalState = req.body;
     try {
       const mission = await ServiceMission.findById(mission_id);
           if (!mission) {
       return res.status(404).json({ message: "Mission not found" });
       }
          
        
          if (!mission.extra) { mission.extra = {}; }

          const editInvoice = await ServiceMission.findByIdAndUpdate(
            { _id: mission._id }, // The query object
            { $set: { 
              "extra": {...finalState},
              "status":"READY"
            }}, // The update object

            { new: true , upsert:true} // The options object
          );
       
           // ذخیره تغییرات در دیتابیس       
            const updatedMission = await mission.save();
           res.status(200).json({ message: "Mission status updated to REJECTED", mission: updatedMission });
          } catch (error) {
            console.error("Error updating mission status:", error);
             res.status(500).json({ message: "Server error", error });
             }}
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
    console.log(52, index);
    if (index === null || index === 0) {
      try {
        //  console.log(1)
        const mission = await ServiceMission.findById(mission_id);
        console.log(2)
        const requesrID = (mission.service_requests[0].request_id).toString()
        const request = await ServiceRequest.find({ _id: ObjectId(requesrID) })
        console.log(3)
        let user = await UserAccount.find({ _id: ObjectId(request[0].submitted_by.toString()) })
        console.log(4, index)
        let massage = index === null ? 'راننده سفر را شروع کرد' :
          'راننده به مبدا رسید'
        console.log(5, user[0]?._id)
        await sendNotificationToUsers(user[0]?._id, massage)
        console.log(6);
      }
      catch {
        console.log(7);
        // console.log('sendNotificationToUsers error',mission_id, mission.service_requests[0].request_id, request.submitted_by, user?._id, massage);
      }
    }

    //sgh  حرکت به سمت مبدا
    if (status === assignedRequestStatus.ON_ROUTE.key) {
      const mission = await ServiceMission.findById(mission_id);
      // console.log(5566, mission.service_requests[0].request_id);
      await notifyAPIArriveToSource(mission.service_requests[0].request_id)
    }
  }
};







module.exports = new MissionController();

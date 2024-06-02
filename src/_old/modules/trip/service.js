const persianAlphabeticCompare = require('persian-alphabetic-compare');
const { AppError } = require("../../constructor/AppError");
const roles = require("../../global_values/roles");
const { trpStat, crStat, rqstStat, pssTrpStat } = require("../../global_values/status");
const { rqstStep } = require("../../global_values/steps");
const async = require("../../middleware/async");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const {
  calculateTripDistance,
  updateDriverLocation,
  calculateRequestDistance,
} = require("../../utils/DistanceHelper");
const { Car } = require("../car/model");
const { Request } = require("../request/model");
const { Trip } = require("./model");
const getPaginateOptions = require("../../utils/paginateHelper");
const { messages } = require("../../global_values/socket");
const { getRoleString, getRolePersian, getAdministrativeRole } = require("../../utils/userHelper");
const { canReuestsMakeTrip } = require("./middleware");
const {
  addRoom,
  getConnectionsInstance,
  deleteRoom,
} = require("../../socket/connections");
const { User } = require("../user/model");
const mongoose = require("mongoose");
const {
  sendNotification,
  sendMutateRequestList,
  sendMutateDraftstList,
  sendMutateDraftstListV2,
} = require("../../utils/notificationHelper");
const { isoToJalali, timeToString } = require("../../utils/dateHelper");
const { getSort } = require("../../utils/sortHelper");
const { Driver } = require("../../mid_models/driver");
const car_group = require('../../global_values/car_group');
const { getRqstDsptchr, sendPassengerNotification } = require('../../utils/irisaHelper');
const { NEW_TRIP_NOTIF_SOUND } = require('../../global_values/constants');
const permissions = require('../../global_values/permissions');
const { ServiceMission } = require('../../../services/data/mission-model');
const { readMissionDetails, getMissionDetailsMongoObject } = require('../../../services/data');
const { serviceMissionStatus } = require('../../../services/constatns');

const getTrips = async (req, res, next) => {
  const role = getAdministrativeRole(req.user.role);

  const deligatorAccountId = req?.user?.deligated_permissions?.account_id;
  const deligatorRole = getAdministrativeRole(req?.user?.deligated_permissions?.role);

  let dispatcher_account_id = ["dispatcher"].includes(role) && req.user._id

  if (dispatcher_account_id == null && deligatorRole != null) {
    if (!["admin", "superDispatcher"].includes(deligatorRole)) {
      dispatcher_account_id = deligatorAccountId
    }
  }

  const { status, query: search, for_time, for_date, created, ignoreMadeByDispatcher } = req.query;
  if (status && !Array.isArray(status))
    return sendErrorByEnviorment("وضعیت باید آرایه ای باشد");
  const query = {
    ...(status && {
      status: {
        $in: status,
      },
    }),
    ...(search && {
      $or: [
        { "passengers.full_name": { $regex: search } },
        { "passengers.phone_num": { $regex: search } },
        { "passengers.emp_num": { $regex: search } },
        { "dispatcher.full_name": { $regex: search } },
        { "driver.user.full_name": { $regex: search } },
        { "locations.start.adr": { $regex: search } },
        { "locations.finish.adr": { $regex: search } },
      ],
    }),
    ...(for_date && {
      for_date: {
        ...(for_date[0] && { $gte: new Date(for_date[0]) }),
        ...(for_date[1] && { $lte: new Date(for_date[1]) }),
      },
    }),
    ...(for_time && {
      for_time: {
        ...(for_time[0] && { $gte: for_time[0] }),
        ...(for_time[1] && { $lte: for_time[1] }),
      },
    }),
  };

  if (dispatcher_account_id) {
    query["dispatcher.account_id"] = dispatcher_account_id;
  }

  if (created == true || created == false) {
    query.made_by_dispatcher = created == true;
  }



  if (ignoreMadeByDispatcher) {
    delete query.made_by_dispatcher;
  }

  const options = getPaginateOptions(
    req.query,
    "for_date for_time status locations distance _id passengers driver has_cancelled_request car cost_managers dispatcher timing taxi_cost distance_props.dispatcher_override distance_props.distance distance_props.distance_actual made_by_dispatcher"
  );

  const defaultSort = { for_date: 1, for_time: 1 };
  const sort = getSort(req, defaultSort);

  if (!sort.for_date) {
    sort.for_date = defaultSort.for_date;
    sort.for_time = defaultSort.for_time;
  }

  const trips = await Trip.paginate(query, { ...options, sort });

  const SORT_KEY_LOCATION_START_ADR = 'locations.start.adr';
  const SORT_KEY_LOCATION_FINISH_ADR = 'locations.finish.adr';
  const SORT_KEY_PASSENGER_FULL_NAME = 'passengers.full_name';

  if (sort[SORT_KEY_PASSENGER_FULL_NAME]) {
    sortLoop(trips, "passengers", compareFuncPassengers(sort[SORT_KEY_PASSENGER_FULL_NAME]));
  } else if (sort[SORT_KEY_LOCATION_START_ADR]) {
    sortLoop(trips, "locations", compareFuncLocationStart(sort[SORT_KEY_LOCATION_START_ADR]));
  } else if (sort[SORT_KEY_LOCATION_FINISH_ADR]) {
    sortLoop(trips, "locations", compareFuncLocationFinish(sort[SORT_KEY_LOCATION_FINISH_ADR]));
  }

  res.status(200).send({
    info: "success",
    ...trips,
  });
};

const getTrip = async (req, res, next) => {
  const { id } = req.params;
  const role = getAdministrativeRole(req.user.role);
  const trip = await Trip.findOne({
    _id: id,
    ...(!["admin", "superDispatcher"].includes(role) && {
      "dispatcher.account_id": req.user._id,
    }),
  }).select("-request_ids -has_cancelled_request -all_arrived -taxi_cost");
  if (!trip) return sendErrorByEnviorment("سفر مورد نظر یافت نشد");
  res.status(200).send({
    info: "success",
    doc: trip,
  });
};

const getSelfTrip = async (req, res, next) => {
  const { id } = req.params;
  let selfTrip = await Trip.findOne({
    _id: mongoose.Types.ObjectId(id),
    is_active: true,
    $or: [
      { "passengers.account_id": mongoose.Types.ObjectId(req.user._id) },
      { "driver.user.account_id": mongoose.Types.ObjectId(req.user._id) },
    ],
  });
  if (!selfTrip) return sendErrorByEnviorment("سفر شخصی مورد نظر یافت نشد");
  res.status(200).send({ info: "success", doc: selfTrip });
};

const getSelfTrips = async (req, res, next) => {
  let { status, for_date, history } = req.query;
  status = Array.isArray(status) ? status?.map((el) => parseInt(el)) : status?.split(",").map((el) => parseInt(el));
  const query = {
    is_active: true,
    $or: [
      { "passengers.account_id": req.user._id },
      { "driver.user.account_id": req.user._id },
    ],
    ...(!history && { ...(status && { status: { $in: status } }) }),
    ...(for_date && {
      for_date: {
        ...(for_date[0] && { $gte: new Date(for_date[0]) }),
        ...(for_date[1] && { $lte: new Date(for_date[1]) }),
      },
    }),
  };

  const selfTrips = await Trip.find(query)
    .select([
      "for_date",
      "for_time",
      "locations",
      "status",
      "_id",
      "distance_props",
      "taxi_cost"
    ])
    .sort({ for_date: 1, for_time: 1 });

  const result = {
    docs: selfTrips,
  };
  console.log(result);

  res.status(200).send({ info: "success", ...result });
};
const conClass = getConnectionsInstance();

const addCarToTrip = async (trip, carId, instantFinish = false) => {

  const car = await Car.findOne({ _id: carId });
  if (!trip || !car)
    return sendErrorByEnviorment("سفر یا خودرو مورد نظر یافت نشد");
  const { for_date, for_time, passengers } = trip;
  let simulTrips = await Trip.find({
    _id: { $ne: trip._id },
    for_date: for_date,
    for_time: {
      $gte: for_time - 100,
      $lte: for_time + parseInt(trip?.distance_props?.interval / 60),
    },
    status: {
      $nin: [
        trpStat.cnBDs,
        trpStat.cnBMn,
        trpStat.cncBDr,
        trpStat.cncBPs,
        trpStat.fnshd,
      ],
    },
  });
  const isCarBusy = simulTrips.filter(
    (trip) => trip?.car?.car_id?.toString() === car._id?.toString()
  );

  if (isCarBusy.length > 0)
    if (simulTrips.length > 0) {
      const car_ids = simulTrips
        .filter((el) => el.car)
        .map((el) => el.car.car_id);
      if (car_ids?.length > 0) return { car_ids };
    }
  trip.car = {
    plaque: car.plaque,
    name_code: car.name_code,
    car_id: carId,
  };
  trip.driver = car.driver;

  if (!instantFinish) {
    const client = conClass.getConnection(car?.driver?.user?.account_id);
    if (!client) {
      console.error("driver sokcet not found");
    }
    if (client) client.join(trip._id.toString());
  }

  trip.status = trpStat.hsCr;

  if ((!car.group || car.group == car_group.IRISA) && !instantFinish) {
    trip.taxi_cost = 0;
  } else {
    trip.status = trpStat.fnshd;
  }

  await trip.save();
};

const updateTripCost = async (req, res) => {
  const { id } = req.params;
  const trip = await Trip.findById(id);
  if (!trip) throw new AppError("سفر مورد نظر یافت نشد", 404);
  trip.taxi_cost = req.body.taxi_cost;
  await trip.save();
  res.status(200).send({
    info: "success",
    token: "",
    doc: trip,
  });
}

const createTrip = async (req, res, next) => {
  const {
    locations,
    for_date,
    for_time,
    passengers,
    request_ids,
    car_id,
    distance_props,
    cost_managers,
    dispatcher,
    taxi_cost
  } = req.body;

  canReuestsMakeTrip([request_ids], req.user);

  const trip = await Trip.create({
    locations,
    for_date,
    for_time,
    passengers,
    request_ids,
    distance_props,
    status: trpStat.crtBDs,
    cost_managers,
    dispatcher,
    taxi_cost: taxi_cost || 0,
  });

  addRoom(trip._id.toString());
  if (car_id) {
    const result = await addCarToTrip(trip, car_id);
    if (result?.car_ids) {
      const availableCars = await Car.find({
        is_active: true,
        _id: { $nin: result?.car_ids },
        status: crStat.fr,
      }).select("name_code plaque driver total_distance status");

      for (reqst_id of trip.request_ids) {
        const el = await Request.findById(reqst_id);
        el.step = rqstStep.mn;
        el.status = rqstStat.acBMn;
        await el.save();
      }
      trip.delete();
      return res.status(400).send({ info: "carInTrip", availableCars });
    } else {
      const title = "یک سفر جدید برای شما برنامه ریزی شد";
      let message = `سفر در تاریخ ${isoToJalali(
        trip?.for_date?.toISOString()
      )} ساعت ${timeToString(trip?.for_time)} از مبدا ${trip.locations[0]?.start?.adr
        } برای شما برنامه ریزی شد `;
      sendNotification(
        trip?.driver?.user?.account_id,
        title,
        message,
        trip._id,
        "trip",
        "driver",
        NEW_TRIP_NOTIF_SOUND,
      );
    }
  }
  for (el of request_ids) {
    const request = await Request.findById(el);
    sendMutateRequestList(req, request, "delete");
  }
  sendMutateDraftstList(req, trip, "add");
  res.status(201).send({
    info: "success",
    token: "",
    doc: "",
  });

  const title = "درخواست شما در سفر قرار گرفت";

  const selectedCar = await Car.findById(car_id);
  const isIrisaDriver = !selectedCar.group || selectedCar.group == car_group.IRISA;

  passengers.forEach(async (el) => {
    const updateData = isIrisaDriver ? {
      step: rqstStep.tr,
      status: rqstStat.plITr,
    } : {
      step: rqstStep.tr,
      status: rqstStat.done,
    };
    let rq = await Request.findByIdAndUpdate(el.request_id, updateData);
    let message = `درخواست تاریخ ${isoToJalali(
      rq?.for_date?.toISOString()
    )} ساعت ${timeToString(rq?.for_time)} از مبدا ${rq.locations?.start?.adr
      } در سفر قرار گرفت `;
    sendNotification(
      el.account_id,
      title,
      message,
      rq._id,
      "request",
      "passenger",
      NEW_TRIP_NOTIF_SOUND
    );
    const client = conClass.getConnection(el.account_id);
    if (!client) {
      console.error("passenger sokcet not found");
    }
    if (client) client.join(trip._id.toString());
  });
};

const assignCarToTrip = async (req, res, next) => {
  const { id } = req.params;
  const { car_id } = req.body;
  const trip = await Trip.findOne({
    _id: id,
    status: trpStat.crtBDs,
  });
  const result = await addCarToTrip(trip, car_id);
  if (result?.car_ids) {
    const availableCars = await Car.find({
      is_active: true,
      _id: { $nin: result?.car_ids },
      status: crStat.fr,
    });
    return res.status(400).send({ info: "carInTrip", availableCars });
  }
  res.status(200).send({
    info: "success",
    token: "",
    doc: "",
  });
  const title = "یک سفر جدید برای شما برنامه ریزی شد";
  let message = `سفر در تاریخ ${isoToJalali(
    trip?.for_date?.toISOString()
  )} ساعت ${timeToString(trip?.for_time)} از مبدا ${trip.locations[0]?.start?.adr
    } برای شما برنامه ریزی شد `;

  sendNotification(
    trip?.driver?.user?.account_id,
    title,
    message,
    trip._id,
    "trip",
    "driver",
    NEW_TRIP_NOTIF_SOUND
  );
  sendMutateDraftstList(req, trip, "change");

  if (!trip.has_cancelled_request) {
    trip.has_cancelled_request = true;
    trip.save();
  }
};

const deleteTripCar = async (req, res, next) => {
  const { id } = req.params;
  const trip = await Trip.findById(id);
  if (!trip) return sendErrorByEnviorment("سفر مورد نظر یافت نشد");
  if (!trip.car) throw new AppError("خودرو ثبت نشده است ", 406);
  if (trip.status !== trpStat.hsCr)
    throw new AppError("امکان حذف خودرو در این مرحله وجود ندارد", 406);
  res.status(200).send({
    info: "success",
    doc: "",
  });
  const title = `سفر شما توسط ${getRolePersian(req.user.role)} لغو شد`;
  let message = `سفر در تاریخ ${isoToJalali(
    trip?.for_date?.toISOString()
  )} ساعت ${timeToString(trip?.for_time)} از مبدا ${trip.locations[0]?.start?.adr
    } لغو شد `;
  sendNotification(
    trip?.driver?.user?.account_id,
    title,
    message,
    trip._id,
    "trip",
    "driver"
  );
  const car = await Car.findById(trip?.car?.car_id);
  const newDistance = car.total_distance - trip.distance;
  car.total_distance = isNaN(newDistance) ? 0 : newDistance;
  car.status = crStat.fr;
  trip.car = undefined;
  trip.driver = undefined;
  trip.status = trpStat.crtBDs;
  await trip.save();
  await car.save();
  sendMutateDraftstList(req, trip, "change");
};

const cancelTrip = async (req, res, next) => {
  const { id } = req.params;
  const status = (req.user?.role?.includes(roles.superDispatcher) || req.user?.role?.includes(roles.admin)) ?
    trpStat.cnBMn : trpStat.cnBDs;
  const trip = await Trip.findOne({
    _id: id,
    is_active: true,
  });
  if (!trip) return sendErrorByEnviorment("سفر مورد نظر یافت نشد");
  if (trip.status > trpStat.hsCr)
    throw new AppError("امکان لغو سفر در این مرحله وجود ندارد", 406);
  trip.status = status;
  trip.is_active = false;
  res.status(200).send({
    info: "success",
    doc: trip,
  });
  const title = `سفر شما توسط ${getRolePersian(req.user.role)} لغو شد`;
  let message = `سفر در تاریخ ${isoToJalali(
    trip?.for_date?.toISOString()
  )} ساعت ${timeToString(trip?.for_time)} از مبدا ${trip.locations[0]?.start?.adr
    } لغو شد `;
  sendNotification(
    trip?.driver?.user?.account_id,
    title,
    message,
    trip._id,
    "trip",
    "driver"
  );
  for (el of trip.passengers) {
    const rqst = await Request.findById(el.request_id);
    sendNotification(
      el.account_id,
      title,
      message,
      trip._id,
      "trip",
      "passenger"
    );
    rqst.status = rqstStat.snBDs;
    rqst.step = rqstStep.ds;
    await rqst.save();
  }
  await deleteCarTrip(trip, req.user);
  await trip.save();
  sendMutateDraftstList(req, trip, "delete");
};

const cancelSelfTrip = async (req, res, next) => {
  const { id } = req.params;
  // const condition = req.user.role === roles.driver;
  // const status = condition ? trpStat.cncBDr : trpStat.cncBPs;
  const trip = await Trip.findOne({
    _id: id,
    $or: [
      { "passenger.account_id": req.user._id },
      { "driver.account_id": req.user._id },
    ],
    is_active: true,
  });
  if (!trip) return sendErrorByEnviorment("سفر مورد نظر یافت نشد");
  if (trip.status > trpStat.hsCr)
    throw new AppError("امکان لغو سفر در این مرحله وجود ندارد", 406);

  if (req.user.role == roles.driver) {
    sendMutateDraftstListV2(req, trip, "delete");
    await trip.delete();
    const tripRequests = await Request.find({ _id: { $in: trip.request_ids } });
    for (let k = 0; k < tripRequests.length; k++) {
      tripRequests[k].status = rqstStat.snBDs;
      tripRequests[k].step = rqstStep.mn;
      await tripRequests[k].save();
      sendMutateRequestList(req, tripRequests[k], "add", "create");
    }
    return res.status(200).send({
      info: "success",
      doc: "",
    });
  }

  let flag = false;
  for (el of trip.request_ids) {
    const rqst = await Request.findById(el);
    if (rqst.passenger.account_id.equals(req.user._id)) {
      rqst.status = rqstStat.cncBPS;
      const newLocations = trip.locations.filter((loc, index) =>
        !rqst._id.equals(trip.passengers[index].request_id)
      );
      const newPassengers = trip.passengers.filter(
        (pass) => !rqst._id.equals(pass.request_id)
      );
      const newRequestIds = trip.request_ids.filter((id) => !rqst._id.equals(id));

      trip.locations = newLocations;
      trip.request_ids = newRequestIds;
      trip.passengers = newPassengers;

      if (newPassengers.length === 0) {
        await deleteCarTrip(trip, req.user);
        await trip.delete();
        await rqst.save();

        sendMutateDraftstListV2(req, trip, "delete");
        return res.status(200).send({
          info: "success",
          doc: "",
        });
      }

      res.status(200).send({
        info: "سفر با موفقیت لغو شد ",
        doc: trip,
      });
      // trip.has_cancelled_request = true;
      await trip.save();
      await rqst.save();
      flag = true;
      break;
    }
  }
  if (flag === false) {
    sendErrorByEnviorment("شما در این سفر عضو نیستید");
  }
  sendMutateDraftstListV2(req, trip, "change");
};

const deleteCarTrip = async (trip, user) => {
  if (trip.car || trip.driver) {
    const title = `سفر شما توسط ${getRolePersian(user.role)} لغو شد`;
    let message = `سفر در تاریخ ${isoToJalali(
      trip?.for_date?.toISOString()
    )} ساعت ${timeToString(trip?.for_time)} از مبدا ${trip.locations[0]?.start?.adr
      } لغو شد `;
    sendNotification(
      trip?.driver?.user?.account_id,
      title,
      message,
      trip._id,
      "trip",
      "driver"
    );
    const car = await Car.findById(trip.car.car_id);
    const newDistance = car.total_distance - trip.distance;
    car.total_distance = isNaN(newDistance) ? 0 : newDistance;
    car.status = crStat.fr;
    await car.save();
  }
};

const deleteTripRequest = async (req, res, next) => {
  const role = getAdministrativeRole(req.user.role);
  const { id, request_id } = req.params;
  const trip = await Trip.findOne({
    _id: id,
    status: { $in: [trpStat.crtBDs, trpStat.hsCr] },
  });
  if (!trip)
    return sendErrorByEnviorment("امکان حذف درخواست در این مرحله وجود ندارد");
  const request = await Request.findByIdAndUpdate(request_id, {
    status: rqstStat.snBDs,
    step: rqstStep.mn,
    ...((!["admin", "superDispatcher"].includes(role) ||
      !["admin", "superDispatcher"].includes(
        req?.user?.deligated_permissions?.role
      )) && {
      $or: [
        { [`${role}.account_id`]: req.user._id },
        {
          [`${req?.user?.deligated_permissions?.role}.account_id`]:
            req?.user?.deligated_permissions?.account_id,
        },
      ],
    }),
  });
  if (!request) return sendErrorByEnviorment("درخواست مورد نظر یافت نشد");
  res.status(200).send({
    info: "success",
    doc: "",
  });
  trip.passengers = trip.passengers.filter((pass) => {
    if (pass.request_id.toString() !== request_id) {
      return true;
    } else {
      const title = "لغو سفر برنامه ریزی شده";
      let message = `درخواست شما برای تاریخ ${isoToJalali(
        trip?.for_date?.toISOString()
      )} ساعت ${timeToString(request?.for_time)} از مبدا ${request.locations?.start?.adr
        } از سفر حذف شد . اطلاعات جدید متعاقبا اطلاع رسانی میگردد `;
      sendNotification(
        pass?.account_id,
        title,
        message,
        pass?.request_id,
        "request",
        "passenger"
      );
    }
  });
  trip.request_ids = trip.request_ids.filter(
    (r) => r.toString() !== request_id
  );
  if (trip?.passengers?.length === 0) {
    await deleteCarTrip(trip, req.user);
    trip.status =
      req.user?.role === roles.dispatcher ? trpStat.cnBDs : trpStat.cnBMn;
    trip.save();
    return res.status(200).send({
      info: "success",
      doc: "",
    });
  }
  trip.has_cancelled_request = true;
  await trip.save();
  sendMutateDraftstList(req, trip, "change");
};

const reviewTrip = async (req, res, next) => {
  const { id } = req.params;
  const { desc, pos_points, neg_points, satisfaction_rate } = req.body;
  const { user } = req;
  let query;
  query = {
    _id: id,
    is_active: true,
    $or: [
      { "passengers.account_id": req.user._id },
      { "driver.user.account_id": req.user._id },
    ],
    status: trpStat.fnshd,
  };

  const missionDetails = await getMissionDetailsMongoObject(id);

  const excption = () => sendErrorByEnviorment("سفر یافت نشد");
  if (missionDetails == null || missionDetails.status != serviceMissionStatus.DONE.key) {
    return excption();
  }

  if (!missionDetails.vehicle_id.driver_user._id.equals(req.user._id)) {
    return excption();
  }

  if (!missionDetails.reviews) missionDetails.reviews = [];
  missionDetails.reviews.push({
    desc,
    pos_points,
    neg_points,
    satisfaction_rate,
    user: {
      user_id: user._id,
      role: user.role,
      full_name: user.full_name,
    },
  });

  await missionDetails.save();
  res.status(200).send({
    info: "success",
    doc: "",
  });
};

const DISTANCE_THRESHOLD = 10;
const MARGIN = 3;

const distanceBetween = (A, B) => {
  return calcCrow(A[1], A[0], B[1], B[0]);
}

const notifyRequestUser = async (req, res, next) => {
  // await sendNotification(
  //   req.body.account_id,
  //   "راننده به سمت شما حرکت کرد",
  //   "راننده به سمت مبدا درخواست شما شروع به حرکت کرد.",
  //   req.body.travel_id,
  //   "trip",
  //   "passenger"
  // );

  sendPassengerNotification([req.body.account_id], "پیام سیستم مدیریت ناوگان : راننده به سمت مبدا درخواست شما شروع به حرکت کرد.");
  res.status(200).send({ info: "sucess", doc: "" });
}

const sendTravelledDistance = async (req, res, next) => {
  const { id } = req.params;
  let { points, bearing, meta = [{ speed: 0, date: new Date() }] } = req.body;
  // const {speed , date} = meta;
  res.status(200).send({ info: "sucess", doc: "" });
  const trip = await Trip.findOne({
    _id: id,
    is_active: true,
    "driver.user.account_id": req.user._id,
    all_arrived: false,
    status: trpStat.strtd,
  });
  if (!trip) return console.error("trip not found");

  const last_point = trip.distance_props.temp_points?.[trip.distance_props.temp_points?.length - 1];

  if (last_point != null) {
    points = [last_point, ...points];
  }

  let crowDistance = 0;
  if (points.length > 1) {
    crowDistance = distanceBetween(points[0], points[1]);
    if (distanceBetween(points[0], points[1]) < DISTANCE_THRESHOLD) {
      return;
    }
  }

  let { distance, interval } = await calculateTripDistance(points);

  if (distance > (MARGIN * crowDistance)) {
    distance = crowDistance;
  }


  // const tripDriver = await Driver.findById(trip.driver.driver_id);

  // tripDriver.total_distance += distance;
  // tripDriver.interval += interval;
  // await tripDriver.save();

  const tripPointsMeta = [...trip.distance_props.temp_points_meta, ...meta];

  // const tripPoints = [...trip.distance_props.temp_points, ...points];
  const tripPoints = [];
  for (let i = 0; i < trip.distance_props.temp_points.length - 2; i++) {
    tripPoints.push(trip.distance_props.temp_points[i]);
  }
  tripPoints.push(...points);

  trip.distance_props.temp_points = tripPoints;
  trip.distance_props.temp_points_meta = tripPointsMeta;
  trip.distance_props.distance_actual += distance;
  trip.distance_props.interval_actual += interval;
  trip.driver.bearing = bearing;
  const location = points[points.length - 1];
  trip.driver.location = location;
  await updateDriverLocation(trip.driver.driver_id, location);
  req.app.get("socketService").emit(
    messages.driverLocationChanged,
    {
      status: 1,
      tripID: trip._id,
      driverID: trip.driver.driver_id,
      location,
      bearing: trip.driver.bearing,
    },
    trip._id.toString()
  );
  await trip.save();


  //TODO SAVE USER LAST LOCATION
  try {
    const GpsHistories = mongoose.connection.db.collection("gpshistories");
    await GpsHistories.insertOne({
      coordinates: points[0],
      speed: 0,
      gmt_date: new Date(),
      owner_id: req.user._id
    })
  } catch (e) {
    console.log("Location service error >>>> " + e.message);
  }
};

const addRequestToTripDraft = async (req, res) => {
  const { id, request_id } = req.params;
  const trip = await Trip.findOne({
    _id: id,
    status: { $in: [trpStat.crtBDs, trpStat.hsCr] },
  });
  if (!trip)
    return sendErrorByEnviorment(
      "امکان افزودن درخواست در این مرحله وجود ندارد"
    );
  const {
    rqsts,
    locations,
    passengers,
    for_date,
    for_time,
    distance_props,
    cost_managers,
    dispatcher,
  } = await canReuestsMakeTrip([...trip.request_ids, request_id], req.user);
  res.send({ info: "success", doc: "" });
  trip.request_ids = [...trip.request_ids, request_id];
  trip.distance_props = distance_props;
  trip.cost_managers = cost_managers;
  trip.dispatcher = dispatcher;
  trip.locations = locations;
  trip.passengers = passengers;
  trip.for_date = for_date;
  trip.for_time = for_time;
  trip.has_cancelled_request = true;
  await trip.save();
  for (el of rqsts) {
    if (el.step !== rqstStep.dr && el.status !== rqstStat.inTDr) {
      el.step = rqstStep.dr;
      el.status = rqstStat.inTDr;
      await el.save();
      if (el._id?.toString() === request_id) {
        const title = "درخواست شما در سفر قرار گرفت";
        let message = `درخواست تاریخ ${isoToJalali(
          el?.for_date?.toISOString()
        )} ساعت ${timeToString(el?.for_time)} از مبدا ${el.locations?.start?.adr
          } در سفر قرار گرفت `;
        sendNotification(
          el?.passenger?.account_id,
          title,
          message,
          el._id,
          "request",
          "passenger",
          NEW_TRIP_NOTIF_SOUND
        );
      }
    }
  }
  sendMutateDraftstList(req, trip, "change");
};

const deleteTrip = async (req, res) => {
  const role = getAdministrativeRole(req.user.role);
  const { id } = req.params;
  const trip = await Trip.findOne({
    _id: id,
    is_active: true,
    status: { $in: [trpStat.crtBDs, trpStat.hsCr] },
  });

  if (trip == null) return sendErrorByEnviorment("امکان لغو سفر در  این مرحله وجود ندارد");
  for (el of trip.request_ids) {
    const request = await Request.findOneAndUpdate(
      {
        _id: el,
        is_active: true,
        ...((!["admin", "superDispatcher"].includes(role) ||
          !["admin", "superDispatcher"].includes(
            req?.user?.deligated_permissions?.role
          )) && {
          $or: [
            { [`${role}.account_id`]: req.user._id },
            {
              [`${req?.user?.deligated_permissions?.role}.account_id`]:
                req?.user?.deligated_permissions?.account_id,
            },
          ],
        }),
      },
      {
        step: rqstStep.mn,
        status: rqstStat.snBDs,
      },
      {
        new: true,
      }
    );
    if (!request) return sendErrorByEnviorment("درخواست مورد نظر یافت نشد");

    const title = `سفر شما توسط ${getRolePersian(req.user.role)} لغو شد`;
    let message = `سفر در تاریخ ${isoToJalali(
      trip?.for_date?.toISOString()
    )} ساعت ${timeToString(trip?.for_time)} از مبدا ${trip.locations[0]?.start?.adr
      } لغو شد `;
    sendNotification(
      request?.passenger?.account_id,
      title,
      message,
      trip._id,
      "trip",
      "passenger"
    );
    sendMutateRequestList(req, request);
  }
  res.send({ info: "success", doc: "" });
  await deleteCarTrip(trip, req.user);
  trip.status =
    (req.user?.role?.includes(roles.superDispatcher) || req.user?.role?.includes(roles.admin)) ?
      trpStat.cnBMn : trpStat.cnBDs;
  trip.save();
  sendMutateDraftstList(req, trip, "delete");
};

const forceEndTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);

  trip.status = trpStat.fnshd;
  for (let i = 0; i < trip.passengers.length; i++) {
    const p = trip.passengers[i];
    p.status = pssTrpStat.pssgrGtOf;
  }
  await trip.save();

  for (let i = 0; i < trip.request_ids?.length; i++) {
    const reqId = trip.request_ids[i];
    const req = await Request.findById(reqId);
    req.status = rqstStat.done;
    await req.save();
  }

  const car = await Car.findById(trip.car.car_id);
  car.status = crStat.fr;
  await car.save();

  const driver = await Driver.findById(trip.driver.driver_id);
  driver.status = crStat.fr;
  await driver.save();




  deleteRoom(trip._id.toString());

  return res.status(200).send({ trip, car, driver });
}

const updateDispatcherTrip = async (req, res) => {
  const tripId = req.params.id;
  let { passengers, locations, for_date, for_time, desc, car_id, taxi_cost } = req.body;

  const trip = await Trip.findById(tripId);
  if (!trip || trip.status > trpStat.hsCr) {
    return res.status(400).send({ info: "امکان ویرایش این سفر وجود ندارد" });
  }

  const updateBody = {};

  if (taxi_cost >= 0) {
    updateBody.taxi_cost = taxi_cost;
  }

  if (for_time) {
    let for_timeArr = for_time.split(":");
    updateBody.for_time = parseInt(for_timeArr[0] + for_timeArr[1]);
  }

  if (for_date) {
    updateBody.for_date = for_date;
  }

  if (locations) {
    updateBody.distance_props = await calculateRequestDistance(locations);
    updateBody.locations = locations;
  }

  if (passengers) {
    let passengersObjArr = await createPassengersObjArr(passengers);
    updateBody.passengers = passengersObjArr;
  }

  if (desc) {
    updateBody.desc = desc;
  }

  await Trip.findByIdAndUpdate(tripId, updateBody);

  deleteRoom(tripId);
  addRoom(tripId);

  const carHasChanged = car_id && !trip.car.car_id.equals(car_id);
  if (carHasChanged) {
    await addCarToTrip(trip, car_id);
  }
  joinPassengersToRoom(passengers, trip._id.toString());
  res.status(201).send({ info: "success", doc: "" });

  const title = "سفر ویرایش شد";
  const message = "سفر شما ویرایش گردید";
  notifyPassengersAndDriver(trip, updateBody.passengers, title, message);
};

const createDispatcherTrip = async (req, res) => {
  let { passengers, locations, for_date, for_time, desc, car_id, taxi_cost, distance_override } = req.body;
  const { full_name, phone_num, emp_num, _id: account_id } = req.user;
  let passengersObjArr = await createPassengersObjArr(passengers);
  let for_timeArr = for_time.split(":");
  for_time = parseInt(for_timeArr[0] + for_timeArr[1]);

  const distance_props = {
    distance: 0,
    interval: 0,
  }

  for (let i = 0; i < locations.length; i++) {
    const partial_distance_props = await calculateRequestDistance(locations[i]);
    distance_props.distance += partial_distance_props.distance;
    distance_props.interval += partial_distance_props.interval;
  }

  for (let i = 0; i < locations.length - 1; i++) {
    const inBetweenLocations = {
      start: locations[i].finish,
      finish: locations[i + 1].start,
    }
    const in_between_distance_props = await calculateRequestDistance(inBetweenLocations);
    distance_props.distance += in_between_distance_props.distance;
    distance_props.interval += in_between_distance_props.interval;
  }



  if (distance_override != null) {
    distance_props.distance = distance_override;
    distance_props.dispatcher_override = true;
  }

  const car = await Car.findById(car_id);
  const isIrisaDriver = (!car.group || car.group == car_group.IRISA);

  const tripObj = {
    made_by_dispatcher: true,
    dispatcher: [{ full_name, phone_num, emp_num, account_id }],
    passengers: passengersObjArr,
    distance_props,
    locations,
    for_date,
    for_time,
    desc,
    creator: req.user._id,
    taxi_cost: taxi_cost || 0,
    status: (passengers != null && passengers.length > 0 && isIrisaDriver) ? trpStat.crtBDs : trpStat.fnshd,
  };

  if (getAdministrativeRole(req.user.role) == "dispatcher") {
    for (let i = 0; i < locations.length; i++) {
      const l = locations[i];
      let dispatcherObject = await getRqstDsptchr(
        l.start.lnglat,
        l.finish.lnglat
      );
      if (!req.user._id.equals(dispatcherObject?.dispatcher?.[0]?.account_id)) {
        throw new AppError("امکان ثبت سفر خارج از محدوده ی خود را ندارید.");
      }
    }
  }

  const trip = await Trip.create(tripObj);
  res.status(201).send({ info: "success", doc: "" });
  // if (false /*passengers != null && passengers.length > 0 && isIrisaDriver*/) {
  // addRoom(trip._id.toString());
  // await addCarToTrip(trip, car_id);
  // joinPassengersToRoom(passengers, trip._id.toString());

  // const title = "سفر جدید";
  // const message = "یک سفر جدید برای شما ثبت شد";
  // notifyPassengersAndDriver(trip, passengers, title, message);
  // } else {

  if (isIrisaDriver) {
    await addCarToTrip(trip, car_id, true);
  } else {
    trip.car = {
      plaque: car.plaque,
      name_code: car.name_code,
      car_id: car_id,
    };
    trip.driver = car.driver;
    await trip.save();
  }

  car.total_distance = car.total_distance + distance_props.distance
  car.total_interval = car.total_interval + distance_props.interval;
  await car.save();

  if (isIrisaDriver) {
    const driver = await Driver.findById(car.driver.driver_id);
    driver.total_distance = driver.total_distance + distance_props.distance
    driver.total_interval = driver.total_interval + distance_props.interval;
    await driver.save();
  }

  if (!isIrisaDriver) {
    const title = "سفر جدید";
    const message = "یک سفر با خودروی غیر سازمانی برای شما ثبت شد.";
    notifyPassengersAndDriver(trip, passengers, title, message, NEW_TRIP_NOTIF_SOUND);
  } else {
    const title = "سفر جدید";
    const message = "یک سفر جدید برای شما ثبت شد";
    notifyPassengersAndDriver(trip, passengers, title, message, NEW_TRIP_NOTIF_SOUND);
  }

  // const title = "سفر بدون سرنشین ثبت شد";
  // const message = "یک سفر بدون سرنشین برای شما ثبت شد";
  // sendNotification(
  //   trip?.driver?.user?.account_id,
  //   title,
  //   message,
  //   trip._id,
  //   "trip",
  //   "driver"
  // );

  // }
};

const joinPassengersToRoom = (passengers, tripId) => {
  passengers?.forEach((el) => {
    const client = conClass.getConnection(el.account_id);
    if (!client) {
      console.error("passenger sokcet not found");
    }
    if (client) client.join(tripId);
  });
};

const createPassengersObjArr = async (passengers) => {
  const passengersObjArr = [];
  if (passengers)
    for (const passenger of passengers) {
      let mates = [];
      const mainUser = await User.findOne({
        _id: passenger.account_id,
        is_active: true,
      });
      if (!mainUser) return sendErrorByEnviorment("کاربر مورد نظر یافت نشد");
      if (passenger?.mates)
        for (const el of passenger?.mates) {
          if (el === passenger?.account_id)
            return sendErrorByEnviorment(
              "مسافر اصلی نمی تواند جزء همراهان باشد"
            );
          const mate = await User.findOne({ _id: el, is_active: true });
          if (!mate || !mate.emp_num)
            return sendErrorByEnviorment("همراه مورد نظر یافت نشد");
          mates.push({
            full_name: mate.full_name,
            phone_num: mate.phone_num,
            emp_num: mate.emp_num,
            account_id: mate._id,
          });
        }
      passengersObjArr.push({
        full_name: mainUser.full_name,
        emp_num: mainUser.emp_num,
        phone_num: mainUser.phone_num,
        account_id: mainUser._id,
        guests: passenger?.guests,
        mates,
      });
    }
  return passengersObjArr;
};


const sortLoop = (trips, key, compareFunction) => {
  for (let i = 0; i < trips.docs.length; i++) {
    trips.docs[i][key].sort(compareFunction)
  }
}

const compareFuncPassengers = (sortValue) => {
  return (a, b) => {
    const result = persianAlphabeticCompare(a.full_name, b.full_name);
    return sortValue == 'asc' ? result : -result;
  }
}

const compareFuncLocationFinish = (sortValue) => {
  return (a, b) => {
    const result = persianAlphabeticCompare(a.finish.adr, b.finish.adr);
    return sortValue == 'asc' ? result : -result;
  }
}

const compareFuncLocationStart = (sortValue) => {
  return (a, b) => {
    const result = persianAlphabeticCompare(a.start.adr, b.start.adr);
    return sortValue == 'asc' ? result : -result;
  }
}

const notifyPassengersAndDriver = (trip, passengers, title, message, notifSound) => {
  for (let i = 0; i < passengers.length; i++) {
    const el = passengers[i];
    sendNotification(
      el.account_id,
      title,
      message,
      trip._id,
      "trip",
      "passenger",
      notifSound
    );
  }

  sendNotification(
    trip?.driver?.user?.account_id,
    title,
    message,
    trip._id,
    "trip",
    "driver",
    notifSound
  );
}

function calcCrow(lat1, lon1, lat2, lon2) {

  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return parseInt(d * 1000);
}

function toRad(Value) {
  return Value * Math.PI / 180;
}

exports.forceEndTrip = async(forceEndTrip)
exports.updateDispatcherTrip = async(updateDispatcherTrip);
exports.createDispatcherTrip = async(createDispatcherTrip);
exports.deleteTrip = async(deleteTrip);
exports.addRequestToTripDraft = async(addRequestToTripDraft);
exports.reviewTrip = async(reviewTrip);
exports.getTrip = async(getTrip);
exports.getTrips = async(getTrips);
exports.createTrip = async(createTrip);
exports.cancelTrip = async(cancelTrip);
exports.getSelfTrip = async(getSelfTrip);
exports.getSelfTrips = async(getSelfTrips);
exports.deleteTripCar = async(deleteTripCar);
exports.updateTripCost = async(updateTripCost);
exports.cancelSelfTrip = async(cancelSelfTrip);
exports.assignCarToTrip = async(assignCarToTrip);
exports.deleteTripRequest = async(deleteTripRequest);
exports.sendTravelledDistance = async(sendTravelledDistance);
exports.notifyRequestUser = async(notifyRequestUser);
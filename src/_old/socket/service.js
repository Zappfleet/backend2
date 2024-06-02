const { messages } = require("../global_values/socket");
const { trpStat, rqstStat, pssTrpStat } = require("../global_values/status");
const { Trip } = require("../modules/trip/model");
const { Car } = require("../modules/car/model");
const { Driver } = require("../mid_models/driver");
const {
  addRoom,
  deleteRoom,
  getConnectionsInstance,
  findRoom,
} = require("./connections");
const { Request } = require("../modules/request/model");
const { sendPassengerNotification } = require("../utils/irisaHelper")
const { IsoToJalaliWithTime, timeToString } = require("../utils/dateHelper");
const { Restriction } = require("../modules/restriction/restriction.model");
const { calcStrMinutes } = require("../utils/timeHelper");
const moment = require("moment");
const { Account } = require("../modules/auth/model");
const roles = require("../global_values/roles");
const conClass = getConnectionsInstance();

const SENT_AS_DRIVER = "dr";
const SENT_AS_PASSENGER = "ps";

let IO;

const sendErrorToClient = (id, error = "Error Ocured") => {
  return IO.in(id).emit(messages.responseError, {
    info: error,
  });
};

const sendTripDetails = (trip, finished = false) => {
  return IO.in(trip._id.toString()).emit(messages.changeTripStatusResponse, {
    info: "sucess",
    doc: trip,
    finished,
  });
};

const calculateKey = (inCommingPassStatus, clientRole) => {
  let result;
  const role = clientRole.includes(1) ? "driver" : "passenger";
  switch (role) {
    case "passenger":
      if (inCommingPassStatus === 2) result = 2;
      else result = 3;
      break;
    case "driver":
      if (inCommingPassStatus === 1) result = 4;
      else result = 5;
      break;
    default:
      break;
  }
  return result;
};

const freeCar = async (carID, distance, interval) => {
  const car = await Car.findByIdAndUpdate(
    carID,
    {
      status: 0,
      $inc: { total_distance: distance, total_interval: interval },
    },
    { new: true }
  );
  IO.emit(messages.carStatusCahnged, { car });
};

const freeDriver = async (driverID, distance, interval) => {
  const driver = await Driver.findByIdAndUpdate(driverID, {
    status: 0,
    $inc: { total_distance: distance, total_interval: interval },
  });
  IO.emit(messages.driverStatusCahnged, { driver });
};

const busyCar = async (carID) => {
  const car = await Car.findByIdAndUpdate(carID, { status: 1 }, { new: true });
  IO.emit(messages.carStatusCahnged, { car });
};

const busyDriver = async (driverID) => {
  const driver = await Driver.findByIdAndUpdate(driverID, { status: 1 });
  IO.emit(messages.driverStatusCahnged, { driver });
};

//Personal rooms contain all connections of a single user
const joinPersonalRoom = async (io, socket) => {
  if (!socket?.user?._id) {
    console.log("no user assigned : " + socket.user);
    return;
  };

  const roomId = socket.user._id.toString();
  if (findRoom(roomId) == null) {
    addRoom(roomId);
  }
  console.log("Joined : " + roomId);
  socket.join(roomId);
}

const joinActiveRooms = async (io, socket) => {

  const todayTrips = await Trip.find({
    is_active: true,
    $or: [
      { "passengers.account_id": socket.user._id },
      { "driver.user.account_id": socket.user._id },
    ],
    for_date: {
      $gte: new Date(new Date().setHours(00, 00, 00)),
      $lt: new Date(new Date().setHours(23, 59, 59)),
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
  }).select("for_date for_time status locations _id");

  for (let el of todayTrips) {
    let roomID = el._id.toString();
    socket.join(roomID);
    const room = addRoom(roomID);
    io.in(socket.id).emit(messages.getTripHistory, room.history);

  }
  io.in(socket.id).emit(messages.joinActiveTripsRooms, {
    info: "success",
    docs: todayTrips,
  });
  IO = io;
};

const sendTripList = async (socket) => {
  const todayTrips = await Trip.find({
    is_active: true,
    $or: [
      { "passengers.account_id": socket.user._id },
      { "driver.user.account_id": socket.user._id },
    ],
    for_date: {
      $gte: new Date(new Date().setHours(00, 00, 00)),
      $lt: new Date(new Date().setHours(23, 59, 59)),
    },
    status: { $ne: trpStat.fnshd },
  }).select("for_date for_time status locations _id");

  IO.in(socket.user._id).emit(messages.joinActiveTripsRooms, {
    info: "success",
    docs: todayTrips,
  });
};

const leavFinishedRooms = async (message, socket) => {
  const todayFinishedTrips = await Trip.find({
    _id: message.tripID,
    is_active: true,
    $or: [{ "driver.user.account_id": socket.user._id }],
    for_date: {
      $gte: new Date(new Date().setHours(00, 00, 00)),
      $lt: new Date(new Date().setHours(23, 59, 59)),
    },
    status: trpStat.fnshd,
  }).select("for_date for_time status locations _id");
  for (let el of todayFinishedTrips) {
    IO.in(el._id.toString()).socketsLeave(el._id.toString());
    deleteRoom(el._id.toString());
  }
  const todayTrips = await Trip.find({
    is_active: true,
    $or: [
      { "passengers.account_id": socket.user._id },
      { "driver.user.account_id": socket.user._id },
    ],
    for_date: {
      $gte: new Date(new Date().setHours(00, 00, 00)),
      $lt: new Date(new Date().setHours(23, 59, 59)),
    },
    status: { $ne: trpStat.fnshd },
  }).select("for_date for_time status locations _id");

  IO.in(socket.user._id).emit(messages.joinActiveTripsRooms, {
    info: "success",
    docs: todayTrips,
  });
};

const handleTripStart = async (trip, socket , sentAs) => {
  const { car, driver } = trip;
  if (!moment(trip?.for_date).isSame(new Date(), "day"))
    return sendErrorToClient(
      socket?.id,
      "لطفا در تاریخ سفر  اقدام به شروع نمایید"
    );
  // const timeBeforeStartLimit = await Restriction.findOne({ key: 5 });
  const timeAfterStartLimit = await Restriction.findOne({ key: 6 });
  const nowTime = calcStrMinutes(
    IsoToJalaliWithTime(new Date().toISOString())?.split(" ")[1]
  );
  const tripForTimeInMinutes = calcStrMinutes(timeToString(trip.for_time));
  if (timeAfterStartLimit) {
    if (nowTime - tripForTimeInMinutes > parseInt(timeAfterStartLimit?.value)) {
      return sendErrorToClient(
        socket?.id,
        `از حداکثر زمانی نسبت به زمان درخواست ${timeAfterStartLimit?.value} دقیقه گذشته است.`
      );
    }
  }

  // if (timeBeforeStartLimit) {
  //   if (tripForTimeInMinutes - nowTime > parseInt(timeBeforeStartLimit?.value)) {
  //     return sendErrorToClient(
  //       socket?.id,
  //       `لطفا حداکثر   ${timeBeforeStartLimit?.value} دقیقه قبل از ساعت سفر اقدام به شروع نمایید`
  //     );
  //   }
  // }

  busyCar(car.car_id);
  busyDriver(driver.driver_id);
  trip.status = trpStat.strtd;
  const room = addRoom(trip._id.toString());
  room.addMessage({
    info: "sucess",
    doc: trip,
    finished: false,
  });

  const conClass = getConnectionsInstance();

  let driverClient = conClass.getConnection(trip?.driver?.user?.account_id);
  IO.to(driverClient?.id).emit(messages.changeTripStatusResponse, {
    info: "sucess",
    doc: trip,
    finished: false,
  });

  let { full_name, _id, role } = socket.user;

  if (sentAs == SENT_AS_DRIVER){
    role = roles.driver
  }else{
    role = roles.passenger
  }

  const timing = [...trip.timing];
  timing.push({
    key: 1,
    value: new Date(),
    user: {
      full_name,
      account_id: _id,
      role,
    },
  });
  trip.timing = timing;
  await trip.save();
  // sendTripList(socket);
  IO.to("admins").emit(messages.mutateDraftstList, { trip, method: "delete" });
  let client = conClass.getConnection(trip?.dispatcher[0]?.account_id);
  IO.to(client?.id).emit(messages.mutateDraftstList, {
    trip,
    method: "delete",
  });
  const ids = trip?.passengers?.map((p) => p.account_id);
  const msg = `پیام سیستم مدیریت ناوگان : راننده آقای ${trip?.driver?.user?.full_name || ""} شروع به حرکت کرد.`
  // sendPassengerNotification(ids, msg);
  // sendIrisaMessageNotification(ids , msg);
};

const handleChangePassengerStatus = async (trip, socket, passengerID , sentAs) => {
  const passengers = [...trip.passengers];
  const passenger = passengers.find((pass) =>
    pass.account_id.equals(passengerID || socket.user._id)
  );
  if (!passenger) return sendErrorToClient(socket.id);

  passenger.status = passenger.status + 1;

  // if (passenger.status == pssTrpStat.drvRchdDst) {
  //   sendPassengerNotification([passenger.account_id], "پیام سیستم مدیریت ناوگان : راننده به مبدا رسید.");
  // }



  if (
    passenger.status > 4 ||
    (!sentAs == SENT_AS_DRIVER && passenger.status % 2 !== 0) ||
    (sentAs == SENT_AS_DRIVER && passenger.status % 2 === 0)
  ) {
    console.log("Error C");
    return sendErrorToClient(socket.id);
  }
  const room = addRoom(trip._id.toString());
  room.addMessage({
    info: "sucess",
    doc: trip,
    finished: false,
  });
  sendTripDetails(trip);
  let { full_name, _id, role } = socket.user;
  role = sentAs == SENT_AS_DRIVER ? roles.driver : roles.passenger;
  const key = calculateKey(passenger.status, [role]);

  const timing = [...trip.timing];
  timing.push({
    key,
    value: new Date(),
    passenger_id: passengerID,
    user: {
      full_name,
      account_id: _id,
      role,
    },
  });
  trip.passengers = passengers;
  trip.timing = timing;
  const newTrip = await trip.save();
  if (newTrip.all_arrived) handleTripFinish(newTrip, socket , sentAs);
  else sendTripList(socket);
  if (key === 3) {
    await Request.findByIdAndUpdate(
      passenger?.request_id,
      { status: rqstStat.done },
      { new: true }
    );
  }
};

const handleTripFinish = async (trip, socket , sentAs) => {
  const { car, driver } = trip;
  const interval = trip.distance_props.interval_actual;
  const distance = trip.distance_props.distance_actual;
  freeCar(car.car_id, distance, interval);
  freeDriver(driver.driver_id, distance, interval);
  trip.status = trpStat.fnshd;
  const room = addRoom(trip._id.toString());
  room.addMessage({
    info: "sucess",
    doc: trip,
    finished: true,
  });
  sendTripDetails(trip, true);
  let { full_name, _id, role } = socket.user;
  role = sentAs == SENT_AS_DRIVER ? roles.driver : roles.passenger;
  const timing = [...trip.timing];
  timing.push({
    key: 6,
    value: new Date(),
    user: {
      full_name,
      account_id: _id,
      role,
    },
  });
  trip.timing = timing;
  await trip.save();
  IO.to("admins").emit(messages.mutateDraftstList, { trip });
};

const changeTripStatus = async (message, socket) => {


  let { tripID, passengerID, sentAs } = message;
  const trip = await Trip.findOne({
    _id: tripID,
    is_active: true,
    $or: [
      { "passengers.account_id": socket.user._id },
      { "driver.user.account_id": socket.user._id },
    ],
    status: { $ne: trpStat.fnshd },
    for_date: {
      $gte: new Date(new Date().setHours(00, 00, 00)),
      $lt: new Date(new Date().setHours(23, 59, 59)),
    },
    driver: { $exists: true },
    car: { $exists: true },
  });
  if (!trip) return sendErrorToClient(socket.id);


  // const role = socket.user.role === 1 ? "driver" : "passenger";

  console.log("(sentAs == SENT_AS_DRIVER && passengerID)", (sentAs == SENT_AS_DRIVER && passengerID));
  console.log("sentAs == SENT_AS_PASSENGER", sentAs == SENT_AS_PASSENGER);
  console.log("sentAs == SENT_AS_DRIVER", sentAs == SENT_AS_DRIVER);

  if (trip.status === trpStat.hsCr) {
    if ((sentAs == SENT_AS_DRIVER && passengerID) || sentAs == SENT_AS_PASSENGER) {
      console.log("AsendErrorToClient A");
      return sendErrorToClient(socket.id);
    }
    return handleTripStart(trip, socket , sentAs);
  }
  if (
    (sentAs == SENT_AS_DRIVER && !passengerID) ||
    (sentAs == SENT_AS_PASSENGER && passengerID)
  ) {
    console.log("AsendErrorToClient B");
    return sendErrorToClient(socket.id);
  }

  await handleChangePassengerStatus(trip, socket, passengerID, sentAs);
};

exports.joinActiveRooms = joinActiveRooms;
exports.changeTripStatus = changeTripStatus;
exports.leavFinishedRooms = leavFinishedRooms;
exports.joinPersonalRoom = joinPersonalRoom;
exports.SENT_AS_DRIVER = SENT_AS_DRIVER;
exports.SENT_AS_PASSENGER =SENT_AS_PASSENGER; 

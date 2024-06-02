const { AppError } = require("../../constructor/AppError");
const roles = require("../../global_values/roles");
const { messages } = require("../../global_values/socket");
const { Driver } = require("../../mid_models/driver");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const getPaginateOptions = require("../../utils/paginateHelper");
const { User } = require("../user/model");
const { Car } = require("./model");
const async = require("../../middleware/async");
const { getSort } = require("../../utils/sortHelper");
const mongoose = require("mongoose");
const e = require("connect-flash");
const car_group = require("../../global_values/car_group");
const { Trip } = require("../trip/model");
const { trpStat } = require("../../global_values/status");
const ObjectId = require("mongoose/lib/types/objectid");
const { pushLocationIfFarEnough } = require("../../../location/data");

const deleteCar = async (req, res) => {

  const car_id = new mongoose.Types.ObjectId(req.params.id);
  const car = await Car.findById(car_id);

  if (!car) {
    throw new AppError("خودرویی با این شناسه پیدا نشد.", 406);
  }
  const FREE = 0;
  if (car.status != FREE) {
    throw new AppError("امکان حذف خودرو در حین سفر وجود ندارد.", 406);
  }

  const driver = await Driver.findOne({
    car_id: new mongoose.Types.ObjectId(car_id),
    _id: new mongoose.Types.ObjectId(car.driver.driver_id)
  });
  if (driver != null) {
    driver.car_id = null;
    await driver.save();
  }
  car.is_active = false;
  await car.save();
  res.status(200).send({ info: "seccess", token: "", doc: "" });

}

const updateCar = async (req, res, next) => {
  const { plaque, color_code, name_code, man_year, user_id } = req.body;

  const car_id = req.params.id;
  const car = await Car.findById(car_id);
  if (!car) throw new AppError("خودرویی با این شناسه موجود نیست", 404);

  color_code && (car.color_code = color_code);
  name_code && (car.name_code = name_code);
  man_year && (car.man_year = man_year);

  //if palque changed, check if there is an already existing car with a different car_
  if (plaque) {
    const exisingCarWithPlaque = await Car.findOne({
      $and: [
        { "plaque.f": plaque.f },
        { "plaque.s": plaque.s },
        { "plaque.t": plaque.t },
        { "plaque.l": plaque.l },
      ],
    });
    if (exisingCarWithPlaque && !car._id.equals(exisingCarWithPlaque?._id)) {
      throw new AppError("این پلاک برای خودروی دیگری استفاده شده است.", 406);
    }
    car.plaque = plaque
  }

  const driverChanged = user_id && (user_id != car.driver?.user?.account_id);
  if (driverChanged) {
    const existingDriver = await Driver.findOne({ "user.account_id": user_id });
    if (!existingDriver) {
      const existingUser = await User.findById(user_id);
      const userToInsert = {
        full_name: existingUser.full_name,
        phone_num: existingUser.phone_num,
        emp_num: existingUser.emp_num,
        account_id: existingUser._id,
      }
      const newDriver = await Driver.create({
        car_id: car._id,
        user: userToInsert,
      });

      const oldDriverId = car.driver?.driver_id;
      oldDriverId && car.past_drivers.push(oldDriverId);
      car.driver.driver_id = newDriver._id;
      car.driver.user = userToInsert;

      if (oldDriverId) {
        const oldDriverObj = await Driver.findById(oldDriverId);
        oldDriverObj.past_cars.push(car._id);
        await oldDriverObj.save();
      }
    } else {

      const oldCarId = existingDriver.car_id;
      existingDriver.car_id = car._id;
      existingDriver.past_cars.push(oldCarId);

      const oldDriverId = car.driver?.driver_id;
      oldDriverId && car.past_drivers.push(oldDriverId);

      if (car.driver == null) {
        car.driver = {};
      }
      car.driver.driver_id = existingDriver._id;
      car.driver.user = existingDriver.user;

      const existingDriverLastCar = await Car.findById(oldCarId);
      // existingDriverLastCar.driver = null;
      if (existingDriverLastCar) {
        existingDriverLastCar.past_drivers.push(existingDriver._id);
        await existingDriverLastCar.save();
      }


      await existingDriver.save();
    }
  }
  await car.save();
  res.status(201).send({ info: "seccess", token: "", doc: car });
}

const updateSnapTaxi = async (req, res, next) => {
  const _id = req.params.id;
  let { full_name, phone_num } = req.body;

  full_name = full_name.trim();

  const existingCar = await Car.findOne({ "driver.user.full_name": full_name, group: { $ne: car_group.IRISA } });
  if (existingCar != null) {
    throw new AppError("خودرو با این نام قبلا ثبت شده.", 403);
  }

  const car = await Car.findById(_id);

  if (car.group == car_group.IRISA) {
    throw new AppError("امکان ویرایش خودرو های سازمانی از این اندپوینت وجود ندارد.", 403);
  }

  car.driver.user.full_name = full_name;
  car.driver.user.phone_num = phone_num;
  await car.save();
  res.status(201).send({ info: "seccess", token: "", doc: car });
}

const createSnapTaxi = async (req, res, next) => {
  let { group, full_name, phone_num } = req.body;

  full_name = full_name.trim();

  const existingCar = await Car.findOne({ "driver.user.full_name": full_name, group: { $ne: car_group.IRISA } });

  if (existingCar != null) {
    throw new AppError("این خودرو قبلا ثبت شده است.", 403);
  }

  const props = {};
  props.plaque = { f: 0, s: 0, t: 0, l: "ب" }
  props.color_code = 1;
  props.name_code = 1;
  props.man_year = 1;
  props.total_distance = 0;
  props.total_interval = 0;
  props.status = 0;
  props.is_active = true;
  props.past_drivers = [];
  props.group = group;

  props.driver = {
    user: {
      full_name,
      phone_num,
      emp_num: "0",
      account_id: new mongoose.Types.ObjectId(),
    },
    location: [],
    driver_id: new mongoose.Types.ObjectId()
  }

  const newCar = new Car(props);
  await newCar.save();
  res.status(201).send({ info: "seccess", token: "", doc: newCar });
}

const createCar = async (req, res, next) => {
  let { plaque, color_code, name_code, man_year, user_id } = req.body;
  let driver = await User.findOne({
    _id: user_id,
    role: roles.driver,
    active: true,
  });
  let car = await Car.findOne({
    $or: [
      {
        $and: [
          { "plaque.f": plaque.f },
          { "plaque.s": plaque.s },
          { "plaque.t": plaque.t },
          { "plaque.l": plaque.l },
        ],
      },
      { "driver.user.account_id": user_id },
    ],
  });
  if (car) throw new AppError("خودرو قبلا ثبت نام شده است ", 406);
  if (!driver) return sendErrorByEnviorment("راننده یافت نشد");
  car = await Car.create({
    plaque,
    color_code,
    name_code,
    man_year,
    driver: {
      user: {
        full_name: driver.full_name,
        phone_num: driver.phone_num,
        emp_num: driver.emp_num,
        account_id: driver._id,
      },
    },
  });
  driver = await Driver.create({
    car_id: car._id,
    user: {
      full_name: driver.full_name,
      phone_num: driver.phone_num,
      emp_num: driver.emp_num,
      account_id: driver._id,
    },
  });
  car.driver.driver_id = driver._id;
  await car.save();
  res.status(201).send({ info: "seccess", token: "", doc: "" });
};

const getCarDetailed = async (req, res, next) => {
  const { id: driverId } = req.params;
  const car = await Car.findOne({ "dirver.driver_id": driverId });
  const driver = await Driver.findById(driverId);
  const latest_active_trip = await Trip.findOne({ "driver.driver_id": driverId, status: trpStat.strtd });
  res.status(200).send({
    info: "success",
    token: "",
    doc: { car, driver, latest_active_trip },
  });
}

const getCar = async (req, res, next) => {
  const { id } = req.params;
  const car = await Car.findById(id)
    .populate({
      path: "travels",
      select: "passengers locations for_date for_time",
    })
    .populate("totTravels");
  res.status(200).send({
    info: "success",
    token: "",
    doc: car,
  });
};

const getCarsSelector = (obj) => {
  const { query, total_interval, total_distance, man_year, name_code, group } = obj;

  let groupInts;
  if (group?.length > 0) {
    groupInts = group.map((g) => { return parseInt(g) });
  }

  return {
    ...(groupInts?.length > 0 && { group: { $in: groupInts } }),
    ...(name_code && { name_code }),
    ...(query && {
      $or: [
        { "driver.user.full_name": { $regex: query } },
        { "driver.user.emp_num": { $regex: query } },
      ],
    }),
    ...(man_year && {
      man_year: {
        ...(man_year[0] !== "undefined" && { $gte: man_year[0] }),
        ...(man_year[1] !== "undefined" && { $lte: man_year[1] }),
      },
    }),
    ...(total_distance && {
      total_distance: {
        ...(total_distance[0] !== "undefined" && { $gte: total_distance[0] }),
        ...(total_distance[1] !== "undefined" && { $lte: total_distance[1] }),
      },
    }),
    ...(total_interval && {
      total_interval: {
        ...(total_interval[0] !== "undefined" && { $gte: total_interval[0] }),
        ...(total_interval[1] !== "undefined" && { $lte: total_interval[1] }),
      },
    }),
  };
};

const getCars = async (req, res, next) => {
  const selector = getCarsSelector(req.query);
  selector.is_active = true;
  const cars = await Car.find(selector).select(
    "name_code plaque driver total_distance status group"
  );
  res.status(200).send({
    info: "success",
    token: "",
    docs: cars,
  });
};

const getActiveCars = async (req, res, next) => {
  const selector = getCarsSelector(req.query);
  const options = getPaginateOptions(
    req.query,
    "name_code plaque driver total_distance status group"
  );
  selector.is_active = true;
  const sort = getSort(req);
  const cars = await Car.paginate(selector, { ...options, sort })
  res.status(200).send({
    info: "success",
    ...cars,
  });
};



const saveDriverLocation = async (req, res, next) => {
  const { points, bearing, meta } = req.body;
  const location = points[points.length - 1];
  res.status(200).send({ info: "sucess", doc: "" });

  try {
    await pushLocationIfFarEnough(req.user._id, points[0][0], points[0][1], new Date(), 0);
  } catch (e) {
    console.log("Location service error >>>> " + e.message);
  }

  const driver = await Driver.findOneAndUpdate(
    { "user.account_id": req.user._id, is_active: true, status: 0 },
    { location, speed: meta?.[0].speed || 0, date: meta?.[0].date || new Date() }
  );
  if (!driver) {
    return;
  };
  req.app.get("socketService").emit(
    messages.driverLocationChanged,
    {
      status: 0,
      tripID: null,
      driverID: driver._id,
      location,
    },
    "admins"
  );
  await Car.findOneAndUpdate(
    { _id: driver.car_id },
    { "driver.location": location, "driver.bearing": bearing }
  );

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

exports.updateSnapTaxi = async(updateSnapTaxi);
exports.createSnapTaxi = async(createSnapTaxi);
exports.createCar = async(createCar);
exports.getCar = getCar;
exports.saveDriverLocation = saveDriverLocation;
exports.getCars = getCars;
exports.getCarDetailed = async(getCarDetailed);
exports.getActiveCars = getActiveCars;
exports.updateCar = async(updateCar);
exports.deleteCar = async(deleteCar);

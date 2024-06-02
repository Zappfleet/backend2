const { ObjectId } = require("mongodb");
const { default: mongoose } = require("mongoose");
const { async } = require("node-stream-zip");
const { PAGE_SIZE } = require("../../constants");
const { GpsHistory } = require("../../location/data/gps");
const roles = require("../../_old/global_values/roles");
const { Vehicle, VEHICLE_GROUP_AGENCY } = require("./vehicle-model");
const { makeKeyFromText, getMongoosePaginateOptions } = require("../../utils");
const {
  VehicleGroupModel,
  VehicleServiceModel,
  VehicleColorModel,
  VehicleNameModel,
} = require("./vehicle-secondary-models");
const { UserAccount } = require("../../users/data/models/user-model");
const Region = require("../../regions/data/region-model");

async function getListOfAssignableDrivers() {
  const result = await UserAccount.aggregate([
    {
      $lookup: {
        from: "vehicles",
        localField: "_id",
        foreignField: "driver_user",
        as: "vehicle",
      },
    },
    {
      $match: {
        "vehicle.driver_user": { $exists: false },
        is_active: true,
        role: roles.driver,
      },
    },
  ]);
  return await result.toArray();
}

async function unassignVehicleDriver(vehicle_id) {
  const filter = { _id: new ObjectId(vehicle_id) };
  const args = { driver_user: null };
  const vehicle = await Vehicle.findOneAndUpdate(
    filter,
    { $set: args },
    { new: true }
  );
  if (vehicle == null) {
    return { error: "vehicle not found", status: 404 };
  } else {
    return { vehicle };
  }
}

async function assignDriver(vehicle_id, driver_user) {
  const driver = await UserAccount.findOne({
    _id: new ObjectId(driver_user),
    is_active: true,
  });
  if (driver == null || !driver.role.includes(roles.driver)) {
    return {
      error: "driver not found: specified user not exists or is not a driver",
      status: 404,
    };
  }

  // const existingVehicle = await Vehicle.findOne({ driver_user: driver._id });
  // if (existingVehicle != null && existingVehicle._id.toString() != vehicle_id) {
  //     return { error: "the driver is already assigned to another Vehicle", status: 422 }
  // }

  const filter = { _id: new ObjectId(vehicle_id) };
  const args = {
    driver_user: driver._id,
  };
  const vehicle = await Vehicle.findOneAndUpdate(
    filter,
    { $set: args },
    { new: true }
  );
  return { vehicle, driver };
}

async function listVechilesNoPagination(filter = {}, sort = {}) {
  const result = await Vehicle.find(filter).sort(sort).populate("driver_user");
  return {
    docs: result,
  };
}

async function listVehicles(
  filter = {},
  sort = {},
  page = 1,
  populated = false
) {
  const options = getMongoosePaginateOptions(page, sort);
  if (populated) {
    options.populate = "driver_user";
  }
  filter["extra.agency_name"] = null;
  return await Vehicle.paginate(filter, options);
}

async function listAgencies(filter = {}, sort = {}, page = 1) {
  const options = {
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    sort,
  };
  filter["extra.agency_name"] = { $ne: null };
  return await Vehicle.paginate(filter, options);
}

async function findVehicleById(_id) {
  const vehicle = await Vehicle.findById(_id);
  if (vehicle == null) return null;
  const output = vehicle.toObject();
  if (output.driver_user) {
    output.driver = await UserAccount.findOne({
      _id: new ObjectId(output.driver_user),
    });
  }
  return output;
}

async function updateVehicleById(
  _id,
  group,
  driver_user,
  plaque,
  services,
  extra,
  gps_uid
) {
  const filter = { _id: new ObjectId(_id) };
  const args = {};

  extra && (args.extra = extra);
  group && (args.group = group);
  plaque && (args.plaque = plaque);
  services && (args.services = services);
  driver_user && (args.driver_user = driver_user);
  gps_uid && (args.gps_uid = gps_uid);

  try {
    const updatedVehicle = await Vehicle.findOneAndUpdate(
      filter,
      { $set: args },
      { new: true }
    );
    return updatedVehicle;
  } catch (e) {
    const dbError = e.error?.errors?.extra?.properties?.message;
    return { error: dbError || e.message, status: dbError ? 422 : 500 };
  }
}

async function createVehicle(
  group,
  driver_user,
  plaque,
  services,
  extra,
  status,
  gps_uid
) {
  try {
    const doc = { group, driver_user, plaque, extra, services, gps_uid };
    if (status) {
      doc.status = status;
    }
    const newVehicle = await Vehicle.create(doc);
    return newVehicle;
  } catch (e) {
    const dbError = e.error?.errors?.extra?.properties?.message;
    return { error: dbError || e.message, status: dbError ? 422 : 500 };
  }
}

async function updateAgency(_id, agency_name, agency_phone) {
  const newVehicle = await Vehicle.findByIdAndUpdate(
    _id,
    {
      $set: { extra: { agency_name, agency_phone } },
    },
    { new: true }
  );
  return newVehicle;
}

async function createAgency(agency_name, agency_phone) {
  if ((await Vehicle.findOne({ "extra.agency_name": agency_name })) != null) {
    return {
      error: "an agency with the same name already exists",
      status: 406,
    };
  }
  const doc = {
    group: VEHICLE_GROUP_AGENCY,
    plaque: `${new Date().getTime()}`,
    services: [{ service: "general", capacity: Number.MAX_VALUE }],
    extra: { agency_name, agency_phone },
  };
  const newVehicle = await Vehicle.create(doc);
  return newVehicle;
}

async function updateVehicleLatestGpsArealInfoForAll() {
  const allVehicles = await Vehicle.find({});

  for (const v of allVehicles) {
    await updateVehicleLatestGpsArealInfo(v._id);
  }
}

async function updateVehicleLatestGpsArealInfo(vehicle_id) {
  const targetVehicle = await Vehicle.findById(vehicle_id);

  const owner_id = new ObjectId(
    targetVehicle.gps_uid ? vehicle_id : targetVehicle.driver_user
  );
  const latestGpsInfo = await GpsHistory.findOne({ owner_id }).sort({
    gmt_date: -1,
  });

  if (latestGpsInfo?.coordinates == null) return targetVehicle;

  const areaFilter = {
    location: {
      $geoIntersects: {
        $geometry: {
          type: "Point",
          coordinates: latestGpsInfo.coordinates.reverse(),
        },
      },
    },
  };
  let area = await Region.findOne(areaFilter);
  if (area == null) {
    areaFilter.location.$geoIntersects.$geometry.coordinates =
      latestGpsInfo.coordinates.reverse();
    area = await Region.findOne(areaFilter);
  }

  if (area?._id?.equals(targetVehicle.latest_location_info?.area)) {
    return targetVehicle;
  }

  const filter = { _id: new ObjectId(vehicle_id) };
  const args = {
    latest_location_info:
      area != null
        ? {
            area: area._id,
            gmt_entrance: latestGpsInfo.gmt_date,
          }
        : null,
  };
  const vehicle = await Vehicle.findOneAndUpdate(
    filter,
    { $set: args },
    { new: true }
  );

  return vehicle;
}

async function updateVehicleColorByKey(key, body) {
  try {
    return await VehicleColorModel.findOneAndUpdate(
      { key },
      { $set: body },
      { new: true }
    );
  } catch (e) {
    return {
      status: 400,
      error: e.message,
    };
  }
}

async function updateVehicleGroupByKey(key, body) {
  try {
    return await VehicleGroupModel.findOneAndUpdate(
      { key },
      { $set: body },
      { new: true }
    );
  } catch (e) {
    return {
      status: 400,
      error: e.message,
    };
  }
}

async function updateVehicleServiceGroupByKey(key, body) {
  try {
    return await VehicleServiceModel.findOneAndUpdate(
      { key },
      { $set: body },
      { new: true }
    );
  } catch (e) {
    return {
      status: 400,
      error: e.message,
    };
  }
}

async function insertVehicleGroup(title) {
  try {
    const key = makeKeyFromText(title);
    const vechileGroupModel = await VehicleGroupModel.create({ title, key });
    return vechileGroupModel;
  } catch (e) {
    return {
      status: 400,
      error: e.message,
    };
  }
}

async function insertVehicleColor(title) {
  try {
    const key = makeKeyFromText(title);
    const vechileColorModel = await VehicleColorModel.create({ title, key });
    return vechileColorModel;
  } catch (e) {
    return {
      status: 400,
      error: e.message,
    };
  }
}

async function insertVehicleName(title) {
  try {
    const key = makeKeyFromText(title);
    const vechileNameModel = await VehicleNameModel.create({ title, key });
    return vechileNameModel;
  } catch (e) {
    return {
      status: 400,
      error: e.message,
    };
  }
}

async function updateVehicleNameByKey(key, body) {
  try {
    return await VehicleNameModel.findOneAndUpdate(
      { key },
      { $set: body },
      { new: true }
    );
  } catch (e) {
    return {
      status: 400,
      error: e.message,
    };
  }
}

async function insertVehicleSerivceGroup(title, unit) {
  try {
    const key = makeKeyFromText(title);
    const vechileServiveModel = await VehicleServiceModel.create({
      title,
      unit,
      key,
    });
    return vechileServiveModel;
  } catch (e) {
    return {
      status: 400,
      error: e.message,
    };
  }
}

async function getVehicleGroupsAndServices(include_inactive) {
  const filter = {};
  if (!include_inactive) filter.active = true;

  const services = await VehicleServiceModel.find(filter).sort({
    createdAt: -1,
  });
  const groups = await VehicleGroupModel.find(filter).sort({ createdAt: -1 });
  const colors = await VehicleColorModel.find(filter).sort({ createdAt: -1 });
  const names = await VehicleNameModel.find(filter).sort({ createdAt: -1 });
  return {
    services,
    groups,
    colors,
    names,
  };
}

module.exports.updateVehicleNameByKey = updateVehicleNameByKey;
module.exports.insertVehicleName = insertVehicleName;
module.exports.insertVehicleColor = insertVehicleColor;
module.exports.getVehicleGroupsAndServices = getVehicleGroupsAndServices;
module.exports.updateVehicleColorByKey = updateVehicleColorByKey;
module.exports.updateVehicleGroupByKey = updateVehicleGroupByKey;
module.exports.updateVehicleServiceGroupByKey = updateVehicleServiceGroupByKey;
module.exports.insertVehicleSerivceGroup = insertVehicleSerivceGroup;
module.exports.insertVehicleGroup = insertVehicleGroup;
module.exports.createVehicle = createVehicle;
module.exports.updateVehicleById = updateVehicleById;
module.exports.findVehicleById = findVehicleById;
module.exports.listVehicles = listVehicles;
module.exports.assignDriver = assignDriver;
module.exports.getListOfAssignableDrivers = getListOfAssignableDrivers;
module.exports.unassignVehicleDriver = unassignVehicleDriver;
module.exports.updateVehicleLatestGpsInfo = updateVehicleLatestGpsArealInfo;
module.exports.updateVehicleLatestGpsInfoForAll =
  updateVehicleLatestGpsArealInfoForAll;
module.exports.listVechilesNoPagination = listVechilesNoPagination;
module.exports.createAgency = createAgency;
module.exports.updateAgency = updateAgency;
module.exports.listAgencies = listAgencies;

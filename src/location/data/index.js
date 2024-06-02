const { ObjectId } = require("mongodb");
const { GpsHistory } = require("./gps");
const {
  FavoriteLocation,
  DEFAULT_POINT_TYPE,
} = require("./favorit-location-model");
const { default: mongoose } = require("mongoose");
const { isBoolean } = require("lodash");
const { PAGE_SIZE } = require("../../constants");
const { getMongoosePaginateOptions } = require("../../utils");

const MIN_DISTANCE_METER = 5;

function allowedToModify(location, editor_account_id) {
  if (location == null || location.is_deleted)
    return { error: "Location does not exists!" };

  if (location.is_private && !location.created_by.equals(editor_account_id)) {
    return {
      error: "Private locations can only be modified by their creators",
    };
  }
  return {};
}

async function listFavoriteLocations(user_account_id, options = {}) {
  const showPrivates = {
    user_account_id: new mongoose.Types.ObjectId(user_account_id),
  };
  const showPublics = { is_private: false };

  const $or = [];

  if (!options.show_privates) $or.push(showPrivates);

  if (!options.show_publics) $or.push(showPublics);

  const filter = {
    $or,
    is_deleted: false,
  };

  if (options.search) {
    filter.name = { $regex: options.search };
  }

  const paginateOptions = getMongoosePaginateOptions(
    options.page,
    options.sort
  );

  const favoritLocationList = await FavoriteLocation.paginate(
    filter,
    paginateOptions
  );
  return favoritLocationList;
}

async function deleteFavoriteLocation(_id, editor_account_id) {
  const existingLocation = await FavoriteLocation.findById(_id);

  const modifyPolicyCheck = allowedToModify(
    existingLocation,
    editor_account_id
  );
  if (modifyPolicyCheck.error) return modifyPolicyCheck.error;

  existingLocation.is_deleted = true;
  await existingLocation.save();
  return existingLocation;
}

async function editFavoriteLocation(
  _id,
  name,
  properties = {},
  lnglat,
  is_private,
  editor_account_id
) {
  const existingLocation = await FavoriteLocation.findById(_id);

  const modifyPolicyCheck = allowedToModify(
    existingLocation,
    editor_account_id
  );
  if (modifyPolicyCheck.error) return modifyPolicyCheck.error;

  const locationArgs = {};

  if (name != null) locationArgs.name = name;

  if (isBoolean(is_private)) locationArgs.is_private = is_private;

  if (properties != null) locationArgs.properties = properties;
  if (lnglat != null) {
    locationArgs.location = {
      type: DEFAULT_POINT_TYPE,
      coordinates: lnglat,
    };
  }

  const favoritLocation = await FavoriteLocation.findByIdAndUpdate(
    _id,
    { $set: locationArgs },
    { new: true }
  );
  return { location: favoritLocation };
}

async function createFavoriteLocation(
  name,
  properties = {},
  lnglat,
  created_by_account_id,
  is_private
) {
  const locationArgs = {
    name,
    properties,
    created_by: new mongoose.Types.ObjectId(created_by_account_id),
    is_private,
    location: {
      type: DEFAULT_POINT_TYPE,
      coordinates: lnglat,
    },
  };
  const location = await FavoriteLocation.create(locationArgs);
  return { location };
}

async function pushLocationIfFarEnough(owner_id, lng, lat, gmt_date, speed) {
  const lastLocation = await getLastLocation(owner_id);
  const lastCoordinates = lastLocation?.coordinates || [0, 0];

  const distance = calcCrow(lastCoordinates[1], lastCoordinates[0], lat, lng);

  if (distance < MIN_DISTANCE_METER) {
    return lastLocation;
  }

  const coordinates = [lng, lat];
  return await GpsHistory.create({
    owner_id,
    coordinates,
    speed,
    gmt_date: new Date(gmt_date),
  });
}

async function getLastLocation(owner_id) {
  return await GpsHistory.findOne({ owner_id: new ObjectId(owner_id) }).sort({
    gmt_date: -1,
  });
}

async function getLastLocationOfAll(owner_ids = []) {
  return await GpsHistory.aggregate([
    {
      $group: {
        _id: "$owner_id",
        doc: {
          $max: {
            gmt_date: "$gmt_date",
            coordinates: "$coordinates",
            speed: "$speed",
          },
        },
      },
    },
    {
      $match: {
        _id: { $in: owner_ids.map((id) => new ObjectId(id)) },
      },
    },
  ]);
}

async function getLocationHistory(owner_id, gmt_from, gmt_to) {
  if (gmt_from == null || gmt_to == null)
    throw { message: "programmer error : history range must specify" };
  return await GpsHistory.find({
    owner_id: new ObjectId(owner_id),
    gmt_date: { $gte: new Date(gmt_from), $lt: new Date(gmt_to) },
  });
}

function calcCrow(lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d * 1000;
}

function toRad(Value) {
  return (Value * Math.PI) / 180;
}

module.exports.pushLocationIfFarEnough = pushLocationIfFarEnough;
module.exports.getLastLocation = getLastLocation;
module.exports.getLocationHistory = getLocationHistory;
module.exports.editFavoriteLocation = editFavoriteLocation;
module.exports.getLastLocationOfAll = getLastLocationOfAll;
module.exports.createFavoriteLocation = createFavoriteLocation;
module.exports.deleteFavoriteLocation = deleteFavoriteLocation;
module.exports.listFavoriteLocations = listFavoriteLocations;

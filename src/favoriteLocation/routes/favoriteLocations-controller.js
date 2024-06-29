const { ObjectId } = require("mongodb");
const { GpsHistory } = require("../model/gps");
const {
  FavoriteLocation,
  DEFAULT_POINT_TYPE,
} = require("../model/favorit-location-model");
const { default: mongoose } = require("mongoose");
const { isBoolean } = require("lodash");
const { Car } = require("../../_old/modules/car/model");



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


async function pushLocationIfFarEnough(owner_id, lng, lat, gmt_date, speed) {

  if (owner_id === '-1') {
    owner_id = mongoose.Types.ObjectId('63673ff7e0528db710cf3c1b')
    gmt_date = new Date()
  }
  //console.log(86);
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


const getCarsSelector = (obj) => {
  console.log(801, obj)
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

async function getCars(req, res) {
  console.log(800);
  //const selector = getCarsSelector(req.query);
  // selector.is_active = true;
  // const cars = await Car.find({selector}).select(
  const cars = await Car.find({}).select(
    "name_code plaque driver total_distance status group"
  );
  console.log(803, cars);
  res.status(200).send({
    info: "success",
    token: "",
    docs: cars,
  });
};


async function insert_FavoriteLocation(req, res) {
 // console.log(5);
  const { item } = req.body;

  // Create the favorite object with the correct location format
  const favorite = {
    name: item.name,
    description: item.description,
    created_by: new mongoose.Types.ObjectId(req.auth._id),
    is_private: true,
    location: item.location
  };

  const result = await FavoriteLocation.create(favorite)
  return res.status(200).send(result);
}


async function update_FavoriteLocation(req, res) {
  const _id = req.params.id;
  const { item } = req.body;
  console.log(33,_id,item);
  const editor_account_id = req.auth._id;
  

  const existingLocation = await FavoriteLocation.findById(_id);

  const modifyPolicyCheck = allowedToModify(
    existingLocation,
    editor_account_id
  );

  if (modifyPolicyCheck.error) return modifyPolicyCheck.error;

  const result = await FavoriteLocation.findByIdAndUpdate(
    _id,
    { $set: item },
    { new: true }
  )
  return res.status(200).send(result);
}


async function select_FavoriteLocation(req, res) {

  const result = await FavoriteLocation.find({
    created_by: req.auth._id,
  })
  return res.status(200).send(result);
}


async function delete_FavoriteLocation(req, res) {
  const _id = req.params.id;
  const editor_account_id = req.auth._id;
  const result = await FavoriteLocation.findById(_id);


  // Convert result.created_by to an ObjectId if it is not already one
  const createdByObjectId = new ObjectId(result.created_by);

  if (!createdByObjectId.equals(new ObjectId(editor_account_id))) {
    console.log('Not Permitted');
    return null;
  }

  try {
    const result = await FavoriteLocation.deleteOne({ _id: _id });
    res.status(result.status || 200).send(result);
    return res.status(200).send({
      status: 200,
      data: req.params.id
    });

  } catch (error) {
    console.error(6000);
    return res.status(500).send({
      status: 500,
      error: error.message
    });
  }

}



module.exports = {
  select_FavoriteLocation,
  insert_FavoriteLocation,
  update_FavoriteLocation,
  delete_FavoriteLocation,
  getCars,
  getLastLocationOfAll,
  pushLocationIfFarEnough
};

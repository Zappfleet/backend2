const Location = require("./model");
const async = require("../../middleware/async");
const { AppError } = require("../../constructor/AppError");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const getPaginateOptions = require("../../utils/paginateHelper");
const { getSort } = require("../../utils/sortHelper");

const searchLocations = async (req, res, next) => {
  const { query } = req.query;
  let locations;
  if (!query) {
    locations = await Location.find({
      creator: req.user._id,
    }).select("name lnglat");
  } else
    try {
      locations = await Location.find({
        is_active: true,
        $or: [{ name: { $regex: query } }, { street: { $regex: query } }],
      }).select("name lnglat");
    } catch (error) {
      return res.status(400).send({ info: "unseccessfull", doc: [] });
    }
  return res.status(200).send({
    info: "success",
    docs: locations,
  });
};

const createLocation = async (req, res, next) => {
  const { name, street, alley, plaque, lnglat } = req.body;
  // let location = await Location.findOne({
  //   lnglat: {
  //     $near: {
  //       $geometry: { type: "Point", coordinates: lnglat },
  //       $minDistance: 0,
  //       $maxDistance: 1000,
  //     },
  //   },
  //   creator: req.user._id,
  // });
  // if (location) throw new AppError("موقعیت مورد نظر قبلا ثبت شده است", 400);
  const location = await Location.create({
    name,
    street,
    alley,
    plaque,
    lnglat: {
      coordinates: lnglat,
    },
    creator: req.user._id,
  });
  res.status(201).send({
    info: "success",
    doc: "",
  });
};

const getSelfLocations = async (req, res, next) => {
  const locations = await Location.find({
    creator: req.user._id,
    is_active: true,
  });
  res.status(200).send({
    info: "success",
    doc: locations,
  });
};

const getLocations = async (req, res, next) => {
  const { query, lnglat } = req.query;
  const options = getPaginateOptions(req.query, "name street");
  const sort = getSort(req);
  const locations = await Location.paginate(
    {
      ...(query &&
      {
        $or: [
          { street: { $regex: query } },
          { name: { $regex: query } },
        ],
      }
      )
    },
    { ...options, sort }
  );

  res.status(200).send({
    info: "success",
    ...locations,
  });
};

const deleteLocation = async (req, res, next) => {
  await Location.findByIdAndDelete(req.params.id);
  res.status(200).send({
    info: "success",
    doc: "",
  });
};

const deleteSelfLocation = async (req, res, next) => {
  const location = await Location.findOneAndDelete({
    _id: req.params.id,
    creator: req.user._id,
  });
  if (!location) return sendErrorByEnviorment("موقعیت مورد نظر یافت نشد");
  res.status(200).send({
    info: "success",
    doc: "",
  });
};

exports.searchLocations = async(searchLocations);
exports.createLocation = async(createLocation);
exports.getSelfLocations = async(getSelfLocations);
exports.getLocations = async(getLocations);
exports.deleteLocation = async(deleteLocation);
exports.deleteSelfLocation = async(deleteSelfLocation);

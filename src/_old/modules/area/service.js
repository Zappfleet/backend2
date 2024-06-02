const Area = require("./model");
const async = require("../../middleware/async");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const { User } = require("../user/model");
const roles = require("../../global_values/roles");
const getPaginateOptions = require("../../utils/paginateHelper");
const { getSort } = require("../../utils/sortHelper");

const ERR_DISPATCHER_NOT_FOUND = "توزیع کننده یافت نشد";
const ERR_AREA_NOT_FOUND = "محدوده یا  وجود ندارد ";
const ERR_INVALID_DISPATCHER_OR_AREA = "محدوده یا توزیع کننده مورد نظر وجود ندارد ، اختصاص توزیع کننده";
const ERR_AREA_DELETE_EXCEPTION = "خطای حذف محدوده";

const SIMPLE_SUCCESS_RESPONSE = {
  info: "success",
  token: "",
  doc: "",
}

const deleteArea = async (req, res, next) => {
  const area_id = req.params.id;
  try {
    await Area.findByIdAndDelete(area_id);
    res.status(200).send(SIMPLE_SUCCESS_RESPONSE);
  } catch (e) {
    sendErrorByEnviorment(ERR_AREA_DELETE_EXCEPTION + ":" + e.message)
  }
}

const updateArea = async (req, res, next) => {
  const area_id = req.params.id;
  const { dispatcher_id } = req.body;
  const dispatcher = await User.findOne({
    _id: dispatcher_id,
    is_active: true,
    role: roles.dispatcher,
  });
  if (!dispatcher) sendErrorByEnviorment(ERR_DISPATCHER_NOT_FOUND);
  const area = await Area.findByIdAndUpdate(area_id, areaJsObject(req.body, dispatcher))
  if (!area) return sendErrorByEnviorment(ERR_AREA_NOT_FOUND);
  res.status(200).send(SIMPLE_SUCCESS_RESPONSE);
}

const creatArea = async (req, res, next) => {
  const { dispatcher_id } = req.body;
  const dispatcher = await User.findOne({
    _id: dispatcher_id,
    is_active: true,
    role: roles.dispatcher,
  });
  if (!dispatcher) sendErrorByEnviorment(ERR_DISPATCHER_NOT_FOUND);

  const area = await Area.create(areaJsObject(req.body, dispatcher));
  if (!area) return sendErrorByEnviorment(ERR_AREA_NOT_FOUND);
  res.status(200).send(SIMPLE_SUCCESS_RESPONSE);
};

const assignDispatcher = async (req, res, next) => {
  const { id } = req.params;
  const { dispatcher_id } = req.body;
  const dispatcher = await User.findOne({
    _id: dispatcher_id,
    is_active: true,
    role: roles.dispatcher,
  });
  if (!dispatcher) sendErrorByEnviorment(ERR_DISPATCHER_NOT_FOUND);
  const area = await Area.findByIdAndUpdate(id, {
    $push: {
      dispatcher: {
        full_name: dispatcher.full_name,
        phone_num: dispatcher.phone_num,
        emp_num: dispatcher.emp_num,
        account_id: dispatcher._id,
      },
    },
  });
  if (!area || !dispatcher)
    return sendErrorByEnviorment(ERR_INVALID_DISPATCHER_OR_AREA);
  res.status(200).send(SIMPLE_SUCCESS_RESPONSE);
};

const getAreas = async (req, res, next) => {
  const options = getPaginateOptions(
    req.query,
    "name dispatcher need_manager_approve base_price road_price location"
  );
  const sort = getSort(req);
  const areas = await Area.paginate({ name: { $regex: req.query.query } }, { ...options, sort });
  return res.status(200).send({ info: "success", ...areas });
};

const getArea = async (req, res, next) => {
  const { id } = req.params;
  const area = await Area.findById(id);
  res.status(200).send({ info: "success", doc: area });
};

const areaJsObject = (body, dispatcher) => {
  return {
    location: body.location,
    name: body.name,
    need_manager_approve: body.need_manager_approve,
    base_price: body.base_price,
    road_price: body.road_price,
    dispatcher: [
      {
        full_name: dispatcher.full_name,
        phone_num: dispatcher.phone_num,
        emp_num: dispatcher.emp_num,
        account_id: dispatcher._id,
      },
    ],
  }
}

exports.getArea = getArea;
exports.getAreas = getAreas;
exports.creatArea = async(creatArea);
exports.assignDispatcher = async(assignDispatcher);
exports.updateArea = async(updateArea);
exports.deleteArea = async(deleteArea);

const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const async = require("../../middleware/async");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const { Request } = require("../request/model");
const { checkRequestTime } = require("../request/schema_validator");

const createTripValidator = async (req, res, next) => {
  const schema = Joi.object({
    request_ids: Joi.array().items(Joi.objectId()),
    car_id: Joi.objectId(),
    taxi_cost: Joi.number().optional()
  });
  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });

  if (error) sendErrorByEnviorment(error);

  for (el of req.body.request_ids) {
    const rqst = await Request.findById(el);
    if (!rqst) return sendErrorByEnviorment("درخواست سفر یافت نشد");
  }
  next();
};

const assignCarToTripvalidator = async (req, res, next) => {
  const schema = Joi.object({
    car_id: Joi.objectId().required(),
  });
  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });
  if (error) sendErrorByEnviorment(error);
  next();
};

const reviewTripValidator = async (req, res, next) => {
  const schema = Joi.object({
    desc: Joi.string().allow("").optional(),
    pos_points: Joi.array().items(Joi.number()).optional(),
    neg_points: Joi.array().items(Joi.number()).optional(),
    satisfaction_rate: Joi.number().valid(0, 1, 2, 3, 4).optional(),
  });
  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });
  if (error) sendErrorByEnviorment(error);
  next();
};

const sendTravelledDistanceValidator = async (req, res, next) => {
  const schema = Joi.object({
    points: Joi.array().items(Joi.array().items(Joi.number())).required(),
    bearing: Joi.number(),
  });
  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });
  if (error) sendErrorByEnviorment(error);
  next();
};

const pointSchema = Joi.object({
  adr: Joi.string()
    .required()
    .error(() => Error("آدرس باید وارد شود و از نوع رشته باشد")),
  lnglat: Joi.array().items(Joi.number()).required(),
  coordinates: Joi.optional(),
});

const dispatcherCreateTripValidator = async (req, res, next) => {
  const schema = Joi.object({
    passengers: Joi.array()
      .items(
        Joi.object({
          account_id: Joi.objectId().required(),
          guests: Joi.array().items(Joi.string()).optional(),
          mates: Joi.array().items(Joi.objectId()).optional(),
        })
      )
      .optional(),
    locations: Joi.array().items(Joi.object({
      start: pointSchema.required(),
      finish: pointSchema.required(),
    })).required(),
    for_date: Joi.date()
      // .greater(new Date().toLocaleDateString())
      .required()
      .error(() =>
        Error("تاریخ درخواست سفر باید وارد شود.")
      ),
    for_time: Joi.string()
      .pattern(new RegExp("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"))
      .error(() => Error("ساعت درخواست باید معتبر باشد")),
    proj_code: Joi.number().optional(),
    desc: Joi.string().allow("").optional(),
    car_id: Joi.objectId().required(),
    taxi_cost: Joi.number().optional(),
    distance_override: Joi.number().optional()
  });
  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });
  if (error) sendErrorByEnviorment(error);
  // checkRequestTime(req);
  next();
};

exports.dispatcherCreateTripValidator = async(dispatcherCreateTripValidator);
exports.createTripValidator = async(createTripValidator);
exports.reviewTripValidator = async(reviewTripValidator);
exports.assignCarToTripvalidator = async(assignCarToTripvalidator);
exports.sendTravelledDistanceValidator = async(sendTravelledDistanceValidator);

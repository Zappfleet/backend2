const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const { AppError } = require("../../constructor/AppError");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const { calcStrMinutes } = require("../../utils/timeHelper");
const moment = require("moment");

const getSingleRequestValidator = (req, res, next) => {
  const { id } = req.params;
  const schema = Joi.objectId();
  const { error } = schema.validate(id);
  if (error) throw new AppError("مقدار آی دی وارد شده معتبر نیست", 406);
  next();
};

const pointSchema = Joi.object({
  adr: Joi.string()
    .required()
    .error(() => Error("آدرس باید وارد شود و از نوع رشته باشد")),
  lnglat: Joi.array().items(Joi.number()).required(),
  coordinates: Joi.optional(),
});

const passengerSchema = Joi.object({
  guests: Joi.array().items(Joi.string()).optional(),
  mates: Joi.array().items(Joi.objectId()).optional(),
  account_id: Joi.objectId().required(),
});

const postRequestValidator = (req, res, next) => {
  const schema = Joi.object({
    passenger: passengerSchema.required(),
    locations: Joi.object({
      start: pointSchema.required(),
      finish: pointSchema.required(),
    }).required(),
    for_date: Joi.date()
      .greater(new Date())
      .required()
      .error(() =>
        Error("تاریخ درخواست سفر باید وارد شود و  بعد از زمان حاضر باشد .")
      ),
    for_time: Joi.string()
      .pattern(new RegExp("^(1?[0-9]|2[0-3]):[0-5][0-9]$"))
      .error(() => Error("ساعت درخواست باید معتبر باشد")),
    proj_code: Joi.number().optional(),
    desc: Joi.string().optional(),
    rp_dates: Joi.array()
      .items(Joi.date().greater(req.body.for_date))
      .error(() =>
        Error("تاریخ تکرار باید بعد از تاریخ درخواست رزرو شده باشد")
      ),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return sendErrorByEnviorment(error);
  }
  checkRequestTime(req);

  next();
};

function checkRequestTime(req) {
  if (
    moment(moment(moment().local("fa").format().split("T")[0])).isSame(
      moment(req.body.for_date)
    )
  ) {
    const nowTime = calcStrMinutes(
      moment().local("fa").format().split("T")[1].split("+")[0]
    );
    const reqTime = calcStrMinutes(req.body.for_time);
    if (reqTime - nowTime < 0)
      sendErrorByEnviorment(
        " امکان ثبت درخواست برای قبل از زمان حاضر وجود ندارد "
      );
  }
}

const postSelfRequestValidator = (req, res, next) => {
  const schema = Joi.object({
    passenger: Joi.object({
      guests: Joi.array().items(Joi.string()).optional(),
      mates: Joi.array().items(Joi.objectId()).optional(),
    }).optional(),
    locations: Joi.object({
      start: pointSchema.required(),
      finish: pointSchema.required(),
    }).required(),
    for_date: Joi.date()
      .greater(new Date().toLocaleDateString())
      .required()
      .error(() =>
        Error("تاریخ درخواست سفر باید وارد شود و  بعد از زمان حاضر باشد .")
      ),
    for_time: Joi.string()
      .pattern(new RegExp("^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"))
      .error(() => Error("ساعت درخواست باید معتبر باشد")),
    proj_code: Joi.number().optional(),
    desc: Joi.string().allow("").optional(),
    rp_dates: Joi.array()
      .items(Joi.date().greater(req.body.for_date))
      .error(() =>
        Error("تاریخ تکرار باید بعد از تاریخ درخواست رزرو شده باشد")
      ),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return sendErrorByEnviorment(error);
  }

  checkRequestTime(req);
  next();
};

const checkRequestValidator = async (req, res, next) => {
  const schema = Joi.object({
    result: Joi.number().valid(0, 1).required(),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return sendErrorByEnviorment(error);
  }
  next();
};

const checkManagerRequestValidator = async (req, res, next) => {
  const schema = Joi.object({
    result: Joi.boolean().valid(true, false).required().error(() => Error("")),
  });

  const { error } = schema.validate(req.query, {
    abortEarly: false,
  });

  if (error) {
    return res.send(error);
  }
  next();
}

const changeRequestValidator = async (req, res, next) => {
  const schema = Joi.object({
    for_time: Joi.number().required(),
  });

  const { error } = schema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return sendErrorByEnviorment(error);
  }
  next();
};

exports.checkRequestTime = checkRequestTime;
exports.postRequestValidator = postRequestValidator;
exports.checkRequestValidator = checkRequestValidator;
exports.changeRequestValidator = changeRequestValidator;
exports.postSelfRequestValidator = postSelfRequestValidator;
exports.getSingleRequestValidator = getSingleRequestValidator;
exports.checkManagerRequestValidator = checkManagerRequestValidator;

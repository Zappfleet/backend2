const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const { AppError } = require("../../constructor/AppError");
const async = require("../../middleware/async");

const createAreaValidator = (req, res, next) => {
  const schema = Joi.object({
    location: Joi.object({
      type: Joi.string().valid("Polygon", "Point").required(),
      coordinates: Joi.array()
        .items(
          Joi.array()
            .items(Joi.array().items(Joi.number()).required())
            .required()
        )
        .required(),
    }),
    name: Joi.string().required(),
    dispatcher_id: Joi.objectId().required(),
    need_manager_approve: Joi.boolean().optional(),
    base_price: Joi.number().required(),
    road_price: Joi.number().required(),
    notif_enter: Joi.boolean().optional(),
    notif_exit: Joi.boolean().optional(),
  });
  const { error } = schema.validate(req.body);

  if (error) {
    if (process.env.NODE_ENV === "production" || !process.env.NODE_ENV)
      throw new AppError(`${error}`, 400);
    else throw new AppError("اشکال در ارسال اطلاعات ، کاربر غیر فعال شد", 409);
  }

  next();
};

const assignDispatcherValidator = (req, res, next) => {
  const schema = Joi.object({
    dispatcher_id: Joi.objectId(),
  });
  const { error } = schema.validate(req.body);

  if (error) {
    if (rocess.env.NODE_ENV === "production" || !process.env.NODE_ENV)
      throw new AppError(`${error}`, 400);
    else throw new AppError("اشکال در ارسال اطلاعات ، کاربر غیر فعال شد", 409);
  }

  next();
};

exports.createAreaValidator = async(createAreaValidator);
exports.assignDispatcherValidator = async(assignDispatcherValidator);

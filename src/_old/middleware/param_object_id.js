const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const { sendErrorByEnviorment } = require("../utils/errorHelper");

const paramObjectId = (req, res, next) => {
  const { id, request_id } = req.params;

  const { error: isNotObjectid } = Joi.object({
    id: Joi.objectId(),
    ...(request_id && { request_id: Joi.objectId() }),
  }).validate({
    id,
    ...(request_id && { request_id }),
  });

  if (isNotObjectid)
    return sendErrorByEnviorment("پارمتر باید از نوع آبجکت آی دی باشد");
  next();
};

exports.paramObjectId = paramObjectId;

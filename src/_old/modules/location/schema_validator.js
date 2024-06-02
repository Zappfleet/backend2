const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const { sendErrorByEnviorment } = require("../../utils/errorHelper");

const createLocationValidator = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    street: Joi.string().required(),
    alley: Joi.string().allow(null, ""),
    plaque: Joi.string().allow(null, ""),
    lnglat: Joi.array().items(Joi.number()).required(),
  });

  const { error } = schema.validate(req.body);

  if (error) return sendErrorByEnviorment(error);
  next();
};
exports.createLocationValidator = createLocationValidator;

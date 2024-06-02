const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const moment = require("moment-jalaali");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");

const plaqueSchema = Joi.object({
  f: Joi.number().min(10).max(99).required(),
  s: Joi.number().min(100).max(999).required(),
  t: Joi.number().min(10).max(99).required(),
  l: Joi.string().required(),
});

const getCarValidatorSchema = ({required}) => {
  const validator = {
    plaque: plaqueSchema,
    color_code: Joi.number().min(0).max(9),
    name_code: Joi.number().min(0).max(50),
    man_year: Joi.number().min(1300).max(moment().jYear()),
    user_id: Joi.objectId(),
    group : Joi.number()
  };
  if (required){
    validator.color_code = validator.color_code.required();
    validator.name_code = validator.name_code.required();
    validator.man_year = validator.man_year.required();
    validator.user_id = validator.user_id.required(); 
  }
  return Joi.object(validator);
}

const updateCarValidator = (req, res, next) => {
  const schema = getCarValidatorSchema({required : false});
  const { error } = schema.validate(req.body);

  if (error) {
    sendErrorByEnviorment(error);
  }

  next();
}

const createCarValidator = (req, res, next) => {
  const schema = getCarValidatorSchema({required : true});
  const { error } = schema.validate(req.body);

  if (error) {
    sendErrorByEnviorment(error);
  }

  next();
};

const updateDriverLocatioValidator = async (req, res, next) => {
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

exports.createCarValidator = createCarValidator;
exports.updateCarValidator = updateCarValidator
exports.updateDriverLocatioValidator = updateDriverLocatioValidator;

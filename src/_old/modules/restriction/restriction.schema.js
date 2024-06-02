const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const { AppError } = require("../../constructor/AppError");
const { keyEnum } = require("./restriction.model");


exports.saveRestrictionٰValidator = function (req, res, next) {
console.log(req.body);
  const schema = Joi.object({
    key: Joi.number().valid(...keyEnum).required(),
    value: Joi.required()
  });
  const { error } = schema.validate(req.body);
  if (error) throw new AppError("پارامتر وارد شده معتبر نیست", 406);
  next();
};


const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const async = require("../../middleware/async");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");

const createUserValidator = (req, res, next) => {
  const schema = Joi.object({
    full_name: Joi.string().min(3).max(50).required().messages({
      "string.empty": ` نام کاربر را وارد کنید`,
      "string.min": ` نام کاربر حداقل 3 کارکتر است`,
      "any.required": ` نام کاربر را وارد کنید`,
    }),
    nat_num: Joi.string().min(10).max(11).required().messages({
      "number.base": `  کدملی کاربر را وارد کنید`,
      "number.min": `   فرمت کدملی صحیح نیست`,
      "number.max": `   فرمت کدملی صحیح نیست`,
      "any.required": `  کدملی کاربر را وارد کنید`,
    }),
    phone_num: Joi.string()
      .min(10)
      .max(11)
      .required()
      .messages({
        "number.base": `  شماره همراه کاربر را وارد کنید`,
        "number.min": `  فرمت شماره همراه صحیح نیست `,
        "number.max": `  فرمت شماره همراه صحیح نیست `,
        "any.required": `  شماره همراه کاربر را وارد کنید`,
      }),
    emp_num: Joi.number()
      .min(111)
      .max(9999999999)
      .allow("")
      .optional()
      .messages({
        "number.min": `  فرمت کدپرسنلی صحیح نیست `,
        "number.max": `  فرمت کدپرسنلی صحیح نیست `,
      }),
    role: Joi.array().required().messages({
      "number.base": `  نقش کاربر را وارد کنید`,
      "any.only": `  نقش کاربر را وارد کنید`,
      "any.required": `  نقش کاربر را وارد کنید`,
    }),
    // permissions: Joi.object({
    //   POST: Joi.array().items(Joi.number().min(0).max(20)).optional(),
    //   PUT: Joi.array().items(Joi.number().min(0).max(20)).optional(),
    //   GET: Joi.array().items(Joi.number().min(0).max(20)).optional(),
    //   DELETE: Joi.array().items(Joi.number().min(0).max(20)).optional(),
    // }).optional(),
  });
  const { error } = schema.validate(req.body);

  if (error) return sendErrorByEnviorment(error);

  next();
};

const saveFirebaseTokenValidator = async (req, res, next) => {
  const schema = Joi.object({
    firebase_token: Joi.string().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) return sendErrorByEnviorment(error);
  next();
};

const checkMangerProjectInfoValidator = async (req, res, next) => {
  const schema = Joi.object({
    proj_code: Joi.string().min(4).required().messages({
      "string.empty": ` کد پروژه را وارد کنید`,
      "string.min": ` کد پروژه حداقل 4 کارکتر است`,
      "any.required": ` کد پروژه را وارد کنید`,
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) return sendErrorByEnviorment(error);

  next();
};

const updateUserProfileValidator = async (req, res, next) => {
  
  const schema = Joi.object({
    avatar: Joi.optional().allow(''),
    phone_num: Joi.number()
      .min(9000000000)
      .max(9999999999)
      .optional()
      .messages({
        "number.base": `  شماره همراه کاربر را وارد کنید`,
        "number.min": `  فرمت شماره همراه صحیح نیست `,
        "number.max": `  فرمت شماره همراه صحیح نیست `,
        "any.required": `  شماره همراه کاربر را وارد کنید`,
      }),
    current_password: Joi.string().optional(),
    password: Joi.string()
      .min(6)
      .max(12)
      .optional()
      .messages({
        "string.base": `رمز عبور باید از نوع رشته باشد`,
        "string.empty": ` رمز عبور را وارد کنید`,
        "string.min": ` رمز عبور حداقل 6 کارکتر است`,
        "string.max": ` رمز عبور حداکثر 11 کاراکتر است`,
        "string.pattern.base": ` رمز عبور باید شامل حروف انگلیسی و اعداد و کارکترهای خاص(@$!%*#?&) باشد`,
        "any.required": ` رمز عبور را وارد کنید`,
      }),
  });

  const { error } = schema.validate(req.body);

  if (error) return sendErrorByEnviorment(error);

  next();
};

exports.deligationValidator = async (req, res, next) => {
  const schema = Joi.object({
    user_id: Joi.objectId().required(),
    permissions: Joi.object().keys({
      GET: Joi.array().items(Joi.number()),
      POST: Joi.array().items(Joi.number()),
      PUT: Joi.array().items(Joi.number()),
      DELETE: Joi.array().items(Joi.number())
    }).required()
  });
  const { error } = schema.validate(req.body);
  if (error) return sendErrorByEnviorment(error);
  next();
}

exports.checkMangerProjectInfoValidator = checkMangerProjectInfoValidator;
exports.updateUserProfileValidator = updateUserProfileValidator;
exports.saveFirebaseTokenValidator = async(saveFirebaseTokenValidator);
exports.createUserValidator = async(createUserValidator);

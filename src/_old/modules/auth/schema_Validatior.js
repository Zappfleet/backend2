const Joi = require("joi");
const { AppError } = require("../../constructor/AppError");
const async = require("../../middleware/async");

const signupStepOneValidator = (req, res, next) => {
  const schema = Joi.object({
    nat_num: Joi.string().min(10).max(11).required().messages({
      "number.base": ` شماره ملی را وارد کنید`,
      "number.empty": ` شماره ملی را وارد کنید`,
      "number.min": `کدملی معتبر نیست`,
      "number.max": `کدملی معتبر نیست`,
      "any.required": ` شماره ملی را وارد کنید`,
    }),
    emp_num: Joi.number().min(111).required().messages({
      "number.base": ` کد پرسنلی را وارد کنید`,
      "number.empty": ` کد پرسنلی را وارد کنید`,
      "number.min": `کدپرسنلی معتبر نیست`,
      "number.max": `کدپرسنلی معتبر نیست`,
      "any.required": ` کد پرسنلی را وارد کنید`,
    }),
    phone_num: Joi.string().min(10).max(11).required().messages({
      "number.base": ` شماره همراه را وارد کنید`,
      "number.empty": ` شماره همراه را وارد کنید`,
      "number.min": `شماره همراه معتبر نیست`,
      "number.max": `شماره همراه معتبر نیست`,
      "any.required": ` شماره همراه را وارد کنید`,
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    if (process.env.NODE_ENV === "production" || !process.env.NODE_ENV)
      throw new AppError(`${error}`, 400);
    else throw new AppError("اشکال در ارسال اطلاعات ، کاربر غیر فعال شد", 409);
  }

  next();
};

const signupStepTwoValidator = (req, res, next) => {
  const schema = Joi.object({
    temp_num: Joi.string().min(6).max(6).required(),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    if (process.env.NODE_ENV === "production" || !process.env.NODE_ENV)
      throw new AppError(`${error}`, 400);
    else throw new AppError("اشکال در ارسال اطلاعات ، کاربر غیر فعال شد", 409);
  }

  next();
};

const signinvalidator = (req, res, next) => {
  const schema = Joi.object({
    is_passenger : Joi.boolean().optional(),
    username: Joi.string().min(6).required().messages({
      "string.empty": ` نام کاربری را وارد کنید`,
      "string.min": ` نام کاربری حداقل 6 کارکتر است`,
      "any.required": ` نام کاربری را وارد کنید`,
    }),
    password: Joi.string()
      // .pattern(
      //   new RegExp(
      //     `^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-+]).{8,}$`
      //   )
      // )
      .min(6)
      .max(12)
      .required()
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

  if (error) {
    if (process.env.NODE_ENV === "production" || !process.env.NODE_ENV)
      throw new AppError(`${error}`, 400);
    else throw new AppError("اشکال در ارسال اطلاعات ، کاربر غیر فعال شد", 409);
  }

  next();
};

exports.signupStepOneValidator = async(signupStepOneValidator);
exports.signupStepTwoValidator = async(signupStepTwoValidator);
exports.signinvalidator = async(signinvalidator);

const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const async = require("../../middleware/async");
const { TempAcc } = require("./model");
const { AppError } = require("../../constructor/AppError");
const jwt = require("jsonwebtoken");
const config = require("config");

const signupAuth = async function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) throw new AppError("دسترسی ممنوع . توکن ارائه نشده است", 401);

  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

    const user = await TempAcc.findById(decoded._id);

    if (user.temp_num_exp < Date.now()) {
      await user.delete();
      next(new AppError("کداعتبار سنجی منقضی شده است", 401));
    }
    req.user = user;
    next();
  } catch (ex) {
    throw new AppError("دسترسی ممنوع . توکن نامعتبر است", 401);
  }
};

exports.signupAuth = async(signupAuth);

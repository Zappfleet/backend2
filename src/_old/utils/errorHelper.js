const { AppError } = require("../constructor/AppError");

const DEFAULT_ERROR = "اشکال در ارسال اطلاعات ، کاربر غیر فعال شد";
const NODE_ENV = process.env.NODE_ENV;

const sendErrorByEnviorment = (error) => {
  if (NODE_ENV === "development" || !NODE_ENV)
    throw new AppError(`${error}`, 400);
  else throw new AppError(DEFAULT_ERROR, 409);
};
exports.sendErrorByEnviorment = sendErrorByEnviorment;

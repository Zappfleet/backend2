const jwt = require("jsonwebtoken");
const config = require("config");
const { User } = require("../modules/user/model");
const { AppError } = require("../constructor/AppError");
const roles = require("../global_values/roles");


module.exports = async function (req, res, next) {
    const token = req.header("x-auth-token");
    if (!token) throw new AppError("دسترسی ممنوع . توکن ارائه نشده است", 401);
  
    try {
      const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
      const user = await User.findOne({
        nat_num: decoded.nat_num,
        role: roles.manager,
      });
      if (!user?.is_active)
        next(new AppError("دسترسی ممنوع، کاربر غیر فعال است.", 401));
      req.user = user;
      next();
    } catch (ex) {
      console.log(ex);
      throw new AppError("دسترسی ممنوع . توکن نامعتبر است", 401);
    }
  };
  
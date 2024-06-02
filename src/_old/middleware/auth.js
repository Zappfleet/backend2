const jwt = require("jsonwebtoken");
const config = require("config");
const { User } = require("../modules/user/model");
const { AppError } = require("../constructor/AppError");

module.exports = async function (req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).json({ info: "دسترسی ممنوع . توکن ارائه نشده است" });
  
  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(401).json({ info: "دسترسی ممنوع، کاربر ناموجود." });
    }
    if (!user?.is_active) {
      return res.status(401).json({ info: "دسترسی ممنوع، کاربر غیر فعال است." });
    }
    user.manager = decoded.manager;
    req.user = user;
    next();
  } catch (ex) {
    console.log(ex.message);
    return res.status(401).json({ info: "دسترسی ممنوع . توکن نامعتبر است" });
  }
};


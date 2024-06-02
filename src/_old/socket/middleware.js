const { User } = require("../modules/user/model");
const config = require("config");
const jwt = require("jsonwebtoken");

module.exports = async (socket, next) => {
  const token = socket.handshake.headers["x-auth-token"];
  if (!token) next(new Error("توکن ارائه نشده است"));
  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
    const user = await User.findById(decoded._id);
    if (!user?.is_active)
      next(new Error("دسترسی ممنوع، کاربر غیر فعال است.", 401));
    socket.user = decoded;
    next();
  } catch (ex) {
    next(new Error("دسترسی ممنوع . توکن نامعتبر است", 401));
  }
};

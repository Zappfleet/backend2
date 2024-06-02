const { AppError } = require("../constructor/AppError");
const { defaultPermitions } = require("../global_values/default_permissions");

const can = (method, id) => {
  return (req, res, next) => {
    if (id === undefined) throw new AppError("دسترسی نامشخص", 403);
    if (!defaultPermitions.passenger[method].includes(id) && req.user.manager)
      throw new AppError("اجازه انجام عملیات صادر نشد", 403);
    const permissions = req.user.permissions;
    const deligatedPermissions = req.user?.deligated_permissions?.permissions;
    const can =
      permissions[method].includes(id) ||
      (deligatedPermissions
        ? deligatedPermissions[method].includes(id)
        : false);
    if (!can) throw new AppError("اجازه انجام عملیات صادر نشد", 403);
    next();
  };
};

const canOnQuery = (req, res, next) => {
  const { step } = req.query;
  if (!step) throw new AppError("مقدار جستجسو وارد نشده  است .", 400);
  const permissions = req.user.permissions;
  step.forEach((element) => {
    const can = permissions["GET"].includes(parseInt(element) + 9);
    if (!can) throw new AppError("شما اجازه این عملیات را ندارید.", 403);
  });
  next();
};
const canRole = (roles) => {
  return (req, res, next) => {
    
    const { user } = req;
    if (!roles.some(r=>user.role.includes(r)))
      throw new AppError("شما اجازه این عملیات را ندارید.", 403);
    next();
  };
};


exports.can = can;
exports.canRole = canRole;
exports.canOnQuery = canOnQuery;

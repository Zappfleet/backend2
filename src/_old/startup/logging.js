const logger = require("../middleware/logger");
var getIP = require("ipware")().get_ip;

module.exports = (req, res, next) => {
  var ipInfo = getIP(req);
  logger.info(`${req?.method}\t${ipInfo?.clientIp}\t${req?.url}`);
  next();
};

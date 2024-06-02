let ExpressBrute = require("express-brute"),
  MemcachedStore = require("express-brute-memcached"),
  moment = require("moment"),
  store;

if (!process.env.NODE_ENV || process.env.NODE_ENV == "development") {
  store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
} else {
  // stores state with memcached

  //sgh
  store = new MemcachedStore(["127.0.0.1"], {
    prefix: "NoConflicts",
  });
}

const failCallback = function (req, res, next, nextValidRequestDate) {
  res.status(403).send({
    info: `تعداد درخواست های شما بیش از حد مجاز است لطفا بعدا از ${translate(moment(
      nextValidRequestDate
    ).fromNow())} دوباره تلاش کنید`,
  }); // brute force protection triggered, send them back to the login page
};
const handleStoreError = function (error) {
  log.error(error); // log this error so we can figure out what went wrong
  // cause node to exit, hopefully restarting the process fixes the problem
  throw {
    message: error.message,
    parent: error.parent,
  };
};
// Start slowing requests after 5 failed attempts to do something for the same user
const userBruteforce = new ExpressBrute(store, {
  freeRetries: 5,
  minWait: 5 * 60 * 1000, // 5 minutes
  maxWait: 60 * 60 * 1000, // 1 hour,
  failCallback: failCallback,
  handleStoreError: handleStoreError,
});
// No more than 1000 login attempts per day per IP
const globalBruteforce = new ExpressBrute(store, {
  freeRetries: 1000,
  attachResetToRequest: false,
  refreshTimeoutOnRequest: false,
  minWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
  maxWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
  lifetime: 24 * 60 * 60, // 1 day (seconds not milliseconds)
  failCallback: failCallback,
  handleStoreError: handleStoreError,
});
module.exports = { globalBruteforce, userBruteforce };


function translate(fromNow) {
  return fromNow.replace("in", "")
    .replace("minutes", "دقیقه")
    .replace("minute", "دقیقه")
    .replace("seconds", "ثانیه")
    .replace("second", "ثانیه")
    .replace("hours", "ساعت")
    .replace("hour", "ساعت")
    .replace("days", "روز")
    .replace("a few", "چند")
    .replace("a", "یک")
    .replace("day", "روز").trim()
}
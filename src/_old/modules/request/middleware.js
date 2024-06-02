const { AppError } = require("../../constructor/AppError");
const permissions = require("../../global_values/permissions");
const roles = require("../../global_values/roles");
const { rqstStat } = require("../../global_values/status");
const { rqstStep } = require("../../global_values/steps");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const { calcMinutes, calcStrMinutes } = require("../../utils/timeHelper");
const { Restriction } = require("../restriction/restriction.model");
const { Request } = require("./model");
const moment = require("moment");
const { IsoToJalaliWithTime } = require("../../utils/dateHelper");

const checkSpecificity = async (req, res, next) => {
  const restrictions = await Restriction.find({ key: { $in: [1, 2, 3, 4] } });
  const MIN_TIME_BETWEEN_REQUEST =
    restrictions.find((r) => r.key === 3)?.value || 30;
  const firstTimeInDay = restrictions
    .find((r) => r.key === 2)
    ?.value?.split(":");
  const lasTimeInDay = restrictions.find((r) => r.key === 1)?.value?.split(":");
  const timeBeforeTodayRequest = restrictions.find((r) => r.key === 4)?.value;
  let forDateArr = req.body.rp_dates
    ? [...req.body.rp_dates, req.body.for_date]
    : [req.body.for_date];
  let accountIdArr = req.body?.passenger?.mates
    ? [
        ...req.body.passenger.mates,
        req.body.passenger.account_id || req.user._id,
      ]
    : [req.body?.passenger?.account_id || req.user._id];
  let query = {
    for_date: { $in: forDateArr },
    $or: [
      { "passenger.account_id": { $in: accountIdArr } },
      { "passenger.mates.account_id": { $all: accountIdArr } },
    ],
    status: { $nin: [rqstStat.cncBPS, rqstStat.rjBMn, rqstStat.rjBDs] },
  };
  const reqForDateInMinutes = calcStrMinutes(req.body.for_time);
  if (firstTimeInDay) {
    if (
      moment()
        .set({ hour: firstTimeInDay[0], minute: firstTimeInDay[1] })
        .isAfter(new Date())
    )
      throw new AppError(
        ` لطفا بعد از ساعت ${
          firstTimeInDay[0] + ":" + firstTimeInDay[1]
        }  اقدام به ثبت درخواست نمایید`,
        406
      );
  }
  if (lasTimeInDay) {
    if (
      moment()
        .set({ hour: lasTimeInDay[0], minute: lasTimeInDay[1] })
        .isBefore(new Date())
    )
      throw new AppError(
        ` لطفا فردا قبل از ساعت ${
          lasTimeInDay[0] + ":" + lasTimeInDay[1]
        }  اقدام به ثبت درخواست نمایید`,
        406
      );
  }
  if (timeBeforeTodayRequest) {
    if (moment(req.body.for_date).isSame(new Date(), "day")) {
      const nowTime = calcStrMinutes(
        IsoToJalaliWithTime(new Date().toISOString())?.split(" ")[1]
      );
      if (reqForDateInMinutes - nowTime < timeBeforeTodayRequest)
        throw new AppError(
          `امکان ثبت درخواست برای زودتر از ${timeBeforeTodayRequest} دقیقه ی آینده وجود ندارد.`,
          406
        );
    }
  }

  const moments = forDateArr.map((date) => moment(date));
  const minDate = moment();
  const maxDate = moment.max(moments);
  const dayDiff = maxDate.diff(minDate, 'days');

  if (dayDiff >= 7) {
    throw new AppError(
      "امکان ثبت درخواست فقط برای هفت روز آینده امکان پذیر است.",
      406
    );
  }
  
  const smRqst = await Request.find(query).select("for_time");
  if (smRqst.length === 0) return next();
  for (el of smRqst) {
    const smRqstForTimeInMinutes = calcMinutes(el.for_time);
    if (
      Math.abs(reqForDateInMinutes - smRqstForTimeInMinutes) <
      MIN_TIME_BETWEEN_REQUEST
    )
      throw new AppError(
        "اجازه ثبت درخواست صادر نشد ، در این تاریخ و ساعت درخواست دیگری ثبت شده است",
        406
      );
  }

  
  next();
};

const isResponsibleAndCan = async (req, res, next) => {
  const rqst = await Request.findOne({
    _id: req.params.id,
    step: rqstStep.crtBps,
    status: {
      $nin: [
        rqstStat.cncBPS,
        rqstStat.rjBMn,
        rqstStat.rjBDs,
        rqstStat.inTDr,
        rqstStat.plITr,
      ],
    },
  });
  if (!rqst) return sendErrorByEnviorment("درخواست سفر مورد نظر یافت نشد");
  const condition = rqst?.responsible_users?.includes(req.user._id);
  const role = req?.user?.role;
  if (role < roles.manager)
    return sendErrorByEnviorment(
      "نقش کابر اجازه انجام تایید یا رد درخواست را ندارد"
    );
  if (!condition && role !== roles.admin)
    return sendErrorByEnviorment(
      "کاربر اجازه انجام تایید یا رد درخواست را ندارد"
    );
  const permId = permissions.PUT.rqst;
  const perm = req?.user?.permissions?.PUT;

  if (Array.isArray(perm)) {
    for (el of perm) {
      if (el >= permId) return next();
    }
    return sendErrorByEnviorment(
      "دسترسی کابر اجازه انجام تایید یا رد درخواست را ندارد"
    );
  } else {
    return sendErrorByEnviorment("آرایه دسترسی یافت نشد");
  }
};

exports.checkSpecificity = checkSpecificity;
exports.isResponsibleAndCan = isResponsibleAndCan;

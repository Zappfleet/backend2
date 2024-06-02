const moment = require("moment");
const { AppError } = require("../../constructor/AppError");
const { rqstStat } = require("../../global_values/status");
const { rqstStep } = require("../../global_values/steps");
const { Request } = require("../../modules/request/model");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const { calcMinutes } = require("../../utils/timeHelper");
const { getRoleString, getAdministrativeRole } = require("../../utils/userHelper");

const canReuestsMakeTrip = async (requestsArr, user) => {
  const role = getAdministrativeRole(user.role);
  const { full_name, phone_num, emp_num, _id: account_id } = user;
  let for_date;
  let for_time;
  let locations = [];
  let passengers = [];
  let distance_props;
  let cost_managers = [];
  // const {value:minTimeBetweenTripRequests} = await VarDate.findOne({key:"MIN_TIME_BETWEEN_TRIP_REQUESTS"});
  const minTimeBetweenTripRequests = 30;
  const rqsts = [];

  const requestPassengerIds = [];

  for (el of requestsArr) {
    const index = requestsArr.indexOf(el);
    const rqst = await Request.findOne({
      _id: el,
      status: { $in: [rqstStat.acBMn, rqstStat.snBDs, rqstStat.plITr, rqstStat.inTDr] },
      ...(role != "admin" && role != "superDispatcher" && { [`${role}.account_id`]: user._id }),
      is_active: true,
    });

    if (!rqst) throw new AppError("درخواست سفر یافت نشد", 404);
    
    requestPassengerIds.push(rqst.passenger.account_id);
    
    const currentDate = new Date(moment().local("fa").format().split("T")[0]);
    const date_has_expired = moment(rqst.for_date).isBefore(currentDate);
    
    const isToday = moment(rqst.for_date).isSame(currentDate)
    if (date_has_expired) {
      throw new AppError(
        `تاریخ درخواست ${rqst.passenger.full_name} گذشته است`,
        400
      );
    }
    const now = moment().local("fa").format().split("T")[1].split(":");
    const time_has_expired = rqst.for_time < parseInt(now[0] + now[1]);

    if (isToday && time_has_expired) {
      throw new AppError(
        `زمان درخواست سفر ${rqst.passenger.full_name} گذشته است`,
        400
      );
    }
    if (!rqst) return sendErrorByEnviorment(`درخواست سفر ${el}یافت نشد`);
    if (index > 0) {
      if (!moment(for_date).isSame(rqst.for_date))
        return sendErrorByEnviorment("تاریخ های درخواست های سفر یکسان نیست");
      const timeBetweenRequests =
        calcMinutes(rqst.for_time) - calcMinutes(for_time);
      if (Math.abs(timeBetweenRequests) > minTimeBetweenTripRequests) {
        throw new AppError(
          ` فاصله زمانی درخواست ها بیش از ${minTimeBetweenTripRequests} دقیقه است`,
          406
        );
      }
      if (timeBetweenRequests < 0) for_time = rqst.for_time;
      if (rqst.distance_props?.interval > distance_props.interval)
        distance_props = rqst.distance_props;
    }
    const newMainPass = {
      ...rqst.passenger.toObject(),
      desc : rqst.desc || '',
      request_id: rqst._id,
    };
    cost_managers.push(rqst?.cost_manager)
    rqsts.push(rqst);
    locations.push(rqst.locations);
    passengers.push(newMainPass);
    for_date = rqst.for_date;
    distance_props = distance_props ? distance_props : rqst.distance_props;
    for_time = for_time ? for_time : rqst.for_time;
  }

  let hasDuplicate = false;
  for (let i = 0; i < requestPassengerIds.length; i++) {
    const id = requestPassengerIds[i];
    for (let k = 0; k < requestPassengerIds.length; k++) {
      if (k == i) continue;
      const otherId = requestPassengerIds[k];
      if (otherId.equals(id)) {
        hasDuplicate = true;
      }
    }
  }
  if (hasDuplicate) {
    throw new AppError("امکان ثبت درخواست های مختلف یک مسافر در یک سفر وجود ندارد.", 404);
  }

  const dispatcher = [{ full_name, phone_num, emp_num, account_id }]
  return {
    rqsts,
    locations,
    passengers,
    for_date,
    for_time,
    distance_props,
    cost_managers,
    dispatcher
  };
};

const checkTripRequests = async (req, res, next) => {

  const {
    rqsts,
    locations,
    passengers,
    for_date,
    for_time,
    distance_props,
    cost_managers,
    dispatcher
  } = await canReuestsMakeTrip(req.body.request_ids, req.user);
  req.body.locations = locations;
  req.body.passengers = passengers;
  req.body.for_date = for_date;
  req.body.for_time = for_time;
  req.body.cost_managers = cost_managers
  req.body.dispatcher = dispatcher
  req.body.distance_props = distance_props;
  for (el of rqsts) {
    el.step = rqstStep.dr;
    el.status = rqstStat.inTDr;
    el.dispatcher = [
      {
        full_name: req.user.full_name,
        phone_num: req.user.phone_num,
        emp_num: req.user.emp_num,
        account_id: req.user._id,
      },
      ...el.dispatcher,
    ];
    await el.save();
  }
  next();
};

exports.checkTripRequests = checkTripRequests;
exports.canReuestsMakeTrip = canReuestsMakeTrip;

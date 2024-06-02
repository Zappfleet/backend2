const { getRqstMngr, getRqstDsptchr, sendMyIrisaNotification } = require("../../utils/irisaHelper");
const async = require("../../middleware/async");
const { User } = require("../user/model");
const { Request } = require("./model");
const { AppError } = require("../../constructor/AppError");
const roles = require("../../global_values/roles");
const { rqstStep } = require("../../global_values/steps");
const { rqstStat } = require("../../global_values/status");
const { sendErrorByEnviorment } = require("../../utils/errorHelper");
const getPaginateOptions = require("../../utils/paginateHelper");
const { calculateRequestDistance } = require("../../utils/DistanceHelper");
const { getRoleString, getRolePersian, getAdministrativeRole } = require("../../utils/userHelper");
const { sendNotification, sendMutateRequestList } = require("../../utils/notificationHelper");
const { getSort } = require("../../utils/sortHelper");
const permissions = require("../../global_values/permissions");
const { isoToJalali, timeToString } = require("../../utils/dateHelper");


const getUserRoleRequests = async (req, res, next) => {

  const role = getAdministrativeRole(req.user.role);

  let {
    step,
    status: rqstStatus,
    query: search,
    for_time,
    for_date,
    dispatcher,
  } = req.query;
  step = step?.map((s) => parseInt(s));

  const deligations = req?.user?.deligated_permissions?.permissions || { GET: [], PUT: [], DELETE: [], POST: [] };
  const permissionExists = deligations?.GET?.includes(permissions.GET.rqstLs)
  const adminDeligated = permissionExists && ["admin", "superDispatcher"].includes(getAdministrativeRole(req?.user?.deligated_permissions?.role));

  if (role === "dispatcher" && step != null && !adminDeligated) {
    step = step.filter((item) => item != 0);
  }
  if (rqstStatus && !Array.isArray(rqstStatus))
    return sendErrorByEnviorment("وضعیت باید آرایه ای باشد");
  else rqstStatus = rqstStatus?.map((r) => parseInt(r));
  const status = role === "dispatcher" ? rqstStat.snBDs : rqstStat.snBMn;

  const options = getPaginateOptions(
    req.query,
    "distance passenger for_date for_time area_id status step locations cost_manager past_for_time desc"
  );

  const query = {
    ...(!rqstStatus
      ? {
        status: {
          $nin: [
            rqstStat.cncBPS,
            rqstStat.rjBMn,
            rqstStat.rjBDs,
            rqstStat.inTDr,
            rqstStat.plITr,
          ],
        },
      }
      : {
        status: {
          $in: rqstStatus,
        },
      }),
    step: { $in: step },
    ...((!["admin", "superDispatcher"].includes(role) && !adminDeligated) && {
      $or: [{ [`${role}.account_id`]: req.user._id }, {
        [`${req?.user?.deligated_permissions?.role}.account_id`]: req?.user?.deligated_permissions?.account_id
      }]
    }),
    ...(search && {
      $or: [
        { "passenger.full_name": { $regex: search } },
        { "passenger.phone_num": { $regex: search } },
        { "passenger.emp_num": { $regex: search } },
        { "locations.start.adr": { $regex: search } },
        { "locations.finish.adr": { $regex: search } },
      ],
    }),
    ...(for_date && {
      for_date: {
        ...(for_date[0] && { $gte: new Date(for_date[0]) }),
        ...(for_date[1] && { $lte: new Date(for_date[1]) }),
      },
    }),
    ...(for_time && {
      for_time: {
        ...(for_time[0] && { $gte: for_time[0] }),
        ...(for_time[1] && { $lte: for_time[1] }),
      },
    }),
    ...(dispatcher &&
      role === "admin" && { "dispatcher.account_id": dispatcher }),
  };

  if (role === "dispatcher" && !adminDeligated) {
    query["dispatcher.account_id"] = req.user._id;
  }

  const defaultSort = { for_date: 1, for_time: 1 };
  const sort = getSort(req, defaultSort)

  if (!sort.for_date) {
    sort.for_date = defaultSort.for_date;
    sort.for_time = defaultSort.for_time;
  }

  const rqsts = await Request.paginate(query, { ...options, sort });

  res.status(200).send({ info: "suceess", ...rqsts });
  rqsts?.docs?.forEach((rqst) => {
    if (rqst.status !== status && rqst.status == rqstStat.crtBPs && role !== "admin") {
      rqst.status = status;
      rqst.save();
    }
  });
};

const getUserRoleSpecificRequest = async (req, res, next) => {

  const role = getAdministrativeRole(req.user.role);

  const userRoleRequests = await Request.findOne({
    _id: req.params.id,
    ...((!["admin", "superDispatcher"].includes(role) || !["admin", "superDispatcher"].includes(req?.user?.deligated_permissions?.role)) && {
      $or: [{ [`${role}.account_id`]: req.user._id }, {
        [`${req?.user?.deligated_permissions?.role}.account_id`]: req?.user?.deligated_permissions?.account_id
      }]
    }),
  }).populate({ path: "travel_id", select: "car driver locations passenger" });
  res.status(200).send({
    info: "success",
    token: "",
    doc: userRoleRequests,
  });
};

const createRequest = async (req, res, next) => {
  let { passenger, locations, proj_code, for_date, for_time, rp_dates, desc } =
    req.body;
  let mainUser;
  if (passenger?.account_id) {
    mainUser = await User.findOne({
      _id: passenger.account_id,
      is_active: true,
    });
    if (!mainUser || !mainUser.emp_num)
      return sendErrorByEnviorment("مسافر مورد نظر یافت نشد");
  } else {
    mainUser = req.user;
  }
  proj_code = parseInt(proj_code);

  let managerObj = await getRqstMngr(proj_code, mainUser.emp_num);
  if (!managerObj)
    return res.status(406).send({ info: "خطا در برقراری اتصال با وب سرویس" });
  if (managerObj == "expired")
    return res.status(400).send({ info: "تاریخ پروژه به پایان رسیده است" });
  if (managerObj == "inValidProject")
    return res.status(400).send({ info: "کدپروژه نامعتبر" });
  if (!managerObj.manager)
    throw new AppError(
      "امکان ثبت درخواست برای این پروژه وجود ندارد.مدیرپروژه/هزینه ثبت نام نکرده است",
      406
    );
  let dispatcherObj = await getRqstDsptchr(
    locations.start.lnglat,
    locations.finish.lnglat
  );

  if (!dispatcherObj)
    throw new AppError(
      "محدوده ثبت نشده است یا توزیع کننده ندارد، لطفا با مدیر خود تماس بگیرید"
    );
  let step = rqstStep.crtBps;
  let status = rqstStat.crtBPs;

  if (dispatcherObj.noNeedManagerApprove) {
    step = rqstStep.mn;
    status = rqstStat.acBMn;
  }

  const mates = [];
  if (passenger?.mates)
    for (el of passenger?.mates) {
      if (el === passenger?.account_id)
        return sendErrorByEnviorment("مسافر اصلی نمی تواند جرو همراهان باشد");
      const mate = await User.findOne({ _id: el, is_active: true });
      if (!mate || !mate.emp_num)
        return sendErrorByEnviorment("همراه مورد نظر یافت نشد");
      mates.push({
        full_name: mate.full_name,
        phone_num: mate.phone_num,
        emp_num: mate.emp_num,
        account_id: mate._id,
      });
    }
  res.status(201).send({ info: `درخواست سفر ایجاد شد`, docs: "" });

  let for_timeArr = for_time.split(":");
  for_time = parseInt(for_timeArr[0] + for_timeArr[1]);
  const distance_props = await calculateRequestDistance(locations);
  // const distance_props = { distance : 0, interval : 0 }

  const tripRqst = {
    area_id: dispatcherObj?._id,
    cost_manager: {...managerObj.cost_center , proj_code},
    manager: managerObj.manager,
    passenger: {
      full_name: mainUser.full_name,
      emp_num: mainUser.emp_num,
      phone_num: mainUser.phone_num,
      account_id: mainUser._id,
      guests: passenger?.guests,
      mates,
    },
    distance_props,
    dispatcher: dispatcherObj.dispatcher,
    locations,
    for_date,
    for_time,
    desc,
    creator: req.user._id,
    status,
    step,
  };

  const rqst = await Request.create(tripRqst);
  tripRqst._id = rqst._id;

  if (!dispatcherObj.noNeedManagerApprove) {
    sendMyIrisaNotification(tripRqst);
  }

  sendMutateRequestList(req, rqst, 'add', 'create');
  if (rp_dates && rp_dates.length > 0)
    for (const el of rp_dates) {
      const newTrp = { ...tripRqst };
      newTrp.for_date = el;
      delete newTrp._id;
      const rq = await Request.create(newTrp);
      newTrp._id = rq._id;
      sendMutateRequestList(req, rq, 'add', 'create');
      sendMyIrisaNotification(newTrp);
    }
};

const checkRequest = async (req, res, next) => {
  const role = getAdministrativeRole(req.user.role);
  const { result } = req.body;
  const rqst = await Request.findOne({
    _id: req.params.id,
    status: {
      $nin: [
        rqstStat.cncBPS,
        rqstStat.rjBMn,
        rqstStat.rjBDs,
        rqstStat.inTDr,
        rqstStat.plITr,
      ],
    },
    ...((!["admin", "superDispatcher"].includes(role) || !["admin", "superDispatcher"].includes(req?.user?.deligated_permissions?.role)) && {
      $or: [{ [`${role}.account_id`]: req.user._id }, {
        [`${req?.user?.deligated_permissions?.role}.account_id`]: req?.user?.deligated_permissions?.account_id
      }]
    }),
  });
  if (!rqst) {
    if (result) {
      return sendErrorByEnviorment("امکان تایید درخواست در این وضعیت وجود ندارد.");
    } else {
      return sendErrorByEnviorment("امکان لغو در خواست با این وضعیت وجود ندارد.")
    }
  };
  res.status(200).send({
    info: "success",
    token: "",
    doc: "",
  });
  const condition = role === "dispatcher";
  rqst.step = condition ? rqstStep.ds : rqstStep.mn;
  if (condition) {
    rqst.status = result ? rqstStat.acBDs : rqstStat.rjBDs;
  } else {
    rqst.status = result ? rqstStat.acBMn : rqstStat.rjBMn;
  }
  await rqst.save();
  const payload = {};
  const roleString = getRolePersian(req.user.role);
  if (result) {
    payload.title = "تایید درخواست";
    payload.message = `درخواست شما مورد تایید قرار گرفت`;
    sendMutateRequestList(req, rqst, 'add', 'create');
  } else {
    payload.title = "رد درخواست";
    payload.message = `درخواست شما رد شد.`;
    sendMutateRequestList(req, rqst, 'delete', 'create');
  }
  sendNotification(rqst.passenger.account_id, payload.title, payload.message, rqst._id.toString(), "request", 'passenger');
};

const getSelfRequests = async (req, res, next) => {
  let { step, history, for_date, status, sort } = req.query;
  if (step && Array.isArray(step)) step = step.map((s) => parseInt(s));

  const selfRqsts = await Request.find({
    is_active: true,
    ...(status && { status: { $in: status } }),
    "passenger.account_id": req.user._id,
    ...(!history && step && { step: { $in: step } }),
    ...(for_date && {
      for_date: {
        ...(for_date[0] && { $gte: new Date(for_date[0]) }),
        ...(for_date[1] && { $lte: new Date(for_date[1]) }),
      },
    }),
  })
    .select("for_date for_time passenger locations status")
    .sort({
      ...(sort?.for_date && { for_date: parseInt(sort?.for_date) }),
      ...(sort?.for_time && { for_time: parseInt(sort?.for_time) }),
    });

  res.status(200).send({ info: "success", docs: selfRqsts });
};

const cnclSlfRqst = async (req, res, next) => {
  const { id } = req.params;
  const request = await Request.findOne({
    _id: id,
    "passenger.account_id": req.user._id,
    status: {
      $in: [rqstStat.crtBPs, rqstStat.acBMn, rqstStat.snBDs, rqstStat.snBMn],
    },
    is_active: true,
  });
  if (!request)
    throw new AppError("امکان لغو درخواست در این مرحله وجود ندارد", 406);

  sendMutateRequestList(req, request, 'delete', 'create');

  request.status = rqstStat.cncBPS;
  res.status(200).send({
    info: "سفر با موفقیت لغو شد",
    doc: request,
  });
  request.save();

};

const getSelfSpeceficRequest = async (req, res, next) => {
  const { id } = req.params;
  const selfRqsts = await Request.findOne({
    _id: id,
    is_active: true,
    $or: [{ "passenger.account_id": req.user._id }],
  }).populate({
    path: "travel_id",
    select:
      "car driver locations passengers for_date for_time is_active all_arrived dispatcher",
  });

  if (!selfRqsts) return sendErrorByEnviorment("درخواست مورد نظر یافت نشد");

  const newSelfObj = { ...selfRqsts.toObject() };

  res.status(200).send({ info: "success", doc: newSelfObj });
};

const changeRequestTime = async (req, res, next) => {
  const role = getAdministrativeRole(req.user.role);
  const { id } = req.params;
  const request = await Request.findOne({
    _id: id,
    status: {
      $nin: [rqstStat.cncBPS, rqstStat.rjBMn, rqstStat.rjBDs, rqstStat.plITr],
    },
    for_date: {
      $gte: new Date(new Date().setHours(00, 00, 00)),
    },
    step: { $in: [rqstStep.ds, rqstStep.mn] },
    ...((!["admin", "superDispatcher"].includes(role) || !["admin", "superDispatcher"].includes(req?.user?.deligated_permissions?.role)) && {
      $or: [{ [`${role}.account_id`]: req.user._id }, {
        [`${req?.user?.deligated_permissions?.role}.account_id`]: req?.user?.deligated_permissions?.account_id
      }]
    }),
  });
  if (!request) return sendErrorByEnviorment("درخواست مورد نظر یافت نشد");
  res.status(200).send({ info: "success", doc: "" });
  if (!request?.past_for_time) request.past_for_time = []
  request?.past_for_time?.push({
    from: request.for_time, to: req.body.for_time, by: {
      full_name: req.user.full_name,
      role: req.user.role,
      account_id: req.user._id
    }
  })
  const oldTime = request.for_time;
  const formattedDate = isoToJalali(request.for_date.toISOString());
  request.for_time = req.body.for_time;
  await request.save();
  const title = "تغییر ساعت درخواست";

  const message = `درخواست تاریخ ${formattedDate} ساعت ${timeToString(oldTime)} به ساعت ${timeToString(request.for_time)} تغییر یافت`;
  sendNotification(request.passenger.account_id, title, message, request._id, "request", 'passenger')

};

const checkManagerRequest = async (req, res, next) => {
  const { result } = req.query;
  const { id } = req.params;
  const rqst = await Request.findOneAndUpdate({
    _id: id,
    step: rqstStep.crtBps,
    status: {
      $nin: [
        rqstStat.acBMn,
        rqstStat.snBDs,
        rqstStat.cncBPS,
        rqstStat.rjBMn,
        rqstStat.rjBDs,
        rqstStat.inTDr,
        rqstStat.plITr,
      ],
    },
  }, { status: result == true ? rqstStat.acBMn : rqstStat.rjBMn, step: result == true ? rqstStep.mn : rqstStep.crtBps });


  let Text = 'امکان تغییر وضعیت درخواست مورد نظر وجود ندارد!';
  if (!rqst)
    return res.status(200).send(`<html>
      <h1>${Text}</h1>
    </html>`);
  const SuccessText = 'درخواست مسافر تایید شد';
  const FailiorText = 'درخواست مسافر رد شد';
  Text = result ? SuccessText : FailiorText;
  res.status(200).send(`<html>
    <h1>${Text}</h1>
  </html>`);

  const requestObj = await Request.findById(id);

  const payload = {};
  if (result == true) {
    payload.title = "تایید درخواست";
    payload.message = `درخواست شما مورد تایید قرار گرفت`;
    sendMutateRequestList(req, requestObj, 'add', 'create');
  } else {
    payload.title = "رد درخواست";
    payload.message = `درخواست شما رد شد.`;
    sendMutateRequestList(req, requestObj, 'delete', 'create');
  }

  sendNotification(requestObj.passenger.account_id, payload.title, payload.message, requestObj._id.toString(), "request", 'passenger');

}

exports.checkManagerRequest = checkManagerRequest;
exports.changeRequestTime = changeRequestTime;
exports.getUserRoleRequests = async(getUserRoleRequests);
exports.getUserRoleSpecificRequest = async(getUserRoleSpecificRequest);
exports.createRequest = async(createRequest);
exports.getSelfRequests = async(getSelfRequests);
exports.getSelfSpeceficRequest = async(getSelfSpeceficRequest);

exports.cnclSlfRqst = async(cnclSlfRqst);
exports.checkRequest = async(checkRequest);

const permissions = require("./permissions");
const { GET, POST, PUT, DELETE } = permissions;

const GENERAL_PERMISSION_GROUP = "1";
const REQ_PERMISSION_GROUP = "2";
const TRIP_PERMISSION_GROUP = "3";
const CAR_PERMISSION_GROUP = "4";
const LOCATION_PERMISSION_GROUP = "5";
const AREA_PERMISSION_GROUP = "6";
const USER_PERMISSION_GROUP = "7";

const PERMISSION_GROUPS = {
  [GENERAL_PERMISSION_GROUP]: {
    value: GENERAL_PERMISSION_GROUP,
    label: 'اختیارات عمومی',
    permissions: [
      {
        key: "slRqstLs",
        value: 0,
        method: "GET"
      },
      {
        key: "slRqstDt",
        value: 1,
        method: "GET"
      },
      {
        key: "slTrpLs",
        value: 2,
        method: "GET"
      },
      {
        key: "slTrpDt",
        value: 3,
        method: "GET"
      },
      {
        key: "slLc",
        value: 4,
        method: "GET"
      },
      {
        key: "srchLcs",
        value: 5,
        method: "GET"
      },
      {
        key: "srchUsr",
        value: 6,
        method: "GET"
      },
      {
        key: "dlofaut",
        value: 0,
        method: "POST"
      },
      {
        key: "slRqst",
        value: 1,
        method: "POST"
      },
      {
        key: "slLc",
        value: 2,
        method: "POST"
      },
      {
        key: "slTr",
        value: 0,
        method: "PUT"
      },
      {
        key: "slRqst",
        value: 1,
        method: "PUT"
      },
      {
        key: "slLc",
        value: 0,
        method: "DELETE"
      },
    ]
  },
  [REQ_PERMISSION_GROUP]: {
    value: REQ_PERMISSION_GROUP,
    label: 'مدیریت درخواست ها',
    permissions: [
      {
        key: "rqstLs",
        value: 7,
        method: "GET"
      },
      {
        key: "rqstDt",
        value: 8,
        method: "GET"
      },
      {
        key: "rqst",
        value: 3,
        method: "POST"
      },
      {
        key: "rqst",
        value: 2,
        method: "PUT"
      },
      {
        key: "rqst",
        value: 2,
        method: "DELETE"
      },
    ]
  },
  [TRIP_PERMISSION_GROUP]: {
    value: TRIP_PERMISSION_GROUP,
    label: 'مدیریت سفر ها',
    permissions: [
      {
        key: "trpDrftLs",
        value: 14,
        method: "GET"
      },
      {
        key: "trpsDrftDt",
        value: 15,
        method: "GET"
      },
      {
        key: "trpLs",
        value: 16,
        method: "GET"
      },
      {
        key: "trpDt",
        value: 17,
        method: "GET"
      },
      {
        key: "trpDrft",
        value: 4,
        method: "POST"
      },
      {
        key: "prvTrp",
        value: 8,
        method: "POST"
      },
      {
        key: "trpDrft",
        value: 11,
        method: "PUT"
      },
      {
        key: "trp",
        value: 3,
        method: "PUT"
      },
      {
        key: "trp",
        value: 3,
        method: "DELETE"
      },
    ]
  },
  [CAR_PERMISSION_GROUP]: {
    value: CAR_PERMISSION_GROUP,
    label: 'مدیریت خودرو ها',
    permissions: [
      {
        key: "acCrLs",
        value: 18,
        method: "GET"
      },
      {
        key: "acCrDt",
        value: 19,
        method: "GET"
      },
      {
        key: "crLs",
        value: 23,
        method: "GET"
      },
      {
        key: "crDt",
        value: 24,
        method: "GET"
      },
      {
        key: "cr",
        value: 7,
        method: "POST"
      },
      {
        key: "asCrDrv",
        value: 5,
        method: "PUT"
      },
      {
        key: "car",
        value: 8,
        method: "PUT"
      },
      {
        key: "car",
        value: 6,
        method: "DELETE"
      },
    ]
  },
  [LOCATION_PERMISSION_GROUP]: {
    value: LOCATION_PERMISSION_GROUP,
    label: 'مدیریت مکان ها',
    permissions: [
      {
        key: "lcs",
        value: 20,
        method: "GET"
      },
      {
        key: "lc",
        value: 5,
        method: "POST"
      },
      {
        key: "lc",
        value: 6,
        method: "PUT"
      },
      {
        key: "lc",
        value: 1,
        method: "DELETE"
      },
    ]
  },
  [AREA_PERMISSION_GROUP]: {
    value: AREA_PERMISSION_GROUP,
    label: 'مدیریت محدوده ها',
    permissions: [
      {
        key: "arls",
        value: 21,
        method: "GET"
      },
      {
        key: "arDt",
        value: 22,
        method: "GET"
      },
      {
        key: "ar",
        value: 6,
        method: "POST"
      },
      {
        key: "asArDsp",
        value: 4,
        method: "PUT"
      },
      {
        key: "ar",
        value: 7,
        method: "PUT"
      },
      {
        key: "ar",
        value: 5,
        method: "DELETE"
      },
    ]
  },
  [USER_PERMISSION_GROUP]: {
    value: USER_PERMISSION_GROUP,
    label: 'مدیریت کاربران',
    permissions: [
      {
        key: "usrs",
        value: 25,
        method: "GET"
      },
      {
        key: "usrDt",
        value: 26,
        method: "GET"
      },
      {
        key: "usr",
        value: 9,
        method: "POST"
      },
      {
        key: "usr",
        value: 10,
        method: "PUT"
      },
      {
        key: "usr",
        value: 4,
        method: "DELETE"
      },
    ]
  },
};

const getPermissionValues = (groupNames) => {
  const output = {
    GET: [],
    POST: [],
    PUT: [],
    DELETE: []
  };
  for (let i = 0; i < groupNames.length; i++) {
    const name = groupNames[i];
    const p = PERMISSION_GROUPS[name].permissions;
    for (let k = 0; k < p.length; k++) {
      output[p[k].method].push(p[k].value);
    }
  }
  return output;
}

const defaultPassengerPermitions = getPermissionValues([GENERAL_PERMISSION_GROUP]);
const defaultDriverPermitions = getPermissionValues([GENERAL_PERMISSION_GROUP]);

const defaultDispatcherPermitions = getPermissionValues([
  GENERAL_PERMISSION_GROUP,
  REQ_PERMISSION_GROUP,
  LOCATION_PERMISSION_GROUP,
  TRIP_PERMISSION_GROUP,
  CAR_PERMISSION_GROUP,
]);

const defaultManagerPermitions = getPermissionValues([
  GENERAL_PERMISSION_GROUP,
  REQ_PERMISSION_GROUP,
  TRIP_PERMISSION_GROUP,
  CAR_PERMISSION_GROUP,
]);

const defaultAdminPermitions = getPermissionValues([
  GENERAL_PERMISSION_GROUP,
  REQ_PERMISSION_GROUP,
  TRIP_PERMISSION_GROUP,
  CAR_PERMISSION_GROUP,
  LOCATION_PERMISSION_GROUP,
  AREA_PERMISSION_GROUP,
  USER_PERMISSION_GROUP
]);


// const defaultPassengerPermitions = {
//   GET: [
//     GET.slRqstLs,
//     GET.slRqstDt,
//     GET.slTrpLs,
//     GET.slTrpDt,
//     GET.slLc,
//     GET.srchLcs,
//     GET.srchUsr,
//   ],
//   POST: [POST.dlofaut, POST.slRqst, POST.slLc],
//   PUT: [PUT.slRqst, PUT.slTr],
//   DELETE: [DELETE.slLc],
// };
// const defaultAdminPermitions = {
//   GET: [...Object.values(GET)],
//   POST: [...Object.values(POST)],
//   PUT: [...Object.values(PUT)],
//   DELETE: [...Object.values(DELETE)],
// };
// const defaultDispatcherPermitions = {
//   GET: [
//     ...defaultPassengerPermitions.GET,
//     GET.rqstLs,
//     GET.rqstDt,
//     // GET.s1Rqsts,
//     // GET.s2Rqsts,
//     GET.trpDrftLs,
//     GET.trpsDrftDt,
//     GET.trpLs,
//     GET.trpDt,
//     GET.acCrLs,
//     GET.acCrDt,
//   ],
//   POST: [...defaultPassengerPermitions.POST, POST.trpDrft],
//   PUT: [...defaultPassengerPermitions.PUT, PUT.rqst, PUT.trp],
//   DELETE: [...defaultPassengerPermitions.DELETE, DELETE.trp],
// };
// const defaultDriverPermitions = {
//   GET: [GET.slTrpLs, GET.slTrpDt],
//   PUT: [PUT.slTr],
// };
// const defaultManagerPermitions = {
//   GET: [
//     ...defaultDispatcherPermitions.GET,
//     // GET.s0Rqsts
//   ],
//   POST: [...defaultDispatcherPermitions.POST],
//   PUT: [...defaultDispatcherPermitions.PUT, PUT.rqst],
//   DELETE: [...defaultDispatcherPermitions.DELETE],
// }

exports.defaultPermitions = {
  passenger: defaultPassengerPermitions,
  admin: defaultAdminPermitions,
  dispatcher: defaultDispatcherPermitions,
  superDispatcher: defaultDispatcherPermitions,
  driver: defaultDriverPermitions,
  manager: defaultManagerPermitions,
};

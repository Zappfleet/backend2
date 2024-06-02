const GENERAL_PERMISSION_GROUP = "1";
const REQ_PERMISSION_GROUP = "2";
const TRIP_PERMISSION_GROUP = "3";
const CAR_PERMISSION_GROUP = "4";
const LOCATION_PERMISSION_GROUP = "5";
const AREA_PERMISSION_GROUP = "6";
const USER_PERMISSION_GROUP = "7";

const allPermissions = [
    {
      value:GENERAL_PERMISSION_GROUP,
      label: 'اختیارات عمومی',
      permissions: [
        { 
                key : "slRqstLs",
                value : 0,
                method : "GET" 
        },
        { 
                key : "slRqstDt",
                value : 1,
                method : "GET" 
        },
        { 
                key : "slTrpLs",
                value : 2,
                method : "GET" 
        },
        { 
                key : "slTrpDt",
                value : 3,
                method : "GET" 
        },
        { 
                key : "slLc",
                value : 4,
                method : "GET" 
        },
        { 
                key : "srchLcs",
                value : 5,
                method : "GET" 
        },
        { 
                key : "srchUsr",
                value : 6,
                method : "GET" 
        },
        { 
                key : "dlofaut",
                value : 0,
                method : "POST" 
        },
        { 
                key : "slRqst",
                value : 1,
                method : "POST" 
        },
        { 
                key : "slLc",
                value : 2,
                method : "POST" 
        },
        { 
                key : "slTr",
                value : 0,
                method : "PUT" 
        },
        { 
                key : "slRqst",
                value : 1,
                method : "PUT" 
        },
        { 
                key : "slLc",
                value : 0,
                method : "DELETE" 
        },
        ] 
    },
    {
      value:REQ_PERMISSION_GROUP,
      label:'مدیریت درخواست ها',
      permissions: [
        { 
                key : "rqstLs",
                value : 7,
                method : "GET" 
        },
        { 
                key : "rqstDt",
                value : 8,
                method : "GET" 
        },
        { 
                key : "rqst",
                value : 3,
                method : "POST" 
        },
        { 
                key : "rqst",
                value : 2,
                method : "PUT" 
        },
        { 
                key : "rqst",
                value : 2,
                method : "DELETE" 
        },
        ] 
    },
    {
      value:TRIP_PERMISSION_GROUP,
      label:'مدیریت سفر ها',
      permissions: [
                { 
                        key : "trpDrftLs",
                        value : 14,
                        method : "GET" 
                },
                { 
                        key : "trpsDrftDt",
                        value : 15,
                        method : "GET" 
                },
                { 
                        key : "trpLs",
                        value : 16,
                        method : "GET" 
                },
                { 
                        key : "trpDt",
                        value : 17,
                        method : "GET" 
                },
                { 
                        key : "trpDrft",
                        value : 4,
                        method : "POST" 
                },
                { 
                        key : "prvTrp",
                        value : 8,
                        method : "POST" 
                },
                { 
                        key : "trpDrft",
                        value : 11,
                        method : "PUT" 
                },
                { 
                        key : "trp",
                        value : 3,
                        method : "PUT" 
                },
                { 
                        key : "trp",
                        value : 3,
                        method : "DELETE" 
                },
        ] 
    },
    {
      value:CAR_PERMISSION_GROUP,
      label:'مدیریت خودرو ها',
      permissions: [
        { 
                key : "acCrLs",
                value : 18,
                method : "GET" 
        },
        { 
                key : "acCrDt",
                value : 19,
                method : "GET" 
        },
        { 
                key : "crLs",
                value : 23,
                method : "GET" 
        },
        { 
                key : "crDt",
                value : 24,
                method : "GET" 
        },
        { 
                key : "cr",
                value : 7,
                method : "POST" 
        },
        { 
                key : "asCrDrv",
                value : 5,
                method : "PUT" 
        },
        { 
                key : "car",
                value : 8,
                method : "PUT" 
        },
        { 
                key : "car",
                value : 6,
                method : "DELETE" 
        },
   
       
        ] 
    },
    {
      value:LOCATION_PERMISSION_GROUP,
      label:'مدیریت مکان ها',
      permissions: [
        { 
                key : "lcs",
                value : 20,
                method : "GET" 
        },
        { 
                key : "lc",
                value : 5,
                method : "POST" 
        },
        { 
                key : "lc",
                value : 6,
                method : "PUT" 
        },
        { 
                key : "lc",
                value : 1,
                method : "DELETE" 
        },
     
   
       
        ] 
    },
    {
      value:AREA_PERMISSION_GROUP,
      label:'مدیریت محدوده ها',
      permissions: [
        { 
                key : "arls",
                value : 21,
                method : "GET" 
        },
        { 
                key : "arDt",
                value : 22,
                method : "GET" 
        },
        { 
                key : "ar",
                value : 6,
                method : "POST" 
        },
        { 
                key : "asArDsp",
                value : 4,
                method : "PUT" 
        },
        { 
                key : "ar",
                value : 7,
                method : "PUT" 
        },
        { 
                key : "ar",
                value : 5,
                method : "DELETE" 
        },
     
   
        ] 
    },
    {
      value:USER_PERMISSION_GROUP,
      label:'مدیریت کاربران',
      permissions: [
        { 
                key : "usrs",
                value : 25,
                method : "GET" 
        },
        { 
                key : "usrDt",
                value : 26,
                method : "GET" 
        },
        { 
                key : "usr",
                value : 9,
                method : "POST" 
        },
        { 
                key : "usr",
                value : 10,
                method : "PUT" 
        },
      
        { 
                key : "usr",
                value : 4,
                method : "DELETE" 
        },
        ] 
    },
    
  ];
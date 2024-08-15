const { default: axios } = require("axios");
const config = require("config");
const https = require("https");
const crypto = require("crypto");
const RequestNotif = require("../requestnotifs/data/requestnotifs");
const { UserAccount } = require("../users/data/models/user-model");
const { isoToJalali, timeToString } = require("../_old/utils/dateHelper");


const getZappToken = async () => {
  return await axios.post(
    "https://frame.irisaco.com/api/auth/token/rest/v1.0",
    {
      username: "zapptaxi",
      password: "NEWZ@PPT@x!%23123",
    }
  );
};

const getEmployeeCostCenter = async (personel_code) => {
  const empManager = await getEmployeeManager(personel_code);
  try {
    return await getCostCenterInfo(empManager.COD_CC_EMPL);
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getEmployeeManager = async (personel_code, token) => {
  try {
    const response = await axios.post(
      "https://frame.irisaco.com/api/sql2cs/do/erp_organization_manager/rest/v1.0",
      { employeeNumber: parseInt(personel_code) },
      { headers: { Authorization: token || (await getZappBearerToken()) } }
    );
    return JSON.parse(response.data.data)[0];
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getProjCodeInfo = async (projectNumber, token) => {
  try {
    const response = await axios.post(
      "https://frame.irisaco.com/api/sql2cs/do/erp_project_info/rest/v1.0",
      { projectNumber: parseInt(projectNumber) },
      { headers: { Authorization: token || (await getZappBearerToken()) } }
    );
    return JSON.parse(response.data.data)[0];
  } catch (e) {
    console.log(e);
    return null;
  }
};



const axiosInstance = axios.create({
  timeout: 30000,
  httpsAgent: new https.Agent({
    secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
  }),
});

// const getIrisaToken = async () => {
//   try {
//     request = await axiosInstance({
//       method: "post",
//       url: "https://frame.irisaco.com/api/auth/token/rest/v1.0",
//       data: {
//         username: "zapptaxi",
//         password: "NEWZ@PPT@x!%23123",
//       },
//     });
//     return request.data.token;
//   } catch (error) {
//     console.log("message", error.message);
//     throw new AppError("خطا در اتصال به سرور اصلی ", 400);
//   }
// }


const getListOfCostCenters = async (irisaToken) => {
  // console.log(332);
  if (irisaToken == null) {
    irisaToken = await getZappBearerToken();
  }
  try {
    const axiosInstance = axios.create({
      timeout: 30000,
      httpsAgent: new https.Agent({
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      }),
    });

    const request = await axiosInstance.get(
      "https://frame.irisaco.com/api/sql2cs/do/oa_costcenter/rest/v1.0",
      {
        headers: {
          Authorization: irisaToken,
        },
      }
    );
    return request.data;
  } catch (error) {
    console.log(error);
    throw new AppError("خطا در دریافت اطلاعات  مدیران", 406);
  }
}

//12020
//897352
const getCostCenterInfo = async (costCenterId, token) => {
  try {
    const { data: costCenters } = await axios.get(
      "https://frame.irisaco.com/api/sql2cs/do/oa_costcenter/rest/v1.0",
      { headers: { Authorization: token || (await getZappBearerToken()) } }
    );
    return costCenters
      .find((item) => {
        return item.COD_CC == costCenterId;
      });
  } catch (e) {
    console.log(e);
    return null;
  }
}


const getIrisaPersonelList = async () => {

  irisaToken = await getZappBearerToken();
  try {
    const axiosInstance = axios.create({
      timeout: 30000,
      httpsAgent: new https.Agent({
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      }),
    });

    const request = await axiosInstance.get(
      "https://frame.irisaco.com/api/sql2cs/do/oa_emploee/rest/v1.0",
      {
        headers: {
          Authorization: irisaToken,
        },
      }
    );
    return request.data;
  } catch {
    return 'error'
  }
};

const getZappBearerToken = async () => {
  return `Bearer ${(await getZappToken()).data.token}`;
};

const sendMyIrisaManagerNotification = async (rqst, manager, needsManagerApproval) => {
//console.log(4545,rqst);

  const managerID = manager?._id //63663c32d352a362b3a6ac62
  const manager_personel_code = manager?.personel_code//'897352'

  const rqstID = rqst?._id
  const sender = (UserAccount.find({ _id: rqst?.submitted_by?._id }))?.full_name
  const hamrahan = rqst?.details?.userlist?.map?.((m) => { return (UserAccount.find({ _id: m._id }))?.full_name })?.join(" , ") || "";
  const mabda = rqst?.locations[0]?.meta?.address
  const maghsad = rqst?.locations?.map((m, index) => {
    if (index > 0) return m?.meta?.address;
  })?.join(" , ") || "";
  const desc = rqst?.details?.desc
  const date = rqst?.gmt_for_date
  const time = rqst?.gmt_for_date



  const domain = config.get("URL_LOCAL");

  const urlTrue = `${domain}/api/v2/services/requests/confirm/${rqstID}?AuthID=${managerID}`
  const urlFalse = `${domain}/api/v2/services/requests/reject/${rqstID}?AuthID=${managerID}`
  // const managerAccount = await Account.findOne({
  //   user_id: rqst?.manager?.account_id,
  // }).select("username");



  //const guests = rqst?.passenger?.guests?.map?.((g) => g)?.join(" , ") || "";
  const mainMessage = ` پیام سیستم مدیریت ناوگان : درخواست سفر ${sender} از مبدا ${mabda} به مقصد ${maghsad}  در تاریخ ${date} ساعت ${time} ${rqst?.details?.proj_code ? "با کد پروژه" + rqst?.details?.proj_code : ""} ثبت گردید.\n توضیحات : ${desc}\n همراهان : ${hamrahan}`;

  const urls = `\n\n تایید درخواست ${urlTrue}  \n\n رد درخواست ${urlFalse}`
  const message = ` ${mainMessage}` + (needsManagerApproval ? urls : "");

  console.log(8787878, urlTrue, urlFalse);
  //let smplemsg = `تست ارسال درخواست برای آقای علی اکبر سلمانی از طرف قنبری \n\n \n\n تایید درخواست http://172.25.25.173:4000/request/669b8af095eb1e226cb3920d/check?result=true  \n\n رد درخواست http://172.25.25.173:4000/request/669b8af095eb1e226cb3920d/check?result=false `

  try {
    const requestNotif = new RequestNotif({
      message: mainMessage,
      urlTrue,
      urlFalse,
      need_approval: needsManagerApproval,
      emp_num: manager_personel_code,
      request_id: rqstID,
    });
    await requestNotif.save();

    const result = await axios.post(
      config.get("MY_IRISA_URL"),
      {
        users: [manager_personel_code],
        // users: ["2420517679"],
        message: message,
      },
      {
        headers: {
          Authorization: "Bearer " + config.get("MY_IRISA_TOKEN"),
        },
      }
    );
    console.log("my irisa notif sent", result.data);
  } catch (error) {
    console.log(error.message);
    console.log("my irisa sending error");
  }
}

module.exports = {
  getZappToken,
  getZappBearerToken,
  getProjCodeInfo,
  getCostCenterInfo,
  getIrisaPersonelList,
  getEmployeeCostCenter,
  getListOfCostCenters,
  sendMyIrisaManagerNotification
};

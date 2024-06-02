const axios = require("axios");
const Area = require("../modules/area/model");
const config = require("config");
const { AppError } = require("../constructor/AppError");
const { User } = require("../modules/user/model");
const { Account } = require("../modules/auth/model");
const roles = require("../global_values/roles");
const { defaultPermitions } = require("../global_values/default_permissions");
const { isTimingValid } = require("./timeHelper");
const { timeToString } = require("./dateHelper");
const { isoToJalali } = require("./dateHelper");
const { urlShortnert } = require("./notificationHelper");
const axiosInstance = axios.create({ timeout: 1500 })
const getIrisaToken = async () => {
  try {
    request = await axiosInstance({
      method: "post",
      url: config.get("IRISA_BASE_URL") + "/auth/token/rest/v1.0",
      data: {
        username: config.get("IRISA_USERNAME"),
        password: config.get("IRISA_PASSWORD"),
      },
    });
    return request.data.token;
  } catch (error) {
    throw new AppError("خطا در اتصال به سرور اصلی ", 400);
  }
};

const getIrisaEmp = async (emp_num) => {
  try {
    const irisaToken = await getIrisaToken();
    const request = await axiosInstance.post(
      config.get("IRISA_BASE_URL") + "/sql2cs/do/erp_employee/rest/v1.0",
      { employeeNumber: emp_num },
      {
        headers: {
          Authorization: "Bearer " + irisaToken,
        },
      }
    );
    const result = JSON.parse(request.data.data)[0];
    return result;
  } catch (error) {
    console.log(error);
    throw new AppError("خطای وب سرویس ایریسا", 406);
  }
};

const getRqstDsptchr = async (slnglat, flnglat) => {
  try {

    const area = await Area.findOne({
      is_active: true,
      location: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [slnglat[1], slnglat[0]],
          },
        },
      },
    });
    if (!area || area.dispatcher.length === 0) return null;
    const finishArea = await Area.findOne({
      is_active: true,
      location: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [flnglat[1], flnglat[0]],
          },
        },
      },
    });



    return {
      _id: area?._id,
      dispatcher: area.dispatcher,
      noNeedManagerApprove:
        area.need_manager_approve &&
        finishArea?._id?.toString() === area?._id?.toString(),
    };
  } catch (error) {
    throw new AppError("خطا در دریافت اطلاعات توزیع کننده", 400);
  }
};

const getManagerProps = async (emp_num) => {
  let manager = await User.findOne({
    emp_num,
  }).select("full_name phone_num emp_num _id");

  if (manager) return manager;

  const managerEmpProps = await getIrisaEmp(emp_num);

  try {
    const managerUser = await User.create({
      role: roles.manager,
      nat_num: managerEmpProps.COD_NAT_EMPL,
      full_name: managerEmpProps.NAM_EMPL + " " + managerEmpProps.NAM_SNAM_EMPL,
      emp_num: managerEmpProps.NUM_PRSN_EMPL,
      permissions: defaultPermitions["manager"],
    });
    await Account.create({
      username: managerEmpProps.USER_NAME,
      password: managerEmpProps.COD_NAT_EMPL,
      role: roles.manager,
      user_id: managerUser._id,
    });
    return managerUser;
  } catch (error) {
    console.log(error);
  }
};

const getRqstMngr = async (proj_code, emp_num) => {
  try {

    if (proj_code) {
      const result = await getProjInfo(proj_code);
      if (result == "inValidProject") return result;
      if (result == "expired") return result;
      if (result) return await getManagerAccount(result);
    } else {
      return await getOrgMan(emp_num);
    }
  } catch (error) {
    console.log(error);
  }
};

const getProjInfo = async (proj_code) => {
  try {
    const projectCodeData = await axiosInstance({
      url:
        config.get("IRISA_BASE_URL") + "/sql2cs/do/erp_project_info/rest/v1.0",
      method: "post",
      headers: {
        Authorization: "Bearer " + (await getIrisaToken()),
      },
      data: { projectNumber: proj_code },
    });
    const result = JSON.parse(projectCodeData.data.data)[0];
    const isProjValid = isTimingValid(result.FINISH_DATE_G);
    if (!isProjValid) return "expired";
    return result;
  } catch (error) {
    if (error?.response?.data) return "inValidProject";
    throw new AppError("خطا در دریافت اطلاعات مدیرپروژه", 500);
  }
};

const getManagerAccount = async (result) => {
  const employee = await getIrisaEmp(result.EMPLOYEE_NUMBER);
  const managerAccount = await getManagerProps(result.EMPLOYEE_NUMBER);

  return {
    manager: {
      full_name: managerAccount.full_name,
      phone_num: managerAccount.phone_num,
      emp_num: managerAccount.emp_num,
      account_id: managerAccount._id,
      username: employee.USER_NAME
    },
    cost_center: {
      proj_desc: result.PROJECT_DESC,
      manager_emp_num: result.EMPLOYEE_NUMBER,
    },
  };
};

const getOrgMan = async (emp_num) => {
  try {

    let token = await getIrisaToken();

    const managerData = await axiosInstance({
      url:
        config.get("IRISA_BASE_URL") +
        "/sql2cs/do/erp_organization_manager/rest/v1.0",
      method: "post",
      headers: {
        Authorization: "Bearer " + token,
      },
      data: { employeeNumber: emp_num },
    });
    const result = JSON.parse(managerData.data.data)[0];


    if (!result) return null;
    const managerAccount = await getManagerProps(result.MNG_NUM_PRSN_EMPL);

    return {
      manager: {
        full_name: managerAccount.full_name,
        phone_num: managerAccount.phone_num,
        emp_num: managerAccount.emp_num,
        account_id: managerAccount._id,
      },
      cost_center: {
        manager_emp_num: result.MNG_NUM_PRSN_EMPL,
        cost_center: result.COD_CC_EMPL,
      },
    };
  } catch (error) {
    throw new AppError("خطا در دریافت مرکز هزینه", 400);
  }
};

const sendMyIrisaManagerNotification = async (rqst) => {
  const urlTrue = `https://napi.zappfleet.ir/request/${rqst?._id}/check?result=true`
  const urlFalse = `https://napi.zappfleet.ir/request/${rqst?._id}/check?result=false`
  // const managerAccount = await Account.findOne({
  //   user_id: rqst?.manager?.account_id,
  // }).select("username");
  const message = ` پیام سیستم مدیریت ناوگان : درخواست سفر ${rqst?.passenger?.full_name} از مبدا ${rqst?.locations?.start?.adr
    } به مقصد ${rqst?.locations?.finish?.adr}  در تاریخ ${isoToJalali(
      rqst?.for_date
    )} ساعت ${timeToString(rqst?.for_time)} ${rqst.proj_code ? "با کد پروژه" + rqst?.proj_code : ""}.
    \n\n توضیحات : ${rqst.desc}
    \n\n تایید درخواست ${urlTrue}  \n\n رد درخواست ${urlFalse}`;

  console.log({ urlFalse, urlTrue });

  try {
    const result = await axios.post(
      config.get("MY_IRISA_URL"),
      {
        users: [rqst?.manager?.emp_num],
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
    console.log(error);
    console.log("my irisa sending error");
  }
};

const sendPassengerNotification = async (ids, message) => {
  //IRISA notification
  let accounts = await Account.find({ user_id: { $in: ids } }).select(
    "username user_id"
  );

  const passengerAccountIds = [];
  for (let i = 0; i < accounts.length; i++) {
    const accnt = accounts[i];
    // if (accnt.username != null){
    //   passengerAccountIds.push(accnt.username);
    // }else{
    const user = await User.findById(accnt.user_id);
    const nat_num = user.nat_num;
    passengerAccountIds.push(nat_num);
    // }
  }


  try {
    await axios.post(
      config.get("MY_IRISA_URL"),
      {
        users: passengerAccountIds,
        message: message,
      },
      {
        headers: {
          Authorization: "Bearer " + config.get("MY_IRISA_TOKEN"),
        },
      }
    );
    console.log("my irisa notif sent : " + passengerAccountIds?.join(","));
  } catch (error) {
    console.log(error);
    console.log("my irisa sending error");
  }
};

// {{server.address}}/api/sql2cs/do/erp_organization_manager/rest/v1.0
// {{server.address}}/api/sql2cs/do/erp_project_info/rest/v1.0

exports.getRqstMngr = getRqstMngr;
exports.getProjInfo = getProjInfo;
exports.getRqstDsptchr = getRqstDsptchr;
exports.getIrisaToken = getIrisaToken;
exports.getIrisaEmp = getIrisaEmp;
exports.sendMyIrisaNotification = sendMyIrisaManagerNotification;
exports.sendPassengerNotification = sendPassengerNotification;

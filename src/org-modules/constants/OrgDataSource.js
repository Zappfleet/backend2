const OrgSecretFields = ["accessToken", "userDetailsUrl", "userSearchUrl"];
const config = require("config")

// Define URLs for different environments
let userDetailsUrl, userSearchUrl;
const environmentName = config.get("environment_name");

if (environmentName === "local") {
  userDetailsUrl = "http://localhost:4000/api/v2/irisa/employee-detils";
  userSearchUrl = "http://localhost:4000/api/v2/irisa/employee-search";
} else if (environmentName === "server") {
  userDetailsUrl = "https://zapp-backend.liara.run/api/v2/irisa/employee-detils";
  userSearchUrl = "https://zapp-backend.liara.run/api/v2/irisa/employee-search";
}

const OrgDataSource = {
  accessToken: "veryspecialaccesstoken",

  //sgh
  userDetailsUrl: userDetailsUrl,
  userSearchUrl: userSearchUrl,

  displayNameField: "details.full_name",

  requestProcessorModule: "irisaRequestProcessor",

  externalUserbaseModule: "irisaExternalUserbase",

  requestsDetailsDisplayColumns: [
    {
      key: "proj_code",
      title: "پروژه",
    },
    {
      key: "cost_center",
      title: "مرکز هزینه",
    },
  ],

  userListDetailsDisplayColumns: [
    {
      key: "COD_NAT_EMPL",
      title: "کد ملی",
    },
    {
      key: "NUM_PRSN_EMPL",
      title: "کد پرسنلی",
    },
  ],

  regionAdditionalProperties: [
    {
      key: "need_manager_confirmation",
      required: true,
      title: "نیاز به تایید مدیر",
      type: "list",
      options: [
        {
          key: "yes",
          title: "دارد",
        },
        {
          key: "no",
          title: "ندارد",
        },
      ],
    },
  ],

  signupMethods: [
    {
      key: "simple",
      title: "کاربر عادی",
      ignore_password: false,
      userFields: {
        full_name: {
          required: true,
          title: "نام و نام خانوادگی",
        },
        username: {
          required: true,
          title: "نام کاربری",
        },
        nat_num: {
          required: true,
          title: "کد ملی",
        },
      },
    },
    {
      key: "irisa",
      title: "پرسنل ایریسا",
      ignore_password: true,
      userFields: {
        nat_num: {
          editable: false,
          required: true,
          title: "کد ملی",
        },
        personel_code: {
          editable: false,
          required: true,
          title: "کد پرسنلی",
        },
      },
    },
  ],

  additionalTripFields: [
    {
      key: "datetime",
      type: "datetime",
      multiple: false,
      hideTime: true,
      format: "DD/MM/YYYY",
      title: "تاریخ فاکتور",
    },
    {
      key: "bill_number",
      type: "number",
      title: "شماره فاکتور",
    },
    {
      key: "bill_cost",
      type: "number",
      title: "هزینه",
    },
    {
      key: "trip_distance",
      type: "number",
      title: "مسافت سفر",
    },
  ],

  additionalRequestFields: [
    {
      key: "datetime",
      type: "datetime",
      multiple: true,
      required: true,
      mode: "user-only",
      title: "زمان درخواست",
    },
    {
      key: "datetime",
      type: "datetime",
      multiple: false,
      required: true,
      mode: "admin-only",
      title: "زمان درخواست",
    },
    {
      key: "userlist",
      type: "userlist",
      required: true,
      mode: "user-only",
      title: "همراهان",
    },
    {
      key: "proj_code",
      type: "number",
      required: true,
      title: "کد پروژه",
    },
    {
      key: "cost_center",
      type: "number",
      required: true,
      title: "کد مرکز هزینه",
    },
    {
      key: "desc",
      type: "text",
      required: true,
      title: "توضیحات",
    },
  ],
};

const OrgDataSourceFilterd = { ...OrgDataSource };
OrgSecretFields.map((field) => {
  delete OrgDataSourceFilterd[field];
});

module.exports = {
  OrgDataSource,
  OrgSecretFields,
  OrgDataSourceFilterd,
};

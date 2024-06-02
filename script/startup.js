const mongoose = require("mongoose");
const config = require("config");
const { UserAccount } = require("../src/users/data/models/user-model");
const { userStatus } = require("../src/users/data/constants/userStatus");
const { encrypt } = require("../src/utils");
const { UserRole } = require("../src/users/data/models/role-model");
const {
  PermissionSet,
  PermissionSetFlatValues,
} = require("../src/users/data/constants/permissions");

async function run() {

  //sgh database
  //const db = config.get("db");

  // await mongoose.connect(db, {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  // });

  // const db = config.get(process.env.DATABASE_URL);

  // await mongoose.connect(process.env.DATABASE_URL, {
  //   authSource: "admin"
  // });

  //////////////////////

  const driverRole = await UserRole.create({
    title: "راننده",
    active: true,
    is_static: true,
    permissions: [PermissionSet.DRIVER],
    auto_assign_rules: [],
  });

  const adminRole = await UserRole.create({
    title: "مدیر سیستم",
    active: true,
    is_static: true,
    rank: "admin",
    permissions: [...PermissionSetFlatValues],
    auto_assign_rules: [],
  });

  const passengerRole = await UserRole.create({
    title: "مسافر",
    active: true,
    permissions: [
      PermissionSet.USERS.PROFILE,
      PermissionSet.VEHICLES.LIST,
      ...valuesToArray(PermissionSet.SERVICE.PERSONAL),
      ...valuesToArray(PermissionSet.LOCATION.PERSONAL),
    ],
    auto_assign_rules: [{ key: "undefined", value: "undefined" }],
  });

  const user = await UserAccount.create({
    username: "admin",
    password: encrypt("adminadmin"),
    details: {},
    phone: "09362370299",
    roles: [adminRole._id],
    status: userStatus.ACTIVE.key,
  });

  console.log(passengerRole);
  console.log(driverRole);
  console.log(adminRole);
  console.log(user);

  console.log("Success");

  mongoose.disconnect();
}

function valuesToArray(obj) {
  return Object.entries(obj).map(([_, value]) => value);
}
run();

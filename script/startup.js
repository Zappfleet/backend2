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
  let db = "";
  const environment_name = config.get("environment_name");
  
  // تنظیمات اتصال به دیتابیس
  if (environment_name === "local") {
    db = config.get("db");
    mongoose.set('strictQuery', false);
    await mongoose.connect(db)//, { useNewUrlParser: true, useUnifiedTopology: true });
  } else if (environment_name === "server") {
    db = config.get("db_SERVER");
    mongoose.set('strictQuery', false);
    await mongoose.connect(db)//, { useNewUrlParser: true, useUnifiedTopology: true });
  } else {
    console.error("Unknown environment name");
    return;
  }
  
  console.log("Connected to database");

  try {
    // بررسی و ایجاد نقش‌های کاربری
    const driverRole = await UserRole.findOne({ title: "راننده" });
    if (!driverRole) {
      console.log("Creating 'راننده' role...");
      await UserRole.create({
        title: "راننده",
        active: true,
        is_static: true,
        permissions: [PermissionSet.DRIVER],
        auto_assign_rules: [],
      });
    }

    const adminRole = await UserRole.findOne({ title: "مدیر سیستم" });
    if (!adminRole) {
      console.log("Creating 'مدیر سیستم' role...");
      await UserRole.create({
        title: "مدیر سیستم",
        active: true,
        is_static: true,
        rank: "admin",
        permissions: [...PermissionSetFlatValues],
        auto_assign_rules: [],
      });
    }

    
    const passengerRole = await UserRole.findOne({ title: "مسافر" });
    if (!passengerRole) {
      console.log("Creating 'مسافر' role...");
      await UserRole.create({
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
    }

    // بررسی و ایجاد کاربر
    const user = await UserAccount.findOne({ username: "admin" });
    if (!user) {
      console.log("Creating 'admin' user...");
      await UserAccount.create({
        username: "admin",
        password: encrypt("adminadmin"),
        details: {},
        phone: "09151250498",
        roles: [adminRole._id],
        status: userStatus.ACTIVE.key,
      });
    }

    console.log("Setup completed successfully");

  } catch (error) {
    console.error("Error during setup:", error);
  } finally {
    mongoose.disconnect();
  }
}

function valuesToArray(obj) {
  return Object.entries(obj).map(([_, value]) => value);
}

run();

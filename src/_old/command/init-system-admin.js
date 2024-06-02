const mongoose = require("mongoose");
const { defaultPermitions } = require("../global_values/default_permissions");
const roles = require("../global_values/roles");
const { Account } = require("../modules/auth/model");
const { User } = require("../modules/user/model");
const config = require("config");

async function run() {

    let db = ""
    let environment_name = config.get("environment_name")
    if (environment_name === "local") {
      db = config.get("db");
    }
    if (environment_name === "server") {
      db = config.get("db_SERVER");
    }

    mongoose.set('strictQuery', false);
    await mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true,serverSelectionTimeoutMS: 30000 ,authSource:"admin" });

    const user = await User.create({
        full_name: "مدیر سیستم",
        nat_num: "0",
        phone_num: "0",
        emp_num: "0",
        role: roles.admin,
        permissions: defaultPermitions["admin"],
    });
    await Account.create({
        username: "system",
        password: "system",
        user_id: user._id,
        role: roles.admin,
    });
    console.log("Success");
}
run();
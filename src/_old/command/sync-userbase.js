const mongoose = require("mongoose");
const axios = require("axios");
const { User } = require("../modules/user/model");
const config = require("config");
const { getIrisaToken, getIrisaEmp } = require("../utils/irisaHelper");
const { TempAcc } = require("../modules/auth/model");


const USER_LIST_URL = "/sql2cs/do/erp_employees_basic_searchable/rest/v1.0?pageSize=4000";
const GET_USER_DETAIL = "/sql2cs/do/erp_employee/rest/v1.0";

let irisaToken;


async function run() {

    console.log("----- Zapp Initialization ----- ");

    let db = ""
    let environment_name = config.get("environment_name")
    if (environment_name === "local") {
        db = config.get("db");
    }
    if (environment_name === "server") {
        db = config.get("db_SERVER");
    }

    console.log("Connecting to database");

    mongoose.set('strictQuery', false);
    await mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, authSource: "admin", serverSelectionTimeoutMS: 30000 });
    console.log("Connection stablished successfully");


    irisaToken = await getIrisaToken()
    const resAllUsers = await axios.post(
        config.get("IRISA_BASE_URL") + USER_LIST_URL,
        {
            "name": "",
            "family": "",
            "employeeNumber": ""
        },
        {
            headers: {
                Authorization: "Bearer " + irisaToken,
            },
        }
    );

    await fillDatabaseWith(JSON.parse(resAllUsers.data.data));

    console.log("DONE!");
    process.exit(1);
}


async function fillDatabaseWith(user) {
    let registerSuccess = 0;
    let employeeExists = 0;

    console.log(`filling ${user.length} users`);
    for (let i = 0; i < user.length; i++) {
        const u = user[i];
        const existingUser = await User.findOne({ emp_num: u.NUM_PRSN_EMPL })
        if (existingUser != null) {
            console.log("Employee number already exists : " + u.NUM_PRSN_EMPL);
            continue;
        }

        try {

            const request = await axios.post(
                config.get("IRISA_BASE_URL") + GET_USER_DETAIL,
                { employeeNumber: u.NUM_PRSN_EMPL },
                {
                    headers: {
                        Authorization: "Bearer " + irisaToken,
                    },
                }
            );
            const userDetail = JSON.parse(request.data.data)[0];

            if (userDetail.USER_NAME == null || userDetail.NUM_PRSN_EMPL == null || userDetail.COD_NAT_EMPL == null) {
                employeeExists++;
                continue;
            }
            async function createEntity() {
                try {

                    const tempAccount = await TempAcc.create({
                        emp_num: userDetail.NUM_PRSN_EMPL,
                        nat_num: userDetail.COD_NAT_EMPL,
                        phone_num: "09000000000",
                        full_name: userDetail.NAM_EMPL + " " + userDetail.NAM_SNAM_EMPL,
                        username: userDetail.USER_NAME,
                        post: userDetail.DES_MANAG,
                    });
                    await tempAccount.createAccounts();
                    await tempAccount.delete();
                } catch (e) {
                    console.log(e.message);
                }
            }
            createEntity();
            registerSuccess++;
        } catch (e) {
            console.log("IRISA API ERROR : " + e.message);
            i--;
            console.log("Token expired. Refreshing token");
            irisaToken = await getIrisaToken()
            continue;
        }
    }

    console.log(`register success count : ${registerSuccess}`);
    console.log(`already existing count : ${employeeExists}`);
}

run();


// {
//     NUM_PRSN_EMPL: '11477',
//     NAM_EMPL: 'مرتضي',
//     NAM_SNAM_EMPL: 'نجفي حسن آبادي',
//     COD_NAT_EMPL: null,
//     USER_NAME: null,
//     DES_MANAG: null
//   }
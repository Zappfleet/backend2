const { default: mongoose } = require("mongoose");
const { getRandomInt } = require("../../utils");
const roles = require("../../_old/global_values/roles");

let insertedUsers;

const SAMPLE_USER_DATA = function () {
    const totalCount = 1000;
    return randomeUserFields(totalCount);
}();


const insertSampleUserData = async function () {
    if (insertedUsers == null) {
        const Users = mongoose.connection.db.collection("users");
        await Users.deleteMany({});
        const userDataSet = Object.entries(SAMPLE_USER_DATA).map((item) => item[1]);
        insertedUsers = await Promise.all(userDataSet.map(async (userData) => {
            return await Users.insertOne(userData);
        }))
    }
    return insertedUsers;
}

function randomeUserFields(count) {
    const userFields = {};

    while (Object.keys(userFields).length < count) {
        const nat_num = randomNationalNumber();
        const phone_num = randomPhoneNumber();
        const full_name = "test-user";
        const is_active = getRandomInt(0, 10) < 5;
        const role = getRandomInt(0, 10) > 5 ? [roles.passenger] : [roles.driver];
        userFields[`${nat_num}-${phone_num}`] = {
            nat_num,
            phone_num,
            full_name,
            is_active,
            role,
        }
    }

    return userFields;
}


function randomPhoneNumber() {
    return `0${getRandomInt(911, 990)}${getRandomInt(100, 999)}${getRandomInt(1000, 9999)}`
}

function randomNationalNumber() {
    return `${getRandomInt(100, 900)}${getRandomInt(1000000, 9999999)}`
}

module.exports.insertSampleUserData = insertSampleUserData;

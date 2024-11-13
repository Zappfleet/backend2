const mongoose = require('mongoose');
const { UserAccount: newUserAccount } = require('../../users/data/models/user-model');
const { UserRole: newuserRole } = require('../../users/data/models/role-model');
const { Account: old_accounts } = require('../../_old/modules/auth/model');
const { User: old_users } = require('../../_old/modules/user/model');
const { ObjectId } = mongoose.Types;
const config = require("config");
const { userStatus } = require('../../users/data/constants/userStatus');

// port  27048
//mongodump --uri="mongodb://localhost:27048/zappfleet" --out="C:\MongoDB_Backups"
// Function to connect to MongoDB
const connectToDB = async () => {
    const environment_name = config.get("environment_name");
    let db = "";

    if (environment_name === "local") {
        db = config.get("db");
    } else if (environment_name === "server") {
        db = config.get("db_SERVER");
    } else {
        throw new Error('Unknown environment name');
    }

    mongoose.set('strictQuery', false);
    await mongoose.connect(db)//, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`Connected to database`);
};



// تابع برای اضافه کردن رول‌ها
async function addRolesIfNotExist() {
    // لیست رول‌هایی که باید اضافه شوند
    const newRoles = [
        { _id: new mongoose.Types.ObjectId('663902a12733b1e14bcde2f4'), title: 'مسافر', active: true, is_static: false, rank: 'regular' },//passenger
        { _id: new mongoose.Types.ObjectId('663902a02733b1e14bcde2ee'), title: 'راننده', active: true, is_static: false, rank: 'regular' },//driver
        { _id: new mongoose.Types.ObjectId('663f11c3185aeaa232719f76'), title: 'مدیر پروژه', active: true, is_static: false, rank: 'regular' },//manager
        { _id: new mongoose.Types.ObjectId('663f7ec2665933a1316d2697'), title: 'دیسپاچر', active: true, is_static: false, rank: 'regular' },//dispatcher
        { _id: new mongoose.Types.ObjectId('664a047476905c9e69a259d0'), title: 'سوپر دیسپاچر', active: true, is_static: false, rank: 'regular' },//superDispatcher
        { _id: new mongoose.Types.ObjectId('663902a12733b1e14bcde2f2'), title: 'مدیر سیستم', active: true, is_static: false, rank: 'admin' },//admin
        { _id: new mongoose.Types.ObjectId('66605998eafc2a3a887c0dc4'), title: 'اپراتور', active: true, is_static: false, rank: 'regular' }//operator
    ];
    try {


        for (const role of newRoles) {
            await newuserRole.findOneAndUpdate(
                { _id: role._id}, // شرط جستجو (مثلاً براساس _id)
                { $set: role }, // به‌روزرسانی داده‌ها با newAccount
                { upsert: true, new: true, setDefaultsOnInsert: true } // گزینه‌ها: ایجاد کاربر جدید اگر نبود
            );

        }
    } catch (error) {
        console.error(5478787, 'Error adding roles:', error);
    }
}


exports.migrateDataAccounts = async function (req, res) {
    try {
        await connectToDB()
        console.log('Successfully connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        return;
    }
    try {
        const oldAccountsData = await old_accounts.find({})
        const oldUsersData = await old_users.find({})

        addRolesIfNotExist()


        for (const oldAccountData of oldAccountsData) {
            try {
                const olduser = oldUsersData.find(user => user._id.toString() === oldAccountData.user_id.toString());

                // const roles = {
                //     passenger: 0,
                //     driver: 1,
                //     manager: 2,
                //     dispatcher: 3,
                //     superDispatcher: 4,
                //     admin: 5,
                //     operator: 6,
                // };
                let createNewRole = []
                oldAccountData?.role?.map(role => {
                    switch (role) {
                        case 0: //passenger
                            createNewRole.push(new ObjectId('663902a12733b1e14bcde2f4'))
                            break;

                        case 1: //driver
                            const DB_ROLE_DRIVER_ID = '663902a02733b1e14bcde2ee'
                            createNewRole.push(new ObjectId(DB_ROLE_DRIVER_ID))
                            break;

                        case 2: //manager
                            createNewRole.push(new ObjectId('663f11c3185aeaa232719f76'))
                            break;

                        case 3://dispatcher
                            createNewRole.push(new ObjectId('663f7ec2665933a1316d2697'))
                            break;

                        case 4: //superDispatcher
                            createNewRole.push(new ObjectId('664a047476905c9e69a259d0'))
                            break;

                        case 5://admin
                            createNewRole.push(new ObjectId('663902a12733b1e14bcde2f2'))
                            break;

                        case 6://operator
                            createNewRole.push(new ObjectId('66605998eafc2a3a887c0dc4'))
                            break;
                    }

                })

                let newAccount = new newUserAccount({
                    _id: olduser._id,
                    username: oldAccountData.username,
                    password: oldAccountData.password,
                    phone: olduser && olduser?.phone_num ? olduser.phone_num : '120', // Ensure phone is included
                    full_name: olduser.full_name,
                    reg_key: 'irisa',
                    roles: createNewRole,
                    status: olduser.is_active === true ? userStatus.ACTIVE.key : userStatus.INACTIVE.key,
                    details: {
                        nat_num: olduser.nat_num,
                        personel_code: olduser.emp_num,
                        key: 'irisa'
                    },
                    createdAt: oldAccountData.createdAt,
                    updatedAt: oldAccountData.updatedAt,
                    // last_login_date:olduser.last_login_date
                });

                await newUserAccount.findOneAndUpdate(
                    { _id: newAccount._id }, // شرط جستجو (مثلاً براساس _id)
                    { $set: newAccount }, // به‌روزرسانی داده‌ها با newAccount
                    { upsert: true, new: true, setDefaultsOnInsert: true } // گزینه‌ها: ایجاد کاربر جدید اگر نبود
                );
            } catch (error) {
                console.error(45468, `Error migrating request ID ${oldAccountData._id}:`, error.message);
                res.status(500).json({
                    status: "5000",
                    message: "Migration failed2",
                    error: error.message,
                });
            }
        }
        res.status(200).json({
            status: "200",
            data: "oldUsersData",
        });
    } catch (error) {
        console.error('Migration error:', error);
        res.status(500).json({
            status: "5000",
            message: "Migration failed1",
            error: error.message,
        });
    } finally {
        // Close the MongoDB connection
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
        } catch (closeError) {
            console.error('Error closing MongoDB connection:', closeError.message);
        }
    }
}



module.exports = {
    addRolesIfNotExist
  };
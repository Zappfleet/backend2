const mongoose = require('mongoose');
const { ServiceRequest: new_Request } = require('../../services/data/service-request-model');
const { ServiceMission: new_Mission } = require('../../services/data/mission-model');
const { Request: old_Requests } = require('../../_old/modules/request/model');
const { Trip: old_trips } = require('../../_old/modules/trip/model');
const { UserAccount: newUserAccount } = require('../../users/data/models/user-model');
const { UserRole: newuserRole } = require('../../users/data/models/role-model');
const { Account: old_accounts } = require('../../_old/modules/auth/model');
const { User: old_users } = require('../../_old/modules/user/model');
const newRegions = require('../../regions/data/region-model');
const old_areas = require('../../_old/modules/area/model');
const { Vehicle: newvehicles } = require('../../vehicles/data/vehicle-model');
const { VehicleServiceModel: vehicleServices } = require('../../vehicles/data/vehicle-secondary-models');
const { Car: old_cars } = require('../../_old/modules/car/model');
const { FavoriteLocation: newFavoriteLocation } = require('../../favoriteLocation/model/favorit-location-model');
const old_locations = require('../../_old/modules/location/model');

const config = require("config");
const { userStatus } = require('../../users/data/constants/userStatus');

const { ObjectId } = mongoose.Types;
const { serviceRequestStatus, serviceMissionStatus } = require("../../services/constatns");


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
                { _id: role._id }, // شرط جستجو (مثلاً براساس _id)
                { $set: role }, // به‌روزرسانی داده‌ها با newAccount
                { upsert: true, new: true, setDefaultsOnInsert: true } // گزینه‌ها: ایجاد کاربر جدید اگر نبود
            );

        }
    } catch (error) {
        console.error(5478787, 'Error adding roles:', error);
    }
}



class migrateDataController {

    async migrateDataRequest(req, res) {
        let x = {};
        try {
            // اتصال به دیتابیس
            await connectToDB();
            console.log('Successfully connected to MongoDB');
        } catch (err) {
            console.error('MongoDB connection error:', err);
            return res.status(500).json({
                status: "5000",
                message: "Database connection failed",
                error: err.message,
            });
        }

        try {
            if (mongoose.connection.readyState !== 1) {
                throw new Error('MongoDB connection is not established');
            }

            // دریافت اطلاعات از دیتابیس قدیمی
            const oldRequests = await old_Requests.find({}); // دریافت درخواست‌ها
            const oldTrips = await old_trips.find({}); // دریافت سفرها


            // پردازش درخواست‌ها
            for (const oldRequest of oldRequests) {

                try {
                    const oldTrip = oldTrips.find(trip => trip?.request_ids[0]?.toString() === oldRequest?._id?.toString());

                    let createCurrentLocationIndex = -1;
                    let createStatusRequest = '';
                    let createStatusRequestInMission = null;
                    let createStatusMission = null;

                    // تنظیم وضعیت‌های درخواست و ماموریت بر اساس وضعیت درخواست قدیمی
                    switch (oldRequest.status) {
                        case 9:
                            createStatusRequestInMission = serviceMissionStatus.DONE.key;
                            createStatusMission = serviceMissionStatus.DONE.key;
                            createStatusRequest = serviceRequestStatus.ASSIGNED_TO_MISSION.key;
                            break;
                        case 8:
                            createStatusRequestInMission = serviceMissionStatus.ON_ROUTE.key;
                            createStatusMission = serviceMissionStatus.DRAFT.key;
                            createStatusRequest = serviceRequestStatus.ASSIGNED_TO_MISSION.key;
                            break;
                        case 7:
                            createStatusRequestInMission = serviceRequestStatus.PENDING.key;
                            createStatusMission = serviceMissionStatus.DRAFT.key;
                            createStatusRequest = serviceRequestStatus.ASSIGNED_TO_MISSION.key;
                            break;
                        case 6:
                            createStatusMission = serviceMissionStatus.DRAFT.key;
                            createStatusRequest = serviceRequestStatus.REJECT.key;
                            break;
                        case 5:
                            createStatusMission = serviceMissionStatus.DRAFT.key;
                            createStatusRequest = serviceRequestStatus.PENDING.key;
                            break;
                        case 4:
                            createStatusMission = serviceMissionStatus.DRAFT.key;
                            createStatusRequest = serviceRequestStatus.CONFIRM.key;
                            break;
                        case 3:
                            createStatusMission = serviceMissionStatus.DRAFT.key;
                            createStatusRequest = serviceRequestStatus.REJECT.key;
                            break;
                        case 2:
                            createStatusMission = serviceMissionStatus.DRAFT.key;
                            createStatusRequest = serviceRequestStatus.PENDING.key;
                            break;
                        case 1:
                            createStatusMission = serviceMissionStatus.DRAFT.key;
                            createStatusRequest = serviceRequestStatus.CANCEL_USER.key;
                            break;
                        case 0:
                            createStatusRequest = serviceRequestStatus.PENDING.key;
                            break;
                    }

                    // تنظیم مکان‌های درخواست
                    const createLocations = [
                        {
                            coordinates: oldRequest.locations.start.lnglat,
                            wait: 0, // زمان انتظار پیش‌فرض
                            meta: {
                                adr: oldRequest.locations.start.adr,
                            },
                        },
                        {
                            coordinates: oldRequest.locations.finish.lnglat,
                            wait: 0, // زمان انتظار پیش‌فرض
                            meta: {
                                adr: oldRequest.locations.finish.adr,
                            },
                        },
                    ];

                    //     oldRequest.cost_manager.cost_center && console.log("sgh:", oldRequest);  // چاپ مقدار برای بررسی

                    // ایجاد درخواست جدید در دیتابیس جدید
                    let newRequest = new new_Request({
                        _id: oldRequest._id,
                        locations: createLocations,
                        service: oldRequest.service || "taksisroys",
                        gmt_for_date: oldRequest.for_date,
                        status: createStatusRequest,
                        submitted_by: oldRequest.creator,
                        confirmed_by: createStatusRequest !== "REJECT" ? oldRequest.dispatcher[0]?.account_id : null,
                        rejected_by: createStatusRequest === "REJECT" ? oldRequest.dispatcher[0]?.account_id : null,
                        details: {
                            userlist: oldRequest.passenger,
                            proj_code: oldRequest.cost_manager.proj_code,
                            cost_center: oldRequest.cost_manager.cost_center,
                            cost_center_desc: oldRequest.cost_manager.des_manag,
                            proj_desc: oldRequest.cost_manager.proj_desc,
                            cost: oldRequest.taxi_cost,
                            manager_emp_num: oldRequest.cost_manager.manager_emp_num,
                            desc: oldRequest.desc,
                            distance: oldRequest.distance_props?.distance,
                            interval: oldRequest.distance_props?.interval,
                        },
                        area: oldRequest?.area_id,
                        createdAt: oldRequest.createdAt,
                        updatedAt: oldRequest.updatedAt,
                        __v: oldRequest.__v,
                    });

                    // ایجاد ماموریت جدید در دیتابیس جدید
                    let newMission = createStatusMission && oldRequest.dispatcher[0]?.account_id && new new_Mission({
                        _id: oldRequest._id,
                        created_by: oldRequest.dispatcher[0]?.account_id,
                        status: createStatusMission,
                        service_requests: createStatusRequest === serviceRequestStatus.ASSIGNED_TO_MISSION.key ? [
                            {
                                request_id: oldRequest._id,
                                status: createStatusRequestInMission,
                                current_location_index: createCurrentLocationIndex,
                            }
                        ] : [],
                        createdAt: oldRequest.createdAt,
                        updatedAt: oldRequest.updatedAt,
                        __v: oldRequest.__v,
                        extra: createStatusRequest === serviceRequestStatus.ASSIGNED_TO_MISSION.key ? {
                            distance: oldRequest.distance_props?.distance,
                            mission_start: oldRequest.status_update_history?.status_4,
                            mission_end: oldRequest.status_update_history?.status_9,
                        } : {},
                        assigned_by: oldRequest.dispatcher[0]?.account_id,
                        driver_id: oldTrip?.driver?.user?.account_id,
                        vehicle_id: oldTrip?.car?.car_id,
                    });

                    // ذخیره درخواست و ماموریت در دیتابیس جدید
                    // await new_Request(newRequest).save();
                    await new_Request.findOneAndUpdate(
                        { _id: newRequest._id }, // شرط جستجو (مثلاً براساس _id)
                        { $set: newRequest }, // به‌روزرسانی داده‌ها با newAccount
                        { upsert: true, new: true, setDefaultsOnInsert: true } // گزینه‌ها: ایجاد کاربر جدید اگر نبود
                    );


                    if (newMission) {
                        // await new_Mission(newMission).save();
                        await new_Mission.findOneAndUpdate(
                            { _id: newMission._id }, // شرط جستجو (مثلاً براساس _id)
                            { $set: newMission }, // به‌روزرسانی داده‌ها با newAccount
                            { upsert: true, new: true, setDefaultsOnInsert: true } // گزینه‌ها: ایجاد کاربر جدید اگر نبود
                        );
                    }

                } catch (error) {
                    console.error(`Error migrating request ID ${oldRequest._id}:`, error.message);
                    res.status(500).json({
                        status: "5000",
                        message: `Migration for request ID ${oldRequest._id} failed`,
                        error: error.message,
                    });
                    continue; // ادامه پردازش درخواست‌های دیگر
                }
            }

            // پاسخ موفقیت‌آمیز در پایان
            res.status(200).json({
                status: "200",
                data: oldRequests?.length,
            });
        } catch (error) {
            console.error('Migration request error:', error);
            res.status(500).json({
                status: "5000",
                message: "Migration process failed",
                error: error.message,
            });
        } finally {
            // بستن اتصال به دیتابیس
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed');
            } catch (closeError) {
                console.error('Error closing MongoDB connection:', closeError.message);
            }
        }
    }

    async migrateDataAccounts(req, res) {
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

    async migrateDataAreas(req, res) {
        try {
            // اتصال به دیتابیس
            await connectToDB();
            console.log('Successfully connected to MongoDB');
        } catch (err) {
            console.error('MongoDB connection error:', err);
            return res.status(500).json({
                status: "5000",
                message: "Database connection failed",
                error: err.message,
            });
        }

        try {
            const oldAreas = await old_areas.find({}); // دریافت مناطق قدیمی

            for (const oldArea of oldAreas) {
                try {
                    // ایجاد منطقه جدید در دیتابیس جدید
                    let newRegion = new newRegions({
                        _id: oldArea._id,
                        name: oldArea.name,
                        dispatcher: oldArea.dispatcher[0].account_id,
                        alternativeDispatcher: oldArea.prev_dispatchers,
                        geometry: oldArea.location,
                        properties: {
                            need_manager_confirmation: oldArea.need_manager_approve === true ? 'yes' : 'no',
                        },
                        is_active: oldArea.is_active,
                        __v: oldArea.__v,
                    });

                    // ذخیره منطقه جدید در دیتابیس
                    //await newRegions(newRegion).save();
                    await newRegions.findOneAndUpdate(
                        { _id: newRegion._id }, // شرط جستجو (مثلاً براساس _id)
                        { $set: newRegion }, // به‌روزرسانی داده‌ها با newAccount
                        { upsert: true, new: true, setDefaultsOnInsert: true } // گزینه‌ها: ایجاد کاربر جدید اگر نبود
                    );
                } catch (error) {
                    console.error(`Error migrating area ID ${oldArea._id}:`, error.message);
                    // مدیریت خطا و ادامه حلقه برای مناطق دیگر
                    res.status(500).json({
                        status: "5000",
                        message: `Migration for area ID ${oldArea._id} failed`,
                        error: error.message,
                    });
                    continue; // ادامه پردازش مناطق دیگر
                }
            }

            // پاسخ موفقیت‌آمیز در پایان
            res.status(200).json({
                status: "200",
                data: oldAreas,
            });
        } catch (error) {
            console.error('Migration oldAreas error:', error);
            res.status(500).json({
                status: "5000",
                message: "Migration oldAreas failed",
                error: error.message,
            });
        } finally {
            // بستن اتصال به دیتابیس
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed');
            } catch (closeError) {
                console.error('Error closing MongoDB connection:', closeError.message);
            }
        }
    }


    async migrateDataCars(req, res) {
        try {
            // اتصال به دیتابیس
            await connectToDB();
            console.log('Successfully connected to MongoDB');
        } catch (err) {
            console.error('MongoDB connection error:', err);
            return res.status(500).json({
                status: "5000",
                message: "Database connection failed",
                error: err.message,
            });
        }

        try {

            const vehicleServic_key = 'taksisroys';
            const vehicleServic_Id = '66fbdf56db7b074818be2267';

            try {
                // حذف رکورد با key معادل 'taksisroys'
                const deleteResult = await vehicleServices.deleteOne({ key: vehicleServic_key });

                if (deleteResult.deletedCount > 0) {
                    console.log(`رکورد با key = ${vehicleServic_key} حذف شد.`);
                } else {
                    console.log(`رکوردی با key = ${vehicleServic_key} یافت نشد.`);
                }

                // ایجاد رکورد جدید
                const newRecord = {
                    _id: new ObjectId(vehicleServic_Id), // اصلاح به vehicleServic_Id
                    key: vehicleServic_key,
                    title: 'تاکسی سرویس',
                    unit: 'person',
                    active: true,
                    createdAt: new Date('2024-10-01T11:39:02.722Z'),
                    updatedAt: new Date('2024-10-01T11:39:02.722Z')
                };

                const insertResult = await vehicleServices.findOneAndUpdate(
                    { _id: newRecord._id }, // شرط جستجو (مثلاً براساس _id)
                    { $set: newRecord }, // به‌روزرسانی داده‌ها با newAccount
                    { upsert: true, new: true, setDefaultsOnInsert: true } // گزینه‌ها: ایجاد کاربر جدید اگر نبود
                );
                console.log('رکورد جدید با موفقیت ایجاد شد:'); // نمایش رکوردی که ایجاد شده است
            } catch (err) {
                console.error('خطا در مهاجرت Vehicle Service:', err);
            }
            ///////////////////////////////

            const oldCars = await old_cars.find({}); // دریافت خودروهای قدیمی

            for (const oldCar of oldCars) {
                try {

                    let createGroup = 'نامشخص'
                    switch (oldCar?.group) {
                        case 0: //IRISA
                            createGroup = "خودرو سازمان"
                        case 1: //TAXI,
                            createGroup = "agency"
                        // case 2: //SNAP,
                        //     createGroup = "اسنپ"
                        // default:
                        //     createGroup = "نامشخص"
                    }

                    let createStatus = 'IDLE'
                    switch (oldCar.status) {
                        case 0: //fr
                            createStatus = "IDLE"
                        case 1: //ntr,
                            createStatus = "ON_MISSION"
                    }

                    let createName = 'پراید'
                    switch (oldCar.name_code) {
                        case 0:
                            createName = "پراید"
                        case 1:
                            createName = "405پژو"
                        case 2:
                            createName = "پژو206"
                        case 3:
                            createName = "پژو پارس"
                        case 4:
                            createName = "تیبا"
                    }


                    let createColor = 'مشکی'
                    switch (oldCar.name_code) {
                        case 0:
                            createColor = "مشکی"
                        case 1:
                            createColor = "سفید"
                        case 2:
                            createColor = "نوک مدادی"
                        case 3:
                            createColor = "بژ"
                        case 4:
                            createColor = "نقره ای"
                    }

                    let newVehicle = new newvehicles({
                        _id: oldCar._id,
                        group: oldCar?.group === 1 ? 'agency' : 'خودرو سازمان',
                        driver_user: oldCar.driver?.user?.account_id,
                        status: 'IDLE',//createStatus,
                        plaque: oldCar.plaque.t === 0 ? oldCar._id.toHexString() : `${oldCar.plaque.f},${oldCar.plaque.s},${oldCar.plaque.l},${oldCar.plaque.t}`,
                        services: [{
                            service: "taksisroys",
                            capacity: 4,
                            _id: new ObjectId('663f81a4665933a1316d2795')
                        }],
                        extra: oldCar?.group === 0 ? {
                            name: createName,
                            color: createColor,
                            // man_year: oldCar.man_year,
                            // total_distance: oldCar.total_distance,
                            // total_interval: oldCar.total_interval,
                            // driver: oldCar.driver,
                            // past_drivers: oldCar.past_drivers,
                            // is_active: oldCar.is_active
                        }
                            :
                            {

                                agency_name: oldCar.driver?.user?.full_name,
                                agency_phone: '---'
                            }
                        ,
                        createdAt: oldCar.createdAt,
                        updatedAt: oldCar.updatedAt,
                        __v: oldCar.__v
                    });
                    // ذخیره خودرو جدید در دیتابیس
                    //await newvehicles(newVehicle).save();
                    await newvehicles.findOneAndUpdate(
                        { _id: newVehicle._id }, // شرط جستجو (مثلاً براساس _id)
                        { $set: newVehicle }, // به‌روزرسانی داده‌ها با newAccount
                        { upsert: true, new: true, setDefaultsOnInsert: true } // گزینه‌ها: ایجاد کاربر جدید اگر نبود
                    );
                } catch (error) {
                    console.error(`Error migrating car ID ${oldCar._id}:`, error.message);
                    res.status(500).json({
                        status: "5000",
                        message: `Migration for car ID ${oldCar._id} failed`,
                        error: error.message,
                    });
                    continue; // ادامه پردازش برای سایر خودروها
                }
            }

            // پاسخ موفقیت‌آمیز
            res.status(200).json({
                status: "200",
                data: oldCars,
            });
        } catch (error) {
            console.error('Migration oldCars error:', error);
            res.status(500).json({
                status: "5000",
                message: "Migration oldCars failed",
                error: error.message,
            });
        } finally {
            // بستن اتصال به دیتابیس
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed');
            } catch (closeError) {
                console.error('Error closing MongoDB connection:', closeError.message);
            }
        }
    }


    async migrateDataLocations(req, res) {
        try {
            // اتصال به دیتابیس
            await connectToDB();
            console.log('Successfully connected to MongoDB');
        } catch (err) {
            console.error('MongoDB connection error:', err);
            return res.status(500).json({
                status: "5000",
                message: "Database connection failed",
                error: err.message,
            });
        }

        try {
            const oldLocations = await old_locations.find({}); // دریافت لوکیشن‌های قدیمی

            for (const oldLocation of oldLocations) {
                try {
                    // ایجاد لوکیشن جدید
                    let newfavorite = new newFavoriteLocation({
                        name: oldLocation.name,
                        location: oldLocation.lnglat,
                        description: {
                            street: oldLocation.street,
                            plaque: oldLocation.plaque,
                            alley: oldLocation.alley
                        },
                        created_by: oldLocation.creator,
                        is_private: true,
                        is_deleted: oldLocation.is_active ? oldLocation.is_active : true,
                        createdAt: oldLocation.createdAt,
                        updatedAt: oldLocation.updatedAt,
                        __v: oldLocation.__v
                    });

                    // ذخیره لوکیشن جدید در دیتابیس
                    //  await newFavoriteLocation(newfavorite).save();
                    await newFavoriteLocation.findOneAndUpdate(
                        { _id: newfavorite._id }, // شرط جستجو (مثلاً براساس _id)
                        { $set: newfavorite }, // به‌روزرسانی داده‌ها با newAccount
                        { upsert: true, new: true, setDefaultsOnInsert: true } // گزینه‌ها: ایجاد کاربر جدید اگر نبود
                    );
                } catch (error) {
                    console.error(`Error migrating location ID ${oldLocation._id}:`, error.message);
                    res.status(500).json({
                        status: "5000",
                        message: `Migration for location ID ${oldLocation._id} failed`,
                        error: error.message,
                    });
                    continue; // ادامه پردازش برای سایر لوکیشن‌ها
                }
            }

            // پاسخ موفقیت‌آمیز
            res.status(200).json({
                status: "200",
                data: oldLocations,
            });
        } catch (error) {
            console.error('Migration oldLocations error:', error);
            res.status(500).json({
                status: "5000",
                message: "Migration oldLocations failed",
                error: error.message,
            });
        } finally {
            // بستن اتصال به دیتابیس
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed');
            } catch (closeError) {
                console.error('Error closing MongoDB connection:', closeError.message);
            }
        }
    }


}

module.exports = new migrateDataController();
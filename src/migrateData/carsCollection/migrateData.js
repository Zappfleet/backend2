const mongoose = require('mongoose');

const { Vehicle: newvehicles } = require('../../vehicles/data/vehicle-model');
const { Car: old_cars } = require('../../_old/modules/car/model');

const { ObjectId } = mongoose.Types;
const config = require("config");



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
    await mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`Connected to database`);
};



exports.migrateDataCars = async function (req, res) {
    try {
        await connectToDB()
        console.log('Successfully connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        return;
    }
    try {
        const oldCars = await old_cars.find({})

       
        for (const oldCar of oldCars) {
            try {

                let createGroup = 'نامشخص'
                switch (oldCar.group) {
                    case 0: //IRISA
                        createGroup = "خودرو سازمان"
                    case 1: //TAXI,
                        createGroup = "تاکسی"
                    case 2: //SNAP,
                        createGroup = "اسنپ"
                    default:
                        createGroup = "نامشخص"
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

                let newvehicle = new newvehicles({
                    _id: oldCar._id,
                    group: createGroup,
                    driver_user: oldCar.driver?.user?.account_id,
                    status: createStatus,
                    plaque: oldCar.plaque.t === 0 ? oldCar._id.toHexString() : `${oldCar.plaque.f},${oldCar.plaque.s},${oldCar.plaque.l},${oldCar.plaque.t}`,
                    services: [{
                        service: "taksisroys",
                        capacity: 4,
                        _id: ObjectId('663f81a4665933a1316d2795')
                    }],
                    extra: {
                        name: createName,
                        color: createColor,
                        man_year: oldCar.man_year,
                        total_distance: oldCar.total_distance,
                        total_interval: oldCar.total_interval,
                        driver: oldCar.driver,
                        past_drivers: oldCar.past_drivers,
                        is_active: oldCar.is_active
                    },
                    createdAt: oldCar.createdAt,
                    updatedAt: oldCar.updatedAt,
                    __v: oldCar.__v
                });

                await newvehicles(newvehicle).save();
            } catch (error) {
                console.error(`Error migrating request ID ${oldCar._id}:`, error.message);
                res.status(500).json({
                    status: "5000",
                    message: "Migration oldCar failed",
                    error: error.message,
                });
            }
        }
        res.status(200).json({
            status: "200",
            data: oldCars,
        });
    } catch (error) {
        console.error('Migration oldCar error:', error);
        res.status(500).json({
            status: "5000",
            message: "Migration oldCar failed",
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

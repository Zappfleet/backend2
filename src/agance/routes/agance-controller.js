
const { UserAccount } = require("../../users/data/models/user-model");
const { Agance } = require("../data/agance-model");
const { moayeneFani } = require("../data/MoayeneFani-model");
const { aganceparvane } = require('../data/aganceparvane-model')
const { aganceCarteSalahiyat } = require('../data/aganceCarteSalahiyat-model')
const { aganceTarefeAvarez } = require('../data/aganceTarefeAvarez-model')
const { Vehicle } = require('../../vehicles/data/vehicle-model');
const { ObjectId } = require("mongodb");
const mongoose = require('mongoose');



async function insert_Agance(req, res) {

    try {
        // // Validate item
        // if (!item || !item.start_date || !item.end_date || !Array.isArray(item.inactive_permissions)) {
        //     throw new Error('Invalid item format');
        // }

        const item = req.body;
        console.log(501, item);
        const agance = new Agance(item)
        console.log(503, agance);
        //  console.log(7000, req.body, item, systemInactive);
        const result = await agance.save();

        return res.status(200).send({
            status: 200,
            data: item
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function select_Agance(req, res) {
    console.log(900);
    try {
        //  console.log(10);
        const result = await Agance.find({})
        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function update_Agance(req, res) {
    try {
        const id = req.params.id;
        let item = req.body;
        delete item._id;
        const result = await Agance.findByIdAndUpdate(id, item, { new: true });
        //   console.log(800, result);

        // console.log(900, item, id);
        return res.status(200).send({
            status: 200,
            data: req.body
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function delete_Agance(req, res) {
    try {
        //console.log(700, req.params.id);
        const result = await Agance.deleteOne({ _id: req.params.id });
        res.status(result.status || 200).send(result);
        return res.status(200).send({
            status: 200,
            data: req.params.id
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}


///sodureParvane
async function insert_sodureParvane(req, res) {

    try {
        // // Validate item
        // if (!item || !item.start_date || !item.end_date || !Array.isArray(item.inactive_permissions)) {
        //     throw new Error('Invalid item format');
        // }

        console.log(1);
        const item = req.body;
        console.log(2, item);
        const agance = new aganceparvane(item)
        const result = await agance.save();

        return res.status(200).send({
            status: 200,
            data: item
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function select_sodureParvane(req, res) {
    try {
        const result = await aganceparvane.find({})
        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function update_sodureParvane(req, res) {
    try {
        const id = req.params.id;
        let item = req.body;
        delete item._id;
        const result = await aganceparvane.findByIdAndUpdate(id, item, { new: true });

        return res.status(200).send({
            status: 200,
            data: req.body
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function delete_sodureParvane(req, res) {
    try {
        const result = await aganceparvane.deleteOne({ _id: req.params.id });
        res.status(result.status || 200).send(result);
        return res.status(200).send({
            status: 200,
            data: req.params.id
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}



//aganceDriver

async function insert_AganceDriver(req, res) {

    try {
        // // Validate item
        // if (!item || !item.start_date || !item.end_date || !Array.isArray(item.inactive_permissions)) {
        //     throw new Error('Invalid item format');
        // }

        const item = req.body;

        console.log(1000, item);

        // ابتدا بررسی می‌کنیم که آیا کد ملی از قبل وجود دارد یا نه
        const existingUser = await UserAccount.findOne({ username: item.username });
        console.log(1000, existingUser);
        if (existingUser) {
            console.log(5895555);

            return res.status(201).send({
                status: 201,
                data: 'کد ملی وارد شده تکراری است.'
            });
        }

        else {
            const user = new UserAccount(item)
            const result = await user.save();

            return res.status(200).send({
                status: 200,
                data: item
            });

        }
    }
    catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }

}

async function select_AganceDriver(req, res) {
    try {
        //const result = await UserAccount.find({ reg_key: "AGANCE" })
        const result = await UserAccount.aggregate([
            {
                $match: { reg_key: "AGANCE" } // فیلتر کردن بر اساس reg_key
            },
            {
                $lookup: {
                    from: "vehicles", // نام مجموعه (collection) مربوط به خودروها
                    localField: "_id", // فیلد در UserAccount که باید مقایسه شود
                    foreignField: "driver_user", // فیلد در vehicles که به UserAccount ارجاع دارد
                    as: "vehicles" // نام فیلدی که نتایج در آن ذخیره می‌شود
                }
            }
        ]);
        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function update_AganceDriver(req, res) {
    try {
        const id = req.params.id;
        let item = req.body;
        delete item._id;
        delete item.username;
        delete item.password;

        const result = await UserAccount.findByIdAndUpdate(id, item, { new: true });
        //   console.log(800, result);

        // console.log(900, item, id);
        return res.status(200).send({
            status: 200,
            data: req.body
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function delete_AganceDriver(req, res) {
    try {
        //console.log(700, req.params.id);
        const result = await UserAccount.deleteOne({ _id: req.params.id });
        res.status(result.status || 200).send(result);
        return res.status(200).send({
            status: 200,
            data: req.params.id
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}


//aganceVehicle

async function insert_AganceVehicle(req, res) {

    try {
        // // Validate item
        // if (!item || !item.start_date || !item.end_date || !Array.isArray(item.inactive_permissions)) {
        //     throw new Error('Invalid item format');
        // }

        const item = req.body;
        const vehicle = new Vehicle(item)

        const result = await vehicle.save();

        return res.status(200).send({
            status: 200,
            data: item
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function select_AganceVehicle(req, res) {

    try {
        const result = await Vehicle.find({})
        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function select_AganceVehicleByDriverID(req, res) {

    console.log(5236);

    let { driver_user } = req.query;
    console.log(5236, driver_user);

    try {
        const result = await Vehicle.find({
            $and: [
                { driver_user: driver_user },
                { driver_user: { $exists: true } }
            ]
        });
        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function update_AganceVehicle(req, res) {
    try {
        const id = req.params.id;
        let item = req.body;
        delete item._id;
        const result = await Vehicle.findByIdAndUpdate(id, item, { new: true });
        //   console.log(800, result);

        // console.log(900, item, id);
        return res.status(200).send({
            status: 200,
            data: req.body
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function delete_AganceVehicle(req, res) {
    try {
        //console.log(700, req.params.id);
        const result = await Vehicle.deleteOne({ _id: req.params.id });
        res.status(result.status || 200).send(result);
        return res.status(200).send({
            status: 200,
            data: req.params.id
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}




///carteSalahiyat
async function insert_carteSalahiyat(req, res) {

    try {
        // // Validate item
        // if (!item || !item.start_date || !item.end_date || !Array.isArray(item.inactive_permissions)) {
        //     throw new Error('Invalid item format');
        // }

        console.log(1);
        const item = req.body;
        console.log(2, item);
        const collection = new aganceCarteSalahiyat(item)
        const result = await collection.save();

        return res.status(200).send({
            status: 200,
            data: item
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function select_carteSalahiyat(req, res) {
    try {
        const result = await aganceCarteSalahiyat.find({}).sort({ createdAt: -1 });
        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function update_carteSalahiyat(req, res) {
    try {
        const id = req.params.id;
        let item = req.body;
        delete item._id;
        const result = await aganceCarteSalahiyat.findByIdAndUpdate(id, item, { new: true });

        return res.status(200).send({
            status: 200,
            data: req.body
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function delete_carteSalahiyat(req, res) {
    try {
        const result = await aganceCarteSalahiyat.deleteOne({ _id: req.params.id });
        res.status(result.status || 200).send(result);
        return res.status(200).send({
            status: 200,
            data: req.params.id
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}





///TarefeAvarez
async function insert_TarefeAvarez(req, res) {

    try {
        // // Validate item
        // if (!item || !item.start_date || !item.end_date || !Array.isArray(item.inactive_permissions)) {
        //     throw new Error('Invalid item format');
        // }

        console.log(1);
        const item = req.body;
        console.log(2, item);
        const collection = new aganceTarefeAvarez(item)
        const result = await collection.save();

        return res.status(200).send({
            status: 200,
            data: item
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function select_TarefeAvarez(req, res) {
    try {
        const result = await aganceTarefeAvarez.find({})
        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function update_TarefeAvarez(req, res) {
    try {
        const id = req.params.id;
        let item = req.body;
        delete item._id;
        const result = await aganceTarefeAvarez.findByIdAndUpdate(id, item, { new: true });

        return res.status(200).send({
            status: 200,
            data: req.body
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function delete_TarefeAvarez(req, res) {
    try {
        const result = await aganceTarefeAvarez.deleteOne({ _id: req.params.id });
        res.status(result.status || 200).send(result);
        return res.status(200).send({
            status: 200,
            data: req.params.id
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}




///MoayeneFani
async function insert_MoayeneFani(req, res) {

    try {
        // // Validate item
        // if (!item || !item.start_date || !item.end_date || !Array.isArray(item.inactive_permissions)) {
        //     throw new Error('Invalid item format');
        // }

        console.log(1);
        const item = req.body;
        console.log(2, item);
        const collection = new moayeneFani(item)
        const result = await collection.save();

        return res.status(200).send({
            status: 200,
            data: item
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function select_MoayeneFani(req, res) {
    try {
        const result = await moayeneFani.find({})
        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function update_MoayeneFani(req, res) {
    try {
        const id = req.params.id;
        let item = req.body;
        delete item._id;
        const result = await moayeneFani.findByIdAndUpdate(id, item, { new: true });

        return res.status(200).send({
            status: 200,
            data: req.body
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function delete_MoayeneFani(req, res) {
    try {
        const result = await moayeneFani.deleteOne({ _id: req.params.id });
        res.status(result.status || 200).send(result);
        return res.status(200).send({
            status: 200,
            data: req.params.id
        });

    } catch (error) {
        console.error(6000);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

async function selectAganceProfileByDriverId(req, res) {
    try {
        const { driverId } = req.query;
        console.log(2001, driverId);

        const result = await UserAccount.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(driverId)
                }
            },
            {
                $lookup: {
                    from: 'useraccounts',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'driverInfo'
                }
            },
            {
                $lookup: {
                    from: 'vehicles',
                    localField: '_id',
                    foreignField: 'driver_user',
                    as: 'vehicleInfo'
                }
            },
            {
                $lookup: {
                    from: 'aganceCarteSalahiyat',
                    localField: '_id',
                    foreignField: 'driverId',
                    as: 'aganceCarteSalahiyatInfo'
                }
            },
            {
                $lookup: {
                    from: 'aganceParvane',
                    localField: '_id',
                    foreignField: 'driverId',
                    as: 'aganceParvaneInfo'
                }
            },
            {
                $project: {
                    driverInfo: { $ifNull: ['$driverInfo', []] },
                    vehicleInfo: { $ifNull: ['$vehicleInfo', []] },
                    aganceCarteSalahiyat: {
                        $map: {
                            input: { $ifNull: ['$aganceCarteSalahiyatInfo', []] },
                            as: 'r1',
                            in: {
                                date: '$$r1.fromDate',
                                name: 'دریافت کارت صلاحیت'
                            }
                        }
                    },
                    aganceParvane: {
                        $map: {
                            input: { $ifNull: ['$aganceParvaneInfo', []] },
                            as: 'r2',
                            in: {
                                date: '$$r2.fromDate',
                                name: 'دریافت پروانه'
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    allActivity: {
                        $concatArrays: [{ $ifNull: ["$aganceCarteSalahiyat", []] }, { $ifNull: ["$aganceParvane", []] }]
                    }
                }
            },
            {
                $unwind: { path: '$allActivity', preserveNullAndEmptyArrays: true }
            },
            {
                $sort: { 'allActivity.date': 1 }
            },
            {
                $group: {
                    _id: '$_id',
                    driverInfo: { $first: '$driverInfo' },
                    vehicleInfo: { $first: '$vehicleInfo' },
                    allActivity: { $push: '$allActivity' }
                }
            }
        ],
            { maxTimeMS: 60000, allowDiskUse: true });

        return res.status(200).send({
            status: 200,
            data: result
        });

    } catch (error) {
        console.error(6000, error);
        return res.status(500).send({
            status: 500,
            error: error.message
        });
    }
}

// async function selectAganceProfileByDriverId(req, res) {
//     try {
//         const { driverId } = req.query;
//         console.log(2001, driverId);

//         const result = await UserAccount.aggregate([
//             {
//                 $match: {
//                     _id: new mongoose.Types.ObjectId(driverId)
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'useraccounts',
//                     localField: '_id',
//                     foreignField: '_id',
//                     as: 'driverInfo'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'vehicles',
//                     localField: '_id',
//                     foreignField: 'driver_user',
//                     as: 'vehicleInfo'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'aganceCarteSalahiyat',
//                     localField: '_id',
//                     foreignField: 'driverId',
//                     as: 'aganceCarteSalahiyatInfo'
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'aganceParvane',
//                     localField: '_id',
//                     foreignField: 'driverId',
//                     as: 'aganceParvaneInfo'
//                 }
//             },
//             {
//                 $project: {
//                     driverInfo: 1,
//                     vehicleInfo: 1,
//                     aganceCarteSalahiyat: {
//                         $map: {
//                             input: '$aganceCarteSalahiyatInfo',
//                             as: 'r1',
//                             in: {
//                                 date: '$$r1.fromDate',
//                                 name: 'دریافت کارت صلاحیت'
//                             }
//                         }
//                     },
//                     aganceParvane: {
//                         $map: {
//                             input: '$aganceParvaneInfo',
//                             as: 'r2',
//                             in: {
//                                 date: '$$r2.fromDate',
//                                 name: 'دریافت پروانه'
//                             }
//                         }
//                     }
//                 }
//             },
//             {
//                 $addFields: {
//                     allActivity: {
//                         $concatArrays: [{ $ifNull: ["$aganceCarteSalahiyat", []] }, { $ifNull: ["$aganceParvane", []] }]
//                     }
//                 }
//             },
//             {
//                 $unwind: '$allActivity'
//             },
//             {
//                 $sort: { 'allActivity.date': 1 }
//             },
//             {
//                 $group: {
//                     _id: '$_id',
//                     driverInfo: { $first: '$driverInfo' },
//                     vehicleInfo: { $first: '$vehicleInfo' },
//                     allActivity: { $push: '$allActivity' }
//                 }
//             }
//         ],
//             { maxTimeMS: 60000, allowDiskUse: true });

//         return res.status(200).send({
//             status: 200,
//             data: result
//         });

//     } catch (error) {
//         console.error(6000, error);
//         return res.status(500).send({
//             status: 500,
//             error: error.message
//         });
//     }
// }

module.exports = {
    insert_Agance,
    select_Agance,
    delete_Agance,
    update_Agance,
    insert_sodureParvane,
    select_sodureParvane,
    delete_sodureParvane,
    update_sodureParvane,
    insert_AganceDriver,
    select_AganceDriver,
    delete_AganceDriver,
    update_AganceDriver,
    insert_AganceVehicle,
    select_AganceVehicle,
    delete_AganceVehicle,
    update_AganceVehicle,
    select_AganceVehicleByDriverID,
    insert_carteSalahiyat,
    select_carteSalahiyat,
    delete_carteSalahiyat,
    update_carteSalahiyat,
    insert_TarefeAvarez,
    select_TarefeAvarez,
    delete_TarefeAvarez,
    update_TarefeAvarez,
    insert_MoayeneFani,
    select_MoayeneFani,
    delete_MoayeneFani,
    update_MoayeneFani,
    selectAganceProfileByDriverId
};



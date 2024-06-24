const mongoose = require('mongoose');

const newRegions = require('../../regions/data/region-model');
const old_areas = require('../../_old/modules/area/model');

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



exports.migrateDataAreas = async function (req, res) {
    try {
        await connectToDB()
        console.log('Successfully connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        return;
    }
    try {
        const oldAreas = await old_areas.find({})

        for (const oldArea of oldAreas) {
            try {
                let newRegion = new newRegions({
                    _id: oldArea._id,
                    name: oldArea.name,
                    dispatcher: oldArea.dispatcher[0].account_id,
                    alternativeDispatcher: oldArea.prev_dispatchers,
                    geometry: oldArea.location,
                    properties: { need_manager_confirmation: oldArea.need_manager_approve === true ? 'yes' : 'no' },
                    is_active: oldArea.is_active,
                    __v:oldArea.__v
                });

                await newRegions(newRegion).save();
            } catch (error) {
                console.error(`Error migrating request ID ${oldArea._id}:`, error.message);
                res.status(500).json({
                    status: "5000",
                    message: "Migration oldAreas failed",
                    error: error.message,
                });
            }
        }
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
        // Close the MongoDB connection
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
        } catch (closeError) {
            console.error('Error closing MongoDB connection:', closeError.message);
        }
    }
}

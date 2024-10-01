const mongoose = require('mongoose');

const { FavoriteLocation: newFavoriteLocation } = require('../../favoriteLocation/model/favorit-location-model');
const old_locations = require('../../_old/modules/location/model');

const { ObjectId } = mongoose.Types;
const config = require("config");



// Function to connect to MongoDB
const connectToDB = async () => {
    const environment_name = config.get("environment_name");
    let db = "";

    if (environment_name === "local") {
        db =  config.get("db");
    } else if (environment_name === "server") {
        db = config.get("db_SERVER");
    } else {
        throw new Error('Unknown environment name');
    }

    mongoose.set('strictQuery', false);
    await mongoose.connect(db)//, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`Connected to database`);
};



exports.migrateDataLocations = async function (req, res) {
    try {
        await connectToDB()
        console.log('Successfully connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        return;
    }
    try {
        const oldLocations = await old_locations.find({})


        for (const oldLocation of oldLocations) {
            try {
                let newfavorite = new newFavoriteLocation({
                    name: oldLocation.name,
                    location: oldLocation.lnglat,
                    description: { street: oldLocation.street, plaque: oldLocation.plaque, alley: oldLocation.alley },
                    created_by: oldLocation.creator,
                    is_private: true,
                    is_deleted: oldLocation.is_active ? oldLocation.is_active : true,
                    createdAt: oldLocation.createdAt,
                    updatedAt: oldLocation.updatedAt,
                    __v: oldLocation.__v
                });

                await newFavoriteLocation(newfavorite).save();
            } catch (error) {
                console.error(`Error migrating location ID ${oldLocation._id}:`, error.message);
                res.status(500).json({
                    status: "5000",
                    message: "Migration location failed",
                    error: error.message,
                });
            }
        }
        res.status(200).json({
            status: "200",
            data: oldLocations,
        });
    } catch (error) {
        console.error('Migration oldlocation error:', error);
        res.status(500).json({
            status: "5000",
            message: "Migration oldlocation failed",
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

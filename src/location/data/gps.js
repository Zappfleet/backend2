const { ObjectId } = require("mongodb");
const { default: mongoose } = require("mongoose");

const gpsHistory = new mongoose.Schema(
    {
        owner_id: {
            type: ObjectId,
            required: true,
            index: true,
        },
        coordinates: {
            type: [Number],
            required: true,
            index: '2dsphere'
        },
        gmt_date: {
            type: Date,
            required: true,
        },
        speed: {
            type: Number,
            required: true,

        }
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

const GpsHistory = mongoose.model("GpsHistory", gpsHistory);
module.exports.GpsHistory = GpsHistory;

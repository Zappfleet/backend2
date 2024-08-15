const mongoose = require("mongoose");
const { string } = require("../../resources/R");
const { ObjectId } = require("mongodb");
const { COLLECTION_AGANCE } = require("./agance-model");
const { COLLECTION_USER_ACCOUNT } = require("../../users/data/models/user-model");

function locationsValidation(val) {
    return val.length >= 2;
}


const aganceCarteSalahiyatSchema = new mongoose.Schema({

    fishNumber: {
        type: String,
        required: false,
    },
    fishPrice: {
        type: String,
        required: false,
    },
    fishDate: {
        type: Date,
        required: false,
    },
    attachFile: {
        fishPic: {
            type: String,
            required: false,
        },
        moarrefiNameMahaleFaaliyat: {
            type: String,
            required: false,
        }
    },
    driverId: {
        type: mongoose.Types.ObjectId,
        ref: COLLECTION_USER_ACCOUNT
    },
    driverFullName: {
        type: String,
        required: false,
    },
    driverNatNum: {
        type: String,
        required: false,
    },
    shomareParvane: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: false,
    },
    year: {
        type: String,
        required: false,
    },
    fromDate: {
        type: Date,
        required: false,
    },
    toDate: {
        type: Date,
        required: false,
    },
    etebarHistory: [
        {
            status: {
                type: String,
                required: false,
            },
            year: {
                type: String,
                required: false,
            },
            fromDate: {
                type: String,
                required: false,
            }, toDate: {
                type: String,
                required: false,
            }
        }
    ]
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);



const aganceCarteSalahiyat = mongoose.model("aganceCarteSalahiyat", aganceCarteSalahiyatSchema, 'aganceCarteSalahiyat');

exports.aganceCarteSalahiyat = aganceCarteSalahiyat;

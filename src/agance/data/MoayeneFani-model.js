const mongoose = require("mongoose");
const { string } = require("../../resources/R");
const { ObjectId } = require("mongodb");
const { COLLECTION_USER_ACCOUNT } = require("../../users/data/models/user-model");

function locationsValidation(val) {
    return val.length >= 2;
}

const COLLECTION_moayeneFani = "moayeneFani";
const moayeneFaniSchema = new mongoose.Schema({

    address: {
        locations: {
            required: false,
            type: [{
                coordinates: {
                    type: [Number],
                    required: true,
                    index: '2dsphere'
                },
                wait: {
                    type: Number,
                    required: true,
                    default: 0,
                },
                meta: {
                    type: Object,
                },
            }],
            // validate: [locationsValidation, '{PATH} should contain at least two elements']
        },
        address: {
            type: String,
            required: false,
        },
        postalCode: {
            type: String,
            required: false,
        },
    },
    desc: {
        type: String,
        required: false,
    },
    attachFile: {
        modirPic: {
            type: String,
            required: false,
        },
        parvaneNamayandegi: {
            type: String,
            required: false,
        },
        mojavezSazmanHamlVaNaghl: {
            type: String,
            required: false,
        },
    },
    status: {
        type: String,
        required: false,
    },
    managerPhone: {
        type: String,
        required: false,
    },
    phone: {
        type: String,
        required: false,
    },
    managerCodeMelli: {
        type: String,
        required: false,
    },
    managerFullName: {
        type: String,
        required: false,
    },
    StartActivityDate: {
        type: Date,
        required: false,
    },
    name: {
        type: String,
        required: false,
    },
    activityContext: {
        type: String,
        required: false,
        // enum: keysOf(serviceRequestStatus),
        // default: serviceRequestStatus.PENDING.key
    },
    submitted_by: {
        type: String,
        // ref: COLLECTION_USER_ACCOUNT
    }
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);



const moayeneFani = mongoose.model("moayeneFani", moayeneFaniSchema, 'moayeneFani');

module.exports.moayeneFani = mongoose.model(
    COLLECTION_moayeneFani,
    moayeneFaniSchema
  );

exports.moayeneFani = moayeneFani;
module.exports.COLLECTION_moayeneFani = COLLECTION_moayeneFani;

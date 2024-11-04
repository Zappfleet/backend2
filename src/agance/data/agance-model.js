const mongoose = require("mongoose");
const { string } = require("../../resources/R");
const { ObjectId } = require("mongodb");
const { COLLECTION_USER_ACCOUNT } = require("../../users/data/models/user-model");

function locationsValidation(val) {
    return val.length >= 2;
}

const COLLECTION_AGANCE = "Agance";
const AganceSchema = new mongoose.Schema({

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
        modirOrmobasherPic: {
            type: String,
            required: false,
        },
        parvaneNamayandegi: {
            type: String,
            required: false,
        },
        amaken: {
            type: String,
            required: false,
        },
        estelameAngoshNegari: {
            type: String,
            required: false,
        },
        formeTaahod: {
            type: String,
            required: false,
        },
        taeidiyeRahnamaeiRanandegi: {
            type: String,
            required: false,
        },
        estelameAzmayesheKhoon: {
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
    mobasherCodeMelli: {
        type: String,
        required: false,
    },
    mobasherFullName: {
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
    gharardad_num: {
        type: String,
        required: false,
    },
    gharardad_date: {
        type: Date,
        required: false,
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



const Agance = mongoose.model("Agance", AganceSchema, 'agance');

module.exports.Agance = mongoose.model(
    COLLECTION_AGANCE,
    AganceSchema
);

exports.Agance = Agance;
module.exports.COLLECTION_AGANCE = COLLECTION_AGANCE;

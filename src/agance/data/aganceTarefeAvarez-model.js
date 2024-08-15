const mongoose = require("mongoose");
const { string } = require("../../resources/R");
const { ObjectId } = require("mongodb");
const { COLLECTION_USER_ACCOUNT } = require("../../users/data/models/user-model");

function locationsValidation(val) {
    return val.length >= 2;
}

const COLLECTION_aganceTarefeAvarez = "aganceTarefeAvarez";
const aganceTarefeAvarezSchema = new mongoose.Schema({
    year: {
        type: String,
        required: false,
    },
    sodureCaretSalahiyat: {
        type: String,
        required: false,
    },
    tamdidCaretSalahiyat: {
        type: String,
        required: false,
    },
    sodureParvaneAgance: {
        type: String,
        required: false,
    },
    AvarezaSaliyaneAgance: {
        type: String,
        required: false,
    },
    karshenasiParvande: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: false,
    },
    attachFile: {
        madarek: {
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
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);



const aganceTarefeAvarez = mongoose.model("aganceTarefeAvarez", aganceTarefeAvarezSchema, 'aganceTarefeAvarez');

module.exports.aganceTarefeAvarez = mongoose.model(
    COLLECTION_aganceTarefeAvarez,
    aganceTarefeAvarezSchema
);

exports.aganceTarefeAvarez = aganceTarefeAvarez;
module.exports.COLLECTION_aganceTarefeAvarez = COLLECTION_aganceTarefeAvarez;

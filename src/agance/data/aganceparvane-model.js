const mongoose = require("mongoose");
const { string } = require("../../resources/R");
const { ObjectId } = require("mongodb");
const { COLLECTION_AGANCE } = require("./agance-model");

function locationsValidation(val) {
    return val.length >= 2;
}


const aganceparvaneSchema = new mongoose.Schema({
    
    fishNumber: {
        type: String,
        required: false,
    },
    fishPrice: {
        type: String,
        required: false,
    },
    year: {
        type: String,
        required: false,
    },
    attachFile: {
        fishPic: {
            type: String,
            required: false,
        }
    },
    fishDate: {
        type: Date,
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
    aganceID: {
        type: mongoose.Types.ObjectId,
        ref: COLLECTION_AGANCE
    }
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);



const aganceparvane = mongoose.model("aganceparvane", aganceparvaneSchema, 'aganceparvane');

exports.aganceparvane = aganceparvane;

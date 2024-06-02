const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { keysOf } = require("../../utils");
const { vehicleServices, } = require("../../vehicles/constants");
const { serviceRequestStatus } = require("../constatns");
const { COLLECTION_USER_ACCOUNT } = require("../../users/data/models/user-model");


const serviceRequestSchema = new mongoose.Schema(
    {
        locations: {
            required: true,
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
            validate: [locationsValidation, '{PATH} should contain at least two elements']
        },
        service: {
            type: String,
            required: true,
        },
        gmt_for_date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: keysOf(serviceRequestStatus),
            default: serviceRequestStatus.PENDING.key
        },
        submitted_by: {
            type: ObjectId,
            ref: COLLECTION_USER_ACCOUNT
        },
        confirmed_by: {
            type: ObjectId,
            ref: COLLECTION_USER_ACCOUNT
        },
        rejected_by: {
            type: ObjectId,
            ref: COLLECTION_USER_ACCOUNT
        },
        details: {
            type: Object,
            required: true,
            default: {},
        },
        area: {
            type: ObjectId,
            ref: "Region",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

function locationsValidation(val) {
    return val.length >= 2;
}

serviceRequestSchema.plugin(mongoosePaginate);


serviceRequestSchema.methods.getRequiredCapacity = function () {
    switch (this.service) {
        case vehicleServices.TAXI.key:
            return this.details?.names?.length || 1
        case vehicleServices.CARGO.key:
            return 0;
        case vehicleServices.DELIVERY.key:
            return 0;
    }
};

module.exports.ServiceRequest = mongoose.model("ServiceRequest", serviceRequestSchema);

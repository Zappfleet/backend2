const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { keysOf } = require("../../utils");
const { statusUpdateType } = require("../constatns");
const { COLLECTION_USER_ACCOUNT } = require("../../users/data/models/user-model");

const serviceStatusHistory = new mongoose.Schema(
    {
        applied_by_user: {
            type: ObjectId,
            ref: COLLECTION_USER_ACCOUNT,
            required: true,
        },
        service_request: {
            type: ObjectId,
            ref: "ServiceRequest",
        },
        service_mission: {
            type: ObjectId,
            ref: "ServiceMission",
        },
        type: {
            type: String,
            enum: keysOf(statusUpdateType),
            required: true,
        },
        update_info: {
            type: Object,
            default: {},
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);


serviceStatusHistory.plugin(mongoosePaginate);
module.exports.ServiceStatusHistory = mongoose.model("ServiceStatusHistory", serviceStatusHistory);

const mongoose = require("mongoose");


const vehicleGroupSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
            unique: true,
        },
        active: {
            type: Boolean,
            default: true,
            required: true,
        },

    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);


const vehicleServiceSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
        },
        unit: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
            unique: true,
        },
        active: {
            type: Boolean,
            default: true,
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

const vehicleNameSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
            unique: true,
        },
        active: {
            type: Boolean,
            default: true,
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

const vehicleColorSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
            unique: true,
        },
        active: {
            type: Boolean,
            default: true,
            required: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);




const VehicleGroupModel = mongoose.model("VehicleGroup", vehicleGroupSchema);
const VehicleServiceModel = mongoose.model("VehicleService", vehicleServiceSchema);
const VehicleColorModel = mongoose.model("VehicleColor", vehicleColorSchema);
const VehicleNameModel = mongoose.model("VehicleName", vehicleNameSchema);



module.exports = {
    VehicleGroupModel,
    VehicleServiceModel,
    VehicleColorModel,
    VehicleNameModel
};

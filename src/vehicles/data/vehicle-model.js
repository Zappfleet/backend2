const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { keysOf } = require("../../utils");
const {
  vehicleGroups,
  vehicleStatus,
  vehicleServices,
  serviceUnits,
} = require("../constants");
const {
  COLLECTION_USER_ACCOUNT,
} = require("../../users/data/models/user-model");

const VEHICLE_GROUP_AGENCY = "agency";

const vehicleSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      // enum: keysOf(vehicleGroups),
      required: true,
    },
    driver_user: {
      type: mongoose.Types.ObjectId,
      ref: COLLECTION_USER_ACCOUNT,
      index: true,
    },
    status: {
      type: String,
      enum: keysOf(vehicleStatus),
      default: vehicleStatus.IDLE.key,
      required: true,
    },
    plaque: {
      type: String,
      required: true,
      unique: true,
    },
    services: {
      type: [
        {
          service: {
            type: String,
            // enum: keysOf(vehicleServices),
            required: true,
          },
          capacity: {
            type: Number,
            required: true,
          },
        },
      ],
      required: true,
      validate: [
        servicesValidation,
        "{PATH} should contain at least one element",
      ],
    },
    gps_uid: {
      type: String,
      // unique: true,
      // sparse: true
    },

    latest_location_info: {
      type: {
        area: {
          type: mongoose.Types.ObjectId,
          ref: "Area",
          required: true,
          index: true,
        },
        gmt_entrance: {
          type: Date,
          required: true,
        },
      },
    },
    extra: {
      type: Object,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

function servicesValidation(val) {
  return val.length > 0;
}

vehicleSchema.methods.isAgencyVehicle = function () {
  return this.extra?.agency_name != null;
};

vehicleSchema.plugin(mongoosePaginate);

const VehicleModel = mongoose.model("Vehicle", vehicleSchema);

module.exports.Vehicle = VehicleModel;
module.exports.VEHICLE_GROUP_AGENCY = VEHICLE_GROUP_AGENCY;

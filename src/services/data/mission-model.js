const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { keysOf } = require("../../utils");
const { vehicleServices } = require("../../vehicles/constants");
const { serviceMissionStatus, assignedRequestStatus } = require("../constatns");
const { ServiceRequest } = require("./service-request-model");
const {
  COLLECTION_USER_ACCOUNT,
} = require("../../users/data/models/user-model");

const serviceMission = new mongoose.Schema(
  {
    service_requests: {
      type: [
        {
          request_id: {
            type: ObjectId,
            ref: "ServiceRequest",
          },
          status: {
            type: String,
            enum: keysOf(assignedRequestStatus),
            default: assignedRequestStatus.PENDING.key,
            required: true,
          },
          current_location_index: {
            type: Number,
            required: true,
            default: -1,
          },
          meta: {
            type: Object,
            default: {},
            required: true,
          },
        },
      ],
      required: true,
      default: [],
    },
    vehicle_id: {
      type: ObjectId,
      ref: "Vehicle",
    },
    driver_id: {
      type: ObjectId,
      ref: COLLECTION_USER_ACCOUNT,
    },
    assigned_by: {
      type: ObjectId,
      ref: COLLECTION_USER_ACCOUNT,
    },
    created_by: {
      type: ObjectId,
      ref: COLLECTION_USER_ACCOUNT,
      required: true,
    },
    gmt_for_date: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: keysOf(serviceMissionStatus),
      required: true,
      default: serviceMissionStatus.DRAFT.key,
    },
    area: {
      type: ObjectId,
      ref: "Region",
    },
    reviews: {
      type: [Object],
      default: [],
    },
    extra: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

serviceMission.methods.getDetailedServiceRequests = async function () {
  const request_ids = this.service_requests.map((item) => item.request_id);
  return await ServiceRequest.find({ _id: { $in: request_ids } });
};

serviceMission.methods.allRequestsAreDone = function () {
  if (this.service_requests.length == 0) return false;
  const noneFinishedRequest = this.service_requests.find((item) => {
    return item.status != assignedRequestStatus.DONE.key;
  });
  return noneFinishedRequest == null;
};

serviceMission.plugin(mongoosePaginate);
module.exports.ServiceMission = mongoose.model(
  "ServiceMission",
  serviceMission
);

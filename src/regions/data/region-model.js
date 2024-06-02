const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const {
  COLLECTION_USER_ACCOUNT,
} = require("../../users/data/models/user-model");

const regionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    dispatcher: {
      type: mongoose.Types.ObjectId,
      ref: COLLECTION_USER_ACCOUNT,
      index: true,
    },
    alternativeDispatcher: {
      type: [mongoose.Types.ObjectId],
      ref: COLLECTION_USER_ACCOUNT,
      index: true,
      default: [],
    },
    geometry: {
      type: { type: String, default: "Polygon" },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    properties: {
      type: Object,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timeStamp: true,
    autoIndex: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
regionSchema.index({ geometry: "2dsphere" });
regionSchema.plugin(mongoosePaginate);
const Region = mongoose.model("Region", regionSchema);

module.exports = Region;

const { ObjectId } = require("mongodb");
const { default: mongoose } = require("mongoose");
const { COLLECTION_USER_ACCOUNT } = require("./user-model");

const deligation = new mongoose.Schema(
  {
    fromUser: {
      type: ObjectId,
      ref: COLLECTION_USER_ACCOUNT,
      required: true,
    },
    toUser: {
      type: ObjectId,
      ref: COLLECTION_USER_ACCOUNT,
      required: true,
    },
    permissions: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports.Deligation = mongoose.model("Deligation", deligation);

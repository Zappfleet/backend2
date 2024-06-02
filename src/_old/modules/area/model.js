const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const dispatcherSchema = new mongoose.Schema({
  full_name: String,
  phone_num: String,
  emp_num: String,
  avatar: String,
  account_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
});

const areaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: { type: String, default: "Point" },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    dispatcher: {
      type: [dispatcherSchema],
    },
    prev_dispatchers: {
      type: [dispatcherSchema],
      select: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    base_price: {
      type: Number,
      default: 0,
    },
    road_price: {
      type: Number,
      default: 0,
    },
    //number of requests in every area

    //it is actually no need_manager_approve: درواقع عدم نیاز به تایید مدیرپروژه است
    need_manager_approve: {
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
areaSchema.index({ location: "2dsphere" });
areaSchema.plugin(mongoosePaginate);
const Area = mongoose.model("Area", areaSchema);

module.exports = Area;

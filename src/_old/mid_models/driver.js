const mongoose = require("mongoose");

const userDetailsSchema = new mongoose.Schema({
  full_name: String,
  phone_num: String,
  emp_num: String,
  account_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
});

const driverSchema = new mongoose.Schema(
  {
    car_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Car",
    },
    past_cars: {
      type: [
        {
          car: mongoose.SchemaTypes.ObjectId,
          start_date: Date,
          finish_date: Date,
        },
      ],
      ref: "Car",
    },
    user: {
      type: userDetailsSchema,
      required: true,
    },
    total_distance: {
      type: Number,
      default: 0,
    },
    total_interval: {
      type: Number,
      default: 0,
    },
    status: {
      type: Number,
      default: 0,
    },
    location: [Number],
    is_active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

driverSchema.virtual("travels", {
  ref: "Travel",
  localField: "_id",
  foreignField: "driver.driver_id",
});

driverSchema.virtual("totTravels", {
  ref: "Travel",
  localField: "_id",
  foreignField: "driver.driver_id",
  count: true,
});

driverSchema.methods.updateDistance = function (travel) {
  this.totDistance += travel.distance;
};

const Driver = mongoose.model("Driver", driverSchema);

exports.Driver = Driver;

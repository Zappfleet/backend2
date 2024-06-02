const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const car_group = require("../../global_values/car_group");

const userDetailsSchema = new mongoose.Schema({
  full_name: String,
  phone_num: String,
  emp_num: String,
  avatar: String,
  account_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
});

const plaqueSchema = new mongoose.Schema({
  f: {
    type: Number,
    required: true,
  },
  s: {
    type: Number,
    required: true,
  },
  t: {
    type: Number,
    required: true,
  },
  l: {
    type: String,
    required: true,
  },
});

const carSchema = new mongoose.Schema(
  {
    plaque: {
      type: plaqueSchema,
      required: true,
    },
    color_code: {
      type: Number,
      required: true,
    },
    name_code: {
      type: Number,
      required: true,
    },
    man_year: {
      type: Number,
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
    driver: {
      type: {
        user: userDetailsSchema,
        location: [Number],
        bearing: Number,
        driver_id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: "Driver",
        },
      },
      // required: true,
    },
    past_drivers: [
      {
        user: userDetailsSchema,
        driver_id: { type: mongoose.SchemaTypes.ObjectId, ref: "Driver" },
        start_date: Date,
        finish_date: Date,
      },
    ],
    status: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      required: true,
      default: true,
    },
    group: {
      type: Number,
      default: car_group.IRISA
    },
    gps_id:{
      type: Number,
    }
  },
  { 
    collation: { locale: 'fa', strength: 1 },
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true } 
  }
);

carSchema.virtual("travels", {
  ref: "Trip",
  localField: "_id",
  foreignField: "car.car_id",
});

carSchema.virtual("totTravels", {
  ref: "Trip",
  localField: "_id",
  foreignField: "car.car_id",
  count: true,
});

carSchema.methods.updateDistance = function (travel) {
  this.totDistance += travel.distance;
};
carSchema.plugin(mongoosePaginate);
const Car = mongoose.model("Car", carSchema);

exports.Car = Car;
exports.plaqueSchema = plaqueSchema;

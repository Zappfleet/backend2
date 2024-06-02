const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const { pssTrpStat } = require("../../global_values/status");
const { Request } = require("../request/model");
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

const pointSchema = new mongoose.Schema({
  adr: String,
  lnglat: [Number],
});

const userDetailsSchema = new mongoose.Schema({
  full_name: String,
  phone_num: String,
  emp_num: String,
  account_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
});
const userWithRoleDetailsSchema = new mongoose.Schema({
  full_name: String,
  account_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  role: {
    type: [Number],
    default: 0,
  },
});

const passengerSchema = new mongoose.Schema({
  full_name: String,
  phone_num: String,
  emp_num: String,
  guests: [String],
  mates: [userDetailsSchema],
  account_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "User",
  },
  request_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Request",
  },
  desc: String,
  status: {
    type: Number,
    default: 0,
    enum: [0, 1, 2, 3, 4],
  },
});

const reviewSchema = new mongoose.Schema({
  desc: String,
  pos_points: [Number],
  neg_points: [Number],
  satisfaction_rate: {
    type: Number,
    enum: [0, 1, 2, 3, 4],
  },
  user: userWithRoleDetailsSchema,
});

const timingSchema = new mongoose.Schema({
  key: {
    type: Number,
    enum: [1, 2, 3, 4, 5, 6],
    // enum: ["startTrip","passGetOn", "passGetOff","driverGetOn", "driverGetOff","finishTrip"],
  },
  value: {
    type: Date,
  },
  passenger_id : mongoose.SchemaTypes.ObjectId ,
  user: userWithRoleDetailsSchema,
});

const distanceSchema = new mongoose.Schema({
  temp_points: {
    type: [[Number]],
    default: [],
  },
  temp_points_meta:{
    type: [Object],
    default: [],
  },
  polyline: String,
  distance: {
    type: Number,
    default: 0,
  },
  interval: {
    type: Number,
    default: 0,
  },
  distance_actual: {
    type: Number,
    default: 0,
  },
  interval_actual: {
    type: Number,
    default: 0,
  },
  dispatcher_override: {
    type: Boolean,
    default: false,
  }
});

const travelSchema = new mongoose.Schema(
  {
    locations: {
      type: [
        {
          start: pointSchema,
          finish: pointSchema,
        },
      ],
      required: true,
    },
    for_date: {
      type: Date,
      required: true,
    },
    for_time: {
      type: Number,
      required: true,
    },
    passengers: {
      type: [passengerSchema],
      required: false,
    },
    distance_props: {
      type: distanceSchema,
      default: {
        temp_points: [],
        temp_points_meta: [],
        distance: 0,
        interval: 0,
      },
    },
    request_ids: {
      type: [mongoose.SchemaTypes.ObjectId],
      ref: "Request",
      required: false,
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
    },
    car: {
      type: {
        plaque: plaqueSchema,
        name_code: Number,
        car_id: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: "Car",
        },
      },
    },
    reviews: {
      type: [reviewSchema],
      default: [],
    },
    timing: {
      type: [timingSchema],
      default: [],
    },
    status: {
      type: Number,
      default: 0,
      enum: [0, 1, 2, 3, 4, 5, 6, 7],
    },
    dispatcher: {
      type: [userDetailsSchema],
      required: true,
    },
    cost_managers: {
      type: [{
        proj_desc: String,
        proj_code: Number,
        cost_center: Number,
        manager_emp_num: Number,
      }]
    },

    is_active: {
      type: Boolean,
      default: true,
    },
    all_arrived: {
      type: Boolean,
      default: false,
    },
    has_cancelled_request: {
      type: Boolean,
      default: false,
    },
    made_by_dispatcher: {
      type: Boolean,
      default: false
    },
    taxi_cost: {
      type: Number,
      default: 0,
    }
  },
  {
    collation: { locale: 'fa', strength: 1 },
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

travelSchema.pre("save", function () {
  let flag = true;
  for (let el of this.passengers) {
    if (el.status !== pssTrpStat.pssgrGtOf) {
      flag = false;
      break;
    }
  }
  this.all_arrived = flag;
});



travelSchema.methods.saveStuffsDueToRequests = function (reqArr) {
  const firstReq = reqArr[0];
  let minTime = firstReq.for_time;
  let maxDis = firstReq.distance;
  for (let req of reqArr) {
    this.request_ids.push(req._id);
    this.locations.push(req.locations);
    this.passengers.push(req.user);
    if (req.mates && req.mates.length > 0)
      for (let mate of req.mates) this.passengers.push(mate);

    if (req.guests && req.guests.length > 0)
      for (let guest of req.guests) this.guests.push(guest);

    if (req.for_time.H < minTime.H) minTime = req.for_time.H;

    if (req.distance > maxDis) maxDis = req.distance;
  }

  this.for_time = minTime;
  this.for_date = firstReq.for_date;
  this.distance = maxDis;
};

travelSchema.plugin(mongoosePaginate);

const Trip = mongoose.model("Trip", travelSchema);

exports.Trip = Trip;

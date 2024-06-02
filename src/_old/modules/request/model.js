const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

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
});
const distanceSchema = new mongoose.Schema({
  distance: {
    type: Number,
    default: 0,
  },
  interval: {
    type: Number,
    default: 0,
  },
});


const requestSchema = new mongoose.Schema(
  {
    locations: {
      type: {
        start: pointSchema,
        finish: pointSchema,
      },
      required: true,
    },
    distance_props: distanceSchema,
    passenger: {
      type: passengerSchema,
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
    past_for_time: {
      type: [{
        from: Number, to: Number, by: {
          full_name: String,
          role: [Number],
          account_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "User",
          },
        }
      }],
      default:[],
      required: true,
    },
    cost_manager: {
      proj_desc: String,
      proj_code: Number,
      cost_center: Number,
      manager_emp_num: Number,
    },
    creator: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
    dispatcher: {
      type: [userDetailsSchema],
      required: true,
    },
    manager: {
      type: [userDetailsSchema],
      required: true,
    },
    area_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Area",
      select: false,
    },
    status: {
      type: Number,
      default: 0,
      enum: [0, 1, 2, 3, 4, 5, 6, 7, 8 , 9],
    },
    step: {
      type: Number,
      default: 0,
    },
    desc: String,
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { 
    collation: { locale: 'fa', strength: 1 }, 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

requestSchema.virtual("travel_id", {
  ref: "Trip",
  foreignField: "request_ids",
  localField: "_id",
});

requestSchema.virtual("is_self_created").get(function () {
  return this?.creator?.equals(this.passenger.account_id);
});

requestSchema.virtual("num_of_passengers").get(function () {
  return this.passenger?.guests?.length + this.passenger?.mates?.length + 1;
});


requestSchema.plugin(mongoosePaginate);
const Request = mongoose.model("Request", requestSchema);

exports.Request = Request;

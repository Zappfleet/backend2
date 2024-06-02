const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const pointType = new mongoose.Schema({
  type: {
    type: String,
    default: "Point",
  },
  coordinates: [Number],
});

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    avatar: String,
    plaque: String,
    alley: String,
    lnglat: {
      type: pointType,
      index: "2dsphere",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    creator: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    collation: { locale: 'fa', strength: 1 },
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
locationSchema.plugin(mongoosePaginate);

const Location = mongoose.model("Location", locationSchema);

module.exports = Location;

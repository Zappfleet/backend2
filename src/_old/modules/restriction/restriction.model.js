const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const keyEnum = [6, 5, 4, 3, 2, 1,7,8,9];
exports.keyEnum = keyEnum;


const restrictionSchema = new mongoose.Schema(
  {
    key: {
      type: Number,
      enum: keyEnum,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);


restrictionSchema.plugin(mongoosePaginate);
const Restriction = mongoose.model("Restriction", restrictionSchema);

exports.Restriction = Restriction;

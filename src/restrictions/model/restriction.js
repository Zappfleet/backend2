// const mongoose = require("mongoose");
// const mongoosePaginate = require("mongoose-paginate-v2");
// const keyEnum = [6, 5, 4, 3, 2, 1];
// exports.keyEnum = keyEnum;


// const restrictionSchema = new mongoose.Schema(
//   {
//     key: {
//       type: Number,
//       enum: keyEnum,
//       required: true,
//     },
//     value: {
//       type: String,
//       required: true
//     }
//   },
//   { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
// );


// restrictionSchema.plugin(mongoosePaginate);
// const Restriction = mongoose.model("Restriction", restrictionSchema,'restrictions');

// exports.Restriction = Restriction;

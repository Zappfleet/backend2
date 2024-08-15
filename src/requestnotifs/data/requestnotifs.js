const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const requestNotifSchema = new mongoose.Schema(
    {
        message: String,
        urlTrue: String,
        urlFalse: String,
        emp_num: String,
        need_approval: Boolean,
        request_id: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Request",
        },
    },
    {
        timeStamp: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

requestNotifSchema.plugin(mongoosePaginate);
const RequestNotif = mongoose.model("RequestNotif", requestNotifSchema);

module.exports = RequestNotif;
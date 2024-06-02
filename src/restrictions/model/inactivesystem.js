const mongoose = require("mongoose");


const systeminactiveSchema = new mongoose.Schema({
    title: String,
    status: String,
    start_date: String,
    end_date: String,
    inactive_permissions: [String]
});



const Systeminactive = mongoose.model("Systeminactive", systeminactiveSchema,'systeminactive');

exports.Systeminactive = Systeminactive;

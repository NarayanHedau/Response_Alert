const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

let Alarm = new Schema(
  {
    dateAndTime: { type: Date },
    // productId: { type: mongoose.Types.ObjectId, ref: "Product" },
    alarmType: { type: String },
    customerName:{type: String},
    callCenterNo: { type: String },
    location: { type: String },
    creator: { type: mongoose.Types.ObjectId, ref: "user" },
    deviceDetails: {
      deviceName: { type: String },
      images:{type:Array},
      description: {type:String},
      deviceSpecification: {
        imei_no: { type: String },
        carrierName: { type: String },
        dimension: { type: String },
        weight: { type: String },
        rf_transmission_freq: { type: String },
        batteryLife: { type: String },
        batteryVoltage: { type: String },
      },
    },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Alarm", Alarm);

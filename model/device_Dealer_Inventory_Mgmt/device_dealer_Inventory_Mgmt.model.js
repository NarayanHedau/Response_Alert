const mongoose = require("mongoose"),
  schema = mongoose.Schema;
let Device_Dealer_Inventory_Mgmt = new schema(
  {
    // dealerId: { type: mongoose.Types.ObjectId, ref: "User" },
    // files: { type: Array },
    // deviceName: { type: String },
    // price: { type: String },
    // quantity: { type: Number },
    // deviceDetails: { type: String },
    // deviceSpecification: {
    //   carrierName: { type: String },
    //   dimension: { type: String },
    //   weight: { type: String },
    //   rf_transmission_freq: { type: String },
    //   //   brand: { type: String },
    //   batteryLife: { type: String },
    //   batterVolatage: { type: String },
    //   viewMore: { type: String },
    // },
    // additionalInfo: { type: Array },
    // status: { type: String, default: "active" },
    // // enable: { type: Boolean, default: true },
    // // minQty: { type: Number },
    // activate: { type: Boolean, default: true },

    dealerId:{type:mongoose.Types.ObjectId, ref:"User"},
    // files:{type:Array},
    deviceId:{type:mongoose.Types.ObjectId, ref:"Product"},
    quantity:{type:Number},
    price:{type:Number},
    status: { type: String, default: "active" },
    activate: { type: Boolean, default: true }
  },
  { timestamps: true }
);
module.exports = mongoose.model(
  "Device_Dealer_Inventory_Mgmt",
  Device_Dealer_Inventory_Mgmt
);

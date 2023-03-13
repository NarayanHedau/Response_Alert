const mongoose = require("mongoose"),
  schema = mongoose.Schema;
let Accessories = new schema(
  {
    files:{type:Array},
    productId: { type: mongoose.Types.ObjectId, ref: "Product" },
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    deviceName: { type: String },
    price: { type: String },
    selectQuantity: {
      type: Number,
    },
    diviceList: {
      type: Array,
    },
    deviceDetails: {
      type: String,
    },
    deviceSpecification: {
      carrierName: { type: String },
      dimension: { type: String },
      weight: {
        type: String,
      },
      rf_transmission_freq: { type: String },

      manufacturerName: {
        type: String,
      },
      brand: {
        type: String,
      },
      batteryLife: {
        type: String,
      },
      batteryVoltage: {
        type: String,
      },
    },
    additionalInfo: {
      type: Array,
    },
    activate: { type: Boolean, default: true },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Accessories", Accessories);
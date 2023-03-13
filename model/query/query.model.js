const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const Query = new Schema(
  {
    dealerId: { type: mongoose.Types.ObjectId, ref: "User" },
    customerId: { type: mongoose.Types.ObjectId, ref: "Customer" },
    customerName: { type: String },
    //  dealerName:{type:String},
    messageSender: { type: String },
    messageSeen: { type: Array },
    //  messageType: {type : String, enum: ["pdf", "text", "video", "image"]},
    //  receiver:{type:String},
    data: { type: String },
    files: { type: Array },
    tosendEmail:{type:String},
    // read:{type: Array},
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Query", Query);

const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const UserSession = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    userAgent: { type: String, required: true },
    userToken: { type: String },
    location: { type: String },
    userSystemIp: { type: String },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("UserSession", UserSession);

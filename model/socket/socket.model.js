const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const Socket = new Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: "User" },
    socketId: { type: String },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Socket", Socket);

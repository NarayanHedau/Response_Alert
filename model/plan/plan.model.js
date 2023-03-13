const mongoose = require("mongoose");

const Plan = new mongoose.Schema(
  {
    dealerId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    planId: String,
    adminPlanId: String,
    status: {
      type: String,
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", Plan);

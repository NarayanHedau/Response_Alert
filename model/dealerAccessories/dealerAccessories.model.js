const mongoose = require("mongoose"),
  schema = mongoose.Schema;
let DealerAccessories = new schema(
  {
   
    dealerId:{type:mongoose.Types.ObjectId, ref:"User"},
    accessoriesId:{type:mongoose.Types.ObjectId, ref:"Accessories"},
    quantity:{type:Number},
    price:{type:Number},
    status: { type: String, default: "active" },
    activate: { type: Boolean, default: true }
  },
  { timestamps: true }
);
module.exports = mongoose.model(
  "DealerAccessories",
  DealerAccessories
);

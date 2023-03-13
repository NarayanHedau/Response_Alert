const mongoose = require("mongoose"),
  schema = mongoose.Schema;

let Invoice = new schema(
  {
    invoice_No: { type: String },
    from_address: { type: Object },
    to_address: { type: Object },
    itemArray: [
      {
        item_name: { type: String },
        quantity: { type: Number },
        unit_price: { type: Number },
        amount: { type: Number },
      },
    ],
    customerName: {type:String},
    dealerName: { type: String },
    sendTo : { type: String },
    shipment: { type: Number },
    total_amount: { type: Number },
    buyerId:{ type: mongoose.Types.ObjectId },
    sellerId:{ type: mongoose.Types.ObjectId, ref: "User" },
    customerId: { type: mongoose.Types.ObjectId, ref: "Customer" },
    dealerId: { type: mongoose.Types.ObjectId, ref: "User" },
    adminId: { type: mongoose.Types.ObjectId, ref: "User" },
    paymentMethod: { type: String },
    status: {
      type: String,
      default: "active",
    },
    documentUrl :{type:String},
    visible:{type:Boolean, default:false},
    orderId:{ type: mongoose.Types.ObjectId, ref: "Order" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Invoice", Invoice);

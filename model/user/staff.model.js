const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const Staff = new Schema(
  {
    image: { type: String },
    designation: { type: String, enum: ["ADMIN_STAFF", "DEALER_STAFF"] },
    staffName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    activate: { type: Boolean, default: true },
    permission: {
      userManagement: {
        value: { type: Boolean },
        view: { type: Boolean },
        edit: { type: Boolean },
        delete: { type: Boolean },
      },
      devicesManagment: {
        value: { type: Boolean },
        view: { type: Boolean },
        edit: { type: Boolean },
        delete: { type: Boolean },
      },
      dashboard: {
        value: { type: Boolean },
        view: { type: Boolean },
      },
      devicesAndCustomers: {
        value: { type: Boolean },
        view: { type: Boolean },
        edit: { type: Boolean },
        delete: { type: Boolean },
      },
      alarmReports: {
        value: { type: Boolean },
        view: { type: Boolean },
      },
      rolesAndPermissions: {
        value: { type: Boolean },
        view: { type: Boolean },
        edit: { type: Boolean },
        delete: { type: Boolean },
      },
      staffManagement: {
        value: { type: Boolean },
        view: { type: Boolean },
        edit: { type: Boolean },
        delete: { type: Boolean },
      },
      inventoryManagement: {
        value: { type: Boolean },
        view: { type: Boolean },
        edit: { type: Boolean },
        delete: { type: Boolean },
      },
      // products help accountSetting
      orders: {
        value: { type: Boolean },
        view: { type: Boolean },
        edit: { type: Boolean },
      },
      paymentAndInvoices: {
        value: { type: Boolean },
        view: { type: Boolean },
      },
      subscriptionPlans: {
        value: { type: Boolean },
        view: { type: Boolean },
        edit: { type: Boolean },
      },
      help: {
        value: { type: Boolean },
        view: { type: Boolean },
      },
      accountSetting: {
        value: { type: Boolean },
        view: { type: Boolean },
        edit: { type: Boolean },
      },
      products: {
        value: { type: Boolean },
        view: { type: Boolean },
        edit: { type: Boolean },
        delete: { type: Boolean },
      },
    },
    role: {
      type: mongoose.Types.ObjectId,
      ref: "RolesAndPermission",
    },
    creator: { type: mongoose.Types.ObjectId, ref: "User" },
    isEmailVerified: {
      type: String,
      enum: ["NOT", "VERIFIED"],
      default: "VERIFIED",
    },
    mailToken: { type: String },
    password: { type: String },
    paymentDetails: {
      addDebitCreditCard: [
        {
          cardHolderName: { type: String, default: "" },
          cardNumber: { type: Number, default: "" },
          expiryDate: { type: String, default: "" },
        },
      ],
      addBankDetails: {
        selectBank: { type: String, default: "" },
        accountNumber: { type: Number, default: "" },
        accountHolderName: { type: String, default: "" },
        ibanNumber: { type: String, default: "" },
      },
    },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Staff", Staff);

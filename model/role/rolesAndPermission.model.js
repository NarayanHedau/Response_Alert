const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const RolesAndPermission = new Schema(
  {
    roleName: { type: String },
    creator: { type: mongoose.Types.ObjectId, ref: "User" },
    dashboard: {
      value: { type: Boolean },
      view: { type: Boolean },
      edit: { type: Boolean },
    },
    devicesAndCustomers: {
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
    userManagement: {
      value: { type: Boolean },
      view: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    alarmReports: {
      value: { type: Boolean },
      view: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
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
    Products: {
      value: { type: Boolean },
      view: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    orders: {
      value: { type: Boolean },
      view: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
    },
    paymentAndInvoices: {
      value: { type: Boolean },
      view: { type: Boolean },
    },
    subscriptionPlans: {
      value: { type: Boolean },
      view: { type: Boolean },
      edit: { type: Boolean },
      delete: { type: Boolean },
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
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);
module.exports = mongoose.model("RolesAndPermission", RolesAndPermission);

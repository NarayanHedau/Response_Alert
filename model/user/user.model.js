const mongoose = require("mongoose"),
  Schema = mongoose.Schema;

const User = new Schema(
  {
    designation: {
      type: String,
      enum: ["ADMIN", "DEALER", "CUSTOMER", "STAFF"],
    },
    FCMToken: { type: String },

    email: { type: String, lowerCase: true },
    mobileNumber: { type: String },
    address: { type: String },
    profileImg: { type: String, default: "" },
    password: { type: String },
    username: { type: String },
    deliveryCharges:{type:String},
    orgDetails: {
      companyName: { type: String },
      companyEmail: { type: String },
      companyPhone: { type: String },
      companyAddress: { type: String },
    },
    deliveryCharges:{type: Number},
    mailToken: { type: String, default: "" },
    status: { type: String, default: "active" },
    // encryptedEmail: { type: String },
    loginType: {
      type: String,
      enum: ["GOOGLE", "FACEBOOK", "PASSWORD", "OTP"],
      default: "PASSWORD",
      required: true,
    },
    isMobileVerified: {
      type: String,
      enum: ["NOT", "VERIFIED"],
      default: "NOT",
    },
    isEmailVerified: {
      type: String,
      enum: ["NOT", "VERIFIED"],
      default: "NOT",
    },
    paymentDetails: {
      addDebitCreditCard: [
        {
          cardHolderName: { type: String, default: "" },
          cardNumber: { type: Number, default: null },
          expiryDate: { type: String, default: "" },
        },
      ],
      addBankDetails: {
        selectBank: { type: String, default: "" },
        accountNumber: { type: Number, default: null },
        accountHolderName: { type: String, default: "" },
        ibanNumber: { type: String, default: "" },
      },
    },
    filter: {
      minQty: { type: Number, default: 0 },
      enable: { type: Boolean, default: true },
    },
    shippingAddress: [
      {
        name: { type: String, default: "" },
        phoneNo: { type: String, default: "" },
        address: { type: String, default: "" },
        country: { type: String, default: "" },
        state: { type: String, default: "" },
        city: { type: String, default: "" },
        zipPostalCode: { type: String, default: "" },
        defaultAddress:{type:Boolean, default:false}
      },
    ],
    billingAddress: [
      {
        name: { type: String, default: "" },
        phoneNo: { type: String, default: "" },
        address: { type: String, default: "" },
        country: { type: String, default: "" },
        state: { type: String, default: "" },
        city: { type: String, default: "" },
        zipPostalCode: { type: String, default: "" },
        defaultAddress:{type:Boolean, default:false}

      },
    ],
    // help:{type:String},
    // accountSetting:{type:String},
    // shippingAddress: { type: Array },
    // billingAddress: { type: Array },
    // otp: { type: String },
    activate: { type: Boolean, default: true },
    // dob: { type: String },
    // location: {
    //   address: { type: String },
    //   landmark: { type: String },
    //   state: { type: String },
    //   city: { type: String },
    //   pincode: { type: Number },
    //   country: { type: String },
    //   lat: { type: String },
    //   lng: { type: String },
    // },
    // customerId: {
    //   type: String,
    // },
    // firstName: { type: String },
    // lastName: { type: String },
    // gender: { type: String, enum: ["MALE", "FEMALE"] },
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", User);

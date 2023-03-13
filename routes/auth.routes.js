let router = require("express").Router();
let log = require("../helper/logger");
let response = require("../helper/response");
let otpHelper = require("../helper/otp");
let encryptToken = require("../helper/token");
let sms = require("../helper/sms");
let mail = require("./sendmail/notify");
let authController = require("../controller/auth");
const commonController = require("../controller/commonController");
const ERRORS = require("../helper/errorMessage");
const _ = require("lodash");
const mongoose = require("mongoose");
const user = mongoose.model("User");
const UserSession = mongoose.model("UserSession");
const Device_Dealer_Inventory_Mgmt = mongoose.model(
  "Device_Dealer_Inventory_Mgmt"
);
const DealerAccessories = mongoose.model("DealerAccessories");

const CardDetail = mongoose.model("CardDetail");
const BankDetail = mongoose.model("BankDetail");
const Order = mongoose.model("Order");
const Customer = mongoose.model("Customer");
const Staff = mongoose.model("Staff");
var config = require("../config.json");
const auth = require("../helper/auth");
const crypto = require("crypto");
var md5 = require("md5");

var bcrypt = require("bcrypt");
const { SIGHUP } = require("constants");
const saltRounds = 10;

router.post("/register", async (req, res) => {
  log.debug("/register");
  try {
    const { email, phone, designation, username, FCMToken } = req.body;
    if (designation !== "Admin") {
      let userData = await user.findOne({ email: email });
      if (userData && userData.email == email) {
        response.errorMsgResponse(
          res,
          500,
          "Email has already been registered. Please login to continue."
        );
      } else {
        let obj = req.body;
        let otp = otpHelper.generateOTP();
        const Email = email.toLowerCase().trim();
        const mailToken = crypto.randomBytes(64).toString("hex");
        let encryptedEmail = md5(req.body.email);
        const data = Object.assign(obj, {
          mailToken: mailToken,
          email: Email,
          encryptedEmail: encryptedEmail,
          otp: otp,
        });
        let subject = `Response Alert Team - Verify your mail`;
        // let body = `please insert this OTP to verify your mail ${otp}`;
        let body = `<h2> hii ${username}! Thanks for registering with us </h2>
                    <h4> please verify mail by clickng on the link given below...</h4>
                    <a href="http://${req.headers.host}/api/v1/authentication/verify/email?token=${mailToken}"> Verify your mail</a>`;
        let mailData = mail.sendMail(email, subject, body);
        console.log("=====>>>>>", mailData);
        let registerData = await authController.register(data);

        if (req.body.card) {
          let cardObj = {
            userId: registerData._id,
            cardHolderName: req.body.card.cardHolderName,
            cardNumber: req.body.card.cardNumber,
            expiryDate: req.body.card.expiryDate,
          };
          let cardData = await CardDetail(cardObj).save();
        }

        if (req.body.bank) {
          let bankObj = {
            userId: registerData._id,
            bankName: req.body.bank.bankName,
            accountNumber: req.body.bank.accountNumber,
            accountHolderName: req.body.bank.accountHolderName,
            ibanNumber: req.body.bank.ibanNumber,
          };
          let bankData = await BankDetail(bankObj).save();
        }

        let responseObj = {
          _id: registerData._id,
          designation: registerData.designation,
          email: registerData.email,
          mobileNumber: registerData.mobileNumber,
          address: registerData.address,
          profileImg: registerData.profileImg,
          orgDetails: {
            companyName: registerData.orgDetails.companyName,
            companyEmail: registerData.orgDetails.companyEmail,
            companyPhone: registerData.orgDetails.companyPhone,
            companyAddress: registerData.orgDetails.companyAddress,
          },
        };
        response.successResponse(
          res,
          200,
          "User Successfully registered.",
          responseObj
        );
      }
    } else {
      response.errorMsgResponse(res, 301, "Admin cannot be registered here.");
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, error);
  }
});

router.post("/adminRegister", async (req, res) => {
  log.debug("/adminRegister");
  try {
    const { email, phone, designation, username, FCMToken } = req.body;
    if (designation == "ADMIN") {
      let userData = await user.findOne({ email: email });
      if (userData && userData.email == email) {
        response.errorMsgResponse(
          res,
          500,
          "Email has already been registered. Please login to continue."
        );
      } else {
        let obj = req.body;
        let otp = otpHelper.generateOTP();
        const Email = email.toLowerCase().trim();
        let encryptedEmail = md5(req.body.email);
        const data = Object.assign(obj, {
          email: Email,
          encryptedEmail: encryptedEmail,
          otp: otp,
        });

        let subject = `Verify your mail`;
        // let internal = `You requested for OTP. Your OTP is ${otp}.`;
        let body = `please insert this OTP to verify your mail ${otp}`;
        // MESSAGE.EMAIL_TEMPLATE.replace("__USERNAME__", "").replace(
        //   "__BODY__",
        //   internal
        // );
        let mailData = mail.sendMail(email, subject, body);
        console.log("=====>>>>>", mailData);
        let registerData = await authController.register(data);
        if (req.body.paymentObj) {
          let paymentObj = {
            userId: registerData._id,
            cardHolderName: req.body.paymentObj.cardHolderName,
            cardNumber: req.body.paymentObj.cardNumber,
            expiryDate: req.body.paymentObj.expiryDate,
            cvv: req.body.paymentObj.cvv,
          };
          let PaymentData = await PaymentDetail(paymentObj).save();
        }
        let responseObj = {
          _id: registerData._id,
          designation: registerData.designation,
          email: registerData.email,
          mobileNumber: registerData.mobileNumber,
          address: registerData.address,
          profileImg: registerData.profileImg,
          orgDetails: {
            companyName: registerData.orgDetails.companyName,
            companyEmail: registerData.orgDetails.companyEmail,
            companyPhone: registerData.orgDetails.companyPhone,
            companyAddress: registerData.orgDetails.companyAddress,
          },
          // if(registerData.)
        };
        response.successResponse(
          res,
          200,
          "Admin Successfully registered.",
          responseObj
        );
      }
    } else {
      response.errorMsgResponse(res, 301, "Only Admin can register here.");
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, error);
  }
});

router.post("/login", (req, res) => {
  authController
    .login(req.body)
    .then((resData) => {
      var userValidData = _.pick(resData, [
        "_id",
        "username",
        "email",
        "designation",
      ]);
      encryptToken
        .encrypt(req, userValidData)
        .then((resToken) => {
          userValidData["token"] = resToken.token;
          resData["accessToken"] = userValidData.token;
          response.successResponse(res, 200, "Login successful", resData);
        })
        .catch((error) => {
          log.error("error", error);
          response.errorMsgResponse(res, 301, "Something went wrong");
        });
    })
    .catch((error) => {
      log.error("error", error);
      if (error == "PENDING") {
        res.status(500).json({
          status: "PENDING",
          code: 500,
          message: "Please verify your email first",
        });
        // response.errorMsgResponse(res, 500, error);
      } else {
        response.errorMsgResponse(res, 500, error);
      }
    });
});

router.post("/logout", auth, (req, res) => {
  log.debug("/logout");
  commonController
    .deleteWithObject(UserSession, {
      userId: req.userId,
      status: {
        $ne: "deleted",
      },
    })
    .then((resData) => {
      response.successResponse(res, 200, "Logout Successfully");
    })
    .catch((error) => {
      log.error(error);
      response.somethingErrorMsgResponse(
        res,
        301,
        MESSAGE.SOMETHING_WENT_WRONG
      );
    });
});

router.get("/get/profile", auth, async (req, res) => {
  try {
    log.debug("/get/profile");
    let responseObj = {};
    let dealerCardDetail = [];
    let customerCardDetail = [];

    let userData = await user.findOne({
      _id: req.userId,
      status: { $eq: "active" },
    });

    let customerData = await Customer.findOne({
      _id: req.userId,
      status: { $eq: "active" },
    }).populate({
      path: "dealerId",
      select:
        "orgDetails profileImg _id designation username email mobileNumber address ",
    });

    if (customerData) {
      customerCardDetail = await CardDetail.find({ userId: customerData._id });
    }

    let staffData = await Staff.findOne({
      _id: req.userId,
      status: { $eq: "active" },
    });

    if (userData) {
      responseObj = {
        _id: userData._id,
        designation: userData.designation,
        email: userData.email,
        mobileNumber: userData.mobileNumber,
        address: userData.address,
        profileImg: userData.profileImg,
        username: userData.username,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        orgDetails: userData.orgDetails,
        paymentDetails: userData.paymentDetails,
        shippingAddress: userData.shippingAddress,
        billingAddress: userData.billingAddress,
        deliveryCharges: userData.deliveryCharges,
      };

      if (userData.designation === "DEALER") {
        dealerCardDetail = await CardDetail.find({ userId: userData._id });
        responseObj = { ...responseObj, cardDetails: dealerCardDetail };
      }
    }

    if (customerData) {
      responseObj = {
        _id: customerData._id,
        designation: customerData.designation,
        email: customerData.email,
        phoneNo: customerData.phoneNo,
        shippingAddress: customerData.shippingAddress,
        address: customerData.address,
        image: customerData.image,
        address: customerData.address,
        createdAt: customerData.createdAt,
        updatedAt: customerData.updatedAt,
        customerName: customerData.customerName,
        callCenterNo: customerData.callCenterNo,
        emergencyContactDetails: customerData.emergencyContactDetails,
        medicalHistory: customerData.medicalHistory,
        dealerId: customerData.dealerId,
        cardDetails: customerCardDetail,
        paymentDetails: customerData.paymentDetails,
      };
    }
    if (staffData) {
      responseObj = {
        _id: staffData._id,
        designation: staffData.designation,
        email: staffData.email,
        mobileNumber: staffData.mobileNumber,
        address: staffData.address,
        profileImg: staffData.profileImg,
        username: staffData.username,
        createdAt: staffData.createdAt,
        updatedAt: staffData.updatedAt,
        orgDetails: staffData.orgDetails,
      };
    }
    response.successResponse(
      res,
      200,
      "profile data successfully fetched",
      responseObj
    );
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

router.put("/update/profile", auth, (req, res) => {
  commonController
    .updateBy(user, req.userId, req.body)
    .then((resData) => {
      commonController
        .getOne(user, {
          _id: req.userId,
        })
        .then((data) => {
          response.successResponse(res, 200, data);
        })
        .catch((error) => {
          response.errorMsgResponse(res, 301, "Something went wrong");
        });
    })
    .catch((error) => {
      response.errorMsgResponse(res, 301, "Something went wrong");
    });
});

router.post("/send/mail/forget/password/:email", async (req, res) => {
  try {
    log.debug("/send/mail/forget/password");
    // const { email } = req.params.email;
    const mailToken = crypto.randomBytes(64).toString("hex");
    let userData = await user.findOneAndUpdate(
      { email: req.params.email },
      { mailToken: mailToken },
      { $new: true }
    );
    let customerData = await Customer.findOneAndUpdate(
      { email: req.params.email },
      { mailToken: mailToken },
      { $new: true }
    );
    let staffData = await Staff.findOneAndUpdate(
      { email: req.params.email },
      { mailToken: mailToken },
      { $new: true }
    );
    let subject = `Response Alert Team - Verify your mail`;
    if (customerData && customerData.designation == "CUSTOMER") {
      let body = `<h2> hii ${customerData.username}!</h2>
      <h4> This is your password reset link...</h4>
      <a href="${config.customerUrl}/auth/reset-password/${mailToken}"> Reset your password</a>`;
      mail.sendMail(customerData.email, subject, body);
      response.successResponse(res, 200, `link has been sent to you mail.`, {});
    } else if (userData && userData.designation == "DEALER") {
      let body = `<h2> hii ${userData.username}!</h2>
      <h4> This is your password reset link...</h4>
      <a href="${config.dealerUrl}/auth/reset-password/${mailToken}"> Reset your password</a>`;
      mail.sendMail(userData.email, subject, body);
      response.successResponse(res, 200, `link has been sent to you mail.`, {});
    } else if (userData && userData.designation == "ADMIN") {
      let body = `<h2> hii ${userData.username}!</h2>
      <h4> This is your password reset link...</h4>
      <a href="${config.adminUrl}/auth/reset-password/${mailToken}"> Reset your password</a>`;
      mail.sendMail(userData.email, subject, body);
      response.successResponse(res, 200, `link has been sent to you mail.`, {});
    } else if (staffData && staffData.designation == "ADMIN_STAFF") {
      let body = `<h2> hii ${staffData.username}!</h2>
      <h4> This is your password reset link...</h4>
      <a href="${config.adminUrl}/auth/reset-password/${mailToken}"> Reset your password</a>`;
      mail.sendMail(staffData.email, subject, body);
      response.successResponse(res, 200, `link has been sent to you mail.`, {});
    } else if (staffData && staffData.designation == "DEALER_STAFF") {
      console.log("==============>");
      let body = `<h2> hii ${staffData.username}!</h2>
      <h4> This is your password reset link...</h4>
      <a href="${config.dealerUrl}/auth/reset-password/${mailToken}"> Reset your password</a>`;
      mail.sendMail(staffData.email, subject, body);
      response.successResponse(res, 200, `link has been sent to you mail.`, {});
    } else response.errorMsgResponse(res, 400, "Incorrect email");

    // if (staffData.designation == "ADMIN") {
    //   let body = `<h2> hii ${userData.username}!</h2>
    //   <h4> This is your password reset link...</h4>
    //   <a href="${config.adminUrl}/auth/reset-password/${mailToken}"> Reset your password</a>`;
    //   mail.sendMail(userData.email, subject, body);
    //   response.successResponse(res, 200, `link has been sent to you mail.`, {});
    // }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 500, "Something went wrong");
  }
});

router.post("/reset/password", async (req, res) => {
  try {
    log.debug("/reset/password");
    let encryptedEmail = req.body.mailToken;
    let userData = await user.findOne({
      mailToken: encryptedEmail,
    });
    let customerData = await Customer.findOne({
      mailToken: encryptedEmail,
    });
    let staffData = await Staff.findOne({
      mailToken: encryptedEmail,
    });
    // console.log("=====>>>>>", customerData);
    if (userData) {
      bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(req.body.password, salt, async function (err, hash) {
          let updatedData = await commonController.updateWithObject(
            user,
            { mailToken: encryptedEmail },
            { password: hash, otp: null, encryptedEmail: null, mailToken: null }
          );
          if (updatedData) {
            response.successResponse(
              res,
              200,
              "password updated successfully. Please login to continue",
              {}
            );
          }
        });
      });
    } else if (customerData) {
      bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(req.body.password, salt, async function (err, hash) {
          let updatedData = await commonController.updateWithObject(
            Customer,
            { mailToken: encryptedEmail },
            { password: hash, mailToken: null }
          );
          if (updatedData) {
            response.successResponse(
              res,
              200,
              "password updated successfully. Please login to continue",
              {}
            );
          }
        });
      });
    } else if (staffData) {
      bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(req.body.password, salt, async function (err, hash) {
          let updatedData = await commonController.updateWithObject(
            Staff,
            { mailToken: encryptedEmail },
            { password: hash, mailToken: null }
          );
          if (updatedData) {
            response.successResponse(
              res,
              200,
              "password updated successfully. Please login to continue",
              {}
            );
          }
        });
      });
    } else {
      response.errorMsgResponse(res, 301, "Please enter correct mail");
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

router.get("/verify/email", async (req, res) => {
  try {
    log.debug("/verify/email");
    const emailToken = req.query.token;
    let userData = await user.findOneAndUpdate(
      { mailToken: emailToken },
      { isEmailVerified: "VERIFIED", mailToken: null },
      { $new: true }
    );

    let customerData = await Customer.findOneAndUpdate(
      { mailToken: emailToken },
      { isEmailVerified: "VERIFIED", mailToken: null },
      { $new: true }
    );

    let staffData = await Staff.findOneAndUpdate(
      { mailToken: emailToken },
      { isEmailVerified: "VERIFIED", mailToken: null },
      { $new: true }
    );

    if (customerData && customerData.designation == "CUSTOMER") {
      res.redirect(config.customerUrl + "/auth/login");
    }

    if (userData && userData.designation == "DEALER") {
      res.redirect(config.dealerUrl + "/auth/login");
    }

    if (staffData) {
      if (staffData.designation == "ADMIN_STAFF") {
        res.redirect(config.adminUrl + "/auth/login");
      } else if (staffData.designation == "DEALER_STAFF") {
        res.redirect(config.dealerUrl + "/auth/login");
      }
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 500, "Something went wrong");
  }
});

router.post("/change/password", auth, async (req, res) => {
  try {
    log.info("/change/password");
    const { email, oldPass, newPass } = req.body;
    let schema;
    let oldPassword;
    let userData = await user.findOne({
      email: email,
      status: { $eq: "active" },
    });
    let customerData = await Customer.findOne({
      email: email,
      status: { $eq: "active" },
    });
    let staffData = await Staff.findOne({
      email: email,
      status: { $eq: "active" },
    });

    if (userData) {
      schema = user;
      oldPassword = userData.password;
    } else if (customerData) {
      schema = Customer;
      oldPassword = customerData.password;
    } else if (staffData) {
      schema = Staff;
      oldPassword = staffData.password;
    }
    // if (userData) {
    bcrypt.genSalt(saltRounds, function (err, salt) {
      bcrypt.hash(oldPass, salt, function (err, hash) {
        bcrypt.compare(oldPass, oldPassword, async function (err, result) {
          if (result) {
            bcrypt.hash(newPass, salt, async function (err, resultData) {
              let updatedData = await schema.findOneAndUpdate(
                { email: email },
                { password: resultData },
                { $new: true }
              );
              if (updatedData) {
                response.successResponse(
                  res,
                  200,
                  "Password updated successfully"
                );
              } else {
                response.errorResponse(res, 400, "Unable to update password");
              }
            });
          } else {
            response.errorMsgResponse(res, 400, "Incorrect current password");
          }
        });
      });
    });
    // }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/getAll/dealers", auth, async (req, res) => {
  try {
    let limit = req.query.limit ? req.query.limit : 10;
    log.debug("/get/profile");
    let result = await user
      .find({
        status: { $eq: "active" },
        designation: { $eq: "DEALER" },
      })
      .select(
        "-mailToken -isMobileVerified -isEmailVerified -password -encryptedEmail -otp"
      )
      .skip((req.query.page - 1) * limit)
      .limit(limit * 1)
      .sort({ _id: -1 });
    response.successResponse(res, 200, "Dealers fetched successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

router.get("/get/dealer/:id", auth, async (req, res) => {
  try {
    log.debug("/get/profile");
    let condition = { status: { $eq: "active" }, dealerId: req.params.id };
    let totalDeviceCount = await Device_Dealer_Inventory_Mgmt.countDocuments(
      condition
    );
    let totalAccessoriesCount = await DealerAccessories.countDocuments(
      condition
    );

    let dealerResult = await user
      .findOne({
        status: { $eq: "active" },
        _id: req.params.id,
      })
      .select(
        "-mailToken -isMobileVerified -isEmailVerified -password -encryptedEmail -otp"
      );
    let customerCount = await Customer.find(condition).countDocuments();

    let staffCount = await Staff.find({
      creator: req.params.id,
      status: { $eq: "active" },
    }).countDocuments();

    let sum = 0;
    let orderData = await Order.find({
      status: { $eq: "active" },
      buyerId: req.params.id,
      //   markDelivered: true,
      //   trackStatus: { $eq: "Delivered" },
    });

    let orderCount = orderData.length;
    let totalEarn = orderData.map((e) => e.paymentDetails.totalPrice);
    for (let i = 0; i < totalEarn.length; i += 1) {
      sum += totalEarn[i];
    }
    if (!dealerResult) {
      response.errorMsgResponse(res, 400, "Dealer not found.");
    } else {
      let responseObj = {
        dealerResult,
        customerCount,
        staffCount,
        orders: orderCount,
        amountEarned: sum,
        totalInventoryCount: totalDeviceCount + totalAccessoriesCount,
        activatedInventoryCount: 0,
        suspendedInventoryCount: 0,
        notAllocatedCount: 0,
      };

      response.successResponse(
        res,
        200,
        "Dealer fetched successfully.",
        responseObj
      );
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

router.delete("/delete/dealer", auth, async (req, res) => {
  try {
    log.debug("/delete/dealer");
    let ids = req.query.id;
    if (Array.isArray(ids)) {
      await user.updateMany(
        { _id: { $in: ids }, status: { $eq: "active" } },
        { $set: { status: "deleted" } },
        { multi: true }
      );
    } else {
      let data = await user.findByIdAndUpdate(
        { status: { $eq: "active" }, _id: ids },
        { $set: { status: "deleted" } },
        { $new: true }
      );
      if (data) {
        response.successResponse(res, 200, "Dealer deleted successfully", {});
      } else {
        response.errorMsgResponse(res, 400, "Unable to delete dealer");
      }
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// In Admin Dashboard side
router.put("/deleteMany/dealer", auth, async (req, res) => {
  try {
    log.debug("/delete/dealer");
    let ids = req.body.id;
    const data = await user.updateMany(
      { _id: { $in: ids }, status: { $eq: "active" } },
      { $set: { status: "deleted" } },
      { multi: true }
    );
    response.successResponse(res, 200, "Dealers deleted successfully");
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});
// In Admin Dashboard side
router.get("/searchDealer", auth, async (req, res) => {
  try {
    let { page, limit } = req.query;
    const skip = (page - 1) * limit;
    const condition1 = {
      $and: [{ status: { $eq: "active" } }, { designation: { $eq: "DEALER" } }],
    };
    const condition2 = {
      status: { $eq: "active" },
      $and: [
        { designation: { $eq: "DEALER" } },
        {
          $or: [
            {
              username: { $regex: "^" + req.query.key + "", $options: "i" },
            },
            {
              mobileNumber: { $regex: "^" + req.query.key + "", $options: "i" },
            },
          ],
        },
      ],
    };
    if (!req.query.key) {
      const resultData = await user
        .find(condition1)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
      const resultCount = await user.countDocuments(condition1);

      let respData = {
        metadata: {
          count: resultCount,
        },
        resultData,
      };
      response.successResponse(res, 200, "", respData);
    } else {
      let resultData = await user
        .find(condition2)
        .limit(limit * 1)
        .skip(skip);
      const resultCount = await user.countDocuments(condition2);
      let respData = {
        metadata: {
          count: resultCount,
        },
        resultData,
      };
      response.successResponse(res, 200, "", respData);
    }
  } catch (error) {
    response.errorMsgResponse(res, 301, ERRORS.UNABLE_TO_FIND_RECORD);
  }
});

// in Dealer Dashboard Side
// router.get("/getAll/customer/dealer/:id", auth, async (req, res) => {
//   try {
//     let { page, limit } = req.query;
//     const skip = (page - 1) * limit;
//     limit = limit * 1;

//     let condition = {
//       $and: [
//         { dealerId: req.params.id },
//         { status: { $eq: "active" } },
//         {
//           $or: [
//             {
//               customerName: { $regex: "^" + req.query.key + "", $options: "i" },
//             },
//             { phoneNo: { $regex: "^" + req.query.key + "", $options: "i" } },
//           ],
//         },
//       ],
//     };

//     const result = await Customer.find(condition)
//       .limit(limit)
//       .skip(skip)
//       .select("-mailToken  -isEmailVerified -password")
//       .sort({ _id: -1 });

//     let resultCount = await Customer.countDocuments(condition);
//     // .limit(limit)
//     // .skip(skip);
//     let respData = {
//       metadata: {
//         count: resultCount,
//       },
//       result,
//     };
//     if (result.length != 0) {
//       response.successResponse(
//         res,
//         200,
//         "customers fetched successfully",
//         respData
//       );
//     } else {
//       response.errorMsgResponse(res, 404, "Not Found");
//     }
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 301, "Something went wrong");
//   }
// });

// in Dealer Dashboard Side
router.get("/getAll/staff/by/dealer/:id", auth, async (req, res) => {
  try {
    log.debug("/getAll/staff/by/dealer/:id");
    let { page, limit } = req.query;
    const skip = (page - 1) * limit;

    let condition = {
      $and: [
        { creator: req.params.id },
        { status: { $eq: "active" } },
        {
          $or: [
            { staffName: { $regex: "^" + req.query.key + "", $options: "i" } },
            { phone: { $regex: "^" + req.query.key + "", $options: "i" } },
          ],
        },
      ],
    };

    let result = await Staff.find(condition)
      .populate("role")
      .limit(limit * 1)
      .skip(skip)
      .sort({ _id: -1 });
    let totalCount = await Staff.countDocuments(condition);
    // .limit(limit)
    // .skip(skip);
    let respData = {
      metadata: {
        count: totalCount,
      },
      result,
    };
    response.successResponse(res, 200, " Staff fetched successfully", respData);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

router.get("/get/single/customer/:id", auth, async (req, res) => {
  try {
    log.debug("get/single/customer/:id");
    let result = await Customer.findOne({
      $and: [{ status: { $eq: "active" } }, { _id: req.params.id }],
    })
      .select("-mailToken -password -createdAt -updatedAt -__v")
      .populate("assignDevice.device");
    response.successResponse(res, 200, "Data Fetched Successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// activated and deactivate staff by admin Dashboard
router.post("/admin/deactivete/staff/:id", auth, async (req, res) => {
  try {
    log.debug("admin/deactivete/staff/:id");
    let id = req.params.id;

    let staffResult = await Staff.findOne({
      _id: id,
      status: { $eq: "active" },
    });
    if (staffResult) {
      if (staffResult.activate == true) {
        await Staff.findByIdAndUpdate(
          staffResult._id,
          { activate: false },
          { $new: true }
        );
        response.successResponse(
          res,
          200,
          "Staff account deactivated successfully",
          {}
        );
      } else {
        await Staff.findByIdAndUpdate(
          staffResult._id,
          { activate: true },
          { $new: true }
        );
        response.successResponse(
          res,
          200,
          "Staff account activated successfully",
          {}
        );
      }
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// activated and deactivate dealer by admin Dashboard
router.post("/admin/deactivete/dealer/:id", auth, async (req, res) => {
  try {
    log.debug("admin/deactivete/dealer/:id");
    let id = req.params.id;

    let dealerResult = await user.findOne({
      _id: id,
      status: { $eq: "active" },
    });
    if (dealerResult) {
      if (dealerResult.activate == true) {
        await user.findByIdAndUpdate(
          dealerResult._id,
          { activate: false },
          { $new: true }
        );
        response.successResponse(
          res,
          200,
          "Dealer account deactivated successfully",
          {}
        );
      } else {
        await user.findByIdAndUpdate(
          dealerResult._id,
          { activate: true },
          { $new: true }
        );
        response.successResponse(
          res,
          200,
          "dealer account activated successfully",
          {}
        );
      }
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

router.post("/admin/deactivate/:id", auth, async (req, res) => {
  try {
    log.debug("admin/deactivate/:id");
    let id = req.params.id;
    let dealerResult = await user.findOne({
      _id: id,
      status: { $eq: "active" },
    });

    let staffResult = await Staff.findOne({
      _id: id,
      status: { $eq: "active" },
    });

    if (dealerResult) {
      await user.findByIdAndUpdate(
        dealerResult._id,
        { $set: req.body },
        { $new: true }
      );
      response.successResponse(
        res,
        200,
        "Dealer account updated successfully",
        {}
      );
    } else if (staffResult) {
      await Staff.findByIdAndUpdate(
        dealerResult._id,
        { $set: req.body },
        { $new: true }
      );
      response.successResponse(
        res,
        200,
        "Staff account updated successfully",
        {}
      );
    } else {
      response.errorMsgResponse(res, 400, "Dealer/Staff not found");
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

router.post("/dealer/deactivate/:id", auth, async (req, res) => {
  try {
    log.debug("dealer/deactivate/:id");
    let id = req.params.id;
    let customerResult = await Customer.findOne({
      _id: id,
      status: { $eq: "active" },
    });

    let staffResult = await Staff.findOne({
      _id: id,
      status: { $eq: "active" },
    });

    if (customerResult) {
      await Customer.findByIdAndUpdate(
        dealerResult._id,
        { $set: req.body },
        { $new: true }
      );
      response.successResponse(
        res,
        200,
        "Customer account updated successfully",
        {}
      );
    } else if (staffResult) {
      await Staff.findByIdAndUpdate(
        dealerResult._id,
        { $set: req.body },
        { $new: true }
      );
      response.successResponse(
        res,
        200,
        "Staff account updated successfully",
        {}
      );
    } else {
      response.errorMsgResponse(res, 400, "Customer/Staff not found");
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// in Dealer side
// router.get("/get/singlCustomer/:id", auth, async(req, res)=>{
//   try {
//     log.debug("get/singlCustomer/:id");
//     let userId = req.userId;
//     let result = await Customer.findOne({
//       dealerId: userId,
//       _id:req.params.id,
//       status: { $eq: "active" },
//     })
//       .select(
//         "-isEmailVerified -status -assignDevice -userName -mailToken -password "
//       )
//       .populate({
//         path: "dealerId",
//         select:
//           "orgDetails profileImg _id designation username email mobileNumber address",
//       });
//     response.successResponse(
//       res,
//       200,
//       "customer profile fetched successfully",
//       result
//     );

//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 301, "Something went wrong");
//   }
// })

router.get("/getAll/customer/by/dealer/:id", auth, async (req, res) => {
  try {
    log.debug("getAll/customer/by/dealer/:id");
    let { page, limit, key } = req.query;
    const skip = (page - 1) * limit;
    limit = limit * 1;
    let condition = { dealerId: req.params.id, status: { $eq: "active" } };
    if (key && key != "") {
      condition = {
        ...condition,
        $or: [
          { customerName: { $regex: "^" + key + "", $options: "i" } },
          { phoneNo: { $regex: "^" + key + "", $options: "i" } },
        ],
      };
    }

    let allCount = await Customer.find(condition).countDocuments();
    // get All customers
    if (req.query.filter === "all") {
      const result = await Customer.find(condition)
        .populate({
          path: "assignDevice",
          populate: { path: "device", model: "Product" },
        })
        .limit(limit)
        .skip(skip)
        .sort({ _id: -1 })
        .select("-mailToken  -isEmailVerified -password");

      let resultCount = await Customer.find(condition).countDocuments();
      // .limit(limit)
      // .skip(skip);

      let respData = {
        metadata: {
          count: resultCount,
          all: resultCount,
          activated: 0,
          suspended: 0,
          notAllocated: 0,
        },
        result,
      };
      if (result.length != 0) {
        response.successResponse(
          res,
          200,
          "customers fetched successfully",
          respData
        );
      } else {
        response.successResponse(
          res,
          200,
          "customers fetched successfully",
          respData
        );
      }
    }

    // get Activated Customers
    if (req.query.filter === "activated") {
      // response.successResponse(res, 200, "Not Found");
      const result = await Customer.find({ activate: { $eq: true }, condition })
        .limit(limit)
        .skip(skip)
        .select("-mailToken  -isEmailVerified -password");

      let resultCount = await Customer.find({
        condition,
        activate: { $eq: true },
      }).countDocuments();

      let respData = {
        metadata: {
          count: 0,
          all: allCount,
          activated: 0,
          suspended: 0,
          notAllocated: 0,
        },
        result,
      };
      // if (result.length != 0) {
      //   response.successResponse(
      //     res,
      //     200,
      //     "customers fetched successfully",
      //     respData
      //   );
      // } else {
      response.successResponse(res, 200, "", respData);
      // }
    }

    // get Suspended Customers
    if (req.query.filter === "suspended") {
      // response.successResponse(res, 200, "Not Found");
      const result = await Customer.find({ activate: { $eq: true }, condition })
        .limit(limit)
        .skip(skip)
        .select("-mailToken  -isEmailVerified -password");

      let resultCount = await Customer.find({
        condition,
        activate: { $eq: true },
      }).countDocuments();

      let respData = {
        metadata: {
          count: 0,
          all: allCount,
          activated: 0,
          suspended: 0,
          notAllocated: 0,
        },
        result,
      };
      // if (result.length != 0) {
      //   response.successResponse(
      //     res,
      //     200,
      //     "customers fetched successfully",
      //     respData
      //   );
      // } else {
      response.successResponse(res, 200, "", respData);
      // }
    }

    //get Not Allocated Customers
    if (req.query.filter === "notAllocated") {
      // response.successResponse(res, 200, "Not Found");
      const result = await Customer.find({ activate: { $eq: true }, condition })
        .limit(limit)
        .skip(skip)
        .select("-mailToken  -isEmailVerified -password");

      let resultCount = await Customer.find({
        condition,
        activate: { $eq: true },
      }).countDocuments();

      let respData = {
        metadata: {
          count: 0,
          all: allCount,
          activated: 0,
          suspended: 0,
          notAllocated: 0,
        },
        result,
      };
      // if (result.length != 0) {
      //   response.successResponse(
      //     res,
      //     200,
      //     "customers fetched successfully",
      //     respData
      //   );
      // } else {
      response.successResponse(res, 200, "", respData);
      // }
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});


// in Dealer side
// router.get("/get/singlCustomer/:id", auth, async(req, res)=>{
//   try {
//     log.debug("get/singlCustomer/:id");
//     let userId = req.userId;
//     let result = await Customer.findOne({
//       dealerId: userId,
//       _id:req.params.id,
//       status: { $eq: "active" },
//     })
//       .select(
//         "-isEmailVerified -status -assignDevice -userName -mailToken -password "
//       )
//       .populate({
//         path: "dealerId",
//         select:
//           "orgDetails profileImg _id designation username email mobileNumber address",
//       });
//     response.successResponse(
//       res,
//       200,
//       "customer profile fetched successfully",
//       result
//     );

//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 301, "Something went wrong");
//   }
// })

// update dealer by dealer Id from Admin Dashboard
router.put("/update/dealer/:id", auth, async (req, res) => {
  try {
    log.debug("update/dealer/:id");
    let result = await user.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      {
        $new: true,
      }
    );
    if (result) {
      result = await user.find({ _id: req.params.id });
      response.successResponse(res, 200, "Data fetched successfully", result);
    } else {
      response.errorMsgResponse(res, 404, "Unable to fetched record");
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// delete card details from an array in dealer section
router.delete("/delete/cardDetails/fromArray/:id", auth, async (req, res) => {
  try {
    log.debug("delete/cardDetails/fromArray");
    let result = await user.findOneAndUpdate(
      { _id: req.params.id, status: { $eq: "active" } },
      {
        $pull: {
          "paymentDetails.addDebitCreditCard": {
            _id: req.query.id,
          },
        },
      }
    );
    result = await user.findOne({
      _id: req.params.id,
      status: { $eq: "active" },
    });
    response.successResponse(res, 200, "Record Deleted Successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// delete bank details in dealer Section
router.delete("/delete/bankDetails/:id", auth, async (req, res) => {
  try {
    log.debug("delete/bankDetails");
    let result = await user.findOneAndUpdate(
      { _id: req.params.id, status: { $eq: "active" } },
      { $unset: { "paymentDetails.addBankDetails": "" } }
    );
    result = await user.findOne({
      _id: req.params.id,
      status: { $eq: "active" },
    });
    response.successResponse(res, 200, "Record Deleted Successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// delete shipping address from dealer profile
router.delete("/delete/shipping/address", auth, async (req, res) => {
  try {
    log.debug("delete/shipping/address");

    let result = await user.findOneAndUpdate(
      { _id: req.query.dealerId, status: { $eq: "active" } },
      {
        $pull: {
          shippingAddress: {
            _id: req.query.addressId,
          },
        },
      }
    );
    result = await user.findOne({
      _id: req.query.dealerId,
      status: { $eq: "active" },
    });
    response.successResponse(res, 200, "Record Deleted Successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// delete Billing address from dealer profile
router.delete("/delete/billing/address", auth, async (req, res) => {
  try {
    log.debug("delete/billing/address");
    console.log("<<<<<<<<<<addressId>>>>>>>>>>", req.query.addressId);
    let result = await user.findOneAndUpdate(
      { _id: req.query.dealerId, status: { $eq: "active" } },
      {
        $pull: {
          billingAddress: {
            _id: req.query.addressId,
          },
        },
      }
    );
    result = await user.findOne({
      _id: req.query.dealerId,
      status: { $eq: "active" },
    });
    response.successResponse(res, 200, "Record Deleted Successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// Update Billing address from dealer profile
router.put("/update/shipping/address", auth, async (req, res) => {
  try {
    log.debug("update/shipping/address");
    let result = await user.findOneAndUpdate(
      { "shippingAddress._id": req.query.addressId },
      {
        $set: {
          "shippingAddress.$.name": req.body.name,
          "shippingAddress.$.phoneNo": req.body.phoneNo,
          "shippingAddress.$.address": req.body.address,
          "shippingAddress.$.country": req.body.country,
          "shippingAddress.$.state": req.body.state,
          "shippingAddress.$.city": req.body.city,
          "shippingAddress.$.zipPostalCode": req.body.zipPostalCode,
          "shippingAddress.$.defaultAddress": req.body.defaultAddress,
        },
      }
    );
    if (result) {
      result = await user.findOne({
        _id: req.query.dealerId,
        status: { $eq: "active" },
      });
      response.successResponse(
        res,
        200,
        "Shipping address updated successfully",
        result
      );
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// Update Billing address from dealer profile
router.put("/update/billing/address", auth, async (req, res) => {
  try {
    log.debug("update/billing/address");
    let result = await user.findOneAndUpdate(
      { "billingAddress._id": req.query.addressId },
      {
        $set: {
          "billingAddress.$.name": req.body.name,
          "billingAddress.$.phoneNo": req.body.phoneNo,
          "billingAddress.$.address": req.body.address,
          "billingAddress.$.country": req.body.country,
          "billingAddress.$.state": req.body.state,
          "billingAddress.$.city": req.body.city,
          "billingAddress.$.zipPostalCode": req.body.zipPostalCode,
          "billingAddress.$.defaultAddress": req.body.defaultAddress,
        },
      }
    );
    if (result) {
      result = await user.findOne({
        _id: req.query.dealerId,
        status: { $eq: "active" },
      });
      response.successResponse(
        res,
        200,
        "Billing address updated successfully",
        result
      );
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// Add Billing and Shipping Address in Dealer Profile
router.post("/add/shipping_billing/address", auth, async (req, res) => {
  try {
    log.debug("add/shipping/address");
    let addressType;
    if (req.body.arrType === "shipping") {
      addressType = "shippingAddress";
    } else if (req.body.arrType === "billing") {
      addressType = "billingAddress";
    }
    let addAddress = await user.updateOne(
      { _id: req.userId },
      { $push: { [addressType]: req.body } }
    );
    if (addAddress) {
      let showAddress = await user.findOne({ _id: req.userId });
      response.successResponse(
        res,
        200,
        "Address added successfully",
        showAddress
      );
    }
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

module.exports = router;

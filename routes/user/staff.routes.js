let router = require("express").Router();
let log = require("../../helper/logger");
let response = require("../../helper/response");
const commonController = require("../../controller/commonController");
const ERRORS = require("../../helper/errorMessage");
const _ = require("lodash");
const mongoose = require("mongoose");
const Staff = mongoose.model("Staff");
const RolesAndPermission = mongoose.model("RolesAndPermission");
const email = require("../sendmail/notify");
const auth = require("../../helper/auth");
const PASSWORD = require("../../helper/otp");
let mail = require("../sendmail/notify");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const saltRounds = 10;

router.post("/add", auth, async (req, res) => {
  try {
    log.debug("/add/staff");
    let creator = req.userId;
    let password = PASSWORD.generatePass();
    const mailToken = crypto.randomBytes(64).toString("hex");
    let salt = await bcrypt.genSalt(saltRounds);
    let hash = await bcrypt.hash(password, salt);
    const email = req.body.email.toLowerCase().trim();
    let checkMail = await Staff.findOne({ email: email });

    let rollData = await RolesAndPermission.findById({ _id: req.body.role });

    console.log();
    if (checkMail)
      return response.errorMsgResponse(res, 500, "Email already exist");

    let data = {
      ...req.body,
      creator: creator,
      email: email,
      mailToken: mailToken,
      password: hash,
    };

    if (req.body.designation === "ADMIN_STAFF") {
      data = {
        ...data,
        permission: {
          subscriptionPlans: {
            value: rollData.subscriptionPlans.value,
            view: rollData.subscriptionPlans.view,
            edit: rollData.subscriptionPlans.edit,
            delete: rollData.subscriptionPlans.delete,
          },
          rolesAndPermissions: {
            value: rollData.rolesAndPermissions.value,
            view: rollData.rolesAndPermissions.view,
            edit: rollData.rolesAndPermissions.edit,
            delete: rollData.rolesAndPermissions.delete,
          },
          dashboard: {
            value: rollData.dashboard.value,
            view: rollData.dashboard.view,
            edit: rollData.dashboard.edit,
          },
          alarmReports: {
            value: rollData.alarmReports.value,
            view: rollData.alarmReports.view,
          },
          inventoryManagement: {
            value: rollData.inventoryManagement.value,
            view: rollData.inventoryManagement.view,
            edit: rollData.inventoryManagement.edit,
            delete: rollData.inventoryManagement.delete,
          },
          orders: {
            value: rollData.orders.value,
            view: rollData.orders.view,
            edit: rollData.orders.edit,
            delete: rollData.orders.delete,
          },
          paymentAndInvoices: {
            value: rollData.paymentAndInvoices.value,
            view: rollData.paymentAndInvoices.view,
          },
          userManagement: {
            value: rollData.userManagement.value,
            view: rollData.userManagement.view,
            edit: rollData.userManagement.edit,
            delete: rollData.userManagement.delete,
          },
          devicesManagment: {
            value: rollData.devicesManagment.value,
            view: rollData.devicesManagment.view,
            edit: rollData.devicesManagment.edit,
            delete: rollData.devicesManagment.delete,
          },
          help: {
            value: rollData.help.value,
            view: rollData.help.view,
            edit: rollData.help.edit,
          },
          accountSetting: {
            value: rollData.accountSetting.value,
            view: rollData.accountSetting.view,
            edit: rollData.accountSetting.edit,
          },
        },
      };
    } else {
      data = {
        ...data,
        permission: {
          subscriptionPlans: {
            value: rollData.subscriptionPlans.value,
            view: rollData.subscriptionPlans.view,
            edit: rollData.subscriptionPlans.edit,
          },
          dashboard: {
            value: rollData.dashboard.value,
            view: rollData.dashboard.view,
            edit: rollData.dashboard.edit,
          },
          alarmReports: {
            value: rollData.alarmReports.value,
            view: rollData.alarmReports.view,
          },
          inventoryManagement: {
            value: rollData.inventoryManagement.value,
            view: rollData.inventoryManagement.view,
            edit: rollData.inventoryManagement.edit,
            delete: rollData.inventoryManagement.delete,
          },
          orders: {
            value: rollData.orders.value,
            view: rollData.orders.view,
            edit: rollData.orders.edit,
          },
          paymentAndInvoices: {
            value: rollData.paymentAndInvoices.value,
            view: rollData.paymentAndInvoices.view,
          },
          devicesAndCustomers: {
            value: rollData.devicesAndCustomers.value,
            view: rollData.devicesAndCustomers.view,
            edit: rollData.devicesAndCustomers.edit,
            delete: rollData.devicesAndCustomers.delete,
          },
          rolesAndPermissions: {
            value: rollData.rolesAndPermissions.value,
            view: rollData.rolesAndPermissions.view,
            edit: rollData.rolesAndPermissions.edit,
            delete: rollData.rolesAndPermissions.delete,
          },
          staffManagement: {
            value: rollData.staffManagement.value,
            view: rollData.staffManagement.view,
            edit: rollData.staffManagement.edit,
            delete: rollData.staffManagement.delete,
          },
          Products: {
            value: rollData.Products.value,
            view: rollData.Products.view,
            edit: rollData.Products.edit,
            delete: rollData.Products.delete,
          },
          help: {
            value: rollData.help.value,
            view: rollData.help.view,
          },
          accountSetting: {
            value: rollData.accountSetting.value,
            view: rollData.accountSetting.view,
            edit: rollData.accountSetting.edit,
          },
        },
      };
    }

    let subject = `Response Alert Team - Verify your mail`;
    let body = `<h2> hii ${req.body.staffName}! You have been added as a staff member and your password: ${password}. Please login with your mail. </h2>
                <h5> Regards  -team RESPONSE ALERT</h5>`;
    // <h4> Please verify mail by clickng on the link given below...</h4>
    // <a href="http://${req.headers.host}/api/v1/authentication/verify/email?token=${mailToken}"> Verify your mail</a>
    mail.sendMail(email, subject, body);

    let result = await Staff(data).save();
    let resultData = await Staff.findById({ _id: result._id }).select(
      "-mailToken -password -isEmailVerified"
    );
    response.successResponse(res, 200, "Staff added successfully", resultData);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/getAll", auth, async (req, res) => {
  try {
    log.debug("/staff/getAll");
    let { page, limit } = req.query;
    const skip = (page - 1) * limit;
    let creator = req.userId;
    let result = await Staff.find({
      $and: [{ creator: creator }, { status: { $eq: "active" } }],
    })
      .populate("role")
      .select("-mailToken -password -isEmailVerified")
      .limit(limit * 1)
      .skip(skip);
    response.successResponse(res, 200, "All staff", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/get/:id", auth, async (req, res) => {
  try {
    log.debug("/staff/get");
    let id = req.params.id;
    let result = await Staff.findOne({
      _id: id,
      status: { $eq: "active" },
    })
      .populate("role")
      .select("-mailToken -password -isEmailVerified");
    response.successResponse(res, 200, "Staff information", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.put("/update/:id", auth, async (req, res) => {
  try {
    log.debug("/staff/update");
    let id = req.params.id;
    let result = await Staff.findByIdAndUpdate({ _id: id }, req.body, {
      $new: true,
    });
    if (!result) {
      return response.errorMsgResponse(
        res,
        400,
        "Unable to update staff details"
      );
    }
    let updatedResult = await Staff.findById({ _id: result._id })
      .populate("role")
      .select("-mailToken -password -isEmailVerified");

    response.successResponse(
      res,
      200,
      "Staff detail updated successfully",
      updatedResult
    );
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.delete("/delete/:id", auth, async (req, res) => {
  try {
    log.debug("/staff/delete");
    let id = req.params.id;
    await Staff.findByIdAndUpdate(
      { _id: id },
      { status: "deleted" },
      { $new: true }
    );
    response.successResponse(res, 200, "Staff deleted successfully", {});
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/search/staff", async (req, res) => {
  try {
    log.debug("/search/staff");
    let { page, limit } = req.query;
    const skip = (page - 1) * limit;
    let condition = {
      status: { $eq: "active" },
      designation: { $eq: "ADMIN_STAFF" },
      $or: [
        { staffName: { $regex: "^" + req.query.key + "", $options: "i" } },
        {
          phone: {
            $regex: req.query.key,
            $options: "i",
          },
        },
      ],
    };
    const result = await Staff.find(condition)
      .limit(limit * 1)
      .skip(skip)
      .populate("role")
      .sort({ _id: -1 });
    let totalCount = await Staff.countDocuments(condition);
    // .limit(limit * 1)
    // .skip(skip);
    let respData = {
      metadata: {
        count: totalCount,
      },
      result,
    };
    if (result.length != 0) {
      response.successResponse(res, 200, "", respData);
    } else {
      response.successResponse(res, 200, "Not Found", respData);
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.put("/deleteManyStaff", auth, async (req, res) => {
  try {
    log.debug("/delete/staff");
    let ids = req.body.id;
    const data = await Staff.updateMany(
      { _id: { $in: ids }, status: { $eq: "active" } },
      { $set: { status: "deleted" } },
      { multi: true }
    );
    response.successResponse(res, 200, "Staffs deleted successfully");
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// get staff permission data with staff id
router.get("/getStaff/permission", auth, async (req, res) => {
  try {
    log.debug("/get/permission");

    let userId = req.userId;
    let result = await Staff.find({
      status: { $eq: "active" },
      _id: userId,
    }).select("permission");
    response.successResponse(res, 200, "Data fetched", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});
module.exports = router;

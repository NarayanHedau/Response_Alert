let router = require("express").Router();
let log = require("../../helper/logger");
let response = require("../../helper/response");
const commonController = require("../../controller/commonController");
const ERRORS = require("../../helper/errorMessage");
const _ = require("lodash");
const mongoose = require("mongoose");
const BankDetail = mongoose.model("BankDetail");
const auth = require("../../helper/auth");

// router.post("/add", auth, async (req, res) => {
//   try {
//     log.debug("/add/BankDetail");
//     let creator = req.userId;
//     let data = { ...req.body, creator: creator };
//     let result = await Role(data).save();
//     response.successResponse(res, 200, "Role added successfully", result);
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 400, "Something went wrong");
//   }
// });

router.get("/get", auth, async (req, res) => {
  try {
    log.debug("/BankDetail/get");
    let userId = req.userId;
    let result = await BankDetail.findOne({
      userId: userId,
      status: { $eq: "active" },
    });
    response.successResponse(
      res,
      200,
      "User bank details fetched successfully",
      result
    );
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/get/:id", auth, async (req, res) => {
  try {
    log.debug("/BankDetail/get");
    let id = req.params.id;
    let result = await BankDetail.findOne({
      _id: id,
      status: { $eq: "active" },
    });
    response.successResponse(res, 200, "User Bank detail", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

// router.get("/get", auth, async (req, res) => {
//   try {
//     log.debug("/BankDetail/get");
//     let userId = req.userId;
//     let result = await BankDetail.find({
//       userId: userId,
//       status: { $eq: "active" },
//     });
//     response.successResponse(res, 200, "User Bank details", result);
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 400, "Something went wrong");
//   }
// });

router.put("/update/:id", auth, async (req, res) => {
  try {
    log.debug("/BankDetail/update");
    let id = req.params.id;
    let result = await BankDetail.findByIdAndUpdate({ _id: id }, req.body, {
      $new: true,
    });
    let updatedResult = await Role.findById({ _id: result._id });
    response.successResponse(
      res,
      200,
      "Bank Detail updated successfully",
      updatedResult
    );
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

// router.delete("/delete/:id", auth, async (req, res) => {
//   try {
//     log.debug("/Role/delete");
//     let id = req.params.id;
//     let result = await Role.findByIdAndUpdate(
//       { _id: id },
//       { status: "deleted" },
//       { $new: true }
//     );
//     response.successResponse(res, 200, "Role deleted successfully", {});
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 400, "Something went wrong");
//   }
// });

// router.delete("/delete", async (req, res) => {
//   try {
//     log.debug("/multiple/role/delete");
//     let ids = req.body.id;
//     if (Array.isArray(ids)) {
//       let result = await Role.updateMany(
//         { _id: { $in: ids } },
//         { $set: { status: "deleted" } },
//         { multi: true }
//       );
//     }
//     response.successResponse(res, 200, "Roles deleted successfully", {});
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 400, "Something went wrong");
//   }
// });

module.exports = router;

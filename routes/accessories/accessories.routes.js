let router = require("express").Router();
let log = require("../../helper/logger");
let response = require("../../helper/response");
const commonController = require("../../controller/commonController");
const ERRORS = require("../../helper/errorMessage");
const _ = require("lodash");
const mongoose = require("mongoose");
const Query = mongoose.model("Query");
const auth = require("../../helper/auth");
const Customer = mongoose.model("Customer");
const User = mongoose.model("User");
const email = require("../sendmail/notify");
const moment = require("moment");
const Accessories = mongoose.model("Accessories");
const DealerAccessories = mongoose.model("DealerAccessories");

router.post("/addAccessories", auth, async (req, res) => {
  try {
    const { deviceName } = req.body;
    const accessoriesData = await Accessories.findOne({
      status: { $eq: "active" },
      deviceName: deviceName,
    });
    if (accessoriesData) {
      response.errorMsgResponse(res, 403, "Accessories name already exist");
    } else {
      let data = {
        ...req.body,
        adminId: req.userId,
      };
      let addAccessories = await new Accessories(data).save();
      response.successResponse(
        res,
        200,
        "Accessories Added Successfully",
        addAccessories
      );
    }
  } catch (error) {
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.get("/getAll", auth, async (req, res) => {
  try {
    log.debug("/getAll/accessories");

    let result = [];
    let respData;
    let totalCount;
    const { page, limit, key } = req.query;
    const skip = (page - 1) * limit;

    const condition = {
      status: { $eq: "active" },
      // userId: req.userId,
      deviceName: { $regex: "^" + key + "", $options: "i" },
    };
    let userData = await User.findOne({ _id: req.userId });
    if (userData.filter.enable == true) {
      result = await Accessories.find(condition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ selectQuantity: 1 });
      totalCount = await Accessories.countDocuments(condition);
    } else if (key && key !== "") {
      result = await Accessories.find(condition)
        .populate("productId")
        .limit(limit * 1)
        .skip(skip);
      totalCount = await Accessories.countDocuments(condition);
    } else {
      result = await Accessories.find({
        status: { $eq: "active" },
        // userId: req.userId,
      })
        .populate("productId")
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
      totalCount = await Accessories.countDocuments({
        status: { $eq: "active" },
      });
    }
    respData = {
      metadata: {
        count: totalCount,
      },
      result,
    };
    if (result.length <= 0) {
      response.successResponse(res, 200, "Not found", respData);
    } else {
      response.successResponse(res, 200, "Data found", respData);
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.get("/getBy/:id", auth, async (req, res) => {
  try {
    log.debug("/getBy/:id");
    const id = req.params.id;
    const result = await Accessories.findOne({ _id: id });
    response.successResponse(
      res,
      200,
      "Accessories Fetched successfully",
      result
    );
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.put("/updateBy/:id", auth, async (req, res) => {
  try {
    log.debug("Update accessories");
    let result = await Accessories.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      {
        new: true,
      }
    );
    if (result) {
      result = await Accessories.findOne({ _id: req.params.id });
      response.successResponse(res, 200, "Data Updated Successfully", result);
    } else {
      response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.delete("/deleteBy/:id", auth, async (req, res) => {
  try {
    let id = req.params.id;

    let result = await Accessories.findByIdAndUpdate(
      { _id: id },
      { status: "deleted" },
      {
        new: true,
      }
    );
    response.successResponse(res, 200, "Accessories deleted successfully", {});
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.put("/deleteMany", auth, async (req, res) => {
  try {
    log.debug("/delete/many/Accessories");
    let ids = req.body.id;
    const data = await Accessories.updateMany(
      { _id: { $in: ids }, status: { $eq: "active" } },
      { $set: { status: "deleted" } },
      { multi: true }
    );
    response.successResponse(res, 200, "Accessories deleted successfully", {});
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

router.post("/activate/deactivate/:id", auth, async (req, res) => {
  try {
    log.debug("ctivate/deactivate/Accessories/:id");
    let id = req.params.id;

    let accessoriesData = await Accessories.findOne({
      _id: id,
      status: { $eq: "active" },
    });
    if (accessoriesData) {
      if (accessoriesData.activate == true) {
        await Accessories.findByIdAndUpdate(
          accessoriesData._id,
          { activate: false },
          { $new: true }
        );
        response.successResponse(
          res,
          200,
          "Accessories deactivated successfully",
          {}
        );
      } else {
        await Accessories.findByIdAndUpdate(
          accessoriesData._id,
          { activate: true },
          { $new: true }
        );
        response.successResponse(
          res,
          200,
          "Accessories activated successfully",
          {}
        );
      }
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

router.post("/get_matchData", async (req, res) => {
  try {
    // const productId = req.body.productId;
    const { productId } = req.body;
    let resultData = await Accessories.find({
      status: { $eq: "active" },
      diviceList: productId,
    }).select("-additionalInfo  -adminId -deviceDetails -deviceSpecification");
    console.log(resultData);
    response.successResponse(
      res,
      200,
      "Accessories Fetched successfully",
      resultData
    );
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

// router.get('/getAll/accessories/:deviceId', auth, async (req, res) => {
// 	try {
// 		log.debug('/getAll/accessories')
// 		let result = await Accessories.find({
// 			diviceList: req.params.deviceId,
// 			status: { $eq: 'active' }
// 		}).select('-additionalInfo  -adminId -deviceDetails -deviceSpecification')
// 		response.successResponse(res, 200, 'Data fetched successfully', result)
// 	} catch (error) {
// 		console.log(error)
// 		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
// 	}
// })

router.get("/getAll/accessories", async (req, res) => {
  try {
    log.debug("getAll/accessories");
    let getAllAccessories = await Accessories.find({
      status: { $eq: "active" },
    }).select("_id deviceName price");
    response.successResponse(
      res,
      200,
      "Data fetched Successfully",
      getAllAccessories
    );
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

module.exports = router;

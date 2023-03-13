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
const Product = mongoose.model("Product");
const DealerAccessories = mongoose.model("DealerAccessories");
const Accessories = mongoose.model("Accessories");
const User = mongoose.model("User");
const email = require("../sendmail/notify");
const moment = require("moment");

router.post("/add", auth, async (req, res) => {
  try {
    log.debug("/addAccessories");
    let body = req.body;
    let deviceName = [];
    let accessoriesIds = body.map((e) => e.accessoriesId);
    let accessoriesData = await DealerAccessories.find({
      status: { $eq: "active" },
      accessoriesId: { $in: accessoriesIds },
      dealerId: req.userId,
    }).populate("accessoriesId");
    if (accessoriesData.length!=0) {
      accessoriesData.forEach((ele) => deviceName.push(ele.accessoriesId.deviceName));
      res.status(403).json({
        status: "ERROR",
        code: 403,
        message: `${deviceName} Accessories already exist. Please remove first`,
        Data: deviceName
      });
    } else {
      const addDevice = await commonController.insertManyDoc(
        DealerAccessories,
        req.body
      );
      response.successResponse(res, 200, "Accessories added Successfully", addDevice);
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.get("/getAll", auth, async (req, res) => {
  try {
    log.debug("/getAll");
    const userId = req.userId;
    const { page, limit, key } = req.query;
    const skip = (page - 1) * limit;
    let keyCondition = {
      status: { $eq: "active" },
      deviceName: { $regex: "^" + key + "", $options: "i" },
    };

    let result = [];
    let totalCount;
    let respData;

    let userData = await User.findOne({ _id: userId });

    let accessoriesData = await Accessories.find(keyCondition);

    let accessoriesIds = accessoriesData.map((e) => e._id);
    let condition = {
      accessoriesId: { $in: accessoriesIds },
      dealerId: userId,
      status: { $eq: "active" },
    };
    if (userData.filter.enable == true) {
      console.log(">>>>>>>>>>>>>>if statement");
      result = await DealerAccessories.find(condition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ quantity: 1 })
        .populate("accessoriesId");
      totalCount = await DealerAccessories.countDocuments(condition);
    } else {
      console.log(">>>>>>>>>>>>>>else statement");

      result = await DealerAccessories.find(condition)
        .limit(limit * 1)
        .skip(skip)
        .populate("accessoriesId")
        .sort({ _id: -1 });
      totalCount = await DealerAccessories.countDocuments(condition);
    }
    // else {
    //   result = await DealerAccessories.find(condition)
    //     .limit(limit * 1)
    //     .skip(skip)
    //     .sort({ _id: -1 })
    //     .populate("accessoriesId");
    //   totalCount = await DealerAccessories.countDocuments({
    //     status: { $eq: "active" },
    //   });
    //   // totalCount = result.length
    // }

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
    log.debug("/getBy/dealer_Accessories/:id");
    const id = req.params.id;
    const result = await DealerAccessories.findOne({
      _id: id,
    }).populate("accessoriesId");
    response.successResponse(res, 200, "Data Fetched successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.put("/updateBy/:id", auth, async (req, res) => {
  try {
    log.debug("updateBy/dealer_Accessories/:id");
    let id = req.params.id;
    let result = await DealerAccessories.findByIdAndUpdate(
      { _id: id },
      { $set: req.body },
      {
        new: true,
      }
    );

    if (result) {
      result = await DealerAccessories.findById({
        _id: id,
      }).populate("accessoriesId");
      response.successResponse(res, 200, "Record updated successfully", result);
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
    log.debug("deleteBy/:id/Dealer_Accessories");
    let id = req.params.id;

    let result = await DealerAccessories.findByIdAndUpdate(
      { _id: id },
      { status: "deleted" },
      {
        new: true,
      }
    );
    response.successResponse(res, 200, "Record deleted successfully", {});
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.put("/deleteMany", auth, async (req, res) => {
  try {
    log.debug("/delete/many/Dealer_Accessories");
    let ids = req.body.id;
    const data = await DealerAccessories.updateMany(
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
    log.debug("ctivate/deactivate/device/:id");
    let id = req.params.id;

    let dealerAccessoriesResult = await DealerAccessories.findOne({
      _id: id,
      status: { $eq: "active" },
    });
    if (dealerAccessoriesResult) {
      if (dealerAccessoriesResult.activate == true) {
        await DealerAccessories.findByIdAndUpdate(
          dealerAccessoriesResult._id,
          { activate: false },
          { $new: true }
        );
        response.successResponse(
          res,
          200,
          "Device deactivated successfully",
          {}
        );
      } else {
        await DealerAccessories.findByIdAndUpdate(
          dealerAccessoriesResult._id,
          { activate: true },
          { $new: true }
        );
        response.successResponse(res, 200, "Device activated successfully", {});
      }
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

router.get("/get/all/dealer/accessories/:custId", async (req, res) => {
  try {
    log.debug("get/all/dealer/accessories/:custId");
    let customerData = await Customer.findOne({
      _id: req.params.custId,
      status: { $eq: "active" },
    });
    let dealerId = customerData.dealerId;
    let accessoriesIdPopulate = {
      path: "accessoriesId",
      select: "files deviceName activate status _id price",
    };
    let dealerAccessoriesResult = await DealerAccessories.find({
      status: { $eq: "active" },
      dealerId: dealerId,
    })
      .populate(accessoriesIdPopulate)
      .sort({ _id: -1 })
      .select("_id status activate dealerId ");
    response.successResponse(
      res,
      200,
      "Data fetched successfully",
      dealerAccessoriesResult
    );
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.post("/get_matchData", auth, async (req, res) => {
  try {
    const { productId, dealerId } = req.body;
    let dealerAccessoriesData = await DealerAccessories.find({
      status: { $eq: "active" },
      dealerId: dealerId,
    }).populate("accessoriesId");
    dealerAccessoriesData = dealerAccessoriesData.filter(
      (ele) =>
        ele.accessoriesId != undefined &&
        ele.accessoriesId.diviceList.includes(productId)
    );
    response.successResponse(
      res,
      200,
      "Accessories Fetched successfully",
      dealerAccessoriesData
    );
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});
module.exports = router;

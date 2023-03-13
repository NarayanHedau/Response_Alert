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

const Device_Dealer_Inventory_Mgmt = mongoose.model(
  "Device_Dealer_Inventory_Mgmt"
);
const User = mongoose.model("User");
const email = require("../sendmail/notify");
const moment = require("moment");

// router.post("/addDevice", auth, async (req, res) => {
//   try {
//     log.debug("/addDevice");
//     const data = {
//       ...req.body,
//       dealerId: req.userId,
//     };
//     const addDevice = await new Device_Dealer_Inventory_Mgmt(data).save();
//     response.successResponse(res, 200, "Device Added Successfully", addDevice);
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
//   }
// });

// router.post('/addDevice', auth, async (req, res) => {
// 	try {
// 		log.debug('/addDevice')
// 		// const {deviceData} = req.body
// 		// const data = {

// 		//   ...deviceData,
// 		//   // dealerId: req.userId,
// 		// };
// 		// console.log(">>>>>>>>>>>>>>>>>>>>>>>>>", data)
// 		// const addDevice = await new Device_Dealer_Inventory_Mgmt.insertMany(
// 		//   req.body
// 		// ).exec();
// 		const addDevice = await commonController.insertManyDoc(Device_Dealer_Inventory_Mgmt, req.body)

// 		// console.log('data', addDevice)
// 		response.successResponse(res, 200, 'Device  Successfully', addDevice)
// 	} catch (error) {
// 		log.error(error)
// 		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
// 	}
// })

router.post("/addDevice", auth, async (req, res) => {
  try {
    let body = req.body;
    let deviceName = [];
    let deviceIds = body.map((e) => e.deviceId);
    let deviceData = await Device_Dealer_Inventory_Mgmt.find({
      status: { $eq: "active" },
      deviceId: { $in: deviceIds },
      dealerId: req.userId,
    }).populate("deviceId");
    console.log(">>>>>>>>>deviceData",  deviceData)
    if (deviceData.length !=0) {
      console.log(">>>>>>>>>inside if statement")
      deviceData.forEach((ele) => deviceName.push(ele.deviceId.deviceName));
      res.status(403).json({
        status: "ERROR",
        code: 403,
        message: `${deviceName} Device already exist. Please remove first`,
        Data: deviceName
      });
    } else {
      console.log(">>>>>>>>>inside else statement")

      const addDevice = await commonController.insertManyDoc(
        Device_Dealer_Inventory_Mgmt,
        req.body
      );
      response.successResponse(res, 200, "Device  Successfully", addDevice);
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

    let userData = await User.findOne({ _id: req.userId });

    let productData = await Product.find(keyCondition);

    let productIds = productData.map((e) => e._id);
    let condition = {
      deviceId: { $in: productIds },
      dealerId: userId,
      status: { $eq: "active" },
    };
    if (userData.filter.enable == true) {
      result = await Device_Dealer_Inventory_Mgmt.find(condition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ quantity: 1 })
        .populate("deviceId");
      totalCount = await Device_Dealer_Inventory_Mgmt.countDocuments(condition);
    } else {
      result = await Device_Dealer_Inventory_Mgmt.find(condition)
        .limit(limit * 1)
        .skip(skip)
        .populate("deviceId")
        .sort({ _id: -1 });
      totalCount = await Device_Dealer_Inventory_Mgmt.countDocuments(condition);
    }
    // else {
    //   console.log(">>>>>>>>>>>>>>>>>>else", condition);
    //   result = await Device_Dealer_Inventory_Mgmt.find({
    //     dealerId: userId,
    //     status: { $eq: "active" },
    //   })
    //     .limit(limit * 1)
    //     .skip(skip)
    //     .sort({ _id: -1 })
    //     .populate("deviceId");
    //   totalCount = await Device_Dealer_Inventory_Mgmt.countDocuments({
    //     status: { $eq: "active" },
    //   });
    //   // totalCount = result.length;
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
    log.debug("/getBy/:id");
    const id = req.params.id;
    const result = await Device_Dealer_Inventory_Mgmt.findOne({
      _id: id,
    }).populate("deviceId");
    response.successResponse(res, 200, "Data Fetched successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.put("/updateBy/:id", auth, async (req, res) => {
  try {
    log.debug("updateBy/:id");
    let id = req.params.id;
    let result = await Device_Dealer_Inventory_Mgmt.findByIdAndUpdate(
      { _id: id },
      { $set: req.body },
      {
        new: true,
      }
    );

    if (result) {
      result = await Device_Dealer_Inventory_Mgmt.findById({
        _id: id,
      }).populate("deviceId");
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
    let id = req.params.id;

    let result = await Device_Dealer_Inventory_Mgmt.findByIdAndUpdate(
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

router.put("/deleteManyDevice", auth, async (req, res) => {
  try {
    log.debug("/delete/many/device");
    let ids = req.body.id;
    const data = await Device_Dealer_Inventory_Mgmt.updateMany(
      { _id: { $in: ids }, status: { $eq: "active" } },
      { $set: { status: "deleted" } },
      { multi: true }
    );
    response.successResponse(res, 200, "Devices deleted successfully", {});
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

router.post("/activate/deactivate/device/:id", auth, async (req, res) => {
  try {
    log.debug("ctivate/deactivate/device/:id");
    let id = req.params.id;

    let ProductResult = await Device_Dealer_Inventory_Mgmt.findOne({
      _id: id,
      status: { $eq: "active" },
    });
    if (ProductResult) {
      if (ProductResult.activate == true) {
        await Device_Dealer_Inventory_Mgmt.findByIdAndUpdate(
          ProductResult._id,
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
        await Device_Dealer_Inventory_Mgmt.findByIdAndUpdate(
          ProductResult._id,
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

router.get("/getall/product", auth, async (req, res) => {
  try {
    log.debug("/getall/product");

    let productData = await Product.find({
      status: { $eq: "active" },
      quantity: { $gt: 0 },
    });
    // .select(" _id status deviceName");
    // console.log(">>>>>>>>>>", productData);
    let devicePopulate = {
      path: "deviceId",
      select: " _id status deviceName",
    };
    let productIds = productData.map((e) => e._id);
    let result = await Device_Dealer_Inventory_Mgmt.find({
      status: { $eq: "active" },
      deviceId: { $in: productIds },
      dealerId: req.userId,
    })
      .populate(devicePopulate)
      .select(
        "-status -activate -_id -dealerId -quantity -__v -createdAt -updatedAt"
      );

    response.successResponse(res, 200, "Data fetched successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// router.get("/getall/dealer/inventory/devices", auth, async (req, res) => {
//   try {
//     log.debug("/getall/dealer/inventory/devices");
//     const userId = req.userId;
//     const { page, limit, key } = req.query;
//     const skip = (page - 1) * limit;
//     let keyCondition = {
//       status: { $eq: "active" },
//       deviceName: { $regex: "^" + key + "", $options: "i" },
//     };

//     let result = [];
//     let totalCount;
//     let respData;

//     let productData = await Product.find(keyCondition);

//     let productIds = productData.map((e) => e._id);

//     let devicePopulate = {
//       path: "deviceId",
//       select: " _id status deviceName files additionalInfo price deviceDetails",
//     };
//     if (key && key !== "") {
//       result = await Device_Dealer_Inventory_Mgmt.find({
//         deviceId: { $in: productIds },
//         dealerId: userId,
//         status: { $eq: "active" },
//       })
//         .populate(devicePopulate)
//         .select(
//           "-status -activate -_id -dealerId -quantity -__v -createdAt -updatedAt"
//         )
//         .limit(limit * 1)
//         .skip(skip);

//       totalCount = result.length;
//     } else {
//       result = await Device_Dealer_Inventory_Mgmt.find({
//         status: { $eq: "active" },
//         dealerId: userId,
//       })
//         .populate(devicePopulate)
//         .select(
//           "-status -activate -_id -dealerId -quantity -__v -createdAt -updatedAt"
//         )
//         .limit(limit * 1)
//         .skip(skip)
//         .sort({ _id: -1 });

//       totalCount = result.length;
//     }

//     respData = {
//       metadata: {
//         count: totalCount,
//       },
//       result,
//     };
//     if (result.length <= 0) {
//       response.successResponse(res, 200, "Not found", respData);
//     } else {
//       response.successResponse(res, 200, "Data found", respData);
//     }
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
//   }
// });

router.get("/getall/dealer/inventory/devices", auth, async (req, res) => {
  try {
    log.debug("/getall/dealer/inventory/devices");
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

    let productData = await Product.find(keyCondition);

    let productIds = productData.map((e) => e._id);

    let devicePopulate = {
      path: "deviceId",
      select: " _id status deviceName files additionalInfo price deviceDetails",
    };
    if (key && key !== "") {
      result = await Device_Dealer_Inventory_Mgmt.find({
        deviceId: { $in: productIds },
        dealerId: userId,
        status: { $eq: "active" },
      })
        .populate(devicePopulate)
        .select(
          "-status -activate -_id -dealerId -quantity -__v -createdAt -updatedAt"
        )
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });

      totalCount = result.length;
    } else {
      result = await Device_Dealer_Inventory_Mgmt.find({
        status: { $eq: "active" },
        dealerId: userId,
      })
        .populate(devicePopulate)
        .select(
          "-status -activate -_id -dealerId -quantity -__v -createdAt -updatedAt"
        )
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });

      totalCount = result.length;
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

router.get("/getall/devices", auth, async (req, res) => {
  try {
    log.debug("/getall/devices");
    const dealerId = req.query.dealerId;
    const { page, limit, key } = req.query;
    const skip = (page - 1) * limit;
    let keyCondition = {
      status: { $eq: "active" },
      deviceName: { $regex: "^" + key + "", $options: "i" },
    };

    let result = [];
    let totalCount;
    let respData;

    let productData = await Product.find(keyCondition);

    let productIds = productData.map((e) => e._id);

    let devicePopulate = {
      path: "deviceId",
      select: " _id status deviceName files additionalInfo price deviceDetails",
    };
    let condition = {
      deviceId: { $in: productIds },
      dealerId: dealerId,
      status: { $eq: "active" },
    };
    // console.log(">>>>>>>>>>>>>>>>>dddddddddddddddddd>>>", condition)

    // if (key && key !== "") {

    // console.log(">>>>>>>>>>>>>>>>>>>>", condition)
    result = await Device_Dealer_Inventory_Mgmt.find(condition)
      .limit(limit * 1)
      .skip(skip)
      .sort({ _id: -1 })
      .populate(devicePopulate)
      .select(
        "-status -activate -dealerId -quantity -__v -createdAt -updatedAt"
      );
    totalCount = await Device_Dealer_Inventory_Mgmt.countDocuments(condition);
    // }
    // else {
    //   result = await Device_Dealer_Inventory_Mgmt.find({
    //     status: { $eq: "active" },
    //     dealerId: userId,
    //   })
    //     .populate(devicePopulate)
    //     .select(
    //       "-status -activate -_id -dealerId -quantity -__v -createdAt -updatedAt"
    //     )
    //     .limit(limit * 1)
    //     .skip(skip)
    //     .sort({ _id: -1 });

    //   totalCount = result.length;
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
module.exports = router;

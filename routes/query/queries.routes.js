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

router.post("/add", auth, async (req, res) => {
  try {
    log.debug("/add/query");
    let data = req.body;
    let messageSeen = [];
    let messageSender = req.userId;
    const customerData = await Customer.findOne({
      _id: req.body.customerId,
      status: { $eq: "active" },
    });
    messageSeen.push(req.userId);
    data = {
      ...data,
      customerName: customerData.customerName,
      messageSender: messageSender,
      messageSeen: messageSeen,
    };

    const result = await commonController.add(Query, data);
    if (result) {
      let to = data.tosendEmail;
      let subject = "temp mail";
      let body = `<pre>${data.data}</pre> This is temp mail`;
      console.log("=====email>>>>>", to);
      // email.sendMail(data.tosendEmail, subject, body);
      email.sendMail(to, subject, body);
      response.successResponse(res, 200, "Query Added Successfully", result);
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.get("/dealer/get/customer/list/", auth, async (req, res) => {
  try {
    // let { page, limit } = req.query;
    let page = req.query.page ? req.query.page : 1;
    let limit = req.query.limit ? req.query.limit : 10;
    let startIndex = (page - 1) * limit;
    let endIndex = page * limit;
    let searchKey = req.query.searchKey;

    let uniqueUser = [];
    let countResult = [];
    let result;
    let condition = {
      status: { $eq: "active" },
      dealerId: req.userId,
    };
    let dealerPopulate = {
      path: "customerId",
      select: " _id image customerName email",
    };
    let customerPopulate = {
      path: "dealerId",
      select: "_id profileImg username email",
    };

    if (searchKey && searchKey != "") {
      condition = {
        ...condition,
        customerName: { $regex: searchKey.trim(), $options: "i" },
      };
      result = await Query.find(condition)
        .sort({ createdAt: -1 })
        .populate(dealerPopulate)
        .populate(customerPopulate);
    } else {
      result = await Query.find(condition)
        .sort({ createdAt: -1 })
        .populate(dealerPopulate)
        .populate(customerPopulate);
    }

    result = JSON.parse(JSON.stringify(result));
    result = result.filter((ele) => ele.customerId !== null);
    const map = new Map();
    for (const item of result) {
      if (!map.has(item.customerId._id)) {
        map.set(item.customerId._id, true);
		countResult = result.filter(
			(ele) =>
			  ele.dealerId._id == item.dealerId._id &&
			  ele.customerId._id == item.customerId._id &&
			  !ele.messageSeen.includes(req.userId)
		  );
        uniqueUser.push({ ...item, unreadMsgCoun: countResult.length });
      }

    }

    let totalCount = uniqueUser.length;
    uniqueUser = uniqueUser.slice(startIndex, endIndex);
    let resultObj = {
      metadata: { totalCount: totalCount },
      resData: uniqueUser,
    };
    response.successResponse(
      res,
      200,
      "customer list fetched successfully",
      resultObj
    );
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.get("/getAll", auth, async (req, res) => {
  try {
    log.debug("/get/all/queries");
    let { dealerId, customerId, page } = req.query;
    page = page - 1;
    let limit = req.query.limit ? req.query.limit : 10;
    let condition = {
      status: { $eq: "active" },
      customerId: customerId,
      dealerId: dealerId,
    };
    let totalCount = await Query.countDocuments(condition);

    await Query.updateMany(condition, {
      $addToSet: { messageSeen: req.userId },
    });

    let result = await Query.find(condition)
      .populate({ path: "customerId", select: " _id image customerName" })
      .populate({ path: "dealerId", select: "_id profileImg username email" })
      .skip(page * limit)
      .limit(limit * 1);

    let resultObj = { totalCount: totalCount, resData: result };

    // // let updateMessage = [];
    // for (const item of result) {
    //   const found = item.messageSeen.some((el) => el == req.userId);
    //   // if (!found) arr.push({ id, username: name });
    //   if (!found)
    //     await Query.findOneAndUpdate(
    //       { _id: item._id },
    //       { $push: { messageSeen: req.userId } },
    //       { $new: true }
    //     );

    //   // console.log("=====ele>>>>>", item.messageSeen)
    // }
    // // result.map(async (ele) => console.log("=====ele>>>>>", ele.messageSeen.find()));

    response.successResponse(
      res,
      200,
      "Queries fetched successfully",
      resultObj
    );
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.get("/getAll/queries/:id", async (req, res) => {
  try {
    log.debug("getAll/queries/:custId");
    let condition = {
      status: { $eq: "active" },
      customerId: req.params.id,
    };
    let result = await Query.find(condition)
      .select("_id data dealerId createdAt")
      .populate({ path: "dealerId", select: "_id profileImg username" })
      .limit(30)
      .sort({ _id: -1 });

    // console.log("<<<<<<<<<response>>>>>>>>>>", result.length);
    response.successResponse(res, 200, "Data Fetched Successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});
module.exports = router;

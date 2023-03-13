let router = require("express").Router();
let log = require("../../helper/logger");
let response = require("../../helper/response");
const commonController = require("../../controller/commonController");
const ERRORS = require("../../helper/errorMessage");
const _ = require("lodash");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const Customer = mongoose.model("Customer");
const Staff = mongoose.model("Staff");
const Device_Dealer_Inventory_Mgmt = mongoose.model(
  "Device_Dealer_Inventory_Mgmt"
);
const DealerAccessories = mongoose.model("DealerAccessories");
const Product = mongoose.model("Product");
const Accessories = mongoose.model("Accessories");
const Order = mongoose.model("Order");
const lodash = require("lodash");
const auth = require("../../helper/auth");
const moment = require("moment");
const { filter, cond } = require("lodash");

const weekDay = {
  1: { day: "Sun" },
  2: { day: "Mon" },
  3: { day: "Tue" },
  4: { day: "Wed" },
  5: { day: "Thu" },
  6: { day: "Fri" },
  7: { day: "Sat" },
};
const months = {
  1: { month: "Jan" },
  2: { month: "Feb" },
  3: { month: "Mar" },
  4: { month: "Apr" },
  5: { month: "May" },
  6: { month: "Jun" },
  7: { month: "Jul" },
  8: { month: "Aug" },
  9: { month: "Sep" },
  10: { month: "Oct" },
  11: { month: "Nov" },
  12: { month: "Dec" },
};

const getWeekData = async () => {
  try {
    const daysCount = [];
    const result = await Order.aggregate([
      // {
      //   $match
      // },
      {
        $project: {
          createdAt: 1,
          paymentDetails: 1,
        },
      },
      {
        $group: {
          _id: {
            $dayOfWeek: "$createdAt",
          },
          data: { $push: "$$ROOT" },
        },
      },
    ]);
    for (item of Object.keys(weekDay)) {
      for (ele of result) {
        if (ele._id === parseInt(item)) {
          const data = ele.data;
          let totalCount = 0;
          let totalPrice = 0;
          data.forEach((e) => {
            console.log("Data", e);
            totalCount = totalCount + e.paymentDetails.totalCount;
            totalPrice = totalPrice + e.paymentDetails.totalPrice;
          });

          const obj = {
            day: weekDay[item].day,
            count: ele.data.length,
            totalCount: totalCount,
            totalPrice: totalPrice,
          };
          console.log("Data", obj);
          daysCount.push(obj);
        }
      }
    }
    return daysCount;
  } catch (error) {
    return [];
  }
};

const getMonthData = async () => {
  try {
    const daysCount = [];
    const month = new Date(moment().subtract(1, "month"));
    const result = await Order.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $month: "$createdAt" }, { $month: month }],
          },
        },
      },
      {
        $project: {
          createdAt: 1,
          paymentDetails: 1,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          data: { $push: "$$ROOT" },
        },
      },
    ]);

    for (item of result) {
      let obj = {};
      obj["date"] = item._id;
      obj["count"] = item.data.length;
      let totalCount = 0;
      let totalPrice = 0;
      item.data.forEach((ele) => {
        totalCount = totalCount + ele.paymentDetails.totalCount;
        totalPrice = totalPrice + ele.paymentDetails.totalPrice;
      });
      daysCount.push({
        ...obj,
        totalCount,
        totalPrice,
      });
    }
    return daysCount;
  } catch (error) {
    return [];
  }
};

const getYearData = async () => {
  try {
    const daysCount = [];
    const year = new Date(moment().subtract(1, "month"));
    const result = await Order.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $year: "$createdAt" }, { $year: year }],
          },
        },
      },
      {
        $project: {
          createdAt: 1,
          paymentDetails: 1,
        },
      },
      {
        $group: {
          _id: {
            $month: "$createdAt",
          },
          data: { $push: "$$ROOT" },
        },
      },
    ]);
    for (item of result) {
      let obj = {};
      obj["month"] = months[item._id].month;
      obj["count"] = item.data.length;
      let totalCount = 0;
      let totalPrice = 0;
      item.data.forEach((ele) => {
        totalCount = totalCount + ele.paymentDetails.totalCount;
        totalPrice = totalPrice + ele.paymentDetails.totalPrice;
      });
      daysCount.push({
        ...obj,
        totalCount,
        totalPrice,
      });
    }
    return daysCount;
  } catch (error) {
    return [];
  }
};

const getDateCondition = async (condition) => {
  try {
    const daysCount = [];
    // const month = new Date(moment().subtract(1, "month"));
    const result = await Order.aggregate([
      {
        $match: condition,
        // {
        //   // $expr: {
        //   //   $eq: [{ $month: "$createdAt" }, { $month: month }],
        //   // },
        // },
      },
      {
        $project: {
          createdAt: 1,
          paymentDetails: 1,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          data: { $push: "$$ROOT" },
        },
      },
    ]);

    for (item of result) {
      let obj = {};
      obj["date"] = item._id;
      obj["count"] = item.data.length;
      let totalCount = 0;
      let totalPrice = 0;
      item.data.forEach((ele) => {
        totalCount = totalCount + ele.paymentDetails.totalCount;
        totalPrice = totalPrice + ele.paymentDetails.totalPrice;
      });
      daysCount.push({
        ...obj,
        totalCount,
        totalPrice,
      });
    }
    return daysCount;
  } catch (error) {
    return [];
  }
};

router.get("/get/inventory/overview/:sellerId", async (req, res) => {
  try {
    // let data = { availableInventory: 100, soldInventory: 135 }

    let filter = {};
    if (req.query.filter === "week") {
      filter = {
        updatedAt: {
          $gte: moment().subtract(8, "days").startOf("day"),
          $lte: moment().subtract(1, "days").endOf("day"),
        },
      };
    }

    if (req.query.filter === "month") {
      filter = {
        updatedAt: {
          $gte: moment().subtract(1, "months").startOf("month"),
          $lte: moment().subtract(1, "months").endOf("month"),
        },
      };
    }

    if (req.query.filter === "year") {
      filter = {
        updatedAt: {
          $gte: moment().subtract(1, "year").startOf("year"),
          $lte: moment().subtract(1, "year").endOf("year"),
        },
      };
    }
    console.log("==================", filter);

    let array = [];
    let array2 = [];
    let ProductData = await Product.find({
      ...filter,
      status: { $eq: "active" },
    });
    let AccessoriesData = await Accessories.find({
      ...filter,
      status: { $eq: "active" },
    });
    let orderData = await Order.find({
      ...filter,
      status: { $eq: "active" },
      sellerId: req.params.sellerId,
    });
    ProductData.map((ele) => array.push(ele.quantity));
    AccessoriesData.map((ele) => array.push(ele.selectQuantity));
    orderData.map((ele) =>
      ele.productDetails.map((item) => array2.push(item.quantity))
    );
    array = lodash.sum(array);
    array2 = lodash.sum(array2);

    let availableSoldCount = {
      availableInventory: array,
      soldInventory: array2,
    };

    response.successResponse(
      res,
      200,
      "Inventory overview fetched successfully.",
      availableSoldCount
    );
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 400, "Something went wrong.");
  }
});

router.get("/get/sales/overview/:sellerId", async (req, res) => {
  try {
    // let data = { totalOrder: 111, totalSale: '$1110' }

    let filter = {};
    if (req.query.filter === "week") {
      filter = {
        createdAt: {
          $gte: moment().subtract(8, "days").startOf("day"),
          $lte: moment().subtract(1, "days").endOf("day"),
        },
      };
    }

    if (req.query.filter === "month") {
      filter = {
        createdAt: {
          $gte: moment().subtract(1, "months").startOf("month"),
          $lte: moment().subtract(1, "months").endOf("month"),
        },
      };
    }
    console.log("month", filter);

    if (req.query.filter === "year") {
      filter = {
        createdAt: {
          $gte: moment().subtract(1, "year").startOf("year"),
          $lte: moment().subtract(1, "year").endOf("year"),
        },
      };
    }
    console.log("year", filter);

    let array = [];
    let orderData = await Order.find({
      ...filter,
      status: { $eq: "active" },
      sellerId: req.params.sellerId,
    });
    let orderDataLength = orderData.length;
    console.log(orderDataLength);
    orderData.map((ele) => {
      array.push(ele.paymentDetails.totalPrice);
      console.log(
        "ele.paymentDetails.totalPrice=====>",
        ele.paymentDetails.totalPrice
      );
    });
    array = lodash.sum(array);

    let salesData = {
      totalPriceCount: array / 100,
      orderCount: orderDataLength,
    };

    response.successResponse(
      res,
      200,
      "Sales overview fetched successfully",
      salesData
    );
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/get/users", auth, async (req, res) => {
  try {
    // let { filter } = req.query;
    let filter = {};
    if (req.query.filter === "week") {
      filter = {
        createdAt: {
          $gte: moment().subtract(8, "days").startOf("day"),
          $lte: moment().subtract(1, "days").startOf("day"),
        },
      };
    }

    if (req.query.filter === "month") {
      filter = {
        createdAt: {
          $gte: moment().subtract(1, "months").startOf("month"),
          $lte: moment().subtract(1, "months").endOf("month"),
        },
      };
    }

    if (req.query.filter === "year") {
      filter = {
        createdAt: {
          $gte: moment().subtract(1, "year").startOf("year"),
          $lte: moment().subtract(1, "year").endOf("year"),
        },
      };
    }

    let dealerResult = await User.countDocuments({
      ...filter,
      designation: { $eq: "DEALER" },
      status: { $eq: "active" },
    });

    let customerResult = await Customer.countDocuments({
      ...filter,
      status: { $eq: "active" },
    });

    let staffResult = await Staff.countDocuments({
      ...filter,
      status: { $eq: "active" },
    });

    response.successResponse(res, 200, "Role added successfully", {
      dealerResult,
      customerResult,
      staffResult,
    });
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/craeteObject", async (req, res) => {
  try {
    // const date = new Date()
    // console.log('==========>', date.getDate())
    let { Fromdate, Todate } = req.query;
    let condition = {
      status: { $eq: "active" },
      createdAt: {
        $gte: new Date(Fromdate),
        $lte: new Date(Todate),
      },
    };
    console.log("condition", condition);
    let filter = {};
    let ApplayFilter = {};
    let allData = [];
    // if (req.query.filter === "week") {
    //   filter = {
    //     createdAt: {
    //       $gte: moment().subtract(8, "days").startOf("day"),
    //       $lte: moment().subtract(1, "days").endOf("day"),
    //     },
    //     status: { $eq: "active" },
    //   };
    // }

    // if (req.query.filter === "month") {
    //   filter = {
    //     createdAt: {
    //       $gte: moment().subtract(1, "months").startOf("month"),
    //       $lte: moment().subtract(1, "months").endOf("month"),
    //     },
    //     status: { $eq: "active" },
    //   };
    // }

    // if (req.query.filter === "year") {
    //   filter = {
    //     createdAt: {
    //       $gte: moment().subtract(1, "year").startOf("year"),
    //       $lte: moment().subtract(1, "year").endOf("year"),
    //     },
    //     status: { $eq: "active" },
    //   };
    // }

    // if (Fromdate && Todate) {
    //   ApplayFilter = condition;
    // } else {
    //   ApplayFilter = filter;
    // }
    // let result = await Order.find(ApplayFilter);
    let result = [];

    if (req.query.filter === "week") {
      result = await getWeekData();
    }
    if (req.query.filter === "month") {
      result = await getMonthData();
    }
    if (req.query.filter === "year") {
      result = await getYearData();
    }
    if (Fromdate && Todate) {
      ApplayFilter = condition;
      getDateCondition(ApplayFilter);
      // console.log("............");
      // result = await Order.find(ApplayFilter);
    }

    // if (req.query.filter === "month") {
    //   result = await getWeekData();
    // }
    // if (req.query.filter === "year") {
    //   result = await getWeekData();
    // }

    response.successResponse(res, 200, "fetched successfully.", result);
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 400, "Something went wrong.");
  }
});

router.get("/get/revenue/report", auth, async (req, res) => {
  try {
    let filter = {};

    if (req.query.filter == "week") {
      console.log("=====>>>>>week>>>>>");
      filter = {
        createdAt: {
          $gte: moment().subtract(8, "days").startOf("day"),
          $lte: moment().subtract(1, "days").startOf("day"),
        },
        status: { $eq: "active" },
      };
    } else if (req.query.filter == "month") {
      console.log("=====>>>>>month>>>>>");
      filter = {
        createdAt: {
          $gte: moment().subtract(1, "months").startOf("month"),
          $lte: moment().subtract(1, "months").endOf("month"),
        },
        status: { $eq: "active" },
      };
    } else if (req.query.filter == "year") {
      console.log("=====>>>>>year>>>>>");
      filter = {
        createdAt: {
          $gte: moment().subtract(1, "year").startOf("year"),
          $lte: moment().subtract(1, "year").endOf("year"),
        },
        status: { $eq: "active" },
      };
    }

    // agg._pipeline = [
    //   { $match: { filter } },
    //   {
    //     $group: {
    //       day: { $dayOfWeek: { $toDate: "$createdAt" } }
    //     },
    //   }
    // ];

    let creator = req.userId;
    let data = { ...req.body, creator: creator };
    let result = await Role(data).save();
    response.successResponse(res, 200, "Role added successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/get/inventory/report", auth, async (req, res) => {
  try {
    log.debug("/add/Role");
    let creator = req.userId;
    let data = { ...req.body, creator: creator };
    let result = await Role(data).save();
    response.successResponse(res, 200, "Role added successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/get/subscription/analytics", auth, async (req, res) => {
  try {
    log.debug("/add/Role");
    let creator = req.userId;
    let data = { ...req.body, creator: creator };
    let result = await Role(data).save();
    response.successResponse(res, 200, "Role added successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/get/sales/analytics", auth, async (req, res) => {
  try {
    log.debug("/add/Role");
    let creator = req.userId;
    let data = { ...req.body, creator: creator };
    let result = await Role(data).save();
    response.successResponse(res, 200, "Role added successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

// Calculate Dealer Inventor Count = Device Count + Accessories Count
router.get("/get/inventoryCount", auth, async (req, res) => {
  try {
    log.debug("get/inventoryCount");
    let filter = {};
    if (req.query.filter === "week") {
      filter = {
        createdAt: {
          $gte: moment().subtract(8, "days").startOf("day"),
          $lte: moment().subtract(1, "days").startOf("day"),
        },
      };
    }

    if (req.query.filter === "month") {
      filter = {
        createdAt: {
          $gte: moment().subtract(1, "months").startOf("month"),
          $lte: moment().subtract(1, "months").endOf("month"),
        },
      };
    }

    if (req.query.filter === "year") {
      filter = {
        createdAt: {
          $gte: moment().subtract(1, "year").startOf("year"),
          $lte: moment().subtract(1, "year").endOf("year"),
        },
      };
    }
    let dealerDeviceCount = await Device_Dealer_Inventory_Mgmt.countDocuments({
      ...filter,
      status: { $eq: "active" },
    });
    let dealerAccessoriesCount = await DealerAccessories.countDocuments({
      ...filter,
      status: { $eq: "active" },
    });
    let totalCount = dealerDeviceCount + dealerAccessoriesCount;
    let respData = {
      metadata: {
        availableCount: totalCount,
        soldCount: 0,
      },
    };
    response.successResponse(res, 200, "Count fetched Successfully", respData);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

// router.get("/getAll/inventory/data", async(req, res)=>{
// 	try {
// 		log.debug("/getAll/inventory/data")
// 		let {filter}= req.query;
// 		let condition = {}
// 		if (filter === 'week') {
// 			condition = {
// 				createdAt: {
// 					$gte: moment().subtract(8, 'days').startOf('day'),
// 					$lte: moment().subtract(1, 'days').startOf('day')
// 				}
// 			}
// 		}

// 		if (filter === 'month') {
// 			condition = {
// 				createdAt: {
// 					$gte: moment().subtract(1, 'months').startOf('month'),
// 					$lte: moment().subtract(1, 'months').endOf('month')
// 				}
// 			}
// 		}

// 		if (filter === 'year') {
// 			condition = {
// 				createdAt: {
// 					$gte: moment().subtract(1, 'year').startOf('year'),
// 					$lte: moment().subtract(1, 'year').endOf('year')
// 				}
// 			}
// 		}

// 	} catch (error) {
// 		console.log(error)
// 		response.errorMsgResponse(res, 301, "Something went wrong")
// 	}
// })

router.get("/get/sales/analytics/inpercent", auth, async (req, res) => {
  try {
    log.debug("/get/sales/analytics");
    let { filter, startDate, endDate } = req.query;
    let filterCondition = {};
    let result;
    let dispatchData = [];
console.log(typeof startDate)
    if (filter === "week") {
      filterCondition = {
        updatedAt: {
          $gte: moment().subtract(8, "days").startOf("day"),
          $lte: moment().subtract(1, "days").endOf("day"),
        },
        status: { $eq: "active" },
      };
      console.log(">>>>>>>>>>>>week", filterCondition);
    }

    if (filter === "month") {
      filterCondition = {
        updatedAt: {
          $gte: moment().subtract(1, "months").startOf("month"),
          $lte: moment().subtract(1, "months").endOf("month"),
        },
        status: { $eq: "active" },
      };
      console.log(">>>>>>>>>>>>month", filterCondition);
    }

    if (filter === "year") {
      filterCondition = {
        updatedAt: {
          $gte: moment().subtract(1, "year").startOf("year"),
          $lte: moment().subtract(1, "year").endOf("year"),
        },
        status: { $eq: "active" },
      };
      console.log(">>>>>>>>>>>>year", filterCondition);
    }
    if (startDate && endDate) {
      result = await Order.find({
        updatedAt: {
          $gte: moment(startDate).startOf("day"),
          $lte: moment(endDate).endOf("day"),
        },
      });
    } else {
      result = await Order.find(filterCondition);
    }

    result.forEach((ele) => dispatchData.push(ele.trackStatus == "Dispatch"));

    let resultData = result.length;
    let dispatchCount = _.sum(dispatchData);
    let dispatchPercentage = (dispatchCount * 100) / resultData;
    let balancePercentage = 100 - dispatchPercentage;
    let respData = {
      metadata: {
        totalCount: resultData,
        dispatchCount: dispatchCount,
        dispatchPercentage: dispatchPercentage,
        balancePercentage: balancePercentage,
      },
    };
    response.successResponse(res, 200, "", respData);
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});
module.exports = router;

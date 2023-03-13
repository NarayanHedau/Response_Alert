let router = require("express").Router();
let response = require("../../helper/response");
const commonController = require("../../controller/commonController");
const ERRORS = require("../../helper/errorMessage");
const _ = require("lodash");
const mongoose = require("mongoose");
const auth = require("../../helper/auth");
const Customer = mongoose.model("Customer");
const User = mongoose.model("User");
const Invoice = mongoose.model("Invoice");

const email = require("../sendmail/notify");
const moment = require("moment");
const Order = require("../../model/order/order.model");
const { schema } = require("../../model/order/order.model");
const Product = require("../../model/product/product.model");
// const { uuid } = require('uuidv4')
const crypto = require("crypto");
const Cart = require("../../model/cart/cart.model");
const { setDefaultResultOrder } = require("dns");
const invoiceKey = require("../../helper/invoice");

router.post("/addOrder", auth, async (req, res) => {
  try {
    // let orderId = 'PRT' + Date.now().toString().slice(-4) + uuid().slice(-4).toUpperCase()
    // const productData = await Product.findOne({ status: { $eq: 'active' }, _id: req.body.productId })
    // if (productData.quantity < req.body.quantity) {
    // 	return res.status(500).json({ message: 'Quantity is less than,Please check it!' })
    // } else {
    let orderId = `PRT${crypto.randomBytes(6).toString("hex")}`;
    let data = await User.findOne({
      status: { $eq: "active" },
      designation: { $eq: "ADMIN" },
    });
    let sellerId = req.body.sellerId ? req.body.sellerId : data._id;
    let condition = { ...req.body, sellerId: sellerId, orderId: orderId };
    const addOrder = await new Order(condition).save();

    let array = [];
    if (addOrder) {
      addOrder.productDetails.forEach((ele) => {
        array.push(ele._id);
      });
    }
    if (array.length > 0) {
      const dektetdData = await Cart.updateMany(
        { _id: { $in: array }, status: { $eq: "active" } },
        { $set: { status: "deleted" } },
        { multi: true }
      );
    }
    if (addOrder) {
      const type = req.body.sellerId ? "customer" : "dealer";
      invoiceKey.createInvoice(addOrder._id, type);
    }
    response.successResponse(res, 200, "Order added successfully", addOrder);
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.get("/recieved_order/:id", auth, async (req, res) => {
  try {
    // sellerId
    const result = await Order.find({
      status: { $eq: "active" },
      _id: req.params.id,
    }).sort({ _id: -1 });
    console.log("result", result);
    response.successResponse(res, 200, "get all data", result);
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.get("/place_Order/:buyerId", auth, async (req, res) => {
  try {
    const { buyerId } = req.params;
    const result = await Order.find({
      status: { $eq: "active" },
      buyerId: buyerId,
    }).sort({ _id: -1 });
    response.successResponse(res, 200, "get all data", result);
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.get("/getById/:id", auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const result = await Order.find({
      status: { $eq: "active" },
      _id: orderId,
    });

    response.successResponse(res, 200, "get data", result);
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.post("/updateBy/order", auth, async (req, res) => {
  try {
    const { orderId, trackStatus, markDelivered } = req.body;
    const result = await Order.findByIdAndUpdate(orderId, {
      trackStatus: trackStatus,
      markDelivered: markDelivered,
    });
    const resultData = await Order.findById(result._id);
    if (
      resultData.trackStatus === "Delivered" &&
      resultData.markDelivered &&
      resultData.customerName
    ) {
      const customerData = await Customer.findById(resultData.buyerId);

      let assignDevice = customerData.assignDevice;
      resultData.productDetails.forEach((ele) => {
        if (ele.dealerProductId) {
          assignDevice.push({
            device: ele.dealerProductId.deviceId._id,
            imeiNumber: "",
          });
        }
      });

      customerData.assignDevice = assignDevice;
      const updateCustomerResult = await Customer.findByIdAndUpdate(
        customerData._id,
        customerData
      );
      const customerGet = await Customer.findById(updateCustomerResult._id);

      console.log("updateCustomerResult", customerGet);
    }
    if (resultData.trackStatus === "Delivered" && resultData.markDelivered) {
      const invoice = await Invoice.findByIdAndUpdate(
        { _id: resultData.invoiceId },
        { $set: { visible: true } }
      );
    }
    response.successResponse(res, 200, "Updated data", resultData);
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});
// router.post('/updateManyStatus', async (req, res) => {
// 	try {
// 		const { dataArr } = req.body

// 		dataArr.forEach(ele => {
// 			Order.findByIdAndUpdate(
// 				{ _id: ele._id },
// 				{ $set: { trackStatus: ele.trackStatus, markDelivered: ele.markDelivered } },
// 				{ $new: true }
// 			)
// 		})
// 		response.successResponse(res, 200, 'successfully', {})

// 		// const updateMany = await Order.updateMany({
// 		// 	_id: { $in: ids },

// 		// 	status: { $eq: 'active' }
// 		// })

// 	// 	{
// 	// 		"dataArr": [
// 	// 			 {
// 	// 				  "_id": "638856fca3246e4942072b34",
// 	// 				  "trackStatus": "Cancel",
// 	// 				  "markDelivered": false
// 	// 			 },
// 	// 			 {
// 	// 				  "_id": "638856fca3246e4942072b34",
// 	// 				  "trackStatus": "Pending",
// 	// 				  "markDelivered": false
// 	// 			 }
// 	// 		]
// 	//   }

// 	} catch (error) {
// 		console.log(error)
// 		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
// 	}
// })

router.post("/updateManyStatus", async (req, res) => {
  try {
    const { ids, trackStatus, markDelivered } = req.body;
    const result = await Order.updateMany(
      { _id: { $in: ids } },
      { $set: { trackStatus: trackStatus, markDelivered: markDelivered } },
      { $new: true }
    );
    // let resultData
    ids.forEach(async (e) => {
      const resultData = await Order.findById(e);
      if (
        resultData.trackStatus === "Delivered" &&
        resultData.markDelivered &&
        resultData.customerName
      ) {
        const customerData = await Customer.findById(resultData.buyerId);

        let assignDevice = customerData.assignDevice;
        resultData.productDetails.forEach((ele) => {
          if (ele.dealerProductId) {
            assignDevice.push({
              device: ele.dealerProductId.deviceId._id,
              imeiNumber: "",
            });
          }
        });

        customerData.assignDevice = assignDevice;
        const updateCustomerResult = await Customer.findByIdAndUpdate(
          customerData._id,
          customerData
        );
        const customerGet = await Customer.findById(updateCustomerResult._id);

        console.log("updateCustomerResult", customerGet);
      }
      if (resultData.trackStatus === "Delivered" && resultData.markDelivered) {
        const invoice = await Invoice.findByIdAndUpdate(
          { _id: resultData.invoiceId },
          { $set: { visible: true } }
        );
      }
      // const resultData = await Order.find({ _id: { $in: ids } })
    });
    response.successResponse(res, 200, "Updated successfully");
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

// router.post('/searchBy/status', async (req, res) => {
// 	try {
// 		// let id = req._id
// 		let id = '6352375882e11462fea8c888'
// 		let { trackStatus, key, page, limit } = req.query
// 		let filter = {}
// 		let deliveryCount
// 		let allCount
// 		let cancelCount

// 		// const {  key } = req.query
// 		// let limit = req.query.limit ? req.query.limit : 10
// 		let skip = (page - 1) * limit
// 		let condition = {
// 			status: { $eq: 'active' },
// 			'productDetails.productId.deviceName': { $regex: '^' + key + '', $options: 'i' }
// 		}

// 		if (key && key != '') filter = { ...filter, ...condition, buyerId: id }
// 		if (trackStatus == '' || trackStatus == 'All') filter = { ...filter, buyerId: id }
// 		if (trackStatus == 'Cancalled') filter = { ...filter, buyerId: id, trackStatus: { $eq: 'Cancel' } }
// 		if (trackStatus == 'Delivery') filter = { ...filter, buyerId: id, trackStatus: { $eq: 'Delivered' } }
// 		// if (trackStatus == '' || trackStatus == 'All') result = await search({ buyerId: id })
// 		// if (trackStatus == 'Cancalled') result = await search({ buyerId: id, trackStatus: { $eq: 'Cancel' } })
// 		// if (trackStatus == 'Delivery') result = await search({ buyerId: id, trackStatus: { $eq: 'Delivered' } })
// 		// if (key && key != '') result = await search({ condition })
// 		console.log('filter===================', filter)
// 		let result = await Order.find(filter).limit(limit * 1).skip(skip)

// 		allCount = await Order.find({ buyerId: id }).countDocuments()
// 		deliveryCount = await Order.find({ buyerId: id, trackStatus: { $eq: 'Delivered' } }).countDocuments()
// 		cancelCount = await Order.find({ buyerId: id, trackStatus: { $eq: 'Cancel' } }).countDocuments()

// 		let resultObj = {
// 			result,
// 			metadata: {
// 				totalCount: allCount,
// 				deliveryCount: deliveryCount,
// 				cancelCount: cancelCount
// 			}
// 		}
// 		response.successResponse(res, 200, 'get successfully', resultObj)
// 	} catch (error) {
// 		console.log(filter)
// 		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
// 	}
// })

// router.post('/searchBy/status/option', auth, async (req, res) => {
// 	try {
// 		// let id = req._id//6352375882e11462fea8c888
// 		let id = req.userId
// 		let { trackStatus, key, page, limit } = req.query
// 		let filter = {}
// 		let totalCount
// 		let result
// 		let deliveryCount
// 		let allCount
// 		let pageCount
// 		let cancelCount

// 		// let OrderIdFind = await Order.find({ _id: '63b686c8ba240d24c9fc6f59' })
// 		// let orderId = OrderIdFind.map(ele => ele.orderId)
// 		// orderId = orderId.toString()
// 		// let search = async query => {
// 		// 	return await Order.find(query).limit(limit * 1).skip(skip)
// 		// }
// 		// let searchCount = async query => {
// 		// 	return await Order.find(query).countDocuments()
// 		// }
// 		let skip = (page - 1) * limit
// 		let allCondition = {
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			$or: [
// 				{ 'productDetails.productId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.accessoriesId.deviceName': { $regex: '^' + key + '', $options: 'i' } }
// 			]
// 		}
// 		let cancelCondition = {
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Cancel' },
// 			$or: [
// 				{ 'productDetails.productId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.accessoriesId.deviceName': { $regex: '^' + key + '', $options: 'i' } }
// 			]
// 		}
// 		let deliveredCondition = {
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Delivered' },
// 			$or: [
// 				{ 'productDetails.productId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.accessoriesId.deviceName': { $regex: '^' + key + '', $options: 'i' } }
// 			]
// 		}

// 		if (trackStatus === 'All' || (key && key != '')) {
// 			console.log('===================>')
// 			// result = await search({ buyerId: id })
// 			result = await Order.find(allCondition).limit(limit * 1).skip(skip)
// 		}
// 		console.log('result==============>>>>>>>>>>>>>>>', result)
// 		console.log('allCondition', allCondition)

// 		if (trackStatus == 'Cancalled' || (key && key != '')) {
// 			// result = await search({ buyerId: id, trackStatus: { $eq: 'Cancel' } })
// 			result = await Order.find(cancelCondition).limit(limit * 1).skip(skip)
// 		}
// 		if (trackStatus == 'Delivered' || (key && key != '')) {
// 			result = await Order.find(deliveredCondition).limit(limit * 1).skip(skip)
// 		}
// 		allCount = await Order.countDocuments({
// 			buyerId: id,
// 			status: { $eq: 'active' }
// 		})
// 		deliveryCount = await Order.countDocuments({
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Delivered' }
// 		})
// 		cancelCount = await Order.countDocuments({
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Cancel' }
// 		})
// 		console.log('>>>>>>>>>>>>>>>>>>', result.length)
// 		pageCount = result.length

// 		console.log('>>>>>>>>>>>>>>>>>resultresultresult', result)
// 		let resultObj = {
// 			result,
// 			metadata: {
// 				totalCount: allCount,
// 				deliveryCount: deliveryCount,
// 				cancelCount: cancelCount,
// 				pageCount: pageCount
// 			}
// 		}
// 		response.successResponse(res, 200, 'get successfully', resultObj)
// 	} catch (error) {
// 		console.log(error)
// 		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
// 	}
// })

// router.post('/searchBy/placeOrder', auth, async (req, res) => {
// 	try {
// 		let id = req.userId
// 		let { trackStatus, key, page, limit } = req.query
// 		let filter = {}
// 		let totalCount
// 		let result
// 		let deliveryCount
// 		let allCount
// 		let pageCount
// 		let cancelCount

// 		let skip = (page - 1) * limit
// 		let allCondition = {
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			$or: [
// 				{ 'productDetails.productId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.accessoriesId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.dealerProductId.deviceId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{
// 					'productDetails.dealerAccessoriesId.accessoriesId.deviceName': {
// 						$regex: '^' + key + '',
// 						$options: 'i'
// 					}
// 				}
// 			]
// 		}

// 		let cancelCondition = {
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Cancel' },
// 			$or: [
// 				{ 'productDetails.productId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.accessoriesId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.dealerProductId.deviceId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{
// 					'productDetails.dealerAccessoriesId.accessoriesId.deviceName': {
// 						$regex: '^' + key + '',
// 						$options: 'i'
// 					}
// 				}
// 			]
// 		}
// 		let deliveredCondition = {
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Delivered' },
// 			$or: [
// 				{ 'productDetails.productId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.accessoriesId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.dealerProductId.deviceId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{
// 					'productDetails.dealerAccessoriesId.accessoriesId.deviceName': {
// 						$regex: '^' + key + '',
// 						$options: 'i'
// 					}
// 				}
// 			]
// 		}

// 		if (trackStatus === 'All' || (key && key != '')) {
// 			result = await Order.find(allCondition).limit(limit * 1).skip(skip)
// 		}

// 		if (trackStatus == 'Cancalled' || (key && key != '')) {
// 			result = await Order.find(cancelCondition).limit(limit * 1).skip(skip)
// 		}
// 		if (trackStatus == 'Delivered' || (key && key != '')) {
// 			result = await Order.find(deliveredCondition).limit(limit * 1).skip(skip)
// 		}

// 		allCount = await Order.countDocuments({
// 			buyerId: id,
// 			status: { $eq: 'active' }
// 		})

// 		deliveryCount = await Order.countDocuments({
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Delivered' }
// 		})
// 		cancelCount = await Order.countDocuments({
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Cancel' }
// 		})
// 		if (trackStatus === 'All') {
// 			pageCount = allCount
// 		} else if (trackStatus === 'Cancalled') {
// 			pageCount = cancelCount
// 		} else if (trackStatus === 'Delivered') {
// 			pageCount = deliveryCount
// 		}

// 		let resultObj = {
// 			result,
// 			metadata: {
// 				totalCount: allCount,
// 				deliveryCount: deliveryCount,
// 				cancelCount: cancelCount,
// 				pageCount: pageCount
// 			}
// 		}
// 		response.successResponse(res, 200, 'get successfully', resultObj)
// 	} catch (error) {}
// })

// router.post('/searchBy/placeOrder', auth, async (req, res) => {
// 	try {
// 		let id = req.userId
// 		let { trackStatus, key, page, limit } = req.query
// 		let filter = {}
// 		let totalCount
// 		let result
// 		let deliveryCount
// 		let allCount
// 		let pageCount
// 		let cancelCount
// 		let skip = (page - 1) * limit
// 		let allCondition = {
// 			buyerId: '6352375882e11462fea8c888',
// 			status: { $eq: 'active' },
// 			$or: [
// 				{ 'productDetails.productId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.accessoriesId.deviceName': { $regex: '^' + key + '', $options: 'i' } }
// 			]
// 		}
// 		let cancelCondition = {
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Cancel' },
// 			$or: [
// 				{ 'productDetails.productId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.accessoriesId.deviceName': { $regex: '^' + key + '', $options: 'i' } }
// 			]
// 		}
// 		let deliveredCondition = {
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Delivered' },
// 			$or: [
// 				{ 'productDetails.productId.deviceName': { $regex: '^' + key + '', $options: 'i' } },
// 				{ 'productDetails.accessoriesId.deviceName': { $regex: key + '', $options: 'i' } }
// 			]
// 		}
// 		if (trackStatus === 'All' || (key && key != '')) {
// 			result = await Order.find(allCondition).limit(limit * 1).skip(skip)
// 		}
// 		if (trackStatus == 'Cancalled' || (key && key != '')) {
// 			result = await Order.find(cancelCondition).limit(limit * 1).skip(skip)
// 		}
// 		if (trackStatus == 'Delivered' || (key && key != '')) {
// 			result = await Order.find(deliveredCondition).limit(limit * 1).skip(skip)
// 		}
// 		allCount = await Order.countDocuments({
// 			buyerId: id,
// 			status: { $eq: 'active' }
// 		})
// 		deliveryCount = await Order.countDocuments({
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Delivered' }
// 		})
// 		cancelCount = await Order.countDocuments({
// 			buyerId: id,
// 			status: { $eq: 'active' },
// 			trackStatus: { $eq: 'Cancel' }
// 		})
// 		pageCount = result.length
// 		let resultObj = {
// 			result,
// 			metadata: {
// 				totalCount: allCount,
// 				deliveryCount: deliveryCount,
// 				cancelCount: cancelCount,
// 				pageCount: pageCount
// 			}
// 		}
// 		console.log('<<<<<resultObj>>>>>', resultObj)

// 		response.successResponse(res, 200, 'get successfully', resultObj)
// 	} catch (error) {}
// })

router.post("/searchBy/placeOrder", auth, async (req, res) => {
  // console.log('=================trackStatus======>', req.body)
  try {
    //dispatch,reject,successful
    let id = req.userId;
    let { trackStatus, key, page, limit } = req.query;

    let filter = {};
    let totalCount;
    let result;
    let deliveryCount;
    let allCount;
    let pageCount;
    let cancelCount;
    let dispatchCount;
    let successfullCount;
    let rejectCount;

    let skip = (page - 1) * limit;
    let allCondition = {
      buyerId: id,
      status: { $eq: "active" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };
    let cancelCondition = {
      buyerId: id,
      status: { $eq: "active" },
      trackStatus: { $eq: "Cancel" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };

    let dispatchCondition = {
      status: { $eq: "active" },
      buyerId: id,
      trackStatus: { $eq: "Dispatch" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };

    let rejectCondition = {
      status: { $eq: "active" },
      trackStatus: { $eq: "Reject" },
      buyerId: id,

      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };
    let SuccessfullCondition = {
      status: { $eq: "active" },
      trackStatus: { $eq: "Successful" },
      buyerId: id,

      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };
    let deliveredCondition = {
      buyerId: id,
      status: { $eq: "active" },
      trackStatus: { $eq: "Delivered" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };
    if (trackStatus == "All") {
      result = await Order.find(allCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Cancel") {
      result = await Order.find(cancelCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
      console.log("result", result);
    } else if (trackStatus == "Delivered") {
      result = await Order.find(deliveredCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Dispatch") {
      result = await Order.find(dispatchCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Reject") {
      result = await Order.find(rejectCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Successful") {
      result = await Order.find(SuccessfullCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    }

    allCount = await Order.countDocuments(allCondition);
    cancelCount = await Order.countDocuments(cancelCondition);
    deliveryCount = await Order.countDocuments(deliveredCondition);
    dispatchCount = await Order.countDocuments(dispatchCondition);
    rejectCount = await Order.countDocuments(rejectCondition);
    successfullCount = await Order.countDocuments(SuccessfullCondition);

    if (trackStatus === "All") {
      pageCount = allCount;
    } else if (trackStatus === "Cancel") {
      pageCount = cancelCount;
    } else if (trackStatus === "Delivered") {
      pageCount = deliveryCount;
    } else if (trackStatus === "Dispatch") {
      pageCount = dispatchCount;
    } else if (trackStatus === "Reject") {
      pageCount = rejectCount;
    } else if (trackStatus === "Successful") {
      pageCount = successfullCount;
    }
    // pageCount = result.length
    let resultObj = {
      result,
      metadata: {
        totalCount: allCount,
        deliveryCount: deliveryCount,
        cancelCount: cancelCount,
        successfullCount: successfullCount,
        rejectCount: rejectCount,
        dispatchCount: dispatchCount,
        pageCount: pageCount,
      },
    };
    console.log("result", resultObj);

    response.successResponse(res, 200, "get successfully", resultObj);
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.post("/searchBy/placeOrder/:id", auth, async (req, res) => {
  // console.log('=================trackStatus======>', req.body)
  try {
    //dispatch,reject,successful
    let id = req.params.id; // This id is a Dealer
    let { trackStatus, key, page, limit } = req.query;

    let filter = {};
    let totalCount;
    let result;
    let deliveryCount;
    let allCount;
    let pageCount;
    let cancelCount;
    let dispatchCount;
    let successfullCount;
    let rejectCount;

    let skip = (page - 1) * limit;
    let allCondition = {
      buyerId: id,
      status: { $eq: "active" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };
    let cancelCondition = {
      buyerId: id,
      status: { $eq: "active" },
      trackStatus: { $eq: "Cancel" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };

    let dispatchCondition = {
      status: { $eq: "active" },
      buyerId: id,
      trackStatus: { $eq: "Dispatch" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };

    let rejectCondition = {
      status: { $eq: "active" },
      trackStatus: { $eq: "Reject" },
      buyerId: id,

      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };
    let SuccessfullCondition = {
      status: { $eq: "active" },
      trackStatus: { $eq: "Successful" },
      buyerId: id,

      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };
    let deliveredCondition = {
      buyerId: id,
      status: { $eq: "active" },
      trackStatus: { $eq: "Delivered" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };
    if (trackStatus == "All") {
      result = await Order.find(allCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Cancel") {
      result = await Order.find(cancelCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
      console.log("result", result);
    } else if (trackStatus == "Delivered") {
      result = await Order.find(deliveredCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Dispatch") {
      result = await Order.find(dispatchCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Reject") {
      result = await Order.find(rejectCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Successful") {
      result = await Order.find(SuccessfullCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    }

    allCount = await Order.countDocuments(allCondition);
    cancelCount = await Order.countDocuments(cancelCondition);
    deliveryCount = await Order.countDocuments(deliveredCondition);
    dispatchCount = await Order.countDocuments(dispatchCondition);
    rejectCount = await Order.countDocuments(rejectCondition);
    successfullCount = await Order.countDocuments(SuccessfullCondition);

    if (trackStatus === "All") {
      pageCount = allCount;
    } else if (trackStatus === "Cancel") {
      pageCount = cancelCount;
    } else if (trackStatus === "Delivered") {
      pageCount = deliveryCount;
    } else if (trackStatus === "Dispatch") {
      pageCount = dispatchCount;
    } else if (trackStatus === "Reject") {
      pageCount = rejectCount;
    } else if (trackStatus === "Successful") {
      pageCount = successfullCount;
    }
    // pageCount = result.length
    let resultObj = {
      result,
      metadata: {
        totalCount: allCount,
        deliveryCount: deliveryCount,
        cancelCount: cancelCount,
        successfullCount: successfullCount,
        rejectCount: rejectCount,
        dispatchCount: dispatchCount,
        pageCount: pageCount,
      },
    };
    console.log("result", resultObj);

    response.successResponse(res, 200, "get successfully", resultObj);
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.post("/searchBy/recieveOrder", async (req, res) => {
  try {
    let { trackStatus, key, page, limit } = req.query;
    let filter = {};
    let totalCount;
    let result;
    let dispatchCount;
    let rejectCount;
    let successfullCount;
    let deliveredCount;
    let cancelCount;
    let pendingCount;
    let allCount;
    let pageCount;
    let { sellerId } = req.body;
    let skip = (page - 1) * limit;
    let allCondition = {
      sellerId: sellerId,
      status: { $eq: "active" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };

    let cancelCondition = {
      status: { $eq: "active" },
      sellerId: sellerId,
      trackStatus: { $eq: "Cancel" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };
    let pendingCondition = {
      sellerId: sellerId,
      status: { $eq: "active" },
      trackStatus: { $eq: "Pending" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };
    let dispatchCondition = {
      status: { $eq: "active" },
      sellerId: sellerId,
      trackStatus: { $eq: "Dispatch" },
      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };

    let rejectCondition = {
      status: { $eq: "active" },
      trackStatus: { $eq: "Reject" },
      sellerId: sellerId,

      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };

    let deliveredCondition = {
      status: { $eq: "active" },
      trackStatus: { $eq: "Delivered" },
      sellerId: sellerId,

      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };
    let successfullCondition = {
      status: { $eq: "active" },
      trackStatus: { $eq: "Successful" },
      sellerId: sellerId,

      $or: [
        {
          "productDetails.productId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerProductId.deviceId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
        {
          "productDetails.dealerAccessoriesId.accessoriesId.deviceName": {
            $regex: "^" + key + "",
            $options: "i",
          },
        },
      ],
    };

    if (trackStatus === "All") {
      result = await Order.find(allCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Cancel") {
      result = await Order.find(cancelCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Dispatch") {
      result = await Order.find(dispatchCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Reject") {
      result = await Order.find(rejectCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Pending") {
      console.log("<<<<<<pending>>>>>>", pendingCondition);
      result = await Order.find(pendingCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Delivered") {
      result = await Order.find(deliveredCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    } else if (trackStatus == "Successful") {
      result = await Order.find(successfullCondition)
        .limit(limit * 1)
        .skip(skip)
        .sort({ _id: -1 });
    }
    allCount = await Order.countDocuments(allCondition);
    dispatchCount = await Order.countDocuments(dispatchCondition);
    rejectCount = await Order.countDocuments(rejectCondition);
    cancelCount = await Order.countDocuments(cancelCondition);
    pendingCount = await Order.countDocuments(pendingCondition);
    deliveredCount = await Order.countDocuments(deliveredCondition);
    successfullCount = await Order.countDocuments(successfullCondition);

    console.log("<<<<<<result>>>>>>", result);

    // pageCount = result.length

    if (trackStatus === "All") {
      pageCount = allCount;
    } else if (trackStatus === "Cancel") {
      pageCount = cancelCount;
    } else if (trackStatus === "Dispatch") {
      pageCount = dispatchCount;
    } else if (trackStatus === "Reject") {
      pageCount = rejectCount;
    } else if (trackStatus === "Pending") {
      pageCount = pendingCount;
    } else if (trackStatus === "Delivered") {
      pageCount = deliveredCount;
    } else if (trackStatus === "Successful") {
      pageCount = successfullCount;
    }

    let resultObj = {
      result,
      metadata: {
        totalCount: allCount,
        rejectCount: rejectCount,
        pendingCount: pendingCount,
        dispatchCount: dispatchCount,
        cancelCount: cancelCount,
        deliveredCount: deliveredCount,
        successfullCount: successfullCount,

        pageCount: pageCount,
      },
    };
    response.successResponse(res, 200, "get successfully", resultObj);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "error" });
  }
});

router.get("/getAll/order/:dealerId", auth, async (req, res) => {
  try {
    // log.dubug("/getAll/order/:dealerId")
    let { key, page, limit } = req.query;
    let skip = (page - 1) * limit;
    limit = limit * 1;
    let result;
    let totalCount;
    let dealerId = req.params.dealerId;
    let condition = { status: { $eq: "active" }, sellerId: dealerId, markDelivered: true, trackStatus :{$eq: "Delivered"} }
    if (key && key !="") {
      result = await Order.find(condition).skip(skip).limit(limit).sort({_id:-1});
      totalCount= await Order.countDocuments(condition)
    }else{
      result = await Order.find(condition).skip(skip).limit(limit).sort({_id:-1});
      totalCount= await Order.countDocuments(condition)
    }
    let respData={
      metadata:{
        totalOrder:totalCount
      },
      result
    }
    response.successResponse(res, 200, "Data fetched successfully", respData)
  } catch (error) {
    console.log(error)
    response.errorMsgResponse(res, 301, "Something went wrong")
  }
})

router.get("/earnedAmount/:dealerId", async(req, res)=>{
  try {
    let { key, page, limit } = req.query;
    let skip = (page - 1) * limit;
    limit = limit * 1;
    let result;
    let totalCount;
    let sum = 0;
    let dealerId = req.params.dealerId;
    let condition = { status: { $eq: "active" }, sellerId: dealerId, markDelivered: true, trackStatus :{$eq: "Delivered"} }
    if (key && key !="") {
      result = await Order.find(condition).skip(skip).limit(limit).sort({_id:-1});
      
      let totalEarn = result.map((e) => e.paymentDetails.totalPrice);
      for (let i = 0; i < totalEarn.length; i += 1) {
        sum += totalEarn[i];
      }
      totalCount= await Order.countDocuments(condition)
    }else{
      result = await Order.find(condition).skip(skip).limit(limit).sort({_id:-1});
      console.log()
      let totalEarn = result.map((e) => e.paymentDetails.totalPrice);

      for (let i = 0; i < totalEarn.length; i += 1) {
        sum += totalEarn[i];
      }
      totalCount= await Order.countDocuments(condition)
    }
    let respData={
      metadata:{
        totalOrder:totalCount,
        totalAmount: sum
      },
      result
    }
    response.successResponse(res, 200, "Data fetched successfully", respData)
  } catch (error) {
    console.log(error)
    response.errorMsgResponse(res, 301, "Something went wrong")
  }
})
module.exports = router;

///searchBy/recieveOrder

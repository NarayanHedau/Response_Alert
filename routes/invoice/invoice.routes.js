let router = require("express").Router();
let response = require("../../helper/response");
const commonController = require("../../controller/commonController");
let Invoice_generate = require("../../helper/invoice")
const ERRORS = require("../../helper/errorMessage");
let log = require('../../helper/logger')
const _ = require("lodash");
const mongoose = require("mongoose");
const auth = require("../../helper/auth");
const Customer = mongoose.model("Customer");
const User = mongoose.model("User");
const Cart = mongoose.model("Cart");
const Order = mongoose.model("Order");
const Invoice = mongoose.model("Invoice");
const email = require("../sendmail/notify");
const moment = require("moment");
const Product = require("../../model/product/product.model");

const crypto = require('crypto')

// create Customer Invoice
// router.post("/add/invoice", auth, async (req, res) => {
//   try {
//     log.debug("/add/customer/invoice");
//     let invoice_No = crypto.randomBytes(8).toString("hex");
//     let { type, orderId } = req.body;
//     if (type=="customer") {
//       let products = [];
//     let orderData = await Order.findOne({
//       status: { $eq: "active" },
//       _id: orderId,
//     })
//       .populate({ path: "sellerId", model: "User" });
//     let shipmentAmt = orderData.paymentDetails.onlyDeliveryAmt
//     let totalPrice = orderData.paymentDetails.totalPrice / 100
//     if (orderData) {
//       orderData.productDetails.forEach((ele) => {
//         products.push({
//           productId: ele.dealerProductId?.deviceId?._id ? ele.dealerProductId?.deviceId?._id : ele.dealerAccessoriesId?.accessoriesId?._id,
//           item_name: ele.dealerProductId?.deviceId?.deviceName ? ele.dealerProductId?.deviceId?.deviceName : ele.dealerAccessoriesId?.accessoriesId?.deviceName,
//           quantity: ele.quantity,
//           unit_price: ele.dealerProductId?.price ? ele.dealerProductId?.price : ele.dealerAccessoriesId?.price,
//           amount: ele.productQtyAmt,
//         });
//       });
//     }
//     let data = {
//       invoice_No: invoice_No,
//       from_address: "Perstech Innovation.....",
//       to_address: orderData.address,
//       itemArray: products,
//       shipment: shipmentAmt,
//       total_amount: totalPrice,
//       customerName: orderData.customerName,
//       sendTo: "Dealer",
//       buyerId: orderData.buyerId,
//       sellerId: orderData.sellerId,
//       orderId: orderData._id
//     };
//     let invoiceData = await Invoice(data).save();
//     await Invoice_generate.InvoicePDF(invoiceData._id, invoice_No)
//     response.successResponse(
//       res,
//       200,
//       "Invoice added successfully",
//       invoiceData
//     );
//     }else if (type=="dealer") {
//       let orderData = await Order.findOne({
//         status: { $eq: "active" },
//         _id: orderId,
//       });
//       let products = [];
//       let shipmentAmt = orderData.paymentDetails.onlyDeliveryAmt
//       let totalPrice = orderData.paymentDetails.totalPrice / 100
//       if (orderData) {
//         orderData.productDetails.map((ele) => {
//           products.push({
//             productId: ele.productId?._id ? ele.productId?._id : ele.accessoriesId?._id,
//             item_name: ele.productId?.deviceName ? ele.productId?.deviceName : ele.accessoriesId?.deviceName,
//             quantity: ele.quantity,
//             unit_price: ele.productId?.price ? ele.productId?.price : ele.accessoriesId?.price,
//             amount: ele.productQtyAmt
//           });
//         });
//       }
//       console.log()
//       let data = {
//         invoice_No: invoice_No,
//         from_address: "Perstech Innovation.....",//   make it dy namic
//         to_address: orderData.address,
//         itemArray: products,
//         shipment: shipmentAmt,
//         total_amount: totalPrice,
//         dealerName: orderData.dealerName,
//         sendTo: "Admin",
//         paymentMethod: orderData.paymentDetails.paymentMethodType,
//         buyerId: orderData.buyerId,
//         sellerId: orderData.sellerId,
//         orderId: orderData._id
//       };
//       let invoiceData = await Invoice(data).save();
//       await Invoice_generate.InvoicePDF(invoiceData._id, invoice_No)
  
//       response.successResponse(
//         res,
//         200,
//         "Invoice added successfully",
//         invoiceData
//       );
//     }
    
//   } catch (error) {
//     console.log(error);
//     response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
//   }
// });

// router.post("/add/customer/invoice", auth, async (req, res) => {
//   try {
//     log.debug("/add/customer/invoice");
//     let invoice_No = crypto.randomBytes(8).toString("hex");
//     let { orderId } = req.body;
//     let products = [];
//     let orderData = await Order.findOne({
//       status: { $eq: "active" },
//       _id: orderId,
//     })
//       .populate({ path: "sellerId", model: "User" });
//     let shipmentAmt = orderData.paymentDetails.onlyDeliveryAmt
//     let totalPrice = orderData.paymentDetails.totalPrice / 100
//     if (orderData) {
//       orderData.productDetails.forEach((ele) => {
//         products.push({
//           productId: ele.dealerProductId?.deviceId?._id ? ele.dealerProductId?.deviceId?._id : ele.dealerAccessoriesId?.accessoriesId?._id,
//           item_name: ele.dealerProductId?.deviceId?.deviceName ? ele.dealerProductId?.deviceId?.deviceName : ele.dealerAccessoriesId?.accessoriesId?.deviceName,
//           quantity: ele.quantity,
//           unit_price: ele.dealerProductId?.price ? ele.dealerProductId?.price : ele.dealerAccessoriesId?.price,
//           amount: ele.productQtyAmt,
//         });
//       });
//     }
//     let data = {
//       invoice_No: invoice_No,
//       from_address: "Perstech Innovation.....",
//       to_address: orderData.address,
//       itemArray: products,
//       shipment: shipmentAmt,
//       total_amount: totalPrice,
//       customerName: orderData.customerName,
//       sendTo: "Dealer",
//       buyerId: orderData.buyerId,
//       sellerId: orderData.sellerId,
//       orderId: orderData._id
//     };
//     let invoiceData = await Invoice(data).save();
//     await Invoice_generate.InvoicePDF(invoiceData._id, invoice_No)
//     response.successResponse(
//       res,
//       200,
//       "Invoice added successfully",
//       invoiceData
//     );
//   } catch (error) {
//     console.log(error);
//     response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
//   }
// });

// router.post("/add/dealer/invoice", auth, async (req, res) => {
//   try {
//     log.debug("/add/dealer/invoice");
//     let invoice_No = crypto.randomBytes(8).toString("hex");
//     let { orderId } = req.body;
//     let orderData = await Order.findOne({
//       status: { $eq: "active" },
//       _id: orderId,
//     });
//     let products = [];
//     let shipmentAmt = orderData.paymentDetails.onlyDeliveryAmt
//     let totalPrice = orderData.paymentDetails.totalPrice / 100
//     if (orderData) {
//       orderData.productDetails.map((ele) => {
//         products.push({
//           productId: ele.productId?._id ? ele.productId?._id : ele.accessoriesId?._id,
//           item_name: ele.productId?.deviceName ? ele.productId?.deviceName : ele.accessoriesId?.deviceName,
//           quantity: ele.quantity,
//           unit_price: ele.productId?.price ? ele.productId?.price : ele.accessoriesId?.price,
//           amount: ele.productQtyAmt
//         });
//       });
//     }
//     console.log()
//     let data = {
//       invoice_No: invoice_No,
//       from_address: "Perstech Innovation.....",//   make it dy namic
//       to_address: orderData.address,
//       itemArray: products,
//       shipment: shipmentAmt,
//       total_amount: totalPrice,
//       dealerName: orderData.dealerName,
//       sendTo: "Admin",
//       paymentMethod: orderData.paymentDetails.paymentMethodType,
//       buyerId: orderData.buyerId,
//       sellerId: orderData.sellerId,
//       orderId: orderData._id
//     };
//     let invoiceData = await Invoice(data).save();
//     await Invoice_generate.InvoicePDF(invoiceData._id, invoice_No)

//     response.successResponse(
//       res,
//       200,
//       "Invoice added successfully",
//       invoiceData
//     );
//   } catch (error) {
//     console.log(error);
//     response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
//   }
// });

// get all Received and send payment Invoice on Dealer Dashboard
router.post("/getAll/invoice", auth, async (req, res) => {
  try {
    log.debug("/getAll/dealer/receive_payment/sent_payment/invoice");
    let id = req.userId;
    // let id = "63aa855618fcdc62bec96f6c";
    let { page, limit, key, type, startDate, endDate } = req.query;
    let skip = (page - 1) * limit;
    limit = limit * 1;
    let result;
    let total_count;
    let page_count;
    let searchCondition = {
      $or: [
        {
          "to_address.shippingAddress.name": { $regex: key, $options: "i" },
        },
        {
          "itemArray.item_name": { $regex: key, $options: "i" },
        },
      ],
    };
    let condition 
    let receivedPaymentCondition ={
      sellerId: id,
      status: { $eq: "active" },
      visible: true,
    }
    let sentPaymentCondition={
      buyerId: id,
      status: { $eq: "active" },
      visible: true,
    }
    if (type == "Received Payments") {
      if (startDate&&endDate) {
        condition={...receivedPaymentCondition, updatedAt: {
          $gte: moment(startDate).startOf("day"),
          $lte: moment(endDate).endOf("day")
        }}
        if (key && key != "") {  
          condition = { ...receivedPaymentCondition, ...searchCondition }
          }
      }
      else if (key && key != "") {
        condition = {
          ...receivedPaymentCondition,
          ...searchCondition,
        };
      } else {
        condition = {
          ...receivedPaymentCondition
        };
      }
    } else if (type == "Sent Payments") {
      if (startDate&&endDate) {
        condition={...sentPaymentCondition, updatedAt: {
          $gte: moment(startDate).startOf("day"),
          $lte: moment(endDate).endOf("day")
        }}
        if (key && key != "") {    
          condition = { ...sentPaymentCondition, ...searchCondition }
          }
      }
      else if (key && key != "") {
        condition = {
         ...sentPaymentCondition,
          ...searchCondition,
        };
      } else {
        condition = {
         ...sentPaymentCondition
        };
      }
    }
    result = await Invoice.find(condition).limit(limit).skip(skip);
    total_count = await Invoice.countDocuments(condition);
    page_count = result.length;
    let total_amount = result.map(e => parseInt(e.total_amount))
		let sum = 0
		for (let i = 0; i < total_amount.length; i += 1) {
			sum += total_amount[i]
		}
    let resData = {
      metaData: {
        total_count: total_count,
        page_count: page_count,
        total_amount:sum
      },
      result
    }
    response.successResponse(res, 200, 'Data fetched successfully', resData)
  } catch (error) {
    console.log(error)
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
  }
})

// get all Received and send payment Invoice on Admin Dashboard
router.get("/getAll/invoice/:id", auth, async (req, res) => {
  try {
    log.debug("/getAll/dealer/receive_payment/sent_payment/invoice");
    let id = req.params.id;
    // let id = "63aa855618fcdc62bec96f6c";
    let { page, limit, key, type, startDate, endDate } = req.query;
    let skip = (page - 1) * limit;
    limit = limit * 1;
    let result;
    let total_count;
    let page_count;
    let searchCondition = {
      $or: [
        {
          "to_address.shippingAddress.name": { $regex: key, $options: "i" },
        },
        {
          "itemArray.item_name": { $regex: key, $options: "i" },
        },
      ],
    };
    let condition 
    let receivedPaymentCondition ={
      sellerId: id,
      status: { $eq: "active" },
      visible: true,
    }
    let sentPaymentCondition={
      buyerId: id,
      status: { $eq: "active" },
      visible: true,
    }
    if (type == "Received Payments") {
      if (startDate&&endDate) {
        condition={...receivedPaymentCondition, updatedAt: {
          $gte: moment(startDate).startOf("day"),
          $lte: moment(endDate).endOf("day")
        }}
        if (key && key != "") {  
          condition = { ...receivedPaymentCondition, ...searchCondition }
          }
      }
      else if (key && key != "") {
    console.log(">>>>>>>>key && key !=>>>>>>>>")

        condition = {
          ...receivedPaymentCondition,
          ...searchCondition,
        };
      } else {
    console.log(">>>>>>>else condition=>>>>>>>>")

        condition = {
          ...receivedPaymentCondition
        };
      }
    } else if (type == "Sent Payments") {
      if (startDate&&endDate) {
        condition={...sentPaymentCondition, updatedAt: {
          $gte: moment(startDate).startOf("day"),
          $lte: moment(endDate).endOf("day")
        }}
        if (key && key != "") {    
          condition = { ...sentPaymentCondition, ...searchCondition }
          }
      }
      else if (key && key != "") {
        condition = {
         ...sentPaymentCondition,
          ...searchCondition,
        };
      } else {
        condition = {
         ...sentPaymentCondition
        };
      }
    }
    result = await Invoice.find(condition).limit(limit).skip(skip).populate("orderId")
    total_count = await Invoice.countDocuments(condition);
    page_count = result.length;
    let total_amount = result.map(e => parseInt(e.total_amount))
		let sum = 0
		for (let i = 0; i < total_amount.length; i += 1) {
			sum += total_amount[i]
		}
    let resData = {
      metaData: {
        total_count: total_count,
        page_count: page_count,
        total_amount:sum
      },
      result
    }
    response.successResponse(res, 200, 'Data fetched successfully', resData)
  } catch (error) {
    console.log(error)
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
  }
})

router.get("/getAll/customer/invoice", auth, async (req, res) => {
  try {
    log.debug("/getAll/customer/invoice");
    let id = req.userId;
    let { page, limit, key, startDate, endDate } = req.query;
    let skip = (page - 1) * limit;
    limit = limit * 1;
    let searchCondition = {
      $or: [
        {
          "to_address.shippingAddress.name": { $regex: key, $options: "i" },
        },
        {
          "itemArray.item_name": { $regex: key, $options: "i" },
        },
      ],
    };
    let filterObj = {
      status: { $eq: "active" },
      buyerId: id,
      visible: true
    }

    if (startDate && endDate) {
      filterObj = {
        ...filterObj, updatedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
      if (key && key != "") {
        filterObj = { ...filterObj, ...searchCondition }
      }
    }

    else if (key && key != '') {
      filterObj = { ...filterObj, ...searchCondition }
    }

    let result = await Invoice.find(filterObj).limit(limit).skip(skip);
    let total_count = await Invoice.countDocuments(filterObj);
    let page_count = result.length;

    let total_amount = result.map(e => parseInt(e.total_amount))
		let sum = 0
		for (let i = 0; i < total_amount.length; i += 1) {
			sum += total_amount[i]
		}

    let resData = {
      metaData: {
        total_count: total_count,
        page_count: page_count,
        total_amount:sum
      },
      result,
    };
    response.successResponse(res, 200, "Record fetched successfully", resData)
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
})

router.get("/getAll/admin/invoices", auth, async(req, res)=>{
  try {
    log.debug("/getAll/admin/invoices")
    let userId= req.userId;
    let {page, limit, key, startDate, endDate}= req.query;
    let skip = (page - 1) * limit;
    limit = limit * 1;
    let searchCondition = {
      $or: [
        {
          "to_address.shippingAddress.name": { $regex: key, $options: "i" },
        },
        {
          "itemArray.item_name": { $regex: key, $options: "i" },
        },
      ],
    };
    let filterObj = {
      status: { $eq: "active" },
      sellerId: userId,
      visible: true
    }

    if (startDate && endDate) {
      filterObj = {
        ...filterObj, updatedAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
      if (key && key != "") {
        filterObj = { ...filterObj, ...searchCondition }
      }
    }

    else if (key && key != '') {
      filterObj = { ...filterObj, ...searchCondition }
    }

    let result = await Invoice.find(filterObj).limit(limit).skip(skip);
    let total_count = await Invoice.countDocuments(filterObj);
    let page_count = result.length;

    let total_amount = result.map(e => parseInt(e.total_amount))
		let sum = 0
		for (let i = 0; i < total_amount.length; i += 1) {
			sum += total_amount[i]
		}

    let resData = {
      metaData: {
        total_count: total_count,
        page_count: page_count,
        total_amount: sum
      },
      result,
    };
    response.successResponse(res, 200, "Record fetched successfully", resData)
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
})

router.get("/getBy/:id", async (req, res) => {
  try {
    log.debug("/invoice/getBy/:id")
    let id = req.params.id;
    let result = await Invoice.findOne({ status: { $eq: "active" }, _id: id });
    response.successResponse(res, 200, "Data fetched successfully", result);
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});
module.exports = router;

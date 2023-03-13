let router = require("express").Router();
let response = require("../helper/response");
let log = require("../helper/logger");
let config = require("../config.json")
const mongoose = require("mongoose");
const ERRORS = require("../helper/errorMessage");
// const pdf = require('html-pdf');
const auth = require("../helper/auth");
const Order = mongoose.model("Order");
const InvoiceModel = mongoose.model("Invoice");
const User = mongoose.model("User");
const puppeteer = require('puppeteer');
var pdf = require("pdf-creator-node");
var fs = require('fs')
var path = require('path')
const crypto = require('crypto');
const { userInfo } = require("os");
const Invoice = mongoose.model("Invoice");
let pdfUrl
const InvoicePDF = async ({ invoiceId, invoiceName, orderId }) => {
  try {
    const browser = await puppeteer.launch();
    // let invoiceData = await Invoice.findOne({_id: req.body.id, status:{$eq:"active"} })
    // Create a new page
    const page = await browser.newPage();

    // Website URL to export as pdf
    const website_url = `${config.adminUrl}/auth/invoice/${invoiceId}`;

    // Open URL in current page
    await page.goto(website_url, { waitUntil: 'networkidle0' });

    //To reflect CSS used for screens instead of print
    await page.emulateMediaType('screen');

    if (!fs.existsSync('./public/output')) {
      fs.mkdirSync('./public/output')
    }
    // Downlaod the PDF
    const pdf = await page.pdf({
      path: `./public/output/${invoiceName}.pdf`,
      margin: { top: '50px', right: '10px', bottom: '50px', left: '10px' },
      printBackground: true,
      format: 'A4',
    });

    // Close the browser instance
    pdfUrl = `${config.staticFilesUrl}pdf/${invoiceName}.pdf`;
    await InvoiceModel.findOneAndUpdate({ _id: invoiceId }, { $set: { documentUrl: pdfUrl } })
    await Order.findOneAndUpdate({ _id: orderId }, { $set: { documentUrl: pdfUrl, invoiceId: invoiceId } })

    await browser.close();
  } catch (error) {
    console.log(error)
    // res.send(error)

  }
}

const createInvoice = async (orderId, type) => {
  let invoice_No = crypto.randomBytes(8).toString("hex");
  // let { type} = req.body;
  if (type == "customer") {
    console.log(">>>>>>>>>customer")
    let products = [];
    let orderData = await Order.findOne({
      status: { $eq: "active" },
      _id: orderId,
    })
      .populate({ path: "sellerId", model: "User" });
    let sellerData = await User.findOne({ _id: orderData.sellerId })
    let sellerAddress = sellerData.billingAddress.filter(e => e.defaultAddress)
    console.log(">>>>>>>>>>>>>sellerAddress", sellerAddress)
    let shipmentAmt = orderData.paymentDetails.onlyDeliveryAmt
    let totalPrice = orderData.paymentDetails.totalPrice / 100
    if (orderData) {
      orderData.productDetails.forEach((ele) => {
        products.push({
          productId: ele.dealerProductId?.deviceId?._id ? ele.dealerProductId?.deviceId?._id : ele.dealerAccessoriesId?.accessoriesId?._id,
          item_name: ele.dealerProductId?.deviceId?.deviceName ? ele.dealerProductId?.deviceId?.deviceName : ele.dealerAccessoriesId?.accessoriesId?.deviceName,
          quantity: ele.quantity,
          unit_price: ele.dealerProductId?.price ? ele.dealerProductId?.price : ele.dealerAccessoriesId?.price,
          amount: ele.productQtyAmt,
        });
      });
    }
    let data = {
      invoice_No: invoice_No,
      from_address: sellerAddress[0],
      to_address: orderData.address,
      itemArray: products,
      shipment: shipmentAmt,
      total_amount: totalPrice,
      customerName: orderData.customerName,
      sendTo: "Dealer",
      buyerId: orderData.buyerId,
      sellerId: orderData.sellerId,
      orderId: orderData._id
    };
    let invoiceData = await InvoiceModel(data).save();
    await InvoicePDF({ invoiceId: invoiceData._id, invoiceName: invoice_No, orderId: orderId })
    // response.successResponse(
    //   res,
    //   200,
    //   "Invoice added successfully",
    //   invoiceData
    // );
  } else if (type == "dealer") {
    console.log(">>>>>>>>>dealer")

    let orderData = await Order.findOne({
      status: { $eq: "active" },
      _id: orderId,
    });
    let sellerData = await User.findOne({ _id: orderData.sellerId })
    let products = [];
    let shipmentAmt = orderData.paymentDetails.onlyDeliveryAmt
    let totalPrice = orderData.paymentDetails.totalPrice / 100
    if (orderData) {
      orderData.productDetails.map((ele) => {
        products.push({
          productId: ele.productId?._id ? ele.productId?._id : ele.accessoriesId?._id,
          item_name: ele.productId?.deviceName ? ele.productId?.deviceName : ele.accessoriesId?.deviceName,
          quantity: ele.quantity,
          unit_price: ele.productId?.price ? ele.productId?.price : ele.accessoriesId?.price,
          amount: ele.productQtyAmt
        });
      });
    }
    console.log()
    let data = {
      invoice_No: invoice_No,
      from_address: sellerData.billingAddress[0],//   make it dy namic
      to_address: orderData.address,
      itemArray: products,
      shipment: shipmentAmt,
      total_amount: totalPrice,
      dealerName: orderData.dealerName,
      sendTo: "Admin",
      paymentMethod: orderData.paymentDetails.paymentMethodType,
      buyerId: orderData.buyerId,
      sellerId: orderData.sellerId,
      orderId: orderData._id
    };
    let invoiceData = await InvoiceModel(data).save();
    await InvoicePDF({ invoiceId: invoiceData._id, invoiceName: invoice_No, orderId: orderId })
  }
}
module.exports = { createInvoice }

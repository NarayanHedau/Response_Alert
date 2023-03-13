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
const Accessories = mongoose.model("Accessories");
const DealerAccessories = mongoose.model("DealerAccessories");
const Device_Dealer_Inventory_Mgmt = mongoose.model(
  "Device_Dealer_Inventory_Mgmt"
);
const User = mongoose.model("User");
const Cart = mongoose.model("Cart");
const email = require("../sendmail/notify");
const moment = require("moment");

//add to cart Product from Dealer Side
router.post("/add", auth, async (req, res) => {
  try {
    log.debug("/add/Cart");
    let userId = req.userId;
    let productId = req.body.productId;
    let cartCondition = {
      productId: productId,
      userId: userId,
      status: { $eq: "active" },
    };

    let productData = await Product.findOne({
      _id: productId,
      status: { $eq: "active" },
    });

    let totalPrice =
      parseInt(productData.price * req.body.quantity) +
      parseInt(req.body.deliveryCharges);
    let totalProductPrice = parseInt(productData.price * req.body.quantity);
    let deliveryPrice = parseInt(req.body.deliveryCharges);

    let cartData = await Cart.findOne(cartCondition);
    if (!cartData) {
      let data = {
        productQtyAmt: totalProductPrice,
        onlyDeliveryAmt: deliveryPrice,
        ...req.body,
        totalPrice: totalPrice,
        userId: userId,
      };
      let result = await Cart(data).save();
      response.successResponse(res, 200, "Record Added Successfully", result);
    } else {
      let updateQuantity = cartData.quantity + 1;
      totalPrice = totalPrice + parseInt(productData.price * 1);
      totalProductPrice = totalProductPrice + parseInt(productData.price * 1);
      cartData = await Cart.findOneAndUpdate(
        cartCondition,
        {
          $set: {
            quantity: updateQuantity,
            totalPrice: totalPrice,
            productQtyAmt: totalProductPrice,
          },
        },
        {
          new: true,
        }
      );
      if (cartData) {
        cartData = await Cart.findOne(cartCondition);
        response.successResponse(
          res,
          200,
          "Cart updated successfully",
          cartData
        );
      }
    }
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

//add to cart accessories from Dealer Side
router.post("/add/Cart/accessories", auth, async (req, res) => {
  try {
    log.debug("/add/Cart/accessories");
    let userId = req.userId;
    let accessoriesId = req.body.accessoriesId;
    let cartCondition = {
      accessoriesId: accessoriesId,
      userId: userId,
      status: { $eq: "active" },
    };

    let accessoriesData = await Accessories.findOne({
      _id: accessoriesId,
      status: { $eq: "active" },
    });
    let totalPrice =
      parseInt(accessoriesData.price * req.body.quantity) +
      parseInt(req.body.deliveryCharges);
    let totalProductPrice = parseInt(accessoriesData.price * req.body.quantity);
    let deliveryPrice = parseInt(req.body.deliveryCharges);

    let cartData = await Cart.findOne(cartCondition);
    if (!cartData) {
      let data = {
        productQtyAmt: totalProductPrice,
        onlyDeliveryAmt: deliveryPrice,
        ...req.body,
        totalPrice: totalPrice,
        userId: userId,
      };
      let result = await Cart(data).save();
      response.successResponse(res, 200, "Record Added Successfully", result);
    } else {
      let updateQuantity = cartData.quantity + 1;
      totalPrice = totalPrice + parseInt(accessoriesData.price * 1);
      totalProductPrice =
        totalProductPrice + parseInt(accessoriesData.price * 1);
      cartData = await Cart.findOneAndUpdate(
        cartCondition,
        {
          $set: {
            quantity: updateQuantity,
            totalPrice: totalPrice,
            productQtyAmt: totalProductPrice,
          },
        },
        {
          new: true,
        }
      );
      if (cartData) {
        cartData = await Cart.findOne(cartCondition);
        response.successResponse(
          res,
          200,
          "Cart updated successfully",
          cartData
        );
      }
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

//get all add to cart dealer
router.get("/getAll", auth, async (req, res) => {
  try {
    log.debug("/getAll/cart/");
    let userId = req.userId;
    let condition = {
      status: { $eq: "active" },
      userId: userId,
    };
    let cartData = await Cart.find(condition).populate([
      "productId",
      "accessoriesId",
    ]);
    let cartCount = await Cart.find(condition).countDocuments();

    // total Price with Delivery Charges
    let totalPrice = cartData.map((e) => parseInt(e.totalPrice));
    let sum = 0;
    for (let i = 0; i < totalPrice.length; i += 1) {
      sum += totalPrice[i];
    }

    // total Product and quantity Price
    let sumProductQtyAmt = 0;
    let productQtyAmt = cartData.map((e) => e.productQtyAmt);
    for (let i = 0; i < productQtyAmt.length; i += 1) {
      sumProductQtyAmt += productQtyAmt[i];
    }

    // Only Delivery Charges count
    let sumOnlyDeliveryAmt = 0;
    let onlyDeliveryAmt = cartData.map((e) => e.onlyDeliveryAmt);
    for (let i = 0; i < onlyDeliveryAmt.length; i += 1) {
      sumOnlyDeliveryAmt += onlyDeliveryAmt[i];
    }

    let respData = {
      metadata: {
        productQtyAmt: sumProductQtyAmt,
        onlyDeliveryAmt: sumOnlyDeliveryAmt,
        totalPrice: sum,
        totalCount: cartCount,
      },
      cartData,
    };
    response.successResponse(res, 200, "Data Fetched Successfully", respData);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

// router.get("/getAll", auth, async (req, res) => {
//   try {
//     let totalCount = await Cart.find({
//       status: { $eq: "active" },
//       userId: req.userId,
//     }).populate("productId");

//     console.log("totalCount", totalCount);

//     let getCount = totalCount.reduce((acc, ele) => {
//       return parseInt(acc) + parseInt(ele.totalPrice);
//     }, 0);
//     console.log("---totalCount->", getCount);

//     let respData = {
//       metadata: {
//         count: getCount,
//       },
//       totalCount,
//     };
//     response.successResponse(res, 200, "all cart added", respData);
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 400, "Something went wrong");
//   }
// });

router.get("/getBy/:id", auth, async (req, res) => {
  try {
    log.debug("/getBy/:id");
    let result = await Cart.findOne({ _id: req.params.id })
      .populate("productId")
      .select("-createdAt -updatedAt -__v");
    response.successResponse(res, 200, "fetched Data Successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.put("/updateBy/:id", auth, async (req, res) => {
  try {
    let productData;
    let id = req.params.id;
    let cartData = await Cart.findOne({ _id: id, status: { $eq: "active" } });
    if (req.body.type == "accessories") {
      productData = await Accessories.findOne({ _id: cartData.accessoriesId });
    } else if (req.body.type == "product") {
      productData = await Product.findOne({ _id: cartData.productId });
    }

    let productQtyAmt = parseInt(req.body.quantity * productData.price);
    let totalPrice =
      parseInt(req.body.quantity * productData.price) +
      parseInt(cartData.deliveryCharges);

    let data = {
      productQtyAmt: productQtyAmt,
      totalPrice: totalPrice,
      ...req.body,
    };
    let result = await Cart.findByIdAndUpdate(
      { _id: id },
      { $set: data },
      {
        new: true,
      }
    );

    if (result) {
      result = await Cart.findById({ _id: id });
      response.successResponse(res, 200, "cart updated successfully", result);
    } else {
      response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
    }
  } catch (error) {
    console.log(error);

    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.delete("/deleteBy/:id", auth, async (req, res) => {
  try {
    let id = req.params.id;

    let result = await Cart.findOneAndDelete({ _id: id });
    // let result = await Cart.findByIdAndUpdate(
    //   { _id: id },
    //   { status: "deleted" },
    //   {
    //     new: true,
    //   }
    // );
    response.successResponse(res, 200, "cart deleted successfully", {});
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});

router.put("/deleteManyCart", auth, async (req, res) => {
  try {
    log.debug("/delete/many/device");
    let ids = req.body.id;
    const data = await Cart.updateMany(
      { _id: { $in: ids }, status: { $eq: "active" } },
      { $set: { status: "deleted" } },
      { multi: true }
    );
    response.successResponse(res, 200, "carts deleted successfully", {});
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 301, "Something went wrong");
  }
});

// ===========================================================================
// Customer Side APIs

//add to cart Product from Customer Side
router.post("/addToCart/device/customerSide", auth, async (req, res) => {
  try {
    log.debug("/addToCart/device/customerSide");
    let customerId = req.userId;
    let productId = req.body.productId;

    let productData = await Device_Dealer_Inventory_Mgmt.findOne({
      _id: productId,
      status: { $eq: "active" },
    }).populate("deviceId");

    let totalPrice =
      parseInt(productData.deviceId.price * req.body.quantity) +
      parseInt(req.body.deliveryCharges);

    let totalProductPrice = parseInt(
      productData.deviceId.price * req.body.quantity
    );
    let deliveryPrice = parseInt(req.body.deliveryCharges);
    let cartCondition = {
      dealerProductId: productId,
      customerId: customerId,
      status: { $eq: "active" },
    };
    let cartData = await Cart.findOne(cartCondition);
    if (!cartData) {
      let data = {
        productQtyAmt: totalProductPrice,
        onlyDeliveryAmt: deliveryPrice,
        ...req.body,
        totalPrice: totalPrice,
        customerId: customerId,
        dealerProductId: productId,
      };
      let result = await Cart(data).save();
      response.successResponse(res, 200, "Record Added Successfully", result);
    } else {
      let updateQuantity = cartData.quantity + 1;
      totalPrice = totalPrice + parseInt(productData.deviceId.price * 1);
      totalProductPrice =
        totalProductPrice + parseInt(productData.deviceId.price * 1);
      cartData = await Cart.findOneAndUpdate(
        cartCondition,
        {
          $set: {
            quantity: updateQuantity,
            totalPrice: totalPrice,
            productQtyAmt: totalProductPrice,
          },
        },
        {
          new: true,
        }
      );
      if (cartData) {
        cartData = await Cart.findOne(cartCondition);
        response.successResponse(
          res,
          200,
          "Cart updated successfully",
          cartData
        );
      }
    }
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

//add to cart accessories from Customer Side
router.post("/addToCart/accessories/customerSide", auth, async (req, res) => {
  try {
    log.debug("/addToCart/accessories/customerSide");
    let customerId = req.userId;
    let dealerAccessoriesId = req.body.accessoriesId;
    let accessoriesData = await DealerAccessories.findOne({
      _id: dealerAccessoriesId,
      status: { $eq: "active" },
    }).populate("accessoriesId");

    let totalPrice =
      parseInt(accessoriesData.accessoriesId.price * req.body.quantity) +
      parseInt(req.body.deliveryCharges);

    let totalProductPrice = parseInt(
      accessoriesData.accessoriesId.price * req.body.quantity
    );

    let deliveryPrice = parseInt(req.body.deliveryCharges);
    let cartCondition = {
      dealerAccessoriesId: dealerAccessoriesId,
      customerId: customerId,
      status: { $eq: "active" },
    };
    let cartData = await Cart.findOne(cartCondition);
    if (!cartData) {
      let data = {
        productQtyAmt: totalProductPrice,
        onlyDeliveryAmt: deliveryPrice,
        ...req.body,
        totalPrice: totalPrice,
        customerId: customerId,
        dealerAccessoriesId: dealerAccessoriesId,
      };
      let result = await Cart(data).save();
      response.successResponse(res, 200, "Record Added Successfully", result);
    } else {
      let updateQuantity = cartData.quantity + 1;
      totalPrice =
        totalPrice + parseInt(accessoriesData.accessoriesId.price * 1);
      totalProductPrice =
        totalProductPrice + parseInt(accessoriesData.accessoriesId.price * 1);
      cartData = await Cart.findOneAndUpdate(
        cartCondition,
        {
          $set: { quantity: updateQuantity },
          totalPrice: totalPrice,
          productQtyAmt: totalProductPrice,
        },
        {
          new: true,
        }
      );
      if (cartData) {
        cartData = await Cart.findOne(cartCondition);
        response.successResponse(
          res,
          200,
          "Cart updated successfully",
          cartData
        );
      }
    }
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

// get all add to cart customer
router.get("/getAll/addToCart/Customer", auth, async (req, res) => {
  try {
    log.debug("/getAll/addToCart/Customer");
    let userId = req.userId;
    let condition = {
      status: { $eq: "active" },
      customerId: userId,
    };
    let customerCartData = await Cart.find(condition)
      .populate({
        path: "dealerProductId",
        populate: {
          path: "deviceId",
          model: "Product",
        },
      })
      .populate({
        path: "dealerAccessoriesId",
        populate: {
          path: "accessoriesId",
          model: "Accessories",
        },
      });

    let cartCount = await Cart.countDocuments(condition);
    // total Price with Delivery Charges
    let totalPrice = customerCartData.map((e) => parseInt(e.totalPrice));
    let sum = 0;
    for (let i = 0; i < totalPrice.length; i += 1) {
      sum += totalPrice[i];
    }
    console.log(">>>>>>>>>>>>totalPrice", totalPrice);
    // total Product and quantity Price
    let sumProductQtyAmt = 0;
    let productQtyAmt = customerCartData.map((e) => e.productQtyAmt);
    for (let i = 0; i < productQtyAmt.length; i += 1) {
      sumProductQtyAmt += productQtyAmt[i];
    }
    console.log(">>>>>>>>>>>>productQtyAmt", productQtyAmt);

    // Only Delivery Charges count
    let sumOnlyDeliveryAmt = 0;
    let onlyDeliveryAmt = customerCartData.map((e) => e.onlyDeliveryAmt);
    for (let i = 0; i < onlyDeliveryAmt.length; i += 1) {
      sumOnlyDeliveryAmt += onlyDeliveryAmt[i];
    }
    console.log(">>>>>>>>>>>>onlyDeliveryAmt", onlyDeliveryAmt);

    let respData = {
      metadata: {
        productQtyAmt: sumProductQtyAmt,
        onlyDeliveryAmt: sumOnlyDeliveryAmt,
        totalPrice: sum,
        totalCount: cartCount,
      },
      customerCartData,
    };
    response.successResponse(res, 200, "fetched Data successfully", respData);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/getBy/addToCart/customerDevice/:id", async (req, res) => {
  try {
    log.debug("/getBy/addToCart/customerDevice/:id");
    let result = await Cart.findOne({ _id: req.params.id })
      .populate({
        path: "dealerProductId",
        populate: {
          path: "deviceId",
          model: "Product",
        },
      })
      .populate({
        path: "dealerAccessoriesId",
        populate: {
          path: "accessoriesId",
          model: "Accessories",
        },
      })
      .select("-createdAt -updatedAt -__v");
    response.successResponse(res, 200, "fetched Data Successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.put("/customer_cart/updateBy/:id", auth, async (req, res) => {
  try {
    let productData;
    let id = req.params.id;
    let cartData = await Cart.findOne({ _id: id, status: { $eq: "active" } });
    if (req.body.type == "accessories") {
      productData = await DealerAccessories.findOne({
        _id: cartData.accessoriesId,
      });
    } else if (req.body.type == "product") {
      productData = await Device_Dealer_Inventory_Mgmt.findOne({
        _id: cartData.productId,
      });
    }
    let productQtyAmt = parseInt(req.body.quantity * productData.price);
    let totalPrice =
      parseInt(req.body.quantity * productData.price) +
      parseInt(cartData.deliveryCharges);
    let data = {
      productQtyAmt: productQtyAmt,
      totalPrice: totalPrice,
      ...req.body,
    };
    let result = await Cart.findByIdAndUpdate(
      { _id: id },
      { $set: data },
      {
        new: true,
      }
    );
    if (result) {
      result = await Cart.findById({ _id: id });
      response.successResponse(res, 200, "cart updated successfully", result);
    } else {
      response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
    }
  } catch (error) {
    console.log(error);
    response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
  }
});
module.exports = router;

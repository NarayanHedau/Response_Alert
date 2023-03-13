let router = require("express").Router();
let log = require("../../helper/logger");
let response = require("../../helper/response");
const commonController = require("../../controller/commonController");
const ERRORS = require("../../helper/errorMessage");
const _ = require("lodash");
const mongoose = require("mongoose");
const CardDetail = mongoose.model("CardDetail");
const auth = require("../../helper/auth");

const PUBLISHABLE_KEY = "pk_test_51MAAFaSFS4qiPpqxgc3336qR2KmHCmuZ7GiE9ezAnQFcg9KKzavrftEbQ8CPAaB0g0wkvX81ZdiVZRs7j1bjhyAD00lHkF6w80";
const SECRET_KEY = "sk_test_51MAAFaSFS4qiPpqx1iJxC7sxEwHDykTuNHj5RCBc767mYG3ooTNk4kH5ARubifMcIz0OoShf7kAVdNuiJHRfDYUs00pDfzVXkW";
const stripe = require("stripe")(SECRET_KEY)

// router.post("/add", auth, async (req, res) => {
//   try {
//     log.debug("/add/CardDetail");
//     let creator = req.userId;
//     let data = { ...req.body, creator: creator };
//     let result = await Role(data).save();
//     response.successResponse(res, 200, "Role added successfully", result);
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 400, "Something went wrong");
//   }
// });

// router.post("/payment", auth, async(req, res)=>{
//   try {
//     log.debug("/payment")
//     const userData = await stripe.customers.create({
//       email:req.body.stripeEmail,
//       source:req.body.stripeToken,
//       name:"Narayan Hedau",
//       address:"plot no. 11 nagpur",
//       state:"Maharashtra",
//       country: "India"
//     })
//     // console.log("MMMMMMMMMMMMMMMMM", userData)
//     if(userData){
//       const charges = await stripe.charges.create({
//         amount:200,
//         description: "web development charges",
//         currency: "USD",
//         customer:customers.id
//       })
//       // console.log("GGGGGGGGGGGGGGGGG", charges)
//       if(charges){
//         response.successResponse(res, 200, "Success", {})
//       }else{
//         response.errorMsgResponse(res, 200, "Payment Failed")
//       }
//     }
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 400, "Something went wrong");
//   }
// })

router.get("/getAll", auth, async (req, res) => {
  try {
    log.debug("/CardDetail/getAll");
    let userId = req.userId;
    let result = await CardDetail.find({
      userId: userId,
      status: { $eq: "active" },
    });
    response.successResponse(
      res,
      200,
      "User card details fetched successfully",
      result
    );
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/get/:id", auth, async (req, res) => {
  try {
    log.debug("/CardDetail/get");
    let id = req.params.id;
    let result = await CardDetail.findOne({
      _id: id,
      status: { $eq: "active" },
    });
    response.successResponse(res, 200, "User card detail", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

// router.get("/get", auth, async (req, res) => {
//   try {
//     log.debug("/CardDetail/get");
//     let userId = req.userId;
//     let result = await CardDetail.find({
//       userId: userId,
//       status: { $eq: "active" },
//     });
//     response.successResponse(res, 200, "User card details", result);
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 400, "Something went wrong");
//   }
// });

router.put("/update/:id", auth, async (req, res) => {
  try {
    log.debug("/CardDetail/update");
    let id = req.params.id;
    let result = await CardDetail.findByIdAndUpdate({ _id: id }, req.body, {
      $new: true,
    });
    let updatedResult = await Role.findById({ _id: result._id });
    response.successResponse(
      res,
      200,
      "Card Detail updated successfully",
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

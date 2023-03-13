let router = require("express").Router();
let log = require("../../helper/logger");
let response = require("../../helper/response");
const commonController = require("../../controller/commonController");
const ERRORS = require("../../helper/errorMessage");
const _ = require("lodash");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const auth = require("../../helper/auth");

router.get("/get/:userId", (req, res) => {
  commonController
    .getOne(User, {
      _id: req.params.userId,
    })
    .then((resData) => {
      var profile, usrnm;
      // if(resData.avatar){
      //     profile = resData.avatar
      // }
      // else {
      //     profile = ""
      // }
      var responseObj = {
        _id: resData._id,
        firstName: resData.firstName,
        lastName: resData.lastName,
        avatar: resData.avatar,
        username: resData.username,
        followers: 20,
        following: 20,
        likes: 20,
        rating: 30,
        paidVideos: 20,
      };
      responseObj.firstName != null
        ? responseObj.firstName
        : (responseObj.firstName = "");
      responseObj.avatar != null
        ? responseObj.avatar
        : (responseObj.avatar = "");
      responseObj.username != null
        ? responseObj.username
        : (responseObj.username = "");
      response.successResponse(res, 200, responseObj);
    })
    .catch((error) => {
      log.error("Error :", error);
      response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
    });
});

router.get("/getAll", auth, (req, res) => {
  commonController
    .getBy(User, {
      _id: {
        $ne: req.userId,
      },
    })
    .then((resData) => {
      response.successResponse(res, 200, resData);
    })
    .catch((error) => {
      response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
    });
});

module.exports = router;

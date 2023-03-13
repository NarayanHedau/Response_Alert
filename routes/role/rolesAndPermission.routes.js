let router = require("express").Router();
let log = require("../../helper/logger");
let response = require("../../helper/response");
const commonController = require("../../controller/commonController");
const ERRORS = require("../../helper/errorMessage");
const _ = require("lodash");
const mongoose = require("mongoose");
const Role = mongoose.model("RolesAndPermission");
const Staff = mongoose.model("Staff");
const auth = require("../../helper/auth");

router.post("/add", auth, async (req, res) => {
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
router.get("/getAll/page", auth, async (req, res) => {
  try {
    log.debug("/Role/getAll");
    let creator = req.userId;
    let { page, limit, searchKey } = req.query;
    const skip = (page - 1) * limit;
    let condition = { status: { $eq: "active" }, creator: creator };
    if (searchKey && searchKey != "") {
      condition = {
        ...condition,
        roleName: { $regex: searchKey, $options: "i" },
      };
    }
    let result = await Role.find(condition)
      .limit(limit * 1)
      .skip(skip)
      .sort({ _id: -1 });
    let totalCount = await Role.countDocuments(condition);

    let respData = { metadata: { count: totalCount }, result };
    // **************************
    // **************************
    // map staff count with each role in result
    // **************************
    // **************************
    response.successResponse(res, 200, "Roles fetched successfully", respData);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/getAll", auth, async (req, res) => {
  try {
    log.debug("/Role/getAll");
    let creator = req.userId;
    let condition = { status: { $eq: "active" }, creator: creator };
    let result = await Role.find(condition).sort({ _id: -1 });
    response.successResponse(res, 200, "Roles fetched successfully", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.get("/get/:id", auth, async (req, res) => {
  try {
    log.debug("/Role/get");
    let id = req.params.id;
    let result = await Role.findOne({ _id: id, status: { $eq: "active" } });
    response.successResponse(res, 200, "Role information", result);
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.put("/update/:id", auth, async (req, res) => {
  try {
    log.debug("/Role/update");
    let id = req.params.id;
    let result = await Role.findByIdAndUpdate({ _id: id }, req.body, {
      $new: true,
    });
    let updatedResult = await Role.findById({ _id: result._id });
    response.successResponse(
      res,
      200,
      "Role detail updated successfully",
      updatedResult
    );
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.delete("/delete/:id", auth, async (req, res) => {
  try {
    log.debug("/Role/delete");
    let id = req.params.id;
    await Role.findByIdAndUpdate(
      { _id: id },
      { status: "deleted" },
      { $new: true }
    );
    response.successResponse(res, 200, "Role deleted successfully", {});
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

router.delete("/deleteMany", async (req, res) => {
  try {
    log.debug("/multiple/role/delete");
    await Role.updateMany(
      { _id: { $in: req.query.id } },
      { $set: { status: "deleted" } },
      { multi: true }
    );
    response.successResponse(res, 200, "Roles deleted successfully", {});
  } catch (error) {
    log.error(error);
    response.errorMsgResponse(res, 400, "Something went wrong");
  }
});

module.exports = router;

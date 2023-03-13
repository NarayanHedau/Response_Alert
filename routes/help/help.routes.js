let router = require('express').Router()
let log = require('../../helper/logger')
let response = require('../../helper/response')
const commonController = require('../../controller/commonController')
const ERRORS = require('../../helper/errorMessage')
const _ = require('lodash')
const mongoose = require('mongoose')
const Help = mongoose.model('Help')
const auth = require('../../helper/auth')
const Customer = mongoose.model('Customer')
const Product = mongoose.model('Product')

const Device_Dealer_Inventory_Mgmt = mongoose.model('Device_Dealer_Inventory_Mgmt')
const User = mongoose.model('User')
const email = require('../sendmail/notify')
const moment = require('moment')

router.post("/add", auth, async(req, res)=>{
    try {
        let addHelp = await Help(req.body).save();
        response.successResponse(res, 200, "Add Help successful", addHelp)
    } catch (error) {
        console.log(error)
        response.errorMsgResponse(res, 301, "Something went wrong")
    }
});
router.get("/getAll",  auth, async(req, res)=>{
    try {
        let getHelp= await Help.find();
        response.successResponse(res, 200, "Help fetched successful", getHelp)

    } catch (error) {
        console.log(error)
        response.errorMsgResponse(res, 301, "Something went wrong")
    }
})
router.get("/getBy/:id", auth, async(req, res)=>{
    try {
        let getHelp= await Help.find({_id:req.params.id});
        response.successResponse(res, 200, "Help fetched successful", getHelp)
    } catch (error) {
        console.log(error)
        response.errorMsgResponse(res, 301, "Something went wrong")
    }
})

router.put("/update/:id", auth, async(req, res)=>{
    try {
        let result = await Help.findByIdAndUpdate(
            { _id: req.params.id },
            { $set: req.body },
            {
              new: true,
            }
          );
          if (result) {
            result= await Help.findOne({_id:req.params.id})
            response.successResponse(res, 200, "Data updated successfully", result)
          }
    } catch (error) {
        console.log(error)
        response.errorMsgResponse(res, 301, "Something went wrong")
    }
})
module.exports = router
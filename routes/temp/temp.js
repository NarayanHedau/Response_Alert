let router = require('express').Router()
let log = require('../../helper/logger')
let response = require('../../helper/response')
const commonController = require('../../controller/commonController')
const ERRORS = require('../../helper/errorMessage')
const _ = require('lodash')
const mongoose = require('mongoose')
const Role = mongoose.model('RolesAndPermission')
const Temp = mongoose.model('Temp')
const auth = require('../../helper/auth')

router.post('/trackerResData', async (req, res) => {
	try {
		let result = await Temp(req.body).save()
		response.successResponse(res, 200, 'Data saved successfully', result)
	} catch (error) {
		console.log(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

router.get('/getData', async (req, res) => {
	try {
		let sosArray = []
		let result = await Temp.find({})
		result.map(ele => {
			console.log(ele)
			return sosArray.push(ele.sosKey)
		})
		// console.log('result', sosArray)
		response.successResponse(res, 200, 'Data saved successfully', result)
	} catch (error) {
		console.log(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})
// async function  trackerResData(Data){
//     let result = await Temp(Data).save()
// }

// module.exports=trackerResData;
// module.exports = function(req, res, next) {
// 	let result = await Temp().save()
// }

module.exports = router

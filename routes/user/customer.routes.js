let router = require('express').Router()
let log = require('../../helper/logger')
let response = require('../../helper/response')
const commonController = require('../../controller/commonController')
const ERRORS = require('../../helper/errorMessage')
const _ = require('lodash')
const mongoose = require('mongoose')
const Customer = mongoose.model('Customer')
const Product = mongoose.model('Product')
const PASSWORD = require('../../helper/otp')
const auth = require('../../helper/auth')
let mail = require('../sendmail/notify')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const saltRounds = 10

router.post('/add', auth, async (req, res) => {
	try {
		log.info('/add/customer')
		let password = PASSWORD.generatePass()
		let hashPass = []
		let userName = req.body.email.split('@')[0]
		const email = req.body.email.toLowerCase().trim()
		let checkMail = await Customer.findOne({ email: email })

		if (checkMail) {
			response.errorMsgResponse(res, 400, 'Email already taken')
		} else {
			const mailToken = crypto.randomBytes(64).toString('hex')

			let salt = await bcrypt.genSalt(saltRounds)
			let hash = await bcrypt.hash(password, salt)

			let data = {
				...req.body,
				userName: userName,
				dealerId: req.userId,
				email: email,
				mailToken: mailToken,
				password: hash
			}

			let result = await Customer(data).save()

			let subject = `Response Alert Team - Verify your mail`
			let body = `<h2> hii ${req.body
				.customerName}! You have been added as a customer and your password: ${password}. Please login with your mail. </h2>
                    <h4> Please verify mail by clickng on the link given below...</h4>
                    <a href="http://${req.headers
						.host}/api/v1/authentication/verify/email?token=${mailToken}"> Verify your mail</a>
                    <h5> Regards  -team RESPONSE ALERT</h5>`
			let mailData = mail.sendMail(email, subject, body)

			let resultObj = {
				designation: result.designation,
				isEmailVerified: result.isEmailVerified,
				status: result.status,
				_id: result._id,
				image: result.image,
				customerName: result.customerName,
				email: result.email,
				phoneNo: result.phoneNo,
				callCenterNo: result.callCenterNo,
				address: result.address,
				emergencyContactDetails: result.emergencyContactDetails,
				medicalHistory: result.medicalHistory,
				assignDevice: result.assignDevice,
				userName: result.userName,
				dealerId: result.dealerId,
				password: password
			}
			response.successResponse(res, 200, 'Customer added successfully', resultObj)
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 400, 'Something went wrong')
	}
})

// router.put("/update", async (req, res) => {
//   try {
//     let custData = await Customer.find({ status: { $eq: "active" } });
//     let custIds = await custData.map((e) => e._id);
//     console.log(">>>>>>>>>>>>>>>>", custIds)
//     let result = await Customer.updateMany(
//       { _id: {$in:custIds} },
//       { $set: req.body },
//       { $new: true }
//       );
//       if(result){
//     custData = await Customer.find({ status: { $eq: "active" } });
//         response.successResponse(res, 200, "jjhjhjh", custData)
//       }
//   } catch (error) {
//     console.log(error);
//     response.errorMsgResponse(res, 400, "Something went wrong");
//   }
// });

router.get('/getAll/customer/assignDevice', auth, async (req, res) => {
	try {
		log.debug('/getAll/customer/assignDevice')
		let resultCount
		let result = []
		let { key, page, limit, dealerId } = req.query
		let skip = (page - 1) * limit
		let condition = {
			status: { $eq: 'active' },
			dealerId: dealerId,
			$or: [
				{ customerName: { $regex: '^' + req.query.key + '', $options: 'i' } },
				{ phoneNo: { $regex: '^' + req.query.key + '', $options: 'i' } }
			]
		}

		if (key && key !== '') {
			result = await Customer.find(condition)
				.populate({
					path: 'assignDevice',
					populate: { path: 'device', model: 'Product' }
				})
				.limit(limit * 1)
				.skip(skip)
			console.log('>>>>>>>>>>>>>>>if condition', result)
			resultCount = await Customer.countDocuments(condition)
		} else {
			result = await Customer.find({
				status: { $eq: 'active' },
				dealerId: dealerId
			})
				.populate({
					path: 'assignDevice',
					populate: { path: 'device', model: 'Product' }
				})
				.limit(limit * 1)
				.skip(skip)

			console.log('>>>>>>>>>>>>>>>else condition', result)

			resultCount = await Customer.countDocuments({
				status: { $eq: 'active' },
				dealerId: dealerId
			})
		}
		let respData = {
			metadata: {
				count: resultCount
			},
			result
		}
		if (result.length != 0) {
			response.successResponse(res, 200, 'successfully fetched', respData)
		} else {
			response.errorMsgResponse(res, 404, 'Not Found', respData)
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 400, 'Something went wrong')
	}
})

router.get('/getBy/:id/:assignDeviceId', auth, async (req, res) => {
	try {
		log.debug('customer/getBy')
		let userId = req.params.id
		let assignDeviceId = req.params.assignDeviceId
		let result = await Customer.findOne({
			_id: userId,
			status: { $eq: 'active' }
		}).populate({
			path: 'assignDevice',
			populate: { path: 'device', model: 'Product' }
		})
		console.log('result', result)
		let resultData = await result.assignDevice.filter(e => {
			return e._id == assignDeviceId
		})
		console.log('resultData=============', resultData)
		result = JSON.parse(JSON.stringify(result))
		delete result.assignDevice.shift()
		result = { ...result, assignDevice: resultData }
		response.successResponse(res, 200, 'customer profile fetched successfully', result)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 400, 'Something went wrong')
	}
})

router.get('/get/profile', auth, async (req, res) => {
	try {
		log.debug('customer/get/profile')
		let userId = req.userId
		let result = await Customer.findOne({
			_id: userId,
			status: { $eq: 'active' }
		})
			.select('-isEmailVerified -status -assignDevice -userName -mailToken -password ')
			.populate({
				path: 'dealerId',
				select: 'orgDetails profileImg _id designation username email mobileNumber address'
			})
		response.successResponse(res, 200, 'customer profile fetched successfully', result)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 400, 'Something went wrong')
	}
})

router.post('/getBy', auth, async (req, res) => {
	try {
		log.debug('customer/getBy')
		let userId = req.body.id
		let result = await Customer.findOne({
			_id: userId,
			status: { $eq: 'active' }
		}).select('-isEmailVerified -status -assignDevice -userName -dealerId -mailToken -password ')

		response.successResponse(res, 200, 'customer profile fetched successfully', result)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 400, 'Something went wrong')
	}
})

router.put('/update/profile', auth, async (req, res) => {
	try {
		log.debug('customer/update/profile')
		let userId = req.userId
		let updateObj = req.body
		let result = await Customer.findByIdAndUpdate({ _id: userId }, { $set: updateObj }, { $new: true })
		if (result) {
			let resultObj = await Customer.findById({ _id: userId }).select(
				'-isEmailVerified -status -assignDevice -userName -dealerId -mailToken -password '
			)
			response.successResponse(res, 200, 'Customer profile updated successfully', resultObj)
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 400, 'Something went wrong')
	}
})

// router.get("/getAll", auth, async (req, res) => {
//   try {
//     // console.log("=====>>>>>", req.query);
//     let result = await commonController.getAllBySortPagination(
//       Customer,
//       {},
//       req.query
//     );
//     response.successResponse(res, 200, "successfully fetched", result);
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 400, error);
//   }
// });
// router.post("/search", auth, async(req,res)=>{
//   try {
//     let result = await Customer.find({dealerId: req.dealerId, status: {$eq:"active"}, })
//   } catch (error) {

//   }
// })

// search ccustomer by using customer name and mobile number

router.get('/search/customer', auth, async (req, res) => {
	try {
		log.debug('/search/customer')
		let resultCount
		let result = []
		let { key, page, limit, dealerId } = req.query
		let skip = (page - 1) * limit
		let condition = {
			status: { $eq: 'active' },
			dealerId: dealerId,
			$or: [
				{ customerName: { $regex: '^' + req.query.key + '', $options: 'i' } },
				{ phoneNo: { $regex: '^' + req.query.key + '', $options: 'i' } }
			]
		}
		let populateData = { 
			path: 'assignDevice',
			populate: {
			  path: 'device',
			  model: 'Product'
			} 
		 }
		if (key && key !== '') {
			result = await Customer.find(condition).limit(limit * 1).skip(skip).populate(populateData)
			resultCount = await Customer.countDocuments(condition)
		} else {
			result = await Customer.find({
				status: { $eq: 'active' },
				dealerId: dealerId
			})
				.limit(limit * 1)
				.skip(skip).populate(populateData)
			resultCount = await Customer.countDocuments({
				status: { $eq: 'active' },
				dealerId: dealerId
			})
		}

		let respData = {
			metadata: {
				count: resultCount
			},
			result
		}
		if (result.length != 0) {
			response.successResponse(res, 200, 'successfully fetched', respData)
		} else {
			response.errorMsgResponse(res, 404, 'Not Found', respData)
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 400, 'Something went wrong')
	}
})

// delete many customer
router.put('/deleteMany/Customer', auth, async (req, res) => {
	try {
		log.debug('/delete/customer')
		let ids = req.body.id
		const data = await Customer.updateMany(
			{ _id: { $in: ids }, status: { $eq: 'active' } },
			{ $set: { status: 'deleted' } },
			{ multi: true }
		)
		response.successResponse(res, 200, 'Customers deleted successfully')
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})
// delete single customer by id in dealer Dashboard
router.put('/delete/customer/:id', auth, async (req, res) => {
	try {
		log.debug('/delete/customer/:id')
		let id = req.params.id
		const data = await Customer.updateMany({ _id: id, status: { $eq: 'active' } }, { $set: { status: 'deleted' } })
		response.successResponse(res, 200, 'Customer deleted successfully')
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

// Customer activated and deactivate By dealerId in Dealer Dashboard
router.post('/customer/activate/deactivete/:id', auth, async (req, res) => {
	try {
		log.debug('customer/activate/deactivete/:id')
		let id = req.params.id

		let custResult = await Customer.findOne({
			_id: id,
			status: { $eq: 'active' }
		})
		if (custResult) {
			if (custResult.activate == true) {
				await Customer.findByIdAndUpdate(custResult._id, { activate: false }, { $new: true })
				response.successResponse(res, 200, 'Customer account Deactivated successfully', {})
			} else {
				await Customer.findByIdAndUpdate(custResult._id, { activate: true }, { $new: true })
				response.successResponse(res, 200, 'Customer account Activated successfully', {})
			}
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

// Update customer by dealer id and customerId in dealer Dashboard
router.put('/update/customer/:id', auth, async (req, res) => {
	try {
		log.debug('update/customer/:id')
		let result = await Customer.findOneAndUpdate(
			{ _id: req.params.id, dealerId: req.userId },
			{ $set: req.body },
			{ $new: true }
		)
		if (result) {
			let resultObj = await Customer.findById({ _id: result._id }).select(
				'-isEmailVerified -status -assignDevice -dealerId -mailToken -password '
			)
			response.successResponse(res, 200, 'Customer profile updated successfully', resultObj)
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

// delete card details from an array in customer section
router.delete('/delete/cardDetails/fromArray/:id', auth, async (req, res) => {
	try {
		log.debug('delete/customer/cardDetails/fromArray')
		let result = await Customer.findOneAndUpdate(
			{ _id: req.params.id, status: { $eq: 'active' } },
			{
				$pull: {
					'paymentDetails.addDebitCreditCard': {
						_id: req.query.id
					}
				}
			}
		)
		result = await Customer.findOne({
			_id: req.params.id,
			status: { $eq: 'active' }
		})
		response.successResponse(res, 200, 'Record Deleted Successfully', result)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

// delete bank details by customer id in customer Section
router.delete('/delete/bankDetails/:id', auth, async (req, res) => {
	try {
		log.debug('delete/bankDetails')
		let result = await Customer.findOneAndUpdate(
			{ _id: req.params.id, status: { $eq: 'active' } },
			{ $unset: { 'paymentDetails.addBankDetails': '' } }
		)
		result = await Customer.findOne({
			_id: req.params.id,
			status: { $eq: 'active' }
		})
		response.successResponse(res, 200, 'Record Deleted Successfully', result)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

router.get('/getAssignDevices/:custId', auth, async (req, res) => {
	try {
		log.debug('getAssignDevices/:custId')
		const custAssignDeviceData = await Customer.find({
			status: { $eq: 'active' },
			_id: req.params.custId
		})
			.populate({
				path: 'assignDevice',
				populate: { path: 'device', model: 'Product' }
			})
			.select('assignDevice')
		response.successResponse(res, 200, 'Data fetched successfully', custAssignDeviceData)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

// Add Billing and Shipping Address in Customer Profile
router.post('/add/shipping_billing/address', auth, async (req, res) => {
	try {
		log.debug('add/shipping_billing/address')
		let addressType
		if (req.body.arrType === 'shipping') {
			addressType = 'shippingAddress'
		} else if (req.body.arrType === 'billing') {
			addressType = 'billingAddress'
		}
		let addAddress = await Customer.updateOne({ _id: req.userId }, { $push: { [addressType]: req.body } })
		if (addAddress) {
			let showAddress = await Customer.findOne({ _id: req.userId })
			response.successResponse(res, 200, 'Address added successfully', showAddress)
		}
	} catch (error) {
		console.log(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

// Update Billing address from Customer profile
router.put('/update/shipping/address', auth, async (req, res) => {
	try {
		log.debug('update/shipping/address')
		let result = await Customer.findOneAndUpdate(
			{ 'shippingAddress._id': req.query.addressId },
			{
				$set: {
					'shippingAddress.$.name': req.body.name,
					'shippingAddress.$.phoneNo': req.body.phoneNo,
					'shippingAddress.$.address': req.body.address,
					'shippingAddress.$.country': req.body.country,
					'shippingAddress.$.state': req.body.state,
					'shippingAddress.$.city': req.body.city,
					'shippingAddress.$.zipPostalCode': req.body.zipPostalCode,
					'shippingAddress.$.defaultAddress': req.body.defaultAddress
				}
			}
		)
		if (result) {
			result = await Customer.findOne({
				_id: req.query.customerId,
				status: { $eq: 'active' }
			})
			response.successResponse(res, 200, 'Shipping address updated successfully', result)
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

// Update Billing address from Customer profile
router.put('/update/billing/address', auth, async (req, res) => {
	try {
		log.debug('update/billing/address')
		let result = await Customer.findOneAndUpdate(
			{ 'billingAddress._id': req.query.addressId },
			{
				$set: {
					'billingAddress.$.name': req.body.name,
					'billingAddress.$.phoneNo': req.body.phoneNo,
					'billingAddress.$.address': req.body.address,
					'billingAddress.$.country': req.body.country,
					'billingAddress.$.state': req.body.state,
					'billingAddress.$.city': req.body.city,
					'billingAddress.$.zipPostalCode': req.body.zipPostalCode,
					'billingAddress.$.defaultAddress': req.body.defaultAddress
				}
			}
		)
		if (result) {
			result = await Customer.findOne({
				_id: req.query.customerId,
				status: { $eq: 'active' }
			})
			response.successResponse(res, 200, 'Billing address updated successfully', result)
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

// delete shipping address from Customer profile
router.delete('/delete/shipping/address', auth, async (req, res) => {
	try {
		log.debug('delete/shipping/address')
		let result = await Customer.findOneAndUpdate(
			{ _id: req.query.customerId, status: { $eq: 'active' } },
			{
				$pull: {
					shippingAddress: {
						_id: req.query.addressId
					}
				}
			}
		)
		result = await Customer.findOne({
			_id: req.query.customerId,
			status: { $eq: 'active' }
		})
		response.successResponse(res, 200, 'Record Deleted Successfully', result)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

// delete Billing address from Customer profile
router.delete('/delete/billing/address', auth, async (req, res) => {
	try {
		log.debug('delete/billing/address')
		let result = await Customer.findOneAndUpdate(
			{ _id: req.query.customerId, status: { $eq: 'active' } },
			{
				$pull: {
					billingAddress: {
						_id: req.query.addressId
					}
				}
			}
		)
		result = await Customer.findOne({
			_id: req.query.customerId,
			status: { $eq: 'active' }
		})
		response.successResponse(res, 200, 'Record Deleted Successfully', result)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

router.post('/add/shipping_billing/address/ByCustomer', auth, async (req, res) => {
	try {
		log.debug('add/shipping/address')
		let addressType
		if (req.body.arrType === 'shipping') {
			addressType = 'shippingAddress'
		} else if (req.body.arrType === 'billing') {
			addressType = 'billingAddress'
		}
		let addAddress = await Customer.updateOne({ _id: req.userId }, { $push: { [addressType]: req.body } })
		if (addAddress) {
			let showAddress = await Customer.findOne({ _id: req.userId })
			response.successResponse(res, 200, 'Address added successfully', showAddress)
		}
	} catch (error) {
		console.log(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

router.put('/update/subscoption/assignDeviceById/:assignId', auth, async (req, res) => {
	try {
		log.debug('update/subscoption/assignDeviceById/:assignId')
		let assignId = req.params.assignId
		let userId = req.userId
		let updateObj = req.body
		let result = await Customer.updateOne(
			{ 'assignDevice._id': assignId },
			{ $set: { 'assignDevice.$.subscription': updateObj } }
		)
		if (result) {
			let resultObj = await Customer.findById({ _id: userId }).select(
				'-isEmailVerified -status -assignDevice -userName -dealerId -mailToken -password '
			)
			response.successResponse(res, 200, 'Customer profile updated successfully', resultObj)
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 400, 'Something went wrong')
	}
})

module.exports = router

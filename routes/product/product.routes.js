let router = require('express').Router()
let log = require('../../helper/logger')
let response = require('../../helper/response')
const commonController = require('../../controller/commonController')
const ERRORS = require('../../helper/errorMessage')
const _ = require('lodash')
const mongoose = require('mongoose')
const Query = mongoose.model('Query')
const auth = require('../../helper/auth')
const Customer = mongoose.model('Customer')
const Product = mongoose.model('Product')
const User = mongoose.model('User')
const email = require('../sendmail/notify')
const moment = require('moment')

router.post('/addDevice', auth, async (req, res) => {
	try {
		log.debug('/addDevice')
		const { deviceName } = req.body
		const productData = await Product.findOne({
			status: { $eq: 'active' },
			deviceName: deviceName
		})
		if (productData) {
			response.errorMsgResponse(res, 403, 'Product name already exist')
		} else {
			const data = {
				...req.body,
				adminId: req.userId
			}
			const addDevice = await new Product(data).save()
			response.successResponse(res, 200, 'Device Added Successfully', addDevice)
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})

// router.post("/update/min/quantity", auth, async (req, res) => {
//   try {

//     let resultData = await Product.updateMany(
//       { status: { $eq: "active" } },
//       {
//         minQty: req.body.minQty,
//       },
//       { $multi: true }
//     );
//     response.successResponse(
//       res,
//       200,
//       "Minimum quantity updated successfully",
//       {}
//     );
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
//   }
// });

router.get('/getAll', auth, async (req, res) => {
	try {
		log.debug('/getAll/Device')

		const { page, limit, key, filter, enable } = req.query
		const skip = (page - 1) * limit
		let keyCondition = {
			status: { $eq: 'active' },
			// adminId: req.userId,
			deviceName: { $regex: '^' + key + '', $options: 'i' }
		}
		let result = []
		let respData
		let totalCount

		let userData = await User.findOne({ _id: req.userId })
		if (userData.filter.enable == true) {
			result = await Product.find(keyCondition).limit(limit * 1).skip(skip).sort({ quantity: 1 })
			totalCount = await Product.countDocuments(keyCondition)
		} else if (key && key !== '') {
			result = await Product.find(keyCondition).limit(limit * 1).skip(skip)
			totalCount = result.length
		} else {
			result = await Product.find({
				status: { $eq: 'active' }
				// adminId: req.userId,
			})
				.limit(limit * 1)
				.skip(skip)
				.sort({ _id: -1 })

			// totalCount = result.length;
			totalCount = await Product.countDocuments({ status: { $eq: 'active' } })
		}

		respData = {
			metadata: {
				count: totalCount
			},
			result
		}
		if (result.length <= 0) {
			response.successResponse(res, 200, 'Not found', respData)
		} else {
			response.successResponse(res, 200, 'Data found', respData)
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})

router.get('/getBy/:id', auth, async (req, res) => {
	try {
		log.debug('/getBy/:id')
		const id = req.params.id
		const result = await Product.findOne({ _id: id })
		response.successResponse(res, 200, 'Data Fetched successfully', result)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})

// router.get("/filter/device", auth, async (req, res) => {
//   try {
//     log.debug("filter/device");
//     let { key } = req.query;
//     // let filterResult = [];
//     // let result = [];
//     // let resultArr = [];
//     let resultObj = {};
//     let condition = {
//       status: { $eq: "active" },
//     };
//     console.log(">>>>>>>>>>>>>>>>>resultObj", resultObj);

//     if (key) {
//       console.log(">>>>>>>>>>>>>>>>>");
//       resultObj = await Product.find(condition).sort({ quantity: 1 });
//     } else {
//       resultObj = await Product.find(condition);
//     }

//     // if (key && key != "") {
//     //   condition = {
//     //     ...condition,
//     //     price: { $regex: "^" + key + "", $options: "i" },
//     //   };
//     //   filterResult = await Product.find(condition);
//     // }

//     // if (filterResult.length > 0) {
//     //   result = await Product.find({
//     //     status: { $eq: active },
//     //     price: { $nin: filterResult },
//     //   }).sort({ price: 1 });

//     //   resultArr = [filterResult, result].flat();
//     // } else {
//     //   result = await Product.find({ status: { $eq: "active" } });
//     //   resultArr = [result].flat();
//     // }

//     response.successResponse(res, 200, "Data Found", resultObj);
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
//   }
// });

router.put('/updateBy/:id', auth, async (req, res) => {
	try {
		let id = req.params.id

		let result = await Product.findByIdAndUpdate(
			{ _id: id },
			{ $set: req.body },
			{
				new: true
			}
		)
		if (result) {
			result = await Product.findById({ _id: id })
			response.successResponse(res, 200, 'Record updated successfully', result)
		} else {
			response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
		}
	} catch (error) {
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})

router.put('/deleteBy/:id', auth, async (req, res) => {
	try {
		let id = req.params.id

		let result = await Product.findByIdAndUpdate(
			{ _id: id },
			{ status: 'deleted' },
			{
				new: true
			}
		)
		response.successResponse(res, 200, 'Record deleted successfully', {})
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})

router.put('/deleteManyDevice', auth, async (req, res) => {
	try {
		log.debug('/delete/many/device')
		let ids = req.body.id
		const data = await Product.updateMany(
			{ _id: { $in: ids }, status: { $eq: 'active' } },
			{ $set: { status: 'deleted' } },
			{ multi: true }
		)
		response.successResponse(res, 200, 'Devices deleted successfully', {})
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

router.post('/activate/deactivate/device/:id', auth, async (req, res) => {
	try {
		log.debug('ctivate/deactivate/device/:id')
		let id = req.params.id

		let ProductResult = await Product.findOne({
			_id: id,
			status: { $eq: 'active' }
		})
		if (ProductResult) {
			if (ProductResult.activate == true) {
				await Product.findByIdAndUpdate(ProductResult._id, { activate: false }, { $new: true })
				response.successResponse(res, 200, 'Device deactivated successfully', {})
			} else {
				await Product.findByIdAndUpdate(ProductResult._id, { activate: true }, { $new: true })
				response.successResponse(res, 200, 'Device activated successfully', {})
			}
		}
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

router.get('/getall/product', auth, async (req, res) => {
	try {
		log.debug('/getall/product')
		let result = await Product.find({
			status: { $eq: 'active' }
			//   adminId: req.userId,
		}).select(
			'-activate -status -additionalInfo -files -__v -minQty -adminId -price -quantity -deviceDetails -deviceSpecification -createdAt -updatedAt'
		)
		//   result = _.uniq(result, function(item, key, deviceName){
		//     return item.deviceName;
		// });
		response.successResponse(res, 200, 'Data fetched successfully', result)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})
// =====================================================================================
// Customer Screen Product Details

router.get('/getAll/product/customer', auth, async (req, res) => {
	try {
		log.debug('/getAll/product/customer')
		let { page, limit, key } = req.query
		let skip = (page - 1) * limit
		let keyCondition = {
			status: { $eq: 'active' },
			deviceName: { $regex: '^' + key + '', $options: 'i' }
		}
		const result = await Product.find(keyCondition).limit(limit * 1).skip(skip).sort({ _id: -1 })
		let totalCount = await Product.countDocuments({
			status: { $eq: 'active' }
		})

		let respData = {
			metadata: {
				count: totalCount
			},
			result
		}
		if (result.length != 0) {
			response.successResponse(res, 200, '', respData)
		} else {
			response.successResponse(res, 200, 'Not Found', respData)
		}
	} catch (error) {}
})

module.exports = router

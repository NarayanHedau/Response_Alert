let router = require('express').Router()
let log = require('../../helper/logger')
let response = require('../../helper/response')
const commonController = require('../../controller/commonController')
const ERRORS = require('../../helper/errorMessage')
const _ = require('lodash')
const mongoose = require('mongoose')
const User = mongoose.model('User')
const Customer = mongoose.model('Customer')
const Staff = mongoose.model('Staff')
const Alarm = mongoose.model('Alarm')
const auth = require('../../helper/auth')
const moment = require('moment')

router.post('/add', auth, async (req, res) => {
	try {
		log.debug('/add/alarm')
		let creator = req.userId
		let data = {
			...req.body,
			creator
		}
		let addAlarm = await new Alarm(data).save()
		response.successResponse(res, 200, 'Alarm Added Successfully', addAlarm)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 400, 'Something went wrong')
	}
})

router.get('/getAll', async (req, res) => {
	try {
		log.debug('/getAll')
		let { page, limit, key } = req.query
		let skip = (page - 1) * limit
		let condition = {
			status: { $eq: 'active' }
		}
		if (key && key !== '') {
			condition = {
				...condition,
				$or: [
					{
						customerName: { $regex: '^' + key + '', $options: 'i' }
					},
					{
						alarmType: { $regex: '^' + key + '', $options: 'i' }
					},
					{
						'deviceDetails.deviceName': {
							$regex: '^' + key + '',
							$options: 'i'
						}
					}
				]
			}
		}
		const result = await Alarm.find(condition).populate('productId').limit(limit * 1).skip(skip)

		let totalCount = await Alarm.countDocuments(condition)
		let respData = {
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
		response.errorMsgResponse(res, 400, 'Something went wrong')
	}
})

router.get('/getBy/:id', auth, async (req, res) => {
	try {
		log.debug('/getBy/:id')
		const id = req.params.id
		const result = await Alarm.findOne({ _id: id })
		response.successResponse(res, 200, 'Fetched Alarm', result)
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})

router.put('/updatebyid/:id', auth, async (req, res) => {
	try {
		log.debug('updatebyid/:id')
		let id = req.params.id
		let result = await Alarm.findByIdAndUpdate({ _id: id }, req.body, {
			$new: true
		})
		let updatedResult = await Alarm.findById({ _id: result._id })
		response.successResponse(res, 200, 'Alarm Updated succesfully', updatedResult)
	} catch (error) {
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})

router.delete('/deletebyId/:id', auth, async (req, res) => {
	try {
		let id = req.params.id
		let result = await Alarm.findByIdAndUpdate(
			{
				_id: id
			},
			{ status: 'deleted' },
			{
				$new: true
			}
		)
		response.successResponse(res, 200, 'Alarm deleted succesfully', [])
	} catch (error) {
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})

router.put('/deleteManyAlarm', auth, async (req, res) => {
	try {
		log.debug('/delete/many/device')
		let ids = req.body.id
		const data = await Alarm.updateMany(
			{ _id: { $in: ids }, status: { $eq: 'active' } },
			{ $set: { status: 'deleted' } },
			{ multi: true }
		)
		response.successResponse(res, 200, 'Alarms deleted successfully', {})
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, 'Something went wrong')
	}
})

module.exports = router

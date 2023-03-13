let router = require('express').Router()
let response = require('../../helper/response')
const ERRORS = require('../../helper/errorMessage')
const stripe = require('stripe')(
	'sk_test_51MHMCYFu93RsZVpiy5MAnT2rnQOXRbAFdzbO3ZuAOPMSRBkQrVfxH08FzshvITTRLV0vXY9UuyQuU8m2ZofgdJXv00Acv8IAmp'
)
const { v4: uuidv4 } = require('uuid')
const auth = require('../../helper/auth')

router.post('/payment/:cardid', auth, async (req, res) => {
	let cardId = req.params.cardid
	const { name, email, product, number, exp_month, exp_year, cvc } = req.body
	let price = Number(product.price) * 100
	let userId = req.userId
	const customer = await stripe.customers.search({
		query: `metadata[\'user\']:\'${userId}\'`
	})
	const cards = await stripe.customers.listSources(customer.id, { object: 'card', limit: 10 })
	let card = cards
		.map(val => {
			if (val.id == cardId) {
				return val
			}
		})
		.filter(r => r)
	const idempotencyKey = uuidv4()
	return stripe.customers
		.create({
			name,
			email: email,
			source: card.id
		})
		.then(customer => {
			stripe.charges.create(
				{
					metadata: {
						jobid: product.jobid,
						user: userId,
						type: product.type,
						jobNumber: product.jobNumber,
						jobuserId: product.jobuserId,
						adminComission: product.adminComission,
						amount: product.amount,
						bid: product.bid,
						referComision: product.referComision
					},
					amount: price,
					currency: 'usd',
					customer: customer.id,
					receipt_email: email,
					description: `Got Job`,
					shipping: {
						name: token.card.name,
						address: {
							country: token.card.address_country
						}
					}
				},
				{ idempotencyKey: idempotencyKey }
			)
		})
		.then(result => {
			return res.status(200).json({
				status: 'success',
				code: 200,
				data: {
					success: true,
					message: 'Payment Successful'
				}
			})
		})
		.catch(err => {
			console.log(err)
			return res.status(201).json({
				status: 'Error',
				code: 402,
				data: err.raw
			})
		})
})

router.get('/refund/:id', async (req, res) => {
	try {
		let { id } = req.params
		await stripe.refunds.create({
			charge: id
		})
		response.successResponse(res, 200, 'payment successfully refunded')
	} catch (err) {
		response.errorResponse(res, 400, 'ERRORS.SOMETHING_WENT_WRONG')
	}
})

router.get('/list-charges', async (req, res) => {
	try {
		let type = 'bidPayment'
		const charges = await stripe.charges.search({
			query: `metadata[\'type\']:\'${type}\'`
		})
		return res.status(200).json(charges)
	} catch (err) {
		return res.status(500).json({
			success: false,
			msg: 'Something Went Wrong!'
		})
	}
})

router.get('/list_chargesCommision', async (req, res) => {
	try {
		let type = 'commissonPayment'
		const charges = await stripe.charges.search({
			query: `metadata[\'type\']:\'${type}\'`
		})
		return res.status(200).json(charges)
	} catch (err) {
		return res.status(500).json({
			success: false,
			msg: 'Something Went Wrong!'
		})
	}
})

router.get('/list-charge/:id', async (req, res) => {
	let id = req.params.id
	let charge = await stripe.charges.retrieve(id)
	return res.status(200).json(charge)
})

router.get('/listuser-charge/:id', async (req, res) => {
	let user = req.params.id
	const charge = await stripe.charges.search({
		query: `metadata[\'user\']:\'${user}\'`
	})
	return res.status(200).json(charge)
})

// transfer amount to reffer and Pro
router.post('/transfer_amount/:id', async (req, res) => {
	const { amount, id } = req.body
	let user = req.params.id
	let jobId = req.body.jobId
	try {
		const transfer = await stripe.transfers.create({
			amount: amount,
			currency: 'usd',
			destination: id,
			transfer_group: 'ORDER_95',
			metadata: { user: user, jobId: jobId }
		})
		return res.status(200).json({
			success: true,
			msg: 'Transfered successfully!'
		})
	} catch (err) {
		return res.status(500).json({
			success: false,
			msg: 'Account not varified!'
		})
	}
})

router.get('/transfer_list', async (req, res) => {
	try {
		const transfers = await stripe.transfers.list({})
		return res.status(200).json(transfers)
	} catch (err) {
		return res.status(500).json(err)
	}
})

router.get('/user_transfer', auth, async (req, res) => {
	let userId = req.userId
	try {
		const transfers = await stripe.transfers.list({})
		let data = transfers.data
			.map(val => {
				if (val.metadata.user == userId) {
					return val
				}
			})
			.filter(r => r)
		return res.status(200).json({
			success: true,
			data
		})
	} catch (err) {
		return res.status(500).json(err)
	}
})

// router.post('/paymentBy/dealer', async())

module.exports = router

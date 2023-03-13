let router = require('express').Router()
let response = require('../../helper/response')
const commonController = require('../../controller/commonController')
const ERRORS = require('../../helper/errorMessage')
const mongoose = require('mongoose')
const cardSchema = require('../../model/paymentDetail/CardDetail.model')
const bankSchema = require('../../model/paymentDetail/BankDetail.model')
const auth = require('../../helper/auth')
const bcrypt = require('bcrypt')
const { LexRuntime } = require('aws-sdk')
const User = require('../../model/user/user.model')
const config = require('../../config.json')
const plan = require('../../model/plan/plan.model')
const stripe = require('stripe')(
	'sk_test_51MHMCYFu93RsZVpiy5MAnT2rnQOXRbAFdzbO3ZuAOPMSRBkQrVfxH08FzshvITTRLV0vXY9UuyQuU8m2ZofgdJXv00Acv8IAmp'
)
//=================== Save credit card Detai
router.post('/card_detail', async (req, res) => {
	try {
		const { cardDefault } = req.body
		const userId = req.body.userId
		const customer = await stripe.customers.create({
			metadata: { user: userId, cardDefault: Boolean(cardDefault) },
			name: req.body.name,
			email: req.body.email
		})
		console.log('customer===============', customer)
		let { name, cardNumber, month, year, cvc } = req.body
		const token = await stripe.tokens.create({
			card: {
				name: name,
				currency: 'usd',
				number: cardNumber,
				exp_month: month,
				exp_year: year,
				cvc
			}
		})
		console.log('token', token)
		let tokenId = token.id
		let obj = customer.metadata
		let customerId = customer.id
		const card = await stripe.customers.createSource(customerId, {
			source: token.id,
			metadata: { token: tokenId, ...obj }
		})
		return res.status(200).json({
			success: true,
			card
		})
	} catch (err) {
		let error = {
			error: { message: err.raw.message }
		}
		return res.status(500).json(error)
	}
})
router.get('/getcard_detail/:userId', async (req, res) => {
	let userId = req.params.userId
	try {
		const customer = await stripe.customers.search({
			query: `metadata[\'user\']:\'${userId}\'`
		})

		let cus = customer.data.filter(res => {
			return res.id
		})
		let cardData = await Promise.all(
			cus.map(async r => {
				var cards = await stripe.customers.listSources(r.id, {
					object: 'card',
					limit: 4
				})
				if (cards.data.length > 0) {
					return cards
				}
			})
		)
		let card = cardData.filter(r => r)
		return res.status(200).json({
			success: true,
			card
		})
	} catch (err) {
		console.log(err)
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})

router.delete('/delete_card', async (req, res) => {
	let { customerId, cardId } = req.query
	try {
		const deleted = await stripe.customers.deleteSource(customerId, cardId)
		return res.status(200).json({
			success: true,
			msg: 'Card deleted Successfully'
		})
	} catch (err) {
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})

router.post('/update_card/:customerId/:cardId', async (req, res) => {
	let { customerId, cardId } = req.params
	// let { cardDefault } = req.body
	console.log('=======================', req.body)
	try {
		const updated = await stripe.customers.updateSource(customerId, cardId, {
			metadata: { cardDefault: req.body.cardDefault }
		})
		return res.status(200).json({
			success: true,
			updated,
			msg: 'Card updated Successfully'
		})
	} catch (err) {
		console.log('-----------', err)
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})
//====================>//
router.post('/create_product', async (req, res) => {
	try {
		const product = await stripe.products.create({
			name: req.body.planName
		})
		return res.status(200).json(product)
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

router.get('/retrieve_product/:productId', async (req, res) => {
	try {
		const { productId } = req.params
		const product = await stripe.products.retrieve(productId)
		return res.status(200).json(product)
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

router.post('/update_product', async (req, res) => {
	try {
		const { productId } = req.body
		const product = await stripe.products.update(productId, {
			metadata: { order_id: '6735' }
		})
		return res.status(200).json(product)
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

router.get('/lists_product', async (req, res) => {
	try {
		const products = await stripe.products.list({
			limit: 3
		})
		return res.status(200).json(products)
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

router.get('/deleted_product/:productId', async (req, res) => {
	try {
		const { productId } = req.params
		const deleted = await stripe.products.del(productId)
		return res.status(200).json(deleted)
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

router.post('/create_price', async (req, res) => {
	try {
		const { productId, amount } = req.body
		const price = await stripe.prices.create({
			unit_amount: amount,
			currency: 'usd',
			recurring: { interval: 'month' },
			product: productId
		})
		return res.status(200).json(price)
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

router.get('/retrieve_price/:priceId', async (req, res) => {
	try {
		const { priceId } = req.params
		const price = await stripe.prices.retrieve(priceId)
		return res.status(200).json(price)
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

router.post('/update_price', async (req, res) => {
	try {
		const { priceId } = req.body
		const price = await stripe.prices.update(priceId, {
			metadata: { order_id: '6735' }
		})
		return res.status(200).json(price)
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

router.post('/create_checkout_session', async (req, res) => {
	try {
		const { priceId, quantity } = req.body
		const session = await stripe.checkout.sessions.create({
			success_url: 'https://example.com/success',
			cancel_url: 'https://example.com/cancel',
			line_items: [ { price: priceId, quantity: quantity } ],
			mode: 'subscription'
		})
		return res.status(200).json(session)
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

//Admin plan create =================>//
router.post('/plan_create', async (req, res) => {
	try {
		let adminId = req.body.userId
		const product = await stripe.products.create({
			name: req.body.planName,
			description: req.body.description
		})
		const plan = await stripe.prices.create({
			unit_amount: req.body.amount * 100,
			currency: 'USD',
			recurring: { interval: req.body.interval },
			product: product.id,
			metadata: {
				user: adminId,
				name: product.name,
				description: product.description,
				collectionMethod: req.body.collection_method,
				add_features: JSON.stringify(req.body.add_features)
			}
		})
		console.log('<<<<>>>>', plan)
		return res.status(200).json(plan)
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

//dealer plan created
router.post('/dealer/plan_create', async (req, res) => {
	try {
		const { userId, planId, dealerId, priceId } = req.body
		const productData = await stripe.prices.retrieve(priceId)
		console.log(req.body)
		console.log('productData=>', productData)
		const planData = await stripe.prices.create({
			unit_amount: req.body.amount * 100,
			currency: 'USD',
			recurring: { interval: productData.recurring.interval },
			product: req.body.productId,
			metadata: {
				user: dealerId,
				priceId: priceId,
				name: productData.metadata.name,
				description: productData.metadata.description,
				collectionMethod: productData.metadata.collection_method,
				add_features: productData.metadata.add_features
			}
		})

		let data = new plan(planData.metadata).save()
		console.log(plan)
		res.status(200).json(planData)
	} catch (error) {
		res.status(500).json(error)
	}
})

//delete price IMP
router.delete('/delete_plan/:planId', async (req, res) => {
	try {
		console.log(req.body)
		let planId = req.params.planId
		const deleted = await stripe.plans.del(planId)
		return res.status(200).json({
			success: true,
			deleted
		})
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

router.get('/get_Plan/:planId', async (req, res) => {
	try {
		let planId = req.params.planId
		const planData = await stripe.plans.retrieve(planId)
		return res.status(200).json({
			planData
		})
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

router.put('/update_plan', async (req, res) => {
	try {
		let data = req.body.plan
		const update = req.body
		const plan = await stripe.plans.update(data, { metadata: {} })
		return res.status(200).json({
			success: true,
			plan
		})
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

//=>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>//

// router.post("/subscription", async (req, res) => {
//   try {
//     const subscriptions = await stripe.subscriptions.create({
//       customer: req.body.customer,
//       items: [
//         {
//           price_data: {
//             currency: "INR",
//             product: req.body.product,
//             unit_amount: "500",
//             recurring: {
//               interval: "month",
//             },
//           },
//         },
//       ],
//       payment_settings: {
//         payment_method_options: ["card"],
//         save_default_payment_method: "on_subscriptions",
//       },
//       expand: ["latest_invoice.payment_intent"],
//     });
//     res.json({
//       message: "Subscription successfully",
//       clinet_secret: subscriptions.latest_invoice.payment_intent.client_secret,
//       subscriptionId: subscriptions.id,
//     });
//   } catch (error) {
//     res.status(200).json({ message: "Internal server error" });
//   }
// });

//============================>Create a subscription<====================================//

router.post('/subscription', async (req, res) => {
	try {
		const { customerId, planId, add_features, userId, create_subscriptions, description, name } = req.body
		const subscription = await stripe.subscriptions.create({
			customer: customerId,

			metadata: {
				user: userId
				// name: name,
				// description: description,
				// create_subscriptions: create_subscriptions,
				// collection_method: 'charge_automatically',
				// add_features: JSON.stringify(add_features)
			},
			items: [ { price: planId } ]
		})
		res.status(200).json(subscription)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

router.post('/get_list_Subcription_plans', async (req, res) => {
	try {
		//desigantion search please take care
		const adminData = await User.findOne({ designation: { $eq: 'ADMIN' } })
		let userId = req.body.userid ? req.body.userid : adminData._id
		const planData = await stripe.prices.search({
			query: `metadata[\'user\']:\'${userId}\'`
		})
		// const planData = await stripe.prices.list()
		return res.status(200).json({
			planData
		})
	} catch (error) {
		console.log(error)
		return res.status(500).json(error)
	}
})

router.post('/multiple_product_subscriptiond', async (req, res) => {
	try {
		const { customerId, priceId, quantity } = req.body
		const subscription = await stripe.subscriptions.create({
			customer: customerId,
			items: [ { price: priceId }, { price: priceId, quantity: quantity } ]
		})
		res.status(200).json(subscription)
	} catch (error) {
		res.status(500).json(error)
	}
})

router.get('/get/subscriptions/:subscriptionId', async (req, res) => {
	try {
		const { subscriptionId, planId } = req.params
		const subscription = await stripe.subscriptions.retrieve(subscriptionId)
		res.status(200).json(subscription)
	} catch (error) {
		res.status(500).json(error)
	}
})

router.get('/subscriptions_lists', async (req, res) => {
	try {
		console.log('===========')
		const subscriptions = await stripe.subscriptions.list({})
		res.status(200).json(subscriptions)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

router.get('/get/multiple/subscriptions', async (req, res) => {
	try {
		let userId = req.body.userId

		// const subscription = await stripe.subscriptions.search({
		// 	query: "status:'active' AND metadata['order_id']:'6735'"
		// })
		const subscription = await stripe.subscriptions.search({
			// 'status:\'active\' AND metadata[\'order_id\']:\'6735\'',
			query: `status:'active' AND metadata['user']:'${userId}'`
		})
		// const subscriptionData = await stripe.subscriptions.retrieve(subscription)
		res.status(200).json(subscription)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

router.put('/update/subscriptions', async (req, res) => {
	try {
		const { subscriptionId } = req.body
		const subscription = await stripe.subscriptions.update(subscriptionId, {
			metadata: { order_id: '6735' }
		})
		res.status(200).json(subscription)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

router.delete('/cancel/subscriptions', async (req, res) => {
	try {
		const { subscriptionId } = req.body
		const deleted = await stripe.subscriptions.del(subscriptionId)
		res.status(200).json(deleted)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

router.get('/list_subscriptions', async (req, res) => {
	try {
		const subscriptions = await stripe.subscriptions.list({
			limit: 10
		})
		res.status(200).json(subscriptions)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

//========================================> Refunds Data ====================>
router.post('/create_refund', async (req, res) => {
	try {
		const { charge } = req.body
		const refund = await stripe.refunds.create({
			charge: charge
		})
		res.status(200).json(refund)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

router.get('/retrieve_refund/:refundId', async (req, res) => {
	try {
		const { refundId } = req.params
		const refundData = await stripe.refunds.retrieve(refundId)
		res.status(200).json(refundData)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

router.post('/cancel_refund', async (req, res) => {
	try {
		const { refundId } = req.body
		const refund = await stripe.refunds.cancel(refundId)
		res.status(200).json(refund)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

router.get('/list_refunds', async (req, res) => {
	try {
		const refunds = await stripe.refunds.list({
			limit: 3
		})
		res.status(200).json(refunds)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})
//=========================================>Refunds Data ====================>

//==========================================>payment transfer======================>
router.post('/payment_transfer', async (req, res) => {
	try {
		const { amount, destination } = req.body
		const transfer = await stripe.transfers.create({
			amount: amount * 100,
			currency: 'usd',
			destination: destination
			// transfer_group: 'ORDER_95',
		})
		res.status(200).json(transfer)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

router.get('/get_payment/:transferId', async (req, res) => {
	try {
		const { transferId } = req.params
		const transfer = await stripe.transfers.retrieve(transferId)
		res.status(200).json(transfer)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

router.post('/update_payment', async (req, res) => {
	try {
		const { transferId } = req.body
		const transfer = await stripe.transfers.update(transferId, {
			metadata: { order_id: '6735' }
		})
		res.status(200).json(transfer)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})

router.get('/payment_transfer_list', async (req, res) => {
	try {
		const transfers = await stripe.transfers.list({
			limit: 3
		})
		res.status(200).json(transfers)
	} catch (error) {
		console.log(error)
		res.status(500).json(error)
	}
})
//===========================>payment transfer======================>

//================== Save bank account detail
router.post('/bank_detail', async (req, res) => {
	try {
		const bankData = await bankSchema.findOne({ user: req.body.userId })
		console.log('bankdata====>', bankData)
		if (bankData) {
			await bankSchema.findByIdAndRemove({ _id: bankData.id })
		}
		let user = req.body.userId
		const object = {
			user,
			country,
			currency,
			routingNumber,
			accountNumber,
			accountHolderName,
			accountHolderType
		}
		let accNum = String(accountNumber).slice(-4)
		object.accountNumber = Number(accNum)
		var bank = new bankSchema(object)
		await bank.save()
		const token = await stripe.tokens.create({
			bank_account: {
				country,
				currency,
				account_holder_name: accountHolderName,
				account_holder_type: accountHolderType,
				routing_number: routingNumber,
				account_number: accountNumber
			}
		})
		// create account
		var account = await stripe.accounts.create({
			type: 'custom',
			business_type: 'individual',
			requested_capabilities: [ 'card_payments', 'transfers' ],
			external_account: token.id,
			metadata: { user: req.userId }
		})
		// create account link
		const accountLink = await stripe.accountLinks.create({
			account: account.id,
			refresh_url: 'http://localhost:3198/reauth',
			return_url: 'http://54.201.160.69:3200/',
			type: 'custom_account_verification'
		})
		return res.status(200).json({
			success: true,
			accountLink
		})
	} catch (err) {
		return res.status(500).json(err)
	}
})
router.get('/getbank_detail/:id', auth, (req, res) => {
	let id = req.params.id
	commonController
		.getbank(bankSchema, id)
		.then(resData => {
			response.successResponse(res, 200, resData)
		})
		.catch(err => {
			response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
		})
})

router.post('/charge', async (req, res) => {
	try {
		let resultData
		if (req.body.payType === 'account') {
			resultData = await stripe.charges.create(
				{
					source: req.body.source,
					metadata: {
						user: req.body.userId
					},
					amount: req.body.amount * 100,
					currency: 'usd',
					// customer: customer.id,
					receipt_email: req.body.email,
					description: `Order Payment`
				}
				// { idempotencyKey: idempotencyKey }
			)
			res.send(resultData)
		} else if (req.body.payType === 'card') {
			resultData = await stripe.charges.create(
				{
					// source: req.body.source,
					metadata: {
						user: req.body.userId
					},
					amount: req.body.amount * 100,
					currency: 'usd',
					customer: req.body.source,
					receipt_email: req.body.email,
					description: `Order Payment`
				}
				// { idempotencyKey: idempotencyKey }
			)
			res.send(resultData)
		} else {
			return res.status(500).json({ message: 'Please select payment method!' })
		}
	} catch (err) {
		console.log(err)
		return res.status(500).json(err)
	}
})

router.post('/create_accounts', async (req, res) => {
	const { account, type, email, userType } = req.body
	try {
		const account = await stripe.accounts.create({
			type: 'custom',
			country: 'US',
			business_type: 'individual',
			email: email,
			metadata: {
				user: req.body.userId,
				type: req.body.userType,
				accountDefault: req.body.accountDefault
			},
			capabilities: {
				card_payments: { requested: true },
				transfers: { requested: true }
			}
		})
		console.log('account', account)

		let return_url
		if (req.body.userType === 'customer') {
			return_url = config.customerUrl
		} else if (req.body.userType === 'dealer') {
			return_url = config.dealerUrl
		}
		const loginLink = await stripe.accountLinks.create({
			account: account.id,
			refresh_url: config.stripe_refresh_url,
			return_url: return_url,
			type: type
		})
		res.send(loginLink)
	} catch (err) {
		console.log(err)
		return res.status(500).json(err)
	}
})

router.post('/update_account/:accountId', async (req, res) => {
	let { accountId } = req.params
	// let { cardDefault } = req.body
	console.log('=======================', req.body)
	try {
		const updated = await stripe.account.update(accountId, {
			metadata: { accountDefault: req.body.accountDefault }
		})
		return res.status(200).json({
			success: true,
			updated,
			msg: 'Card updated Successfully'
		})
	} catch (err) {
		console.log('-----------', err)
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})

router.post('/add_bank_detail', async (req, res) => {
	try {
		let { country, currency, accountHolderName, accountHolderType, routingNumber, accountNumber } = req.body

		const token = await stripe.tokens.create({
			bank_account: {
				country,
				currency,
				account_holder_name: accountHolderName,
				account_holder_type: accountHolderType,
				routing_number: routingNumber,
				account_number: accountNumber
			}
		})
		console.log('token', token)
		// create account
		var account = await stripe.accounts.create({
			type: 'custom',
			business_type: 'individual',
			requested_capabilities: [ 'card_payments', 'transfers' ],
			external_account: token.id,
			metadata: { user: req.userId }
		})
		// create account link
		const accountLink = await stripe.accountLinks.create({
			account: account.id,
			refresh_url: 'http://localhost:9143/reauth',
			return_url: 'http://localhost:9143/',
			type: 'custom_account_verification'
		})
		return res.status(200).json({
			success: true,
			accountLink
		})
	} catch (err) {
		console.log(err)
		return res.status(500).json(err)
	}
})
router.get('/getAccount/:user', async (req, res) => {
	try {
		const { user } = req.params
		const charges = await stripe.accounts.list({})
		console.log('charges', charges)
		let charge = charges.data
			.map(val => {
				if (val.metadata.user == user) {
					return val
				}
			})
			.filter(r => r)
		// let data = charge[0];
		return res.status(200).json({
			success: true,
			data: charge
		})
	} catch (err) {
		return res.status(500).json(err)
	}
})

router.delete('/delete_account/:id', async (req, res) => {
	try {
		const deleted = await stripe.accounts.del(req.params.id)
		res.status(200).json(deleted)
	} catch (error) {
		res.status(500).json(error)
	}
})
module.exports = router

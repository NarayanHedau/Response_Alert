const mongoose = require('mongoose')
const Order = new mongoose.Schema(
	{
		name: { type: String },
		trackStatus: {
			type: String,
			enum: [ 'Pending', 'Cancel', 'Dispatch', 'Successful', 'Delivered', 'Reject' ]
		},
		// order: [ {} ],
		markDelivered: {
			type: Boolean,
			default: false
		},
		orderId: {
			type: String
		},
		customerName: {
			type: String
		},
		dealerName: {
			type: String
		},
		refund: {},
		quantity: Number,
		productDetails: [],
		paymentDetails: {}, //chargeId and reciept email and amount

		// dealerId: { type: mongoose.Types.ObjectId, ref: 'User' },
		// customerId: { type: mongoose.Types.ObjectId, ref: 'Customer' },
		// productId: { type: mongoose.Types.ObjectId, ref: 'Product' },
		// adminId: { type: mongoose.Types.ObjectId, ref: 'User' },
		buyerId: String,
		sellerId: String,
		// pending: {
		// 	type: Boolean,
		// 	default: true
		// },

		address: {
			shippingAddress: {
				name: String,
				phoneNo: String,
				address: String,
				country: String,
				city: String,
				state: String,
				zipPostalCode: String
			},
			billingAddress: {
				name: String,
				phoneNo: String,
				address: String,
				country: String,
				city: String,
				state: String,
				zipPostalCode: String
			}
		},

		activate: { type: Boolean, default: true },
		status: {
			type: String,
			default: 'active'
		},
		documentUrl :{type:String}, 
		invoiceId:{type:mongoose.Types.ObjectId, ref: "Invoice"}
	},
	{ timestamps: true }
)

module.exports = mongoose.model('Order', Order)

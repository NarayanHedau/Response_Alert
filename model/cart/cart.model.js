const mongoose = require('mongoose')

const Cart = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Types.ObjectId,
			ref: 'User'
		},
		customerId: {
			type: mongoose.Types.ObjectId,
			ref: 'Customer'
		},
		productId: {
			type: mongoose.Types.ObjectId,
			ref: 'Product'
		},
		accessoriesId: {
			type: mongoose.Types.ObjectId,
			ref: 'Accessories'
		},
		status: {
			type: String,
			default: 'active'
		},
		dealerProductId: {
			type: mongoose.Types.ObjectId,
			ref: 'Device_Dealer_Inventory_Mgmt'
		},
		dealerAccessoriesId: {
			type: mongoose.Types.ObjectId,
			ref: 'DealerAccessories'
		},
		quantity: { type: Number },
		totalPrice: { type: Number },
		deliveryCharges: { type: Number },
		productQtyAmt: { type: Number },
		onlyDeliveryAmt: { type: Number }
	},
	{ timestamps: true }
)

module.exports = mongoose.model('Cart', Cart)

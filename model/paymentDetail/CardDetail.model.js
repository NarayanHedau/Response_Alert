const mongoose = require('mongoose'),
	Schema = mongoose.Schema

const CardDetail = new Schema(
	{
		userId: { type: mongoose.Types.ObjectId, ref: 'User' },
		cardHolderName: { type: String },
		cardNumber: { type: String },
		expiryDate: { type: String },
		cvv: String,
		status: { type: String, default: 'active' }
	},
	{ timestamps: true }
)
module.exports = mongoose.model('CardDetail', CardDetail)

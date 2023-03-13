const mongoose = require('mongoose'),
	Schema = mongoose.Schema

const BankDetail = new Schema(
	{
		userId: { type: mongoose.Types.ObjectId, ref: 'User' },
		bankName: { type: String },
		accountNumber: { type: String },
		accountHolderName: { type: String },
		ibanNumber: { type: String },
		status: { type: String, default: 'active' }
	},
	{ timestamps: true }
)
module.exports = mongoose.model('BankDetail', BankDetail)

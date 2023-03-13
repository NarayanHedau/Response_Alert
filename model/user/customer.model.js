const mongoose = require('mongoose'),
	Schema = mongoose.Schema

const Customer = new Schema(
	{
		image: { type: String },
		customerName: { type: String },
		email: { type: String },
		phoneNo: { type: String },
		callCenterNo: { type: String },
		address: { type: String },
		subscription: {},
		emergencyContactDetails: [
			{
				contactName: { type: String },
				phoneno: { type: String }
			}
		],
		medicalHistory: {
			bloodGroup: { type: String },
			height: { type: String },
			weight: { type: String },
			age: { type: String },
			illness: { type: String },
			medicineTaken: { type: String }
		},
		assignDevice: [
			{
				deviceImage: { type: Array },
				device: { type: mongoose.Types.ObjectId, ref: 'Product' },
				imeiNumber: { type: Number },
				subscription: {}
			}
		],
		designation: { type: String, default: 'CUSTOMER' },
		userName: { type: String },
		password: { type: String },
		dealerId: { type: mongoose.Types.ObjectId, ref: 'User' },
		activate: { type: Boolean, default: true },
		isEmailVerified: {
			type: String,
			enum: [ 'NOT', 'VERIFIED' ],
			default: 'NOT'
		},
		mailToken: { type: String },
		paymentDetails: {
			addDebitCreditCard: [
				{
					cardHolderName: { type: String, default: '' },
					cardNumber: { type: Number, default: null },
					expiryDate: { type: String, default: '' }
				}
			],
			addBankDetails: {
				selectBank: { type: String, default: '' },
				accountNumber: { type: Number, default: null },
				accountHolderName: { type: String, default: '' },
				ibanNumber: { type: String, default: '' }
			}
		},
		shippingAddress: [
			{
				name: { type: String, default: '' },
				phoneNo: { type: String, default: '' },
				address: { type: String, default: '' },
				country: { type: String, default: '' },
				state: { type: String, default: '' },
				city: { type: String, default: '' },
				zipPostalCode: { type: String, default: '' },
				defaultAddress: { type: Boolean, default: false }
			}
		],
		billingAddress: [
			{
				name: { type: String, default: '' },
				phoneNo: { type: String, default: '' },
				address: { type: String, default: '' },
				country: { type: String, default: '' },
				state: { type: String, default: '' },
				city: { type: String, default: '' },
				zipPostalCode: { type: String, default: '' },
				defaultAddress: { type: Boolean, default: false }
			}
		],
		status: { type: String, default: 'active' }
	},
	{ timestamps: true }
)
module.exports = mongoose.model('Customer', Customer)

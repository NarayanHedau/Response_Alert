const mongoose = require('mongoose'),
	schema = mongoose.Schema
let Product = new schema(
	{
		adminId: { type: mongoose.Types.ObjectId, ref: 'User' },
		files: { type: Array },
		deviceName: { type: String },
		price: { type: String },
		quantity: { type: Number },
		deviceDetails: { type: String },
		deviceSpecification: {
			carrierName: { type: String },
			dimension: { type: String },
			weight: { type: String },
			rf_transmission_freq: { type: String },
			manufacturerName: { type: String },
			brand: { type: String },
			batteryLife: { type: String },
			batterVolatage: { type: String }
		},
		additionalInfo: { type: Array },
		status: { type: String, default: 'active' },
		// enable: { type: Boolean, default: true },
		// minQty: {type:Number},
		activate: { type: Boolean, default: true }
	},
	{ timestamps: true }
)
module.exports = mongoose.model('Product', Product)

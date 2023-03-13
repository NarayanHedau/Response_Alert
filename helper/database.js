let mongoose = require('mongoose')
let config = require('../config.json')

module.exports = {
	connect: function() {
		let db = mongoose
			.connect(config.dbUrl, {
				useNewUrlParser: true,
				useCreateIndex: true,
				useFindAndModify: false,
				useUnifiedTopology: true
			})
			.then(res => console.log('connected'))
		mongoose.Promise = global.Promise
	},
	initModels: function() {
		require('../model/index.model')
	}
}

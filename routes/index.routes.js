module.exports = app => {
	let authRoute = require('./auth.routes')
	let userRoute = require('./user/user.routes')
	let uploadRoute = require('./upload.routes')
	let staffRoute = require('./user/staff.routes')
	let customerRoute = require('./user/customer.routes')
	let roleRoute = require('./role/rolesAndPermission.routes')
	let bankDetailsRoute = require('./paymentDetails/bankDetails.routes')
	let cardDetailsRoute = require('./paymentDetails/cardDetails.routes')
	let adminDashboardRoute = require('./dashboard/adminDashboard.routes')
	let queryRoute = require('./query/queries.routes')
	let device = require('./product/product.routes')
	let alarm = require('./alarm/alarm.routes')
	let cart = require('./cart/cart.routes')
	let paymentDetail = require('./paymentDetail/paymentDetail.routes')
	let payment = require('./stripe/payment.routes')
	let order = require('./order/order.routes')
	let country = require('./country/country.routes')
	let accessories = require('./accessories/accessories.routes')
	let device_Dealer_Inventory_Mgmt = require('./device_Dealer_Inventory_Mgmt/device_Dealer_Inventory_Mgmt.routes')
	let dealerAccessories = require('./dealer_Accessories/dealer_Accessories.routes')
	let invoice = require('./invoice/invoice.routes')
	let html_to_pdf_converter=require("./html to pdf converter/html_to_pdf_converter.routes")
	// let CartAccessories = require("./CartAccessories/cart_Accessories.routes")
	// let dealerQueryRoute = require("./customerQuery/dealerQuery.route");
	let help = require("./help/help.routes")
	let temp = require("./temp/temp")


	app.use('/api/v1/authentication', authRoute)
	app.use('/api/v1/user', userRoute)
	app.use('/api/v1/upload', uploadRoute)
	app.use('/api/v1/staff', staffRoute)
	app.use('/api/v1/customer', customerRoute)
	app.use('/api/v1/rolesAndPermissions', roleRoute)
	app.use('/api/v1/bankDetails', bankDetailsRoute)
	app.use('/api/v1/cardDetails', cardDetailsRoute)
	app.use('/api/v1/paymentDetail', paymentDetail)
	app.use('/api/v1/payment', payment)
	app.use('/api/v1/order', order)
	app.use('/api/v1/country', country)
	app.use('/api/v1/adminDashboard', adminDashboardRoute)
	app.use('/api/v1/query', queryRoute)
	app.use('/api/v1/device', device)
	app.use('/api/v1/alarm', alarm)
	app.use('/api/v1/cart', cart)
	app.use('/api/v1/accessories', accessories)
	app.use('/api/v1/device_Dealer_Inventory_Mgmt', device_Dealer_Inventory_Mgmt)
	app.use('/api/v1/dealerAccessories', dealerAccessories)
	app.use('/api/v1/invoice', invoice)
	app.use('/api/v1/htmlToPdf', html_to_pdf_converter)
	app.use('/api/v1/temp', temp)
	// app.use("/api/v1/CartAccessories", CartAccessories)
	// app.use("/api/v1/dealer", dealerQueryRoute);
	app.use("/api/v1/help", help)
	//Mobile Api Working ============================>
	app.use('/api/mobile/v1/authentication', authRoute)
	app.use('/api/mobile/v1/user', userRoute)
	app.use('/api/mobile/v1/upload', uploadRoute)
	app.use('/api/mobile/v1/staff', staffRoute)
	app.use('/api/mobile/v1/customer', customerRoute)
	app.use('/api/mobile/v1/rolesAndPermissions', roleRoute)
	app.use('/api/mobile/v1/bankDetails', bankDetailsRoute)
	app.use('/api/mobile/v1/cardDetails', cardDetailsRoute)
	app.use('/api/mobile/v1/paymentDetail', paymentDetail)
	app.use('/api/mobile/v1/payment', payment)
	app.use('/api/mobile/v1/order', order)
	app.use('/api/mobile/v1/country', country)
	app.use('/api/mobile/v1/adminDashboard', adminDashboardRoute)
	app.use('/api/mobile/v1/query', queryRoute)
	app.use('/api/mobile/v1/device', device)
	app.use('/api/mobile/v1/alarm', alarm)
	app.use('/api/mobile/v1/cart', cart)
	app.use('/api/mobile/v1/accessories', accessories)
	app.use('/api/mobile/v1/device_Dealer_Inventory_Mgmt', device_Dealer_Inventory_Mgmt)
	app.use('/api/mobile/v1/dealerAccessories', dealerAccessories)
	app.use('/api/mobile/v1/invoice', invoice)

	//Device connectivity Api
	let deviceConn = require('./deviceConnectivity/device.routes')

	app.use('/api/getServiceTerms.html', deviceConn)
}

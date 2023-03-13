let router = require('express').Router()
let log = require('../../helper/logger')
let response = require('../../helper/response')
let config = require('../../config.json')
const mongoose = require('mongoose')
const ERRORS = require('../../helper/errorMessage')
// const pdf = require('html-pdf');
var pdf = require('pdf-creator-node')
var fs = require('fs')
var path = require('path')
const Invoice = mongoose.model('Invoice')
// router.post("/creator", async (req, res) => {
//   try {

//     let invoiceData = await Invoice.findOne({_id: req.body.id, status:{$eq:"active"} })
//     console.log(">>>>>>>>>>>>", invoiceData.invoice_No)
//     var options = {
//       format: "A4",
//       orientation: "portrait",
//       border: "10mm",
//       header: {
//           height: "45mm",
//           contents: '<div style="text-align: center;"></div>'
//       },
//       footer: {
//           height: "28mm",
//           contents: {
//               first: 'Cover page',
//               2: 'Second page', // Any page number is working. 1-based index
//               default: '<span style="color: #444;">{{page}}</span>/<span>{{pages}}</span>', // fallback value
//               last: 'Last Page'
//           }
//       }
//   };
//   var users = [
//     {
//       invoice_No: invoiceData.invoice_No,
//       from_address: invoiceData.from_address,
//       to_address:invoiceData.to_address.shippingAddress,
//       itemArray:invoiceData.itemArray,
//       shipment:invoiceData.shipment,
//       total_amount:invoiceData.total_amount,
//       customerName:invoiceData.customerName,
//       sendTo:invoiceData.sendTo

//     }
//   ];
//   var html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')
//   var document = {
//     html: html,
//     data: {
//       users: users,
//     },
//     path: "./public/output/output.pdf",
//     type: "",
//   };
//   pdf
//   .create(document, options)
//   .then((res) => {
//     // res.send(res)
//     console.log(res);
//   })
//   .catch((error) => {
//     console.error(error);
//   });
//   } catch (error) {
//     log.error(error);
//     response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG);
//   }
// })

router.post('/creator', async (req, res) => {
	try {
		const browser = await puppeteer.launch()
		// let invoiceData = await Invoice.findOne({_id: req.body.id, status:{$eq:"active"} })
		// Create a new page
		const page = await browser.newPage()

		// Website URL to export as pdf
		const website_url = `${config.adminUrl}/auth/invoice/63c221c606117e2da03226d0`

		// Open URL in current page
		await page.goto(website_url, { waitUntil: 'networkidle0' })

		//To reflect CSS used for screens instead of print
		await page.emulateMediaType('screen')

		// Downlaod the PDF
		const pdf = await page.pdf({
			path: '/public/output/output.pdf',
			margin: { top: '50px', right: '10px', bottom: '50px', left: '10px' },
			printBackground: true,
			format: 'A4'
		})
		// console.log(pdf)
		//   res.send(pdf)
		// Close the browser instance
		await browser.close()

		// log.debug("/html_to_pdf_converter")
		// pdf.create(html).toFile([filepath, ], function(err, res){
		//     // console.log(res.filename);
		//     response.successResponse()
		//   });
	} catch (error) {
		log.error(error)
		response.errorMsgResponse(res, 301, ERRORS.SOMETHING_WENT_WRONG)
	}
})
module.exports = router

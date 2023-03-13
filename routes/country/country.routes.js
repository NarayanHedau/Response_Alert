let router = require('express').Router()
let Country = require('country-state-city').Country
router.get('/getAllCountry', async (req, res) => {
	try {
		const getAllCountry = Country.getAllCountries()
		console.log(getAllCountry)
		res.status(200).json(getAllCountry)
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Something went wrong' })
	}
})

module.exports = router

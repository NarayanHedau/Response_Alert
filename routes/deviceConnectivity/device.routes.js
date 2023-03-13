let router = require('express').Router()
router.post('/add', async (req, res) => {
	try {
		res.send('hello')
		console.log('checking......')
	} catch (error) {
		console.log(error)
		res.status(500).json({ message: 'Something went wrong' })
	}
})

module.exports = router

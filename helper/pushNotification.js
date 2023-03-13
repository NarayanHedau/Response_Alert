const fetch = require('node-fetch')
module.exports = {
	sendNotify: object => {
		var notification = {
			title: object.title,
			body: object.desc
		}
		var fcm_tokens = object.deviceTokens
		var notification_body = {
			notification: notification,
			registration_ids: fcm_tokens
		}
		fetch('https://fcm.googleapis.com/fcm/send', {
			method: 'POST',
			headers: {
				Authorization:
					'key=' + 'BFEatuBrbn28w5-8VwUd2PxfHc3mObFx3WshMc1NgQ5ySCj-iix8q3J5z48sP0y0WpAUkvXzResooOiJfUfxVmg',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(notification_body)
		})
	}
}

const log = require("../../helper/logger");
var nodemailer = require("nodemailer");
let config = require("../../config.json");
var fs = require("fs");

// router.post('/', (req, res) => {
module.exports = {
  sendMail: (to, subject, body) => {
    var transporter = nodemailer.createTransport({
      service: "gmail",
      port: config.auth.port,
      tls: true,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      from: `ResponseAlert@gmail.com`,
    });

    var mailOptions = {
      from: config.auth.user,
      to: to,
      subject: subject,
      html: body,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Mail Sent", info.response);
      }
    });
  },
};
// });
// module.exports = router;
// {
//     out: "body",
//     subject: "subject",
//     email: "email",
//     from: ""
// }

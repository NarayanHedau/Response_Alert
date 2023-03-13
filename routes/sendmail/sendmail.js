const router = require("express").Router();
const resumeController = require("../../controllers/sendmail/sendmail");
const log = require("../../helper/logger");
const response = require("../../helper/response");
var nodemailer = require("nodemailer");
const path = require("path");

var fs = require("fs");

router.get("/", (req, res) => {
  log.debug("/api/sendmail/");
  resumeController
    .getALlresume()
    .then((resumeData) => {
      response.successResponse(res, 200, resumeData);
    })
    .catch((error) => {
      log.error(error);
      response.errorResponse(res, 500);
    });
});
router.post("/", (req, res) => {
  log.debug("/api/sendmail/");
  resumeController
    .addresume(req.body)
    .then((resumeData) => {
      var send = req.body;
      console.log(send);
      if (resumeData) {
        var transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "iworkstationsfood@gmail.com",
            pass: "iworkstation@123",
          },
        });
        var mailOptions = {
          from: "iworkstationsfood@gmail.com",
          to: "iworkstationsfood@gmail.com",
          subject: "Applying For " + send.jobTitle,
          html:
            "<b>Hello Respected Sir!</b>" +
            "<br><br> My name is <b>" +
            send.firstName +
            " " +
            send.lastName +
            "</b> " +
            "I am intresting to join <b> @iworkstation </b> as a possition <b>" +
            send.jobTitle +
            "</b> for location <b>" +
            send.jobLocation +
            "</b> please Contact me on <br> <br> contact Details : <br><b> PHONE : " +
            send.mobileNumber +
            "</b> <br>" +
            "<b> EMAIL :" +
            send.email +
            "</b> <br> <b>CURRENT CTC : </b> " +
            send.currentCtc +
            "<br>" +
            "<b>EXPECTED CTC : </b>" +
            send.ctc,
          attachments: [
            {
              path: send.file,
            },
          ],
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            response.successResponse(res, 200, info.response);
          }
        });
      }
    })
    .catch((error) => {
      log.error(error);
      response.errorResponse(res, 500);
    });
});

router.delete("/:resumeId", (req, res) => {
  log.debug("/api/sendmail/:resumeId");
  resumeController
    .deleteresume(req.params.resumeId)
    .then((resumeData) => {
      if (resumeData == null) {
        response.errorResponse(res, 414);
      } else {
        response.successResponse(res, 200, resumeData);
      }
    })
    .catch((err) => {
      log.error("Error :", err);
      response.errorResponse(res, 500);
    });
});

module.exports = router;

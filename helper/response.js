let log = require("../helper/logger");

let errors = {
  404: {
    status: 404,
    errorCode: "NOT_FOUND",
    error: "Not Found",
  },
  500: {
    status: 500,
    errorCode: "DATABASE_ERROR",
    error: "We are Working on it please try after some time",
  },
  400: {
    status: 400,
    errorCode: "CREDENTIALS_NOT_PROVIDED",
    error: "Credentials Not Provided",
  },
  401: {
    status: 401,
    errorCode: "WRONG_OTP",
    error: "Wrong OTP",
  },
  402: {
    status: 402,
    errorCode: "SENDING_EMAIL_ERROR",
    error: "error in sending email",
  },
  403: {
    status: 403,
    errorCode: "WRONG_PIN",
    error: "pin didn't match",
  },
  406: {
    status: 406,
    errorCode: "TOPICS_NOT_FOUND",
    error: "Topics not found",
  },
  11000: {
    status: 500,
    errorCode: "Registered User",
    error: "You have already registerd Please Login for continue",
  },
  101: {
    status: 505,
    errorCode: "Wrong Credentials",
    error: "Your account is not registered with us, Please Registerd First",
  },
  102: {
    status: 505,
    errorCode: "Not Veried Till Now",
    error: "Your accunt is not verified, please try after some time",
  },
  103: {
    status: 505,
    errorCode: "Password not match",
    error: "Please Enter Correct Credentials",
  },
  104: {
    status: 104,
    errorCode: "MOBILE_NOT_FOUND",
    error: "Mobile number not found",
  },
};

module.exports = {
  successResponse: (res, code, message, data) => {
    res.status(code).json({
      status: "SUCCESS",
      code: code,
      message: message,
      data: data,
    });
  },
  errorMsgResponse: (res, code, message) => {
    res.status(code).json({
      status: "ERROR",
      code: code,
      message: message,
    });
  },
  errorResponse: (res, errName) => {
    log.debug(errors[errName]);
    res.status(errors[errName].status).json({
      error: errors[errName].error,
      errorCode: errors[errName].errorCode,
    });
  },
};

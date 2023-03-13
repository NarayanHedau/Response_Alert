let mongoose = require("mongoose");
let connection = require("../helper/database");
let log = require("../helper/logger");
let ERRORS = require("../helper/errorMessage");

let User = mongoose.model("User");
let Customer = mongoose.model("Customer");
let Staff = mongoose.model("Staff");
const bcrypt = require("bcrypt");
const saltRounds = 10;

module.exports = {
  register: (data) => {
    return new Promise((resolve, reject) => {
      // log.debug("register");
      User.findOne({
        email: data.email,
      })
        .then((resUser) => {
          if (resUser) {
            reject(ERRORS.USER_ALREADY_REGISTERED);
          } else {
            bcrypt.genSalt(saltRounds, function (err, salt) {
              bcrypt.hash(data.password, salt, function (err, hash) {
                data["password"] = hash;
                var user = new User(data);
                user
                  .save()
                  .then((resData) => {
                    resolve(resData);
                  })
                  .catch((error) => {
                    log.error(error);
                    reject(ERRORS.SOMETHING_WENT_WRONG);
                  });
              });
            });
          }
        })
        .catch((error) => {
          log.error(error);
          reject(ERRORS.SOMETHING_WENT_WRONG);
        });
    });
  },

  // loginWithSocial: (data) => {
  //   return new Promise((resolve, reject) => {
  //     var object = {};
  //     if (data.hasOwnProperty("email")) {
  //       object["email"] = data.email;
  //     }
  //     User.findOne({
  //       ...object,
  //       status: {
  //         $ne: "deleted",
  //       },
  //     }).then((resUser) => {
  //       if (resUser) {
  //         resolve(resUser);
  //       } else {
  //         var obj = {
  //           email: data && data.email ? data.email : null,
  //           firstName: data.firstName,
  //           lastName: data.lastName,
  //           designation: "User",
  //           loginType: data.loginType,
  //           // isEmailVerified: data && data.email ? "Verified" : "Not",
  //         };
  //         var user = new User(obj);
  //         user
  //           .save()
  //           .then((resData) => {
  //             resolve(resData);
  //           })
  //           .catch((error) => {
  //             console.log("error", error);

  //             reject(error);
  //           });
  //       }
  //     });
  //   });
  // },

  // login: (user) => {
  //   return new Promise((resolve, reject) => {
  //     // log.info("user", user);
  //     var object = {};
  //     if (user.hasOwnProperty("email")) {
  //       object["email"] = user.email;
  //     } else {
  //       object["mobileNumber"] = user.mobileNumber;
  //     }
  //     User.findOne({
  //       ...object,
  //       status: {
  //         $ne: "deleted",
  //       },
  //     })
  //       .then((resData) => {
  //         if (!resData) {
  //           reject("Please enter correct email and password");
  //         } else {
  //           if (resData.isEmailVerified !== "VERIFIED") {
  //             reject("PENDING");
  //           } else {
  //             bcrypt.compare(
  //               user.password,
  //               resData.password,
  //               function (err, result) {
  //                 if (result) {
  //                   User.findByIdAndUpdate(
  //                     { _id: resData._id },
  //                     { isOnline: true },
  //                     { $new: true }
  //                   )
  //                     .then((response) => {
  //                       delete resData.password;
  //                       delete resData.location;
  //                       resolve(resData);
  //                     })
  //                     .catch((error) => {
  //                       reject("Something went wrong");
  //                     });
  //                 } else {
  //                   reject("wrong password");
  //                 }
  //               }
  //             );
  //           }
  //         }
  //       })
  //       .catch((error) => {
  //         log.error(error);
  //         reject(error);
  //       });
  //   });
  // },

  login: (user) => {
    return new Promise(async (resolve, reject) => {
      let object = {};
      if (user.hasOwnProperty("email")) {
        object["email"] = user.email;
      } else {
        object["userName"] = user.userName;
      }

      let userData = await User.findOne({
        ...object,
        status: {
          $ne: "deleted",
        },
      });

      let customerData = await Customer.findOne({
        ...object,
        status: {
          $ne: "deleted",
        },
      });

      let staffData = await Staff.findOne({
        ...object,
        status: {
          $ne: "deleted",
        },
      });
    

      // for dealer and admin
      if (userData) {
        if (userData.isEmailVerified !== "VERIFIED") {
          reject("PENDING");
        } else {
          let cmpPass = await bcrypt.compare(user.password, userData.password);
          console.log(">>>>>>>>>>>>>>>>", cmpPass)
          if (cmpPass == true) {
            let updatedData = await User.findByIdAndUpdate(
              { _id: userData._id },
              { isOnline: true },
              { $new: true }
            );
            if (updatedData) {
              delete userData.password;
              delete userData.location;
              // if (userData.designation == "DEALER") {
              var responseobj = {
                _id: userData._id,
                email: userData.email,
                mobileNumber: userData.mobileNumber,
                profileURL: userData.profileImg,
                designation: userData.designation,
                username: userData.username,
                address: userData.address,
                activate: userData.activate,
                filter:{
                  minQty:userData.filter.minQty,
                  enable:userData.filter.enable
                },
                // orgDetails: userData.orgDetails,
              };
              resolve(responseobj);
              // } else {
              //   var responseobj = {
              //     _id: userData._id,
              //     email: userData.email,
              //     mobileNumber: userData.mobileNumber,
              //     profileURL: userData.profileImg,
              //     designation: userData.designation,
              //     username: userData.username,
              //     address: userData.address,
              //   };
              //   resolve(responseobj);
              // }
            } else {
              reject("Something went wrong");
            }
          } else {
            reject("wrong password");
          }
        }
      }

      // for customer
      else if (customerData) {
        if (customerData.isEmailVerified !== "VERIFIED") {
          reject("PENDING");
        } else {
          let cmpPass = await bcrypt.compare(
            user.password,
            customerData.password
          );
          if (cmpPass == true) {
            delete customerData.password;
            delete customerData.location;

            var responseobj = {
              _id: customerData._id,
              customerName:customerData.customerName,
              email: customerData.email,
              mobileNumber: customerData.mobileNumber,
              profileURL: customerData.profileImg,
              designation: customerData.designation,
              username: customerData.username,
              address: customerData.address,
              activate:customerData.activate,
              dealerId:customerData.dealerId
            };
            resolve(responseobj);
          } else {
            reject("wrong password");
          }
        }
      }

      // for staff
      else if (staffData) {
        // console.log(">>>>>>>>>>>>>>>>staffData", staffData)
        if (staffData.isEmailVerified !== "VERIFIED") {
          reject("PENDING");
        } else {
          let cmpPass = await bcrypt.compare(user.password, staffData.password);
          if (cmpPass == true) {
            let updatedData = await Staff.findByIdAndUpdate(
              { _id: staffData._id },
              { isOnline: true },
              { $new: true }
            );
            if (updatedData) {
              delete staffData.password;
              delete staffData.location;

              var responseobj = {
                _id: staffData._id,
                creator:staffData.creator,
                designation: staffData.designation,
                staffName:staffData.staffName,
                email: staffData.email,
                mobileNumber: staffData.phone,
                profileURL: staffData.image,
                username: staffData.username,
                address: staffData.address,
                activate:staffData.activate,
                isEmailVerified:staffData.isEmailVerified,
                status:staffData.status,
                

              };
              resolve(responseobj);
            } else {
              reject("Something went wrong");
            }
          } else {
            reject("wrong password");
          }
        }
      } else {
        reject("Please enter correct email and password");
      }
    });
  },

  verifyEmail: (email) => {
    return new Promise((resolve, reject) => {
      log.info("user", email);
      // User.findOne({
      //   encryptedEmail: email,
      // })
      User.findOneAndUpdate(
        { encryptedEmail: email },
        { isEmailVerified: "VERIFIED", encryptedEmail: null, otp: null },
        { new: true }
      )
        .then((resData) => {
          if (resData) {
            // log.info("resData", resData);
            resolve(resData);
          } else {
            reject("Wrong OTP. Please enter correct OTP");
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  // verifyMobile: (mobile, otp) => {
  //   return new Promise((resolve, reject) => {
  //     log.info("user", mobile, otp);
  //     User.findOneAndUpdate(
  //       { mobileNumber: mobile, otp: otp },
  //       { isMobileVerified: "Verified", otp: null },
  //       { new: true }
  //     )
  //       .then((resData) => {
  //         if (resData) {
  //           resolve(resData);
  //         } else {
  //           reject(ERRORS.WRONG_OTP);
  //         }
  //       })
  //       .catch((error) => {
  //         reject(error);
  //       });
  //   });
  // },
};

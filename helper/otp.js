module.exports = {
  generateOTP: function () {
    return Math.floor(1000 + Math.random() * 9000);
  },
  generatePIN: function () {
    return Math.floor(100000000000 + Math.random() * 900000000000);
  },
  generatePass: function () {
    let password = "";
    let possibleText =
      "!@#$%^&ABCDEFGHJKLMNPQRSTUVWXYZabcdefhkmnprstuvwxyz1234567890!@#$%^&";
    for (let i = 0; i < 10; i++)
      password += possibleText.charAt(
        Math.floor(Math.random() * possibleText.length)
      );
    return password;
  },
};

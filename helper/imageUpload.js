const AWS = require("aws-sdk")
const path = require("path")

const config = require("../config.json")

const Jimp = require("jimp");
let multer = require("multer");
var maxSize = 1 * 100000 * 100000;

// require("dotenv").config();
var folderName;

AWS.config.update({
  accessKeyId: config.aws.Access_Key_ID,
  secretAccessKey: config.aws.Secret_Access_Key,
  region: "ap-south-1",
});

const spacesEndpoint = new AWS.Endpoint(config.aws.SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
});


module.exports = {
  upload: (key, file, multi = false) => {
    return new Promise(async (res, rej) => {
      if (file.mimetype === "image/tiff") {
        await Jimp.read(file.buffer)
          .then((image) => {
            image.getBuffer("image/jpeg", (error, data) => {
              if (error) {
                return error;
              }
              file.buffer = data;
              file.mimetype = "image/jpeg";
              file.uniquename = `${file.uniquename.substr(
              0,
              file.uniquename.lastIndexOf(".") < 0
                ? file.uniquename.length
                : file.uniquename.lastIndexOf(".")
            )}.jpeg`;
              file.originalname = `${file.originalname.substr(
              0,
              file.originalname.lastIndexOf(".") < 0
                ? file.originalname.length
                : file.originalname.lastIndexOf(".")
            )}.jpeg`;
            });
          })
          .catch((err) => err);
      }
      console.log("file+++++++++++", file);

      if (
        !path.extname(file.uniquename) ||
        path.extname(file.uniquename) === "."
      ) {
        file.uniquename = `${file.uniquename}${`.${
        file.mimetype.split("/")[1]
      }`}`;
        file.originalname = `${file.originalname}${`.${
        file.mimetype.split("/")[1]
      }`}`;
      }
      console.log("==>>>>>>image")

      const params = {
        Bucket: config.aws.BUCKET,
        Key: `${config.aws.SPACES_URL}/${file.uniquename}`,
        Body: file.buffer,
        ACL: "public-read",
        ContentType: file.mimetype,
        ContentDisposition: `inline; filename="${file.originalname}"`,
      };
      s3.upload(params, (error, data) => {
        if (error) {
          console.log("upload -> error", error);
          rej(error);
        } else {
          res(data.Location);
        }
      });
    });
  },

  multiUpload: async (key, files) => {
    // console.log("files", files);
    // return;
    const arr = Array.isArray(files) ? files : [files];
    const uploadedFiles = arr.map((fileObje) => upload(key, fileObje, true));
    return Promise.all(uploadedFiles);
  }
}
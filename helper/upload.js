// let multer = require("multer");
let config = require("../config.json");
let AWS = require("aws-sdk");
const ffmpeg = require("fluent-ffmpeg");
var fs = require("fs");
const ffmpeg_static = require("ffmpeg-static");
var path = require("path");
AWS.config.update({
  accessKeyId: config.aws.Access_Key_ID,
  secretAccessKey: config.aws.Secret_Access_Key,
  region: "ap-south-1",
});

const spacesEndpoint = new AWS.Endpoint(config.aws.SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
});

const removeFile = (outputPath) => {
  return fs.unlinkSync(outputPath);
};
module.exports = {
  upload: (file) => {
    console.log("=====>>>" , file)
    return new Promise(async (res, rej) => {
      if (file.mimetype == "image/jpeg" || file.mimetype == "image/png" || file.mimetype == "video/mp4") {
        fs.readFile(
          path.join(__dirname, "../", "public/uploads/" + globalString),
          (screenshotError, vidRes) => {
            console.log("addVideo -> fileContent", vidRes, screenshotError);
            const params = {
              Bucket: config.aws.BUCKET,
              Key: `${config.aws.SPACES_URL}/${globalString}`,
              Body: vidRes,
              ACL: "public-read",
              ContentType: "image/png",
              ContentDisposition: `inline; filename="${globalString}"`,
            };
            s3.upload(params, (error, video) => {
              if (error) {
                console.log("upload -> error", error);
                rej(error);
              } else {
                res({ fileURL: video.Location });
              }
            });
          }
        );
      } else {
        fs.readFile(
          path.join(__dirname, "../", "public/uploads/" + globalString),
          (screenshotError, vidRes) => {
            console.log("addVideo -> fileContent", vidRes, screenshotError);
            var videoUrl;
            const params = {
              Bucket: config.aws.BUCKET,
              Key: `${config.aws.SPACES_URL}/${globalString}`,
              Body: vidRes,
              ACL: "public-read",
              ContentType: file.mimetype,
              ContentDisposition: `inline; filename="${globalString}"`,
            };
            s3.upload(params, (error, video) => {
              if (error) {
                console.log("upload -> error", error);
                rej(error);
              } else {
                videoUrl = video.Location;
                const screenshots =
                  "temp" + Math.round(new Date().getTime() / 1000) + ".png";
                var thumbnail;
                ffmpeg(
                  path.join(__dirname, "../", "public/uploads/" + globalString)
                )
                  .setFfmpegPath(ffmpeg_static)
                  .screenshots({
                    timestamps: [1.5],
                    count: 1,
                    filename: screenshots,
                    folder: path.join(__dirname, "../public/uploads/"),
                  })
                  .on("end", () => {
                    fs.readFile(
                      path.join(
                        __dirname,
                        "../",
                        "public/uploads/" + screenshots
                      ),
                      (screenshotError, fileRes) => {
                        console.log(
                          "addVideo -> fileContent",
                          fileRes,
                          screenshotError
                        );
                        const params = {
                          Bucket: config.aws.BUCKET,
                          Key: `${config.aws.SPACES_URL}/${screenshots}`,
                          Body: fileRes,
                          ACL: "public-read",
                          ContentType: "image/png",
                          ContentDisposition: `inline; filename="${screenshots}"`,
                        };
                        s3.upload(params, (error, thmb) => {
                          if (error) {
                            console.log("upload -> error", error);
                            rej(error);
                          } else {
                            thumbnail = thmb.Location;
                            console.log(
                              "🚀 ~ file: upload.js ~ line 81 ~ s3.upload ~ thumbnail",
                              thumbnail
                            );
                            res({ fileURL: videoUrl, thumbnail: thumbnail });

                            removeFile(
                              path.join(
                                __dirname,
                                "../public/uploads",
                                globalString
                              )
                            );
                            removeFile(
                              path.join(
                                __dirname,
                                "../public/uploads",
                                screenshots
                              )
                            );
                          }
                        });
                      }
                    );
                  });
              }
            });
          }
        );
      }
    });
  },
};

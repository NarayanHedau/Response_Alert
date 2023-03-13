let config = require("../config.json"); let router = require("express");
const app = router; let _ = require("lodash");
const http = require("http");
const net = require("net");
const socketIO = require("socket.io");
const server = net.createServer(app);
const server2= http.createServer(app)
const io = socketIO(server);
const io2 = socketIO(server2);
const {main}= require('./eview/tracker/protocolAnalysis')
const trackerResData = require("../routes/temp/temp")
//  let websocket 
// io2.on("connection", async (socket) => { 
//   websocket =socket
//   socket.
//    console.log("<<<<<<<<connect>>>>>>>>", socket.id); 
//     socket.on("disconnect", async () => {
       
//         console.log("<<<<<<<disconnected>>>>>>>", socket.id); 
//      });
//     });
//     server2.listen(1999, (res) => { 
//        console.log(`Socket iO running on : ${config.socketConn.port}`);
//       });




var writable = require('fs').createWriteStream('test.txt');

net.createServer(function (socket) {
  console.log('socket connected',);


  dataArr = []
  socket.on('data', function (data) {
    var line = []
    line = data.toJSON().data;
    line.map((e) => {
      dataArr.push(e.toString(16))

    })
    // hexStringToByteArray(dataArr)
    
  //  websocket.emit("test",stringObj);
    dataArr.forEach((element, i) => {
      if (element === "1" || element === "2" || element === "3" || element === "4" || element === "5" || element === "6" || element === "7" || element === "8" || element === "9"
        || element === "a" || element === "b" || element === "c" || element === "d" || element === "e" || element === "f" || element === "0") {
        let a = "0" + element
        dataArr[i] = a
      }
    });
    console.log("🚀 ~ file: socketController.js:43 ~  hexStringToByteArray(data.split(","))",  main(dataArr))
    trackerResData(main(dataArr))
  });
  socket.on('end', function () {
    console.log('end');
  });
  socket.on('close', function () {
    console.log('close');
  });
  socket.on('error', function (e) {
    console.log('error ', e);
  });
}).listen(9153, function () {
  console.log('TCP Server is listening on port 9153');
})
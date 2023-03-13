const mongoose = require("mongoose"),
  Schema = mongoose.Schema;
let temp = new Schema({
    title:{type:Array}
}, {timestamps:true});

module.exports=mongoose.model("Temp", temp) 
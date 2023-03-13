let mongoose = require("mongoose"),
schema = mongoose.Schema;


let Help =new schema({
    name: {type:String},
    email: {type:String},
    phone: {type:String},
    contactNo: {type:String},
    questionAnswer:[
        {
            question:{type:String},
            answer:{type:String}
        }
    ],
    status:{type:String, default: "active"}
},{ timestamps: true });

module.exports=mongoose.model("Help",Help);
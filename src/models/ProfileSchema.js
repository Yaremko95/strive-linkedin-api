const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const v = require("validator");


const ProfileSchema = new Schema ({

    username:{
        type:String,
        required:true
    },

})


const ProfileModel = mongoose.model("Profile", ProfileSchema);
module.exports = ProfileModel;
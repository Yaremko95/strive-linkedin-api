const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const v = require("validator");
const ProfileModel = require('./ProfileSchema')

const PostSchema = new Schema ({
    text:{
        type:String,
        required:true
    },


    image:{
        type:String,
        // validate: {
        //     validator: (url) => {
        //         if (!v.isURL(url)) {
        //             throw new Error("url: not valid");
        //         }
        //     },
        // },
        required:true
    }
}, {timestamps: true})

PostSchema.virtual('users', {
    ref: 'Profile', // The model to use
    localField: 'user', // Find people where `localField`
    foreignField: 'username', // is equal to `foreignField`
    justOne: false,

});



const PostModel = mongoose.model("Post", PostSchema);
module.exports = PostModel;
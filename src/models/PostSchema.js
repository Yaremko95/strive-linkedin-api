const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const v = require("validator");

const PostSchema = new Schema ({
    _id: {
        type:String,
        required:true
    },
    text:{
        type:String,
        required:true
    },
    username:{
        type:String,
        required:true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "Profile",
        required: true,
    },
    image:{
        type:String,
        validate: {
            validator: (url) => {
                if (!v.isURL(url)) {
                    throw new Error("url: not valid");
                }
            },
        },
        required:true
    }
}, {timestamps: true})

const PostModel = mongoose.model("Post", PostSchema);
module.exports = PostModel;
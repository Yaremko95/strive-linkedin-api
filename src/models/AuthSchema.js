const { Schema } = require("mongoose");
const mongoose = require("mongoose");


const AuthSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    pass: {
        type: String,
        required: true
    },
})

const AuthModel = mongoose.model("User", AuthSchema);
module.exports = AuthModel;
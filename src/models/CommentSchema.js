const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const PostModel = require("./PostSchema");
const UserModel = require("./ProfileSchema");
const CommentSchema = new Schema(
  {
    comment: {
      type: String,
      required: true,
    },
    elementId: {
      type: String,
      required: true,
      validate: async (id) => {
        const postExists = await PostModel.findOne({ _id: id });
        if (!postExists) throw new Error("Post doesn't exists");
        else return true;
      },
    },
    author: {
      type: String,
      required: true,
      validate: async (username) => {
        const userExists = await UserModel.findOne({ username: username });
        if (!userExists) throw new Error("User doesn't exist");
        else return true;
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);

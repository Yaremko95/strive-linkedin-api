const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const v = require("validator");

const UserModel = require("./AuthSchema");

const ProfileSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      validate: {
        validator: async (value) => {
          if (!v.isEmail(value)) {
            throw new Error("Email is invalid");
          } else {
            const checkEmail = await UserModel.findOne({ email: value });
            if (checkEmail) {
              throw new Error("Email already existant!");
            }
          }
        },
      },
      area: {
        type: String,
        required: true,
      },
    },
    image: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      validator: async (value) => {
        const checkUsername = await UserModel.findOne({ username: value });
        if (checkUsername) {
          throw new Error("Username already existant!");
        }
      },
    },
  },
  { timestamps: true }
);

const ProfileModel = mongoose.model("Profile", ProfileSchema);
module.exports = ProfileModel;

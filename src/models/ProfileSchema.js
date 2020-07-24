const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const v = require("validator");
const bcrypt = require("bcrypt");
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
    bio: {
      type: String,
    },
    title: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      // validate: {
      //   validator: async (value) => {
      //     if (!v.isEmail(value)) {
      //       throw new Error("Email is invalid");
      //     } else {
      //       const checkEmail = await ProfileModel.findOne({ email: value });
      //       if (checkEmail) {
      //         throw new Error("Email already existant!");
      //       }
      //     }
      //   },
      // },
      area: {
        type: String,
      },
    },
    image: {
      type: String,
    },
    username: {
      type: String,
      required: true,
      // validate: {
      //   validator: async (value) => {
      //     const checkUsername = await ProfileModel.findOne({ username: value });
      //     if (checkUsername) {
      //       throw new Error("Username already existant!");
      //     }
      //   },
      // },
    },
  },
  { timestamps: true }
);
ProfileSchema.pre("save", async function preSave(next) {
  const user = this;
  if (!user.isModified("password")) next();
  else {
    try {
      const hash = await bcrypt.hash(user.password, 12);
      user.password = hash;
    } catch (e) {
      next(e);
    }
  }
});

ProfileSchema.pre("findOneAndUpdate", async function preUpdate(next) {
  const user = this;

  try {
    console.log(this);
    const hash = await bcrypt.hash(user._update.password, 12);
    this.update({ password: hash });

    next();
  } catch (e) {
    next(e);
  }
  //}
});

ProfileSchema.pre("validate", async function preValidate(next) {
  const user = this;
  const checkUsername = await ProfileModel.findOne({
    $or: [{ username: user.username }, { email: user.email }],
  });
  console.log(checkUsername);
  if (checkUsername && checkUsername._id !== user._id)
    next("username and email  must be unique");
  else next();
});

ProfileSchema.methods.comparePassword = async function comparePassword(
  candidate,
  callback
) {
  bcrypt.compare(candidate, this.password, function (err, isMatch) {
    if (err) return callback(err);
    callback(null, isMatch);
  });
};
const ProfileModel = mongoose.model("Profile", ProfileSchema);
module.exports = ProfileModel;

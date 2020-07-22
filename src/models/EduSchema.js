const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const v = require("validator");
const EducationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    degree: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    username: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      validate: {
        validator: (url) => {
          if (!v.isURL(url)) {
            throw new Error("url: not valid");
          }
        },
      },
      required: true,
    },
  },
  { timestamps: true }
);

const EducationModel = mongoose.model("Education", EducationSchema);

module.exports = EducationModel;

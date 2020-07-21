const { Schema } = require("mongoose")
const mongoose = require("mongoose")

const ExperienceSchema = new Schema({
  
  role: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  image: {
      type: String,
      required: true
  }
},{timestamps: true})

module.exports = mongoose.model("experience", ExperienceSchema)



const express = require("express");
const basicAuth = require("basic-auth");
const multer = require("multer");
const q2m = require("query-to-mongo");
const fs = require("fs").promises;
const { join } = require("path");
const router = express.Router();
const upload = multer();

router.route("/:id").get(async (req, res) => {
  try {
    res.send("users");
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;

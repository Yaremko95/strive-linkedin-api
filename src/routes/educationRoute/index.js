const express = require("express");
const basicAuth = require("basic-auth");
const multer = require("multer");
const q2m = require("query-to-mongo");
const fs = require("fs").promises;
const { join } = require("path");
const Json2csvParser = require("json2csv").Parser;
const pump = require("pump");
const stringify = require("csv-stringify");
const EducationModel = require("../../models/EduSchema");
const router = express.Router();
const upload = multer();
const eduPictureDir = join(__dirname, "../../public/eduPictures");
const uploadFile = require("../../utils/azureBlob");
const MulterAzureStorage = require("multer-azure-storage");
const multerOptions = multer({
  storage: new MulterAzureStorage({
    azureStorageConnectionString: process.env.STORAGE_CS,
    containerName: "educations",
    containerSecurity: "container",
  }),
});
router
  .route("/:userName/educations")
  .get(async (req, res) => {
    try {
      const educations = await EducationModel.find({
        username: req.params.userName,
      });
      res.status(200).send(educations);
    } catch (e) {
      console.log(e);
      res.status(500).send("bad request");
    }
  })
  .post(async (req, res) => {
    try {
      if (req.user.username !== req.params.userName)
        res.status(403).send("unauthorized");
      else {
        const result = await new EducationModel({
          ...req.body,
          username: req.user.username,
        }).save();
        res.status(200).send(result);
      }
    } catch (e) {
      console.log(e);
      res.status(500).send("bad request");
    }
  });
router.route("/:userName/educations/csv").post(async (req, res) => {
  try {
    const data = await EducationModel.find({ username: req.params.userName });
    const jsonData = JSON.parse(JSON.stringify(data));
    console.log(jsonData);
    const csvFields = [
      "id",
      "name",
      "degree",
      "startDate",
      "username",
      "createdAt",
      "updatedAt",
    ];
    const json2csvParser = new Json2csvParser({ csvFields });
    const csvData = json2csvParser.parse(jsonData);
    res.setHeader("Content-disposition", "attachment; filename=customers.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).end(csvData);
  } catch (e) {
    console.log(e);
  }
});

router
  .route("/:userName/educations/:id")
  .get(async (req, res) => {
    try {
      const data = await EducationModel.findById(req.params.id);
      data ? res.status(200).send(data) : res.status(404).send("not found");
    } catch (e) {
      console.log(e);
      res.status(500).send("bad request");
    }
  })
  .put(async (req, res) => {
    try {
      const data = await EducationModel.findById(req.params.id);
      if (req.user.username !== data.username)
        res.status(403).send("unauthorized");
      else {
        const result = await EducationModel.findByIdAndUpdate(req.params.id, {
          ...req.body,
          username: req.user.username,
        });
        if (result) res.status(200).send(result);
        else res.status(404).send("not found");
      }
    } catch (e) {
      console.log(e);
      res.status(500).send("bad request");
    }
  })
  .delete(async (req, res) => {
    try {
      const data = await EducationModel.findById(req.params.id);
      if (req.user.username !== data.username)
        res.status(403).send("unauthorized");
      else {
        const result = await EducationModel.findByIdAndDelete(req.params.id);
        if (result) res.status(200).send("ok");
        else res.status(404).send("not found");
      }
    } catch (e) {
      console.log(e);
      res.status(500).send("bad request");
    }
  });
router
  .route("/:userName/educations/:id/picture")
  .post(multerOptions.single("educations"), async (req, res) => {
    try {
      console.log(req.body);
      const item = await EducationModel.findById(req.params.id);

      if (item) {
        if (item.username === req.user.username) {
          await uploadFile("educations", req.user);
          const result = await EducationModel.findByIdAndUpdate(req.params.id, {
            image: req.file.url,
            username: req.user.username,
          });
          res.status(200).send(result);
        } else {
          res.status(403).send("unauthorised");
        }
      } else {
        res.status(404).send("not found");
      }
    } catch (e) {
      console.log(e);
      res.status(500).send("bad request");
    }
  });

module.exports = router;

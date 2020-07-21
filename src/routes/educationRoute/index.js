const express = require("express");
const basicAuth = require("basic-auth");
const multer = require("multer");
const q2m = require("query-to-mongo");
const fs = require("fs").promises;
const { join } = require("path");
const EducationModel = require("../../models/EduSchema");
const router = express.Router();
const upload = multer();

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
      const user = basicAuth(req);
      if (user.name !== req.body.username) res.status(403).send("unauthorized");
      else {
        await new EducationModel({ ...req.body }).save();
        res.status(200).send("ok");
      }
    } catch (e) {
      console.log(e);
      res.status(500).send("bad request");
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
      const user = basicAuth(req);
      const data = await EducationModel.findById(req.params.id);
      if (user.name !== data.username) res.status(403).send("unauthorized");
      else {
        const result = await EducationModel.findByIdAndUpdate(req.params.id, {
          ...req.body,
          username: user.name,
        });
        if (result) res.status(200).send("ok");
        else res.status(404).send("not found");
      }
    } catch (e) {
      console.log(e);
      res.status(500).send("bad request");
    }
  })
  .delete(async (req, res) => {
    try {
      const user = basicAuth(req);
      const data = await EducationModel.findById(req.params.id);
      if (user.name !== data.username) res.status(403).send("unauthorized");
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

module.exports = router;

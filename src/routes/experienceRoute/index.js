const express = require("express");
const ExperienceSchema = require("./../../models/ExperienceSchema");
const experienceRouter = express.Router();
const basicAuth = require("basic-auth");
const Json2csvParser = require("json2csv").Parser;
const { join } = require("path");
const multer = require("multer");
const fs = require("fs").promises;
const upload = multer();
const expDir = join(__dirname, "../../public/expPictures");
experienceRouter.get("/:userName/experiences", async (req, res, next) => {
  try {
    const experience = await ExperienceSchema.find({
      username: req.params.userName,
    });
    res.status(200).send(experience);
  } catch (error) {
    next(error);
  }
});

experienceRouter.get("/:userName/experiences/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const experience = await ExperienceSchema.findById(id);
    if (experience) {
      res.status(200).send(experience);
    } else {
      const error = new Error();
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    console.log(error);
    next("A problem occurred while reading the experience list!");
  }
});

experienceRouter.post("/:userName/experiences", async (req, res, next) => {
  try {
    if (req.user.username !== req.params.userName)
      res.status(403).send("unauthorized");
    else {
      const newExperience = new ExperienceSchema({
        ...req.body,
        username: req.user.username,
      });
      const result = await newExperience.save();
      res.status(200).send(result);
    }
  } catch (error) {
    next(error);
  }
});
experienceRouter.post("/:userName/experiences/csv", async (req, res) => {
  try {
    const data = await ExperienceSchema.find({ username: req.params.userName });
    const jsonData = JSON.parse(JSON.stringify(data));
    console.log(jsonData);
    const csvFields = [
      "id",
      "role",
      "company",
      "startDate",
      "endDate",
      "description",
      "area",
      "username",
      "createdAt",
      "updatedAt",
    ];
    const json2csvParser = new Json2csvParser({ csvFields });
    const csvData = json2csvParser.parse(jsonData);
    res.setHeader(
      "Content-disposition",
      "attachment; filename=experiences.csv"
    );
    res.set("Content-Type", "text/csv");
    res.status(200).end(csvData);
  } catch (e) {
    console.log(e);
  }
});
experienceRouter.put("/:userName/experiences/:id", async (req, res, next) => {
  try {
    const data = await ExperienceSchema.findById(req.params.id);
    if (req.user.username !== data.username)
      res.status(403).send("unauthorized");
    else {
      const experience = await ExperienceSchema.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          username: req.user.username,
        }
      );
      if (experience) {
        res.status(200).send(experience);
      } else {
        const error = new Error(
          `Experience with id: ${req.params.id} was not found`
        );
        error.httpStatusCode = 404;
        next(error);
      }
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

experienceRouter.delete(
  "/:userName/experiences/:id",
  async (req, res, next) => {
    try {
      const data = await ExperienceSchema.findById(req.params.id);
      if (req.user.username !== data.username)
        res.status(403).send("unauthorized");
      else {
        const experience = await ExperienceSchema.findByIdAndDelete(
          req.params.id,
          { ...req.body, username: req.user.username }
        );

        if (experience) {
          res.status(200).send("Deleted");
        } else {
          const error = new Error(
            `Experience with id: ${req.params.id} was not found`
          );
          error.httpStatusCode = 404;
          next(error);
        }
      }
    } catch (error) {
      next(error);
    }
  }
);
experienceRouter
  .route("/:userName/experiences/:id/picture")
  .post(upload.single("picture"), async (req, res) => {
    try {
      console.log(req.body);
      const item = await ExperienceSchema.findById(req.params.id);

      if (item) {
        if (item.username === req.user.username) {
          const [filename, extension] = req.file.mimetype.split("/");
          await fs.writeFile(
            join(expDir, `${req.params.id}.${extension}`),
            req.file.buffer
          );
          let url = `${req.protocol}://${req.host}${
            process.env.ENVIRONMENT === "dev" ? ":" + process.env.PORT : ""
          }/static/expPictures/${req.params.id}.${extension}`;
          const result = await ExperienceSchema.findByIdAndUpdate(
            req.params.id,
            {
              image: url,
              username: req.user.username,
            }
          );
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
module.exports = experienceRouter;

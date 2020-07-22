const express = require("express");
const ExperienceSchema = require("./../../models/ExperienceSchema");
const experienceRouter = express.Router();
const basicAuth = require("basic-auth");

const Json2csvParser = require("json2csv").Parser;
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
    const user = basicAuth(req);
    if (user.name !== req.body.username) res.status(403).send("unauthorized");
    else {
      const newExperience = new ExperienceSchema(req.body);
      const { _id } = await newExperience.save();
      res.status(200).send(_id);
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
    const user = basicAuth(req);
    const data = await ExperienceSchema.findById(req.params.id);
    if (user.name !== data.username) res.status(403).send("unauthorized");
    else {
      const experience = await ExperienceSchema.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
          username: user.name,
        }
      );
      if (experience) {
        res.status(200).send("Ok");
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
      const user = basicAuth(req);
      const data = await ExperienceSchema.findById(req.params.id);
      if (user.name !== data.username) res.status(403).send("unauthorized");
      else {
        const experience = await ExperienceSchema.findByIdAndDelete(
          req.params.id,
          { ...req.body, username: user.username }
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

module.exports = experienceRouter;

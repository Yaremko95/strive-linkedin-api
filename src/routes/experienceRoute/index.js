const express = require("express");
const ExperienceSchema = require("./../../models/ExperienceSchema");
const experienceRouter = express.Router();
const basicAuth = require("basic-auth");
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

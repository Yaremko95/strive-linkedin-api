const express = require("express");
const ProfileSchema = require("../../models/ProfileSchema");
const basicAuth = require("basic-auth");
const multer = require("multer");
const q2m = require("query-to-mongo");
const fs = require("fs").promises;
const { join } = require("path");
const router = express.Router();
const upload = multer();

const profilesDirectory = join(__dirname, "../../public/posts");

const profilesRouter = express.Router();

profilesRouter.get("/", async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const profiles = await ProfileSchema.find(
      query.criteria,
      query.options.fields
    )
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort);

    res.send({
      data: profiles,
      total: profiles.length,
    });
  } catch (error) {
    next(error);
  }
});

profilesRouter.get("/:username", async (req, res, next) => {
  try {
    const username = req.params.username;
    const profile = await ProfileSchema.findById(username);
    res.send(profile);
  } catch (error) {
    console.log(error);
    next("While reading profiles list a problem occurred!");
  }
});

profilesRouter.post("/", async (req, res, next) => {
  try {
    console.log(req.body);
    const user = basicAuth(req);
    const newProfile = await new ProfileSchema({
      ...req.body,
      username: user.name,
    });
    const { _id } = await newProfile.save();

    res.status(201).send(_id);
  } catch (error) {
    next(error);
  }
});

profilesRouter.put("/:username", async (req, res, next) => {
  try {
    const user = basicAuth(req);
    if (user.name !== req.params.username) res.status(403).send("unauthorized");
    else {
      const profile = await ProfileSchema.findOneAndUpdate(
        { username: user.name },
        {
          ...req.body,
          username: user.name,
        },
        { runValidators: true }
      );
      if (profile) {
        res.send("Ok");
      } else {
        const error = new Error(
          `Profile with username ${req.params.username} not found`
        );
        error.httpStatusCode = 404;
        next(error);
      }
    }
  } catch (error) {
    next(error);
  }
});

profilesRouter.delete("/:username", async (req, res, next) => {
  try {
    const user = basicAuth(req);
    if (user.name !== req.params.username) res.status(403).send("unauthorized");
    else {
      await ProfileSchema.findOneAndDelete({ username: user.name }, function (
        err,
        docs
      ) {
        if (err) {
          console.log(err);
          next(err);
        } else {
          console.log("Deleted User : ", docs);
          res.send("Deleted");
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = profilesRouter;

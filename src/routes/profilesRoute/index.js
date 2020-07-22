const express = require("express");
const ProfileSchema = require("../../models/ProfileSchema");
const basicAuth = require("basic-auth");
const multer = require("multer");
const q2m = require("query-to-mongo");
const fs = require("fs").promises;
const { join } = require("path");
const getPdf = require("../../utils/generatePdf/getPdf");
const router = express.Router();
const upload = multer();

const profilesDirectory = join(__dirname, "../../public/profiles");

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
    const profile = await ProfileSchema.findOne({
      username: req.params.username,
    });
    res.send(profile);
  } catch (error) {
    console.log(error);
    next("While reading profiles list a problem occurred!");
  }
});

profilesRouter.get("/:username/pdf", async (req, res, next) => {
  try {
    await ProfileSchema.aggregate([
      { $match: { username: req.params.username } },
      {
        $lookup: {
          from: "experiences",
          localField: "username",
          foreignField: "username",
          as: "experiences",
        },
      },
      {
        $lookup: {
          from: "educations",
          localField: "username",
          foreignField: "username",
          as: "educations",
        },
      },
    ]).exec(async (err, user) => {
      if (err) {
        next(err);
      }
      user[0].experiences.forEach((time) => {
        time.startDate = new Date(time.startDate).getFullYear();
        if (time.endDate) time.endDate = new Date(time.endDate).getFullYear();
      });
      user[0].educations.forEach((time) => {
        time.startDate = new Date(time.startDate).getFullYear();
        if (time.endDate) time.endDate = new Date(time.endDate).getFullYear();
      });

      const pdf = await getPdf(user[0], (stream) => {
        res.set("Content-type", "application/pdf");
        stream.pipe(res);
      });
    });
  } catch (e) {
    console.log(e);
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

profilesRouter
  .route("/:profileId")
  .post(upload.single("post"), async (req, res) => {
    try {
      const profile = await ProfileSchema.findById(req.params.profileId);
      const user = basicAuth(req);
      if (profile) {
        if (profile.username === user.name) {
          const [filename, extension] = req.file.mimetype.split("/");
          await fs.writeFile(
            join(profilesDirectory, `${req.params.profileId}.${extension}`),
            req.file.buffer
          );

          let url = `${req.protocol}://${req.host}${
            process.env.ENVIRONMENT === "dev" ? ":" + process.env.PORT : ""
          }/static/profiles/${req.params.profileId}.${extension}`;
          await ProfileSchema.findByIdAndUpdate(req.params.profileId, {
            image: url,
            username: user.name,
          });
          res.status(200).send("ok");
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

module.exports = profilesRouter;

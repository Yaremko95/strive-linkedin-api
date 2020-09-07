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
const authorization = require("../../utils/auth");
const passport = require("passport");
const profilesDirectory = join(__dirname, "../../public/profiles");
const jwt = require("jsonwebtoken");

const profilesRouter = express.Router();

profilesRouter.get("/", authorization, async (req, res, next) => {
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
      data: profiles.map((profile) => {
        profile.password = "";
        return profile;
      }),
      total: profiles.length,
    });
  } catch (error) {
    next(error);
  }
});

profilesRouter.get("/:username", authorization, async (req, res, next) => {
  try {
    const username = req.params.username;
    const profile = await ProfileSchema.findOne({
      username: req.params.username,
    });
    console.log(profile);
    profile.password = "";
    res.send(profile);
  } catch (error) {
    console.log(error);
    next("While reading profiles list a problem occurred!");
  }
});

profilesRouter.get("/:username/pdf", authorization, async (req, res, next) => {
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
      user.password = "";
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
    const newUser = await new ProfileSchema({
      ...req.body,
      refresh_tokens: [],
    }).save();
    res.status(200).send({ _id: newUser._id });
  } catch (e) {
    console.log(e);
    const err = new Error(e);
    err.httpStatusCode = 500;
    next(err);
  }
});

profilesRouter.put("/:username", authorization, async (req, res, next) => {
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
        res.send(profile);
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

profilesRouter.post("/logout", async (req, res, next) => {
  try {
    req.user.refresh_tokens = req.user.refresh_tokens.filter(
      (t) => t !== req.cookies.refreshToken
    );
    await ProfileSchema.findOneAndUpdate(
      { _id: req.user._id },
      { refresh_tokens: req.user.refresh_tokens }
    );

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).send();
  } catch (e) {
    console.log(e);
    next(e);
  }
});

profilesRouter.route("/login").post(async (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },
    async (err, user, info) => {
      if (err || !user) {
        return res.status(400).json({
          message: info,
        });
      }
      req.login(user, { session: false }, async (err) => {
        if (err) {
          res.status(500).send(err);
        }
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY, {
          expiresIn: "150000",
        });
        const refreshToken = jwt.sign(
          { _id: user._id },
          process.env.REFRESH_JWT_KEY,
          {
            expiresIn: "1 week",
          }
        );
        user.refresh_tokens = user.refresh_tokens.concat(refreshToken);
        console.log(user);
        await ProfileSchema.findOneAndUpdate(
          { _id: user._id },
          { refresh_tokens: user.refresh_tokens }
        );
        res.cookie("accessToken", token, {
          path: "/",
          httpOnly: true,
        });

        res.cookie("refreshToken", refreshToken, {
          path: "/",
          httpOnly: true,
        });

        return res.json({ token, refreshToken });
      });
    }
  )(req, res, next);
});

profilesRouter
  .route("/:profileId")
  .post(upload.single("profile"), authorization, async (req, res) => {
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
          const result = await ProfileSchema.findByIdAndUpdate(
            req.params.profileId,
            {
              image: url,
              username: user.name,
            }
          );
          result.password = "";
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

module.exports = profilesRouter;

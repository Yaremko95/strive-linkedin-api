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
const { authenticate } = require("./helpers");
const uploadFile = require("../../utils/azureBlob");
require("dotenv").config();

const MulterAzureStorage = require("multer-azure-storage");
const multerOptions = multer({
  storage: new MulterAzureStorage({
    azureStorageConnectionString: process.env.STORAGE_CS,
    containerName: "profile",
    containerSecurity: "container",
  }),
});

const profilesRouter = express.Router();

profilesRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
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
          profile.refresh_tokens = [];
          return profile;
        }),
        total: profiles.length,
      });
    } catch (error) {
      next(error);
    }
  }
);
profilesRouter
  .route("/me")
  .get(
    passport.authenticate("jwt", { session: false }),
    async (req, res, next) => {
      try {
        res
          .status(200)
          .send({ ...req.user._doc, password: "", refresh_tokens: [] });
      } catch (e) {
        const error = new Error();
        error.httpStatusCode = 404;
        next(error);
      }
    }
  );

profilesRouter.get(
  "/:username",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      const username = req.params.username;
      const profile = await ProfileSchema.findOne({
        username: req.params.username,
      });
      console.log(profile);
      profile.password = "";
      profile.refresh_tokens = [];
      res.send(profile);
    } catch (error) {
      console.log(error);
      next("While reading profiles list a problem occurred!");
    }
  }
);

profilesRouter.get(
  "/:username/pdf",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
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
  }
);

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

profilesRouter.put(
  "/:username",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
    try {
      // const user = basicAuth(req);

      if (req.user.username !== req.params.username)
        res.status(403).send("unauthorized");
      else {
        delete req.body.refresh_tokens;
        delete req.body.facebookId;
        delete req.body.googleid;
        delete req.body._id;
        const profile = await ProfileSchema.findOneAndUpdate(
          { _id: req.user._id },
          {
            ...req.body,
            _id: req.user._id,
          },
          { runValidators: true }
        );
        if (profile) {
          res.send({ ...profile._doc, refresh_tokens: [], password: "" });
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
  }
);

profilesRouter.post(
  "/logout",
  passport.authenticate("jwt", { session: false }),
  async (req, res, next) => {
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
  }
);

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
          expiresIn: "1 week",
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
        });

        res.cookie("refreshToken", refreshToken, {
          path: "/",
        });

        return res.json({ ...user._doc, refresh_tokens: [], password: "" });
      });
    }
  )(req, res, next);
});

profilesRouter.route("/refreshToken").post(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_KEY);
    const user = await ProfileSchema.findOne({ _id: decoded._id });
    if (!user) {
      console.log("no user");

      res.status(401).send("no user");
    } else {
      const currentToken = user.refresh_tokens.find(
        (token) => token === refreshToken
      );
      if (!currentToken) {
        console.log("no token");

        res.status(401).send("no token");
      } else {
        user.refresh_tokens = user.refresh_tokens.filter(
          (t) => t !== currentToken
        );
        const data = await authenticate(user);
        res.cookie("accessToken", data.token, {
          path: "/",
        });

        res.cookie("refreshToken", data.refreshToken, {
          path: "/",
        });
        res.send({ ...user._doc, refresh_tokens: [], password: "" });
      }
    }
  } else {
    console.log("catch");

    res.status(401).send();
  }
});

profilesRouter
  .route("/:profileId")
  .post(
    passport.authenticate("jwt", { session: false }),
    multerOptions.single("profile"),
    async (req, res) => {
      try {
        console.log(req.user._id === req.params.profileId);
        if (req.user._id == req.params.profileId) {
          console.log("good");
          await uploadFile("profile", req.user);

          // let container = await blobClient.getContainerClient("profile");
          // const files = await container.listBlobsFlat();
          //
          // for await (const file of files) {
          //   let url = await container.getBlobClient(file.name).url;
          //   if (url === req.user.image) {
          //     const cont = await blobClient.getContainerClient("profile");
          //     console.log(await cont.getBlobClient(file.name)._name);
          //     await cont.deleteBlob(await cont.getBlobClient(file.name)._name);
          //   }
          // }

          const result = await ProfileSchema.findByIdAndUpdate(
            req.params.profileId,
            {
              image: req.file.url,
              username: req.user.username,
            }
          );
          result.password = "";
          result.refresh_tokens = [];
          res.status(200).send(result);
        } else {
          res.status(403).send("unauthorised");
        }
      } catch (e) {
        console.log(e);
        res.status(500).send("bad request");
      }
    }
  );

profilesRouter.get(
  "/login/facebook",
  passport.authenticate("facebook", { scope: "email" })
);

profilesRouter.get(
  "/login/facebookRedirect",
  passport.authenticate("facebook"),
  async (req, res, next) => {
    try {
      const { id, name, emails } = req.user;
      const isExist = await ProfileSchema.findOne({ email: emails[0].value });
      if (!isExist) {
        const accessToken = jwt.sign({ _id: id }, process.env.JWT_SECRET_KEY, {
          expiresIn: "1 week",
        });
        const refreshToken = jwt.sign(
          { _id: id },
          process.env.REFRESH_JWT_KEY,
          {
            expiresIn: "1 week",
          }
        );
        const user = {
          name: name.givenName,
          surname: name.familyName,
          email: emails[0].value,
          facebookId: id,
          refresh_tokens: [],
          username: emails[0].value,
        };
        const newUser = await new ProfileSchema(user);
        await newUser.save();

        res.cookie("accessToken", accessToken);
        res.cookie("refreshToken", refreshToken);

        return res.status(201).redirect(`${process.env.FE_API}/profile/me`);

        console.log(newUser);
        res.send(newUser);
      } else {
        const accessToken = jwt.sign({ _id: id }, process.env.JWT_SECRET_KEY, {
          expiresIn: "1 week",
        });
        const refreshToken = jwt.sign(
          { _id: id },
          process.env.REFRESH_JWT_KEY,
          {
            expiresIn: "1 week",
          }
        );
        await ProfileSchema.findByIdAndUpdate(isExist.id, {
          $push: { refresh_tokens: [refreshToken] },
        });

        res.cookie("accessToken", accessToken);
        res.cookie("refreshToken", refreshToken);
        return res.status(201).redirect(`${process.env.FE_API}/profile/me`);
      }
    } catch (error) {
      console.log(error);
    }
    // console.log(req.user);
  }
);

profilesRouter.get("/login/linkedin", passport.authenticate("linkedin"));

profilesRouter.get(
  "/login/linkedinRedirect",
  passport.authenticate("linkedin"),
  async (req, res, next) => {
    try {
      const { id, name, emails } = req.user;
      const isExist = await ProfileSchema.findOne({ email: emails[0].value });
      if (!isExist) {
        const accessToken = jwt.sign({ _id: id }, process.env.JWT_SECRET_KEY, {
          expiresIn: "1 week",
        });
        const refreshToken = jwt.sign(
          { _id: id },
          process.env.REFRESH_JWT_KEY,
          {
            expiresIn: "1 week",
          }
        );
        const user = {
          name: name.givenName,
          surname: name.familyName,
          email: emails[0].value,
          linkedinId: id,
          refresh_tokens: [refreshToken],
          username: "",
        };
        const newUser = await new ProfileSchema(user);
        await newUser.save();

        res.cookie("accessToken", accessToken);
        res.cookie("refreshToken", refreshToken);

        return res.status(201).redirect(`${process.env.FE_API}/profile/me`);

        // console.log(newUser);
        // res.send(newUser);
      } else {
        const accessToken = jwt.sign({ _id: id }, process.env.JWT_SECRET_KEY, {
          expiresIn: "1 week",
        });
        const refreshToken = jwt.sign(
          { _id: id },
          process.env.REFRESH_JWT_KEY,
          {
            expiresIn: "1 week",
          }
        );
        await ProfileSchema.findByIdAndUpdate(isExist.id, {
          $push: { refresh_tokens: [refreshToken] },
        });

        res.cookie("accessToken", accessToken);
        res.cookie("refreshToken", refreshToken);
        return res.status(201).redirect(`${process.env.FE_API}/profile/me`);
      }
    } catch (error) {
      console.log(error);
    }
    // console.log(req.user);
  }
);

module.exports = profilesRouter;

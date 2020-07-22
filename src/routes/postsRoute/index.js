const express = require("express");
const PostSchema = require("../../models/PostSchema");
const basicAuth = require("basic-auth");
const multer = require("multer");
const q2m = require("query-to-mongo");
const fs = require("fs").promises;
const { join } = require("path");
const router = express.Router();
const upload = multer();

const postsDirectory = join(__dirname, "../../public/posts");
router
  .route("/")
  .get(async (req, res, next) => {
    try {
      const { query } = req;

      const queryToMongo = q2m(query);
      const criteria = queryToMongo.criteria;

      for (let key in criteria) {
        if (typeof criteria[key] !== "object") {
          criteria[key] = { $regex: `${criteria[key]}`, $options: "i" };
        }
      }
      await PostSchema.aggregate([
        { $match: criteria },
        {
          $lookup: {
            from: "profiles",
            localField: "username",
            foreignField: "username",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
      ]).exec(function (err, posts) {
        if (err) {
          next(err);
        }
        res.send(posts);
      });
    } catch (e) {
      console.log(e);
      res.status(404).send("not found");
    }
  })
  .post(async (req, res, next) => {
    try {
      const imageUrl =
        "http://localhost:3005/static/profilePictures/default_image.jpg";
      const user = basicAuth(req);

      if (await PostSchema.userExists(user.name)) {
        const result = await new PostSchema({
          ...req.body,
          image: imageUrl,
          username: user.name,
        });
        await result.save();
        res.send("ok");
      } else {
        throw new Error();
      }
    } catch (e) {
      console.log(e);
      res.status(500).send("bad request");
    }
  });
router
  .route("/:id")
  .get(async (req, res) => {
    try {
      const post = await PostSchema.findById(req.params.id);
      if (post) {
        res.status(200).send(post);
      } else {
        res.status(404).send("not found");
      }
    } catch (e) {
      console.log(e);
      res.status(500).send("bad request");
    }
  })
  .put(async (req, res, next) => {
    try {
      const post = await PostSchema.findById(req.params.id);
      const user = basicAuth(req);
      if (post) {
        if (post.username === user.name) {
          await PostSchema.findByIdAndUpdate(req.params.id, {
            ...req.body,
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
  })
  .delete(async (req, res) => {
    try {
      const post = await PostSchema.findById(req.params.id);
      const user = basicAuth(req);
      if (post) {
        if (post.username === user.name) {
          await PostSchema.findByIdAndDelete(req.params.id);
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

router.route("/:postId").post(upload.single("post"), async (req, res) => {
  try {
    const post = await PostSchema.findById(req.params.postId);
    const user = basicAuth(req);
    if (post) {
      if (post.username === user.name) {
        const [filename, extension] = req.file.mimetype.split("/");
        await fs.writeFile(
          join(postsDirectory, `${req.params.postId}.${extension}`),
          req.file.buffer
        );

        let url = `${req.protocol}://${req.host}${
          process.env.ENVIRONMENT === "dev" ? ":" + process.env.PORT : ""
          }/static/posts/${req.params.postId}.${extension}`;
        await PostSchema.findByIdAndUpdate(req.params.postId, {

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

module.exports = router;

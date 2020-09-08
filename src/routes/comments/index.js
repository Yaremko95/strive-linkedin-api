const express = require("express");
const basicAuth = require("basic-auth");
const CommentModel = require("../../models/CommentSchema");

const router = express.Router();

router.route("/").post(async (req, res) => {
  try {
    const result = await new CommentModel({
      ...req.body,

      author: req.user.username,
    }).save();
    res.status(200).send(result);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.route("/:postId").get(async (req, res) => {
  try {
    const comments = await CommentModel.find({ elementId: req.params.postId });
    res.status(200).send(comments);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;

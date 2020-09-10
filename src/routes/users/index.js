const router = require("express").Router();
const passport = require("../auth");

const { generateJWT, generateRefreshJWT } = require("../jwt");

const UserModel = require("./model");

router.get(
  "/login/facebook",
  passport.authenticate("facebook", { scope: "email" })
);

router.get(
  "/login/facebookRedirect",
  passport.authenticate("facebook"),
  async (req, res, next) => {
    try {
      const { id, name, emails } = req.user;
      const isExist = await UserModel.findOne({ email: emails[0].value });
      if (!isExist) {
        const accessToken = await generateJWT({ id: id });
        const refreshToken = await generateRefreshJWT({ id: id });
        const user = {
          name: name.givenName,
          surname: name.familyName,
          email: emails[0].value,
          facebookId: id,
          refresh_tokens: [refreshToken],
        };
        const newUser = await new UserModel(user);
        await newUser.save();

        res.cookie("accessToken", accessToken);
        res.cookie("refreshToken", refreshToken);

        return res.status(201).redirect("http://localhost:3000");

        console.log(newUser);
        res.send(newUser);
      } else {
        const accessToken = await generateJWT({ id: id });
        const refreshToken = await generateRefreshJWT({ id: id });
        await UserModel.findByIdAndUpdate(isExist.id, {
          $push: { refresh_tokens: [refreshToken] },
        });

        res.cookie("accessToken", accessToken);
        res.cookie("refreshToken", refreshToken);
        return res.status(201).redirect("http://localhost:3000");
      }
    } catch (error) {
      console.log(error);
    }
    // console.log(req.user);
  }
);

router.get("/login/linkedin", passport.authenticate("linkedin"));

router.get(
  "/login/linkedinRedirect",
  passport.authenticate("linkedin"),
  async (req, res, next) => {
    try {
      const { id, name, emails } = req.user;
      const isExist = await UserModel.findOne({ email: emails[0].value });
      if (!isExist) {
        const accessToken = await generateJWT({ id: id });
        const refreshToken = await generateRefreshJWT({ id: id });
        const user = {
          name: name.givenName,
          surname: name.familyName,
          email: emails[0].value,
          linkedinId: id,
          refresh_tokens: [refreshToken],
        };
        const newUser = await new UserModel(user);
        await newUser.save();

        res.cookie("accessToken", accessToken);
        res.cookie("refreshToken", refreshToken);

        return res.status(201).redirect("http://localhost:3000");

        // console.log(newUser);
        // res.send(newUser);
      } else {
        const accessToken = await generateJWT({ id: id });
        const refreshToken = await generateRefreshJWT({ id: id });
        await UserModel.findByIdAndUpdate(isExist.id, {
          $push: { refresh_tokens: [refreshToken] },
        });

        res.cookie("accessToken", accessToken);
        res.cookie("refreshToken", refreshToken);
        return res.status(201).redirect("http://localhost:3000");
      }
    } catch (error) {
      console.log(error);
    }
    // console.log(req.user);
  }
);

module.exports = router;

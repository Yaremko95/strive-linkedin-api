const passport = require("passport");
const { Strategy } = require("passport-facebook");
const UserModel = require("../models/ProfileSchema");

require("dotenv").config();

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(
  new Strategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["email", "name"],
    },
    async (accessToken, refreshToken, profile, done) => {
      const userData = {
        name: profile.name.givenName,
        surname: profile.name.familyName,
        email: profile.emails[0].value,
        facebookId: profile.id,
      };
      new UserModel(userData).save();
      console.log("Auth done");
      done(null, profile);
    }
  )
);

module.exports = passport;

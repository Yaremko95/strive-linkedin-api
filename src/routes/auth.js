const passport = require("passport");

const facebookStrategy = require("passport-facebook").Strategy;

const linkedinStrategy = require("passport-linkedin-oauth2").Strategy;

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(
  new facebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: process.env.FACEBOOK_CALLBACK_URL,
      profileFields: ["email", "name"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Auth done");
        done(null, profile);
      } catch (error) {
        console.log(error);
        done(error);
      }
    }
  )
);

passport.use(
  new linkedinStrategy(
    {
      clientID: process.env.LINKEDIN_KEY,
      clientSecret: process.env.LINKEDIN_SECRET,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL,
      scope: ["r_emailaddress", "r_liteprofile"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Auth done");
        done(null, profile);
      } catch (error) {
        console.log(error);
        done(error);
      }
    }
  )
);

module.exports = passport;

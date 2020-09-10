const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const Profile = require("../models/ProfileSchema");
const facebookStrategy = require("passport-facebook").Strategy;

const linkedinStrategy = require("passport-linkedin-oauth2").Strategy;

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    function (email, password, cb) {
      return Profile.findOne({ email }, (err, user) => {
        if (err) return cb(err);
        return user.comparePassword(password, function (err, isMatch) {
          if (err) return cb(err);
          if (isMatch)
            return cb(null, user, { message: "Logged In Successfully" });
          else
            return cb(null, false, { message: "Incorrect email or password." });
        });
      });
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: function (req) {
        let token = null;
        if (req && req.cookies) {
          token = req.cookies["accessToken"];
        }
        return token;
      },
      secretOrKey: process.env.JWT_SECRET_KEY,
    },
    async function (jwtPayload, cb) {
      console.log("jwtPayload", jwtPayload);

      const user = await Profile.findOne({ _id: jwtPayload._id });
      if (user) {
        return cb(null, user);
      } else {
        return cb(null, false, { message: "unauthorized" });
      }
    }
  )
);

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

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

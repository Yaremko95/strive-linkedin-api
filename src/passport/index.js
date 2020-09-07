const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const Profile = require("../models/ProfileSchema");

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

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

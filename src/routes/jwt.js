const jwt = require("jsonwebtoken");

const UserSchema = require("./users/model");

const authenticate = async (user) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15000",
  });
  const refreshToken = jwt.sign(
    { _id: user._id },
    process.env.REFRESH_JWT_SECRET,
    {
      expiresIn: "1 week",
    }
  );
  user.refresh_tokens = user.refresh_tokens.concat(refreshToken);
  await UserSchema.findOneAndUpdate(
    { _id: user._id },
    { refresh_tokens: user.refresh_tokens }
  );
  return { user, token, refreshToken };
};

const generateJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "30s" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

const generateRefreshJWT = (payload) =>
  new Promise((res, rej) =>
    jwt.sign(
      payload,
      process.env.REFRESH_JWT_SECRET,
      { expiresIn: "1 week" },
      (err, token) => {
        if (err) rej(err);
        res(token);
      }
    )
  );

module.exports = {
  generateJWT,
  generateRefreshJWT,
  authenticate,
};

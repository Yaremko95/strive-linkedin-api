const jwt = require("jsonwebtoken");

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
};

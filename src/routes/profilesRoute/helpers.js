const jwt = require("jsonwebtoken");
const Profile = require("../../models/ProfileSchema");

const authenticate = async (user) => {
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: "15000",
  });
  const refreshToken = jwt.sign(
    { _id: user._id },
    process.env.REFRESH_JWT_KEY,
    {
      expiresIn: "1 week",
    }
  );

  user.refresh_tokens = user.refresh_tokens.concat(refreshToken);
  await Profile.findOneAndUpdate(
    { _id: user._id },
    { refresh_tokens: user.refresh_tokens }
  );
  return { user, token, refreshToken };
};

module.exports = { authenticate };

const basicAuth = require("basic-auth");
const AuthSchema = require("../models/ProfileSchema");
module.exports = async (req, res, next) => {
  const user = basicAuth(req);
  console.log(user);

  if (!user || !user.name || !user.pass) {
    res.set("WWW-Authenticate", "Basic realm=Authorization Required");
    res.sendStatus(401);
    return;
  }
  const result = await AuthSchema.findOne({
    username: user.name,
  });
  await result.comparePassword(user.pass, function (err, isMatch) {
    if (err) throw new Error(err);
    if (isMatch) next();
    else {
      res.set("WWW-Authenticate", "Basic realm=Authorization Failed");
      res.sendStatus(401);
      return;
    }
  });
};

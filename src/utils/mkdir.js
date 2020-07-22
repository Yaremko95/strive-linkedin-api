const { join } = require("path");
const mkdir = require("@root/mkdirp");
const createDirectories = () => {
  let postsdir = join(__dirname, "../", "public/posts");
  let profilesDir = join(__dirname, "../", "public/profiles");
  let eduDir = join(__dirname, "../", "public/eduDir");

  mkdir(postsdir, function (error) {
    if (error) {
      throw error;
    }
    console.log(postsdir);
  });
  mkdir(profilesDir, function (error) {
    if (error) {
      throw error;
    }
    console.log(profilesDir);
  });
  mkdir(eduDir, function (error) {
    if (error) {
      throw error;
    }
    console.log(eduDir);
  });
};

module.exports = createDirectories;

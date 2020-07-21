const {join} = require("path");
const mkdir = require("@root/mkdirp");
const createDirectories = () => {
    let dir = join(__dirname,"../","public/posts");
    mkdir(dir, function (error) {
        if (error) { throw error; }
        console.log(dir)

    });
}

module.exports = createDirectories;
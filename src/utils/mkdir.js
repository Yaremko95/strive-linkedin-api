const {join} = require("path");
const mkdir = require("@root/mkdirp");
const createDirectories = () => {
    let dir = join(__dirname,"../","files/photos");
    mkdir(dir, function (error) {
        if (error) { throw error; }

    });
}

module.exports = createDirectories;
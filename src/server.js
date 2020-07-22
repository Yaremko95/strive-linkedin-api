const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

const mongoose = require("mongoose");
const authorize = require("./utils/auth");
const postsRouter = require("./routes/postsRoute");
const experienceRouter = require("./routes/experienceRoute");

const profilesRouter = require("./routes/profilesRoute");

const educationRouter = require("./routes/educationRoute");
const makeDirectory = require("./utils/mkdir");

makeDirectory();

dotenv.config();
const app = express();
app.set("twig options", {
  strict_variables: false,
  cache: false,
  auto_reload: true,
});
global.appRoot = __dirname;
app.use("/static", express.static(path.join(__dirname, "./public")));
app.use(cors());
app.use(express.json());
app.use("/profiles", authorize, profilesRouter);
app.use("/profile", authorize, educationRouter);
app.use("/profile", experienceRouter);
app.use("/posts", authorize, postsRouter);

mongoose
  .connect(process.env.MONGOHOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(
    app.listen(process.env.PORT, () => {
      console.log(`Server is running on port ${process.env.PORT}`);
    })
  );

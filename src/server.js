const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const listEndpoints = require("express-list-endpoints");
const mongoose = require("mongoose");
const authorize = require("./utils/auth");
const postsRouter = require("./routes/postsRoute");
const experienceRouter = require("./routes/experienceRoute");
const commentsRouter = require("./routes/comments");
const profilesRouter = require("./routes/profilesRoute");
const educationRouter = require("./routes/educationRoute");
const makeDirectory = require("./utils/mkdir");

const allowedOrigins = [
  "http://localhost:3000",
  "https://agile-brushlands-83006.herokuapp.com/",
];

makeDirectory();

dotenv.config();
const app = express();
app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json"
  );
  next();
});

app.set("twig options", {
  strict_variables: false,
  cache: false,
  auto_reload: true,
});
global.appRoot = __dirname;
app.use("/static", express.static(path.join(__dirname, "./public")));

app.use(express.json());
app.use("/profile", profilesRouter);
app.use("/profile", authorize, educationRouter);
app.use("/profile", experienceRouter);
app.use("/posts", authorize, postsRouter);
app.use("/comments", authorize, commentsRouter);
console.log(listEndpoints(app));
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

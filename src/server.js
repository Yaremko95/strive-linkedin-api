const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require('mongoose')
const authorize = require('./utils/auth')
const postsRouter = require('./routes/postsRoute')
const experienceRouter = require("./routes/experienceRoute");
const profileRouter = require("./routes/profileRoute");
const educationRouter = require("./routes/educationRoute");
const makeDirectory = require("./utils/mkdir");

makeDirectory();
dotenv.config();
const app = express();
global.appRoot = __dirname;
app.use("/static", express.static(path.join(__dirname, "./public")));
app.use(cors());
app.use(express.json());
app.use("/profile", authorize, profileRouter);
app.use("/profile", authorize, educationRouter);
app.use("/posts", authorize, postsRouter);

app.use('/posts', authorize,  postsRouter)
app.use('/experience',  experienceRouter)

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

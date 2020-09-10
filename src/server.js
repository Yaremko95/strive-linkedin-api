const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const server = express();

server.use(express.json());
server.use(passport.initialize());
server.use(passport.session());

server.use("/users", require("./routes/users"));

const port = process.env.PORT || 3002;

mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Connected");
  })
  .then(
    server.listen(port, () => {
      console.log("Running");
    })
  );

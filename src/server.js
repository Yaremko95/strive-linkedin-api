const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require('mongoose')

dotenv.config();
const app = express();
global.appRoot = __dirname;
app.use("/static", express.static(path.join(__dirname, "./public")));
app.use(cors());
app.use(express.json());

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
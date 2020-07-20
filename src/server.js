const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
global.appRoot = __dirname;
app.use("/static", express.static(path.join(__dirname, "./public")));
app.use(cors());
app.use(express.json());

app.listen(process.env.PORT, () => {
    console.log("running on ", process.env.PORT);
});

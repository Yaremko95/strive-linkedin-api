const express = require("express");
const cors = require("cors");
const path = require("path");

const listEndpoints = require("express-list-endpoints");

const mongoose = require("mongoose");

const postsRouter = require("./src/routes/postsRoute");
const experienceRouter = require("./src/routes/experienceRoute");
const commentsRouter = require("./src/routes/comments");
const profilesRouter = require("./src/routes/profilesRoute");
const educationRouter = require("./src/routes/educationRoute");

const makeDirectory = require("./src/utils/mkdir");
makeDirectory();
const passport = require("passport");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const pass = require("./src/passport");
const socket = require("socket.io");
const { authorizeSocket, socketHandler } = require("./src/routes/socket");
const app = express();
app.use(passport.initialize());
app.use(cookieParser());
const whitelist = ["http://localhost:3000"];
const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
// app.use(function (req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json"
//   );
//   next();
// });

app.set("twig options", {
  strict_variables: false,
  cache: false,
  auto_reload: true,
});
global.appRoot = __dirname;
app.use("/static", express.static(path.join(__dirname, "./public")));

app.use(express.json());
app.use("/profile", profilesRouter);
app.use(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  educationRouter
);
app.use(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  experienceRouter
);
app.use(
  "/posts",
  passport.authenticate("jwt", { session: false }),
  postsRouter
);
app.use(
  "/comments",
  passport.authenticate("jwt", { session: false }),
  commentsRouter
);
console.log(listEndpoints(app));
const index = app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
mongoose
  .connect(process.env.MONGOHOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(index);
const io = socket(index);
io.use(authorizeSocket);
const pub = require("redis").createClient(
  6380,
  "linkedin.redis.cache.windows.net",
  {
    auth_pass: "TLHylwE0D3MRPXOzpsSqWg98fWCPVCyNysDeqoAqR4o=",
    tls: {
      servername: "linkedin.redis.cache.windows.net",
    },
  }
);
const sub = require("redis").createClient(
  6380,
  "linkedin.redis.cache.windows.net",
  {
    auth_pass: "TLHylwE0D3MRPXOzpsSqWg98fWCPVCyNysDeqoAqR4o=",
    tls: {
      servername: "linkedin.redis.cache.windows.net",
    },
  }
);
const socketio_redis = require("socket.io-redis");
io.adapter(socketio_redis({ pubClient: pub, subClient: sub }));

const redis = require("redis");
socketHandler(io);
// io.on("connection", socketHandler);

// pub.on("ready", function () {
//   console.log("PUB Ready!");
//   sub.on("ready", function () {
//     sub.subscribe("chat:messages:latest", "chat:people:new");
//
//     io.on("connection", function (socket) {
//       socket.emit("io:welcome", "hi!");
//
//       socket.on("io:name", function (name) {
//         pub.hset("people", socket.client.conn.id, name.username);
//         console.log(
//           socket.client.conn.id + " > " + name.username + " joined chat!"
//         );
//         pub.publish("chat:people:new", name.username);
//       });
//
//       socket.on("io:message", function (data) {
//         const msg = data.msg;
//         console.log("msg:", msg);
//
//         pub.hget("people", socket.client.conn.id, function (error, name) {
//           // see: https://github.com/dwyl/hapi-error#handleerror-everywhere
//
//           console.log("io:message received: " + msg + " | from: " + name);
//           let str = JSON.stringify({
//             // store each message as a JSON object
//             m: msg,
//             t: new Date().getTime(),
//             n: name,
//           });
//
//           pub.rpush("chat:messages", str); // chat history
//           pub.publish("chat:messages:latest", str); // latest message
//         });
//       });
//
//       /* istanbul ignore next */
//       socket.on("error", function (error) {
//         console.log(error);
//       });
//     });
//
//     sub.on("message", function (channel, message) {
//       console.log(channel + " : " + message);
//       io.emit(channel, message); // relay to all connected socket.io clients
//     });
//
//     // wait for socket to boot
//   });
// });

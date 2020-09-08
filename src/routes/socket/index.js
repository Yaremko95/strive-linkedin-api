const redis = require("redis");
const redisClient = redis.createClient();
const Profile = require("../../models/ProfileSchema");
const jwt = require("jsonwebtoken");

const authorizeSocket = async (socket, next) => {
  try {
    const { accessToken } = socket.handshake.query;
    if (!accessToken) {
      const error = new Error("unauthorized");
      error.httpStatusCode = 401;
      next(error);
    } else {
      const decoded = jwt.verify(
        accessToken,
        process.env.JWT_SECRET_KEY,
        async function (err, decoded) {
          if (err) {
            const error = new Error("expired");
            error.httpStatusCode = 401;
            next(error);
          } else {
            const user = await Profile.findOne({ _id: decoded._id });
            if (user) {
              socket.user = user;
              next();
            } else {
              const error = new Error("unauthorized");
              error.httpStatusCode = 401;
              next(error);
            }
          }
        }
      );
    }
  } catch (e) {
    throw new Error(e);
  }
};

const socketHandler = (io) => {
  io.on("connection", function (socket) {
    const { user } = socket;
    console.log(socket.user);

    socket.on("login", async (options) => {
      // socket.username = options.username;

      redisClient.lpush(
        "users",
        JSON.stringify({
          _id: user._id,
          username: user.username,
          socketid: socket.id,
        })
      );

      redisClient.lrange("history", 0, -1, function (err, messages) {
        console.log(messages);
        messages = messages
          .map((msg) => JSON.parse(msg))
          .filter(
            (msg) =>
              msg.from === socket.user.username ||
              msg.to === socket.user.username
          );

        io.emit("history", { username: socket.username, history: messages });
      });

      redisClient.lrange("users", 0, -1, function (err, users) {
        console.log(users);
        io.emit("loggedIn", {
          user: {
            _id: user._id,
            username: user.username,
            socketid: socket.id,
          },
          users: users.map((user) => JSON.parse(user)),
        });
      });
    });
    socket.on("sendMsg", (data) => {
      const newMsg = {
        from: socket.user.username,
        to: data.username,
        date: new Date(),
        text: data.text,
      };

      redisClient.lpush("history", JSON.stringify(newMsg));
      socket.broadcast.to(data.id).emit("receiveMsg", newMsg);
    });
    socket.on("typing", function (data) {
      socket.broadcast.emit("typing", data);
    });
    socket.on("disconnect", async (options) => {
      // redisClient.flushdb(function (err, succeeded) {
      //   console.log(succeeded); // will be true if successfull
      // });
      redisClient.lrem(
        "users",
        0,
        JSON.stringify({
          _id: user._id,
          username: user.username,
          socketid: socket.id,
        }),
        function (err, res) {
          redisClient.lrange("users", 0, -1, async function (err, users) {
            io.emit("leave", {
              username: socket.username,
              users: users.map((user) => JSON.parse(user)),
            });
          });
        }
      );
    });
  });
};

module.exports = { socketHandler, authorizeSocket };

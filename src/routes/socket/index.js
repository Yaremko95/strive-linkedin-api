const redis = require("redis");
const redisClient = redis.createClient();
const Profile = require("../../models/ProfileSchema");
const jwt = require("jsonwebtoken");
const uuid = require("uuid");
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

    socket.on("login", async (options) => {
      redisClient.lrange("users", 0, -1, function (err, users) {
        console.log("users", users);
        //checks if there is a user with same socketid
        const userExists = users
          .map((user) => JSON.parse(user))
          .find((json) => {
            return json.socketid === socket.id;
          });
        console.log(userExists);
        if (!userExists) {
          redisClient.lpush(
            "users",
            JSON.stringify({
              _id: user._id,
              username: user.username,
              socketid: socket.id,
            })
          );
        }
        redisClient.lrange("users", 0, -1, function (err, users) {
          console.log(users);
          users = users
            .map((user) => JSON.parse(user))
            .filter((value, index, self) => {
              return (
                self.findIndex((v) => v.username === value.username) === index
              );
            });
          // console.log(users);
          io.emit("loggedIn", {
            users: users,
          });
        });
      });

      redisClient.lrange(`history:${user.username}`, 0, -1, function (
        err,
        messages
      ) {
        console.log(messages);
        messages = messages.map((msg) => JSON.parse(msg));
        socket.emit(`history`, { username: user.username, history: messages });
      });
    });

    socket.on("deleteMsg", (data) => {
      redisClient.lrange(`history:${user.username}`, 0, -1, function (
        err,
        messages
      ) {
        const toDelete = messages
          .map((msg) => JSON.parse(msg))
          .find((msg) => msg._id === data._id);
        redisClient.lrem(
          `history:${user.username}`,
          0,
          JSON.parse(toDelete),
          function (err, res) {
            if (res > 0) {
              redisClient.lrange(`history:${user.username}`, 0, -1, function (
                err,
                msgs
              ) {
                msgs = msgs.map((msg) => JSON.parse(msg));

                socket.emit("history", {
                  username: user.username,
                  history: msgs,
                });
              });
            }
          }
        );
      });
    });
    socket.on("sendMsg", (data) => {
      redisClient.lrange("users", 0, -1, function (err, users) {
        const receivers = users
          .map((user) => JSON.parse(user))
          .filter((json) => {
            return json.username === data.to;
          });
        console.log("receiver", receivers);
        const newMsg = {
          _id: uuid.v1(),
          from: user.username,
          to: data.to,
          date: new Date(),
          text: data.text,
        };
        console.log(newMsg);
        if (receivers.length > 0) {
          receivers.forEach((receiver) => {
            socket.broadcast.to(receiver.socketid).emit("receiveMsg", newMsg);
          });
        }
        redisClient.lpush(`history:${user.username}`, JSON.stringify(newMsg));
        redisClient.lpush(`history:${data.to}`, JSON.stringify(newMsg));
      });
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

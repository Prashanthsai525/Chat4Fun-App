const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const formatMessages = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  getRoomUsers,
  UserLeave,
} = require("./utils/users");

const botName = "Chat4Fun Bot";
const app = express();
const server = http.createServer(app);
const io = socketio(server);
//setup static folder
app.use(express.static(path.join(__dirname, "public")));

//run when a client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    //welcome current user
    socket.emit("message", formatMessages(botName, "Welcome to Chat4Fun !"));

    //broadcast when user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessages(botName, ` ${user.username} has joined the chat`)
      );
    //send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //listen the chat message
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit("message", formatMessages(user.username, msg));
  });

  //runs when client disconnects
  socket.on("disconnect", () => {
    const user = UserLeave(socket.id);

    if (user) {
      io.emit(
        "message",
        formatMessages(botName, `${user.username} has left the chat`)
      );

      //send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = 3000 || process.env.PORT;
server.listen(PORT, () => {
  console.log(`server is running in port ${PORT}`);
});

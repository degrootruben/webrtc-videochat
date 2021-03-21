const express = require("express");
const app = express();
const http = require("http").createServer(app);
const port = process.env.PORT || 5000;

let io;
if (process.env.NODE_ENV === "development") {
    io = require("socket.io")(http, {
        cors: {
            origin: "http://localhost:3000"
        }
    });
} else if (process.env.NODE_ENV === "production") {
    io = require("socket.io")(http);
}

const connectedUsers = {};

io.on("connection", socket => {
    if (!connectedUsers[socket.id]) {
        connectedUsers[socket.id] = socket.id;
    }

    socket.emit("yourID", socket.id);

    io.emit("updateUsers", connectedUsers);

    socket.on("callUser", data => {
        io.to(data.userToCall).emit("userCalling", data);
    });

    socket.on("sendAnswer", data => {
        console.log(data);
        io.to(data.to).emit("callAccepted", data);
    });

    socket.on("disconnect", () => {
        delete connectedUsers[socket.id];
        socket.emit("updateUsers", connectedUsers);
    });

});

http.listen(port, () => {
    console.log("Listening on port " + port);
});
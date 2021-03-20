const express = require("express");
const app = express();
const http = require("http").createServer(app);
const port = process.env.PORT || 5000;
const io = require("socket.io")(http, {
    cors: {
        origin: "http://localhost:3000"
    }
});

io.on("connection", socket => {
    socket.emit("setId", socket.id);

    socket.on("callUser", data => {
        console.log("someone wants to call a user");
        io.to(data.idToCall).emit("userCalling", data);
    });

    socket.on("answerSent", data => {
        console.log("person being called sent back an answer to " + data.from);
        io.to(data.from).emit("callAccepted", data.answer);
    });
});

http.listen(port, () => {
    console.log("Listening on port " + port);
});
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const port = process.env.PORT || 8000;
const io = require("socket.io")(http, {
    cors: {
        origin: "https://localhost:3000"
    }
});

io.on("connection", socket => {
    socket.emit("id", { id: socket.id });

    socket.on("call-user", ({ offer, to }) => {
        socket.join("caller");
        io.to(to).emit("user-calls", { offer, from: socket.id });
    });

    socket.on("answer-call", ({ answer, from }) => {
        io.to("caller").emit("answer-received", { answer });
    });
});

http.listen(port, () => {
    console.log("Listening on port " + port);
});
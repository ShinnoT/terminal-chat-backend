// imports
const { loginValidator } = require("./helpers");
const { createRoom, joinRoom } = require("./handlers");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// HTTP server
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 9000;

// Socket.io server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
    },
});

// app.get("/", (req, res) => {
//     res.status(200).json({ message: "Hello World." });
// });

// NOTE: THINK ABOUT HOW TO USE MIDDLEWARE TO AUTHENTICATE AND AUTHORIZE USERS.
io.on("connection", (socket) => {
    console.log("USER CONNECTED. --> ", socket.id);

    // login
    socket.on("login", async ({ requestType, formData }) => {
        const validationErrors = await loginValidator({
            requestType,
            formData,
            io,
        });

        if (validationErrors) return socket.emit("login", validationErrors);

        if (requestType === "CREATE") createRoom({ io, socket, ...formData });
        if (requestType === "JOIN") joinRoom({ io, socket, ...formData });
    });

    // message handler
    socket.on("sendMessage", ({ username, room_id, message }) => {
        console.log("Send message event called from client.", room_id);
        io.to(room_id).emit("message", { username, message });
        // io.to("secret_chat").emit("message", { username, message });
    });

    // fetch user
    socket.on("fetchUser", () => {
        const user = socket?.data?.user;
        user ? socket.emit("user", user) : socket.emit("user", null);
    });

    // disconnect
    socket.on("disconnect", (reason) => {
        console.log(`USER ${socket.id} DISCONNECTED: `, reason);
        // TODO: display message when user disconnected.
        // const { room_id, username } = socket?.data?.user;
        // io.to(room_id).emit("message", { username, message: "diconnected." });
    });
});

server.listen(port, () => {
    console.log(`Express.js HTTP server listening on port ${port}`);
});

// imports
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

io.on("connection", (socket) => {
    console.log("USER CONNECTED. --> ", socket.id);

    // login
    socket.on("login", async (data) => {
        const { username } = data;

        if (!username)
            return socket.emit("login", {
                success: false,
                error: "Username must not be blank.",
            });

        const allSockets = await io.fetchSockets();
        const userSockets = allSockets.filter(
            (s) => s?.data?.user?.username === username
        );

        if (userSockets.length > 0)
            return socket.emit("login", {
                success: false,
                error: "Username already taken.",
            });

        userData = { id: socket.id, username };

        socket.data.user = userData;
        socket.emit("login", {
            success: true,
            user: userData,
        });
    });

    // fetch user
    socket.on("fetchUser", () => {
        const user = socket?.data?.user;
        user ? socket.emit("user", user) : socket.emit("user", null);
    });

    // disconnect
    socket.on("disconnect", (reason) => {
        console.log(`USER ${socket.id} DISCONNECTED: `, reason);
    });
});

server.listen(port, () => {
    console.log(`Express.js HTTP server listening on port ${port}`);
});

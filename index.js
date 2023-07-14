// imports
const {
    loginValidator,
    sanitizeLoginData,
    fetchAllInRoom,
} = require("./helpers");
const { createRoom, joinRoom } = require("./handlers");
const { sanitizer } = require("./sanitize");
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

// NOTE: THINK ABOUT HOW TO USE MIDDLEWARE TO AUTHENTICATE AND AUTHORIZE USERS.
// NOTE: check https://socket.io/docs/v4/server-socket-instance/ middleware section
io.on("connection", (socket) => {
    console.log("USER CONNECTED. --> ", socket.id);

    // login
    socket.on("login", async ({ requestType, formData }) => {
        const cleanData = sanitizeLoginData({ ...formData });
        const validationErrors = await loginValidator({
            requestType,
            formData: cleanData,
            io,
        });

        if (validationErrors) return socket.emit("login", validationErrors);

        if (requestType === "CREATE")
            await createRoom({ io, socket, ...cleanData });
        if (requestType === "JOIN")
            await joinRoom({ io, socket, ...cleanData });
    });

    // message handler
    socket.on("sendMessage", ({ username, room_id, message }) => {
        console.log(`${username} sending a message to room: ${room_id}`);
        console.log("message:: ", message);
        io.to(room_id).emit("message", { username, message });
    });

    // logging messages handler
    socket.on("loggingMessage", ({ username, room_id, message }) => {
        console.log(`${username} sending a LOG message to room: ${room_id}`);
        io.to(socket?.data?.user?.id).emit("message", { username, message });
    });

    // fetch user
    socket.on("fetchUser", () => {
        const user = socket?.data?.user;
        user ? socket.emit("user", user) : socket.emit("user", null);
    });

    // fetch all users in room
    socket.on("fetchAllOtherUsers", async () => {
        const { user } = socket?.data;
        const socketsInRoom = await fetchAllInRoom({
            io,
            room_id: user?.room_id,
        });
        const otherUsersInRoom = socketsInRoom
            .filter((s) => s?.data?.user?.username !== user?.username)
            .map((s) => s?.data?.user?.username);

        io.to(user?.id).emit("allOtherUsers", {
            user,
            allUsersInRoom: otherUsersInRoom,
        });
    });

    // fetch room details
    socket.on("fetchRoomDetails", async () => {
        const { room_id } = socket?.data?.user;
        const allSockets = await io.fetchSockets();
        const roomIdSockets = allSockets.filter(
            (s) => s?.data?.user?.room_id === room_id
        );
        const usersInRoom = roomIdSockets.map((s) => s?.data?.user);

        socket.emit("roomDetails", {
            userCount: usersInRoom.length,
            users: usersInRoom,
        });

        if (usersInRoom.length >= 2)
            io.to(room_id).emit("initializeEncryption");
    });

    // encryption
    socket.on("publicKey", ({ publicKey }) => {
        console.log("public key called from client. ", publicKey);
        const { room_id } = socket?.data?.user;
        socket.to(room_id).emit("finalizeEncryption", { publicKey });
    });

    // disconnect
    // TODO: when room creator (ADMIN) logs out, log everyone else out in the room
    socket.on("disconnect", async (reason) => {
        console.log(`USER ${socket.id} DISCONNECTED: `, reason);
        if (socket?.data?.user) {
            const { room_id, username } = socket?.data?.user;
            const socketsInRoom = await fetchAllInRoom({ io, room_id });
            const otherUsersInRoom = socketsInRoom.filter(
                (s) => s?.data?.user?.username !== username
            );

            otherUsersInRoom.forEach((userSocket) => {
                const { id: otherId, username: otherUsername } =
                    userSocket?.data?.user;
                const usersExceptSpecific = socketsInRoom
                    .filter((s) => s?.data?.user?.username !== otherUsername)
                    .map((s) => s?.data?.user?.username);

                io.to(otherId).emit("allOtherUsers", {
                    user: userSocket?.data?.user,
                    allUsersInRoom: usersExceptSpecific,
                });
            });

            io.to(room_id).emit("disableEncryption");
        }
    });
});

server.listen(port, () => {
    console.log(`Express.js HTTP server listening on port ${port}`);
});

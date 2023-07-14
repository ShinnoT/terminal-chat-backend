const { encryptPass } = require("./encrypt");
const { fetchAllInRoom } = require("./helpers");

exports.createRoom = async ({
    io,
    socket,
    username,
    room_id,
    room_password,
}) => {
    const encryptedPass = await encryptPass(room_password);
    userData = {
        id: socket.id,
        user_type: "ADMIN",
        username,
        room_id,
        room_password: encryptedPass,
    };

    socket.data.user = userData;
    console.log("Logged in user data info: ", socket.data.user);
    socket.join(room_id);

    // NOTE: code below fetches all rooms
    // console.log("All rooms?? ", io.sockets.adapter.rooms);

    socket.emit("login", {
        requestType: "CREATE",
        success: true,
        user: userData,
    });
};

exports.joinRoom = async ({ io, socket, username, room_id, room_password }) => {
    userData = {
        id: socket.id,
        username,
        user_type: "NORMAL",
        room_id,
        // NOTE: user just joining room so no need to save room_id & room_password???
        // room_password,
    };

    // TODO: check all rooms created by fetching all users and their socket.data.user
    // TODO: check if password and room_id match any of them (INCLUDE THIS LOGIC IN VALIDATOR??)
    // TODO: if valid, join room and send message to users in room and return success response

    socket.data.user = userData;
    socket.join(room_id);

    const socketsInRoom = await fetchAllInRoom({ io, room_id });
    const otherUsersInRoom = socketsInRoom.filter(
        (s) => s?.data?.user?.username !== username
    );

    otherUsersInRoom.forEach((userSocket) => {
        const { id: otherId, username: otherUsername } = userSocket?.data?.user;
        const usersExceptSpecific = socketsInRoom
            .filter((s) => s?.data?.user?.username !== otherUsername)
            .map((s) => s?.data?.user?.username);

        io.to(otherId).emit("allOtherUsers", {
            user: userSocket?.data?.user,
            allUsersInRoom: usersExceptSpecific,
        });
    });

    socket.emit("login", {
        requestType: "JOIN",
        success: true,
        user: userData,
    });
};

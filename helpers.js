exports.loginValidator = async ({ requestType, formData, io }) => {
    const { username, room_id, room_password } = formData;
    let errors = {
        requestType,
        success: false,
        error: {
            usernameError: null,
            roomIdError: null,
            roomPasswordError: null,
        },
    };

    // empty data validation
    if (!username)
        errors = {
            ...errors,
            error: {
                ...errors.error,
                usernameError: "⌧ Username must not be blank.",
            },
        };

    if (!room_id)
        errors = {
            ...errors,
            error: {
                ...errors.error,
                roomIdError: "⌧ Room ID must not be blank.",
            },
        };

    if (!room_password)
        errors = {
            ...errors,
            error: {
                ...errors.error,
                roomPasswordError: "⌧ Room password must not be blank.",
            },
        };

    const allSockets = await io.fetchSockets();
    const userSockets = allSockets.filter(
        (s) => s?.data?.user?.username === username
    );
    const roomIdSockets = allSockets.filter(
        (s) => s?.data?.user?.room_id === room_id
    );
    if (userSockets.length > 0)
        errors = {
            ...errors,
            error: {
                ...errors.error,
                usernameError: "⌧ Username already taken.",
            },
        };

    if (requestType === "CREATE") {
        if (roomIdSockets.length > 0)
            errors = {
                ...errors,
                error: {
                    ...errors.error,
                    roomIdError: "⌧ Room ID already taken.",
                },
            };
    }

    if (requestType === "JOIN") {
        if (roomIdSockets.length === 0 && room_id)
            errors = {
                ...errors,
                error: {
                    ...errors.error,
                    roomIdError: "⌧ Room with this room_id does not exist.",
                },
            };

        if (roomIdSockets.length > 0) {
            const actualRoomPassword = roomIdSockets.filter(
                (s) => s?.data?.user?.room_password
            )[0].data?.user?.room_password;
            console.log("Found room password:: ", actualRoomPassword);
            console.log("User provided password:: ", room_password);
            if (actualRoomPassword !== room_password) {
                errors = {
                    ...errors,
                    error: {
                        ...errors.error,
                        roomPasswordError:
                            "⌧ Password for this room is incorrect.",
                    },
                };
            }
        }
    }

    const { usernameError, roomIdError, roomPasswordError } = errors?.error;
    const anyErrors = usernameError || roomIdError || roomPasswordError;
    return anyErrors ? errors : null;
};

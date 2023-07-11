const { sanitize } = require("isomorphic-dompurify");

const { comparePass } = require("./encrypt");

exports.loginValidator = async ({ requestType, formData, io }) => {
    const MAX_USERS_IN_ROOM = 2;
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

    const passwordTooSmall = !!room_password.length && room_password.length < 8;
    const passwordTooLarge = room_password.length > 16;
    if (passwordTooSmall || passwordTooLarge)
        errors = {
            ...errors,
            error: {
                ...errors.error,
                roomPasswordError:
                    "⌧ Room password must be between 8 - 16 chars.",
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

        if (roomIdSockets.length >= MAX_USERS_IN_ROOM) {
            errors = {
                ...errors,
                error: {
                    ...errors.error,
                    roomIdError:
                        "⌧ This room is currently occupied and maxed out.",
                },
            };
        }

        if (roomIdSockets.length === 1) {
            const actualRoomPassword = roomIdSockets.filter(
                (s) => s?.data?.user?.room_password
            )[0].data?.user?.room_password;
            const passIsCorrect = await comparePass({
                rawPass: room_password,
                correctPass: actualRoomPassword,
            });
            if (!passIsCorrect) {
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

exports.sanitizeLoginData = ({ username, room_id, room_password }) => {
    return {
        username: sanitize(username),
        room_id: sanitize(room_id),
        room_password: sanitize(room_password),
    };
};

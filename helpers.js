exports.loginValidator = async ({ username, room_id, room_password, io }) => {
    let errors = {
        success: false,
        error: {
            usernameError: null,
            roomIdError: null,
            roomPasswordError: null,
        },
    };
    // empty data validation --------------
    if (!username)
        errors = {
            ...errors,
            error: {
                ...errors.error,
                usernameError: "Username must not be blank.",
            },
        };

    if (!room_id)
        errors = {
            ...errors,
            error: {
                ...errors.error,
                roomIdError: "Room ID must not be blank.",
            },
        };

    if (!room_password)
        errors = {
            ...errors,
            error: {
                ...errors.error,
                roomPasswordError: "Room password must not be blank.",
            },
        };
    // ------------------------------------

    // existing data validation -----------
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
                usernameError: "Username already taken.",
            },
        };

    if (roomIdSockets.length > 0)
        errors = {
            ...errors,
            error: {
                ...errors.error,
                roomIdError: "Room ID already taken.",
            },
        };
    // ------------------------------------

    const { usernameError, roomIdError, roomPasswordError } = errors?.error;
    const anyErrors = usernameError || roomIdError || roomPasswordError;
    return anyErrors ? errors : null;
};

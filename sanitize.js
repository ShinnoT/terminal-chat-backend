// const { sanitize } = require("isomorphic-dompurify");

// exports.sanitizer = (triggeredEvent, ...args) => {
//     // message event sanitizer
//     if (triggeredEvent === "sendMessage") {
//         const { username, room_id, message } = args[0];
//         const { encrypted, value, iv } = message;
//         if (encrypted) {
//             if (!Buffer.isBuffer(value)) next(new Error("Encrypted message must be a buffer."))
//             if (!Buffer.isBuffer(iv)) next(new Error("Encryption IV must be a buffer."))
//         }
//         if (!encrypted) {

//         }
//     }
// };

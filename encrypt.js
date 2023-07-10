const crypto = require("crypto");

// the argument in paranthesis show length of the prime number
// the bigger number ,the more difficult to break the cypher ,the more clock cycle needed to generate it
const ALICE = crypto.createDiffieHellman(2048);
const BOB = crypto.createDiffieHellman(ALICE.getPrime(), ALICE.getGenerator());

// generate keys
ALICE.generateKeys();
BOB.generateKeys();

// generate final keys by exchanging public keys of both parties with eachother
const aliceFinalKey = ALICE.computeSecret(BOB.getPublicKey(), null, "base64");
const bobFinalKey = BOB.computeSecret(ALICE.getPublicKey(), null, "base64");

console.log("ARE BOTH SECRETS EQUAL?? ", aliceFinalKey === bobFinalKey);

// console.log("ALICE final key: ", aliceFinalKey);
// console.log("BOB final key: ", bobFinalKey);

const cipherData = (data, secret, iv, algorithm = "aes256") => {
    const key = crypto
        .createHash("sha512")
        .update(secret)
        .digest("hex")
        .substring(0, 32);
    const encryptionIV = crypto
        .createHash("sha512")
        .update(iv)
        .digest("hex")
        .substring(0, 16);

    const cipher = crypto.createCipheriv(algorithm, key, encryptionIV);

    return Buffer.from(
        cipher.update(data, "utf8", "hex") + cipher.final("hex")
    ).toString("base64");
};

const decipherData = (encryptedData, secret, iv, algorithm = "aes256") => {
    const key = crypto
        .createHash("sha512")
        .update(secret)
        .digest("hex")
        .substring(0, 32);
    const encryptionIV = crypto
        .createHash("sha512")
        .update(iv)
        .digest("hex")
        .substring(0, 16);

    const buff = Buffer.from(encryptedData, "base64");

    const decipher = crypto.createDecipheriv(algorithm, key, encryptionIV);

    return (
        decipher.update(buff.toString("utf8"), "hex", "utf8") +
        decipher.final("utf8")
    );
};

const randomMessage = "HEY MAN HOW IS THIS MESSAGE? CAN IT BE SPIED??";
const IV = crypto.randomBytes(16);

const encryptedMessage = cipherData(randomMessage, aliceFinalKey, IV);
const decryptedMessage = decipherData(encryptedMessage, bobFinalKey, IV);

console.log("encrypted message: ", encryptedMessage);
console.log("message: ", decryptedMessage);

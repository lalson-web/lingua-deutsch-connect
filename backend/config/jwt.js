const JWT_SECRET = process.env.JWT_SECRET || process.env.ONLINE_JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Add it to your .env file.");
}

module.exports = { JWT_SECRET };
const jwt = require("jsonwebtoken");
const db = require("../database");
const { JWT_SECRET } = require("../config/jwt");

function fail(res, status, message) {
    return res.status(status).json({ success: false, message });
}

function authenticateOnlineAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return fail(res, 401, "Authentication required. Please log in.");
        }

        const token = authHeader.substring(7).trim();
        if (!token) return fail(res, 401, "Authentication token is missing.");

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            console.error("Online admin JWT error:", error.message);
            return fail(res, 401, "Invalid or expired authentication token.");
        }

        if (!decoded || decoded.role !== "online_admin") {
            return fail(res, 403, "Access denied. Online admin access required.");
        }

        // Accept both payload shapes so old tokens don't break
        const onlineAdminId = Number(decoded.onlineAdminId ?? decoded.id);

        if (!Number.isInteger(onlineAdminId) || onlineAdminId <= 0) {
            return fail(res, 401, "Invalid online admin authentication.");
        }

        const admin = db.prepare(`
            SELECT id, name, email, account_status,
                   created_at, last_login_at, updated_at
            FROM online_admins
            WHERE id = ?
            LIMIT 1
        `).get(onlineAdminId);

        if (!admin) return fail(res, 401, "Online admin account not found.");

        if (admin.account_status !== "active") {
            return fail(res, 403, "This online admin account is not active.");
        }

        req.onlineAdmin = admin;
        req.onlineAdminId = admin.id;
        req.onlineAdminToken = token;

        return next();
    } catch (error) {
        console.error("Online admin authentication error:", error);
        return fail(res, 500, "Authentication service error.");
    }
}

module.exports = authenticateOnlineAdmin;
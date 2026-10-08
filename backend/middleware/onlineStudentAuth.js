const jwt = require("jsonwebtoken");
const db = require("../database");
const { JWT_SECRET } = require("../config/jwt");

function fail(res, status, message) {
    return res.status(status).json({ success: false, message });
}

function authenticateOnlineStudent(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return fail(res, 401, "Authentication required. Please log in.");
        }
        if (!authHeader.startsWith("Bearer ")) {
            return fail(res, 401, "Invalid authentication format.");
        }

        const token = authHeader.substring(7).trim();
        if (!token) return fail(res, 401, "Authentication token is missing.");

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            if (error.name === "TokenExpiredError") {
                return fail(res, 401, "Your session has expired. Please log in again.");
            }
            return fail(res, 401, "Invalid authentication token.");
        }

        if (!decoded || decoded.role !== "online_student") {
            return fail(res, 403, "Access denied. Online student authentication required.");
        }

        const studentId = Number(decoded.onlineStudentId ?? decoded.id);

        if (!Number.isInteger(studentId) || studentId <= 0) {
            return fail(res, 401, "Invalid student authentication.");
        }

        const student = db.prepare(`
            SELECT id, first_name, last_name, email, phone,
                   profile_photo, account_status, created_at, last_login_at
            FROM online_students
            WHERE id = ?
            LIMIT 1
        `).get(studentId);

        if (!student) return fail(res, 401, "Online student account was not found.");

        if (student.account_status !== "active") {
            return fail(res, 403, "Your online learning account is not active. Please contact LDC.");
        }

        req.onlineStudent = student;
        req.onlineStudentId = student.id;
        req.onlineStudentToken = decoded;

        return next();
    } catch (error) {
        console.error("Online student authentication error:", error);
        return fail(res, 500, "Authentication service error.");
    }
}

module.exports = authenticateOnlineStudent;
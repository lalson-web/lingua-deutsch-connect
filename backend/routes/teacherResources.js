const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const jwt = require("jsonwebtoken");

const db = require("../database");

const router = express.Router();

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "ldc_change_this_secret_later";

const MAX_PDF_BYTES = 20 * 1024 * 1024;

const RESOURCES_DIR = path.join(
    __dirname,
    "..",
    "uploads",
    "resources"
);

fs.mkdirSync(RESOURCES_DIR, { recursive: true });


/* =========================================================
   DATABASE
========================================================= */

db.exec(`
    CREATE TABLE IF NOT EXISTS class_resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('pdf', 'link')),
        title TEXT NOT NULL,
        description TEXT,
        url TEXT,
        file_name TEXT,
        stored_name TEXT,
        file_size INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
`);

db.exec(`
    CREATE INDEX IF NOT EXISTS idx_class_resources_class
    ON class_resources (class_id)
`);


/* =========================================================
   HELPERS
========================================================= */

function cleanText(value, max) {

    return typeof value === "string"
        ? value.trim().slice(0, max)
        : "";

}


function tableColumns(table) {

    try {

        return db
            .prepare(`PRAGMA table_info(${table})`)
            .all()
            .map(column => column.name);

    } catch {

        return [];

    }

}


function removeFile(filePath) {

    try {

        fs.unlinkSync(filePath);

    } catch {

        /* ignore */

    }

}


function looksLikePdf(filePath) {

    try {

        const fd = fs.openSync(filePath, "r");
        const buffer = Buffer.alloc(5);

        fs.readSync(fd, buffer, 0, 5, 0);
        fs.closeSync(fd);

        return buffer.toString("latin1") === "%PDF-";

    } catch {

        return false;

    }

}


function normalizeUrl(value) {

    let raw =
        typeof value === "string"
            ? value.trim()
            : "";

    if (!raw || raw.length > 2000) {

        return null;

    }

    if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) {

        raw = `https://${raw}`;

    }

    try {

        const parsed = new URL(raw);

        if (
            parsed.protocol !== "http:" &&
            parsed.protocol !== "https:"
        ) {

            return null;

        }

        return parsed.toString();

    } catch {

        return null;

    }

}


function mapResource(row) {

    const isPdf = row.type === "pdf";

    return {

        id: row.id,

        classId: row.class_id,

        type: row.type,

        title: row.title,

        description: row.description || "",

        url: isPdf
            ? `/uploads/resources/${row.stored_name}`
            : row.url,

        fileName: row.file_name || "",

        fileSize: row.file_size || 0,

        createdAt: row.created_at
            ? `${String(row.created_at).replace(" ", "T")}Z`
            : null

    };

}


/* =========================================================
   AUTHENTICATION
========================================================= */

function authenticateTeacher(req, res, next) {

    const header =
        req.headers.authorization || "";

    const token =
        header.startsWith("Bearer ")
            ? header.slice(7)
            : "";

    if (!token) {

        return res.status(401).json({
            success: false,
            message: "Authentication required."
        });

    }

    let payload;

    try {

        payload = jwt.verify(token, JWT_SECRET);

    } catch (error) {

        console.warn(
            "Teacher resources auth failed:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Your teacher session has expired."
        });

    }

    const role =
        String(payload.role || "").toLowerCase();

    const teacherId = Number(
        payload.teacherId ??
        payload.teacher_id ??
        payload.id ??
        payload.userId
    );

    if (
        !Number.isInteger(teacherId) ||
        teacherId <= 0
    ) {

        console.warn(
            "Teacher resources auth failed: no teacher id in token payload",
            Object.keys(payload)
        );

        return res.status(401).json({
            success: false,
            message: "Invalid teacher session."
        });

    }

    if (role && role !== "teacher") {

        return res.status(403).json({
            success: false,
            message: "Teacher access only."
        });

    }

    const teacher =
        db.prepare(`
            SELECT *
            FROM teachers
            WHERE id = ?
            LIMIT 1
        `).get(teacherId);

    if (!teacher) {

        return res.status(401).json({
            success: false,
            message: "Teacher account not found."
        });

    }

    const status = String(
        teacher.status ||
        teacher.account_status ||
        "active"
    ).toLowerCase();

    if (status !== "active") {

        return res.status(403).json({
            success: false,
            message: "Your teacher account is not active."
        });

    }

    req.teacher = { id: teacherId };

    next();

}


function teacherHasClass(teacherId, classId) {

    const assignmentColumns =
        tableColumns("teacher_assignments");

    if (
        assignmentColumns.includes("teacher_id") &&
        assignmentColumns.includes("class_id")
    ) {

        const statusFilter =
            assignmentColumns.includes("status")
                ? "AND (status IS NULL OR status NOT IN ('inactive', 'removed', 'ended'))"
                : "";

        const assignment =
            db.prepare(`
                SELECT 1
                FROM teacher_assignments
                WHERE teacher_id = ?
                AND class_id = ?
                ${statusFilter}
                LIMIT 1
            `).get(teacherId, classId);

        if (assignment) {

            return true;

        }

    }

    if (tableColumns("classes").includes("teacher_id")) {

        const ownClass =
            db.prepare(`
                SELECT 1
                FROM classes
                WHERE id = ?
                AND teacher_id = ?
                LIMIT 1
            `).get(classId, teacherId);

        return Boolean(ownClass);

    }

    return false;

}


/*
 * Not-assigned classes answer 404 (not 403), because the
 * dashboard logs the teacher out whenever it sees a 403.
 */

function requireClassAccess(req, res, next) {

    const classId = Number(req.params.classId);

    if (
        !Number.isInteger(classId) ||
        classId <= 0
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid class."
        });

    }

    if (!teacherHasClass(req.teacher.id, classId)) {

        return res.status(404).json({
            success: false,
            message: "Class not found."
        });

    }

    req.classId = classId;

    next();

}


/* =========================================================
   UPLOAD
========================================================= */

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, RESOURCES_DIR);

    },

    filename: (req, file, cb) => {

        cb(
            null,
            `${crypto.randomBytes(16).toString("hex")}.pdf`
        );

    }

});


const upload = multer({

    storage,

    limits: {
        fileSize: MAX_PDF_BYTES,
        files: 1
    },

    fileFilter: (req, file, cb) => {

        const extension =
            path.extname(file.originalname || "").toLowerCase();

        const isPdf =
            extension === ".pdf" &&
            /pdf/i.test(file.mimetype || "");

        if (!isPdf) {

            const error =
                new Error("Only PDF files are allowed.");

            error.code = "INVALID_FILE_TYPE";

            return cb(error);

        }

        cb(null, true);

    }

});


function handleUpload(req, res, next) {

    upload.single("file")(req, res, error => {

        if (!error) {

            return next();

        }

        if (error.code === "LIMIT_FILE_SIZE") {

            return res.status(400).json({
                success: false,
                message: "The PDF is too large. Maximum size is 20 MB."
            });

        }

        return res.status(400).json({
            success: false,
            message: error.message || "Upload failed."
        });

    });

}


/* =========================================================
   LIST
========================================================= */

router.get(
    "/classes/:classId/resources",
    authenticateTeacher,
    requireClassAccess,
    (req, res) => {

        try {

            const rows =
                db.prepare(`
                    SELECT *
                    FROM class_resources
                    WHERE class_id = ?
                    ORDER BY created_at DESC, id DESC
                `).all(req.classId);

            return res.json({
                success: true,
                resources: rows.map(mapResource)
            });

        } catch (error) {

            console.error("List resources error:", error);

            return res.status(500).json({
                success: false,
                message: "Could not load resources."
            });

        }

    }
);


/* =========================================================
   UPLOAD PDF
========================================================= */

router.post(
    "/classes/:classId/resources/pdf",
    authenticateTeacher,
    requireClassAccess,
    handleUpload,
    (req, res) => {

        const file = req.file;

        if (!file) {

            return res.status(400).json({
                success: false,
                message: "Please choose a PDF file."
            });

        }

        try {

            if (!looksLikePdf(file.path)) {

                removeFile(file.path);

                return res.status(400).json({
                    success: false,
                    message: "The selected file is not a valid PDF."
                });

            }

            const originalName =
                cleanText(file.originalname, 200);

            const title =
                cleanText(req.body.title, 200) ||
                path.basename(
                    originalName,
                    path.extname(originalName)
                ) ||
                "Untitled PDF";

            const description =
                cleanText(req.body.description, 500);

            const result =
                db.prepare(`
                    INSERT INTO class_resources (
                        class_id,
                        teacher_id,
                        type,
                        title,
                        description,
                        file_name,
                        stored_name,
                        file_size
                    )
                    VALUES (?, ?, 'pdf', ?, ?, ?, ?, ?)
                `).run(
                    req.classId,
                    req.teacher.id,
                    title,
                    description,
                    originalName,
                    file.filename,
                    file.size
                );

            const row =
                db.prepare(`
                    SELECT *
                    FROM class_resources
                    WHERE id = ?
                `).get(result.lastInsertRowid);

            return res.status(201).json({
                success: true,
                message: "PDF uploaded successfully.",
                resource: mapResource(row)
            });

        } catch (error) {

            removeFile(file.path);

            console.error("Upload PDF error:", error);

            return res.status(500).json({
                success: false,
                message: "Could not save the PDF."
            });

        }

    }
);


/* =========================================================
   ADD LINK
========================================================= */

router.post(
    "/classes/:classId/resources/link",
    authenticateTeacher,
    requireClassAccess,
    (req, res) => {

        try {

            const url =
                normalizeUrl(req.body && req.body.url);

            if (!url) {

                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid web link (http or https)."
                });

            }

            const title =
                cleanText(req.body.title, 200) ||
                new URL(url).hostname;

            const description =
                cleanText(req.body.description, 500);

            const result =
                db.prepare(`
                    INSERT INTO class_resources (
                        class_id,
                        teacher_id,
                        type,
                        title,
                        description,
                        url
                    )
                    VALUES (?, ?, 'link', ?, ?, ?)
                `).run(
                    req.classId,
                    req.teacher.id,
                    title,
                    description,
                    url
                );

            const row =
                db.prepare(`
                    SELECT *
                    FROM class_resources
                    WHERE id = ?
                `).get(result.lastInsertRowid);

            return res.status(201).json({
                success: true,
                message: "Link added successfully.",
                resource: mapResource(row)
            });

        } catch (error) {

            console.error("Add link error:", error);

            return res.status(500).json({
                success: false,
                message: "Could not save the link."
            });

        }

    }
);


/* =========================================================
   DELETE
========================================================= */

router.delete(
    "/classes/:classId/resources/:resourceId",
    authenticateTeacher,
    requireClassAccess,
    (req, res) => {

        try {

            const resourceId =
                Number(req.params.resourceId);

            const row =
                db.prepare(`
                    SELECT *
                    FROM class_resources
                    WHERE id = ?
                    AND class_id = ?
                    LIMIT 1
                `).get(resourceId, req.classId);

            if (!row) {

                return res.status(404).json({
                    success: false,
                    message: "Resource not found."
                });

            }

            db.prepare(`
                DELETE FROM class_resources
                WHERE id = ?
            `).run(row.id);

            if (row.type === "pdf" && row.stored_name) {

                removeFile(
                    path.join(
                        RESOURCES_DIR,
                        path.basename(row.stored_name)
                    )
                );

            }

            return res.json({
                success: true,
                message: "Resource deleted."
            });

        } catch (error) {

            console.error("Delete resource error:", error);

            return res.status(500).json({
                success: false,
                message: "Could not delete the resource."
            });

        }

    }
);
console.log("teacher resources routes loaded");
module.exports = router;
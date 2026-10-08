/* =========================================================
   LINGUA DEUTSCH CONNECT
   TEACHER ROUTES
   FULLY UPDATED / SCHEMA ALIGNED
========================================================= */
console.log("teacher routes loaded: class materials v1");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const db = require("../database");

const router = express.Router();

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "ldc_change_this_secret_later";


/* =========================================================
   UPLOAD DIRECTORIES
========================================================= */

const UPLOAD_ROOT =
    path.join(
        __dirname,
        "..",
        "uploads"
    );

const LESSON_UPLOAD_DIR =
    path.join(
        UPLOAD_ROOT,
        "teacher",
        "lessons"
    );

const REPORT_UPLOAD_DIR =
    path.join(
        UPLOAD_ROOT,
        "teacher",
        "reports"
    );

for (
    const directory of [
        UPLOAD_ROOT,
        LESSON_UPLOAD_DIR,
        REPORT_UPLOAD_DIR
    ]
) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(
            directory,
            {
                recursive: true
            }
        );
    }
}


/* =========================================================
   UPLOAD CONFIGURATION
========================================================= */

const MAX_UPLOAD_SIZE =
    25 * 1024 * 1024;

const BLOCKED_EXTENSIONS =
    new Set([
        ".exe",
        ".msi",
        ".bat",
        ".cmd",
        ".ps1",
        ".sh",
        ".php",
        ".py",
        ".jar",
        ".dll",
        ".com",
        ".scr",
        ".vbs",
        ".vbe",
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".html",
        ".htm",
        ".svg",
        ".asp",
        ".aspx",
        ".jsp"
    ]);


function sanitizeOriginalFileName(
    fileName
) {
    return String(
        fileName || "file"
    )
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        )
        .replace(
            /_+/g,
            "_"
        )
        .slice(
            0,
            180
        );
}


function getSafeFileExtension(
    fileName
) {
    return path
        .extname(
            String(
                fileName || ""
            )
        )
        .toLowerCase();
}


function generateStoredFileName(
    originalName
) {
    const safeName =
        sanitizeOriginalFileName(
            originalName
        );

    const extension =
        getSafeFileExtension(
            safeName
        );

    const base =
        path
            .basename(
                safeName,
                extension
            )
            .replace(
                /[^a-zA-Z0-9_-]/g,
                "_"
            )
            .slice(
                0,
                100
            );

    return `${Date.now()}-${crypto.randomBytes(8).toString("hex")}-${base || "file"}${extension}`;
}


function createUploadMiddleware(
    destination
) {
    const storage =
        multer.diskStorage({
            destination: (
                req,
                file,
                callback
            ) => {
                callback(
                    null,
                    destination
                );
            },

            filename: (
                req,
                file,
                callback
            ) => {
                callback(
                    null,
                    generateStoredFileName(
                        file.originalname
                    )
                );
            }
        });

    return multer({
        storage,

        limits: {
            fileSize:
                MAX_UPLOAD_SIZE
        },

        fileFilter: (
            req,
            file,
            callback
        ) => {
            const extension =
                getSafeFileExtension(
                    file.originalname
                );

            if (
                BLOCKED_EXTENSIONS.has(
                    extension
                )
            ) {
                return callback(
                    new Error(
                        "This file type is not allowed."
                    )
                );
            }

            callback(
                null,
                true
            );
        }
    });
}


const lessonFileUpload =
    createUploadMiddleware(
        LESSON_UPLOAD_DIR
    );

const reportFileUpload =
    createUploadMiddleware(
        REPORT_UPLOAD_DIR
    );


function deletePhysicalFile(
    filePath
) {
    try {
        if (
            filePath &&
            fs.existsSync(filePath)
        ) {
            fs.unlinkSync(
                filePath
            );
        }
    } catch (error) {
        console.warn(
            "Could not delete physical file:",
            error.message
        );
    }
}


function getUploadedFileUrl(
    req,
    filePath
) {
    if (!filePath) {
        return null;
    }

    const normalized =
        filePath
            .replace(
                /\\/g,
                "/"
            );

    const uploadsIndex =
        normalized.indexOf(
            "/uploads/"
        );

    if (
        uploadsIndex !== -1
    ) {
        return (
            normalized.slice(
                uploadsIndex
            )
        );
    }

    return null;
}


function uploadedFileType(
    file
) {
    const extension =
        getSafeFileExtension(
            file?.originalname
        );

    if (
        [
            ".pdf"
        ].includes(extension)
    ) {
        return "pdf";
    }

    if (
        [
            ".doc",
            ".docx"
        ].includes(extension)
    ) {
        return "document";
    }

    if (
        [
            ".xls",
            ".xlsx"
        ].includes(extension)
    ) {
        return "spreadsheet";
    }

    if (
        [
            ".ppt",
            ".pptx"
        ].includes(extension)
    ) {
        return "presentation";
    }

    if (
        [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        ].includes(extension)
    ) {
        return "image";
    }

    if (
        [
            ".mp3",
            ".wav",
            ".m4a"
        ].includes(extension)
    ) {
        return "audio";
    }

    if (
        [
            ".mp4",
            ".mov",
            ".webm"
        ].includes(extension)
    ) {
        return "video";
    }

    return "file";
}


function handleUploadError(
    error,
    res
) {
    console.error(
        "Teacher upload error:",
        error
    );

    if (
        error instanceof multer.MulterError
    ) {
        if (
            error.code ===
            "LIMIT_FILE_SIZE"
        ) {
            return res.status(400).json({
                message:
                    "File is too large. Maximum size is 25 MB."
            });
        }

        return res.status(400).json({
            message:
                error.message ||
                "Upload failed."
        });
    }

    return res.status(400).json({
        message:
            error?.message ||
            "Upload failed."
    });
}


/* =========================================================
   GENERAL HELPERS
========================================================= */

function getKigaliDate() {
    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone:
                "Africa/Kigali",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).format(
        new Date()
    );
}


function getKigaliDateTime() {
    return new Intl.DateTimeFormat(
        "sv-SE",
        {
            timeZone:
                "Africa/Kigali",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }
    )
        .format(
            new Date()
        )
        .replace(
            " ",
            "T"
        );
}


function toNumber(
    value,
    fallback = 0
) {
    const number =
        Number(value);

    return Number.isFinite(
        number
    )
        ? number
        : fallback;
}


function toPositiveInteger(
    value
) {
    const number =
        Number(value);

    if (
        !Number.isFinite(
            number
        ) ||
        number <= 0
    ) {
        return null;
    }

    return Math.floor(
        number
    );
}


function cryptoRandomCode(
    length = 6
) {
    return crypto
        .randomBytes(
            Math.ceil(
                length / 2
            )
        )
        .toString("hex")
        .slice(
            0,
            length
        )
        .toUpperCase();
}


/* =========================================================
   TEACHER ACCESS HELPERS
========================================================= */

function teacherHasClass(
    teacherId,
    classId
) {
    const assignment =
        db.prepare(`
            SELECT id
            FROM teacher_classes
            WHERE teacher_id = ?
              AND class_id = ?
            LIMIT 1
        `).get(
            teacherId,
            classId
        );

    return Boolean(
        assignment
    );
}


function teacherHasCourse(
    teacherId,
    courseId
) {
    const assignment =
        db.prepare(`
            SELECT tc.id
            FROM teacher_classes tc
            JOIN classes cl
                ON cl.id = tc.class_id
            WHERE tc.teacher_id = ?
              AND cl.course_id = ?
            LIMIT 1
        `).get(
            teacherId,
            courseId
        );

    return Boolean(
        assignment
    );
}


function teacherCanAccessLesson(
    teacherId,
    lessonId
) {
    const lesson =
        db.prepare(`
            SELECT
                l.id,
                l.module_id,
                m.course_id AS module_course_id
            FROM lessons l
            LEFT JOIN modules m
                ON m.id = l.module_id
            WHERE l.id = ?
        `).get(
            lessonId
        );

    if (!lesson) {
        return false;
    }

    if (
        lesson.module_course_id &&
        teacherHasCourse(
            teacherId,
            lesson.module_course_id
        )
    ) {
        return true;
    }

    return false;
}


function teacherOwnsLesson(
    teacherId,
    lessonId
) {
    return teacherCanAccessLesson(
        teacherId,
        lessonId
    );
}


function teacherCanAccessTest(
    teacherId,
    test
) {
    if (!test) {
        return false;
    }

    if (
        Number(test.teacher_id) ===
        Number(teacherId)
    ) {
        return true;
    }

    if (
        test.class_id &&
        teacherHasClass(
            teacherId,
            test.class_id
        )
    ) {
        return true;
    }

    if (
        test.course_id &&
        teacherHasCourse(
            teacherId,
            test.course_id
        )
    ) {
        return true;
    }

    return false;
}


function formatStudentName(
    student
) {
    if (!student) {
        return "Student";
    }

    return (
        student.full_name ||
        [
            student.first_name,
            student.last_name
        ]
            .filter(Boolean)
            .join(" ") ||
        student.name ||
        student.email ||
        "Student"
    );
}


function validAttendanceStatus(
    status
) {
    return [
        "present",
        "late",
        "absent",
        "excused"
    ].includes(
        String(
            status || ""
        ).toLowerCase()
    );
}


function teacherCanAccessStudent(
    teacherId,
    studentId
) {
    const student =
        db.prepare(`
            SELECT id
            FROM students
            WHERE id = ?
        `).get(
            studentId
        );

    if (!student) {
        return false;
    }

    const assignment =
        db.prepare(`
            SELECT tc.id
            FROM teacher_classes tc
            JOIN enrollments e
                ON e.class_id = tc.class_id
            WHERE tc.teacher_id = ?
              AND e.student_id = ?
              AND e.status = 'active'
            LIMIT 1
        `).get(
            teacherId,
            studentId
        );

    return Boolean(
        assignment
    );
}


/* =========================================================
   AUTHENTICATION
========================================================= */

function authenticateTeacher(
    req,
    res,
    next
) {
    try {
        const header =
            req.headers.authorization ||
            "";

        if (
            !header.startsWith(
                "Bearer "
            )
        ) {
            return res.status(401).json({
                message:
                    "Authentication required."
            });
        }

        const token =
            header
                .substring(7)
                .trim();

        if (!token) {
            return res.status(401).json({
                message:
                    "Authentication token is missing."
            });
        }

        const decoded =
            jwt.verify(
                token,
                JWT_SECRET
            );

        if (
            decoded.role !==
            "teacher"
        ) {
            return res.status(403).json({
                message:
                    "Teacher access required."
            });
        }

        const teacherId =
            toPositiveInteger(
                decoded.teacherId ||
                decoded.teacher_id ||
                decoded.id
            );

        if (!teacherId) {
            return res.status(401).json({
                message:
                    "Invalid teacher token."
            });
        }

        const teacher =
            db.prepare(`
                SELECT *
                FROM teachers
                WHERE id = ?
            `).get(
                teacherId
            );

        if (!teacher) {
            return res.status(401).json({
                message:
                    "Teacher account not found."
            });
        }

        const accountStatus =
            String(
                teacher.account_status ||
                teacher.status ||
                "active"
            ).toLowerCase();

        if (
            [
                "inactive",
                "suspended",
                "disabled",
                "blocked"
            ].includes(
                accountStatus
            )
        ) {
            return res.status(403).json({
                message:
                    "Teacher account is not active."
            });
        }

        req.teacher =
            teacher;

        next();

    } catch (error) {
        if (
            error?.name ===
            "TokenExpiredError"
        ) {
            return res.status(401).json({
                message:
                    "Teacher session expired. Please log in again.",
                code:
                    "TOKEN_EXPIRED"
            });
        }

        console.error(
            "Teacher authentication error:",
            error
        );

        return res.status(401).json({
            message:
                "Invalid or expired authentication token."
        });
    }
}


/* =========================================================
   TEACHER LOGIN
========================================================= */

router.post(
    "/login",
    async (
        req,
        res
    ) => {
        try {
            const {
                email,
                password
            } = req.body || {};

            const normalizedEmail =
                String(
                    email || ""
                )
                    .trim()
                    .toLowerCase();

            if (
                !normalizedEmail ||
                !password
            ) {
                return res.status(400).json({
                    message:
                        "Email and password are required."
                });
            }

            const teacher =
                db.prepare(`
                    SELECT *
                    FROM teachers
                    WHERE LOWER(email) = ?
                    LIMIT 1
                `).get(
                    normalizedEmail
                );

            if (!teacher) {
                return res.status(401).json({
                    message:
                        "Invalid email or password."
                });
            }

            const accountStatus =
                String(
                    teacher.account_status ||
                    teacher.status ||
                    "active"
                ).toLowerCase();

            if (
                [
                    "inactive",
                    "suspended",
                    "disabled",
                    "blocked"
                ].includes(
                    accountStatus
                )
            ) {
                return res.status(403).json({
                    message:
                        "Teacher account is not active."
                });
            }

            const storedHash =
                teacher.password_hash ||
                teacher.passwordHash;

            if (!storedHash) {
                return res.status(401).json({
                    message:
                        "Teacher account has no valid password."
                });
            }

            const passwordMatches =
                await bcrypt.compare(
                    String(password),
                    String(
                        storedHash
                    )
                );

            if (
                !passwordMatches
            ) {
                return res.status(401).json({
                    message:
                        "Invalid email or password."
                });
            }

            const token =
                jwt.sign(
                    {
                        role:
                            "teacher",

                        teacherId:
                            teacher.id
                    },
                    JWT_SECRET,
                    {
                        expiresIn:
                            "7d"
                    }
                );

            const safeTeacher = {
                ...teacher
            };

            delete safeTeacher.password;
            delete safeTeacher.password_hash;
            delete safeTeacher.passwordHash;

            return res.json({
                success:
                    true,

                token,

                teacher:
                    safeTeacher
            });

        } catch (error) {
            console.error(
                "Teacher login error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not log in teacher."
            });
        }
    }
);


/* =========================================================
   PROFILE
========================================================= */

router.get(
    "/profile",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacher =
                db.prepare(`
                    SELECT *
                    FROM teachers
                    WHERE id = ?
                `).get(
                    req.teacher.id
                );

            if (!teacher) {
                return res.status(404).json({
                    message:
                        "Teacher not found."
                });
            }

            delete teacher.password;
            delete teacher.password_hash;
            delete teacher.passwordHash;

            return res.json({
                teacher
            });

        } catch (error) {
            console.error(
                "Teacher profile error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load teacher profile."
            });
        }
    }
);


/* =========================================================
   DASHBOARD
========================================================= */

router.get(
    "/dashboard",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            /*
             * IMPORTANT:
             * A teacher may ONLY see classes
             * assigned through teacher_classes.
             *
             * DISTINCT prevents duplicate cards
             * if accidental duplicate assignments
             * exist in teacher_classes.
             */
            const classes =
                db.prepare(`
                    SELECT DISTINCT
                        cl.*,

                        c.name AS course_name,
                        c.level AS course_level,

                        (
                            SELECT COUNT(*)
                            FROM enrollments e
                            WHERE e.class_id = cl.id
                              AND e.status = 'active'
                        ) AS student_count,

                        (
                            SELECT COUNT(*)
                            FROM lessons l
                            JOIN modules m
                                ON m.id = l.module_id
                            WHERE m.course_id = cl.course_id
                        ) AS lesson_count,

                        (
                            SELECT COUNT(*)
                            FROM tests t
                            WHERE t.class_id = cl.id
                        ) AS test_count

                    FROM classes cl

                    INNER JOIN teacher_classes tc
                        ON tc.class_id = cl.id
                       AND tc.teacher_id = ?

                    LEFT JOIN courses c
                        ON c.id = cl.course_id

                    ORDER BY
                        cl.name COLLATE NOCASE
                `).all(
                    teacherId
                );

            const classCount =
                Number(
                    classes.length
                );

            const studentCount =
                db.prepare(`
                    SELECT COUNT(
                        DISTINCT e.student_id
                    ) AS count

                    FROM enrollments e

                    INNER JOIN teacher_classes tc
                        ON tc.class_id = e.class_id

                    WHERE tc.teacher_id = ?
                      AND e.status = 'active'
                `).get(
                    teacherId
                );

            const lessonCount =
                db.prepare(`
                    SELECT COUNT(
                        DISTINCT l.id
                    ) AS count

                    FROM lessons l

                    INNER JOIN modules m
                        ON m.id = l.module_id

                    INNER JOIN classes cl
                        ON cl.course_id = m.course_id

                    INNER JOIN teacher_classes tc
                        ON tc.class_id = cl.id

                    WHERE tc.teacher_id = ?
                `).get(
                    teacherId
                );

            const testCount =
                db.prepare(`
                    SELECT COUNT(
                        DISTINCT t.id
                    ) AS count

                    FROM tests t

                    WHERE
                        t.teacher_id = ?

                        OR EXISTS (
                            SELECT 1
                            FROM teacher_classes tc
                            WHERE tc.teacher_id = ?
                              AND tc.class_id = t.class_id
                        )
                `).get(
                    teacherId,
                    teacherId
                );

            const stats = {
                classes:
                    classCount,

                students:
                    Number(
                        studentCount?.count ||
                        0
                    ),

                lessons:
                    Number(
                        lessonCount?.count ||
                        0
                    ),

                tests:
                    Number(
                        testCount?.count ||
                        0
                    )
            };

            return res.json({
                teacherId,

                stats,

                /*
                 * Compatibility aliases for
                 * different dashboard JS versions.
                 */
                classesCount:
                    stats.classes,

                class_count:
                    stats.classes,

                studentsCount:
                    stats.students,

                student_count:
                    stats.students,

                lessonsCount:
                    stats.lessons,

                lesson_count:
                    stats.lessons,

                testsCount:
                    stats.tests,

                test_count:
                    stats.tests,

                classes
            });

        } catch (error) {
            console.error(
                "Teacher dashboard error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load teacher dashboard."
            });
        }
    }
);


/* =========================================================
   TEACHER CLASSES
========================================================= */

router.get(
    "/classes",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classes =
                db.prepare(`
                    SELECT DISTINCT
                        cl.*,

                        c.name AS course_name,
                        c.level AS course_level,

                        (
                            SELECT COUNT(*)
                            FROM enrollments e
                            WHERE e.class_id = cl.id
                              AND e.status = 'active'
                        ) AS student_count,

                        (
                            SELECT COUNT(*)
                            FROM lessons l
                            JOIN modules m
                                ON m.id = l.module_id
                            WHERE m.course_id = cl.course_id
                        ) AS lesson_count,

                        (
                            SELECT COUNT(*)
                            FROM tests t
                            WHERE t.class_id = cl.id
                        ) AS test_count

                    FROM classes cl

                    INNER JOIN teacher_classes tc
                        ON tc.class_id = cl.id
                       AND tc.teacher_id = ?

                    LEFT JOIN courses c
                        ON c.id = cl.course_id

                    ORDER BY
                        cl.name COLLATE NOCASE
                `).all(
                    teacherId
                );

            return res.json({
                classes
            });

        } catch (error) {
            console.error(
                "Teacher classes error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load classes."
            });
        }
    }
);


/* =========================================================
   SINGLE CLASS
========================================================= */

router.get(
    "/classes/:classId",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classId =
                toPositiveInteger(
                    req.params.classId
                );

            if (!classId) {
                return res.status(400).json({
                    message:
                        "Invalid class ID."
                });
            }

            if (
                !teacherHasClass(
                    teacherId,
                    classId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const classInfo =
                db.prepare(`
                    SELECT
                        cl.*,
                        c.name AS course_name,
                        c.level AS course_level
                    FROM classes cl
                    LEFT JOIN courses c
                        ON c.id = cl.course_id
                    WHERE cl.id = ?
                `).get(
                    classId
                );

            if (!classInfo) {
                return res.status(404).json({
                    message:
                        "Class not found."
                });
            }

            const students =
                db.prepare(`
                    SELECT
                        s.*,
                        e.id AS enrollment_id,
                        e.status AS enrollment_status,
                        e.enrollment_date AS enrolled_at
                    FROM enrollments e
                    JOIN students s
                        ON s.id = e.student_id
                    WHERE e.class_id = ? AND e.status = 'active'
                    ORDER BY
                        s.full_name COLLATE NOCASE
                `).all(
                    classId
                );

            return res.json({
                class: classInfo,
                students
            });

        } catch (error) {
            console.error(
                "Get teacher class error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load class."
            });
        }
    }
);


/* =========================================================
   CLASS STUDENTS
========================================================= */

router.get(
    "/classes/:classId/students",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classId =
                toPositiveInteger(
                    req.params.classId
                );

            if (!classId) {
                return res.status(400).json({
                    message:
                        "Invalid class ID."
                });
            }

            if (
                !teacherHasClass(
                    teacherId,
                    classId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const students =
                db.prepare(`
                    SELECT
                        s.*,
                        e.id AS enrollment_id,
                        e.status AS enrollment_status,
                        e.enrollment_date AS enrolled_at
                    FROM enrollments e
                    JOIN students s
                        ON s.id = e.student_id
                   WHERE e.class_id = ? AND e.status = 'active'
                    ORDER BY
                        s.full_name COLLATE NOCASE
                `).all(
                    classId
                );

            return res.json({
                classId,
                students
            });

        } catch (error) {
            console.error(
                "Teacher class students error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load class students."
            });
        }
    }
);


/* =========================================================
   SINGLE STUDENT
========================================================= */

router.get(
    "/students/:studentId",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const studentId =
                toPositiveInteger(
                    req.params.studentId
                );

            if (!studentId) {
                return res.status(400).json({
                    message:
                        "Invalid student ID."
                });
            }

            if (
                !teacherCanAccessStudent(
                    teacherId,
                    studentId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this student."
                });
            }

            const student =
                db.prepare(`
                    SELECT *
                    FROM students
                    WHERE id = ?
                `).get(
                    studentId
                );

            if (!student) {
                return res.status(404).json({
                    message:
                        "Student not found."
                });
            }

            const enrollments =
                db.prepare(`
                    SELECT
                        e.*,
                        cl.name AS class_name,
                        c.name AS course_name,
                        c.level AS course_level
                    FROM enrollments e
                    LEFT JOIN classes cl
                        ON cl.id = e.class_id
                    LEFT JOIN courses c
                        ON c.id = cl.course_id
                    WHERE e.student_id = ?
                    ORDER BY
                        e.id DESC
                `).all(
                    studentId
                );

            const results =
                db.prepare(`
                    SELECT
                        tr.*,
                        t.title AS test_title,
                        t.test_date,
                        cl.name AS class_name
                    FROM test_results tr
                    JOIN tests t
                        ON t.id = tr.test_id
                    LEFT JOIN classes cl
                        ON cl.id = t.class_id
                    WHERE tr.student_id = ?
                    ORDER BY
                        t.test_date DESC,
                        tr.id DESC
                `).all(
                    studentId
                );

            return res.json({
                student,
                enrollments,
                results
            });

        } catch (error) {
            console.error(
                "Teacher student error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load student."
            });
        }
    }
);


/* =========================================================
   ALL TEACHER LESSONS
========================================================= */

router.get(
    "/lessons",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const lessons =
                db.prepare(`
                    SELECT DISTINCT
                        l.*,

                        l.lesson_order AS "order",
                        l.xp_reward AS xp,
                        l.duration AS durationMinutes,

                        m.title AS module_title,
                        m.course_id,

                        c.name AS course_name,
                        c.level AS course_level

                    FROM lessons l

                    JOIN modules m
                        ON m.id = l.module_id

                    LEFT JOIN courses c
                        ON c.id = m.course_id

                    WHERE EXISTS (
                        SELECT 1
                        FROM classes cl
                        JOIN teacher_classes tc
                            ON tc.class_id = cl.id
                        WHERE tc.teacher_id = ?
                          AND cl.course_id = m.course_id
                    )

                    ORDER BY
                        m.module_order ASC,
                        l.lesson_order ASC,
                        l.id ASC
                `).all(
                    teacherId
                );

            return res.json({
                lessons
            });

        } catch (error) {
            console.error(
                "Teacher lessons error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load lessons."
            });
        }
    }
);


/* =========================================================
   CLASS LESSONS
========================================================= */

router.get(
    "/classes/:classId/lessons",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classId =
                toPositiveInteger(
                    req.params.classId
                );

            if (!classId) {
                return res.status(400).json({
                    message:
                        "Invalid class ID."
                });
            }

            if (
                !teacherHasClass(
                    teacherId,
                    classId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const classInfo =
                db.prepare(`
                    SELECT
                        id,
                        course_id
                    FROM classes
                    WHERE id = ?
                `).get(
                    classId
                );

            if (!classInfo) {
                return res.status(404).json({
                    message:
                        "Class not found."
                });
            }

            const lessons =
                db.prepare(`
                    SELECT
                        l.*,

                        l.lesson_order AS "order",
                        l.xp_reward AS xp,
                        l.duration AS durationMinutes,

                        m.title AS module_title,
                        m.module_order,

                        c.name AS course_name,
                        c.level AS course_level

                    FROM lessons l

                    JOIN modules m
                        ON m.id = l.module_id

                    LEFT JOIN courses c
                        ON c.id = m.course_id

                    WHERE m.course_id = ?

                    ORDER BY
                        m.module_order ASC,
                        l.lesson_order ASC,
                        l.id ASC
                `).all(
                    classInfo.course_id
                );

            return res.json({
                classId,
                lessons
            });

        } catch (error) {
            console.error(
                "Teacher class lessons error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load class lessons."
            });
        }
    }
);


/* =========================================================
   CREATE LESSON
========================================================= */

router.post(
    "/lessons",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const body =
                req.body || {};

            const moduleId =
                toPositiveInteger(
                    body.moduleId ||
                    body.module_id
                );

            const title =
                String(
                    body.title || ""
                ).trim();

            if (!moduleId) {
                return res.status(400).json({
                    message:
                        "Module ID is required."
                });
            }

            if (!title) {
                return res.status(400).json({
                    message:
                        "Lesson title is required."
                });
            }

            const module =
                db.prepare(`
                    SELECT
                        m.*,
                        c.name AS course_name,
                        c.level AS course_level
                    FROM modules m
                    LEFT JOIN courses c
                        ON c.id = m.course_id
                    WHERE m.id = ?
                `).get(
                    moduleId
                );

            if (!module) {
                return res.status(404).json({
                    message:
                        "Module not found."
                });
            }

            if (
                !teacherHasCourse(
                    teacherId,
                    module.course_id
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this course."
                });
            }

            const order =
                body.order !== undefined
                    ? Math.max(
                        1,
                        Math.floor(
                            toNumber(
                                body.order,
                                1
                            )
                        )
                    )
                    : (
                        body.lessonOrder !== undefined
                            ? Math.max(
                                1,
                                Math.floor(
                                    toNumber(
                                        body.lessonOrder,
                                        1
                                    )
                                )
                            )
                            : (
                                Number(
                                    db.prepare(`
                                        SELECT
                                            COALESCE(
                                                MAX(lesson_order),
                                                0
                                            ) AS max_order
                                        FROM lessons
                                        WHERE module_id = ?
                                    `).get(
                                        moduleId
                                    )?.max_order ||
                                    0
                                ) + 1
                            )
                    );

            const duration =
                Math.max(
                    0,
                    toNumber(
                        body.duration ??
                        body.durationMinutes,
                        0
                    )
                );

            const xpReward =
                Math.max(
                    0,
                    toNumber(
                        body.xpReward ??
                        body.xp,
                        50
                    )
                );

            const status =
                String(
                    body.status ||
                    "published"
                ).trim();

            const result =
                db.prepare(`
                    INSERT INTO lessons
                    (
                        module_id,
                        title,
                        description,
                        content,
                        lesson_order,
                        duration,
                        xp_reward,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    moduleId,
                    title,
                    body.description || "",
                    body.content || "",
                    order,
                    duration,
                    xpReward,
                    status
                );

            const lesson =
                db.prepare(`
                    SELECT
                        l.*,
                        l.lesson_order AS "order",
                        l.xp_reward AS xp,
                        l.duration AS durationMinutes,
                        m.title AS module_title
                    FROM lessons l
                    JOIN modules m
                        ON m.id = l.module_id
                    WHERE l.id = ?
                `).get(
                    result.lastInsertRowid
                );

            return res.status(201).json({
                message:
                    "Lesson created successfully.",
                lesson
            });

        } catch (error) {
            console.error(
                "Teacher create lesson error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create lesson."
            });
        }
    }
);


/* =========================================================
   CREATE LESSON FOR CLASS
========================================================= */

router.post(
    "/classes/:classId/lessons",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classId =
                toPositiveInteger(
                    req.params.classId
                );

            const body =
                req.body || {};

            const moduleId =
                toPositiveInteger(
                    body.moduleId ||
                    body.module_id
                );

            const title =
                String(
                    body.title || ""
                ).trim();

            if (!classId) {
                return res.status(400).json({
                    message:
                        "Invalid class ID."
                });
            }

            if (!moduleId) {
                return res.status(400).json({
                    message:
                        "Module ID is required."
                });
            }

            if (!title) {
                return res.status(400).json({
                    message:
                        "Lesson title is required."
                });
            }

            if (
                !teacherHasClass(
                    teacherId,
                    classId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const classInfo =
                db.prepare(`
                    SELECT
                        id,
                        course_id
                    FROM classes
                    WHERE id = ?
                `).get(
                    classId
                );

            if (!classInfo) {
                return res.status(404).json({
                    message:
                        "Class not found."
                });
            }

            const module =
                db.prepare(`
                    SELECT
                        id,
                        course_id
                    FROM modules
                    WHERE id = ?
                `).get(
                    moduleId
                );

            if (!module) {
                return res.status(404).json({
                    message:
                        "Module not found."
                });
            }

            if (
                Number(
                    module.course_id
                ) !==
                Number(
                    classInfo.course_id
                )
            ) {
                return res.status(400).json({
                    message:
                        "The selected module does not belong to this class course."
                });
            }

            const order =
                body.order !== undefined
                    ? Math.max(
                        1,
                        Math.floor(
                            toNumber(
                                body.order,
                                1
                            )
                        )
                    )
                    : (
                        Number(
                            db.prepare(`
                                SELECT
                                    COALESCE(
                                        MAX(lesson_order),
                                        0
                                    ) AS max_order
                                FROM lessons
                                WHERE module_id = ?
                            `).get(
                                moduleId
                            )?.max_order ||
                            0
                        ) + 1
                    );

            const duration =
                Math.max(
                    0,
                    toNumber(
                        body.duration ??
                        body.durationMinutes,
                        0
                    )
                );

            const xpReward =
                Math.max(
                    0,
                    toNumber(
                        body.xpReward ??
                        body.xp,
                        50
                    )
                );

            const result =
                db.prepare(`
                    INSERT INTO lessons
                    (
                        module_id,
                        title,
                        description,
                        content,
                        lesson_order,
                        duration,
                        xp_reward,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    moduleId,
                    title,
                    body.description || "",
                    body.content || "",
                    order,
                    duration,
                    xpReward,
                    body.status ||
                    "published"
                );

            const lesson =
                db.prepare(`
                    SELECT *
                    FROM lessons
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            return res.status(201).json({
                message:
                    "Lesson created successfully.",
                lesson
            });

        } catch (error) {
            console.error(
                "Teacher class lesson creation error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create lesson."
            });
        }
    }
);


/* =========================================================
   UPDATE LESSON
========================================================= */

router.patch(
    "/lessons/:lessonId",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const lessonId =
                toPositiveInteger(
                    req.params.lessonId
                );

            if (!lessonId) {
                return res.status(400).json({
                    message:
                        "Invalid lesson ID."
                });
            }

            if (
                !teacherCanAccessLesson(
                    teacherId,
                    lessonId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this lesson."
                });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM lessons
                    WHERE id = ?
                `).get(
                    lessonId
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Lesson not found."
                });
            }

            const body =
                req.body || {};

            const title =
                body.title !== undefined
                    ? String(
                        body.title
                    ).trim()
                    : existing.title;

            if (!title) {
                return res.status(400).json({
                    message:
                        "Lesson title cannot be empty."
                });
            }

            const order =
                body.order !== undefined
                    ? Math.max(
                        1,
                        Math.floor(
                            toNumber(
                                body.order,
                                existing.lesson_order
                            )
                        )
                    )
                    : existing.lesson_order;

            const duration =
                body.duration !== undefined
                    ? Math.max(
                        0,
                        toNumber(
                            body.duration,
                            existing.duration
                        )
                    )
                    : existing.duration;

            const xpReward =
                body.xpReward !== undefined
                    ? Math.max(
                        0,
                        toNumber(
                            body.xpReward,
                            existing.xp_reward
                        )
                    )
                    : existing.xp_reward;

            db.prepare(`
                UPDATE lessons
                SET
                    title = ?,
                    description = ?,
                    content = ?,
                    lesson_order = ?,
                    duration = ?,
                    xp_reward = ?,
                    status = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                title,
                body.description !== undefined
                    ? body.description
                    : existing.description,
                body.content !== undefined
                    ? body.content
                    : existing.content,
                order,
                duration,
                xpReward,
                body.status !== undefined
                    ? body.status
                    : existing.status,
                lessonId
            );

            const lesson =
                db.prepare(`
                    SELECT *
                    FROM lessons
                    WHERE id = ?
                `).get(
                    lessonId
                );

            return res.json({
                message:
                    "Lesson updated successfully.",
                lesson
            });

        } catch (error) {
            console.error(
                "Teacher update lesson error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not update lesson."
            });
        }
    }
);


/* =========================================================
   LESSON MATERIALS
========================================================= */

router.get(
    "/lessons/:lessonId/materials",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const lessonId =
                toPositiveInteger(
                    req.params.lessonId
                );

            if (!lessonId) {
                return res.status(400).json({
                    message:
                        "Invalid lesson ID."
                });
            }

            if (
                !teacherCanAccessLesson(
                    teacherId,
                    lessonId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this lesson."
                });
            }

            const materials =
                db.prepare(`
                    SELECT *
                    FROM lesson_materials
                    WHERE lesson_id = ?
                    ORDER BY id ASC
                `).all(
                    lessonId
                );

            return res.json({
                lessonId,
                materials
            });

        } catch (error) {
            console.error(
                "Teacher lesson materials error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load lesson materials."
            });
        }
    }
);


/* =========================================================
   CREATE URL LESSON MATERIAL
========================================================= */

router.post(
    "/lessons/:lessonId/materials",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const lessonId =
                toPositiveInteger(
                    req.params.lessonId
                );

            if (!lessonId) {
                return res.status(400).json({
                    message:
                        "Invalid lesson ID."
                });
            }

            if (
                !teacherCanAccessLesson(
                    teacherId,
                    lessonId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this lesson."
                });
            }

            const {
                title,
                type = "link",
                url = null,
                description = "",
                fileName = null
            } = req.body || {};

            if (
                !title ||
                !String(title).trim()
            ) {
                return res.status(400).json({
                    message:
                        "Material title is required."
                });
            }

            const result =
                db.prepare(`
                    INSERT INTO lesson_materials
                    (
                        lesson_id,
                        title,
                        type,
                        url,
                        description,
                        file_name
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    lessonId,
                    String(
                        title
                    ).trim(),
                    String(
                        type
                    ).trim(),
                    url || null,
                    String(
                        description || ""
                    ).trim(),
                    fileName || null
                );

            const material =
                db.prepare(`
                    SELECT *
                    FROM lesson_materials
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            return res.status(201).json({
                message:
                    "Lesson material created successfully.",
                material
            });

        } catch (error) {
            console.error(
                "Teacher create material error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create lesson material."
            });
        }
    }
);


/* =========================================================
   UPLOAD LESSON MATERIAL
========================================================= */

router.post(
    "/lessons/:lessonId/materials/upload",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        lessonFileUpload.single(
            "file"
        )(
            req,
            res,
            async error => {
                if (error) {
                    return handleUploadError(
                        error,
                        res
                    );
                }

                try {
                    const teacherId =
                        req.teacher.id;

                    const lessonId =
                        toPositiveInteger(
                            req.params.lessonId
                        );

                    if (!lessonId) {
                        if (req.file) {
                            deletePhysicalFile(
                                req.file.path
                            );
                        }

                        return res.status(400).json({
                            message:
                                "Invalid lesson ID."
                        });
                    }

                    if (
                        !teacherCanAccessLesson(
                            teacherId,
                            lessonId
                        )
                    ) {
                        if (req.file) {
                            deletePhysicalFile(
                                req.file.path
                            );
                        }

                        return res.status(403).json({
                            message:
                                "You do not have access to this lesson."
                        });
                    }

                    if (!req.file) {
                        return res.status(400).json({
                            message:
                                "A file is required."
                        });
                    }

                    const title =
                        String(
                            req.body?.title ||
                            req.file.originalname
                        ).trim();

                    const description =
                        String(
                            req.body?.description ||
                            ""
                        ).trim();

                    const type =
                        uploadedFileType(
                            req.file
                        );

                    const url =
                        getUploadedFileUrl(
                            req,
                            req.file.path
                        );

                    const result =
                        db.prepare(`
                            INSERT INTO lesson_materials
                            (
                                lesson_id,
                                title,
                                type,
                                url,
                                description,
                                file_name
                            )
                            VALUES (?, ?, ?, ?, ?, ?)
                        `).run(
                            lessonId,
                            title,
                            type,
                            url,
                            description,
                            req.file.originalname
                        );

                    const material =
                        db.prepare(`
                            SELECT *
                            FROM lesson_materials
                            WHERE id = ?
                        `).get(
                            result.lastInsertRowid
                        );

                    return res.status(201).json({
                        message:
                            "Lesson file uploaded successfully.",
                        material
                    });

                } catch (uploadError) {
                    if (req.file) {
                        deletePhysicalFile(
                            req.file.path
                        );
                    }

                    console.error(
                        "Teacher lesson upload error:",
                        uploadError
                    );

                    return res.status(500).json({
                        message:
                            "Could not save uploaded lesson file."
                    });
                }
            }
        );
    }
);


/* =========================================================
   DELETE LESSON MATERIAL
========================================================= */

router.delete(
    "/lessons/:lessonId/materials/:materialId",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const lessonId =
                toPositiveInteger(
                    req.params.lessonId
                );

            const materialId =
                toPositiveInteger(
                    req.params.materialId
                );

            if (
                !lessonId ||
                !materialId
            ) {
                return res.status(400).json({
                    message:
                        "Invalid lesson or material ID."
                });
            }

            if (
                !teacherCanAccessLesson(
                    teacherId,
                    lessonId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this lesson."
                });
            }

            const material =
                db.prepare(`
                    SELECT *
                    FROM lesson_materials
                    WHERE id = ?
                      AND lesson_id = ?
                `).get(
                    materialId,
                    lessonId
                );

            if (!material) {
                return res.status(404).json({
                    message:
                        "Lesson material not found."
                });
            }

            if (
                material.url &&
                String(
                    material.url
                ).includes(
                    "/uploads/"
                )
            ) {
                const relative =
                    String(
                        material.url
                    )
                        .replace(
                            /^\/uploads\//,
                            ""
                        );

                deletePhysicalFile(
                    path.join(
                        UPLOAD_ROOT,
                        relative
                    )
                );
            }

            db.prepare(`
                DELETE FROM lesson_materials
                WHERE id = ?
            `).run(
                materialId
            );

            return res.json({
                message:
                    "Lesson material deleted successfully."
            });

        } catch (error) {
            console.error(
                "Teacher delete material error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not delete lesson material."
            });
        }
    }
);


/* =========================================================
   STUDENT REPORTS
========================================================= */

router.get(
    "/students/:studentId/reports",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const studentId =
                toPositiveInteger(
                    req.params.studentId
                );

            if (!studentId) {
                return res.status(400).json({
                    message:
                        "Invalid student ID."
                });
            }

            if (
                !teacherCanAccessStudent(
                    teacherId,
                    studentId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this student."
                });
            }

            const reports =
                db.prepare(`
                    SELECT
                        srf.*,
                        t.title AS test_title
                    FROM student_report_files srf
                    LEFT JOIN tests t
                        ON t.id = srf.test_id
                    WHERE srf.student_id = ?
                    ORDER BY
                        srf.created_at DESC,
                        srf.id DESC
                `).all(
                    studentId
                );

            return res.json({
                studentId,
                reports
            });

        } catch (error) {
            console.error(
                "Teacher student reports error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load student reports."
            });
        }
    }
);


/* =========================================================
   UPLOAD STUDENT REPORT
========================================================= */

router.post(
    "/students/:studentId/reports/upload",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        reportFileUpload.single(
            "file"
        )(
            req,
            res,
            error => {
                if (error) {
                    return handleUploadError(
                        error,
                        res
                    );
                }

                try {
                    const teacherId =
                        req.teacher.id;

                    const studentId =
                        toPositiveInteger(
                            req.params.studentId
                        );

                    if (!studentId) {
                        if (req.file) {
                            deletePhysicalFile(
                                req.file.path
                            );
                        }

                        return res.status(400).json({
                            message:
                                "Invalid student ID."
                        });
                    }

                    if (
                        !teacherCanAccessStudent(
                            teacherId,
                            studentId
                        )
                    ) {
                        if (req.file) {
                            deletePhysicalFile(
                                req.file.path
                            );
                        }

                        return res.status(403).json({
                            message:
                                "You do not have access to this student."
                        });
                    }

                    if (!req.file) {
                        return res.status(400).json({
                            message:
                                "A file is required."
                        });
                    }

                    const title =
                        String(
                            req.body?.title ||
                            req.file.originalname
                        ).trim();

                    const testId =
                        toPositiveInteger(
                            req.body?.testId ||
                            req.body?.test_id
                        );

                    if (
                        testId
                    ) {
                        const test =
                            db.prepare(`
                                SELECT *
                                FROM tests
                                WHERE id = ?
                            `).get(
                                testId
                            );

                        if (
                            !test ||
                            !teacherCanAccessTest(
                                teacherId,
                                test
                            )
                        ) {
                            deletePhysicalFile(
                                req.file.path
                            );

                            return res.status(403).json({
                                message:
                                    "You do not have access to the selected test."
                            });
                        }
                    }

                    const url =
                        getUploadedFileUrl(
                            req,
                            req.file.path
                        );

                    const result =
                        db.prepare(`
                            INSERT INTO student_report_files
                            (
                                student_id,
                                test_id,
                                title,
                                file_name,
                                file_path,
                                file_type,
                                file_size,
                                description,
                                uploaded_by_teacher_id
                            )
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `).run(
                            studentId,
                            testId || null,
                            title,
                            req.file.originalname,
                            url,
                            uploadedFileType(
                                req.file
                            ),
                            req.file.size,
                            String(
                                req.body?.description ||
                                ""
                            ).trim(),
                            teacherId
                        );

                    const report =
                        db.prepare(`
                            SELECT *
                            FROM student_report_files
                            WHERE id = ?
                        `).get(
                            result.lastInsertRowid
                        );

                    return res.status(201).json({
                        message:
                            "Student report uploaded successfully.",
                        report
                    });

                } catch (uploadError) {
                    if (req.file) {
                        deletePhysicalFile(
                            req.file.path
                        );
                    }

                    console.error(
                        "Teacher report upload error:",
                        uploadError
                    );

                    return res.status(500).json({
                        message:
                            "Could not save student report."
                    });
                }
            }
        );
    }
);


/* =========================================================
   DELETE STUDENT REPORT
========================================================= */

router.delete(
    "/students/:studentId/reports/:reportId",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const studentId =
                toPositiveInteger(
                    req.params.studentId
                );

            const reportId =
                toPositiveInteger(
                    req.params.reportId
                );

            if (
                !studentId ||
                !reportId
            ) {
                return res.status(400).json({
                    message:
                        "Invalid student or report ID."
                });
            }

            if (
                !teacherCanAccessStudent(
                    teacherId,
                    studentId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this student."
                });
            }

            const report =
                db.prepare(`
                    SELECT *
                    FROM student_report_files
                    WHERE id = ?
                      AND student_id = ?
                `).get(
                    reportId,
                    studentId
                );

            if (!report) {
                return res.status(404).json({
                    message:
                        "Student report not found."
                });
            }

            if (
                report.file_path &&
                String(
                    report.file_path
                ).includes(
                    "/uploads/"
                )
            ) {
                const relative =
                    String(
                        report.file_path
                    )
                        .replace(
                            /^\/uploads\//,
                            ""
                        );

                deletePhysicalFile(
                    path.join(
                        UPLOAD_ROOT,
                        relative
                    )
                );
            }

            db.prepare(`
                DELETE FROM student_report_files
                WHERE id = ?
            `).run(
                reportId
            );

            return res.json({
                message:
                    "Student report deleted successfully."
            });

        } catch (error) {
            console.error(
                "Teacher delete report error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not delete student report."
            });
        }
    }
);


/* =========================================================
   EXERCISES
========================================================= */

router.get(
    "/lessons/:lessonId/exercises",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const lessonId =
                toPositiveInteger(
                    req.params.lessonId
                );

            if (!lessonId) {
                return res.status(400).json({
                    message:
                        "Invalid lesson ID."
                });
            }

            if (
                !teacherCanAccessLesson(
                    teacherId,
                    lessonId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this lesson."
                });
            }

            const exercises =
                db.prepare(`
                    SELECT *
                    FROM exercises
                    WHERE lesson_id = ?
                    ORDER BY
                        exercise_order ASC,
                        id ASC
                `).all(
                    lessonId
                );

            return res.json({
                lessonId,
                exercises
            });

        } catch (error) {
            console.error(
                "Teacher exercises error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load exercises."
            });
        }
    }
);


router.post(
    "/lessons/:lessonId/exercises",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const lessonId =
                toPositiveInteger(
                    req.params.lessonId
                );

            if (!lessonId) {
                return res.status(400).json({
                    message:
                        "Invalid lesson ID."
                });
            }

            if (
                !teacherCanAccessLesson(
                    teacherId,
                    lessonId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this lesson."
                });
            }

            const body =
                req.body || {};

            const question =
                String(
                    body.question ||
                    body.title ||
                    ""
                ).trim();

            if (!question) {
                return res.status(400).json({
                    message:
                        "Exercise question is required."
                });
            }

            const exerciseType =
                String(
                    body.exerciseType ||
                    body.exercise_type ||
                    body.type ||
                    "multiple_choice"
                ).trim();

            const options =
                Array.isArray(
                    body.options
                )
                    ? JSON.stringify(
                        body.options
                    )
                    : (
                        typeof body.options ===
                        "string"
                            ? body.options
                            : JSON.stringify([])
                    );

            const correctAnswer =
                body.correctAnswer ??
                body.correct_answer ??
                body.answer ??
                "";

            const order =
                Math.max(
                    1,
                    Math.floor(
                        toNumber(
                            body.order ??
                            body.exerciseOrder,
                            (
                                Number(
                                    db.prepare(`
                                        SELECT
                                            COALESCE(
                                                MAX(exercise_order),
                                                0
                                            ) AS max_order
                                        FROM exercises
                                        WHERE lesson_id = ?
                                    `).get(
                                        lessonId
                                    )?.max_order ||
                                    0
                                ) + 1
                            )
                        )
                    )
                );

            const xpReward =
                Math.max(
                    0,
                    toNumber(
                        body.xpReward ??
                        body.xp ??
                        body.xp_reward,
                        10
                    )
                );

            const result =
                db.prepare(`
                    INSERT INTO exercises
                    (
                        lesson_id,
                        exercise_type,
                        type,
                        question,
                        options,
                        correct_answer,
                        exercise_order,
                        xp_reward
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    lessonId,
                    exerciseType,
                    exerciseType,
                    question,
                    options,
                    String(
                        correctAnswer
                    ),
                    order,
                    xpReward
                );

            const exercise =
                db.prepare(`
                    SELECT *
                    FROM exercises
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            return res.status(201).json({
                message:
                    "Exercise created successfully.",
                exercise
            });

        } catch (error) {
            console.error(
                "Teacher create exercise error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create exercise."
            });
        }
    }
);


/* =========================================================
   ATTENDANCE
========================================================= */

router.get(
    "/classes/:classId/attendance",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classId =
                toPositiveInteger(
                    req.params.classId
                );

            if (!classId) {
                return res.status(400).json({
                    message:
                        "Invalid class ID."
                });
            }

            if (
                !teacherHasClass(
                    teacherId,
                    classId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const date =
                req.query.date ||
                getKigaliDate();

            const attendance =
                db.prepare(`
                    SELECT
                        s.id AS student_id,
                        s.full_name,
                        s.email,
                        s.phone,

                        e.status AS enrollment_status,

                        a.id AS attendance_id,
                        a.course_id,
                        a.class_id,
                        a.attendance_date,
                        a.status,
                        a.notes,
                        a.marked_by_teacher_id,
                        a.created_at

                    FROM enrollments e

                    JOIN students s
                        ON s.id = e.student_id

                    LEFT JOIN attendance a
                        ON a.student_id = s.id
                       AND a.class_id = e.class_id
                       AND a.attendance_date = ?

                    WHERE e.class_id = ?
                      AND e.status = 'active'

                    ORDER BY
                        s.full_name COLLATE NOCASE
                `).all(
                    date,
                    classId
                );

            const summary =
                db.prepare(`
                    SELECT
                        COUNT(*) AS total,

                        SUM(
                            CASE
                                WHEN a.status = 'present'
                                THEN 1
                                ELSE 0
                            END
                        ) AS present,

                        SUM(
                            CASE
                                WHEN a.status = 'late'
                                THEN 1
                                ELSE 0
                            END
                        ) AS late,

                        SUM(
                            CASE
                                WHEN a.status = 'absent'
                                THEN 1
                                ELSE 0
                            END
                        ) AS absent,

                        SUM(
                            CASE
                                WHEN a.status = 'excused'
                                THEN 1
                                ELSE 0
                            END
                        ) AS excused

                    FROM enrollments e

                    LEFT JOIN attendance a
                        ON a.student_id = e.student_id
                       AND a.class_id = e.class_id
                       AND a.attendance_date = ?

                    WHERE e.class_id = ?
                      AND e.status = 'active'
                `).get(
                    date,
                    classId
                );

            const total =
                Number(
                    summary?.total ||
                    0
                );

            const present =
                Number(
                    summary?.present ||
                    0
                );

            const late =
                Number(
                    summary?.late ||
                    0
                );

            const absent =
                Number(
                    summary?.absent ||
                    0
                );

            const excused =
                Number(
                    summary?.excused ||
                    0
                );

            const unmarked =
                Math.max(
                    0,
                    total -
                    present -
                    late -
                    absent -
                    excused
                );

            const activeCodes =
                db.prepare(`
                    SELECT *
                    FROM attendance_codes
                    WHERE class_id = ?
                      AND attendance_date = ?
                      AND status = 'active'
                    ORDER BY id DESC
                `).all(
                    classId,
                    date
                );

            return res.json({
                date,
                classId,
                attendance,

                activeCodes,
                codes:
                    activeCodes,
                attendanceCodes:
                    activeCodes,

                summary: {
                    total,
                    present,
                    late,
                    absent,
                    excused,
                    unmarked
                }
            });

        } catch (error) {
            console.error(
                "Teacher attendance error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load attendance."
            });
        }
    }
);


/* =========================================================
   ATTENDANCE HISTORY
========================================================= */

router.get(
    "/classes/:classId/attendance/history",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classId =
                toPositiveInteger(
                    req.params.classId
                );

            if (!classId) {
                return res.status(400).json({
                    message:
                        "Invalid class ID."
                });
            }

            if (
                !teacherHasClass(
                    teacherId,
                    classId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const from =
                req.query.from ||
                null;

            const to =
                req.query.to ||
                null;

            let query = `
                SELECT
                    a.*,
                    s.full_name,
                    s.email,
                    s.phone
                FROM attendance a
                JOIN students s
                    ON s.id = a.student_id
                WHERE a.class_id = ?
            `;

            const params = [
                classId
            ];

            if (from) {
                query += `
                    AND a.attendance_date >= ?
                `;

                params.push(
                    from
                );
            }

            if (to) {
                query += `
                    AND a.attendance_date <= ?
                `;

                params.push(
                    to
                );
            }

            query += `
                ORDER BY
                    a.attendance_date DESC,
                    s.full_name COLLATE NOCASE
            `;

            const attendance =
                db.prepare(
                    query
                ).all(
                    ...params
                );

            return res.json({
                classId,
                from,
                to,
                attendance
            });

        } catch (error) {
            console.error(
                "Teacher attendance history error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load attendance history."
            });
        }
    }
);


/* =========================================================
   MARK / UPDATE ATTENDANCE
========================================================= */

router.post(
    "/classes/:classId/attendance",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classId =
                toPositiveInteger(
                    req.params.classId
                );

            if (!classId) {
                return res.status(400).json({
                    message:
                        "Invalid class ID."
                });
            }

            if (
                !teacherHasClass(
                    teacherId,
                    classId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const {
                studentId,
                status = "present",
                attendanceDate =
                    getKigaliDate(),
                notes = ""
            } = req.body || {};

            const numericStudentId =
                toPositiveInteger(
                    studentId
                );

            if (!numericStudentId) {
                return res.status(400).json({
                    message:
                        "Valid student ID is required."
                });
            }

            if (
                !validAttendanceStatus(
                    status
                )
            ) {
                return res.status(400).json({
                    message:
                        "Invalid attendance status."
                });
            }

            const enrolled =
                db.prepare(`
                    SELECT id
                    FROM enrollments
                    WHERE student_id = ?
                      AND class_id = ?
                      AND status = 'active'
                `).get(
                    numericStudentId,
                    classId
                );

            if (!enrolled) {
                return res.status(400).json({
                    message:
                        "Student is not enrolled in this class."
                });
            }

            const classInfo =
                db.prepare(`
                    SELECT
                        id,
                        course_id
                    FROM classes
                    WHERE id = ?
                `).get(
                    classId
                );

            if (!classInfo) {
                return res.status(404).json({
                    message:
                        "Class not found."
                });
            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM attendance
                    WHERE student_id = ?
                      AND class_id = ?
                      AND attendance_date = ?
                `).get(
                    numericStudentId,
                    classId,
                    attendanceDate
                );

            if (existing) {
                db.prepare(`
                    UPDATE attendance
                    SET
                        status = ?,
                        notes = ?,
                        marked_by_teacher_id = ?
                    WHERE id = ?
                `).run(
                    status,
                    notes,
                    teacherId,
                    existing.id
                );

                const updated =
                    db.prepare(`
                        SELECT *
                        FROM attendance
                        WHERE id = ?
                    `).get(
                        existing.id
                    );

                return res.json({
                    message:
                        "Attendance updated successfully.",
                    attendance:
                        updated
                });
            }

            const result =
                db.prepare(`
                    INSERT INTO attendance
                    (
                        student_id,
                        course_id,
                        class_id,
                        attendance_date,
                        status,
                        notes,
                        marked_by_teacher_id
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    numericStudentId,
                    classInfo.course_id,
                    classId,
                    attendanceDate,
                    status,
                    notes,
                    teacherId
                );

            const attendance =
                db.prepare(`
                    SELECT *
                    FROM attendance
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            return res.status(201).json({
                message:
                    "Attendance marked successfully.",
                attendance
            });

        } catch (error) {
            console.error(
                "Teacher mark attendance error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not mark attendance."
            });
        }
    }
);


/* =========================================================
   ATTENDANCE CODE
========================================================= */

router.post(
    "/classes/:classId/attendance-code",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classId =
                toPositiveInteger(
                    req.params.classId
                );

            if (!classId) {
                return res.status(400).json({
                    message:
                        "Invalid class ID."
                });
            }

            if (
                !teacherHasClass(
                    teacherId,
                    classId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const {
                attendanceDate =
                    getKigaliDate(),

                expiresAt = null
            } = req.body || {};

            const classInfo =
                db.prepare(`
                    SELECT
                        id,
                        course_id
                    FROM classes
                    WHERE id = ?
                `).get(
                    classId
                );

            if (!classInfo) {
                return res.status(404).json({
                    message:
                        "Class not found."
                });
            }

            const code =
                `LDC-${cryptoRandomCode(6)}`;

            db.prepare(`
                UPDATE attendance_codes
                SET status = 'inactive'
                WHERE class_id = ?
                  AND attendance_date = ?
                  AND status = 'active'
            `).run(
                classId,
                attendanceDate
            );

            const result =
                db.prepare(`
                    INSERT INTO attendance_codes
                    (
                        course_id,
                        class_id,
                        code,
                        attendance_date,
                        expires_at,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, 'active')
                `).run(
                    classInfo.course_id,
                    classId,
                    code,
                    attendanceDate,
                    expiresAt
                );

            return res.status(201).json({
                message:
                    "Attendance code created successfully.",
                code,
                attendanceDate,
                expiresAt,
                id:
                    result.lastInsertRowid
            });

        } catch (error) {
            console.error(
                "Teacher attendance code error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create attendance code."
            });
        }
    }
);


/* =========================================================
   DEACTIVATE ATTENDANCE CODE
========================================================= */

router.patch(
    "/classes/:classId/attendance-code/:codeId",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classId =
                toPositiveInteger(
                    req.params.classId
                );

            const codeId =
                toPositiveInteger(
                    req.params.codeId
                );

            if (
                !classId ||
                !codeId
            ) {
                return res.status(400).json({
                    message:
                        "Invalid class or code ID."
                });
            }

            if (
                !teacherHasClass(
                    teacherId,
                    classId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const code =
                db.prepare(`
                    SELECT *
                    FROM attendance_codes
                    WHERE id = ?
                      AND class_id = ?
                `).get(
                    codeId,
                    classId
                );

            if (!code) {
                return res.status(404).json({
                    message:
                        "Attendance code not found."
                });
            }

            db.prepare(`
                UPDATE attendance_codes
                SET status = 'inactive'
                WHERE id = ?
            `).run(
                codeId
            );

            return res.json({
                message:
                    "Attendance code deactivated successfully."
            });

        } catch (error) {
            console.error(
                "Teacher deactivate attendance code error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not deactivate attendance code."
            });
        }
    }
);


/* =========================================================
   TESTS
========================================================= */

router.get(
    "/tests",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const tests =
                db.prepare(`
                    SELECT
                        t.*,

                        c.name AS course_name,
                        c.level AS course_level,

                        cl.name AS class_name,

                        (
                            SELECT COUNT(*)
                            FROM test_results tr
                            WHERE tr.test_id = t.id
                        ) AS result_count

                    FROM tests t

                    LEFT JOIN courses c
                        ON c.id = t.course_id

                    LEFT JOIN classes cl
                        ON cl.id = t.class_id

                    WHERE
                        t.teacher_id = ?

                        OR EXISTS (
                            SELECT 1
                            FROM teacher_classes tc
                            WHERE tc.teacher_id = ?
                              AND tc.class_id = t.class_id
                        )

                    ORDER BY
                        t.test_date DESC,
                        t.id DESC
                `).all(
                    teacherId,
                    teacherId
                );

            return res.json({
                tests
            });

        } catch (error) {
            console.error(
                "Teacher tests error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load tests."
            });
        }
    }
);


/* =========================================================
   CLASS TESTS
========================================================= */

router.get(
    "/classes/:classId/tests",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classId =
                toPositiveInteger(
                    req.params.classId
                );

            if (!classId) {
                return res.status(400).json({
                    message:
                        "Invalid class ID."
                });
            }

            if (
                !teacherHasClass(
                    teacherId,
                    classId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const tests =
                db.prepare(`
                    SELECT
                        t.*,

                        c.name AS course_name,
                        c.level AS course_level,

                        (
                            SELECT COUNT(*)
                            FROM test_results tr
                            WHERE tr.test_id = t.id
                        ) AS result_count

                    FROM tests t

                    LEFT JOIN courses c
                        ON c.id = t.course_id

                    WHERE t.class_id = ?

                    ORDER BY
                        t.test_date DESC,
                        t.id DESC
                `).all(
                    classId
                );

            return res.json({
                classId,
                tests
            });

        } catch (error) {
            console.error(
                "Get class tests error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load class tests."
            });
        }
    }
);


/* =========================================================
   CREATE TEST
========================================================= */

router.post(
    "/tests",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const body =
                req.body || {};

            const title =
                body.title;

            const numericClassId =
                toPositiveInteger(
                    body.classId ||
                    body.class_id
                );

            const courseId =
                body.courseId ||
                body.course_id ||
                null;

            const testType =
                body.testType ||
                body.test_type ||
                "weekly";

            const totalPoints =
                body.totalPoints !== undefined
                    ? body.totalPoints
                    : (
                        body.total_points !== undefined
                            ? body.total_points
                            : 100
                    );

            const testDate =
                body.testDate ||
                body.test_date ||
                getKigaliDate();

            const dueDate =
                body.dueDate !== undefined
                    ? body.dueDate
                    : (
                        body.due_date !== undefined
                            ? body.due_date
                            : null
                    );

            const description =
                body.description || "";

            const status =
                body.status ||
                "published";

            if (
                !title ||
                !numericClassId
            ) {
                return res.status(400).json({
                    message:
                        "Test title and class are required."
                });
            }

            const assigned =
                db.prepare(`
                    SELECT
                        tc.id,
                        cl.course_id
                    FROM teacher_classes tc

                    JOIN classes cl
                        ON cl.id = tc.class_id

                    WHERE tc.teacher_id = ?
                      AND tc.class_id = ?

                    LIMIT 1
                `).get(
                    teacherId,
                    numericClassId
                );

            if (!assigned) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const finalCourseId =
                toPositiveInteger(
                    courseId
                ) ||
                Number(
                    assigned.course_id
                );

            if (!finalCourseId) {
                return res.status(400).json({
                    message:
                        "Course could not be determined."
                });
            }

            if (
                Number(finalCourseId) !==
                Number(assigned.course_id)
            ) {
                return res.status(400).json({
                    message:
                        "The selected course does not belong to this class."
                });
            }

            const points =
                toNumber(
                    totalPoints,
                    100
                );

            if (points <= 0) {
                return res.status(400).json({
                    message:
                        "Total points must be greater than 0."
                });
            }

            const cleanTitle =
                String(
                    title
                ).trim();

            if (!cleanTitle) {
                return res.status(400).json({
                    message:
                        "Test title cannot be empty."
                });
            }

            const result =
                db.prepare(`
                    INSERT INTO tests
                    (
                        title,
                        description,
                        test_type,
                        course_id,
                        class_id,
                        teacher_id,
                        total_points,
                        test_date,
                        due_date,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    cleanTitle,
                    description,
                    testType,
                    finalCourseId,
                    numericClassId,
                    teacherId,
                    points,
                    testDate,
                    dueDate,
                    status
                );

            const test =
                db.prepare(`
                    SELECT *
                    FROM tests
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            return res.status(201).json({
                message:
                    "Test created successfully.",
                test
            });

        } catch (error) {
            console.error(
                "Teacher create test error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create test."
            });
        }
    }
);


/* =========================================================
   TEST RESULTS
========================================================= */

router.get(
    "/tests/:testId/results",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const testId =
                toPositiveInteger(
                    req.params.testId
                );

            if (!testId) {
                return res.status(400).json({
                    message:
                        "Invalid test ID."
                });
            }

            const test =
                db.prepare(`
                    SELECT
                        t.*,
                        cl.name AS class_name,
                        c.name AS course_name,
                        c.level AS course_level
                    FROM tests t

                    LEFT JOIN classes cl
                        ON cl.id = t.class_id

                    LEFT JOIN courses c
                        ON c.id = t.course_id

                    WHERE t.id = ?
                `).get(
                    testId
                );

            if (!test) {
                return res.status(404).json({
                    message:
                        "Test not found."
                });
            }

            if (
                !teacherCanAccessTest(
                    teacherId,
                    test
                )
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this test."
                });
            }

            const results =
                db.prepare(`
                    SELECT
                        tr.*,
                        s.full_name,
                        s.email,
                        s.phone

                    FROM test_results tr

                    JOIN students s
                        ON s.id = tr.student_id

                    WHERE tr.test_id = ?

                    ORDER BY
                        CASE
                            WHEN tr.rank IS NULL
                            THEN 1
                            ELSE 0
                        END,

                        tr.rank ASC,
                        tr.percentage DESC,
                        tr.score DESC,

                        s.full_name COLLATE NOCASE
                `).all(
                    testId
                );

            const students =
                db.prepare(`
                    SELECT
                        s.id AS student_id,
                        s.full_name,
                        s.email,

                        tr.id AS result_id,
                        tr.score,
                        tr.total_points,
                        tr.percentage,
                        tr.rank,
                        tr.teacher_comment,
                        tr.status

                    FROM enrollments e

                    JOIN students s
                        ON s.id = e.student_id

                    LEFT JOIN test_results tr
                        ON tr.student_id = s.id
                       AND tr.test_id = ?

                    WHERE e.class_id = ?
                      AND e.status = 'active'

                    ORDER BY
                        s.full_name COLLATE NOCASE
                `).all(
                    testId,
                    test.class_id
                );

            return res.json({
                test,
                results,
                students
            });

        } catch (error) {
            console.error(
                "Teacher test results error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load test results."
            });
        }
    }
);


/* =========================================================
   SAVE / UPDATE TEST RESULT
========================================================= */

router.post(
    "/tests/:testId/results",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const testId =
                toPositiveInteger(
                    req.params.testId
                );

            if (!testId) {
                return res.status(400).json({
                    message:
                        "Invalid test ID."
                });
            }

            const {
                studentId,
                score
            } = req.body || {};

            const numericStudentId =
                toPositiveInteger(
                    studentId
                );

            if (
                !numericStudentId ||
                score === undefined
            ) {
                return res.status(400).json({
                    message:
                        "Student ID and score are required."
                });
            }

            const comment =
                req.body?.comment !== undefined
                    ? req.body.comment
                    : (
                        req.body?.teacherComment !== undefined
                            ? req.body.teacherComment
                            : (
                                req.body?.teacher_comment ||
                                ""
                            )
                    );

            const test =
                db.prepare(`
                    SELECT *
                    FROM tests
                    WHERE id = ?
                `).get(
                    testId
                );

            if (!test) {
                return res.status(404).json({
                    message:
                        "Test not found."
                });
            }

            if (
                !teacherCanAccessTest(
                    teacherId,
                    test
                )
            ) {
                return res.status(403).json({
                    message:
                        "You do not have access to this test."
                });
            }

            const enrolled =
                db.prepare(`
                    SELECT id
                    FROM enrollments
                    WHERE student_id = ?
                      AND class_id = ?
                      AND status = 'active'
                `).get(
                    numericStudentId,
                    test.class_id
                );

            if (!enrolled) {
                return res.status(400).json({
                    message:
                        "Student is not enrolled in this class."
                });
            }

            const numericScore =
                Number(score);

            if (
                !Number.isFinite(
                    numericScore
                )
            ) {
                return res.status(400).json({
                    message:
                        "Score must be a valid number."
                });
            }

            const totalPoints =
                toNumber(
                    test.total_points,
                    0
                );

            if (totalPoints <= 0) {
                return res.status(400).json({
                    message:
                        "This test has an invalid total point value."
                });
            }

            if (
                numericScore < 0 ||
                numericScore > totalPoints
            ) {
                return res.status(400).json({
                    message:
                        `Score must be between 0 and ${totalPoints}.`
                });
            }

            const percentage =
                Number(
                    (
                        numericScore /
                        totalPoints *
                        100
                    ).toFixed(2)
                );

            const existing =
                db.prepare(`
                    SELECT id
                    FROM test_results
                    WHERE test_id = ?
                      AND student_id = ?
                `).get(
                    testId,
                    numericStudentId
                );

            let resultId;
            let created = false;

            if (existing) {
                db.prepare(`
                    UPDATE test_results
                    SET
                        score = ?,
                        total_points = ?,
                        percentage = ?,
                        teacher_comment = ?,
                        graded_by_teacher_id = ?,
                        graded_at = CURRENT_TIMESTAMP,
                        status = 'graded',
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(
                    numericScore,
                    totalPoints,
                    percentage,
                    String(
                        comment
                    ),
                    teacherId,
                    existing.id
                );

                resultId =
                    existing.id;

            } else {
                const result =
                    db.prepare(`
                        INSERT INTO test_results
                        (
                            test_id,
                            student_id,
                            score,
                            total_points,
                            percentage,
                            teacher_comment,
                            status,
                            graded_by_teacher_id,
                            graded_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    `).run(
                        testId,
                        numericStudentId,
                        numericScore,
                        totalPoints,
                        percentage,
                        String(
                            comment
                        ),
                        "graded",
                        teacherId
                    );

                resultId =
                    result.lastInsertRowid;

                created =
                    true;
            }

            const results =
                db.prepare(`
                    SELECT
                        id,
                        score,
                        percentage

                    FROM test_results

                    WHERE test_id = ?

                    ORDER BY
                        percentage DESC,
                        score DESC,
                        id ASC
                `).all(
                    testId
                );

            const updateRank =
                db.prepare(`
                    UPDATE test_results
                    SET rank = ?
                    WHERE id = ?
                `);

            const updateRanks =
                db.transaction(
                    () => {
                        results.forEach(
                            (
                                item,
                                index
                            ) => {
                                updateRank.run(
                                    index + 1,
                                    item.id
                                );
                            }
                        );
                    }
                );

            updateRanks();

            const savedResult =
                db.prepare(`
                    SELECT
                        tr.*,
                        s.full_name,
                        s.email,
                        t.title AS test_title

                    FROM test_results tr

                    JOIN students s
                        ON s.id = tr.student_id

                    JOIN tests t
                        ON t.id = tr.test_id

                    WHERE tr.id = ?
                `).get(
                    resultId
                );

            return res.status(
                created
                    ? 201
                    : 200
            ).json({
                message:
                    created
                        ? "Test result saved successfully."
                        : "Test result updated successfully.",

                result:
                    savedResult
            });

        } catch (error) {
            console.error(
                "Teacher save result error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not save test result."
            });
        }
    }
);


/* =========================================================
   CLASS PERFORMANCE
========================================================= */

router.get(
    "/classes/:classId/performance",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        try {
            const teacherId =
                req.teacher.id;

            const classId =
                toPositiveInteger(
                    req.params.classId
                );

            if (!classId) {
                return res.status(400).json({
                    message:
                        "Invalid class ID."
                });
            }

            if (
                !teacherHasClass(
                    teacherId,
                    classId
                )
            ) {
                return res.status(403).json({
                    message:
                        "You are not assigned to this class."
                });
            }

            const ranking =
                db.prepare(`
                    SELECT
                        s.id,
                        s.full_name,

                        COUNT(tr.id)
                            AS tests_taken,

                        ROUND(
                            AVG(tr.percentage),
                            2
                        ) AS average_score,

                        MAX(tr.percentage)
                            AS highest_score,

                        MIN(tr.percentage)
                            AS lowest_score

                    FROM enrollments e

                    JOIN students s
                        ON s.id = e.student_id

                    LEFT JOIN tests t
                        ON t.class_id = e.class_id

                    LEFT JOIN test_results tr
                        ON tr.test_id = t.id
                       AND tr.student_id = s.id

                    WHERE e.class_id = ?
                      AND e.status = 'active'

                    GROUP BY
                        s.id,
                        s.full_name

                    ORDER BY
                        CASE
                            WHEN AVG(tr.percentage)
                                IS NULL
                            THEN 1
                            ELSE 0
                        END,

                        AVG(tr.percentage) DESC,
                        MAX(tr.percentage) DESC,

                        s.full_name COLLATE NOCASE
                `).all(
                    classId
                );

            let rank = 0;

            const ranked =
                ranking.map(
                    student => {
                        if (
                            student.average_score !==
                            null
                        ) {
                            rank += 1;
                        }

                        return {
                            ...student,

                            rank:
                                student.average_score !==
                                null
                                    ? rank
                                    : null
                        };
                    }
                );

            const classAverage =
                db.prepare(`
                    SELECT
                        ROUND(
                            AVG(
                                tr.percentage
                            ),
                            2
                        ) AS average

                    FROM test_results tr

                    JOIN tests t
                        ON t.id = tr.test_id

                    WHERE t.class_id = ?
                `).get(
                    classId
                );

            const attendance =
                db.prepare(`
                    SELECT
                        COUNT(*) AS total,

                        SUM(
                            CASE
                                WHEN status IN (
                                    'present',
                                    'late'
                                )
                                THEN 1
                                ELSE 0
                            END
                        ) AS attended,

                        SUM(
                            CASE
                                WHEN status = 'present'
                                THEN 1
                                ELSE 0
                            END
                        ) AS present,

                        SUM(
                            CASE
                                WHEN status = 'late'
                                THEN 1
                                ELSE 0
                            END
                        ) AS late,

                        SUM(
                            CASE
                                WHEN status = 'absent'
                                THEN 1
                                ELSE 0
                            END
                        ) AS absent,

                        SUM(
                            CASE
                                WHEN status = 'excused'
                                THEN 1
                                ELSE 0
                            END
                        ) AS excused

                    FROM attendance

                    WHERE class_id = ?
                `).get(
                    classId
                );

            const attendanceTotal =
                Number(
                    attendance.total ||
                    0
                );

            const attendanceRate =
                attendanceTotal > 0
                    ? Number(
                        (
                            Number(
                                attendance.attended ||
                                0
                            ) /
                            attendanceTotal *
                            100
                        ).toFixed(2)
                    )
                    : 0;

            return res.json({
                classId,

                classAverage:
                    Number(
                        classAverage.average ||
                        0
                    ),

                attendance: {
                    total:
                        attendanceTotal,

                    attended:
                        Number(
                            attendance.attended ||
                            0
                        ),

                    present:
                        Number(
                            attendance.present ||
                            0
                        ),

                    late:
                        Number(
                            attendance.late ||
                            0
                        ),

                    absent:
                        Number(
                            attendance.absent ||
                            0
                        ),

                    excused:
                        Number(
                            attendance.excused ||
                            0
                        ),

                    rate:
                        attendanceRate
                },

                ranking:
                    ranked
            });

        } catch (error) {
            console.error(
                "Teacher performance error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not calculate class performance."
            });
        }
    }
);
/* =========================================================
   CLASS MATERIALS (PDF / LINK / LESSON NOTE)
========================================================= */

const MATERIAL_UPLOAD_DIR =
    path.join(UPLOAD_ROOT, "teacher", "materials");

if (!fs.existsSync(MATERIAL_UPLOAD_DIR)) {
    fs.mkdirSync(MATERIAL_UPLOAD_DIR, { recursive: true });
}

const materialFileUpload =
    createUploadMiddleware(MATERIAL_UPLOAD_DIR);

db.exec(`
    CREATE TABLE IF NOT EXISTS class_materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL DEFAULT 'link',
        url TEXT,
        file_name TEXT,
        content TEXT,
        status TEXT NOT NULL DEFAULT 'published',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);


/* ---------- LIST ---------- */

router.get(
    "/classes/:classId/materials",
    authenticateTeacher,
    (req, res) => {
        try {
            const classId = toPositiveInteger(req.params.classId);

            if (!classId) {
                return res.status(400).json({ message: "Invalid class ID." });
            }

            if (!teacherHasClass(req.teacher.id, classId)) {
                return res.status(403).json({
                    message: "You are not assigned to this class."
                });
            }

            const materials = db.prepare(`
                SELECT *
                FROM class_materials
                WHERE class_id = ?
                ORDER BY id DESC
            `).all(classId);

            return res.json({ classId, materials });
        } catch (error) {
            console.error("Class materials error:", error);
            return res.status(500).json({ message: "Could not load materials." });
        }
    }
);


/* ---------- ADD LINK OR LESSON NOTE ---------- */

router.post(
    "/classes/:classId/materials",
    authenticateTeacher,
    (req, res) => {
        try {
            const classId = toPositiveInteger(req.params.classId);

            if (!classId) {
                return res.status(400).json({ message: "Invalid class ID." });
            }

            if (!teacherHasClass(req.teacher.id, classId)) {
                return res.status(403).json({
                    message: "You are not assigned to this class."
                });
            }

            const body = req.body || {};
            const title = String(body.title || "").trim();
            const type = body.type === "lesson" ? "lesson" : "link";
            const url = String(body.url || "").trim();
            const content = String(body.content || "").trim();

            if (!title) {
                return res.status(400).json({ message: "Title is required." });
            }

            if (type === "link" && !/^https?:\/\//i.test(url)) {
                return res.status(400).json({
                    message: "A valid link starting with http:// or https:// is required."
                });
            }

            if (type === "lesson" && !content) {
                return res.status(400).json({
                    message: "Lesson text is required."
                });
            }

            const result = db.prepare(`
                INSERT INTO class_materials
                (class_id, teacher_id, title, description, type, url, content, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'published')
            `).run(
                classId,
                req.teacher.id,
                title,
                String(body.description || "").trim(),
                type,
                type === "link" ? url : null,
                type === "lesson" ? content : null
            );

            const material = db.prepare(
                "SELECT * FROM class_materials WHERE id = ?"
            ).get(result.lastInsertRowid);

            return res.status(201).json({
                message: "Material added successfully.",
                material
            });
        } catch (error) {
            console.error("Add class material error:", error);
            return res.status(500).json({ message: "Could not add material." });
        }
    }
);


/* ---------- UPLOAD PDF / FILE ---------- */

router.post(
    "/classes/:classId/materials/upload",
    authenticateTeacher,
    (req, res) => {
        materialFileUpload.single("file")(req, res, error => {
            if (error) {
                return handleUploadError(error, res);
            }

            try {
                const classId = toPositiveInteger(req.params.classId);

                if (!classId || !teacherHasClass(req.teacher.id, classId)) {
                    if (req.file) deletePhysicalFile(req.file.path);

                    return res.status(403).json({
                        message: "You are not assigned to this class."
                    });
                }

                if (!req.file) {
                    return res.status(400).json({ message: "A file is required." });
                }

                const title = String(
                    req.body?.title || req.file.originalname
                ).trim();

                const result = db.prepare(`
                    INSERT INTO class_materials
                    (class_id, teacher_id, title, description, type, url, file_name, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'published')
                `).run(
                    classId,
                    req.teacher.id,
                    title,
                    String(req.body?.description || "").trim(),
                    uploadedFileType(req.file),
                    getUploadedFileUrl(req, req.file.path),
                    req.file.originalname
                );

                const material = db.prepare(
                    "SELECT * FROM class_materials WHERE id = ?"
                ).get(result.lastInsertRowid);

                return res.status(201).json({
                    message: "File uploaded successfully.",
                    material
                });
            } catch (uploadError) {
                if (req.file) deletePhysicalFile(req.file.path);

                console.error("Class material upload error:", uploadError);
                return res.status(500).json({ message: "Could not save the file." });
            }
        });
    }
);


/* ---------- DELETE ---------- */

router.delete(
    "/classes/:classId/materials/:materialId",
    authenticateTeacher,
    (req, res) => {
        try {
            const classId = toPositiveInteger(req.params.classId);
            const materialId = toPositiveInteger(req.params.materialId);

            if (!classId || !materialId) {
                return res.status(400).json({ message: "Invalid ID." });
            }

            if (!teacherHasClass(req.teacher.id, classId)) {
                return res.status(403).json({
                    message: "You are not assigned to this class."
                });
            }

            const material = db.prepare(`
                SELECT * FROM class_materials
                WHERE id = ? AND class_id = ?
            `).get(materialId, classId);

            if (!material) {
                return res.status(404).json({ message: "Material not found." });
            }

            if (material.url && String(material.url).startsWith("/uploads/")) {
                deletePhysicalFile(
                    path.join(
                        UPLOAD_ROOT,
                        String(material.url).replace(/^\/uploads\//, "")
                    )
                );
            }

            db.prepare("DELETE FROM class_materials WHERE id = ?").run(materialId);

            return res.json({ message: "Material deleted successfully." });
        } catch (error) {
            console.error("Delete class material error:", error);
            return res.status(500).json({ message: "Could not delete material." });
        }
    }
);

/* =========================================================
   HEALTH
========================================================= */

router.get(
    "/health",
    authenticateTeacher,
    (
        req,
        res
    ) => {
        return res.json({
            status:
                "ok",

            system:
                "LINGUA DEUTSCH CONNECT",

            role:
                "teacher",

            teacherId:
                req.teacher.id,

            serverTime:
                getKigaliDateTime(),

            date:
                getKigaliDate()
        });
    }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
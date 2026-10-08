/* =========================================================
   LINGUA DEUTSCH CONNECT
   ONLINE ADMIN ROUTES
========================================================= */
console.log("onlineAdmin routes loaded - with delete student");
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const router = express.Router();

const db = require("../database");

const authenticateOnlineAdmin =
    require("../middleware/onlineAdminAuth");

const { JWT_SECRET } = require("../config/jwt");
/* =========================================================
   VIDEO STORAGE
========================================================= */

const uploadsRoot =
    path.join(
        __dirname,
        "..",
        "uploads"
    );

const videosDirectory =
    path.join(
        uploadsRoot,
        "videos"
    );

if (!fs.existsSync(uploadsRoot)) {
    fs.mkdirSync(
        uploadsRoot,
        {
            recursive: true
        }
    );
}

if (!fs.existsSync(videosDirectory)) {
    fs.mkdirSync(
        videosDirectory,
        {
            recursive: true
        }
    );
}


/* =========================================================
   MULTER CONFIGURATION
========================================================= */

const videoStorage =
    multer.diskStorage({

        destination: (req, file, cb) => {

            cb(
                null,
                videosDirectory
            );

        },

        filename: (req, file, cb) => {

            const originalExtension =
                path.extname(
                    file.originalname || ""
                ).toLowerCase();

            const safeExtension =
                [
                    ".mp4",
                    ".webm",
                    ".ogg",
                    ".mov",
                    ".m4v",
                    ".avi",
                    ".mkv"
                ].includes(originalExtension)
                    ? originalExtension
                    : ".mp4";

            const uniqueName =
                "lesson-" +
                Date.now() +
                "-" +
                crypto
                    .randomBytes(8)
                    .toString("hex") +
                safeExtension;

            cb(
                null,
                uniqueName
            );

        }

    });


const allowedVideoMimeTypes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "video/x-m4v",
    "video/x-msvideo",
    "video/x-matroska"
];


const uploadVideo =
    multer({

        storage:
            videoStorage,

        limits: {
            fileSize:
                1024 *
                1024 *
                1024
        },

        fileFilter:
            (req, file, cb) => {

                if (
                    allowedVideoMimeTypes.includes(
                        file.mimetype
                    )
                ) {

                    return cb(
                        null,
                        true
                    );

                }

                return cb(
                    new Error(
                        "Unsupported video format. Please upload MP4, WebM, OGG, MOV, M4V, AVI or MKV."
                    )
                );

            }

    });


/* =========================================================
   HELPERS
========================================================= */

function cleanString(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();

}


function getKigaliDateTime() {

    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "Africa/Kigali",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                second:
                    "2-digit",

                hourCycle:
                    "h23"
            }
        );

    const parts =
        formatter.formatToParts(
            new Date()
        );

    const values = {};

    for (const part of parts) {

        if (
            part.type !== "literal"
        ) {
            values[part.type] =
                part.value;
        }

    }

    return (
        `${values.year}-${values.month}-${values.day}` +
        `T${values.hour}:${values.minute}:${values.second}`
    );

}


function sendServerError(
    res,
    message,
    error = null
) {

    if (error) {

        console.error(
            message,
            error
        );

    }

    return res.status(500).json({
        success: false,
        message
    });

}


function createAdminToken(admin) {

    return jwt.sign(
        {
            id:
                Number(admin.id),

            role:
                "online_admin",

            email:
                admin.email
        },

        JWT_SECRET,

        {
            expiresIn:
                "7d"
        }
    );

}


function generateOnlineAccessCode() {

    return (
        "LDC-" +
        crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase()
    );

}


function normalizeAccessCode(value) {

    return cleanString(
        value
    ).toUpperCase();

}


function getAccessCodeStatus(
    code
) {

    if (!code) {
        return "inactive";
    }

    if (
        code.status !== "active"
    ) {
        return code.status;
    }

    if (
        code.expires_at
    ) {

        const expiry =
            new Date(
                code.expires_at
            );

        if (
            !Number.isNaN(
                expiry.getTime()
            ) &&
            expiry.getTime() <= Date.now()
        ) {
            return "expired";
        }

    }

    if (
        Number(code.used_count || 0) >=
        Number(code.max_uses || 1)
    ) {
        return "used";
    }

    return "active";

}


function getWordCount(text) {

    const cleaned =
        cleanString(text);

    if (!cleaned) {
        return 0;
    }

    return cleaned
        .split(/\s+/)
        .filter(Boolean)
        .length;

}


function mapWritingSubmission(
    submission
) {

    if (!submission) {
        return null;
    }

    return {

        id:
            Number(submission.id),

        taskId:
            Number(submission.task_id),

        studentId:
            Number(submission.student_id),

        answer:
            submission.answer || "",

        wordCount:
            Number(
                submission.word_count || 0
            ),

        submittedAt:
            submission.submitted_at,

        status:
            submission.status,

        score:
            submission.score === null ||
            submission.score === undefined
                ? null
                : Number(submission.score),

        feedback:
            submission.feedback || "",

        reviewedByAdminId:
            submission.reviewed_by_admin_id === null ||
            submission.reviewed_by_admin_id === undefined
                ? null
                : Number(
                    submission.reviewed_by_admin_id
                ),

        reviewedAt:
            submission.reviewed_at || null,

        updatedAt:
            submission.updated_at

    };

}


function mapWritingTask(
    task,
    submission = null
) {

    if (!task) {
        return null;
    }

    return {

        id:
            Number(task.id),

        title:
            task.title,

        instructions:
            task.instructions,

        level:
            task.level || null,

        courseId:
            task.course_id === null ||
            task.course_id === undefined
                ? null
                : Number(task.course_id),

        courseTitle:
            task.course_title ||
            null,

        instagramUrl:
            task.instagram_url ||
            "",

        tiktokUrl:
            task.tiktok_url ||
            "",

        youtubeUrl:
            task.youtube_url ||
            "",

        deadline:
            task.deadline ||
            null,

        status:
            task.status,

        createdByAdminId:
            task.created_by_admin_id === null ||
            task.created_by_admin_id === undefined
                ? null
                : Number(
                    task.created_by_admin_id
                ),

        createdByAdminName:
            task.created_by_admin_name ||
            null,

        createdAt:
            task.created_at,

        updatedAt:
            task.updated_at,

        submission:
            mapWritingSubmission(
                submission
            )

    };

}


function getVideoFileNameFromUrl(
    videoUrl
) {

    const value =
        cleanString(
            videoUrl
        );

    if (!value) {
        return null;
    }

    try {

        const parsed =
            new URL(
                value,
                "http://localhost"
            );

        const pathname =
            parsed.pathname;

        const basename =
            path.basename(
                pathname
            );

        if (
            !basename.startsWith(
                "lesson-"
            )
        ) {
            return null;
        }

        return basename;

    } catch (error) {

        return null;

    }

}


function deleteVideoFile(
    videoUrl
) {

    const filename =
        getVideoFileNameFromUrl(
            videoUrl
        );

    if (!filename) {
        return;
    }

    const filePath =
        path.join(
            videosDirectory,
            filename
        );

    if (
        !filePath.startsWith(
            videosDirectory
        )
    ) {
        return;
    }

    try {

        if (
            fs.existsSync(
                filePath
            )
        ) {
            fs.unlinkSync(
                filePath
            );
        }

    } catch (error) {

        console.error(
            "Could not delete video file:",
            error
        );

    }

}


/* =========================================================
   TEST
========================================================= */

router.get(
    "/test",
    (req, res) => {

        return res.json({
            success: true,
            message:
                "Online admin API is working."
        });

    }
);


/* =========================================================
   FIRST ADMIN SETUP
========================================================= */

router.post(
    "/setup",
    async (req, res) => {

        try {

            const existing =
                db.prepare(`
                    SELECT id
                    FROM online_admins
                    LIMIT 1
                `).get();

            if (existing) {

                return res.status(409).json({
                    success: false,
                    message:
                        "An online admin already exists."
                });

            }

            const name =
                cleanString(
                    req.body?.name
                );

            const email =
                cleanString(
                    req.body?.email
                ).toLowerCase();

            const password =
                cleanString(
                    req.body?.password
                );

            if (!name) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Admin name is required."
                });

            }

            if (!email) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Admin email is required."
                });

            }

            if (
                password.length < 6
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Password must contain at least 6 characters."
                });

            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            const now =
                getKigaliDateTime();

            const result =
                db.prepare(`
                    INSERT INTO online_admins (
                        name,
                        email,
                        password_hash,
                        account_status,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        'active',
                        ?,
                        ?
                    )
                `).run(
                    name,
                    email,
                    passwordHash,
                    now,
                    now
                );

            return res.status(201).json({
                success: true,
                message:
                    "Online admin created successfully.",
                adminId:
                    Number(
                        result.lastInsertRowid
                    )
            });

        } catch (error) {

            console.error(
                "Online admin setup error:",
                error
            );

            if (
                error?.code ===
                "SQLITE_CONSTRAINT_UNIQUE"
            ) {

                return res.status(409).json({
                    success: false,
                    message:
                        "That email is already registered."
                });

            }

            return sendServerError(
                res,
                "Could not create online admin."
            );

        }

    }
);


/* =========================================================
   LOGIN
========================================================= */

router.post(
    "/login",
    async (req, res) => {

        try {

            const email =
                cleanString(
                    req.body?.email
                ).toLowerCase();

            const password =
                cleanString(
                    req.body?.password
                );

            if (
                !email ||
                !password
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Email and password are required."
                });

            }

            const admin =
                db.prepare(`
                    SELECT *
                    FROM online_admins
                    WHERE email = ?
                    LIMIT 1
                `).get(email);

            if (!admin) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });

            }

            if (
                admin.account_status !==
                "active"
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "This online admin account is not active."
                });

            }

            const validPassword =
                await bcrypt.compare(
                    password,
                    admin.password_hash
                );

            if (!validPassword) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });

            }

            const now =
                getKigaliDateTime();

            db.prepare(`
                UPDATE online_admins
                SET
                    last_login_at = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(
                now,
                now,
                admin.id
            );

            const token =
                createAdminToken(
                    admin
                );

            return res.json({
                success: true,
                message:
                    "Login successful.",
                token,
                admin: {
                    id:
                        Number(admin.id),
                    name:
                        admin.name,
                    email:
                        admin.email,
                    accountStatus:
                        admin.account_status
                }
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not log in.",
                error
            );

        }

    }
);


/* =========================================================
   PROFILE
========================================================= */

router.get(
    "/profile",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const adminId =
                Number(
                    req.onlineAdminId
                );

            const admin =
                db.prepare(`
                    SELECT
                        id,
                        name,
                        email,
                        account_status,
                        created_at,
                        last_login_at,
                        updated_at
                    FROM online_admins
                    WHERE id = ?
                    LIMIT 1
                `).get(adminId);

            if (!admin) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Online admin not found."
                });

            }

            return res.json({
                success: true,
                admin: {
                    id:
                        Number(admin.id),
                    name:
                        admin.name,
                    email:
                        admin.email,
                    accountStatus:
                        admin.account_status,
                    createdAt:
                        admin.created_at,
                    lastLoginAt:
                        admin.last_login_at,
                    updatedAt:
                        admin.updated_at
                }
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load admin profile.",
                error
            );

        }

    }
);


/* =========================================================
   DASHBOARD
========================================================= */

router.get(
    "/dashboard",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const students =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_students
                `).get();

            const courses =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_courses
                `).get();

            const modules =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_modules
                `).get();

            const lessons =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_lessons
                `).get();

            const enrollments =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_enrollments
                    WHERE status = 'active'
                `).get();

            const participation =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_participation
                `).get();

            const writingTasks =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_writing_tasks
                `).get();

            const writingSubmissions =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_writing_submissions
                `).get();

            const pendingWriting =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_writing_submissions
                    WHERE status = 'submitted'
                `).get();
const activeStudents = db.prepare(`
    SELECT COUNT(*) AS count
    FROM online_students
    WHERE account_status = 'active'
`).get();

const publishedCourses = db.prepare(`
    SELECT COUNT(*) AS count
    FROM online_courses
    WHERE status = 'published'
`).get();

const learningTime = db.prepare(`
    SELECT COALESCE(SUM(duration_seconds), 0) AS total
    FROM online_learning_sessions
`).get();

const allAccessCodes = db.prepare(`
    SELECT status, expires_at, used_count, max_uses
    FROM online_access_codes
`).all();

const activeAccessCodes = allAccessCodes.filter(
    code => getAccessCodeStatus(code) === "active"
).length;
            const recentActivity =
                db.prepare(`
                    SELECT
                        s.id,
                        s.student_id,
                        s.lesson_id,
                        s.started_at,
                        s.last_activity,
                        s.ended_at,
                        s.duration_seconds,

                        st.first_name,
                        st.last_name,

                        l.title AS lesson_title

                    FROM online_learning_sessions s

                    INNER JOIN online_students st
                        ON st.id = s.student_id

                    LEFT JOIN online_lessons l
                        ON l.id = s.lesson_id

                    ORDER BY
                        s.started_at DESC

                    LIMIT 10
                `).all();

            return res.json({
                success: true,

                statistics: {

                    students:
                        Number(
                            students.count
                        ),
activeStudents: Number(activeStudents.count),
publishedCourses: Number(publishedCourses.count),
totalLearningSeconds: Number(learningTime.total),
totalAccessCodes: allAccessCodes.length,
activeAccessCodes,
                    courses:
                        Number(
                            courses.count
                        ),

                    modules:
                        Number(
                            modules.count
                        ),

                    lessons:
                        Number(
                            lessons.count
                        ),

                    enrollments:
                        Number(
                            enrollments.count
                        ),

                    participation:
                        Number(
                            participation.count
                        ),

                    writingTasks:
                        Number(
                            writingTasks.count
                        ),

                    writingSubmissions:
                        Number(
                            writingSubmissions.count
                        ),

                    pendingWriting:
                        Number(
                            pendingWriting.count
                        )

                },

                recentActivity:
                    recentActivity.map(
                        item => ({
                            ...item,

                            studentName:
                                `${item.first_name || ""} ${item.last_name || ""}`
                                    .trim(),

                            durationSeconds:
                                Number(
                                    item.duration_seconds || 0
                                )
                        })
                    )

            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load dashboard.",
                error
            );

        }

    }
);


/* =========================================================
   STUDENTS
========================================================= */

router.get(
    "/students",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const students =
                db.prepare(`
                    SELECT
                        s.id,
                        s.first_name,
                        s.last_name,
                        s.email,
                        s.phone,
                        s.profile_photo,
                        s.account_status,
                        s.created_at,
                        s.last_login_at,

                        (
                            SELECT COUNT(*)
                            FROM online_enrollments e
                            WHERE e.student_id = s.id
                        ) AS enrollment_count,

                        (
                            SELECT COALESCE(
                                SUM(ls.duration_seconds),
                                0
                            )
                            FROM online_learning_sessions ls
                            WHERE ls.student_id = s.id
                        ) AS learning_seconds

                    FROM online_students s

                    ORDER BY
                        s.created_at DESC,
                        s.id DESC
                `).all();

            return res.json({
                success: true,

                students:
                    students.map(
                        student => ({
                            ...student,

                            id:
                                Number(
                                    student.id
                                ),

                            enrollmentCount:
                                Number(
                                    student.enrollment_count
                                ),

                            learningSeconds:
                                Number(
                                    student.learning_seconds
                                ),

                            name:
                                `${student.first_name || ""} ${student.last_name || ""}`
                                    .trim()
                        })
                    )
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load online students.",
                error
            );

        }

    }
);


router.get(
    "/students/:studentId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const studentId =
                Number(
                    req.params.studentId
                );

            if (
                !Number.isInteger(studentId) ||
                studentId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid student ID."
                });

            }

            const student =
                db.prepare(`
                    SELECT
                        id,
                        first_name,
                        last_name,
                        email,
                        phone,
                        profile_photo,
                        account_status,
                        created_at,
                        last_login_at
                    FROM online_students
                    WHERE id = ?
                    LIMIT 1
                `).get(studentId);

            if (!student) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Online student not found."
                });

            }

            const enrollments =
                db.prepare(`
                    SELECT
                        e.id,
                        e.course_id,
                        e.enrolled_at,
                        e.status,
                        e.completed_at,

                        c.title AS course_title,
                        c.level AS course_level

                    FROM online_enrollments e

                    INNER JOIN online_courses c
                        ON c.id = e.course_id

                    WHERE e.student_id = ?

                    ORDER BY
                        e.enrolled_at DESC
                `).all(studentId);

            return res.json({
                success: true,

                student: {
                    ...student,

                    id:
                        Number(
                            student.id
                        ),

                    name:
                        `${student.first_name || ""} ${student.last_name || ""}`
                            .trim()
                },

                enrollments
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load online student.",
                error
            );

        }

    }
);


router.patch(
    "/students/:studentId/status",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const studentId =
                Number(
                    req.params.studentId
                );

            const status =
                cleanString(
                    req.body?.status
                ).toLowerCase();

            const allowedStatuses = [
                "active",
                "inactive",
                "suspended"
            ];

            if (
                !Number.isInteger(studentId) ||
                studentId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid student ID."
                });

            }

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid student status."
                });

            }

            const student =
                db.prepare(`
                    SELECT id
                    FROM online_students
                    WHERE id = ?
                    LIMIT 1
                `).get(studentId);

            if (!student) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Online student not found."
                });

            }

            db.prepare(`
                UPDATE online_students
                SET
                    account_status = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(
                status,
                getKigaliDateTime(),
                studentId
            );

            return res.json({
                success: true,
                message:
                    "Student status updated.",
                status
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not update student status.",
                error
            );

        }

    }
);


/* =========================================================
   ACCESS CODES
========================================================= */

router.get(
    "/access-codes",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const codes =
                db.prepare(`
                    SELECT
                        ac.id,
                        ac.code,
                        ac.course_id,
                        ac.status,
                        ac.max_uses,
                        ac.used_count,
                        ac.expires_at,
                        ac.created_by_admin_id,
                        ac.created_at,
                        ac.updated_at,

                        c.title AS course_title,
                        c.level AS course_level,

                        a.name AS created_by_admin_name

                    FROM online_access_codes ac

                    LEFT JOIN online_courses c
                        ON c.id = ac.course_id

                    LEFT JOIN online_admins a
                        ON a.id = ac.created_by_admin_id

                    ORDER BY
                        ac.created_at DESC,
                        ac.id DESC
                `).all();

            return res.json({
                success: true,

                accessCodes:
                    codes.map(
                        code => ({
                            ...code,

                            id:
                                Number(
                                    code.id
                                ),

                            courseId:
                                code.course_id === null
                                    ? null
                                    : Number(
                                        code.course_id
                                    ),

                            maxUses:
                                Number(
                                    code.max_uses
                                ),

                            usedCount:
                                Number(
                                    code.used_count
                                ),

                            calculatedStatus:
                                getAccessCodeStatus(
                                    code
                                )
                        })
                    )
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load online access codes.",
                error
            );

        }

    }
);


router.get(
    "/access-codes/:codeId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const codeId =
                Number(
                    req.params.codeId
                );

            if (
                !Number.isInteger(codeId) ||
                codeId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid access code ID."
                });

            }

            const code =
                db.prepare(`
                    SELECT
                        ac.*,
                        c.title AS course_title,
                        c.level AS course_level,
                        a.name AS created_by_admin_name

                    FROM online_access_codes ac

                    LEFT JOIN online_courses c
                        ON c.id = ac.course_id

                    LEFT JOIN online_admins a
                        ON a.id = ac.created_by_admin_id

                    WHERE ac.id = ?

                    LIMIT 1
                `).get(codeId);

            if (!code) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Access code not found."
                });

            }

            const uses =
                db.prepare(`
                    SELECT
                        u.id,
                        u.student_id,
                        u.used_at,

                        s.first_name,
                        s.last_name,
                        s.email

                    FROM online_access_code_uses u

                    INNER JOIN online_students s
                        ON s.id = u.student_id

                    WHERE u.access_code_id = ?

                    ORDER BY
                        u.used_at DESC
                `).all(codeId);

            return res.json({
                success: true,

                accessCode: {
                    ...code,

                    calculatedStatus:
                        getAccessCodeStatus(
                            code
                        )
                },

                uses:
                    uses.map(
                        item => ({
                            ...item,

                            studentName:
                                `${item.first_name || ""} ${item.last_name || ""}`
                                    .trim()
                        })
                    )
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load access code.",
                error
            );

        }

    }
);


router.post(
    "/access-codes",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            let code =
                normalizeAccessCode(
                    req.body?.code
                );

            const courseId =
                req.body?.courseId !== undefined &&
                req.body?.courseId !== null &&
                req.body?.courseId !== ""
                    ? Number(
                        req.body.courseId
                    )
                    : null;

            const maxUses =
                req.body?.maxUses !== undefined &&
                req.body?.maxUses !== ""
                    ? Number(
                        req.body.maxUses
                    )
                    : 1;

            const expiresAt =
                cleanString(
                    req.body?.expiresAt
                ) || null;

            if (!code) {

                code =
                    generateOnlineAccessCode();

            }

            if (
                code.length < 3 ||
                code.length > 100
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid access code."
                });

            }

            if (
                !Number.isInteger(
                    maxUses
                ) ||
                maxUses <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Maximum uses must be a positive whole number."
                });

            }

            if (
                courseId !== null
            ) {

                if (
                    !Number.isInteger(
                        courseId
                    ) ||
                    courseId <= 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid course ID."
                    });

                }

                const course =
                    db.prepare(`
                        SELECT id
                        FROM online_courses
                        WHERE id = ?
                        LIMIT 1
                    `).get(courseId);

                if (!course) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Course not found."
                    });

                }

            }

            if (expiresAt) {

                const expiration =
                    new Date(
                        expiresAt
                    );

                if (
                    Number.isNaN(
                        expiration.getTime()
                    )
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid expiration date."
                    });

                }

            }

            const now =
                getKigaliDateTime();

            const result =
                db.prepare(`
                    INSERT INTO online_access_codes (
                        code,
                        course_id,
                        status,
                        max_uses,
                        used_count,
                        expires_at,
                        created_by_admin_id,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        ?,
                        ?,
                        'active',
                        ?,
                        0,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                `).run(
                    code,
                    courseId,
                    maxUses,
                    expiresAt,
                    req.onlineAdminId,
                    now,
                    now
                );

            const codeId =
                Number(
                    result.lastInsertRowid
                );

            const created =
                db.prepare(`
                    SELECT
                        ac.*,
                        c.title AS course_title,
                        c.level AS course_level

                    FROM online_access_codes ac

                    LEFT JOIN online_courses c
                        ON c.id = ac.course_id

                    WHERE ac.id = ?

                    LIMIT 1
                `).get(codeId);

            return res.status(201).json({
                success: true,
                message:
                    "Online access code created successfully.",
                accessCode:
                    created
            });

        } catch (error) {

            if (
                error?.code ===
                "SQLITE_CONSTRAINT_UNIQUE"
            ) {

                return res.status(409).json({
                    success: false,
                    message:
                        "That access code already exists."
                });

            }

            return sendServerError(
                res,
                "Could not create online access code.",
                error
            );

        }

    }
);


router.patch(
    "/access-codes/:codeId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const codeId =
                Number(
                    req.params.codeId
                );

            const status =
                cleanString(
                    req.body?.status
                ).toLowerCase();

            if (
                !Number.isInteger(codeId) ||
                codeId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid access code ID."
                });

            }

            const allowedStatuses = [
                "active",
                "inactive",
                "expired"
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid access code status."
                });

            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM online_access_codes
                    WHERE id = ?
                    LIMIT 1
                `).get(codeId);

            if (!existing) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Access code not found."
                });

            }

            db.prepare(`
                UPDATE online_access_codes
                SET
                    status = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(
                status,
                getKigaliDateTime(),
                codeId
            );

            return res.json({
                success: true,
                message:
                    "Access code status updated.",
                status
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not update access code.",
                error
            );

        }

    }
);


router.delete(
    "/access-codes/:codeId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const codeId =
                Number(
                    req.params.codeId
                );

            if (
                !Number.isInteger(codeId) ||
                codeId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid access code ID."
                });

            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM online_access_codes
                    WHERE id = ?
                    LIMIT 1
                `).get(codeId);

            if (!existing) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Access code not found."
                });

            }

            db.prepare(`
                DELETE FROM online_access_codes
                WHERE id = ?
            `).run(codeId);

            return res.json({
                success: true,
                message:
                    "Access code deleted successfully."
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not delete access code.",
                error
            );

        }

    }
);


/* =========================================================
   COURSES
========================================================= */

router.get(
    "/courses",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const courses =
                db.prepare(`
                    SELECT
                        c.id,
                        c.title,
                        c.description,
                        c.level,
                        c.thumbnail,
                        c.status,
                        c.created_at,
                        c.updated_at,

                        (
                            SELECT COUNT(*)
                            FROM online_modules m
                            WHERE m.course_id = c.id
                        ) AS module_count,

                        (
                            SELECT COUNT(*)
                            FROM online_lessons l
                            INNER JOIN online_modules m
                                ON m.id = l.module_id
                            WHERE m.course_id = c.id
                        ) AS lesson_count,

                        (
                            SELECT COUNT(*)
                            FROM online_enrollments e
                            WHERE e.course_id = c.id
                            AND e.status = 'active'
                        ) AS enrollment_count

                    FROM online_courses c

                    ORDER BY
                        c.created_at DESC,
                        c.id DESC
                `).all();

            return res.json({
                success: true,

                courses:
                    courses.map(
                        course => ({
                            ...course,

                            id:
                                Number(
                                    course.id
                                ),

                            moduleCount:
                                Number(
                                    course.module_count
                                ),

                            lessonCount:
                                Number(
                                    course.lesson_count
                                ),

                            enrollmentCount:
                                Number(
                                    course.enrollment_count
                                )
                        })
                    )
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load online courses.",
                error
            );

        }

    }
);


router.get(
    "/courses/:courseId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const courseId =
                Number(
                    req.params.courseId
                );

            if (
                !Number.isInteger(courseId) ||
                courseId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid course ID."
                });

            }

            const course =
                db.prepare(`
                    SELECT *
                    FROM online_courses
                    WHERE id = ?
                    LIMIT 1
                `).get(courseId);

            if (!course) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Course not found."
                });

            }

            const modules =
                db.prepare(`
                    SELECT *
                    FROM online_modules
                    WHERE course_id = ?
                    ORDER BY
                        module_order ASC,
                        id ASC
                `).all(courseId);

            for (
                const module of modules
            ) {

                module.lessons =
                    db.prepare(`
                        SELECT *
                        FROM online_lessons
                        WHERE module_id = ?
                        ORDER BY
                            lesson_order ASC,
                            id ASC
                    `).all(
                        module.id
                    );

            }

            return res.json({
                success: true,
                course,
                modules
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load course.",
                error
            );

        }

    }
);


router.post(
    "/courses",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const title =
                cleanString(
                    req.body?.title
                );

            const description =
                cleanString(
                    req.body?.description
                );

            const level =
                cleanString(
                    req.body?.level
                ).toUpperCase();

            const thumbnail =
                cleanString(
                    req.body?.thumbnail
                ) || null;

            const status =
                cleanString(
                    req.body?.status
                ).toLowerCase() ||
                "draft";

            if (!title) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Course title is required."
                });

            }

            const allowedLevels = [
                "A1",
                "A2",
                "B1",
                "B2"
            ];

            if (
                level &&
                !allowedLevels.includes(
                    level
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid course level."
                });

            }

            const allowedStatuses = [
                "draft",
                "published",
                "archived"
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid course status."
                });

            }

            const now =
                getKigaliDateTime();

            const result =
                db.prepare(`
                    INSERT INTO online_courses (
                        title,
                        description,
                        level,
                        thumbnail,
                        status,
                        created_at,
                        updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    title,
                    description,
                    level || null,
                    thumbnail,
                    status,
                    now,
                    now
                );

            const courseId =
                Number(
                    result.lastInsertRowid
                );

            const course =
                db.prepare(`
                    SELECT *
                    FROM online_courses
                    WHERE id = ?
                    LIMIT 1
                `).get(courseId);

            return res.status(201).json({
                success: true,
                message:
                    "Course created successfully.",
                course
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not create course.",
                error
            );

        }

    }
);


router.patch(
    "/courses/:courseId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const courseId =
                Number(
                    req.params.courseId
                );

            if (
                !Number.isInteger(courseId) ||
                courseId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid course ID."
                });

            }

            const current =
                db.prepare(`
                    SELECT *
                    FROM online_courses
                    WHERE id = ?
                    LIMIT 1
                `).get(courseId);

            if (!current) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Course not found."
                });

            }

            const title =
                req.body?.title !== undefined
                    ? cleanString(
                        req.body.title
                    )
                    : current.title;

            const description =
                req.body?.description !== undefined
                    ? cleanString(
                        req.body.description
                    )
                    : current.description;

            const level =
                req.body?.level !== undefined
                    ? cleanString(
                        req.body.level
                    ).toUpperCase()
                    : current.level;

            const thumbnail =
                req.body?.thumbnail !== undefined
                    ? (
                        cleanString(
                            req.body.thumbnail
                        ) || null
                    )
                    : current.thumbnail;

            const status =
                req.body?.status !== undefined
                    ? cleanString(
                        req.body.status
                    ).toLowerCase()
                    : current.status;

            if (!title) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Course title is required."
                });

            }

            const allowedLevels = [
                "A1",
                "A2",
                "B1",
                "B2"
            ];

            if (
                level &&
                !allowedLevels.includes(
                    level
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid course level."
                });

            }

            const allowedStatuses = [
                "draft",
                "published",
                "archived"
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid course status."
                });

            }

            db.prepare(`
                UPDATE online_courses
                SET
                    title = ?,
                    description = ?,
                    level = ?,
                    thumbnail = ?,
                    status = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(
                title,
                description,
                level || null,
                thumbnail,
                status,
                getKigaliDateTime(),
                courseId
            );

            const updated =
                db.prepare(`
                    SELECT *
                    FROM online_courses
                    WHERE id = ?
                    LIMIT 1
                `).get(courseId);

            return res.json({
                success: true,
                message:
                    "Course updated successfully.",
                course:
                    updated
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not update course.",
                error
            );

        }

    }
);


router.delete(
    "/courses/:courseId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const courseId =
                Number(
                    req.params.courseId
                );

            if (
                !Number.isInteger(courseId) ||
                courseId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid course ID."
                });

            }

            const course =
                db.prepare(`
                    SELECT id
                    FROM online_courses
                    WHERE id = ?
                    LIMIT 1
                `).get(courseId);

            if (!course) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Course not found."
                });

            }

            db.prepare(`
                DELETE FROM online_courses
                WHERE id = ?
            `).run(courseId);

            return res.json({
                success: true,
                message:
                    "Course deleted successfully."
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not delete course.",
                error
            );

        }

    }
);


/* =========================================================
   MODULES
========================================================= */

router.get(
    "/courses/:courseId/modules",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const courseId =
                Number(
                    req.params.courseId
                );

            if (
                !Number.isInteger(courseId) ||
                courseId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid course ID."
                });

            }

            const modules =
                db.prepare(`
                    SELECT
                        m.*,

                        (
                            SELECT COUNT(*)
                            FROM online_lessons l
                            WHERE l.module_id = m.id
                        ) AS lesson_count

                    FROM online_modules m

                    WHERE m.course_id = ?

                    ORDER BY
                        m.module_order ASC,
                        m.id ASC
                `).all(courseId);

            return res.json({
                success: true,

                modules:
                    modules.map(
                        module => ({
                            ...module,

                            id:
                                Number(
                                    module.id
                                ),

                            courseId:
                                Number(
                                    module.course_id
                                ),

                            lessonCount:
                                Number(
                                    module.lesson_count
                                )
                        })
                    )
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load modules.",
                error
            );

        }

    }
);


router.post(
    "/courses/:courseId/modules",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const courseId =
                Number(
                    req.params.courseId
                );

            const title =
                cleanString(
                    req.body?.title
                );

            const description =
                cleanString(
                    req.body?.description
                );

            const moduleOrder =
                req.body?.moduleOrder !== undefined
                    ? Number(
                        req.body.moduleOrder
                    )
                    : 1;

            const status =
                cleanString(
                    req.body?.status
                ).toLowerCase() ||
                "published";

            if (
                !Number.isInteger(courseId) ||
                courseId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid course ID."
                });

            }

            if (!title) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Module title is required."
                });

            }

            if (
                !Number.isInteger(
                    moduleOrder
                ) ||
                moduleOrder < 1
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Module order must be a positive whole number."
                });

            }

            const course =
                db.prepare(`
                    SELECT id
                    FROM online_courses
                    WHERE id = ?
                    LIMIT 1
                `).get(courseId);

            if (!course) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Course not found."
                });

            }

            const result =
                db.prepare(`
                    INSERT INTO online_modules (
                        course_id,
                        title,
                        description,
                        module_order,
                        status,
                        created_at,
                        updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(
                    courseId,
                    title,
                    description,
                    moduleOrder,
                    status,
                    getKigaliDateTime(),
                    getKigaliDateTime()
                );

            const moduleId =
                Number(
                    result.lastInsertRowid
                );

            const created =
                db.prepare(`
                    SELECT *
                    FROM online_modules
                    WHERE id = ?
                    LIMIT 1
                `).get(moduleId);

            return res.status(201).json({
                success: true,
                message:
                    "Module created successfully.",
                module:
                    created
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not create module.",
                error
            );

        }

    }
);


router.patch(
    "/modules/:moduleId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const moduleId =
                Number(
                    req.params.moduleId
                );

            if (
                !Number.isInteger(moduleId) ||
                moduleId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid module ID."
                });

            }

            const current =
                db.prepare(`
                    SELECT *
                    FROM online_modules
                    WHERE id = ?
                    LIMIT 1
                `).get(moduleId);

            if (!current) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Module not found."
                });

            }

            const title =
                req.body?.title !== undefined
                    ? cleanString(
                        req.body.title
                    )
                    : current.title;

            const description =
                req.body?.description !== undefined
                    ? cleanString(
                        req.body.description
                    )
                    : current.description;

            const moduleOrder =
                req.body?.moduleOrder !== undefined
                    ? Number(
                        req.body.moduleOrder
                    )
                    : current.module_order;

            const status =
                req.body?.status !== undefined
                    ? cleanString(
                        req.body.status
                    ).toLowerCase()
                    : current.status;

            if (!title) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Module title is required."
                });

            }

            if (
                !Number.isInteger(
                    moduleOrder
                ) ||
                moduleOrder < 1
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Module order must be a positive whole number."
                });

            }

            db.prepare(`
                UPDATE online_modules
                SET
                    title = ?,
                    description = ?,
                    module_order = ?,
                    status = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(
                title,
                description,
                moduleOrder,
                status,
                getKigaliDateTime(),
                moduleId
            );

            const updated =
                db.prepare(`
                    SELECT *
                    FROM online_modules
                    WHERE id = ?
                    LIMIT 1
                `).get(moduleId);

            return res.json({
                success: true,
                message:
                    "Module updated successfully.",
                module:
                    updated
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not update module.",
                error
            );

        }

    }
);


router.delete(
    "/modules/:moduleId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const moduleId =
                Number(
                    req.params.moduleId
                );

            if (
                !Number.isInteger(moduleId) ||
                moduleId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid module ID."
                });

            }

            const module =
                db.prepare(`
                    SELECT id
                    FROM online_modules
                    WHERE id = ?
                    LIMIT 1
                `).get(moduleId);

            if (!module) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Module not found."
                });

            }

            db.prepare(`
                DELETE FROM online_modules
                WHERE id = ?
            `).run(moduleId);

            return res.json({
                success: true,
                message:
                    "Module deleted successfully."
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not delete module.",
                error
            );

        }

    }
);


/* =========================================================
   LESSONS
========================================================= */

router.get(
    "/modules/:moduleId/lessons",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const moduleId =
                Number(
                    req.params.moduleId
                );

            if (
                !Number.isInteger(moduleId) ||
                moduleId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid module ID."
                });

            }

            const lessons =
                db.prepare(`
                    SELECT
                        id,
                        module_id,
                        title,
                        description,
                        content,
                        video_url,
                        pdf_url,
                        duration_minutes,
                        lesson_order,
                        status,
                        created_at,
                        updated_at

                    FROM online_lessons

                    WHERE module_id = ?

                    ORDER BY
                        lesson_order ASC,
                        id ASC
                `).all(moduleId);

            return res.json({
                success: true,

                lessons:
                    lessons.map(
                        lesson => ({
                            ...lesson,

                            id:
                                Number(
                                    lesson.id
                                ),

                            moduleId:
                                Number(
                                    lesson.module_id
                                ),

                            durationMinutes:
                                Number(
                                    lesson.duration_minutes || 0
                                ),

                            lessonOrder:
                                Number(
                                    lesson.lesson_order || 0
                                ),

                            hasVideo:
                                Boolean(
                                    lesson.video_url
                                ),

                            videoUrl:
                                lesson.video_url ||
                                null,

                            pdfUrl:
                                lesson.pdf_url ||
                                null
                        })
                    )
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load lessons.",
                error
            );

        }

    }
);

/* =========================================================
   GET ALL LESSONS
========================================================= */

router.get(
    "/lessons",
    authenticateOnlineAdmin,
    (req, res) => {
        try {
            const courseId = req.query?.courseId ? Number(req.query.courseId) : null;
            const moduleId = req.query?.moduleId ? Number(req.query.moduleId) : null;

            let query = `
                SELECT
                    l.*,
                    m.title AS module_title,
                    m.course_id,
                    c.title AS course_title
                FROM online_lessons l
                INNER JOIN online_modules m ON m.id = l.module_id
                INNER JOIN online_courses c ON c.id = m.course_id
                WHERE 1 = 1
            `;
            const params = [];

            if (courseId) { query += " AND m.course_id = ?"; params.push(courseId); }
            if (moduleId) { query += " AND l.module_id = ?"; params.push(moduleId); }

            query += " ORDER BY c.id ASC, m.module_order ASC, l.lesson_order ASC, l.id ASC";

            const lessons = db.prepare(query).all(...params);

            return res.json({
                success: true,
                lessons: lessons.map(lesson => ({
                    ...lesson,
                    id: Number(lesson.id),
                    moduleId: Number(lesson.module_id),
                    courseId: Number(lesson.course_id),
                    courseTitle: lesson.course_title,
                    moduleTitle: lesson.module_title,
                    durationMinutes: Number(lesson.duration_minutes || 0),
                    lessonOrder: Number(lesson.lesson_order || 0),
                    hasVideo: Boolean(lesson.video_url),
                    videoUrl: lesson.video_url || null,
                    pdfUrl: lesson.pdf_url || null
                }))
            });
        } catch (error) {
            return sendServerError(res, "Could not load lessons.", error);
        }
    }
);


/* =========================================================
   GET SINGLE LESSON
========================================================= */

router.get(
    "/lessons/:lessonId",
    authenticateOnlineAdmin,
    (req, res) => {
        try {
            const lessonId = Number(req.params.lessonId);

            if (!Number.isInteger(lessonId) || lessonId <= 0) {
                return res.status(400).json({ success: false, message: "Invalid lesson ID." });
            }

            const lesson = db.prepare(`
                SELECT
                    l.*,
                    m.title AS module_title,
                    m.course_id,
                    c.title AS course_title
                FROM online_lessons l
                INNER JOIN online_modules m ON m.id = l.module_id
                INNER JOIN online_courses c ON c.id = m.course_id
                WHERE l.id = ?
                LIMIT 1
            `).get(lessonId);

            if (!lesson) {
                return res.status(404).json({ success: false, message: "Lesson not found." });
            }

            return res.json({
                success: true,
                lesson: {
                    ...lesson,
                    courseId: Number(lesson.course_id),
                    moduleId: Number(lesson.module_id),
                    videoUrl: lesson.video_url || null,
                    pdfUrl: lesson.pdf_url || null
                }
            });
        } catch (error) {
            return sendServerError(res, "Could not load lesson.", error);
        }
    }
);


/* =========================================================
   ACCESS CODE USES (used by the "Uses" button)
========================================================= */

router.get(
    "/access-codes/:codeId/uses",
    authenticateOnlineAdmin,
    (req, res) => {
        try {
            const codeId = Number(req.params.codeId);

            if (!Number.isInteger(codeId) || codeId <= 0) {
                return res.status(400).json({ success: false, message: "Invalid access code ID." });
            }

            const code = db.prepare(`
                SELECT id, code FROM online_access_codes WHERE id = ? LIMIT 1
            `).get(codeId);

            if (!code) {
                return res.status(404).json({ success: false, message: "Access code not found." });
            }

            const uses = db.prepare(`
                SELECT u.id, u.student_id, u.used_at,
                       s.first_name, s.last_name, s.email
                FROM online_access_code_uses u
                INNER JOIN online_students s ON s.id = u.student_id
                WHERE u.access_code_id = ?
                ORDER BY u.used_at DESC
            `).all(codeId);

            return res.json({
                success: true,
                accessCode: code.code,
                uses: uses.map(item => ({
                    ...item,
                    studentName: `${item.first_name || ""} ${item.last_name || ""}`.trim(),
                    usedAt: item.used_at
                }))
            });
        } catch (error) {
            return sendServerError(res, "Could not load access code usage.", error);
        }
    }
);
/* =========================================================
   CREATE LESSON
========================================================= */

router.post(
    "/modules/:moduleId/lessons",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const moduleId =
                Number(
                    req.params.moduleId
                );

            const title =
                cleanString(
                    req.body?.title
                );

            const description =
                cleanString(
                    req.body?.description
                );

            const content =
                cleanString(
                    req.body?.content
                );

            const videoUrl =
                cleanString(
                    req.body?.videoUrl ??
                    req.body?.video_url
                ) || null;

            const pdfUrl =
                cleanString(
                    req.body?.pdfUrl ??
                    req.body?.pdf_url
                ) || null;

            const durationMinutes =
                req.body?.durationMinutes !== undefined
                    ? Number(
                        req.body.durationMinutes
                    )
                    : (
                        req.body?.duration_minutes !== undefined
                            ? Number(
                                req.body.duration_minutes
                            )
                            : 0
                    );

            const lessonOrder =
                req.body?.lessonOrder !== undefined
                    ? Number(
                        req.body.lessonOrder
                    )
                    : (
                        req.body?.lesson_order !== undefined
                            ? Number(
                                req.body.lesson_order
                            )
                            : 1
                    );

            const status =
                cleanString(
                    req.body?.status
                ).toLowerCase() ||
                "published";

            if (
                !Number.isInteger(
                    moduleId
                ) ||
                moduleId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid module ID."
                });

            }

            if (!title) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Lesson title is required."
                });

            }

            if (
                !Number.isFinite(
                    durationMinutes
                ) ||
                durationMinutes < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid lesson duration."
                });

            }

            if (
                !Number.isInteger(
                    lessonOrder
                ) ||
                lessonOrder < 1
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Lesson order must be a positive whole number."
                });

            }

            const module =
                db.prepare(`
                    SELECT id
                    FROM online_modules
                    WHERE id = ?
                    LIMIT 1
                `).get(moduleId);

            if (!module) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Module not found."
                });

            }

            const now =
                getKigaliDateTime();

            const result =
                db.prepare(`
                    INSERT INTO online_lessons (
                        module_id,
                        title,
                        description,
                        content,
                        video_url,
                        pdf_url,
                        duration_minutes,
                        lesson_order,
                        status,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        ?
                    )
                `).run(
                    moduleId,
                    title,
                    description,
                    content,
                    videoUrl,
                    pdfUrl,
                    durationMinutes,
                    lessonOrder,
                    status,
                    now,
                    now
                );

            const lessonId =
                Number(
                    result.lastInsertRowid
                );

            const lesson =
                db.prepare(`
                    SELECT *
                    FROM online_lessons
                    WHERE id = ?
                    LIMIT 1
                `).get(lessonId);

            return res.status(201).json({
                success: true,
                message:
                    "Lesson created successfully.",
                lesson
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not create lesson.",
                error
            );

        }

    }
);


/* =========================================================
   UPDATE LESSON
========================================================= */

router.patch(
    "/lessons/:lessonId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const lessonId =
                Number(
                    req.params.lessonId
                );

            if (
                !Number.isInteger(
                    lessonId
                ) ||
                lessonId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid lesson ID."
                });

            }

            const current =
                db.prepare(`
                    SELECT *
                    FROM online_lessons
                    WHERE id = ?
                    LIMIT 1
                `).get(lessonId);

            if (!current) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Lesson not found."
                });

            }

            const title =
                req.body?.title !== undefined
                    ? cleanString(
                        req.body.title
                    )
                    : current.title;

            const description =
                req.body?.description !== undefined
                    ? cleanString(
                        req.body.description
                    )
                    : current.description;

            const content =
                req.body?.content !== undefined
                    ? cleanString(
                        req.body.content
                    )
                    : current.content;

            const videoUrl =
                req.body?.videoUrl !== undefined ||
                req.body?.video_url !== undefined
                    ? (
                        cleanString(
                            req.body?.videoUrl ??
                            req.body?.video_url
                        ) || null
                    )
                    : current.video_url;

            const pdfUrl =
                req.body?.pdfUrl !== undefined ||
                req.body?.pdf_url !== undefined
                    ? (
                        cleanString(
                            req.body?.pdfUrl ??
                            req.body?.pdf_url
                        ) || null
                    )
                    : current.pdf_url;

            const durationMinutes =
                req.body?.durationMinutes !== undefined
                    ? Number(
                        req.body.durationMinutes
                    )
                    : (
                        req.body?.duration_minutes !== undefined
                            ? Number(
                                req.body.duration_minutes
                            )
                            : Number(
                                current.duration_minutes || 0
                            )
                    );

            const lessonOrder =
                req.body?.lessonOrder !== undefined
                    ? Number(
                        req.body.lessonOrder
                    )
                    : (
                        req.body?.lesson_order !== undefined
                            ? Number(
                                req.body.lesson_order
                            )
                            : Number(
                                current.lesson_order
                            )
                    );

            const status =
                req.body?.status !== undefined
                    ? cleanString(
                        req.body.status
                    ).toLowerCase()
                    : current.status;

            if (!title) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Lesson title is required."
                });

            }

            if (
                !Number.isFinite(
                    durationMinutes
                ) ||
                durationMinutes < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid lesson duration."
                });

            }

            if (
                !Number.isInteger(
                    lessonOrder
                ) ||
                lessonOrder < 1
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Lesson order must be a positive whole number."
                });

            }

            db.prepare(`
                UPDATE online_lessons
                SET
                    title = ?,
                    description = ?,
                    content = ?,
                    video_url = ?,
                    pdf_url = ?,
                    duration_minutes = ?,
                    lesson_order = ?,
                    status = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(
                title,
                description,
                content,
                videoUrl,
                pdfUrl,
                durationMinutes,
                lessonOrder,
                status,
                getKigaliDateTime(),
                lessonId
            );

            const updated =
                db.prepare(`
                    SELECT *
                    FROM online_lessons
                    WHERE id = ?
                    LIMIT 1
                `).get(lessonId);

            return res.json({
                success: true,
                message:
                    "Lesson updated successfully.",
                lesson:
                    updated
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not update lesson.",
                error
            );

        }

    }
);


/* =========================================================
   DELETE LESSON
========================================================= */

router.delete(
    "/lessons/:lessonId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const lessonId =
                Number(
                    req.params.lessonId
                );

            if (
                !Number.isInteger(
                    lessonId
                ) ||
                lessonId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid lesson ID."
                });

            }

            const lesson =
                db.prepare(`
                    SELECT
                        id,
                        title,
                        video_url
                    FROM online_lessons
                    WHERE id = ?
                    LIMIT 1
                `).get(lessonId);

            if (!lesson) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Lesson not found."
                });

            }

            deleteVideoFile(
                lesson.video_url
            );

            db.prepare(`
                DELETE FROM online_lessons
                WHERE id = ?
            `).run(lessonId);

            return res.json({
                success: true,
                message:
                    "Lesson deleted successfully."
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not delete lesson.",
                error
            );

        }

    }
);


/* =========================================================
   REAL VIDEO UPLOAD
========================================================= */

router.post(
    "/lessons/:lessonId/video",
    authenticateOnlineAdmin,
    (req, res) => {

        uploadVideo.single(
            "video"
        )(req, res, error => {

            try {

                if (error) {

                    if (
                        error instanceof
                        multer.MulterError
                    ) {

                        if (
                            error.code ===
                            "LIMIT_FILE_SIZE"
                        ) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    "Video is too large. Maximum size is 1 GB."
                            });

                        }

                        return res.status(400).json({
                            success: false,
                            message:
                                error.message
                        });

                    }

                    return res.status(400).json({
                        success: false,
                        message:
                            error.message ||
                            "Video upload failed."
                    });

                }

                const lessonId =
                    Number(
                        req.params.lessonId
                    );

                if (
                    !Number.isInteger(
                        lessonId
                    ) ||
                    lessonId <= 0
                ) {

                    if (
                        req.file?.path
                    ) {

                        fs.unlinkSync(
                            req.file.path
                        );

                    }

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid lesson ID."
                    });

                }

                if (!req.file) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Please select a video file."
                    });

                }

                const lesson =
                    db.prepare(`
                        SELECT
                            id,
                            title,
                            video_url
                        FROM online_lessons
                        WHERE id = ?
                        LIMIT 1
                    `).get(lessonId);

                if (!lesson) {

                    fs.unlinkSync(
                        req.file.path
                    );

                    return res.status(404).json({
                        success: false,
                        message:
                            "Lesson not found."
                    });

                }

                const videoUrl =
                    `/api/online-admin/videos/${encodeURIComponent(
                        req.file.filename
                    )}`;

                deleteVideoFile(
                    lesson.video_url
                );

                db.prepare(`
                    UPDATE online_lessons
                    SET
                        video_url = ?,
                        updated_at = ?
                    WHERE id = ?
                `).run(
                    videoUrl,
                    getKigaliDateTime(),
                    lessonId
                );

                const updated =
                    db.prepare(`
                        SELECT *
                        FROM online_lessons
                        WHERE id = ?
                        LIMIT 1
                    `).get(lessonId);

                return res.json({
                    success: true,

                    message:
                        "Video uploaded successfully.",

                    video: {
                        fileName:
                            req.file.originalname,

                        storedFileName:
                            req.file.filename,

                        mimeType:
                            req.file.mimetype,

                        size:
                            req.file.size,

                        url:
                            videoUrl
                    },

                    lesson:
                        updated
                });

            } catch (uploadError) {

                if (
                    req.file?.path
                ) {

                    try {

                        if (
                            fs.existsSync(
                                req.file.path
                            )
                        ) {

                            fs.unlinkSync(
                                req.file.path
                            );

                        }

                    } catch (cleanupError) {

                        console.error(
                            "Video cleanup error:",
                            cleanupError
                        );

                    }

                }

                return sendServerError(
                    res,
                    "Could not upload lesson video.",
                    uploadError
                );

            }

        });

    }
);


/* =========================================================
   SERVE VIDEO FILE
========================================================= */

router.get(
    "/videos/:filename",
    (req, res) => {

        try {

            const filename =
                path.basename(
                    cleanString(
                        req.params.filename
                    )
                );

            if (
                !filename ||
                !filename.startsWith(
                    "lesson-"
                )
            ) {

                return res.status(400).send(
                    "Invalid video."
                );

            }

            const filePath =
                path.resolve(
                    videosDirectory,
                    filename
                );

            const rootPath =
                path.resolve(
                    videosDirectory
                );

            if (
                !filePath.startsWith(
                    rootPath +
                    path.sep
                )
            ) {

                return res.status(403).send(
                    "Forbidden."
                );

            }

            if (
                !fs.existsSync(
                    filePath
                )
            ) {

                return res.status(404).send(
                    "Video not found."
                );

            }

            return res.sendFile(
                filePath
            );

        } catch (error) {

            console.error(
                "Serve video error:",
                error
            );

            return res.status(500).send(
                "Could not load video."
            );

        }

    }
);


/* =========================================================
   DELETE LESSON VIDEO
========================================================= */

router.delete(
    "/lessons/:lessonId/video",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const lessonId =
                Number(
                    req.params.lessonId
                );

            if (
                !Number.isInteger(
                    lessonId
                ) ||
                lessonId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid lesson ID."
                });

            }

            const lesson =
                db.prepare(`
                    SELECT
                        id,
                        video_url
                    FROM online_lessons
                    WHERE id = ?
                    LIMIT 1
                `).get(lessonId);

            if (!lesson) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Lesson not found."
                });

            }

            deleteVideoFile(
                lesson.video_url
            );

            db.prepare(`
                UPDATE online_lessons
                SET
                    video_url = NULL,
                    updated_at = ?
                WHERE id = ?
            `).run(
                getKigaliDateTime(),
                lessonId
            );

            return res.json({
                success: true,
                message:
                    "Lesson video removed successfully."
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not remove lesson video.",
                error
            );

        }

    }
);


/* =========================================================
   PARTICIPATION CODES
========================================================= */

router.get(
    "/participation-codes",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const codes =
                db.prepare(`
                    SELECT
                        pc.id,
                        pc.code,
                        pc.course_id,
                        pc.expires_at,
                        pc.status,
                        pc.created_at,
                        c.title AS course_title,
                        c.level AS course_level,

                        (
                            SELECT COUNT(*)
                            FROM online_participation p
                            WHERE p.code_id = pc.id
                        ) AS submission_count

                    FROM online_participation_codes pc

                    LEFT JOIN online_courses c
                        ON c.id = pc.course_id

                    ORDER BY
                        pc.created_at DESC,
                        pc.id DESC
                `).all();

            return res.json({
                success: true,

                participationCodes:
                    codes.map(item => ({
                        ...item,

                        submissionCount:
                            Number(
                                item.submission_count
                            )
                    }))
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load participation codes.",
                error
            );

        }

    }
);


router.post(
    "/participation-codes",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            let code =
                cleanString(
                    req.body?.code
                ).toUpperCase();

            const courseId =
                req.body?.courseId !== undefined &&
                req.body?.courseId !== null &&
                req.body?.courseId !== ""
                    ? Number(
                        req.body.courseId
                    )
                    : null;

            const expiresAt =
                cleanString(
                    req.body?.expiresAt
                ) || null;

            if (!code) {

                code =
                    "LDC-" +
                    Math.random()
                        .toString(36)
                        .substring(2, 8)
                        .toUpperCase();

            }

            if (
                code.length < 3 ||
                code.length > 100
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid participation code."
                });

            }

            if (
                courseId !== null
            ) {

                if (
                    !Number.isInteger(
                        courseId
                    ) ||
                    courseId <= 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid course ID."
                    });

                }

                const course =
                    db.prepare(`
                        SELECT id
                        FROM online_courses
                        WHERE id = ?
                        LIMIT 1
                    `).get(courseId);

                if (!course) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Course not found."
                    });

                }

            }

            if (expiresAt) {

                const expiration =
                    new Date(
                        expiresAt
                    );

                if (
                    Number.isNaN(
                        expiration.getTime()
                    )
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid expiration date."
                    });

                }

            }

            const now =
                getKigaliDateTime();

            const result =
                db.prepare(`
                    INSERT INTO online_participation_codes (
                        code,
                        course_id,
                        expires_at,
                        status,
                        created_at
                    )
                    VALUES (?, ?, ?, 'active', ?)
                `).run(
                    code,
                    courseId,
                    expiresAt,
                    now
                );

            const codeId =
                Number(
                    result.lastInsertRowid
                );

            const created =
                db.prepare(`
                    SELECT
                        pc.id,
                        pc.code,
                        pc.course_id,
                        pc.expires_at,
                        pc.status,
                        pc.created_at,
                        c.title AS course_title,
                        c.level AS course_level

                    FROM online_participation_codes pc

                    LEFT JOIN online_courses c
                        ON c.id = pc.course_id

                    WHERE pc.id = ?

                    LIMIT 1
                `).get(codeId);

            return res.status(201).json({
                success: true,
                message:
                    "Participation code created successfully.",
                participationCode:
                    created
            });

        } catch (error) {

            if (
                error?.code ===
                "SQLITE_CONSTRAINT_UNIQUE"
            ) {

                return res.status(409).json({
                    success: false,
                    message:
                        "That participation code already exists."
                });

            }

            return sendServerError(
                res,
                "Could not create participation code.",
                error
            );

        }

    }
);


router.patch(
    "/participation-codes/:codeId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const codeId =
                Number(
                    req.params.codeId
                );

            const status =
                cleanString(
                    req.body?.status
                ).toLowerCase();

            if (
                !Number.isInteger(codeId) ||
                codeId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid participation code ID."
                });

            }

            const allowedStatuses = [
                "active",
                "inactive",
                "expired"
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid participation code status."
                });

            }

            const code =
                db.prepare(`
                    SELECT id
                    FROM online_participation_codes
                    WHERE id = ?
                    LIMIT 1
                `).get(codeId);

            if (!code) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Participation code not found."
                });

            }

            db.prepare(`
                UPDATE online_participation_codes
                SET status = ?
                WHERE id = ?
            `).run(
                status,
                codeId
            );

            return res.json({
                success: true,
                message:
                    "Participation code status updated.",
                status
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not update participation code.",
                error
            );

        }

    }
);


router.get(
    "/participation",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const participation =
                db.prepare(`
                    SELECT
                        p.id,
                        p.student_id,
                        p.code_id,
                        p.course_id,
                        p.submitted_at,

                        s.first_name,
                        s.last_name,
                        s.email,

                        pc.code,

                        c.title AS course_title,
                        c.level AS course_level

                    FROM online_participation p

                    INNER JOIN online_students s
                        ON s.id = p.student_id

                    INNER JOIN online_participation_codes pc
                        ON pc.id = p.code_id

                    LEFT JOIN online_courses c
                        ON c.id = p.course_id

                    ORDER BY
                        p.submitted_at DESC
                `).all();

            return res.json({
                success: true,
                participation
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load participation records.",
                error
            );

        }

    }
);


/* =========================================================
   ENROLLMENTS
========================================================= */

router.post(
    "/enrollments",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const studentId =
                Number(
                    req.body?.studentId
                );

            const courseId =
                Number(
                    req.body?.courseId
                );

            if (
                !Number.isInteger(
                    studentId
                ) ||
                studentId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid student ID."
                });

            }

            if (
                !Number.isInteger(
                    courseId
                ) ||
                courseId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid course ID."
                });

            }

            const student =
                db.prepare(`
                    SELECT id
                    FROM online_students
                    WHERE id = ?
                    LIMIT 1
                `).get(studentId);

            if (!student) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Online student not found."
                });

            }

            const course =
                db.prepare(`
                    SELECT id
                    FROM online_courses
                    WHERE id = ?
                    LIMIT 1
                `).get(courseId);

            if (!course) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Course not found."
                });

            }

            const existing =
                db.prepare(`
                    SELECT id, status
                    FROM online_enrollments
                    WHERE student_id = ?
                    AND course_id = ?
                    LIMIT 1
                `).get(
                    studentId,
                    courseId
                );

            if (existing) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Student is already enrolled in this course.",
                    enrollment:
                        existing
                });

            }

            const enrolledAt =
                getKigaliDateTime();

            const result =
                db.prepare(`
                    INSERT INTO online_enrollments (
                        student_id,
                        course_id,
                        enrolled_at,
                        status
                    )
                    VALUES (?, ?, ?, 'active')
                `).run(
                    studentId,
                    courseId,
                    enrolledAt
                );

            const enrollmentId =
                Number(
                    result.lastInsertRowid
                );

            const enrollment =
                db.prepare(`
                    SELECT
                        e.id,
                        e.student_id,
                        e.course_id,
                        e.enrolled_at,
                        e.status,
                        e.completed_at,

                        c.title AS course_title,

                        s.first_name,
                        s.last_name,
                        s.email

                    FROM online_enrollments e

                    INNER JOIN online_courses c
                        ON c.id = e.course_id

                    INNER JOIN online_students s
                        ON s.id = e.student_id

                    WHERE e.id = ?

                    LIMIT 1
                `).get(enrollmentId);

            return res.status(201).json({
                success: true,
                message:
                    "Student enrolled successfully.",
                enrollment
            });

        } catch (error) {

            if (
                error?.code ===
                "SQLITE_CONSTRAINT_UNIQUE"
            ) {

                return res.status(409).json({
                    success: false,
                    message:
                        "Student is already enrolled in this course."
                });

            }

            return sendServerError(
                res,
                "Could not create enrollment.",
                error
            );

        }

    }
);


router.get(
    "/enrollments",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const enrollments =
                db.prepare(`
                    SELECT
                        e.id,
                        e.student_id,
                        e.course_id,
                        e.enrolled_at,
                        e.status,
                        e.completed_at,

                        s.first_name,
                        s.last_name,
                        s.email,

                        c.title AS course_title,
                        c.level AS course_level

                    FROM online_enrollments e

                    INNER JOIN online_students s
                        ON s.id = e.student_id

                    INNER JOIN online_courses c
                        ON c.id = e.course_id

                    ORDER BY
                        e.enrolled_at DESC
                `).all();

            return res.json({
                success: true,
                enrollments
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load enrollments.",
                error
            );

        }

    }
);


router.delete(
    "/enrollments/:enrollmentId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const enrollmentId =
                Number(
                    req.params.enrollmentId
                );

            if (
                !Number.isInteger(
                    enrollmentId
                ) ||
                enrollmentId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid enrollment ID."
                });

            }

            const enrollment =
                db.prepare(`
                    SELECT id
                    FROM online_enrollments
                    WHERE id = ?
                    LIMIT 1
                `).get(enrollmentId);

            if (!enrollment) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Enrollment not found."
                });

            }

            db.prepare(`
                DELETE FROM online_enrollments
                WHERE id = ?
            `).run(enrollmentId);

            return res.json({
                success: true,
                message:
                    "Enrollment removed successfully."
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not remove enrollment.",
                error
            );

        }

    }
);


/* =========================================================
   LEARNING ACTIVITY
========================================================= */

router.get(
    "/learning-activity",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const activity =
                db.prepare(`
                    SELECT
                        s.id,
                        s.student_id,
                        s.lesson_id,
                        s.started_at,
                        s.last_activity,
                        s.ended_at,
                        s.duration_seconds,

                        st.first_name,
                        st.last_name,
                        st.email,

                        l.title AS lesson_title,
                        m.title AS module_title,

                        c.id AS course_id,
                        c.title AS course_title

                    FROM online_learning_sessions s

                    INNER JOIN online_students st
                        ON st.id = s.student_id

                    LEFT JOIN online_lessons l
                        ON l.id = s.lesson_id

                    LEFT JOIN online_modules m
                        ON m.id = l.module_id

                    LEFT JOIN online_courses c
                        ON c.id = m.course_id

                    ORDER BY
                        s.started_at DESC

                    LIMIT 500
                `).all();

            return res.json({
                success: true,

                activity:
                    activity.map(
                        item => ({
                            ...item,

                            studentName:
                                `${item.first_name || ""} ${item.last_name || ""}`
                                    .trim(),

                            durationSeconds:
                                Number(
                                    item.duration_seconds || 0
                                )
                        })
                    )
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load learning activity.",
                error
            );

        }

    }
);


/* =========================================================
   GET STUDENT PROGRESS
========================================================= */

router.get(
    "/students/:studentId/progress",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const studentId =
                Number(
                    req.params.studentId
                );

            if (
                !Number.isInteger(
                    studentId
                ) ||
                studentId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid student ID."
                });

            }

            const student =
                db.prepare(`
                    SELECT
                        id,
                        first_name,
                        last_name,
                        email
                    FROM online_students
                    WHERE id = ?
                    LIMIT 1
                `).get(studentId);

            if (!student) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Online student not found."
                });

            }

            const progress =
                db.prepare(`
                    SELECT
                        p.id,
                        p.lesson_id,
                        p.video_seconds,
                        p.progress,
                        p.completed,
                        p.last_position,
                        p.updated_at,

                        l.title AS lesson_title,
                        l.duration_minutes,

                        m.id AS module_id,
                        m.title AS module_title,

                        c.id AS course_id,
                        c.title AS course_title,
                        c.level AS course_level

                    FROM online_progress p

                    INNER JOIN online_lessons l
                        ON l.id = p.lesson_id

                    INNER JOIN online_modules m
                        ON m.id = l.module_id

                    INNER JOIN online_courses c
                        ON c.id = m.course_id

                    WHERE p.student_id = ?

                    ORDER BY
                        c.id ASC,
                        m.module_order ASC,
                        l.lesson_order ASC
                `).all(studentId);

            return res.json({
                success: true,

                student: {
                    ...student,

                    name:
                        `${student.first_name || ""} ${student.last_name || ""}`
                            .trim()
                },

                progress
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load student progress.",
                error
            );

        }

    }
);


/* =========================================================
   WRITING SYSTEM
========================================================= */


/* =========================================================
   GET ALL WRITING TASKS
========================================================= */

router.get(
    "/writing",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const level =
                cleanString(
                    req.query?.level
                );

            const status =
                cleanString(
                    req.query?.status
                ).toLowerCase();

            const courseId =
                req.query?.courseId !== undefined &&
                req.query?.courseId !== ""
                    ? Number(
                        req.query.courseId
                    )
                    : null;

            const studentId =
                req.query?.studentId !== undefined &&
                req.query?.studentId !== ""
                    ? Number(
                        req.query.studentId
                    )
                    : null;

            let query = `
                SELECT
                    wt.id,
                    wt.title,
                    wt.instructions,
                    wt.level,
                    wt.course_id,
                    wt.instagram_url,
                    wt.tiktok_url,
                    wt.youtube_url,
                    wt.deadline,
                    wt.status,
                    wt.created_by_admin_id,
                    wt.created_at,
                    wt.updated_at,

                    c.title AS course_title,

                    a.name AS created_by_admin_name,

                    (
                        SELECT COUNT(*)
                        FROM online_writing_submissions ws
                        WHERE ws.task_id = wt.id
                    ) AS submission_count,

                    (
                        SELECT COUNT(*)
                        FROM online_writing_submissions ws
                        WHERE ws.task_id = wt.id
                        AND ws.status = 'submitted'
                    ) AS pending_count,

                    (
                        SELECT COUNT(*)
                        FROM online_writing_submissions ws
                        WHERE ws.task_id = wt.id
                        AND ws.status = 'reviewed'
                    ) AS reviewed_count

                FROM online_writing_tasks wt

                LEFT JOIN online_courses c
                    ON c.id = wt.course_id

                LEFT JOIN online_admins a
                    ON a.id = wt.created_by_admin_id

                WHERE 1 = 1
            `;

            const params = [];

            if (level) {

                query += `
                    AND wt.level = ?
                `;

                params.push(
                    level
                );

            }

            if (status) {

                query += `
                    AND wt.status = ?
                `;

                params.push(
                    status
                );

            }

            if (
                courseId !== null
            ) {

                if (
                    !Number.isInteger(
                        courseId
                    ) ||
                    courseId <= 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid course ID."
                    });

                }

                query += `
                    AND wt.course_id = ?
                `;

                params.push(
                    courseId
                );

            }

            query += `
                ORDER BY
                    wt.created_at DESC,
                    wt.id DESC
            `;

            const tasks =
                db.prepare(
                    query
                ).all(
                    ...params
                );

            let filteredTasks =
                tasks;

            if (
                studentId !== null
            ) {

                if (
                    !Number.isInteger(
                        studentId
                    ) ||
                    studentId <= 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid student ID."
                    });

                }

                const student =
                    db.prepare(`
                        SELECT id
                        FROM online_students
                        WHERE id = ?
                        LIMIT 1
                    `).get(studentId);

                if (!student) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Online student not found."
                    });

                }

                filteredTasks =
                    tasks.map(
                        task => {

                            const submission =
                                db.prepare(`
                                    SELECT *
                                    FROM online_writing_submissions
                                    WHERE task_id = ?
                                    AND student_id = ?
                                    LIMIT 1
                                `).get(
                                    task.id,
                                    studentId
                                );

                            return {
                                ...mapWritingTask(
                                    task,
                                    submission
                                ),

                                submissionCount:
                                    Number(
                                        task.submission_count
                                    ),

                                pendingCount:
                                    Number(
                                        task.pending_count
                                    ),

                                reviewedCount:
                                    Number(
                                        task.reviewed_count
                                    )
                            };

                        }
                    );

            } else {

                filteredTasks =
                    tasks.map(
                        task => ({
                            ...mapWritingTask(
                                task
                            ),

                            submissionCount:
                                Number(
                                    task.submission_count
                                ),

                            pendingCount:
                                Number(
                                    task.pending_count
                                ),

                            reviewedCount:
                                Number(
                                    task.reviewed_count
                                )
                        })
                    );

            }

            return res.json({
                success: true,
                writingTasks:
                    filteredTasks
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load writing tasks.",
                error
            );

        }

    }
);


/* =========================================================
   GET SINGLE WRITING TASK
========================================================= */

router.get(
    "/writing/:taskId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const taskId =
                Number(
                    req.params.taskId
                );

            if (
                !Number.isInteger(
                    taskId
                ) ||
                taskId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid writing task ID."
                });

            }

            const task =
                db.prepare(`
                    SELECT
                        wt.*,

                        c.title AS course_title,

                        a.name AS created_by_admin_name

                    FROM online_writing_tasks wt

                    LEFT JOIN online_courses c
                        ON c.id = wt.course_id

                    LEFT JOIN online_admins a
                        ON a.id = wt.created_by_admin_id

                    WHERE wt.id = ?

                    LIMIT 1
                `).get(taskId);

            if (!task) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Writing task not found."
                });

            }

            const submissions =
                db.prepare(`
                    SELECT
                        ws.*,

                        s.first_name,
                        s.last_name,
                        s.email,

                        a.name AS reviewed_by_admin_name

                    FROM online_writing_submissions ws

                    INNER JOIN online_students s
                        ON s.id = ws.student_id

                    LEFT JOIN online_admins a
                        ON a.id = ws.reviewed_by_admin_id

                    WHERE ws.task_id = ?

                    ORDER BY
                        ws.submitted_at DESC,
                        ws.id DESC
                `).all(taskId);

            return res.json({
                success: true,

                task:
                    mapWritingTask(
                        task
                    ),

                submissions:
                    submissions.map(
                        item => ({
                            ...mapWritingSubmission(
                                item
                            ),

                            student: {
                                id:
                                    Number(
                                        item.student_id
                                    ),

                                firstName:
                                    item.first_name,

                                lastName:
                                    item.last_name,

                                name:
                                    `${item.first_name || ""} ${item.last_name || ""}`
                                        .trim(),

                                email:
                                    item.email
                            },

                            reviewedByAdminName:
                                item.reviewed_by_admin_name ||
                                null
                        })
                    )
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load writing task.",
                error
            );

        }

    }
);


/* =========================================================
   CREATE WRITING TASK
========================================================= */

router.post(
    "/writing",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const title =
                cleanString(
                    req.body?.title
                );

            const instructions =
                cleanString(
                    req.body?.instructions
                );

            const level =
                cleanString(
                    req.body?.level
                ).toUpperCase();

            const instagramUrl =
                cleanString(
                    req.body?.instagramUrl ??
                    req.body?.instagram_url
                );

            const tiktokUrl =
                cleanString(
                    req.body?.tiktokUrl ??
                    req.body?.tiktok_url
                );

            const youtubeUrl =
                cleanString(
                    req.body?.youtubeUrl ??
                    req.body?.youtube_url
                );

            const deadline =
                cleanString(
                    req.body?.deadline
                ) || null;

            const status =
                cleanString(
                    req.body?.status
                ).toLowerCase() ||
                "draft";

            const courseId =
                req.body?.courseId !== undefined &&
                req.body?.courseId !== null &&
                req.body?.courseId !== ""
                    ? Number(
                        req.body.courseId
                    )
                    : null;

            if (!title) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Writing task title is required."
                });

            }

            if (!instructions) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Writing instructions are required."
                });

            }

            const allowedLevels = [
                "A1",
                "A2",
                "B1",
                "B2"
            ];

            if (
                level &&
                !allowedLevels.includes(
                    level
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid writing task level."
                });

            }

            const allowedStatuses = [
                "draft",
                "published",
                "archived"
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid writing task status."
                });

            }

            if (
                courseId !== null
            ) {

                if (
                    !Number.isInteger(
                        courseId
                    ) ||
                    courseId <= 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid course ID."
                    });

                }

                const course =
                    db.prepare(`
                        SELECT id
                        FROM online_courses
                        WHERE id = ?
                        LIMIT 1
                    `).get(courseId);

                if (!course) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Course not found."
                    });

                }

            }

            if (deadline) {

                const deadlineDate =
                    new Date(
                        deadline
                    );

                if (
                    Number.isNaN(
                        deadlineDate.getTime()
                    )
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid writing task deadline."
                    });

                }

            }

            const now =
                getKigaliDateTime();

            const result =
                db.prepare(`
                    INSERT INTO online_writing_tasks (
                        title,
                        instructions,
                        level,
                        course_id,
                        instagram_url,
                        tiktok_url,
                        youtube_url,
                        deadline,
                        status,
                        created_by_admin_id,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )
                `).run(
                    title,
                    instructions,
                    level || null,
                    courseId,
                    instagramUrl || null,
                    tiktokUrl || null,
                    youtubeUrl || null,
                    deadline,
                    status,
                    req.onlineAdminId,
                    now,
                    now
                );

            const taskId =
                Number(
                    result.lastInsertRowid
                );

            const task =
                db.prepare(`
                    SELECT
                        wt.*,
                        c.title AS course_title,
                        a.name AS created_by_admin_name

                    FROM online_writing_tasks wt

                    LEFT JOIN online_courses c
                        ON c.id = wt.course_id

                    LEFT JOIN online_admins a
                        ON a.id = wt.created_by_admin_id

                    WHERE wt.id = ?

                    LIMIT 1
                `).get(taskId);

            return res.status(201).json({
                success: true,
                message:
                    "Writing task created successfully.",
                task:
                    mapWritingTask(
                        task
                    )
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not create writing task.",
                error
            );

        }

    }
);


/* =========================================================
   UPDATE WRITING TASK
========================================================= */

router.patch(
    "/writing/:taskId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const taskId =
                Number(
                    req.params.taskId
                );

            if (
                !Number.isInteger(
                    taskId
                ) ||
                taskId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid writing task ID."
                });

            }

            const current =
                db.prepare(`
                    SELECT *
                    FROM online_writing_tasks
                    WHERE id = ?
                    LIMIT 1
                `).get(taskId);

            if (!current) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Writing task not found."
                });

            }

            const title =
                req.body?.title !== undefined
                    ? cleanString(
                        req.body.title
                    )
                    : current.title;

            const instructions =
                req.body?.instructions !== undefined
                    ? cleanString(
                        req.body.instructions
                    )
                    : current.instructions;

            const level =
                req.body?.level !== undefined
                    ? cleanString(
                        req.body.level
                    ).toUpperCase()
                    : current.level;

            const instagramUrl =
                req.body?.instagramUrl !== undefined ||
                req.body?.instagram_url !== undefined
                    ? cleanString(
                        req.body?.instagramUrl ??
                        req.body?.instagram_url
                    )
                    : current.instagram_url;

            const tiktokUrl =
                req.body?.tiktokUrl !== undefined ||
                req.body?.tiktok_url !== undefined
                    ? cleanString(
                        req.body?.tiktokUrl ??
                        req.body?.tiktok_url
                    )
                    : current.tiktok_url;

            const youtubeUrl =
                req.body?.youtubeUrl !== undefined ||
                req.body?.youtube_url !== undefined
                    ? cleanString(
                        req.body?.youtubeUrl ??
                        req.body?.youtube_url
                    )
                    : current.youtube_url;

            const deadline =
                req.body?.deadline !== undefined
                    ? (
                        cleanString(
                            req.body.deadline
                        ) || null
                    )
                    : current.deadline;

            const status =
                req.body?.status !== undefined
                    ? cleanString(
                        req.body.status
                    ).toLowerCase()
                    : current.status;

            const courseId =
                req.body?.courseId !== undefined
                    ? (
                        req.body.courseId === null ||
                        req.body.courseId === ""
                            ? null
                            : Number(
                                req.body.courseId
                            )
                    )
                    : current.course_id;

            if (!title) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Writing task title is required."
                });

            }

            if (!instructions) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Writing instructions are required."
                });

            }

            const allowedLevels = [
                "A1",
                "A2",
                "B1",
                "B2"
            ];

            if (
                level &&
                !allowedLevels.includes(
                    level
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid writing task level."
                });

            }

            const allowedStatuses = [
                "draft",
                "published",
                "archived"
            ];

            if (
                !allowedStatuses.includes(
                    status
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid writing task status."
                });

            }

            if (
                courseId !== null
            ) {

                if (
                    !Number.isInteger(
                        courseId
                    ) ||
                    courseId <= 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid course ID."
                    });

                }

                const course =
                    db.prepare(`
                        SELECT id
                        FROM online_courses
                        WHERE id = ?
                        LIMIT 1
                    `).get(courseId);

                if (!course) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Course not found."
                    });

                }

            }

            if (deadline) {

                const deadlineDate =
                    new Date(
                        deadline
                    );

                if (
                    Number.isNaN(
                        deadlineDate.getTime()
                    )
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid writing task deadline."
                    });

                }

            }

            db.prepare(`
                UPDATE online_writing_tasks
                SET
                    title = ?,
                    instructions = ?,
                    level = ?,
                    course_id = ?,
                    instagram_url = ?,
                    tiktok_url = ?,
                    youtube_url = ?,
                    deadline = ?,
                    status = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(
                title,
                instructions,
                level || null,
                courseId,
                instagramUrl || null,
                tiktokUrl || null,
                youtubeUrl || null,
                deadline,
                status,
                getKigaliDateTime(),
                taskId
            );

            const updated =
                db.prepare(`
                    SELECT
                        wt.*,
                        c.title AS course_title,
                        a.name AS created_by_admin_name

                    FROM online_writing_tasks wt

                    LEFT JOIN online_courses c
                        ON c.id = wt.course_id

                    LEFT JOIN online_admins a
                        ON a.id = wt.created_by_admin_id

                    WHERE wt.id = ?

                    LIMIT 1
                `).get(taskId);

            return res.json({
                success: true,
                message:
                    "Writing task updated successfully.",
                task:
                    mapWritingTask(
                        updated
                    )
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not update writing task.",
                error
            );

        }

    }
);


/* =========================================================
   DELETE WRITING TASK
========================================================= */

router.delete(
    "/writing/:taskId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const taskId =
                Number(
                    req.params.taskId
                );

            if (
                !Number.isInteger(
                    taskId
                ) ||
                taskId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid writing task ID."
                });

            }

            const task =
                db.prepare(`
                    SELECT
                        id,
                        title
                    FROM online_writing_tasks
                    WHERE id = ?
                    LIMIT 1
                `).get(taskId);

            if (!task) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Writing task not found."
                });

            }

            db.prepare(`
                DELETE FROM online_writing_tasks
                WHERE id = ?
            `).run(taskId);

            return res.json({
                success: true,
                message:
                    "Writing task deleted successfully.",
                deletedTask:
                    task.title
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not delete writing task.",
                error
            );

        }

    }
);


/* =========================================================
   GET ALL WRITING SUBMISSIONS
========================================================= */

router.get(
    "/writing-submissions",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const taskId =
                req.query?.taskId !== undefined &&
                req.query?.taskId !== ""
                    ? Number(
                        req.query.taskId
                    )
                    : null;

            const studentId =
                req.query?.studentId !== undefined &&
                req.query?.studentId !== ""
                    ? Number(
                        req.query.studentId
                    )
                    : null;

            const status =
                cleanString(
                    req.query?.status
                ).toLowerCase();

            const level =
                cleanString(
                    req.query?.level
                ).toUpperCase();

            let query = `
                SELECT
                    ws.id,
                    ws.task_id,
                    ws.student_id,
                    ws.answer,
                    ws.word_count,
                    ws.submitted_at,
                    ws.status,
                    ws.score,
                    ws.feedback,
                    ws.reviewed_by_admin_id,
                    ws.reviewed_at,
                    ws.updated_at,

                    wt.title AS task_title,
                    wt.level AS task_level,
                    wt.course_id,

                    s.first_name,
                    s.last_name,
                    s.email,

                    c.title AS course_title,

                    a.name AS reviewed_by_admin_name

                FROM online_writing_submissions ws

                INNER JOIN online_writing_tasks wt
                    ON wt.id = ws.task_id

                INNER JOIN online_students s
                    ON s.id = ws.student_id

                LEFT JOIN online_courses c
                    ON c.id = wt.course_id

                LEFT JOIN online_admins a
                    ON a.id = ws.reviewed_by_admin_id

                WHERE 1 = 1
            `;

            const params = [];

            if (
                taskId !== null
            ) {

                if (
                    !Number.isInteger(
                        taskId
                    ) ||
                    taskId <= 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid task ID."
                    });

                }

                query += `
                    AND ws.task_id = ?
                `;

                params.push(
                    taskId
                );

            }

            if (
                studentId !== null
            ) {

                if (
                    !Number.isInteger(
                        studentId
                    ) ||
                    studentId <= 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid student ID."
                    });

                }

                query += `
                    AND ws.student_id = ?
                `;

                params.push(
                    studentId
                );

            }

            if (status) {

                const allowedStatuses = [
                    "submitted",
                    "reviewed"
                ];

                if (
                    !allowedStatuses.includes(
                        status
                    )
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid submission status."
                    });

                }

                query += `
                    AND ws.status = ?
                `;

                params.push(
                    status
                );

            }

            if (level) {

                const allowedLevels = [
                    "A1",
                    "A2",
                    "B1",
                    "B2"
                ];

                if (
                    !allowedLevels.includes(
                        level
                    )
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Invalid level."
                    });

                }

                query += `
                    AND wt.level = ?
                `;

                params.push(
                    level
                );

            }

            query += `
                ORDER BY
                    ws.submitted_at DESC,
                    ws.id DESC
            `;

            const submissions =
                db.prepare(
                    query
                ).all(
                    ...params
                );

            return res.json({
                success: true,

                submissions:
                    submissions.map(
                        item => ({
                            ...mapWritingSubmission(
                                item
                            ),

                            task: {
                                id:
                                    Number(
                                        item.task_id
                                    ),

                                title:
                                    item.task_title,

                                level:
                                    item.task_level,

                                courseId:
                                    item.course_id === null
                                        ? null
                                        : Number(
                                            item.course_id
                                        ),

                                courseTitle:
                                    item.course_title ||
                                    null
                            },

                            student: {
                                id:
                                    Number(
                                        item.student_id
                                    ),

                                firstName:
                                    item.first_name,

                                lastName:
                                    item.last_name,

                                name:
                                    `${item.first_name || ""} ${item.last_name || ""}`
                                        .trim(),

                                email:
                                    item.email
                            },

                            reviewedByAdminName:
                                item.reviewed_by_admin_name ||
                                null
                        })
                    )
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load writing submissions.",
                error
            );

        }

    }
);


/* =========================================================
   GET SINGLE WRITING SUBMISSION
========================================================= */

router.get(
    "/writing-submissions/:submissionId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const submissionId =
                Number(
                    req.params.submissionId
                );

            if (
                !Number.isInteger(
                    submissionId
                ) ||
                submissionId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid submission ID."
                });

            }

            const submission =
                db.prepare(`
                    SELECT
                        ws.*,

                        wt.title AS task_title,
                        wt.instructions AS task_instructions,
                        wt.level AS task_level,
                        wt.course_id AS task_course_id,
                        wt.instagram_url,
                        wt.tiktok_url,
                        wt.youtube_url,
                        wt.deadline AS task_deadline,

                        s.first_name,
                        s.last_name,
                        s.email,
                        s.phone,

                        c.title AS course_title,

                        a.name AS reviewed_by_admin_name

                    FROM online_writing_submissions ws

                    INNER JOIN online_writing_tasks wt
                        ON wt.id = ws.task_id

                    INNER JOIN online_students s
                        ON s.id = ws.student_id

                    LEFT JOIN online_courses c
                        ON c.id = wt.course_id

                    LEFT JOIN online_admins a
                        ON a.id = ws.reviewed_by_admin_id

                    WHERE ws.id = ?

                    LIMIT 1
                `).get(
                    submissionId
                );

            if (!submission) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Writing submission not found."
                });

            }

            return res.json({
                success: true,

                submission: {

                    ...mapWritingSubmission(
                        submission
                    ),

                    task: {

                        id:
                            Number(
                                submission.task_id
                            ),

                        title:
                            submission.task_title,

                        instructions:
                            submission.task_instructions,

                        level:
                            submission.task_level,

                        courseId:
                            submission.task_course_id === null
                                ? null
                                : Number(
                                    submission.task_course_id
                                ),

                        courseTitle:
                            submission.course_title ||
                            null,

                        instagramUrl:
                            submission.instagram_url ||
                            "",

                        tiktokUrl:
                            submission.tiktok_url ||
                            "",

                        youtubeUrl:
                            submission.youtube_url ||
                            "",

                        deadline:
                            submission.task_deadline ||
                            null

                    },

                    student: {

                        id:
                            Number(
                                submission.student_id
                            ),

                        firstName:
                            submission.first_name,

                        lastName:
                            submission.last_name,

                        name:
                            `${submission.first_name || ""} ${submission.last_name || ""}`
                                .trim(),

                        email:
                            submission.email,

                        phone:
                            submission.phone ||
                            ""

                    },

                    reviewedByAdminName:
                        submission.reviewed_by_admin_name ||
                        null

                }

            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load writing submission.",
                error
            );

        }

    }
);


/* =========================================================
   REVIEW / SCORE WRITING SUBMISSION
========================================================= */

router.patch(
    "/writing-submissions/:submissionId/review",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const submissionId =
                Number(
                    req.params.submissionId
                );

            if (
                !Number.isInteger(
                    submissionId
                ) ||
                submissionId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid submission ID."
                });

            }

            const submission =
                db.prepare(`
                    SELECT
                        id,
                        task_id,
                        student_id,
                        answer,
                        status,
                        score,
                        feedback
                    FROM online_writing_submissions
                    WHERE id = ?
                    LIMIT 1
                `).get(
                    submissionId
                );

            if (!submission) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Writing submission not found."
                });

            }

            const score =
                req.body?.score !== undefined &&
                req.body?.score !== null &&
                req.body?.score !== ""
                    ? Number(
                        req.body.score
                    )
                    : null;

            const feedback =
                req.body?.feedback !== undefined
                    ? cleanString(
                        req.body.feedback
                    )
                    : "";

            const requestedStatus =
                req.body?.status !== undefined
                    ? cleanString(
                        req.body.status
                    ).toLowerCase()
                    : "reviewed";

            if (
                score !== null
            ) {

                if (
                    !Number.isFinite(
                        score
                    ) ||
                    score < 0 ||
                    score > 100
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Score must be between 0 and 100."
                    });

                }

            }

            const allowedStatuses = [
                "submitted",
                "reviewed"
            ];

            if (
                !allowedStatuses.includes(
                    requestedStatus
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid submission status."
                });

            }

            const now =
                getKigaliDateTime();

            db.prepare(`
                UPDATE online_writing_submissions
                SET
                    status = ?,
                    score = ?,
                    feedback = ?,
                    reviewed_by_admin_id = ?,
                    reviewed_at = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(
                requestedStatus,
                score,
                feedback || null,
                req.onlineAdminId,
                now,
                now,
                submissionId
            );

            const updated =
                db.prepare(`
                    SELECT
                        ws.*,

                        wt.title AS task_title,
                        wt.level AS task_level,

                        s.first_name,
                        s.last_name,
                        s.email,

                        a.name AS reviewed_by_admin_name

                    FROM online_writing_submissions ws

                    INNER JOIN online_writing_tasks wt
                        ON wt.id = ws.task_id

                    INNER JOIN online_students s
                        ON s.id = ws.student_id

                    LEFT JOIN online_admins a
                        ON a.id = ws.reviewed_by_admin_id

                    WHERE ws.id = ?

                    LIMIT 1
                `).get(
                    submissionId
                );

            return res.json({
                success: true,

                message:
                    "Writing submission reviewed successfully.",

                submission: {

                    ...mapWritingSubmission(
                        updated
                    ),

                    taskTitle:
                        updated.task_title,

                    taskLevel:
                        updated.task_level,

                    student: {

                        id:
                            Number(
                                updated.student_id
                            ),

                        name:
                            `${updated.first_name || ""} ${updated.last_name || ""}`
                                .trim(),

                        email:
                            updated.email

                    },

                    reviewedByAdminName:
                        updated.reviewed_by_admin_name ||
                        null

                }

            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not review writing submission.",
                error
            );

        }

    }
);


/* =========================================================
   RESET WRITING REVIEW
========================================================= */

router.patch(
    "/writing-submissions/:submissionId/reset-review",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const submissionId =
                Number(
                    req.params.submissionId
                );

            if (
                !Number.isInteger(
                    submissionId
                ) ||
                submissionId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid submission ID."
                });

            }

            const submission =
                db.prepare(`
                    SELECT id
                    FROM online_writing_submissions
                    WHERE id = ?
                    LIMIT 1
                `).get(
                    submissionId
                );

            if (!submission) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Writing submission not found."
                });

            }

            const now =
                getKigaliDateTime();

            db.prepare(`
                UPDATE online_writing_submissions
                SET
                    status = 'submitted',
                    score = NULL,
                    feedback = NULL,
                    reviewed_by_admin_id = NULL,
                    reviewed_at = NULL,
                    updated_at = ?
                WHERE id = ?
            `).run(
                now,
                submissionId
            );

            return res.json({
                success: true,
                message:
                    "Writing submission returned to pending review."
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not reset writing review.",
                error
            );

        }

    }
);


/* =========================================================
   DELETE WRITING SUBMISSION
========================================================= */

router.delete(
    "/writing-submissions/:submissionId",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const submissionId =
                Number(
                    req.params.submissionId
                );

            if (
                !Number.isInteger(
                    submissionId
                ) ||
                submissionId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid submission ID."
                });

            }

            const submission =
                db.prepare(`
                    SELECT id
                    FROM online_writing_submissions
                    WHERE id = ?
                    LIMIT 1
                `).get(
                    submissionId
                );

            if (!submission) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Writing submission not found."
                });

            }

            db.prepare(`
                DELETE FROM online_writing_submissions
                WHERE id = ?
            `).run(
                submissionId
            );

            return res.json({
                success: true,
                message:
                    "Writing submission deleted successfully."
            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not delete writing submission.",
                error
            );

        }

    }
);


/* =========================================================
   WRITING STATISTICS
========================================================= */

router.get(
    "/writing-statistics",
    authenticateOnlineAdmin,
    (req, res) => {

        try {

            const tasks =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_writing_tasks
                `).get();

            const publishedTasks =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_writing_tasks
                    WHERE status = 'published'
                `).get();

            const submissions =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_writing_submissions
                `).get();

            const pending =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_writing_submissions
                    WHERE status = 'submitted'
                `).get();

            const reviewed =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM online_writing_submissions
                    WHERE status = 'reviewed'
                `).get();

            const averageScore =
                db.prepare(`
                    SELECT
                        COALESCE(
                            AVG(score),
                            0
                        ) AS average_score

                    FROM online_writing_submissions

                    WHERE score IS NOT NULL
                `).get();

            return res.json({
                success: true,

                statistics: {

                    totalTasks:
                        Number(
                            tasks.count
                        ),

                    publishedTasks:
                        Number(
                            publishedTasks.count
                        ),

                    totalSubmissions:
                        Number(
                            submissions.count
                        ),

                    pendingReviews:
                        Number(
                            pending.count
                        ),

                    reviewedSubmissions:
                        Number(
                            reviewed.count
                        ),

                    averageScore:
                        Number(
                            Number(
                                averageScore.average_score
                            ).toFixed(2)
                        )

                }

            });

        } catch (error) {

            return sendServerError(
                res,
                "Could not load writing statistics.",
                error
            );

        }

    }
);


/* =========================================================
   LOGOUT
========================================================= */

router.post(
    "/logout",
    authenticateOnlineAdmin,
    (req, res) => {

        return res.json({
            success: true,
            message:
                "Logged out successfully. Please remove your authentication token."
        });

    }
);

/* =========================================================
   CREATE LESSON DIRECTLY IN A COURSE (auto module)
========================================================= */

router.post(
    "/courses/:courseId/lessons",
    authenticateOnlineAdmin,
    (req, res) => {
        try {
            const courseId = Number(req.params.courseId);

            if (!Number.isInteger(courseId) || courseId <= 0) {
                return res.status(400).json({ success: false, message: "Invalid course ID." });
            }

            const course = db.prepare(`
                SELECT id FROM online_courses WHERE id = ? LIMIT 1
            `).get(courseId);

            if (!course) {
                return res.status(404).json({ success: false, message: "Course not found." });
            }

            const title = cleanString(req.body?.title);
            if (!title) {
                return res.status(400).json({ success: false, message: "Lesson title is required." });
            }

            const description = cleanString(req.body?.description);
            const content = cleanString(req.body?.content);
            const videoUrl = cleanString(req.body?.videoUrl ?? req.body?.video_url) || null;
            const pdfUrl = cleanString(req.body?.pdfUrl ?? req.body?.pdf_url) || null;
            const durationMinutes = Number(req.body?.durationMinutes ?? 0) || 0;
            const lessonOrder = Math.max(1, Number(req.body?.lessonOrder ?? 1) || 1);
            const status = cleanString(req.body?.status).toLowerCase() || "published";

            const now = getKigaliDateTime();

            // Find the first module of this course, or create a default one
            let mod = db.prepare(`
                SELECT id FROM online_modules
                WHERE course_id = ?
                ORDER BY module_order ASC, id ASC
                LIMIT 1
            `).get(courseId);

            let moduleId;

            if (mod) {
                moduleId = Number(mod.id);
            } else {
                const created = db.prepare(`
                    INSERT INTO online_modules (
                        course_id, title, description, module_order, status, created_at, updated_at
                    )
                    VALUES (?, 'Main Module', '', 1, 'published', ?, ?)
                `).run(courseId, now, now);

                moduleId = Number(created.lastInsertRowid);
            }

            const result = db.prepare(`
                INSERT INTO online_lessons (
                    module_id, title, description, content, video_url, pdf_url,
                    duration_minutes, lesson_order, status, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                moduleId, title, description, content, videoUrl, pdfUrl,
                durationMinutes, lessonOrder, status, now, now
            );

            const lesson = db.prepare(`
                SELECT * FROM online_lessons WHERE id = ? LIMIT 1
            `).get(Number(result.lastInsertRowid));

            return res.status(201).json({
                success: true,
                message: "Lesson created successfully.",
                lesson
            });

        } catch (error) {
            return sendServerError(res, "Could not create lesson.", error);
        }
    }
);

/* =========================================================
   DELETE STUDENT
========================================================= */

router.delete(
    "/students/:studentId",
    authenticateOnlineAdmin,
    (req, res) => {
        try {
            const studentId = Number(req.params.studentId);

            if (!Number.isInteger(studentId) || studentId <= 0) {
                return res.status(400).json({ success: false, message: "Invalid student ID." });
            }

            const student = db.prepare(
                "SELECT id FROM online_students WHERE id = ? LIMIT 1"
            ).get(studentId);

            if (!student) {
                return res.status(404).json({ success: false, message: "Online student not found." });
            }

            const removeStudent = db.transaction(() => {
                db.prepare("DELETE FROM online_writing_submissions WHERE student_id = ?").run(studentId);
                db.prepare("DELETE FROM online_participation WHERE student_id = ?").run(studentId);
                db.prepare("DELETE FROM online_learning_sessions WHERE student_id = ?").run(studentId);
                db.prepare("DELETE FROM online_progress WHERE student_id = ?").run(studentId);
                db.prepare("DELETE FROM online_enrollments WHERE student_id = ?").run(studentId);
                db.prepare("DELETE FROM online_access_code_uses WHERE student_id = ?").run(studentId);
                db.prepare("DELETE FROM online_students WHERE id = ?").run(studentId);
            });

            removeStudent();

            return res.json({ success: true, message: "Student deleted successfully." });

        } catch (error) {
            return sendServerError(res, "Could not delete student.", error);
        }
    }
);
/* =========================================================
   MULTER ERROR FALLBACK
========================================================= */

router.use(
    (error, req, res, next) => {

        if (
            error instanceof
            multer.MulterError
        ) {

            return res.status(400).json({
                success: false,
                message:
                    error.code === "LIMIT_FILE_SIZE"
                        ? "Video is too large. Maximum size is 1 GB."
                        : error.message
            });

        }

        if (
            error
        ) {

            console.error(
                "Online admin route error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "An unexpected server error occurred."
            });

        }

        return next();

    }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
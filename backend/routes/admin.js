/* =========================================================
   LINGUA DEUTSCH CONNECT
   ADMIN ROUTES - UPDATED / SCHEMA ALIGNED
========================================================= */
   console.log("admin routes loaded: assignment fix v2");
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const router = express.Router();
const db = require("../database");

const JWT_SECRET =
    process.env.JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    "lingua-deutsch-connect-secret";

const ADMIN_EMAIL =
    String(
        process.env.ADMIN_EMAIL ||
        "admin@linguadeutschconnect.com"
    )
        .trim()
        .toLowerCase();

const ADMIN_PASSWORD =
    String(
        process.env.ADMIN_PASSWORD ||
        "admin123"
    );

/* =========================================================
   HELPERS
========================================================= */

function getKigaliDate() {
    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Africa/Kigali",
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
            timeZone: "Africa/Kigali",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }
    ).format(
        new Date()
    );
}

function validId(value) {
    const id =
        Number(value);

    return Number.isInteger(id) &&
        id > 0
        ? id
        : null;
}

function normalizeNullableId(value) {
    if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "null"
    ) {
        return null;
    }

    return validId(value);
}

function parsePositiveInteger(
    value,
    fallback = 0
) {
    const number =
        Number(value);

    if (
        !Number.isFinite(number) ||
        number < 0
    ) {
        return fallback;
    }

    return Math.floor(number);
}

function parsePositiveNumber(
    value,
    fallback = 0
) {
    const number =
        Number(value);

    if (
        !Number.isFinite(number) ||
        number < 0
    ) {
        return fallback;
    }

    return number;
}

function normalizeStatus(
    value,
    allowed,
    fallback
) {
    const normalized =
        String(
            value ??
            ""
        )
            .trim()
            .toLowerCase();

    return allowed.includes(
        normalized
    )
        ? normalized
        : fallback;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(email || "")
            .trim()
            .toLowerCase()
    );
}

function generateRandomCode(
    prefix = "LDC"
) {
    return (
        prefix +
        "-" +
        crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase()
    );
}

function omitSecretFields(
    student
) {
    if (!student) {
        return student;
    }

    const copy = {
        ...student
    };

    delete copy.password_hash;

    return copy;
}

function omitTeacherSecretFields(
    teacher
) {
    if (!teacher) {
        return teacher;
    }

    const copy = {
        ...teacher
    };

    delete copy.password_hash;

    return copy;
}

function tableExists(
    tableName
) {
    try {
        const result =
            db.prepare(`
                SELECT name
                FROM sqlite_master
                WHERE type = 'table'
                  AND name = ?
            `).get(
                tableName
            );

        return Boolean(
            result
        );
    } catch {
        return false;
    }
}

function logAdminActivity(
    req,
    action,
    entityType,
    entityId = null,
    details = null
) {
    try {
        if (
            !tableExists(
                "admin_activity_logs"
            )
        ) {
            return;
        }

        db.prepare(`
            INSERT INTO admin_activity_logs
            (
                admin_name,
                admin_email,
                action,
                entity_type,
                entity_id,
                details,
                description,
                ip_address,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(
            "Administrator",
            ADMIN_EMAIL,
            action,
            entityType,
            entityId,
            details,
            details,
            req.ip || null
        );
    } catch (error) {
        console.error(
            "Admin activity log error:",
            error
        );
    }
}

/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

function authenticateAdmin(
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
            header.substring(7).trim();

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
            !decoded ||
            decoded.role !== "admin"
        ) {
            return res.status(403).json({
                message:
                    "Admin access required."
            });
        }

        req.admin = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message:
                "Invalid or expired authentication token."
        });
    }
}

/* =========================================================
   LOGIN
========================================================= */

router.post(
    "/login",
    (req, res) => {
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

            if (
                normalizedEmail !==
                ADMIN_EMAIL ||
                String(password) !==
                ADMIN_PASSWORD
            ) {
                return res.status(401).json({
                    message:
                        "Invalid admin credentials."
                });
            }

            const token =
                jwt.sign(
                    {
                        role: "admin",
                        email:
                            ADMIN_EMAIL,
                        name:
                            "Administrator"
                    },
                    JWT_SECRET,
                    {
                        expiresIn:
                            "24h"
                    }
                );

            logAdminActivity(
                req,
                "ADMIN_LOGIN",
                "admin",
                null,
                "Administrator logged in."
            );

            return res.json({
                message:
                    "Admin login successful.",
                token,
                admin: {
                    role:
                        "admin",
                    email:
                        ADMIN_EMAIL,
                    name:
                        "Administrator"
                }
            });
        } catch (error) {
            console.error(
                "Admin login error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not process admin login."
            });
        }
    }
);

/* =========================================================
   ADMIN PROFILE
========================================================= */

router.get(
    "/profile",
    authenticateAdmin,
    (req, res) => {
        return res.json({
            admin: {
                role:
                    "admin",
                email:
                    ADMIN_EMAIL,
                name:
                    "Administrator"
            }
        });
    }
);

/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

router.get(
    "/statistics",
    authenticateAdmin,
    (req, res) => {
        try {
            const students =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM students
                `).get().count;

            const activeStudents =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM students
                    WHERE account_status = 'active'
                `).get().count;

            const teachers =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM teachers
                `).get().count;

            const activeTeachers =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM teachers
                    WHERE status = 'active'
                `).get().count;

            const courses =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM courses
                `).get().count;

            const activeCourses =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM courses
                    WHERE status = 'active'
                `).get().count;

            const classes =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM classes
                `).get().count;

            const activeClasses =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM classes
                    WHERE status = 'active'
                `).get().count;

            const enrollments =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM enrollments
                    WHERE status = 'active'
                `).get().count;

            const attendanceToday =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM attendance
                    WHERE attendance_date = ?
                `).get(
                    getKigaliDate()
                ).count;

            const tests =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM tests
                `).get().count;

            const publishedTests =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM tests
                    WHERE status = 'published'
                `).get().count;

            const payments =
                db.prepare(`
                    SELECT
                        COALESCE(
                            SUM(amount_paid),
                            0
                        ) AS total_paid,

                        COALESCE(
                            SUM(amount_remaining),
                            0
                        ) AS total_remaining
                    FROM payments
                `).get();

            const result =
                db.prepare(`
                    SELECT
                        COUNT(*) AS count,
                        COALESCE(
                            AVG(percentage),
                            0
                        ) AS average_percentage
                    FROM test_results
                `).get();

            return res.json({
                statistics: {
                    students:
                        Number(
                            students || 0
                        ),

                    activeStudents:
                        Number(
                            activeStudents || 0
                        ),

                    teachers:
                        Number(
                            teachers || 0
                        ),

                    activeTeachers:
                        Number(
                            activeTeachers || 0
                        ),

                    courses:
                        Number(
                            courses || 0
                        ),

                    activeCourses:
                        Number(
                            activeCourses || 0
                        ),

                    classes:
                        Number(
                            classes || 0
                        ),

                    activeClasses:
                        Number(
                            activeClasses || 0
                        ),

                    enrollments:
                        Number(
                            enrollments || 0
                        ),

                    attendanceToday:
                        Number(
                            attendanceToday || 0
                        ),

                    tests:
                        Number(
                            tests || 0
                        ),

                    publishedTests:
                        Number(
                            publishedTests || 0
                        ),

                    testResults:
                        Number(
                            result?.count || 0
                        ),

                    averageTestPercentage:
                        Number(
                            result?.average_percentage || 0
                        ),

                    totalPaid:
                        Number(
                            payments?.total_paid || 0
                        ),

                    totalRemaining:
                        Number(
                            payments?.total_remaining || 0
                        )
                },

                date:
                    getKigaliDate(),

                serverTime:
                    getKigaliDateTime()
            });
        } catch (error) {
            console.error(
                "Statistics error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load dashboard statistics."
            });
        }
    }
);

router.get(
    "/dashboard",
    authenticateAdmin,
    (req, res) => {
        req.url =
            "/statistics";

        return router.handle(
            req,
            res
        );
    }
);

/* =========================================================
   ACCESS CODES
========================================================= */

router.get(
    "/access-codes",
    authenticateAdmin,
    (req, res) => {
        try {
            const codes =
                db.prepare(`
                    SELECT
                        ac.*,
                        c.name AS course_name,
                        s.full_name
                            AS student_name
                    FROM access_codes ac
                    LEFT JOIN courses c
                        ON c.id =
                           ac.course_id
                    LEFT JOIN students s
                        ON s.id =
                           COALESCE(
                               ac.used_by_student_id,
                               ac.student_id
                           )
                    ORDER BY
                        ac.id DESC
                `).all();

            return res.json({
                accessCodes:
                    codes
            });
        } catch (error) {
            console.error(
                "Get access codes error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load access codes."
            });
        }
    }
);

router.post(
    "/access-codes",
    authenticateAdmin,
    (req, res) => {
        try {
            const {
                code,
                courseId,
                level = null,
                paymentStatus =
                    "pending",
                expiresAt = null
            } =
                req.body || {};

            const normalizedCourseId =
                normalizeNullableId(
                    courseId
                );

            if (
                normalizedCourseId
            ) {
                const course =
                    db.prepare(`
                        SELECT
                            id,
                            name,
                            level
                        FROM courses
                        WHERE id = ?
                    `).get(
                        normalizedCourseId
                    );

                if (!course) {
                    return res.status(404).json({
                        message:
                            "Course not found."
                    });
                }
            }

            const generatedCode =
                String(
                    code ||
                    generateRandomCode(
                        "LDC"
                    )
                )
                    .trim()
                    .toUpperCase();

            if (!generatedCode) {
                return res.status(400).json({
                    message:
                        "Access code is required."
                });
            }

            const duplicate =
                db.prepare(`
                    SELECT id
                    FROM access_codes
                    WHERE code = ?
                `).get(
                    generatedCode
                );

            if (duplicate) {
                return res.status(409).json({
                    message:
                        "Access code already exists."
                });
            }

            const result =
                db.prepare(`
                    INSERT INTO access_codes
                    (
                        code,
                        course_id,
                        course,
                        level,
                        payment_status,
                        used,
                        expires_at
                    )
                    VALUES (?, ?, ?, ?, ?, 0, ?)
                `).run(
                    generatedCode,
                    normalizedCourseId,
                    normalizedCourseId
                        ? String(
                            db.prepare(`
                                SELECT name
                                FROM courses
                                WHERE id = ?
                            `).get(
                                normalizedCourseId
                            )?.name || ""
                        )
                        : null,
                    level,
                    normalizeStatus(
                        paymentStatus,
                        [
                            "pending",
                            "partial",
                            "paid"
                        ],
                        "pending"
                    ),
                    expiresAt || null
                );

            const accessCode =
                db.prepare(`
                    SELECT *
                    FROM access_codes
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            logAdminActivity(
                req,
                "CREATE_ACCESS_CODE",
                "access_code",
                result.lastInsertRowid,
                `Created access code ${generatedCode}.`
            );

            return res.status(201).json({
                message:
                    "Access code created successfully.",
                accessCode
            });
        } catch (error) {
            console.error(
                "Create access code error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create access code."
            });
        }
    }
);

router.patch(
    "/access-codes/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid access code ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM access_codes
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Access code not found."
                });
            }

            const body =
                req.body || {};

            const courseId =
                body.courseId !==
                    undefined
                    ? normalizeNullableId(
                        body.courseId
                    )
                    : existing.course_id;

            if (courseId) {
                const course =
                    db.prepare(`
                        SELECT id, name
                        FROM courses
                        WHERE id = ?
                    `).get(
                        courseId
                    );

                if (!course) {
                    return res.status(404).json({
                        message:
                            "Course not found."
                    });
                }
            }

            const code =
                body.code !==
                    undefined
                    ? String(
                        body.code
                    )
                        .trim()
                        .toUpperCase()
                    : existing.code;

            if (!code) {
                return res.status(400).json({
                    message:
                        "Access code cannot be empty."
                });
            }

            const duplicate =
                db.prepare(`
                    SELECT id
                    FROM access_codes
                    WHERE code = ?
                      AND id != ?
                `).get(
                    code,
                    id
                );

            if (duplicate) {
                return res.status(409).json({
                    message:
                        "Access code already exists."
                });
            }

            const courseName =
                courseId
                    ? db.prepare(`
                        SELECT name
                        FROM courses
                        WHERE id = ?
                    `).get(
                        courseId
                    )?.name || null
                    : null;

            db.prepare(`
                UPDATE access_codes
                SET
                    code = ?,
                    course_id = ?,
                    course = ?,
                    level = ?,
                    payment_status = ?,
                    expires_at = ?,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                code,
                courseId,
                courseName,
                body.level !==
                    undefined
                    ? body.level
                    : existing.level,
                body.paymentStatus !==
                    undefined
                    ? normalizeStatus(
                        body.paymentStatus,
                        [
                            "pending",
                            "partial",
                            "paid"
                        ],
                        existing.payment_status ||
                        "pending"
                    )
                    : existing.payment_status,
                body.expiresAt !==
                    undefined
                    ? body.expiresAt ||
                      null
                    : existing.expires_at,
                id
            );

            const updated =
                db.prepare(`
                    SELECT *
                    FROM access_codes
                    WHERE id = ?
                `).get(
                    id
                );

            logAdminActivity(
                req,
                "UPDATE_ACCESS_CODE",
                "access_code",
                id
            );

            return res.json({
                message:
                    "Access code updated successfully.",
                accessCode:
                    updated
            });
        } catch (error) {
            console.error(
                "Update access code error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not update access code."
            });
        }
    }
);

router.delete(
    "/access-codes/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid access code ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM access_codes
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Access code not found."
                });
            }

            db.prepare(`
                DELETE FROM access_codes
                WHERE id = ?
            `).run(
                id
            );

            logAdminActivity(
                req,
                "DELETE_ACCESS_CODE",
                "access_code",
                id
            );

            return res.json({
                message:
                    "Access code deleted successfully."
            });
        } catch (error) {
            console.error(
                "Delete access code error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not delete access code."
            });
        }
    }
);

/* =========================================================
   STUDENTS
========================================================= */

router.get(
    "/students",
    authenticateAdmin,
    (req, res) => {
        try {
            const students =
                db.prepare(`
                    SELECT
                        s.*,
                        c.name AS course_name,
                        c.level AS course_level
                    FROM students s
                    LEFT JOIN courses c
                        ON c.id =
                           s.course_id
                    ORDER BY
                        s.id DESC
                `).all();

            return res.json({
                students:
                    students.map(
                        omitSecretFields
                    )
            });
        } catch (error) {
            console.error(
                "Get students error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load students."
            });
        }
    }
);

router.get(
    "/students/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid student ID."
                });
            }

            const student =
                db.prepare(`
                    SELECT
                        s.*,
                        c.name AS course_name,
                        c.level AS course_level
                    FROM students s
                    LEFT JOIN courses c
                        ON c.id =
                           s.course_id
                    WHERE s.id = ?
                `).get(
                    id
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
                        cl.level AS class_level,
                        c.name AS course_name
                    FROM enrollments e
                    JOIN classes cl
                        ON cl.id =
                           e.class_id
                    LEFT JOIN courses c
                        ON c.id =
                           cl.course_id
                    WHERE e.student_id = ?
                    ORDER BY
                        e.id DESC
                `).all(
                    id
                );

            return res.json({
                student:
                    omitSecretFields(
                        student
                    ),
                enrollments
            });
        } catch (error) {
            console.error(
                "Get student error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load student."
            });
        }
    }
);

router.post(
    "/students",
    authenticateAdmin,
    async (req, res) => {
        try {
            const body =
                req.body || {};

            const fullName =
                String(
                    body.fullName ??
                    body.full_name ??
                    ""
                ).trim();

            const email =
                String(
                    body.email ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            const phone =
                body.phone ??
                null;

            const password =
                String(
                    body.password ||
                    "student123"
                );

            const courseId =
                normalizeNullableId(
                    body.courseId ??
                    body.course_id
                );

            const level =
                body.level ??
                null;

            if (!fullName) {
                return res.status(400).json({
                    message:
                        "Full name is required."
                });
            }

            if (
                !email ||
                !isValidEmail(
                    email
                )
            ) {
                return res.status(400).json({
                    message:
                        "A valid email address is required."
                });
            }

            const duplicate =
                db.prepare(`
                    SELECT id
                    FROM students
                    WHERE email = ?
                `).get(
                    email
                );

            if (duplicate) {
                return res.status(409).json({
                    message:
                        "A student with this email already exists."
                });
            }

            if (courseId) {
                const course =
                    db.prepare(`
                        SELECT id
                        FROM courses
                        WHERE id = ?
                    `).get(
                        courseId
                    );

                if (!course) {
                    return res.status(404).json({
                        message:
                            "Course not found."
                    });
                }
            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    10
                );

            const accessCode =
                String(
                    body.accessCode ||
                    generateRandomCode(
                        "STU"
                    )
                )
                    .trim()
                    .toUpperCase();

            const result =
                db.prepare(`
                    INSERT INTO students
                    (
                        full_name,
                        email,
                        phone,
                        password_hash,
                        course,
                        level,
                        access_code,
                        payment_status,
                        account_status,
                        date_of_birth,
                        gender,
                        address,
                        student_number,
                        course_id
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    fullName,
                    email,
                    phone,
                    passwordHash,
                    courseId
                        ? db.prepare(`
                            SELECT name
                            FROM courses
                            WHERE id = ?
                        `).get(
                            courseId
                        )?.name || null
                        : body.course ||
                          null,
                    level,
                    accessCode,
                    normalizeStatus(
                        body.paymentStatus,
                        [
                            "pending",
                            "partial",
                            "paid"
                        ],
                        "pending"
                    ),
                    normalizeStatus(
                        body.accountStatus,
                        [
                            "active",
                            "inactive",
                            "suspended"
                        ],
                        "active"
                    ),
                    body.dateOfBirth ??
                        body.date_of_birth ??
                        null,
                    body.gender ??
                        null,
                    body.address ??
                        null,
                    body.studentNumber ??
                        body.student_number ??
                        null,
                    courseId
                );

            const student =
                db.prepare(`
                    SELECT
                        s.*,
                        c.name AS course_name,
                        c.level AS course_level
                    FROM students s
                    LEFT JOIN courses c
                        ON c.id =
                           s.course_id
                    WHERE s.id = ?
                `).get(
                    result.lastInsertRowid
                );

            logAdminActivity(
                req,
                "CREATE_STUDENT",
                "student",
                result.lastInsertRowid,
                `Created student ${fullName}.`
            );

            return res.status(201).json({
                message:
                    "Student created successfully.",
                student:
                    omitSecretFields(
                        student
                    )
            });
        } catch (error) {
            console.error(
                "Create student error:",
                error
            );

            if (
                error &&
                String(
                    error.message || ""
                ).includes(
                    "UNIQUE constraint failed"
                )
            ) {
                return res.status(409).json({
                    message:
                        "A student with the supplied unique information already exists."
                });
            }

            return res.status(500).json({
                message:
                    "Could not create student."
            });
        }
    }
);

router.patch(
    "/students/:id",
    authenticateAdmin,
    async (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid student ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM students
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Student not found."
                });
            }

            const body =
                req.body || {};

            const fullName =
                body.fullName !==
                    undefined ||
                body.full_name !==
                    undefined
                    ? String(
                        body.fullName ??
                        body.full_name
                    ).trim()
                    : existing.full_name;

            const email =
                body.email !==
                    undefined
                    ? String(
                        body.email
                    )
                        .trim()
                        .toLowerCase()
                    : existing.email;

            if (!fullName) {
                return res.status(400).json({
                    message:
                        "Full name is required."
                });
            }

            if (
                !email ||
                !isValidEmail(
                    email
                )
            ) {
                return res.status(400).json({
                    message:
                        "A valid email address is required."
                });
            }

            const duplicate =
                db.prepare(`
                    SELECT id
                    FROM students
                    WHERE email = ?
                      AND id != ?
                `).get(
                    email,
                    id
                );

            if (duplicate) {
                return res.status(409).json({
                    message:
                        "Another student already uses this email."
                });
            }

            const courseId =
                body.courseId !==
                    undefined ||
                body.course_id !==
                    undefined
                    ? normalizeNullableId(
                        body.courseId ??
                        body.course_id
                    )
                    : existing.course_id;

            if (courseId) {
                const course =
                    db.prepare(`
                        SELECT
                            id,
                            name,
                            level
                        FROM courses
                        WHERE id = ?
                    `).get(
                        courseId
                    );

                if (!course) {
                    return res.status(404).json({
                        message:
                            "Course not found."
                    });
                }
            }

            let passwordHash =
                existing.password_hash;

            if (
                body.password !==
                    undefined &&
                String(
                    body.password
                ).trim()
            ) {
                passwordHash =
                    await bcrypt.hash(
                        String(
                            body.password
                        ),
                        10
                    );
            }

            const courseName =
                courseId
                    ? db.prepare(`
                        SELECT name
                        FROM courses
                        WHERE id = ?
                    `).get(
                        courseId
                    )?.name || null
                    : null;

            db.prepare(`
                UPDATE students
                SET
                    full_name = ?,
                    email = ?,
                    phone = ?,
                    password_hash = ?,
                    course = ?,
                    level = ?,
                    access_code = ?,
                    payment_status = ?,
                    account_status = ?,
                    date_of_birth = ?,
                    gender = ?,
                    address = ?,
                    student_number = ?,
                    course_id = ?,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                fullName,
                email,
                body.phone !==
                    undefined
                    ? body.phone
                    : existing.phone,
                passwordHash,
                courseName ??
                    (
                        body.course !==
                            undefined
                            ? body.course
                            : existing.course
                    ),
                body.level !==
                    undefined
                    ? body.level
                    : existing.level,
                body.accessCode !==
                    undefined
                    ? body.accessCode
                    : existing.access_code,
                body.paymentStatus !==
                    undefined
                    ? normalizeStatus(
                        body.paymentStatus,
                        [
                            "pending",
                            "partial",
                            "paid"
                        ],
                        existing.payment_status ||
                        "pending"
                    )
                    : existing.payment_status,
                body.accountStatus !==
                    undefined
                    ? normalizeStatus(
                        body.accountStatus,
                        [
                            "active",
                            "inactive",
                            "suspended"
                        ],
                        existing.account_status ||
                        "active"
                    )
                    : existing.account_status,
                body.dateOfBirth !==
                    undefined ||
                body.date_of_birth !==
                    undefined
                    ? (
                        body.dateOfBirth ??
                        body.date_of_birth
                    )
                    : existing.date_of_birth,
                body.gender !==
                    undefined
                    ? body.gender
                    : existing.gender,
                body.address !==
                    undefined
                    ? body.address
                    : existing.address,
                body.studentNumber !==
                    undefined ||
                body.student_number !==
                    undefined
                    ? (
                        body.studentNumber ??
                        body.student_number
                    )
                    : existing.student_number,
                courseId,
                id
            );

            const student =
                db.prepare(`
                    SELECT
                        s.*,
                        c.name AS course_name,
                        c.level AS course_level
                    FROM students s
                    LEFT JOIN courses c
                        ON c.id =
                           s.course_id
                    WHERE s.id = ?
                `).get(
                    id
                );

            logAdminActivity(
                req,
                "UPDATE_STUDENT",
                "student",
                id
            );

            return res.json({
                message:
                    "Student updated successfully.",
                student:
                    omitSecretFields(
                        student
                    )
            });
        } catch (error) {
            console.error(
                "Update student error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not update student."
            });
        }
    }
);

router.delete(
    "/students/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid student ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM students
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Student not found."
                });
            }

            db.prepare(`
                UPDATE students
                SET
                    account_status =
                        'inactive',
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                id
            );

            logAdminActivity(
                req,
                "DEACTIVATE_STUDENT",
                "student",
                id
            );

            return res.json({
                message:
                    "Student deactivated successfully."
            });
        } catch (error) {
            console.error(
                "Deactivate student error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not deactivate student."
            });
        }
    }
);

/* =========================================================
   COURSES
========================================================= */

router.get(
    "/courses",
    authenticateAdmin,
    (req, res) => {
        try {
            const courses =
                db.prepare(`
                    SELECT
                        c.*,
                        (
                            SELECT COUNT(*)
                            FROM classes cl
                            WHERE cl.course_id =
                                  c.id
                              AND cl.status =
                                  'active'
                        ) AS active_classes,

                        (
                            SELECT COUNT(*)
                            FROM students s
                            WHERE s.course_id =
                                  c.id
                              AND s.account_status =
                                  'active'
                        ) AS student_count
                    FROM courses c
                    ORDER BY
                        c.id DESC
                `).all();

            return res.json({
                courses
            });
        } catch (error) {
            console.error(
                "Get courses error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load courses."
            });
        }
    }
);

router.get(
    "/courses/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid course ID."
                });
            }

            const course =
                db.prepare(`
                    SELECT *
                    FROM courses
                    WHERE id = ?
                `).get(
                    id
                );

            if (!course) {
                return res.status(404).json({
                    message:
                        "Course not found."
                });
            }

            const modules =
                db.prepare(`
                    SELECT *
                    FROM modules
                    WHERE course_id = ?
                    ORDER BY
                        module_order ASC,
                        id ASC
                `).all(
                    id
                );

            const classes =
                db.prepare(`
                    SELECT *
                    FROM classes
                    WHERE course_id = ?
                    ORDER BY
                        id DESC
                `).all(
                    id
                );

            return res.json({
                course,
                modules,
                classes
            });
        } catch (error) {
            console.error(
                "Get course error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load course."
            });
        }
    }
);

router.post(
    "/courses",
    authenticateAdmin,
    (req, res) => {
        try {
            const body =
                req.body || {};

            const name =
                String(
                    body.name ||
                    ""
                ).trim();

            if (!name) {
                return res.status(400).json({
                    message:
                        "Course name is required."
                });
            }

            const result =
                db.prepare(`
                    INSERT INTO courses
                    (
                        name,
                        description,
                        level,
                        status,
                        fee,
                        duration_weeks
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    name,
                    body.description ??
                        null,
                    body.level ??
                        null,
                    normalizeStatus(
                        body.status,
                        [
                            "active",
                            "inactive",
                            "draft"
                        ],
                        "active"
                    ),
                    parsePositiveNumber(
                        body.fee,
                        0
                    ),
                    parsePositiveInteger(
                        body.durationWeeks ??
                        body.duration_weeks,
                        0
                    )
                );

            const course =
                db.prepare(`
                    SELECT *
                    FROM courses
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            logAdminActivity(
                req,
                "CREATE_COURSE",
                "course",
                result.lastInsertRowid,
                `Created course ${name}.`
            );

            return res.status(201).json({
                message:
                    "Course created successfully.",
                course
            });
        } catch (error) {
            console.error(
                "Create course error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create course."
            });
        }
    }
);

router.patch(
    "/courses/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid course ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM courses
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Course not found."
                });
            }

            const body =
                req.body || {};

            db.prepare(`
                UPDATE courses
                SET
                    name = ?,
                    description = ?,
                    level = ?,
                    status = ?,
                    fee = ?,
                    duration_weeks = ?,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                body.name !==
                    undefined
                    ? String(
                        body.name
                    ).trim()
                    : existing.name,

                body.description !==
                    undefined
                    ? body.description
                    : existing.description,

                body.level !==
                    undefined
                    ? body.level
                    : existing.level,

                body.status !==
                    undefined
                    ? normalizeStatus(
                        body.status,
                        [
                            "active",
                            "inactive",
                            "draft"
                        ],
                        existing.status ||
                        "active"
                    )
                    : existing.status,

                body.fee !==
                    undefined
                    ? parsePositiveNumber(
                        body.fee,
                        existing.fee || 0
                    )
                    : existing.fee,

                body.durationWeeks !==
                    undefined ||
                body.duration_weeks !==
                    undefined
                    ? parsePositiveInteger(
                        body.durationWeeks ??
                        body.duration_weeks,
                        existing.duration_weeks || 0
                    )
                    : existing.duration_weeks,

                id
            );

            const course =
                db.prepare(`
                    SELECT *
                    FROM courses
                    WHERE id = ?
                `).get(
                    id
                );

            logAdminActivity(
                req,
                "UPDATE_COURSE",
                "course",
                id
            );

            return res.json({
                message:
                    "Course updated successfully.",
                course
            });
        } catch (error) {
            console.error(
                "Update course error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not update course."
            });
        }
    }
);

router.delete(
    "/courses/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid course ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM courses
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Course not found."
                });
            }

            db.prepare(`
                UPDATE courses
                SET
                    status = 'inactive',
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                id
            );

            logAdminActivity(
                req,
                "DEACTIVATE_COURSE",
                "course",
                id
            );

            return res.json({
                message:
                    "Course deactivated successfully."
            });
        } catch (error) {
            console.error(
                "Deactivate course error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not deactivate course."
            });
        }
    }
);

/* =========================================================
   COURSE MODULES
========================================================= */

router.get(
    "/courses/:courseId/modules",
    authenticateAdmin,
    (req, res) => {
        try {
            const courseId =
                validId(
                    req.params.courseId
                );

            if (!courseId) {
                return res.status(400).json({
                    message:
                        "Invalid course ID."
                });
            }

            const course =
                db.prepare(`
                    SELECT id
                    FROM courses
                    WHERE id = ?
                `).get(
                    courseId
                );

            if (!course) {
                return res.status(404).json({
                    message:
                        "Course not found."
                });
            }

            const modules =
                db.prepare(`
                    SELECT
                        m.*,
                        (
                            SELECT COUNT(*)
                            FROM lessons l
                            WHERE l.module_id =
                                  m.id
                        ) AS lesson_count
                    FROM modules m
                    WHERE m.course_id = ?
                    ORDER BY
                        m.module_order ASC,
                        m.id ASC
                `).all(
                    courseId
                );

            return res.json({
                modules
            });
        } catch (error) {
            console.error(
                "Get course modules error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load course modules."
            });
        }
    }
);

router.post(
    "/courses/:courseId/modules",
    authenticateAdmin,
    (req, res) => {
        try {
            const courseId =
                validId(
                    req.params.courseId
                );

            if (!courseId) {
                return res.status(400).json({
                    message:
                        "Invalid course ID."
                });
            }

            const course =
                db.prepare(`
                    SELECT id
                    FROM courses
                    WHERE id = ?
                `).get(
                    courseId
                );

            if (!course) {
                return res.status(404).json({
                    message:
                        "Course not found."
                });
            }

            const title =
                String(
                    req.body?.title ||
                    ""
                ).trim();

            if (!title) {
                return res.status(400).json({
                    message:
                        "Module title is required."
                });
            }

            const moduleOrder =
                parsePositiveInteger(
                    req.body?.moduleOrder ??
                    req.body?.module_order,
                    0
                );

            const result =
                db.prepare(`
                    INSERT INTO modules
                    (
                        course_id,
                        title,
                        description,
                        module_order,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?)
                `).run(
                    courseId,
                    title,
                    req.body?.description ??
                        null,
                    moduleOrder,
                    normalizeStatus(
                        req.body?.status,
                        [
                            "active",
                            "inactive",
                            "draft"
                        ],
                        "active"
                    )
                );

            const module =
                db.prepare(`
                    SELECT *
                    FROM modules
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            logAdminActivity(
                req,
                "CREATE_MODULE",
                "module",
                result.lastInsertRowid,
                `Created module ${title}.`
            );

            return res.status(201).json({
                message:
                    "Module created successfully.",
                module
            });
        } catch (error) {
            console.error(
                "Create module error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create module."
            });
        }
    }
);

router.patch(
    "/modules/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid module ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM modules
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Module not found."
                });
            }

            const body =
                req.body || {};

            db.prepare(`
                UPDATE modules
                SET
                    title = ?,
                    description = ?,
                    module_order = ?,
                    status = ?
                WHERE id = ?
            `).run(
                body.title !==
                    undefined
                    ? String(
                        body.title
                    ).trim()
                    : existing.title,

                body.description !==
                    undefined
                    ? body.description
                    : existing.description,

                body.moduleOrder !==
                    undefined ||
                body.module_order !==
                    undefined
                    ? parsePositiveInteger(
                        body.moduleOrder ??
                        body.module_order,
                        existing.module_order || 0
                    )
                    : existing.module_order,

                body.status !==
                    undefined
                    ? normalizeStatus(
                        body.status,
                        [
                            "active",
                            "inactive",
                            "draft"
                        ],
                        existing.status ||
                        "active"
                    )
                    : existing.status,

                id
            );

            const module =
                db.prepare(`
                    SELECT *
                    FROM modules
                    WHERE id = ?
                `).get(
                    id
                );

            logAdminActivity(
                req,
                "UPDATE_MODULE",
                "module",
                id
            );

            return res.json({
                message:
                    "Module updated successfully.",
                module
            });
        } catch (error) {
            console.error(
                "Update module error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not update module."
            });
        }
    }
);

router.delete(
    "/modules/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid module ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM modules
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Module not found."
                });
            }

            const lessons =
                db.prepare(`
                    SELECT id
                    FROM lessons
                    WHERE module_id = ?
                `).all(
                    id
                );

            const transaction =
                db.transaction(() => {
                    lessons.forEach(
                        lesson => {
                            db.prepare(`
                                DELETE FROM exercises
                                WHERE lesson_id = ?
                            `).run(
                                lesson.id
                            );

                            db.prepare(`
                                DELETE FROM lesson_materials
                                WHERE lesson_id = ?
                            `).run(
                                lesson.id
                            );

                            db.prepare(`
                                DELETE FROM student_progress
                                WHERE lesson_id = ?
                            `).run(
                                lesson.id
                            );
                        }
                    );

                    db.prepare(`
                        DELETE FROM lessons
                        WHERE module_id = ?
                    `).run(
                        id
                    );

                    db.prepare(`
                        DELETE FROM modules
                        WHERE id = ?
                    `).run(
                        id
                    );
                });

            transaction();

            logAdminActivity(
                req,
                "DELETE_MODULE",
                "module",
                id
            );

            return res.json({
                message:
                    "Module deleted successfully."
            });
        } catch (error) {
            console.error(
                "Delete module error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not delete module."
            });
        }
    }
);

/* =========================================================
   LESSONS
========================================================= */

router.get(
    "/modules/:moduleId/lessons",
    authenticateAdmin,
    (req, res) => {
        try {
            const moduleId =
                validId(
                    req.params.moduleId
                );

            if (!moduleId) {
                return res.status(400).json({
                    message:
                        "Invalid module ID."
                });
            }

            const module =
                db.prepare(`
                    SELECT *
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

            const lessons =
                db.prepare(`
                    SELECT
                        l.*,
                        t.full_name
                            AS teacher_name,
                        (
                            SELECT COUNT(*)
                            FROM exercises e
                            WHERE e.lesson_id =
                                  l.id
                        ) AS exercise_count,

                        (
                            SELECT COUNT(*)
                            FROM lesson_materials lm
                            WHERE lm.lesson_id =
                                  l.id
                        ) AS material_count
                    FROM lessons l
                    LEFT JOIN teachers t
                        ON t.id =
                           l.teacher_id
                    WHERE l.module_id = ?
                    ORDER BY
                        l.lesson_order ASC,
                        l.id ASC
                `).all(
                    moduleId
                );

            return res.json({
                module,
                lessons
            });
        } catch (error) {
            console.error(
                "Get lessons error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load lessons."
            });
        }
    }
);

router.post(
    "/modules/:moduleId/lessons",
    authenticateAdmin,
    (req, res) => {
        try {
            const moduleId =
                validId(
                    req.params.moduleId
                );

            if (!moduleId) {
                return res.status(400).json({
                    message:
                        "Invalid module ID."
                });
            }

            const module =
                db.prepare(`
                    SELECT *
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

            const title =
                String(
                    req.body?.title ||
                    ""
                ).trim();

            if (!title) {
                return res.status(400).json({
                    message:
                        "Lesson title is required."
                });
            }

            const teacherId =
                normalizeNullableId(
                    req.body?.teacherId ??
                    req.body?.teacher_id
                );

            if (teacherId) {
                const teacher =
                    db.prepare(`
                        SELECT id
                        FROM teachers
                        WHERE id = ?
                    `).get(
                        teacherId
                    );

                if (!teacher) {
                    return res.status(404).json({
                        message:
                            "Teacher not found."
                    });
                }
            }

            const result =
                db.prepare(`
                    INSERT INTO lessons
                    (
                        module_id,
                        teacher_id,
                        title,
                        description,
                        content,
                        lesson_order,
                        duration,
                        xp_reward,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    moduleId,
                    teacherId,
                    title,
                    req.body?.description ??
                        null,
                    req.body?.content ??
                        null,
                    parsePositiveInteger(
                        req.body?.lessonOrder ??
                        req.body?.lesson_order,
                        0
                    ),
                    parsePositiveInteger(
                        req.body?.duration ??
                        req.body?.durationMinutes ??
                        req.body?.duration_minutes,
                        0
                    ),
                    parsePositiveInteger(
                        req.body?.xpReward ??
                        req.body?.xp_reward,
                        50
                    ),
                    normalizeStatus(
                        req.body?.status,
                        [
                            "published",
                            "draft",
                            "inactive"
                        ],
                        "published"
                    )
                );

            const lesson =
                db.prepare(`
                    SELECT *
                    FROM lessons
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            logAdminActivity(
                req,
                "CREATE_LESSON",
                "lesson",
                result.lastInsertRowid,
                `Created lesson ${title}.`
            );

            return res.status(201).json({
                message:
                    "Lesson created successfully.",
                lesson
            });
        } catch (error) {
            console.error(
                "Create lesson error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create lesson."
            });
        }
    }
);

router.patch(
    "/lessons/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid lesson ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM lessons
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Lesson not found."
                });
            }

            const body =
                req.body || {};

            const teacherId =
                body.teacherId !==
                    undefined ||
                body.teacher_id !==
                    undefined
                    ? normalizeNullableId(
                        body.teacherId ??
                        body.teacher_id
                    )
                    : existing.teacher_id;

            if (teacherId) {
                const teacher =
                    db.prepare(`
                        SELECT id
                        FROM teachers
                        WHERE id = ?
                    `).get(
                        teacherId
                    );

                if (!teacher) {
                    return res.status(404).json({
                        message:
                            "Teacher not found."
                    });
                }
            }

            db.prepare(`
                UPDATE lessons
                SET
                    teacher_id = ?,
                    title = ?,
                    description = ?,
                    content = ?,
                    lesson_order = ?,
                    duration = ?,
                    xp_reward = ?,
                    status = ?,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                teacherId,

                body.title !==
                    undefined
                    ? String(
                        body.title
                    ).trim()
                    : existing.title,

                body.description !==
                    undefined
                    ? body.description
                    : existing.description,

                body.content !==
                    undefined
                    ? body.content
                    : existing.content,

                body.lessonOrder !==
                    undefined ||
                body.lesson_order !==
                    undefined
                    ? parsePositiveInteger(
                        body.lessonOrder ??
                        body.lesson_order,
                        existing.lesson_order || 0
                    )
                    : existing.lesson_order,

                body.duration !==
                    undefined ||
                body.durationMinutes !==
                    undefined ||
                body.duration_minutes !==
                    undefined
                    ? parsePositiveInteger(
                        body.duration ??
                        body.durationMinutes ??
                        body.duration_minutes,
                        existing.duration || 0
                    )
                    : existing.duration,

                body.xpReward !==
                    undefined ||
                body.xp_reward !==
                    undefined
                    ? parsePositiveInteger(
                        body.xpReward ??
                        body.xp_reward,
                        existing.xp_reward || 50
                    )
                    : existing.xp_reward,

                body.status !==
                    undefined
                    ? normalizeStatus(
                        body.status,
                        [
                            "published",
                            "draft",
                            "inactive"
                        ],
                        existing.status ||
                        "published"
                    )
                    : existing.status,

                id
            );

            const lesson =
                db.prepare(`
                    SELECT *
                    FROM lessons
                    WHERE id = ?
                `).get(
                    id
                );

            logAdminActivity(
                req,
                "UPDATE_LESSON",
                "lesson",
                id
            );

            return res.json({
                message:
                    "Lesson updated successfully.",
                lesson
            });
        } catch (error) {
            console.error(
                "Update lesson error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not update lesson."
            });
        }
    }
);

router.delete(
    "/lessons/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid lesson ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM lessons
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Lesson not found."
                });
            }

            const transaction =
                db.transaction(() => {
                    db.prepare(`
                        DELETE FROM exercises
                        WHERE lesson_id = ?
                    `).run(
                        id
                    );

                    db.prepare(`
                        DELETE FROM lesson_materials
                        WHERE lesson_id = ?
                    `).run(
                        id
                    );

                    db.prepare(`
                        DELETE FROM student_progress
                        WHERE lesson_id = ?
                    `).run(
                        id
                    );

                    db.prepare(`
                        DELETE FROM lessons
                        WHERE id = ?
                    `).run(
                        id
                    );
                });

            transaction();

            logAdminActivity(
                req,
                "DELETE_LESSON",
                "lesson",
                id
            );

            return res.json({
                message:
                    "Lesson deleted successfully."
            });
        } catch (error) {
            console.error(
                "Delete lesson error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not delete lesson."
            });
        }
    }
);

/* =========================================================
   TEACHERS
========================================================= */

router.get(
    "/teachers",
    authenticateAdmin,
    (req, res) => {
        try {
            const teachers =
                db.prepare(`
                    SELECT
                        t.*,
                        (
                            SELECT COUNT(*)
                            FROM teacher_classes tc
                            WHERE tc.teacher_id =
                                  t.id
                        ) AS class_count
                    FROM teachers t
                    ORDER BY
                        t.id DESC
                `).all();

            return res.json({
                teachers:
                    teachers.map(
                        omitTeacherSecretFields
                    )
            });
        } catch (error) {
            console.error(
                "Get teachers error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load teachers."
            });
        }
    }
);

router.get(
    "/teachers/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid teacher ID."
                });
            }

            const teacher =
                db.prepare(`
                    SELECT *
                    FROM teachers
                    WHERE id = ?
                `).get(
                    id
                );

            if (!teacher) {
                return res.status(404).json({
                    message:
                        "Teacher not found."
                });
            }

            const classes =
                db.prepare(`
                    SELECT
                        cl.*,
                        c.name AS course_name,
                        tc.is_primary,
                        tc.assigned_at
                    FROM teacher_classes tc
                    JOIN classes cl
                        ON cl.id =
                           tc.class_id
                    LEFT JOIN courses c
                        ON c.id =
                           cl.course_id
                    WHERE tc.teacher_id = ?
                    ORDER BY
                        cl.id DESC
                `).all(
                    id
                );

            return res.json({
                teacher:
                    omitTeacherSecretFields(
                        teacher
                    ),
                classes
            });
        } catch (error) {
            console.error(
                "Get teacher error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load teacher."
            });
        }
    }
);

router.post(
    "/teachers",
    authenticateAdmin,
    async (req, res) => {
        try {
            const body =
                req.body || {};

            const fullName =
                String(
                    body.fullName ??
                    body.full_name ??
                    ""
                ).trim();

            const email =
                String(
                    body.email ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            if (!fullName) {
                return res.status(400).json({
                    message:
                        "Full name is required."
                });
            }

            if (
                !email ||
                !isValidEmail(
                    email
                )
            ) {
                return res.status(400).json({
                    message:
                        "A valid email address is required."
                });
            }

            const duplicate =
                db.prepare(`
                    SELECT id
                    FROM teachers
                    WHERE email = ?
                `).get(
                    email
                );

            if (duplicate) {
                return res.status(409).json({
                    message:
                        "A teacher with this email already exists."
                });
            }

            const passwordHash =
                await bcrypt.hash(
                    String(
                        body.password ||
                        "teacher123"
                    ),
                    10
                );

            const result =
                db.prepare(`
                    INSERT INTO teachers
                    (
                        full_name,
                        first_name,
                        last_name,
                        email,
                        phone,
                        password_hash,
                        profile_photo,
                        specialization,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    fullName,
                    body.firstName ??
                        body.first_name ??
                        null,
                    body.lastName ??
                        body.last_name ??
                        null,
                    email,
                    body.phone ??
                        null,
                    passwordHash,
                    body.profilePhoto ??
                        body.profile_photo ??
                        null,
                    body.specialization ??
                        null,
                    normalizeStatus(
                        body.status,
                        [
                            "active",
                            "inactive",
                            "suspended"
                        ],
                        "active"
                    )
                );

            const teacher =
                db.prepare(`
                    SELECT *
                    FROM teachers
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            logAdminActivity(
                req,
                "CREATE_TEACHER",
                "teacher",
                result.lastInsertRowid,
                `Created teacher ${fullName}.`
            );

            return res.status(201).json({
                message:
                    "Teacher created successfully.",
                teacher:
                    omitTeacherSecretFields(
                        teacher
                    )
            });
        } catch (error) {
            console.error(
                "Create teacher error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create teacher."
            });
        }
    }
);

router.patch(
    "/teachers/:id",
    authenticateAdmin,
    async (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid teacher ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM teachers
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Teacher not found."
                });
            }

            const body =
                req.body || {};

            const fullName =
                body.fullName !==
                    undefined ||
                body.full_name !==
                    undefined
                    ? String(
                        body.fullName ??
                        body.full_name
                    ).trim()
                    : existing.full_name;

            const email =
                body.email !==
                    undefined
                    ? String(
                        body.email
                    )
                        .trim()
                        .toLowerCase()
                    : existing.email;

            if (
                !email ||
                !isValidEmail(
                    email
                )
            ) {
                return res.status(400).json({
                    message:
                        "A valid email address is required."
                });
            }

            const duplicate =
                db.prepare(`
                    SELECT id
                    FROM teachers
                    WHERE email = ?
                      AND id != ?
                `).get(
                    email,
                    id
                );

            if (duplicate) {
                return res.status(409).json({
                    message:
                        "Another teacher already uses this email."
                });
            }

            let passwordHash =
                existing.password_hash;

            if (
                body.password !==
                    undefined &&
                String(
                    body.password
                ).trim()
            ) {
                passwordHash =
                    await bcrypt.hash(
                        String(
                            body.password
                        ),
                        10
                    );
            }

            db.prepare(`
                UPDATE teachers
                SET
                    full_name = ?,
                    first_name = ?,
                    last_name = ?,
                    email = ?,
                    phone = ?,
                    password_hash = ?,
                    profile_photo = ?,
                    specialization = ?,
                    status = ?,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                fullName,

                body.firstName !==
                    undefined ||
                body.first_name !==
                    undefined
                    ? (
                        body.firstName ??
                        body.first_name
                    )
                    : existing.first_name,

                body.lastName !==
                    undefined ||
                body.last_name !==
                    undefined
                    ? (
                        body.lastName ??
                        body.last_name
                    )
                    : existing.last_name,

                email,

                body.phone !==
                    undefined
                    ? body.phone
                    : existing.phone,

                passwordHash,

                body.profilePhoto !==
                    undefined ||
                body.profile_photo !==
                    undefined
                    ? (
                        body.profilePhoto ??
                        body.profile_photo
                    )
                    : existing.profile_photo,

                body.specialization !==
                    undefined
                    ? body.specialization
                    : existing.specialization,

                body.status !==
                    undefined
                    ? normalizeStatus(
                        body.status,
                        [
                            "active",
                            "inactive",
                            "suspended"
                        ],
                        existing.status ||
                        "active"
                    )
                    : existing.status,

                id
            );

            const teacher =
                db.prepare(`
                    SELECT *
                    FROM teachers
                    WHERE id = ?
                `).get(
                    id
                );

            logAdminActivity(
                req,
                "UPDATE_TEACHER",
                "teacher",
                id
            );

            return res.json({
                message:
                    "Teacher updated successfully.",
                teacher:
                    omitTeacherSecretFields(
                        teacher
                    )
            });
        } catch (error) {
            console.error(
                "Update teacher error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not update teacher."
            });
        }
    }
);

router.delete(
    "/teachers/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid teacher ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM teachers
                    WHERE id = ?
                `).get(
                    id
                );

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Teacher not found."
                });
            }

            db.prepare(`
                UPDATE teachers
                SET
                    status = 'inactive',
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                id
            );

            logAdminActivity(
                req,
                "DEACTIVATE_TEACHER",
                "teacher",
                id
            );

            return res.json({
                message:
                    "Teacher deactivated successfully."
            });
        } catch (error) {
            console.error(
                "Deactivate teacher error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not deactivate teacher."
            });
        }
    }
);

router.patch(
    "/teachers/:id/deactivate",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(
                    req.params.id
                );

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid teacher ID."
                });
            }

            const result =
                db.prepare(`
                    UPDATE teachers
                    SET
                        status = 'inactive',
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(
                    id
                );

            if (!result.changes) {
                return res.status(404).json({
                    message:
                        "Teacher not found."
                });
            }

            logAdminActivity(
                req,
                "DEACTIVATE_TEACHER",
                "teacher",
                id
            );

            return res.json({
                message:
                    "Teacher deactivated successfully."
            });
        } catch (error) {
            console.error(
                "Deactivate teacher error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not deactivate teacher."
            });
        }
    }
);

    /* =========================================================
    END PART 1
    ========================================================= */
        


    router.delete(
        "/teachers/:id",
        authenticateAdmin,
        (req, res) => {
            try {
                const id =
                    validId(req.params.id);

                if (!id) {
                    return res.status(400).json({
                        message:
                            "Invalid teacher ID."
                    });
                }

                const result =
                    db.prepare(`
                        UPDATE teachers
                        SET
                            status = 'inactive',
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `).run(id);

                if (!result.changes) {
                    return res.status(404).json({
                        message:
                            "Teacher not found."
                    });
                }

                logAdminActivity(
                    req,
                    "DEACTIVATE_TEACHER",
                    "teacher",
                    id
                );

                return res.json({
                    message:
                        "Teacher deactivated successfully."
                });
            } catch (error) {
                console.error(
                    "Delete teacher error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not deactivate teacher."
                });
            }
        }
    );

    router.patch(
        "/teachers/:id/deactivate",
        authenticateAdmin,
        (req, res) => {
            try {
                const id =
                    validId(req.params.id);

                if (!id) {
                    return res.status(400).json({
                        message:
                            "Invalid teacher ID."
                    });
                }

                const result =
                    db.prepare(`
                        UPDATE teachers
                        SET
                            status = 'inactive',
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `).run(id);

                if (!result.changes) {
                    return res.status(404).json({
                        message:
                            "Teacher not found."
                    });
                }

                logAdminActivity(
                    req,
                    "DEACTIVATE_TEACHER",
                    "teacher",
                    id
                );

                return res.json({
                    message:
                        "Teacher deactivated successfully."
                });
            } catch (error) {
                console.error(
                    "Deactivate teacher error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not deactivate teacher."
                });
            }
        }
    );

    /* =========================================================
    TEACHER / CLASS ASSIGNMENTS
    ========================================================= */

    router.get(
        "/teachers/:teacherId/classes",
        authenticateAdmin,
        (req, res) => {
            try {
                const teacherId =
                    validId(
                        req.params.teacherId
                    );

                if (!teacherId) {
                    return res.status(400).json({
                        message:
                            "Invalid teacher ID."
                    });
                }

                const classes =
                    db.prepare(`
                        SELECT
                            tc.id AS assignment_id,
                            tc.teacher_id,
                            tc.class_id,
                            tc.is_primary,
                            tc.assigned_at,
                            cl.name,
                            cl.level,
                            cl.course_id,
                            cl.room,
                            cl.schedule,
                            cl.status,
                            c.name AS course_name,
                            c.level AS course_level,
                            (
                                SELECT COUNT(*)
                                FROM enrollments e
                                WHERE e.class_id = cl.id
                                AND e.status = 'active'
                            ) AS student_count
                        FROM teacher_classes tc
                        JOIN classes cl
                            ON cl.id = tc.class_id
                        LEFT JOIN courses c
                            ON c.id = cl.course_id
                        WHERE tc.teacher_id = ?
                        ORDER BY cl.id DESC
                    `).all(teacherId);

                return res.json({
                    classes
                });
            } catch (error) {
                console.error(
                    "Get teacher classes error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not load teacher classes."
                });
            }
        }
    );

    router.post(
        "/teachers/:teacherId/classes",
        authenticateAdmin,
        (req, res) => {
            try {
                const teacherId =
                    validId(
                        req.params.teacherId
                    );

                const classId =
                    validId(
                        req.body?.classId
                    );

                const isPrimary =
                    req.body?.isPrimary !== undefined
                        ? (
                            req.body.isPrimary
                                ? 1
                                : 0
                        )
                        : 1;

                if (!teacherId || !classId) {
                    return res.status(400).json({
                        message:
                            "Valid teacher and class IDs are required."
                    });
                }

                const teacher =
                    db.prepare(`
                        SELECT id
                        FROM teachers
                        WHERE id = ?
                    `).get(teacherId);

                if (!teacher) {
                    return res.status(404).json({
                        message:
                            "Teacher not found."
                    });
                }

                const classInfo =
                    db.prepare(`
                        SELECT id
                        FROM classes
                        WHERE id = ?
                    `).get(classId);

                if (!classInfo) {
                    return res.status(404).json({
                        message:
                            "Class not found."
                    });
                }

                const existing =
                    db.prepare(`
                        SELECT id
                        FROM teacher_classes
                        WHERE teacher_id = ?
                        AND class_id = ?
                    `).get(
                        teacherId,
                        classId
                    );

                if (existing) {
                    if (isPrimary) {
                        db.prepare(`
                            UPDATE teacher_classes
                            SET is_primary = 0
                            WHERE class_id = ?
                        `).run(classId);
                    }

                    db.prepare(`
                        UPDATE teacher_classes
                        SET is_primary = ?
                        WHERE id = ?
                    `).run(
                        isPrimary,
                        existing.id
                    );

                    logAdminActivity(
                        req,
                        "UPDATE_TEACHER_CLASS_ASSIGNMENT",
                        "teacher_class",
                        existing.id
                    );

                    return res.json({
                        message:
                            "Teacher class assignment updated successfully.",
                        assignment: {
                            id: existing.id,
                            teacherId,
                            classId,
                            isPrimary
                        }
                    });
                }

                /*
                * Keep the class's primary teacher unambiguous.
                * A class may have multiple teachers, but only one
                * assignment should be marked as primary.
                */
                const assignTeacher =
                    db.transaction(() => {
                        if (isPrimary) {
                            db.prepare(`
                                UPDATE teacher_classes
                                SET is_primary = 0
                                WHERE class_id = ?
                            `).run(classId);
                        }

                        return db.prepare(`
                            INSERT INTO teacher_classes
                            (
                                teacher_id,
                                class_id,
                                is_primary
                            )
                            VALUES (?, ?, ?)
                        `).run(
                            teacherId,
                            classId,
                            isPrimary
                        );
                    });

                const result = assignTeacher();

                logAdminActivity(
                    req,
                    "ASSIGN_TEACHER_CLASS",
                    "teacher_class",
                    result.lastInsertRowid
                );

                const savedAssignment =
                    db.prepare(`
                        SELECT
                            tc.id AS assignment_id,
                            tc.teacher_id,
                            tc.class_id,
                            tc.is_primary,
                            tc.assigned_at,
                            t.full_name AS teacher_name,
                            cl.name AS class_name
                        FROM teacher_classes tc
                        JOIN teachers t
                            ON t.id = tc.teacher_id
                        JOIN classes cl
                            ON cl.id = tc.class_id
                        WHERE tc.id = ?
                    `).get(result.lastInsertRowid);

                return res.status(201).json({
                    message:
                        "Teacher assigned to class successfully.",
                    assignment: savedAssignment
                });
            } catch (error) {
                console.error(
                    "Assign teacher class error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not assign teacher to class."
                });
            }
        }
    );

    router.delete(
        "/teachers/:teacherId/classes/:classId",
        authenticateAdmin,
        (req, res) => {
            try {
                const teacherId =
                    validId(
                        req.params.teacherId
                    );

                const classId =
                    validId(
                        req.params.classId
                    );

                if (!teacherId || !classId) {
                    return res.status(400).json({
                        message:
                            "Valid teacher and class IDs are required."
                    });
                }

                const result =
                    db.prepare(`
                        DELETE FROM teacher_classes
                        WHERE teacher_id = ?
                        AND class_id = ?
                    `).run(
                        teacherId,
                        classId
                    );

                if (!result.changes) {
                    return res.status(404).json({
                        message:
                            "Teacher class assignment not found."
                    });
                }

                logAdminActivity(
                    req,
                    "REMOVE_TEACHER_CLASS",
                    "teacher_class",
                    null
                );

                return res.json({
                    message:
                        "Teacher removed from class successfully."
                });
            } catch (error) {
                console.error(
                    "Remove teacher class error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not remove teacher from class."
                });
            }
        }
    );

    /* =========================================================
    CLASSES
    ========================================================= */

    router.get(
        "/classes",
        authenticateAdmin,
        (req, res) => {
            try {
                const classes =
                    db.prepare(`
                        SELECT
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
                                FROM teacher_classes tc
                                WHERE tc.class_id = cl.id
                            ) AS teacher_count,
                            (
                                SELECT tc.teacher_id
                                FROM teacher_classes tc
                                WHERE tc.class_id = cl.id
                                ORDER BY
                                    tc.is_primary DESC,
                                    tc.id DESC
                                LIMIT 1
                            ) AS teacher_id,
                            (
                                SELECT t.full_name
                                FROM teacher_classes tc
                                JOIN teachers t
                                    ON t.id = tc.teacher_id
                                WHERE tc.class_id = cl.id
                                ORDER BY
                                    tc.is_primary DESC,
                                    tc.id DESC
                                LIMIT 1
                            ) AS teacher_name,
                            (
                                SELECT tc.teacher_id
                                FROM teacher_classes tc
                                WHERE tc.class_id = cl.id
                                ORDER BY
                                    tc.is_primary DESC,
                                    tc.id DESC
                                LIMIT 1
                            ) AS "teacherId",
                            (
                                SELECT t.full_name
                                FROM teacher_classes tc
                                JOIN teachers t
                                    ON t.id = tc.teacher_id
                                WHERE tc.class_id = cl.id
                                ORDER BY
                                    tc.is_primary DESC,
                                    tc.id DESC
                                LIMIT 1
                            ) AS "teacherName"
                        FROM classes cl
                        LEFT JOIN courses c
                            ON c.id = cl.course_id
                        ORDER BY cl.id DESC
                    `).all();

                return res.json({
                    classes
                });
            } catch (error) {
                console.error(
                    "Get classes error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not load classes."
                });
            }
        }
    );

    router.get(
        "/classes/:id",
        authenticateAdmin,
        (req, res) => {
            try {
                const id =
                    validId(req.params.id);

                if (!id) {
                    return res.status(400).json({
                        message:
                            "Invalid class ID."
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
                    `).get(id);

                if (!classInfo) {
                    return res.status(404).json({
                        message:
                            "Class not found."
                    });
                }

                const teachers =
                    db.prepare(`
                        SELECT
                            t.id,
                            t.full_name,
                            t.first_name,
                            t.last_name,
                            t.email,
                            t.phone,
                            t.specialization,
                            t.status,
                            tc.is_primary,
                            tc.assigned_at
                        FROM teacher_classes tc
                        JOIN teachers t
                            ON t.id = tc.teacher_id
                        WHERE tc.class_id = ?
                        ORDER BY
                            tc.is_primary DESC,
                            t.full_name ASC
                    `).all(id);

                const students =
                    db.prepare(`
                        SELECT
                            s.id,
                            s.full_name,
                            s.email,
                            s.phone,
                            s.level,
                            s.payment_status,
                            s.account_status,
                            e.id AS enrollment_id,
                            e.enrollment_date,
                            e.status AS enrollment_status,
                            e.completion_date,
                            e.notes
                        FROM enrollments e
                        JOIN students s
                            ON s.id = e.student_id
                        WHERE e.class_id = ?
                        ORDER BY s.full_name ASC
                    `).all(id);

                return res.json({
                    class: classInfo,
                    teachers,
                    students:
                        students.map(
                            omitSecretFields
                        )
                });
            } catch (error) {
                console.error(
                    "Get class details error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not load class details."
                });
            }
        }
    );

    router.post(
        "/classes",
        authenticateAdmin,
        (req, res) => {
            try {
                const {
                    name,
                    courseId,
                    level,
                    description = "",
                    room = null,
                    schedule = null,
                    startDate = null,
                    endDate = null,
                    maxStudents = 30,
                    status = "active"
                } = req.body || {};

                if (
                    !name ||
                    !String(name).trim()
                ) {
                    return res.status(400).json({
                        message:
                            "Class name is required."
                    });
                }

                const normalizedCourseId =
                    validId(courseId);

                if (!normalizedCourseId) {
                    return res.status(400).json({
                        message:
                            "A valid course ID is required."
                    });
                }

                const course =
                    db.prepare(`
                        SELECT
                            id,
                            level
                        FROM courses
                        WHERE id = ?
                    `).get(
                        normalizedCourseId
                    );

                if (!course) {
                    return res.status(404).json({
                        message:
                            "Course not found."
                    });
                }

                const finalLevel =
                    String(
                        level ||
                        course.level ||
                        ""
                    ).trim();

                if (!finalLevel) {
                    return res.status(400).json({
                        message:
                            "Class level is required."
                    });
                }

                const result =
                    db.prepare(`
                        INSERT INTO classes
                        (
                            name,
                            course_id,
                            level,
                            description,
                            room,
                            schedule,
                            start_date,
                            end_date,
                            max_students,
                            status
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        String(name).trim(),
                        normalizedCourseId,
                        finalLevel,
                        String(
                            description || ""
                        ).trim(),
                        room || null,
                        schedule || null,
                        startDate || null,
                        endDate || null,
                        parsePositiveInteger(
                            maxStudents,
                            30
                        ),
                        normalizeStatus(
                            status,
                            [
                                "active",
                                "inactive"
                            ],
                            "active"
                        )
                    );

                const classInfo =
                    db.prepare(`
                        SELECT *
                        FROM classes
                        WHERE id = ?
                    `).get(
                        result.lastInsertRowid
                    );

                logAdminActivity(
                    req,
                    "CREATE_CLASS",
                    "class",
                    result.lastInsertRowid
                );

                return res.status(201).json({
                    message:
                        "Class created successfully.",
                    class: classInfo
                });
            } catch (error) {
                console.error(
                    "Create class error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not create class."
                });
            }
        }
    );

    router.patch(
        "/classes/:id",
        authenticateAdmin,
        (req, res) => {
            try {
                const id =
                    validId(req.params.id);

                if (!id) {
                    return res.status(400).json({
                        message:
                            "Invalid class ID."
                    });
                }

                const existing =
                    db.prepare(`
                        SELECT *
                        FROM classes
                        WHERE id = ?
                    `).get(id);

                if (!existing) {
                    return res.status(404).json({
                        message:
                            "Class not found."
                    });
                }

                const body =
                    req.body ||
                    {};

                const courseId =
                    body.courseId !== undefined ||
                    body.course_id !== undefined
                        ? validId(
                            body.courseId ??
                            body.course_id
                        )
                        : existing.course_id;

                if (!courseId) {
                    return res.status(400).json({
                        message:
                            "A valid course ID is required."
                    });
                }

                const course =
                    db.prepare(`
                        SELECT
                            id,
                            level
                        FROM courses
                        WHERE id = ?
                    `).get(courseId);

                if (!course) {
                    return res.status(404).json({
                        message:
                            "Course not found."
                    });
                }

                db.prepare(`
                    UPDATE classes
                    SET
                        name = ?,
                        course_id = ?,
                        level = ?,
                        description = ?,
                        room = ?,
                        schedule = ?,
                        start_date = ?,
                        end_date = ?,
                        max_students = ?,
                        status = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(
                    body.name !== undefined
                        ? String(
                            body.name
                        ).trim()
                        : existing.name,
                    courseId,
                    body.level !== undefined
                        ? String(
                            body.level
                        ).trim()
                        : existing.level ||
                            course.level,
                    body.description !== undefined
                        ? String(
                            body.description
                        ).trim()
                        : existing.description,
                    body.room !== undefined
                        ? body.room
                        : existing.room,
                    body.schedule !== undefined
                        ? body.schedule
                        : existing.schedule,
                    body.startDate !== undefined ||
                    body.start_date !== undefined
                        ? (
                            body.startDate ??
                            body.start_date
                        )
                        : existing.start_date,
                    body.endDate !== undefined ||
                    body.end_date !== undefined
                        ? (
                            body.endDate ??
                            body.end_date
                        )
                        : existing.end_date,
                    body.maxStudents !== undefined ||
                    body.max_students !== undefined
                        ? parsePositiveInteger(
                            body.maxStudents ??
                            body.max_students,
                            existing.max_students
                        )
                        : existing.max_students,
                    body.status !== undefined
                        ? normalizeStatus(
                            body.status,
                            [
                                "active",
                                "inactive",
                                "completed",
                                "draft"
                            ],
                            existing.status
                        )
                        : existing.status,
                    id
                );

                const classInfo =
                    db.prepare(`
                        SELECT *
                        FROM classes
                        WHERE id = ?
                    `).get(id);

                logAdminActivity(
                    req,
                    "UPDATE_CLASS",
                    "class",
                    id
                );

                return res.json({
                    message:
                        "Class updated successfully.",
                    class: classInfo
                });
            } catch (error) {
                console.error(
                    "Update class error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not update class."
                });
            }
        }
    );

    router.delete(
        "/classes/:id",
        authenticateAdmin,
        (req, res) => {
            try {
                const id =
                    validId(req.params.id);

                if (!id) {
                    return res.status(400).json({
                        message:
                            "Invalid class ID."
                    });
                }

                const result =
                    db.prepare(`
                        UPDATE classes
                        SET
                            status = 'inactive',
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    `).run(id);

                if (!result.changes) {
                    return res.status(404).json({
                        message:
                            "Class not found."
                    });
                }

                logAdminActivity(
                    req,
                    "DEACTIVATE_CLASS",
                    "class",
                    id
                );

                return res.json({
                    message:
                        "Class deactivated successfully."
                });
            } catch (error) {
                console.error(
                    "Delete class error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not deactivate class."
                });
            }
        }
    );

    /* =========================================================
    CLASS ENROLLMENTS
    ========================================================= */

    router.get(
        "/classes/:classId/students",
        authenticateAdmin,
        (req, res) => {
            try {
                const classId =
                    validId(
                        req.params.classId
                    );

                if (!classId) {
                    return res.status(400).json({
                        message:
                            "Invalid class ID."
                    });
                }

                const students =
                    db.prepare(`
                        SELECT
                            e.id AS enrollment_id,
                            e.student_id,
                            e.class_id,
                            e.enrollment_date,
                            e.status AS enrollment_status,
                            e.completion_date,
                            e.notes,
                            s.full_name,
                            s.email,
                            s.phone,
                            s.level,
                            s.payment_status,
                            s.account_status
                        FROM enrollments e
                        JOIN students s
                            ON s.id = e.student_id
                        WHERE e.class_id = ?
                        ORDER BY s.full_name ASC
                    `).all(classId);

                return res.json({
                    students:
                        students.map(
                            omitSecretFields
                        )
                });
            } catch (error) {
                console.error(
                    "Get class students error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not load class students."
                });
            }
        }
    );

    router.post(
        "/classes/:classId/students",
        authenticateAdmin,
        (req, res) => {
            try {
                const classId =
                    validId(
                        req.params.classId
                    );

                const studentId =
                    validId(
                        req.body?.studentId ??
                        req.body?.student_id
                    );

                if (!classId || !studentId) {
                    return res.status(400).json({
                        message:
                            "Valid class and student IDs are required."
                    });
                }

                const classInfo =
                    db.prepare(`
                        SELECT *
                        FROM classes
                        WHERE id = ?
                    `).get(classId);

                if (!classInfo) {
                    return res.status(404).json({
                        message:
                            "Class not found."
                    });
                }

                const student =
                    db.prepare(`
                        SELECT id
                        FROM students
                        WHERE id = ?
                    `).get(studentId);

                if (!student) {
                    return res.status(404).json({
                        message:
                            "Student not found."
                    });
                }

                const duplicate =
                    db.prepare(`
                        SELECT *
                        FROM enrollments
                        WHERE student_id = ?
                        AND class_id = ?
                    `).get(
                        studentId,
                        classId
                    );

                if (duplicate) {
                    if (
                        String(
                            duplicate.status
                        ).toLowerCase() ===
                        "active"
                    ) {
                        return res.status(409).json({
                            message:
                                "Student is already enrolled in this class."
                        });
                    }

                    db.prepare(`
                        UPDATE enrollments
                        SET
                            status = 'active',
                            enrollment_date = ?,
                            completion_date = NULL,
                            notes = ?
                        WHERE id = ?
                    `).run(
                        req.body?.enrollmentDate ??
                        req.body?.enrollment_date ??
                        getKigaliDate(),
                        req.body?.notes ??
                        null,
                        duplicate.id
                    );

                    logAdminActivity(
                        req,
                        "REACTIVATE_ENROLLMENT",
                        "enrollment",
                        duplicate.id
                    );

                    return res.json({
                        message:
                            "Student enrollment reactivated successfully.",
                        enrollment: {
                            id:
                                duplicate.id,
                            studentId,
                            classId,
                            status:
                                "active"
                        }
                    });
                }

                const count =
                    db.prepare(`
                        SELECT COUNT(*) AS count
                        FROM enrollments
                        WHERE class_id = ?
                        AND status = 'active'
                    `).get(classId).count;

                if (
                    Number(count) >=
                    Number(
                        classInfo.max_students
                    )
                ) {
                    return res.status(409).json({
                        message:
                            "This class has reached its maximum capacity."
                    });
                }

                const result =
                    db.prepare(`
                        INSERT INTO enrollments
                        (
                            student_id,
                            class_id,
                            enrollment_date,
                            status,
                            notes
                        )
                        VALUES (?, ?, ?, 'active', ?)
                    `).run(
                        studentId,
                        classId,
                        req.body?.enrollmentDate ||
                            getKigaliDate(),
                        req.body?.notes ||
                            null
                    );

                logAdminActivity(
                    req,
                    "ENROLL_STUDENT",
                    "enrollment",
                    result.lastInsertRowid
                );

                return res.status(201).json({
                    message:
                        "Student enrolled successfully.",
                    enrollment: {
                        id:
                            result.lastInsertRowid,
                        studentId,
                        classId
                    }
                });
            } catch (error) {
                console.error(
                    "Enroll student error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not enroll student."
                });
            }
        }
    );

    router.delete(
        "/classes/:classId/students/:studentId",
        authenticateAdmin,
        (req, res) => {
            try {
                const classId =
                    validId(
                        req.params.classId
                    );

                const studentId =
                    validId(
                        req.params.studentId
                    );

                if (!classId || !studentId) {
                    return res.status(400).json({
                        message:
                            "Valid class and student IDs are required."
                    });
                }

                const result =
                    db.prepare(`
                        UPDATE enrollments
                        SET
                            status = 'inactive',
                            completion_date = NULL
                        WHERE class_id = ?
                        AND student_id = ?
                        AND status = 'active'
                    `).run(
                        classId,
                        studentId
                    );

                if (!result.changes) {
                    return res.status(404).json({
                        message:
                            "Active enrollment not found."
                    });
                }

                const enrollment =
                    db.prepare(`
                        SELECT *
                        FROM enrollments
                        WHERE class_id = ?
                        AND student_id = ?
                        ORDER BY id DESC
                        LIMIT 1
                    `).get(
                        classId,
                        studentId
                    );

                logAdminActivity(
                    req,
                    "REMOVE_STUDENT_FROM_CLASS",
                    "enrollment",
                    enrollment
                        ? enrollment.id
                        : null
                );

                return res.json({
                    message:
                        "Student removed from class successfully.",
                    enrollment
                });
            } catch (error) {
                console.error(
                    "Remove student class error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not remove student from class."
                });
            }
        }
    );

    /* =========================================================
    ATTENDANCE CODES
    ========================================================= */

    router.post(
        "/attendance/codes",
        authenticateAdmin,
        (req, res) => {
            try {
                const {
                    courseId =
                        req.body?.courseId ??
                        req.body?.course_id ??
                        null,
                    classId =
                        req.body?.classId ??
                        req.body?.class_id ??
                        null,
                    level = null,
                    code,
                    attendanceDate =
                        req.body?.attendanceDate ??
                        req.body?.attendance_date ??
                        getKigaliDate(),
                    expiresAt =
                        req.body?.expiresAt ??
                        req.body?.expires_at ??
                        null
                } = req.body || {};

                const normalizedCourseId =
                    normalizeNullableId(
                        courseId
                    );

                const normalizedClassId =
                    normalizeNullableId(
                        classId
                    );

                if (
                    !normalizedCourseId &&
                    !normalizedClassId
                ) {
                    return res.status(400).json({
                        message:
                            "Course ID or class ID is required."
                    });
                }

                if (normalizedCourseId) {
                    const course =
                        db.prepare(`
                            SELECT
                                id,
                                level
                            FROM courses
                            WHERE id = ?
                        `).get(
                            normalizedCourseId
                        );

                    if (!course) {
                        return res.status(404).json({
                            message:
                                "Course not found."
                        });
                    }
                }

                if (normalizedClassId) {
                    const classInfo =
                        db.prepare(`
                            SELECT
                                id,
                                course_id,
                                level
                            FROM classes
                            WHERE id = ?
                        `).get(
                            normalizedClassId
                        );

                    if (!classInfo) {
                        return res.status(404).json({
                            message:
                                "Class not found."
                        });
                    }
                }

                const finalCode =
                    String(
                        code || ""
                    ).trim() ||
                    generateRandomCode(6);

                const duplicate =
                    db.prepare(`
                        SELECT id
                        FROM attendance_codes
                        WHERE code = ?
                    `).get(finalCode);

                if (duplicate) {
                    return res.status(409).json({
                        message:
                            "This attendance code already exists."
                    });
                }

                db.prepare(`
                    UPDATE attendance_codes
                    SET status = 'inactive'
                    WHERE attendance_date = ?
                    AND status = 'active'
                    AND (
                            (? IS NOT NULL AND class_id = ?)
                            OR
                            (? IS NOT NULL AND course_id = ?)
                    )
                `).run(
                    attendanceDate,
                    normalizedClassId,
                    normalizedClassId,
                    normalizedCourseId,
                    normalizedCourseId
                );

                const result =
                    db.prepare(`
                        INSERT INTO attendance_codes
                        (
                            code,
                            course_id,
                            class_id,
                            level,
                            attendance_date,
                            expires_at,
                            status
                        )
                        VALUES (?, ?, ?, ?, ?, ?, 'active')
                    `).run(
                        finalCode,
                        normalizedCourseId,
                        normalizedClassId,
                        level || null,
                        attendanceDate,
                        expiresAt || null
                    );

                const saved =
                    db.prepare(`
                        SELECT
                            ac.*,
                            c.name AS course_name,
                            cl.name AS class_name
                        FROM attendance_codes ac
                        LEFT JOIN courses c
                            ON c.id = ac.course_id
                        LEFT JOIN classes cl
                            ON cl.id = ac.class_id
                        WHERE ac.id = ?
                    `).get(
                        result.lastInsertRowid
                    );

                logAdminActivity(
                    req,
                    "CREATE_ATTENDANCE_CODE",
                    "attendance_code",
                    result.lastInsertRowid
                );

                return res.status(201).json({
                    message:
                        "Attendance code created successfully.",
                    code: saved
                });
            } catch (error) {
                console.error(
                    "Create attendance code error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not create attendance code."
                });
            }
        }
    );

    router.get(
        "/attendance/codes",
        authenticateAdmin,
        (req, res) => {
            try {
                const codes =
                    db.prepare(`
                        SELECT
                            ac.*,
                            c.name AS course_name,
                            c.level AS course_level,
                            cl.name AS class_name,
                            cl.level AS class_level
                        FROM attendance_codes ac
                        LEFT JOIN courses c
                            ON c.id = ac.course_id
                        LEFT JOIN classes cl
                            ON cl.id = ac.class_id
                        ORDER BY
                            ac.attendance_date DESC,
                            ac.id DESC
                    `).all();

                return res.json({
                    codes
                });
            } catch (error) {
                console.error(
                    "Get attendance codes error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not load attendance codes."
                });
            }
        }
    );

    router.patch(
        "/attendance/codes/:id",
        authenticateAdmin,
        (req, res) => {
            try {
                const id =
                    validId(req.params.id);

                if (!id) {
                    return res.status(400).json({
                        message:
                            "Invalid attendance code ID."
                    });
                }

                const existing =
                    db.prepare(`
                        SELECT *
                        FROM attendance_codes
                        WHERE id = ?
                    `).get(id);

                if (!existing) {
                    return res.status(404).json({
                        message:
                            "Attendance code not found."
                    });
                }

                db.prepare(`
                    UPDATE attendance_codes
                    SET
                        status = ?,
                        expires_at = ?
                    WHERE id = ?
                `).run(
                    req.body?.status !== undefined
                        ? normalizeStatus(
                            req.body.status,
                            [
                                "active",
                                "inactive"
                            ],
                            existing.status
                        )
                        : existing.status,
                    req.body?.expiresAt !== undefined ||
                    req.body?.expires_at !== undefined
                        ? (
                            req.body?.expiresAt ??
                            req.body?.expires_at
                        )
                        : existing.expires_at,
                    id
                );

                const code =
                    db.prepare(`
                        SELECT *
                        FROM attendance_codes
                        WHERE id = ?
                    `).get(id);

                logAdminActivity(
                    req,
                    "UPDATE_ATTENDANCE_CODE",
                    "attendance_code",
                    id
                );

                return res.json({
                    message:
                        "Attendance code updated successfully.",
                    code
                });
            } catch (error) {
                console.error(
                    "Update attendance code error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not update attendance code."
                });
            }
        }
    );

    /* =========================================================
    ATTENDANCE
    ========================================================= */

    router.get(
        "/attendance/today",
        authenticateAdmin,
        (req, res) => {
            try {
                const date =
                    req.query.date ||
                    getKigaliDate();

                const attendance =
                    db.prepare(`
                        SELECT
                            a.*,
                            s.full_name AS student_name,
                            s.email,
                            c.name AS course_name,
                            cl.name AS class_name,
                            t.full_name AS marked_by_teacher_name
                        FROM attendance a
                        JOIN students s
                            ON s.id = a.student_id
                        LEFT JOIN courses c
                            ON c.id = a.course_id
                        LEFT JOIN classes cl
                            ON cl.id = a.class_id
                        LEFT JOIN teachers t
                            ON t.id =
                                a.marked_by_teacher_id
                        WHERE a.attendance_date = ?
                        ORDER BY
                            s.full_name ASC
                    `).all(date);

                return res.json({
                    date,
                    attendance
                });
            } catch (error) {
                console.error(
                    "Get today's attendance error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not load attendance."
                });
            }
        }
    );

    router.get(
        "/attendance/history",
        authenticateAdmin,
        (req, res) => {
            try {
                const {
                    studentId,
                    student_id,
                    classId,
                    class_id,
                    courseId,
                    course_id,
                    from,
                    to
                } = req.query || {};

                const resolvedStudentId =
                    studentId ??
                    student_id;

                const resolvedClassId =
                    classId ??
                    class_id;

                const resolvedCourseId =
                    courseId ??
                    course_id;

                let sql = `
                    SELECT
                        a.*,
                        s.full_name AS student_name,
                        s.email,
                        c.name AS course_name,
                        cl.name AS class_name,
                        t.full_name AS marked_by_teacher_name
                    FROM attendance a
                    JOIN students s
                        ON s.id = a.student_id
                    LEFT JOIN courses c
                        ON c.id = a.course_id
                    LEFT JOIN classes cl
                        ON cl.id = a.class_id
                    LEFT JOIN teachers t
                        ON t.id =
                            a.marked_by_teacher_id
                    WHERE 1 = 1
                `;

                const params = [];

                if (validId(resolvedStudentId)) {
                    sql += `
                        AND a.student_id = ?
                    `;

                    params.push(
                        validId(
                            resolvedStudentId
                        )
                    );
                }

                if (validId(resolvedClassId)) {
                    sql += `
                        AND a.class_id = ?
                    `;

                    params.push(
                        validId(
                            resolvedClassId
                        )
                    );
                }

                if (validId(resolvedCourseId)) {
                    sql += `
                        AND a.course_id = ?
                    `;

                    params.push(
                        validId(
                            resolvedCourseId
                        )
                    );
                }

                if (from) {
                    sql += `
                        AND a.attendance_date >= ?
                    `;

                    params.push(from);
                }

                if (to) {
                    sql += `
                        AND a.attendance_date <= ?
                    `;

                    params.push(to);
                }

                sql += `
                    ORDER BY
                        a.attendance_date DESC,
                        a.id DESC
                `;

                const attendance =
                    db.prepare(sql).all(
                        ...params
                    );

                return res.json({
                    attendance
                });
            } catch (error) {
                console.error(
                    "Get attendance history error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not load attendance history."
                });
            }
        }
    );

    router.post(
        "/attendance/mark",
        authenticateAdmin,
        (req, res) => {
            try {
                const studentId =
                    req.body?.studentId ??
                    req.body?.student_id;

                const courseId =
                    req.body?.courseId ??
                    req.body?.course_id ??
                    null;

                const classId =
                    req.body?.classId ??
                    req.body?.class_id ??
                    null;

                const attendanceDate =
                    req.body?.attendanceDate ??
                    req.body?.attendance_date ??
                    getKigaliDate();

                const status =
                    req.body?.status ??
                    "present";

                const notes =
                    req.body?.notes ??
                    null;

                const markedByTeacherId =
                    req.body?.markedByTeacherId ??
                    req.body?.marked_by_teacher_id ??
                    req.body?.teacherId ??
                    req.body?.teacher_id ??
                    null;

                const normalizedStudentId =
                    validId(studentId);

                if (!normalizedStudentId) {
                    return res.status(400).json({
                        message:
                            "Valid student ID is required."
                    });
                }

                const student =
                    db.prepare(`
                        SELECT id
                        FROM students
                        WHERE id = ?
                    `).get(
                        normalizedStudentId
                    );

                if (!student) {
                    return res.status(404).json({
                        message:
                            "Student not found."
                    });
                }

                const normalizedCourseId =
                    normalizeNullableId(
                        courseId
                    );

                const normalizedClassId =
                    normalizeNullableId(
                        classId
                    );

                const normalizedTeacherId =
                    normalizeNullableId(
                        markedByTeacherId
                    );

                if (normalizedCourseId) {
                    const course =
                        db.prepare(`
                            SELECT id
                            FROM courses
                            WHERE id = ?
                        `).get(
                            normalizedCourseId
                        );

                    if (!course) {
                        return res.status(404).json({
                            message:
                                "Course not found."
                        });
                    }
                }

                if (normalizedClassId) {
                    const classInfo =
                        db.prepare(`
                            SELECT
                                id,
                                course_id
                            FROM classes
                            WHERE id = ?
                        `).get(
                            normalizedClassId
                        );

                    if (!classInfo) {
                        return res.status(404).json({
                            message:
                                "Class not found."
                        });
                    }
                }

                if (normalizedTeacherId) {
                    const teacher =
                        db.prepare(`
                            SELECT id
                            FROM teachers
                            WHERE id = ?
                        `).get(
                            normalizedTeacherId
                        );

                    if (!teacher) {
                        return res.status(404).json({
                            message:
                                "Teacher not found."
                        });
                    }
                }

                const finalStatus =
                    normalizeStatus(
                        status,
                        [
                            "present",
                            "late",
                            "absent",
                            "excused"
                        ],
                        "present"
                    );

                const existing =
                    db.prepare(`
                        SELECT id
                        FROM attendance
                        WHERE student_id = ?
                        AND (
                                course_id = ?
                                OR (
                                    course_id IS NULL
                                    AND ? IS NULL
                                )
                        )
                        AND (
                                class_id = ?
                                OR (
                                    class_id IS NULL
                                    AND ? IS NULL
                                )
                        )
                        AND attendance_date = ?
                    `).get(
                        normalizedStudentId,
                        normalizedCourseId,
                        normalizedCourseId,
                        normalizedClassId,
                        normalizedClassId,
                        attendanceDate
                    );

                let attendanceId;

                if (existing) {
                    db.prepare(`
                        UPDATE attendance
                        SET
                            status = ?,
                            notes = ?,
                            marked_by_teacher_id = ?
                        WHERE id = ?
                    `).run(
                        finalStatus,
                        notes,
                        normalizedTeacherId,
                        existing.id
                    );

                    attendanceId =
                        existing.id;
                } else {
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
                            normalizedStudentId,
                            normalizedCourseId,
                            normalizedClassId,
                            attendanceDate,
                            finalStatus,
                            notes,
                            normalizedTeacherId
                        );

                    attendanceId =
                        result.lastInsertRowid;
                }

                const attendance =
                    db.prepare(`
                        SELECT *
                        FROM attendance
                        WHERE id = ?
                    `).get(attendanceId);

                logAdminActivity(
                    req,
                    "MARK_ATTENDANCE",
                    "attendance",
                    attendanceId
                );

                return res.json({
                    message:
                        "Attendance saved successfully.",
                    attendance
                });
            } catch (error) {
                console.error(
                    "Mark attendance error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not save attendance."
                });
            }
        }
    );

    router.patch(
        "/attendance/:id",
        authenticateAdmin,
        (req, res) => {
            try {
                const id =
                    validId(req.params.id);

                if (!id) {
                    return res.status(400).json({
                        message:
                            "Invalid attendance ID."
                    });
                }

                const existing =
                    db.prepare(`
                        SELECT *
                        FROM attendance
                        WHERE id = ?
                    `).get(id);

                if (!existing) {
                    return res.status(404).json({
                        message:
                            "Attendance record not found."
                    });
                }

                const body =
                    req.body ||
                    {};

                const status =
                    body.status !== undefined
                        ? normalizeStatus(
                            body.status,
                            [
                                "present",
                                "late",
                                "absent",
                                "excused"
                            ],
                            existing.status
                        )
                        : existing.status;

                const notes =
                    body.notes !== undefined
                        ? body.notes
                        : existing.notes;

                const markedByTeacherId =
                    body.markedByTeacherId !== undefined ||
                    body.marked_by_teacher_id !== undefined ||
                    body.teacherId !== undefined ||
                    body.teacher_id !== undefined
                        ? normalizeNullableId(
                            body.markedByTeacherId ??
                            body.marked_by_teacher_id ??
                            body.teacherId ??
                            body.teacher_id
                        )
                        : existing.marked_by_teacher_id;

                if (markedByTeacherId) {
                    const teacher =
                        db.prepare(`
                            SELECT id
                            FROM teachers
                            WHERE id = ?
                        `).get(
                            markedByTeacherId
                        );

                    if (!teacher) {
                        return res.status(404).json({
                            message:
                                "Teacher not found."
                        });
                    }
                }

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
                    markedByTeacherId,
                    id
                );

                const attendance =
                    db.prepare(`
                        SELECT *
                        FROM attendance
                        WHERE id = ?
                    `).get(id);

                logAdminActivity(
                    req,
                    "UPDATE_ATTENDANCE",
                    "attendance",
                    id
                );

                return res.json({
                    message:
                        "Attendance updated successfully.",
                    attendance
                });
            } catch (error) {
                console.error(
                    "Update attendance error:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Could not update attendance."
                });
            }
        }
    );

/* =========================================================
   TESTS
========================================================= */

router.get(
    "/tests",
    authenticateAdmin,
    (req, res) => {
        try {
            const tests =
                db.prepare(`
                    SELECT
                        t.*,
                        c.name AS course_name,
                        c.level AS course_level,
                        cl.name AS class_name,
                        te.full_name AS teacher_name,
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
                    LEFT JOIN teachers te
                        ON te.id = t.teacher_id
                    ORDER BY t.id DESC
                `).all();

            return res.json({
                tests
            });
        } catch (error) {
            console.error(
                "Get tests error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load tests."
            });
        }
    }
);

router.get(
    "/tests/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(req.params.id);

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid test ID."
                });
            }

            const test =
                db.prepare(`
                    SELECT
                        t.*,
                        c.name AS course_name,
                        c.level AS course_level,
                        cl.name AS class_name,
                        te.full_name AS teacher_name
                    FROM tests t
                    LEFT JOIN courses c
                        ON c.id = t.course_id
                    LEFT JOIN classes cl
                        ON cl.id = t.class_id
                    LEFT JOIN teachers te
                        ON te.id = t.teacher_id
                    WHERE t.id = ?
                `).get(id);

            if (!test) {
                return res.status(404).json({
                    message:
                        "Test not found."
                });
            }

            const results =
                db.prepare(`
                    SELECT
                        tr.*,
                        s.full_name AS student_name,
                        s.email
                    FROM test_results tr
                    JOIN students s
                        ON s.id = tr.student_id
                    WHERE tr.test_id = ?
                    ORDER BY
                        CASE
                            WHEN tr.rank IS NULL THEN 1
                            ELSE 0
                        END,
                        tr.rank ASC,
                        tr.percentage DESC,
                        tr.score DESC
                `).all(id);

            return res.json({
                test,
                results
            });
        } catch (error) {
            console.error(
                "Get test details error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load test details."
            });
        }
    }
);

router.post(
    "/tests",
    authenticateAdmin,
    (req, res) => {
        try {
            const body =
                req.body ||
                {};

            const title =
                body.title;

            const courseId =
                body.courseId ??
                body.course_id ??
                null;

            const classId =
                body.classId ??
                body.class_id ??
                null;

            const teacherId =
                body.teacherId ??
                body.teacher_id ??
                null;

            const testType =
                body.testType ??
                body.test_type ??
                "weekly";

            const totalPoints =
                body.totalPoints ??
                body.total_points ??
                100;

            const testDate =
                body.testDate ??
                body.test_date ??
                getKigaliDate();

            const dueDate =
                body.dueDate ??
                body.due_date ??
                null;

            const description =
                body.description ??
                "";

            const status =
                body.status ??
                "published";

            if (
                !title ||
                !String(title).trim()
            ) {
                return res.status(400).json({
                    message:
                        "Test title is required."
                });
            }

            const points =
                parsePositiveNumber(
                    totalPoints,
                    100
                );

            if (points <= 0) {
                return res.status(400).json({
                    message:
                        "Total points must be greater than zero."
                });
            }

            const normalizedCourseId =
                normalizeNullableId(
                    courseId
                );

            const normalizedClassId =
                normalizeNullableId(
                    classId
                );

            const normalizedTeacherId =
                normalizeNullableId(
                    teacherId
                );

            if (normalizedCourseId) {
                const course =
                    db.prepare(`
                        SELECT id
                        FROM courses
                        WHERE id = ?
                    `).get(
                        normalizedCourseId
                    );

                if (!course) {
                    return res.status(404).json({
                        message:
                            "Course not found."
                    });
                }
            }

            if (normalizedClassId) {
                const classInfo =
                    db.prepare(`
                        SELECT id
                        FROM classes
                        WHERE id = ?
                    `).get(
                        normalizedClassId
                    );

                if (!classInfo) {
                    return res.status(404).json({
                        message:
                            "Class not found."
                    });
                }
            }

            if (normalizedTeacherId) {
                const teacher =
                    db.prepare(`
                        SELECT id
                        FROM teachers
                        WHERE id = ?
                    `).get(
                        normalizedTeacherId
                    );

                if (!teacher) {
                    return res.status(404).json({
                        message:
                            "Teacher not found."
                    });
                }
            }

            const result =
                db.prepare(`
                    INSERT INTO tests
                    (
                        title,
                        course_id,
                        class_id,
                        teacher_id,
                        test_type,
                        total_points,
                        test_date,
                        due_date,
                        description,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    String(title).trim(),
                    normalizedCourseId,
                    normalizedClassId,
                    normalizedTeacherId,
                    String(
                        testType
                    ).trim(),
                    points,
                    testDate,
                    dueDate,
                    String(
                        description || ""
                    ).trim(),
                    normalizeStatus(
                        status,
                        [
                            "published",
                            "draft",
                            "inactive"
                        ],
                        "published"
                    )
                );

            const test =
                db.prepare(`
                    SELECT *
                    FROM tests
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            logAdminActivity(
                req,
                "CREATE_TEST",
                "test",
                result.lastInsertRowid
            );

            return res.status(201).json({
                message:
                    "Test created successfully.",
                test
            });
        } catch (error) {
            console.error(
                "Create test error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create test."
            });
        }
    }
);

router.patch(
    "/tests/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(req.params.id);

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid test ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM tests
                    WHERE id = ?
                `).get(id);

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Test not found."
                });
            }

            const body =
                req.body ||
                {};

            const totalPoints =
                body.totalPoints !== undefined ||
                body.total_points !== undefined
                    ? parsePositiveNumber(
                        body.totalPoints ??
                        body.total_points,
                        existing.total_points
                    )
                    : existing.total_points;

            if (totalPoints <= 0) {
                return res.status(400).json({
                    message:
                        "Total points must be greater than zero."
                });
            }

            const courseId =
                body.courseId !== undefined ||
                body.course_id !== undefined
                    ? normalizeNullableId(
                        body.courseId ??
                        body.course_id
                    )
                    : existing.course_id;

            const classId =
                body.classId !== undefined ||
                body.class_id !== undefined
                    ? normalizeNullableId(
                        body.classId ??
                        body.class_id
                    )
                    : existing.class_id;

            const teacherId =
                body.teacherId !== undefined ||
                body.teacher_id !== undefined
                    ? normalizeNullableId(
                        body.teacherId ??
                        body.teacher_id
                    )
                    : existing.teacher_id;

            if (courseId) {
                const course =
                    db.prepare(`
                        SELECT id
                        FROM courses
                        WHERE id = ?
                    `).get(courseId);

                if (!course) {
                    return res.status(404).json({
                        message:
                            "Course not found."
                    });
                }
            }

            if (classId) {
                const classInfo =
                    db.prepare(`
                        SELECT id
                        FROM classes
                        WHERE id = ?
                    `).get(classId);

                if (!classInfo) {
                    return res.status(404).json({
                        message:
                            "Class not found."
                    });
                }
            }

            if (teacherId) {
                const teacher =
                    db.prepare(`
                        SELECT id
                        FROM teachers
                        WHERE id = ?
                    `).get(teacherId);

                if (!teacher) {
                    return res.status(404).json({
                        message:
                            "Teacher not found."
                    });
                }
            }

            db.prepare(`
                UPDATE tests
                SET
                    title = ?,
                    course_id = ?,
                    class_id = ?,
                    teacher_id = ?,
                    test_type = ?,
                    total_points = ?,
                    test_date = ?,
                    due_date = ?,
                    description = ?,
                    status = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                body.title !== undefined
                    ? String(
                        body.title
                    ).trim()
                    : existing.title,
                courseId,
                classId,
                teacherId,
                body.testType !== undefined ||
                body.test_type !== undefined
                    ? String(
                        body.testType ??
                        body.test_type
                    ).trim()
                    : existing.test_type,
                totalPoints,
                body.testDate !== undefined ||
                body.test_date !== undefined
                    ? (
                        body.testDate ??
                        body.test_date
                    )
                    : existing.test_date,
                body.dueDate !== undefined ||
                body.due_date !== undefined
                    ? (
                        body.dueDate ??
                        body.due_date
                    )
                    : existing.due_date,
                body.description !== undefined
                    ? String(
                        body.description
                    ).trim()
                    : existing.description,
                body.status !== undefined
                    ? normalizeStatus(
                        body.status,
                        [
                            "published",
                            "draft",
                            "inactive"
                        ],
                        existing.status
                    )
                    : existing.status,
                id
            );

            const test =
                db.prepare(`
                    SELECT *
                    FROM tests
                    WHERE id = ?
                `).get(id);

            logAdminActivity(
                req,
                "UPDATE_TEST",
                "test",
                id
            );

            return res.json({
                message:
                    "Test updated successfully.",
                test
            });
        } catch (error) {
            console.error(
                "Update test error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not update test."
            });
        }
    }
);

router.delete(
    "/tests/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(req.params.id);

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid test ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM tests
                    WHERE id = ?
                `).get(id);

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Test not found."
                });
            }

            const transaction =
                db.transaction(() => {
                    db.prepare(`
                        DELETE FROM test_files
                        WHERE test_id = ?
                    `).run(id);

                    db.prepare(`
                        DELETE FROM student_report_files
                        WHERE test_id = ?
                    `).run(id);

                    db.prepare(`
                        DELETE FROM test_results
                        WHERE test_id = ?
                    `).run(id);

                    db.prepare(`
                        DELETE FROM tests
                        WHERE id = ?
                    `).run(id);
                });

            transaction();

            logAdminActivity(
                req,
                "DELETE_TEST",
                "test",
                id
            );

            return res.json({
                message:
                    "Test deleted successfully."
            });
        } catch (error) {
            console.error(
                "Delete test error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not delete test."
            });
        }
    }
);

/* =========================================================
   TEST RESULTS
   IMPORTANT:
   test_results has NO "comment" column.
   We use teacher_comment only.
========================================================= */

router.post(
    "/tests/:testId/results",
    authenticateAdmin,
    (req, res) => {
        try {
            const testId =
                validId(req.params.testId);

            const studentId =
                validId(
                    req.body?.studentId ??
                    req.body?.student_id
                );

            if (!testId || !studentId) {
                return res.status(400).json({
                    message:
                        "Valid test and student IDs are required."
                });
            }

            const test =
                db.prepare(`
                    SELECT *
                    FROM tests
                    WHERE id = ?
                `).get(testId);

            if (!test) {
                return res.status(404).json({
                    message:
                        "Test not found."
                });
            }

            const student =
                db.prepare(`
                    SELECT id
                    FROM students
                    WHERE id = ?
                `).get(studentId);

            if (!student) {
                return res.status(404).json({
                    message:
                        "Student not found."
                });
            }

            const score =
                Number(
                    req.body?.score
                );

            if (
                !Number.isFinite(score) ||
                score < 0 ||
                score >
                    Number(
                        test.total_points
                    )
            ) {
                return res.status(400).json({
                    message:
                        `Score must be between 0 and ${test.total_points}.`
                });
            }

            const percentage =
                test.total_points > 0
                    ? (
                        score /
                        Number(
                            test.total_points
                        )
                    ) * 100
                    : 0;

            const teacherComment =
                req.body?.teacherComment ??
                req.body?.teacher_comment ??
                req.body?.comment ??
                null;

            const status =
                normalizeStatus(
                    req.body?.status,
                    [
                        "graded",
                        "pending",
                        "missing"
                    ],
                    "graded"
                );

            const existing =
                db.prepare(`
                    SELECT id
                    FROM test_results
                    WHERE test_id = ?
                      AND student_id = ?
                `).get(
                    testId,
                    studentId
                );

            let resultId;

            if (existing) {
                db.prepare(`
                    UPDATE test_results
                    SET
                        score = ?,
                        total_points = ?,
                        percentage = ?,
                        teacher_comment = ?,
                        status = ?,
                        graded_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(
                    score,
                    test.total_points,
                    percentage,
                    teacherComment,
                    status,
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
                            graded_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    `).run(
                        testId,
                        studentId,
                        score,
                        test.total_points,
                        percentage,
                        teacherComment,
                        status
                    );

                resultId =
                    result.lastInsertRowid;
            }

            const allResults =
                db.prepare(`
                    SELECT
                        id,
                        percentage,
                        score
                    FROM test_results
                    WHERE test_id = ?
                    ORDER BY
                        percentage DESC,
                        score DESC,
                        id ASC
                `).all(testId);

            const updateRank =
                db.prepare(`
                    UPDATE test_results
                    SET rank = ?
                    WHERE id = ?
                `);

            const updateRanks =
                db.transaction(() => {
                    allResults.forEach(
                        (item, index) => {
                            updateRank.run(
                                index + 1,
                                item.id
                            );
                        }
                    );
                });

            updateRanks();

            const saved =
                db.prepare(`
                    SELECT
                        tr.*,
                        s.full_name AS student_name,
                        s.email
                    FROM test_results tr
                    JOIN students s
                        ON s.id = tr.student_id
                    WHERE tr.id = ?
                `).get(resultId);

            logAdminActivity(
                req,
                "SAVE_TEST_RESULT",
                "test_result",
                resultId
            );

            return res.json({
                message:
                    "Test result saved successfully.",
                result: saved
            });
        } catch (error) {
            console.error(
                "Save test result error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not save test result."
            });
        }
    }
);

router.get(
    "/students/:studentId/results",
    authenticateAdmin,
    (req, res) => {
        try {
            const studentId =
                validId(
                    req.params.studentId
                );

            if (!studentId) {
                return res.status(400).json({
                    message:
                        "Invalid student ID."
                });
            }

            const student =
                db.prepare(`
                    SELECT
                        id,
                        full_name,
                        email,
                        level,
                        course_id
                    FROM students
                    WHERE id = ?
                `).get(studentId);

            if (!student) {
                return res.status(404).json({
                    message:
                        "Student not found."
                });
            }

            const results =
                db.prepare(`
                    SELECT
                        tr.*,
                        t.title AS test_title,
                        t.test_type,
                        t.test_date,
                        t.due_date,
                        t.course_id AS test_course_id,
                        t.class_id AS test_class_id,
                        c.name AS course_name,
                        c.level AS course_level,
                        cl.name AS class_name
                    FROM test_results tr
                    JOIN tests t
                        ON t.id = tr.test_id
                    LEFT JOIN courses c
                        ON c.id = t.course_id
                    LEFT JOIN classes cl
                        ON cl.id = t.class_id
                    WHERE tr.student_id = ?
                    ORDER BY
                        t.test_date DESC,
                        tr.id DESC
                `).all(studentId);

            return res.json({
                student,
                results
            });
        } catch (error) {
            console.error(
                "Get student results error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load student results."
            });
        }
    }
);

router.get(
    "/classes/:classId/performance",
    authenticateAdmin,
    (req, res) => {
        try {
            const classId =
                validId(
                    req.params.classId
                );

            if (!classId) {
                return res.status(400).json({
                    message:
                        "Invalid class ID."
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
                `).get(classId);

            if (!classInfo) {
                return res.status(404).json({
                    message:
                        "Class not found."
                });
            }

            const students =
                db.prepare(`
                    SELECT
                        s.id,
                        s.full_name,
                        s.email,
                        s.level,
                        e.id AS enrollment_id,
                        e.enrollment_date
                    FROM enrollments e
                    JOIN students s
                        ON s.id = e.student_id
                    WHERE e.class_id = ?
                      AND e.status = 'active'
                    ORDER BY s.full_name ASC
                `).all(classId);

            const performance =
                students.map(
                    (student) => {
                        const stats =
                            db.prepare(`
                                SELECT
                                    COUNT(tr.id) AS tests_taken,
                                    AVG(tr.percentage) AS average,
                                    MAX(tr.percentage) AS highest,
                                    MIN(tr.percentage) AS lowest
                                FROM test_results tr
                                JOIN tests t
                                    ON t.id = tr.test_id
                                WHERE tr.student_id = ?
                                  AND t.class_id = ?
                            `).get(
                                student.id,
                                classId
                            );

                        return {
                            ...student,
                            tests_taken:
                                Number(
                                    stats?.tests_taken ||
                                    0
                                ),
                            average:
                                stats?.average !== null &&
                                stats?.average !== undefined
                                    ? Number(
                                        Number(
                                            stats.average
                                        ).toFixed(2)
                                    )
                                    : null,
                            highest:
                                stats?.highest !== null &&
                                stats?.highest !== undefined
                                    ? Number(
                                        Number(
                                            stats.highest
                                        ).toFixed(2)
                                    )
                                    : null,
                            lowest:
                                stats?.lowest !== null &&
                                stats?.lowest !== undefined
                                    ? Number(
                                        Number(
                                            stats.lowest
                                        ).toFixed(2)
                                    )
                                    : null
                        };
                    }
                );

            const ranked =
                [...performance]
                    .sort(
                        (a, b) =>
                            Number(
                                b.average ?? -1
                            ) -
                            Number(
                                a.average ?? -1
                            )
                    )
                    .map(
                        (student, index) => ({
                            ...student,
                            rank:
                                student.average === null
                                    ? null
                                    : index + 1
                        })
                    );

            const classAverage =
                performance.filter(
                    (item) =>
                        item.average !== null
                ).length > 0
                    ? Number(
                        (
                            performance
                                .filter(
                                    (item) =>
                                        item.average !== null
                                )
                                .reduce(
                                    (
                                        total,
                                        item
                                    ) =>
                                        total +
                                        Number(
                                            item.average
                                        ),
                                    0
                                ) /
                            performance.filter(
                                (item) =>
                                    item.average !== null
                            ).length
                        ).toFixed(2)
                    )
                    : null;

            return res.json({
                class: classInfo,
                classAverage,
                studentCount:
                    performance.length,
                performance:
                    ranked
            });
        } catch (error) {
            console.error(
                "Get class performance error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load class performance."
            });
        }
    }
);

router.get(
    "/students/:studentId/report",
    authenticateAdmin,
    (req, res) => {
        try {
            const studentId =
                validId(
                    req.params.studentId
                );

            if (!studentId) {
                return res.status(400).json({
                    message:
                        "Invalid student ID."
                });
            }

            const student =
                db.prepare(`
                    SELECT
                        s.id,
                        s.full_name,
                        s.email,
                        s.phone,
                        s.level,
                        s.course_id,
                        c.name AS course_name,
                        c.level AS course_level
                    FROM students s
                    LEFT JOIN courses c
                        ON c.id = s.course_id
                    WHERE s.id = ?
                `).get(studentId);

            if (!student) {
                return res.status(404).json({
                    message:
                        "Student not found."
                });
            }

            const enrollment =
                db.prepare(`
                    SELECT
                        e.*,
                        cl.name AS class_name,
                        cl.level AS class_level,
                        cl.course_id,
                        c.name AS course_name
                    FROM enrollments e
                    JOIN classes cl
                        ON cl.id = e.class_id
                    LEFT JOIN courses c
                        ON c.id = cl.course_id
                    WHERE e.student_id = ?
                    ORDER BY
                        CASE
                            WHEN e.status = 'active'
                            THEN 0
                            ELSE 1
                        END,
                        e.id DESC
                    LIMIT 1
                `).get(studentId);

            let teacher = null;

            if (enrollment) {
                teacher =
                    db.prepare(`
                        SELECT
                            t.id,
                            t.full_name,
                            t.email,
                            t.phone,
                            t.specialization
                        FROM teacher_classes tc
                        JOIN teachers t
                            ON t.id = tc.teacher_id
                        WHERE tc.class_id = ?
                        ORDER BY
                            tc.is_primary DESC,
                            tc.id DESC
                        LIMIT 1
                    `).get(
                        enrollment.class_id
                    );
            }

            const results =
                db.prepare(`
                    SELECT
                        tr.*,
                        t.title AS test_title,
                        t.test_type,
                        t.test_date,
                        t.total_points,
                        t.course_id AS test_course_id,
                        t.class_id AS test_class_id,
                        c.name AS course_name,
                        cl.name AS class_name
                    FROM test_results tr
                    JOIN tests t
                        ON t.id = tr.test_id
                    LEFT JOIN courses c
                        ON c.id = t.course_id
                    LEFT JOIN classes cl
                        ON cl.id = t.class_id
                    WHERE tr.student_id = ?
                    ORDER BY
                        t.test_date DESC,
                        tr.id DESC
                `).all(studentId);

            const percentages =
                results
                    .map(
                        (item) =>
                            Number(
                                item.percentage
                            )
                    )
                    .filter(
                        (value) =>
                            Number.isFinite(
                                value
                            )
                    );

            const average =
                percentages.length
                    ? Number(
                        (
                            percentages.reduce(
                                (
                                    total,
                                    value
                                ) =>
                                    total +
                                    value,
                                0
                            ) /
                            percentages.length
                        ).toFixed(2)
                    )
                    : null;

            const highest =
                percentages.length
                    ? Math.max(
                        ...percentages
                    )
                    : null;

            const lowest =
                percentages.length
                    ? Math.min(
                        ...percentages
                    )
                    : null;

            let classAverage = null;

            if (enrollment) {
                const classRows =
                    db.prepare(`
                        SELECT
                            s.id,
                            AVG(tr.percentage) AS average
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
                        GROUP BY s.id
                    `).all(
                        enrollment.class_id
                    );

                const averages =
                    classRows
                        .map(
                            (row) =>
                                row.average
                        )
                        .filter(
                            (value) =>
                                value !== null &&
                                value !== undefined
                        )
                        .map(
                            Number
                        );

                if (averages.length) {
                    classAverage =
                        Number(
                            (
                                averages.reduce(
                                    (
                                        total,
                                        value
                                    ) =>
                                        total +
                                        value,
                                    0
                                ) /
                                averages.length
                            ).toFixed(2)
                        );
                }
            }

            return res.json({
                student,
                enrollment:
                    enrollment || null,
                teacher,
                results,
                summary: {
                    testsTaken:
                        results.length,
                    average,
                    highest,
                    lowest,
                    classAverage
                }
            });
        } catch (error) {
            console.error(
                "Get student report error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not generate student report."
            });
        }
    }
);

/* =========================================================
   PAYMENTS
========================================================= */

router.get(
    "/payments",
    authenticateAdmin,
    (req, res) => {
        try {
            const payments =
                db.prepare(`
                    SELECT
                        p.*,
                        p.amount_remaining AS remaining_amount,
                        s.full_name AS student_name,
                        s.email AS student_email,
                        s.phone AS student_phone,
                        c.name AS course_name,
                        c.level AS course_level,
                        cl.name AS class_name
                    FROM payments p
                    JOIN students s
                        ON s.id = p.student_id
                    LEFT JOIN courses c
                        ON c.id = p.course_id
                    LEFT JOIN classes cl
                        ON cl.id = p.class_id
                    ORDER BY
                        p.created_at DESC,
                        p.id DESC
                `).all();

            return res.json({
                payments
            });
        } catch (error) {
            console.error(
                "Get payments error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load payments."
            });
        }
    }
);

router.get(
    "/students/:studentId/payments",
    authenticateAdmin,
    (req, res) => {
        try {
            const studentId =
                validId(
                    req.params.studentId
                );

            if (!studentId) {
                return res.status(400).json({
                    message:
                        "Invalid student ID."
                });
            }

            const student =
                db.prepare(`
                    SELECT
                        id,
                        full_name,
                        email,
                        phone,
                        payment_status
                    FROM students
                    WHERE id = ?
                `).get(studentId);

            if (!student) {
                return res.status(404).json({
                    message:
                        "Student not found."
                });
            }

            const payments =
                db.prepare(`
                    SELECT
                        p.*,
                        p.amount_remaining AS remaining_amount,
                        c.name AS course_name,
                        c.level AS course_level,
                        cl.name AS class_name
                    FROM payments p
                    LEFT JOIN courses c
                        ON c.id = p.course_id
                    LEFT JOIN classes cl
                        ON cl.id = p.class_id
                    WHERE p.student_id = ?
                    ORDER BY
                        p.created_at DESC,
                        p.id DESC
                `).all(studentId);

            const transactions =
                db.prepare(`
                    SELECT
                        pt.*,
                        p.course_id,
                        p.class_id
                    FROM payment_transactions pt
                    LEFT JOIN payments p
                        ON p.id = pt.payment_id
                    WHERE pt.student_id = ?
                    ORDER BY
                        pt.created_at DESC,
                        pt.id DESC
                `).all(studentId);

            const summary =
                payments.reduce(
                    (acc, payment) => {
                        acc.totalFee +=
                            Number(
                                payment.total_fee ||
                                0
                            );

                        acc.amountPaid +=
                            Number(
                                payment.amount_paid ||
                                0
                            );

                        acc.remaining +=
                            Number(
                                payment.amount_remaining ||
                                payment.remaining_amount ||
                                0
                            );

                        return acc;
                    },
                    {
                        totalFee: 0,
                        amountPaid: 0,
                        remaining: 0
                    }
                );

            return res.json({
                student,
                payments,
                transactions,
                summary
            });
        } catch (error) {
            console.error(
                "Get student payments error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load student payments."
            });
        }
    }
);

router.post(
    "/students/:studentId/payments",
    authenticateAdmin,
    (req, res) => {
        try {
            const studentId =
                validId(
                    req.params.studentId
                );

            if (!studentId) {
                return res.status(400).json({
                    message:
                        "Invalid student ID."
                });
            }

            const student =
                db.prepare(`
                    SELECT
                        id,
                        payment_status
                    FROM students
                    WHERE id = ?
                `).get(studentId);

            if (!student) {
                return res.status(404).json({
                    message:
                        "Student not found."
                });
            }

            const body =
                req.body ||
                {};

            const courseId =
                body.courseId ??
                body.course_id ??
                null;

            const classId =
                body.classId ??
                body.class_id ??
                null;

            const totalFeeInput =
                body.totalFee ??
                body.total_fee;

            const amountPaidInput =
                body.amountPaid ??
                body.amount_paid ??
                0;

            const currency =
                body.currency ||
                "RWF";

            const statusInput =
                body.status;

            const normalizedCourseId =
                normalizeNullableId(
                    courseId
                );

            const normalizedClassId =
                normalizeNullableId(
                    classId
                );

            if (normalizedCourseId) {
                const course =
                    db.prepare(`
                        SELECT
                            id,
                            fee
                        FROM courses
                        WHERE id = ?
                    `).get(
                        normalizedCourseId
                    );

                if (!course) {
                    return res.status(404).json({
                        message:
                            "Course not found."
                    });
                }
            }

            if (normalizedClassId) {
                const classInfo =
                    db.prepare(`
                        SELECT
                            id,
                            course_id
                        FROM classes
                        WHERE id = ?
                    `).get(
                        normalizedClassId
                    );

                if (!classInfo) {
                    return res.status(404).json({
                        message:
                            "Class not found."
                    });
                }
            }

            let totalFee;

            if (
                totalFeeInput !== undefined &&
                totalFeeInput !== null &&
                String(
                    totalFeeInput
                ).trim() !== ""
            ) {
                totalFee =
                    parsePositiveNumber(
                        totalFeeInput,
                        0
                    );
            } else if (normalizedCourseId) {
                const course =
                    db.prepare(`
                        SELECT fee
                        FROM courses
                        WHERE id = ?
                    `).get(
                        normalizedCourseId
                    );

                totalFee =
                    parsePositiveNumber(
                        course?.fee,
                        0
                    );
            } else {
                totalFee = 0;
            }

            const amountPaid =
                parsePositiveNumber(
                    amountPaidInput,
                    0
                );

            if (amountPaid > totalFee) {
                return res.status(400).json({
                    message:
                        "Amount paid cannot be greater than the total fee."
                });
            }

            const amountRemaining =
                Math.max(
                    totalFee -
                    amountPaid,
                    0
                );

            let finalStatus =
                statusInput
                    ? String(
                        statusInput
                    ).trim().toLowerCase()
                    : null;

            if (!finalStatus) {
                finalStatus =
                    amountPaid <= 0
                        ? "pending"
                        : amountRemaining > 0
                            ? "partial"
                            : "paid";
            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM payments
                    WHERE student_id = ?
                      AND (
                            course_id = ?
                            OR (
                                course_id IS NULL
                                AND ? IS NULL
                            )
                      )
                      AND (
                            class_id = ?
                            OR (
                                class_id IS NULL
                                AND ? IS NULL
                            )
                      )
                `).get(
                    studentId,
                    normalizedCourseId,
                    normalizedCourseId,
                    normalizedClassId,
                    normalizedClassId
                );

            if (existing) {
                return res.status(409).json({
                    message:
                        "A payment record already exists for this student, course and class.",
                    paymentId:
                        existing.id
                });
            }

            const result =
                db.prepare(`
                    INSERT INTO payments
                    (
                        student_id,
                        course_id,
                        class_id,
                        total_fee,
                        amount_paid,
                        amount_remaining,
                        currency,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    studentId,
                    normalizedCourseId,
                    normalizedClassId,
                    totalFee,
                    amountPaid,
                    amountRemaining,
                    currency,
                    finalStatus
                );

            db.prepare(`
                UPDATE students
                SET
                    payment_status = ?
                WHERE id = ?
            `).run(
                finalStatus,
                studentId
            );

            logAdminActivity(
                req,
                "CREATE_PAYMENT",
                "payment",
                result.lastInsertRowid
            );

            const payment =
                db.prepare(`
                    SELECT
                        p.*,
                        p.amount_remaining AS remaining_amount,
                        c.name AS course_name,
                        cl.name AS class_name
                    FROM payments p
                    LEFT JOIN courses c
                        ON c.id = p.course_id
                    LEFT JOIN classes cl
                        ON cl.id = p.class_id
                    WHERE p.id = ?
                `).get(
                    result.lastInsertRowid
                );

            return res.status(201).json({
                message:
                    "Payment created successfully.",
                payment
            });
        } catch (error) {
            console.error(
                "Create payment error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create payment."
            });
        }
    }
);

router.patch(
    "/payments/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(req.params.id);

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid payment ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM payments
                    WHERE id = ?
                `).get(id);

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Payment not found."
                });
            }

            const body =
                req.body ||
                {};

            const courseId =
                body.courseId !== undefined ||
                body.course_id !== undefined
                    ? normalizeNullableId(
                        body.courseId ??
                        body.course_id
                    )
                    : existing.course_id;

            const classId =
                body.classId !== undefined ||
                body.class_id !== undefined
                    ? normalizeNullableId(
                        body.classId ??
                        body.class_id
                    )
                    : existing.class_id;

            if (courseId) {
                const course =
                    db.prepare(`
                        SELECT id
                        FROM courses
                        WHERE id = ?
                    `).get(courseId);

                if (!course) {
                    return res.status(404).json({
                        message:
                            "Course not found."
                    });
                }
            }

            if (classId) {
                const classInfo =
                    db.prepare(`
                        SELECT id
                        FROM classes
                        WHERE id = ?
                    `).get(classId);

                if (!classInfo) {
                    return res.status(404).json({
                        message:
                            "Class not found."
                    });
                }
            }

            const totalFee =
                body.totalFee !== undefined ||
                body.total_fee !== undefined
                    ? parsePositiveNumber(
                        body.totalFee ??
                        body.total_fee,
                        existing.total_fee
                    )
                    : Number(
                        existing.total_fee ||
                        0
                    );

            const amountPaid =
                body.amountPaid !== undefined ||
                body.amount_paid !== undefined
                    ? parsePositiveNumber(
                        body.amountPaid ??
                        body.amount_paid,
                        existing.amount_paid
                    )
                    : Number(
                        existing.amount_paid ||
                        0
                    );

            if (amountPaid > totalFee) {
                return res.status(400).json({
                    message:
                        "Amount paid cannot be greater than the total fee."
                });
            }

            const amountRemaining =
                Math.max(
                    totalFee -
                    amountPaid,
                    0
                );

            let status =
                body.status !== undefined
                    ? String(
                        body.status
                    ).trim().toLowerCase()
                    : existing.status;

            if (
                body.status === undefined
            ) {
                status =
                    amountPaid <= 0
                        ? "pending"
                        : amountRemaining > 0
                            ? "partial"
                            : "paid";
            }

            const duplicate =
                db.prepare(`
                    SELECT id
                    FROM payments
                    WHERE student_id = ?
                      AND id != ?
                      AND (
                            course_id = ?
                            OR (
                                course_id IS NULL
                                AND ? IS NULL
                            )
                      )
                      AND (
                            class_id = ?
                            OR (
                                class_id IS NULL
                                AND ? IS NULL
                            )
                      )
                `).get(
                    existing.student_id,
                    id,
                    courseId,
                    courseId,
                    classId,
                    classId
                );

            if (duplicate) {
                return res.status(409).json({
                    message:
                        "Another payment record already exists for this student, course and class."
                });
            }

            db.prepare(`
                UPDATE payments
                SET
                    course_id = ?,
                    class_id = ?,
                    total_fee = ?,
                    amount_paid = ?,
                    amount_remaining = ?,
                    currency = ?,
                    status = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                courseId,
                classId,
                totalFee,
                amountPaid,
                amountRemaining,
                body.currency ||
                    existing.currency ||
                    "RWF",
                status,
                id
            );

            db.prepare(`
                UPDATE students
                SET
                    payment_status = ?
                WHERE id = ?
            `).run(
                status,
                existing.student_id
            );

            const payment =
                db.prepare(`
                    SELECT
                        p.*,
                        p.amount_remaining AS remaining_amount,
                        c.name AS course_name,
                        cl.name AS class_name
                    FROM payments p
                    LEFT JOIN courses c
                        ON c.id = p.course_id
                    LEFT JOIN classes cl
                        ON cl.id = p.class_id
                    WHERE p.id = ?
                `).get(id);

            logAdminActivity(
                req,
                "UPDATE_PAYMENT",
                "payment",
                id
            );

            return res.json({
                message:
                    "Payment updated successfully.",
                payment
            });
        } catch (error) {
            console.error(
                "Update payment error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not update payment."
            });
        }
    }
);

/* =========================================================
   ANNOUNCEMENTS
========================================================= */

router.get(
    "/announcements",
    authenticateAdmin,
    (req, res) => {
        try {
            const announcements =
                db.prepare(`
                    SELECT
                        a.*,
                        c.name AS class_name,
                        t.full_name AS teacher_name
                    FROM announcements a
                    LEFT JOIN classes c
                        ON c.id = a.class_id
                    LEFT JOIN teachers t
                        ON t.id = a.teacher_id
                    ORDER BY
                        a.created_at DESC,
                        a.id DESC
                `).all();

            return res.json({
                announcements
            });
        } catch (error) {
            console.error(
                "Get announcements error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load announcements."
            });
        }
    }
);

router.post(
    "/announcements",
    authenticateAdmin,
    (req, res) => {
        try {
            const body =
                req.body ||
                {};

            const title =
                body.title;

            const message =
                body.message;

            const level =
                body.level ||
                null;

            const classId =
                body.classId ??
                body.class_id ??
                null;

            const teacherId =
                body.teacherId ??
                body.teacher_id ??
                null;

            const status =
                body.status ||
                "published";

            if (
                !title ||
                !String(title).trim()
            ) {
                return res.status(400).json({
                    message:
                        "Announcement title is required."
                });
            }

            if (
                !message ||
                !String(message).trim()
            ) {
                return res.status(400).json({
                    message:
                        "Announcement message is required."
                });
            }

            const normalizedClassId =
                normalizeNullableId(
                    classId
                );

            const normalizedTeacherId =
                normalizeNullableId(
                    teacherId
                );

            if (normalizedClassId) {
                const classInfo =
                    db.prepare(`
                        SELECT id
                        FROM classes
                        WHERE id = ?
                    `).get(
                        normalizedClassId
                    );

                if (!classInfo) {
                    return res.status(404).json({
                        message:
                            "Class not found."
                    });
                }
            }

            if (normalizedTeacherId) {
                const teacher =
                    db.prepare(`
                        SELECT id
                        FROM teachers
                        WHERE id = ?
                    `).get(
                        normalizedTeacherId
                    );

                if (!teacher) {
                    return res.status(404).json({
                        message:
                            "Teacher not found."
                    });
                }
            }

            const result =
                db.prepare(`
                    INSERT INTO announcements
                    (
                        title,
                        message,
                        level,
                        class_id,
                        teacher_id,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    String(title).trim(),
                    String(message).trim(),
                    level,
                    normalizedClassId,
                    normalizedTeacherId,
                    normalizeStatus(
                        status,
                        [
                            "published",
                            "draft",
                            "inactive"
                        ],
                        "published"
                    )
                );

            const announcement =
                db.prepare(`
                    SELECT *
                    FROM announcements
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            logAdminActivity(
                req,
                "CREATE_ANNOUNCEMENT",
                "announcement",
                result.lastInsertRowid
            );

            return res.status(201).json({
                message:
                    "Announcement created successfully.",
                announcement
            });
        } catch (error) {
            console.error(
                "Create announcement error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not create announcement."
            });
        }
    }
);

router.patch(
    "/announcements/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(req.params.id);

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid announcement ID."
                });
            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM announcements
                    WHERE id = ?
                `).get(id);

            if (!existing) {
                return res.status(404).json({
                    message:
                        "Announcement not found."
                });
            }

            const body =
                req.body ||
                {};

            const classId =
                body.classId !== undefined ||
                body.class_id !== undefined
                    ? normalizeNullableId(
                        body.classId ??
                        body.class_id
                    )
                    : existing.class_id;

            const teacherId =
                body.teacherId !== undefined ||
                body.teacher_id !== undefined
                    ? normalizeNullableId(
                        body.teacherId ??
                        body.teacher_id
                    )
                    : existing.teacher_id;

            if (classId) {
                const classInfo =
                    db.prepare(`
                        SELECT id
                        FROM classes
                        WHERE id = ?
                    `).get(classId);

                if (!classInfo) {
                    return res.status(404).json({
                        message:
                            "Class not found."
                    });
                }
            }

            if (teacherId) {
                const teacher =
                    db.prepare(`
                        SELECT id
                        FROM teachers
                        WHERE id = ?
                    `).get(teacherId);

                if (!teacher) {
                    return res.status(404).json({
                        message:
                            "Teacher not found."
                    });
                }
            }

            db.prepare(`
                UPDATE announcements
                SET
                    title = ?,
                    message = ?,
                    level = ?,
                    class_id = ?,
                    teacher_id = ?,
                    status = ?
                WHERE id = ?
            `).run(
                body.title !== undefined
                    ? String(
                        body.title
                    ).trim()
                    : existing.title,
                body.message !== undefined
                    ? String(
                        body.message
                    ).trim()
                    : existing.message,
                body.level !== undefined
                    ? body.level
                    : existing.level,
                classId,
                teacherId,
                body.status !== undefined
                    ? normalizeStatus(
                        body.status,
                        [
                            "published",
                            "draft",
                            "inactive"
                        ],
                        existing.status
                    )
                    : existing.status,
                id
            );

            const announcement =
                db.prepare(`
                    SELECT *
                    FROM announcements
                    WHERE id = ?
                `).get(id);

            logAdminActivity(
                req,
                "UPDATE_ANNOUNCEMENT",
                "announcement",
                id
            );

            return res.json({
                message:
                    "Announcement updated successfully.",
                announcement
            });
        } catch (error) {
            console.error(
                "Update announcement error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not update announcement."
            });
        }
    }
);

router.delete(
    "/announcements/:id",
    authenticateAdmin,
    (req, res) => {
        try {
            const id =
                validId(req.params.id);

            if (!id) {
                return res.status(400).json({
                    message:
                        "Invalid announcement ID."
                });
            }

            const result =
                db.prepare(`
                    DELETE FROM announcements
                    WHERE id = ?
                `).run(id);

            if (!result.changes) {
                return res.status(404).json({
                    message:
                        "Announcement not found."
                });
            }

            logAdminActivity(
                req,
                "DELETE_ANNOUNCEMENT",
                "announcement",
                id
            );

            return res.json({
                message:
                    "Announcement deleted successfully."
            });
        } catch (error) {
            console.error(
                "Delete announcement error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not delete announcement."
            });
        }
    }
);

/* =========================================================
   ACTIVITY LOGS
========================================================= */

router.get(
    "/activity-logs",
    authenticateAdmin,
    (req, res) => {
        try {
            const limit =
                Math.min(
                    parsePositiveInteger(
                        req.query?.limit,
                        100
                    ),
                    500
                );

            const logs =
                db.prepare(`
                    SELECT *
                    FROM admin_activity_logs
                    ORDER BY
                        created_at DESC,
                        id DESC
                    LIMIT ?
                `).all(limit);

            return res.json({
                logs
            });
        } catch (error) {
            console.error(
                "Get activity logs error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load activity logs."
            });
        }
    }
);

/* =========================================================
   SYSTEM SETTINGS
========================================================= */

router.get(
    "/settings",
    authenticateAdmin,
    (req, res) => {
        try {
            const settings =
                db.prepare(`
                    SELECT
                        setting_key,
                        setting_value,
                        description,
                        updated_at
                    FROM system_settings
                    ORDER BY setting_key ASC
                `).all();

            return res.json({
                settings
            });
        } catch (error) {
            console.error(
                "Get settings error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not load settings."
            });
        }
    }
);

router.patch(
    "/settings/:key",
    authenticateAdmin,
    (req, res) => {
        try {
            const key =
                String(
                    req.params.key ||
                    ""
                ).trim();

            if (!key) {
                return res.status(400).json({
                    message:
                        "Setting key is required."
                });
            }

            const value =
                req.body?.settingValue ??
                req.body?.setting_value ??
                req.body?.value;

            if (value === undefined) {
                return res.status(400).json({
                    message:
                        "Setting value is required."
                });
            }

            const existing =
                db.prepare(`
                    SELECT id
                    FROM system_settings
                    WHERE setting_key = ?
                `).get(key);

            if (existing) {
                db.prepare(`
                    UPDATE system_settings
                    SET
                        setting_value = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE setting_key = ?
                `).run(
                    typeof value === "string"
                        ? value
                        : JSON.stringify(
                            value
                        ),
                    key
                );
            } else {
                db.prepare(`
                    INSERT INTO system_settings
                    (
                        setting_key,
                        setting_value
                    )
                    VALUES (?, ?)
                `).run(
                    key,
                    typeof value === "string"
                        ? value
                        : JSON.stringify(
                            value
                        )
                );
            }

            const setting =
                db.prepare(`
                    SELECT
                        setting_key,
                        setting_value,
                        description,
                        updated_at
                    FROM system_settings
                    WHERE setting_key = ?
                `).get(key);

            logAdminActivity(
                req,
                "UPDATE_SETTING",
                "system_setting",
                existing
                    ? existing.id
                    : null
            );

            return res.json({
                message:
                    "Setting updated successfully.",
                setting
            });
        } catch (error) {
            console.error(
                "Update setting error:",
                error
            );

            return res.status(500).json({
                message:
                    "Could not update setting."
            });
        }
    }
);

/* =========================================================
   HEALTH CHECK
========================================================= */

router.get(
    "/health",
    authenticateAdmin,
    (req, res) => {
        try {
            const requiredTables = [
                "students",
                "teachers",
                "courses",
                "classes",
                "teacher_classes",
                "enrollments",
                "modules",
                "lessons",
                "lesson_materials",
                "exercises",
                "student_progress",
                "attendance",
                "attendance_codes",
                "games",
                "game_scores",
                "student_xp",
                "achievements",
                "student_achievements",
                "announcements",
                "notifications",
                "tests",
                "test_files",
                "test_results",
                "student_report_files",
                "payments",
                "payment_transactions",
                "payment_receipts",
                "admin_activity_logs",
                "system_settings",
                "database_migrations"
            ];

            const tables =
                requiredTables.map(
                    (table) => ({
                        table,
                        exists:
                            Boolean(
                                db
                                    .prepare(`
                                        SELECT name
                                        FROM sqlite_master
                                        WHERE type = 'table'
                                          AND name = ?
                                    `)
                                    .get(
                                        table
                                    )
                            )
                    })
                );

            const missing =
                tables
                    .filter(
                        (item) =>
                            !item.exists
                    )
                    .map(
                        (item) =>
                            item.table
                    );

            return res.json({
                status:
                    missing.length === 0
                        ? "healthy"
                        : "degraded",
                database:
                    "connected",
                missingTables:
                    missing,
                tables
            });
        } catch (error) {
            console.error(
                "Admin health check error:",
                error
            );

            return res.status(500).json({
                status:
                    "unhealthy",
                database:
                    "error",
                message:
                    "Database health check failed."
            });
        }
    }
);

/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
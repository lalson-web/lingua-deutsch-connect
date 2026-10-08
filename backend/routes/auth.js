
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../database");

const router = express.Router();


/* =========================================================
   CONFIGURATION
========================================================= */

const JWT_SECRET =
    process.env.JWT_SECRET ||
    "ldc_change_this_secret_later";

const JWT_EXPIRES_IN =
    process.env.JWT_EXPIRES_IN ||
    "7d";


/* =========================================================
   HELPERS
========================================================= */

function cleanString(value) {

    return typeof value === "string"
        ? value.trim()
        : "";

}


function normalizeEmail(value) {

    return cleanString(value).toLowerCase();

}


function normalizeLevel(value) {

    return cleanString(value).toUpperCase();

}


function normalizeNullableId(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return null;

    }

    const id = Number(value);

    return Number.isInteger(id) && id > 0
        ? id
        : null;

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
    )
        .format(new Date())
        .replace(" ", "T");

}


function safeStudent(student) {

    if (!student) {

        return null;

    }

    return {

        id:
            student.id,

        name:
            student.full_name || "",

        fullName:
            student.full_name || "",

        email:
            student.email || "",

        phone:
            student.phone || "",

        course:
            student.course || "",

        courseId:
            student.course_id !== undefined
                ? student.course_id
                : null,

        level:
            student.level || "",

        paymentStatus:
            student.payment_status ||
            "pending",

        accountStatus:
            student.account_status ||
            "active",

        createdAt:
            student.created_at || null,

        lastLoginAt:
            student.last_login_at || null

    };

}


function sendServerError(res, message) {

    return res.status(500).json({

        success: false,

        message:
            message ||
            "Something went wrong. Please try again."

    });

}


/* =========================================================
   HEALTH / TEST
========================================================= */

router.get(
    "/test",
    (req, res) => {

        return res.json({

            success: true,

            message:
                "LDC authentication routes are working."

        });

    }
);


/* =========================================================
   REGISTER
========================================================= */

router.post(
    "/register",
    async (req, res) => {

        try {

            const {
                accessCode,
                fullName,
                email,
                phone,
                password,
                course,
                courseId,
                level
            } = req.body || {};


            /* =================================================
               BASIC VALIDATION
            ================================================= */

            if (
                !accessCode ||
                !fullName ||
                !email ||
                !password
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Access code, full name, email and password are required."

                });

            }


            const cleanAccessCode =
                cleanString(accessCode).toUpperCase();

            const cleanName =
                cleanString(fullName);

            const cleanEmail =
                normalizeEmail(email);

            const cleanPhone =
                cleanString(phone);

            const cleanCourse =
                cleanString(course);

            const cleanLevel =
                normalizeLevel(level);

            const requestedCourseId =
                normalizeNullableId(courseId);


            /* =================================================
               ACCESS CODE VALIDATION
            ================================================= */

            if (
                cleanAccessCode.length < 4 ||
                cleanAccessCode.length > 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid access code."

                });

            }


            /* =================================================
               NAME VALIDATION
            ================================================= */

            if (
                cleanName.length < 2
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your full name."

                });

            }


            if (
                cleanName.length > 150
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Full name is too long."

                });

            }


            /* =================================================
               EMAIL VALIDATION
            ================================================= */

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (
                !emailPattern.test(cleanEmail)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid email address."

                });

            }


            /* =================================================
               PHONE VALIDATION
            ================================================= */

            if (
                cleanPhone.length > 30
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Phone number is too long."

                });

            }


            /* =================================================
               PASSWORD VALIDATION
            ================================================= */

            if (
                typeof password !== "string"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid password."

                });

            }


            if (
                password.length < 8
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password must contain at least 8 characters."

                });

            }


            if (
                password.length > 128
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Password is too long."

                });

            }


            /* =================================================
               FIND ACCESS CODE
            ================================================= */

            const accessCodeRecord =
                db.prepare(`
                    SELECT
                        ac.*,
                        c.id AS linked_course_id,
                        c.name AS linked_course_name,
                        c.level AS linked_course_level,
                        c.status AS linked_course_status
                    FROM access_codes ac
                    LEFT JOIN courses c
                        ON c.id = ac.course_id
                    WHERE UPPER(ac.code) = ?
                    LIMIT 1
                `).get(
                    cleanAccessCode
                );


            /* =================================================
               ACCESS CODE MUST EXIST
            ================================================= */

            if (
                !accessCodeRecord
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid access code. Please check the code given to you by LDC."

                });

            }


            /* =================================================
               CHECK WHETHER CODE WAS USED
            ================================================= */

            if (
                Number(accessCodeRecord.used) === 1
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This access code has already been used."

                });

            }


            /*
             * IMPORTANT:
             *
             * We intentionally DO NOT use
             * access_codes.payment_status as the activation
             * condition anymore.
             *
             * The existence of a valid, unused access code
             * is what authorizes registration.
             *
             * Previously:
             *
             * payment_status !== "paid"
             *              ↓
             *            403
             *
             * This caused valid LDC access codes to fail.
             */


            /* =================================================
               CHECK EXPIRATION
            ================================================= */

            if (
                accessCodeRecord.expires_at
            ) {

                const expiration =
                    new Date(
                        accessCodeRecord.expires_at
                    );


                if (
                    Number.isNaN(
                        expiration.getTime()
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "This access code has an invalid expiration date."

                    });

                }


                if (
                    expiration.getTime() <=
                    Date.now()
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "This access code has expired. Please contact LDC."

                    });

                }

            }


            /* =================================================
               RESOLVE COURSE
            ================================================= */

            let resolvedCourseId =
                accessCodeRecord.course_id ||
                accessCodeRecord.linked_course_id ||
                requestedCourseId ||
                null;

            let resolvedCourseName =
                cleanCourse ||
                accessCodeRecord.course ||
                accessCodeRecord.linked_course_name ||
                "";

            let resolvedLevel =
                cleanLevel ||
                accessCodeRecord.level ||
                accessCodeRecord.linked_course_level ||
                "";


            /* =================================================
               VALIDATE REQUESTED COURSE
            ================================================= */

            if (
                requestedCourseId
            ) {

                const selectedCourse =
                    db.prepare(`
                        SELECT
                            id,
                            name,
                            level,
                            status
                        FROM courses
                        WHERE id = ?
                        LIMIT 1
                    `).get(
                        requestedCourseId
                    );


                if (
                    !selectedCourse
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "The selected course does not exist."

                    });

                }


                if (
                    selectedCourse.status !==
                    "active"
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "The selected course is not currently active."

                    });

                }


                resolvedCourseId =
                    selectedCourse.id;

                resolvedCourseName =
                    selectedCourse.name;


                if (
                    !resolvedLevel
                ) {

                    resolvedLevel =
                        selectedCourse.level || "";

                }

            }


            /* =================================================
               VALIDATE ACCESS-CODE COURSE
            ================================================= */

            if (
                accessCodeRecord.course_id
            ) {

                const accessCourse =
                    db.prepare(`
                        SELECT
                            id,
                            name,
                            level,
                            status
                        FROM courses
                        WHERE id = ?
                        LIMIT 1
                    `).get(
                        accessCodeRecord.course_id
                    );


                if (
                    !accessCourse
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "The course connected to this access code could not be found."

                    });

                }


                if (
                    accessCourse.status !==
                    "active"
                ) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "The course connected to this access code is not active."

                    });

                }


                if (
                    requestedCourseId &&
                    requestedCourseId !==
                        accessCourse.id
                ) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "The selected course does not match your access code."

                    });

                }


                resolvedCourseId =
                    accessCourse.id;

                resolvedCourseName =
                    accessCourse.name;


                if (
                    !resolvedLevel
                ) {

                    resolvedLevel =
                        accessCourse.level || "";

                }

            }


            /* =================================================
               VALIDATE ACCESS-CODE LEVEL
            ================================================= */

            if (
                accessCodeRecord.level &&
                cleanLevel &&
                normalizeLevel(
                    accessCodeRecord.level
                ) !==
                    cleanLevel
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "The selected level does not match your access code."

                });

            }


            /* =================================================
               FINAL COURSE VALIDATION
            ================================================= */

            if (
                resolvedCourseId
            ) {

                const resolvedCourse =
                    db.prepare(`
                        SELECT
                            id,
                            name,
                            level,
                            status
                        FROM courses
                        WHERE id = ?
                        LIMIT 1
                    `).get(
                        resolvedCourseId
                    );


                if (
                    !resolvedCourse
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "The selected course could not be found."

                    });

                }


                if (
                    resolvedCourse.status !==
                    "active"
                ) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "The selected course is not active."

                    });

                }


                if (
                    resolvedLevel &&
                    resolvedCourse.level &&
                    normalizeLevel(
                        resolvedCourse.level
                    ) !==
                        normalizeLevel(
                            resolvedLevel
                        )
                ) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "Your course and level do not match."

                    });

                }


                resolvedCourseName =
                    resolvedCourse.name;

                resolvedLevel =
                    normalizeLevel(
                        resolvedCourse.level ||
                        resolvedLevel
                    );

            }


            /* =================================================
               FINAL LEVEL VALIDATION
            ================================================= */

            if (
                !resolvedLevel
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "No level is associated with this access code."

                });

            }


            /* =================================================
               CHECK EXISTING EMAIL
            ================================================= */

            const existingStudent =
                db.prepare(`
                    SELECT
                        id
                    FROM students
                    WHERE LOWER(email) = ?
                    LIMIT 1
                `).get(
                    cleanEmail
                );


            if (
                existingStudent
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "An account with this email already exists. Please log in instead."

                });

            }


            /* =================================================
               HASH PASSWORD
            ================================================= */

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );


            /* =================================================
               CREATE ACCOUNT
            ================================================= */

            let studentId;


            try {

                const registerStudent =
                    db.transaction(() => {

                        /*
                         * Re-check access code inside
                         * transaction.
                         */

                        const currentCode =
                            db.prepare(`
                                SELECT *
                                FROM access_codes
                                WHERE UPPER(code) = ?
                                LIMIT 1
                            `).get(
                                cleanAccessCode
                            );


                        if (
                            !currentCode
                        ) {

                            const error =
                                new Error(
                                    "INVALID_ACCESS_CODE"
                                );

                            error.code =
                                "INVALID_ACCESS_CODE";

                            throw error;

                        }


                        if (
                            Number(currentCode.used) === 1
                        ) {

                            const error =
                                new Error(
                                    "ACCESS_CODE_ALREADY_USED"
                                );

                            error.code =
                                "ACCESS_CODE_ALREADY_USED";

                            throw error;

                        }


                        /*
                         * Final expiration check.
                         */

                        if (
                            currentCode.expires_at
                        ) {

                            const expiration =
                                new Date(
                                    currentCode.expires_at
                                );


                                if (
                                    !Number.isNaN(
                                        expiration.getTime()
                                    ) &&
                                    expiration.getTime() <=
                                        Date.now()
                                ) {

                                    const error =
                                        new Error(
                                            "ACCESS_CODE_EXPIRED"
                                        );

                                    error.code =
                                        "ACCESS_CODE_EXPIRED";

                                    throw error;

                                }

                        }


                        /*
                         * Insert student.
                         *
                         * Student payment_status is set to
                         * "paid" because possession of a valid
                         * LDC access code authorizes enrollment.
                         */

                        const result =
                            db.prepare(`
                                INSERT INTO students (
                                    full_name,
                                    email,
                                    phone,
                                    password_hash,
                                    course,
                                    level,
                                    access_code,
                                    payment_status,
                                    account_status,
                                    course_id
                                )
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            `).run(
                                cleanName,
                                cleanEmail,
                                cleanPhone,
                                passwordHash,
                                resolvedCourseName,
                                resolvedLevel,
                                cleanAccessCode,
                                "paid",
                                "active",
                                resolvedCourseId
                            );


                        studentId =
                            Number(
                                result.lastInsertRowid
                            );


                        /*
                         * Consume access code.
                         */

                        const updateResult =
                            db.prepare(`
                                UPDATE access_codes
                                SET
                                    used = 1,
                                    student_id = ?,
                                    used_by_student_id = ?,
                                    used_at = CURRENT_TIMESTAMP
                                WHERE id = ?
                                AND used = 0
                            `).run(
                                studentId,
                                studentId,
                                currentCode.id
                            );


                        if (
                            updateResult.changes !== 1
                        ) {

                            const error =
                                new Error(
                                    "ACCESS_CODE_ALREADY_USED"
                                );

                            error.code =
                                "ACCESS_CODE_ALREADY_USED";

                            throw error;

                        }


                        /*
                         * Create XP account.
                         */

                        db.prepare(`
                            INSERT OR IGNORE INTO student_xp (
                                student_id,
                                total_xp,
                                weekly_xp,
                                current_streak,
                                longest_streak
                            )
                            VALUES (?, 0, 0, 0, 0)
                        `).run(
                            studentId
                        );


                        return studentId;

                    });


                studentId =
                    registerStudent();

            } catch (error) {

                if (
                    error.code ===
                    "INVALID_ACCESS_CODE"
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid access code."

                    });

                }


                if (
                    error.code ===
                    "ACCESS_CODE_ALREADY_USED"
                ) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "This access code has already been used."

                    });

                }


                if (
                    error.code ===
                    "ACCESS_CODE_EXPIRED"
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "This access code has expired. Please contact LDC."

                    });

                }


                throw error;

            }


            /* =================================================
               GET CREATED STUDENT
            ================================================= */

            const student =
                db.prepare(`
                    SELECT
                        id,
                        full_name,
                        email,
                        phone,
                        course,
                        course_id,
                        level,
                        payment_status,
                        account_status,
                        created_at,
                        last_login_at
                    FROM students
                    WHERE id = ?
                    LIMIT 1
                `).get(
                    studentId
                );


            /* =================================================
               RESPONSE
            ================================================= */

            return res.status(201).json({

                success: true,

                message:
                    "Account created successfully.",

                student:
                    safeStudent(student)

            });

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );


            if (
                error &&
                (
                    error.code ===
                        "SQLITE_CONSTRAINT_UNIQUE" ||
                    error.code ===
                        "SQLITE_CONSTRAINT"
                )
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "An account with this information already exists."

                });

            }


            return sendServerError(
                res,
                "Something went wrong while creating your account."
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

            const {
                email,
                password
            } = req.body || {};


            /* =================================================
               VALIDATION
            ================================================= */

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


            const cleanEmail =
                normalizeEmail(email);


            if (
                !cleanEmail
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your email address."

                });

            }


            /* =================================================
               FIND STUDENT
            ================================================= */

            const student =
                db.prepare(`
                    SELECT *
                    FROM students
                    WHERE LOWER(email) = ?
                    LIMIT 1
                `).get(
                    cleanEmail
                );


            /*
             * Keep the error generic so the API does not
             * reveal whether an email exists.
             */

            if (
                !student
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."

                });

            }


            /* =================================================
               ACCOUNT STATUS
            ================================================= */

            if (
                student.account_status &&
                student.account_status !== "active"
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your student account is not active. Please contact LDC."

                });

            }


            /* =================================================
               PASSWORD HASH
            ================================================= */

            if (
                !student.password_hash
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."

                });

            }


            /* =================================================
               VERIFY PASSWORD
            ================================================= */

            const passwordCorrect =
                await bcrypt.compare(
                    password,
                    student.password_hash
                );


            if (
                !passwordCorrect
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid email or password."

                });

            }


            /* =================================================
               UPDATE LAST LOGIN
            ================================================= */

            try {

                db.prepare(`
                    UPDATE students
                    SET
                        last_login_at = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                `).run(
                    getKigaliDateTime(),
                    student.id
                );

            } catch (error) {

                console.warn(
                    "Could not update student last login:",
                    error.message
                );

            }


            /* =================================================
               JWT
            ================================================= */

            const token =
                jwt.sign(
                    {
                        studentId:
                            student.id,

                        email:
                            student.email,

                        role:
                            "student"
                    },
                    JWT_SECRET,
                    {
                        expiresIn:
                            JWT_EXPIRES_IN
                    }
                );


            /* =================================================
               GET UPDATED STUDENT
            ================================================= */

            const updatedStudent =
                db.prepare(`
                    SELECT
                        id,
                        full_name,
                        email,
                        phone,
                        course,
                        course_id,
                        level,
                        payment_status,
                        account_status,
                        created_at,
                        last_login_at
                    FROM students
                    WHERE id = ?
                    LIMIT 1
                `).get(
                    student.id
                );


            /* =================================================
               RESPONSE
            ================================================= */

            return res.json({

                success: true,

                message:
                    "Login successful.",

                token,

                expiresIn:
                    JWT_EXPIRES_IN,

                student:
                    safeStudent(
                        updatedStudent ||
                        student
                    )

            });

        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            return sendServerError(
                res,
                "Something went wrong while logging in."
            );

        }

    }
);


/* =========================================================
   DEVELOPMENT — CREATE TEST ACCESS CODE
========================================================= */

router.post(
    "/create-test-code",
    (req, res) => {

        try {

            const {
                code,
                course,
                courseId,
                level,
                expiresAt
            } = req.body || {};


            /* =================================================
               CODE VALIDATION
            ================================================= */

            if (
                typeof code !== "string"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Access code is required."

                });

            }


            const cleanCode =
                cleanString(
                    code
                ).toUpperCase();


            if (
                cleanCode.length < 4 ||
                cleanCode.length > 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid access code."

                });

            }


            /* =================================================
               COURSE
            ================================================= */

            const requestedCourseId =
                normalizeNullableId(
                    courseId
                );

            let resolvedCourseId =
                requestedCourseId;

            let resolvedCourse =
                null;


            if (
                requestedCourseId
            ) {

                resolvedCourse =
                    db.prepare(`
                        SELECT
                            id,
                            name,
                            level,
                            status,
                            fee
                        FROM courses
                        WHERE id = ?
                        LIMIT 1
                    `).get(
                        requestedCourseId
                    );


                if (
                    !resolvedCourse
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "The selected course does not exist."

                    });

                }


                if (
                    resolvedCourse.status !==
                    "active"
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "The selected course is not active."

                    });

                }

            }


            /* =================================================
               COURSE NAME
            ================================================= */

            const cleanCourse =
                cleanString(
                    course
                );


            const resolvedCourseName =
                cleanCourse ||
                (
                    resolvedCourse
                        ? resolvedCourse.name
                        : "German A1"
                );


            /* =================================================
               LEVEL
            ================================================= */

            const cleanLevel =
                normalizeLevel(
                    level ||
                    (
                        resolvedCourse
                            ? resolvedCourse.level
                            : "A1"
                    )
                );


            if (
                !cleanLevel
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Course level is required."

                });

            }


            /* =================================================
               DUPLICATE CHECK
            ================================================= */

            const existingCode =
                db.prepare(`
                    SELECT
                        id
                    FROM access_codes
                    WHERE UPPER(code) = ?
                    LIMIT 1
                `).get(
                    cleanCode
                );


            if (
                existingCode
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This access code already exists."

                });

            }


            /* =================================================
               EXPIRATION
            ================================================= */

            let cleanExpiresAt =
                expiresAt
                    ? cleanString(expiresAt)
                    : null;


            if (
                cleanExpiresAt
            ) {

                const expiration =
                    new Date(
                        cleanExpiresAt
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


                if (
                    expiration.getTime() <=
                    Date.now()
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Expiration date must be in the future."

                    });

                }

            }


            /* =================================================
               INSERT CODE
            ================================================= */

            db.prepare(`
                INSERT INTO access_codes (
                    code,
                    course,
                    level,
                    payment_status,
                    used,
                    course_id,
                    expires_at
                )
                VALUES (?, ?, ?, 'paid', 0, ?, ?)
            `).run(
                cleanCode,
                resolvedCourseName,
                cleanLevel,
                resolvedCourseId,
                cleanExpiresAt
            );


            /* =================================================
               RESPONSE
            ================================================= */

            return res.status(201).json({

                success: true,

                message:
                    "Test access code created.",

                accessCode: {

                    code:
                        cleanCode,

                    course:
                        resolvedCourseName,

                    courseId:
                        resolvedCourseId,

                    level:
                        cleanLevel,

                    paymentStatus:
                        "paid",

                    used:
                        false,

                    expiresAt:
                        cleanExpiresAt

                }

            });

        } catch (error) {

            console.error(
                "Create test access code error:",
                error
            );


            if (
                error &&
                (
                    error.code ===
                        "SQLITE_CONSTRAINT_UNIQUE" ||
                    error.code ===
                        "SQLITE_CONSTRAINT"
                )
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This access code already exists."

                });

            }


            return sendServerError(
                res,
                "Could not create access code."
            );

        }

    }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;

/* =========================================================
   LINGUA DEUTSCH CONNECT
   ONLINE LEARNING
   STUDENT AUTHENTICATION
========================================================= */

"use strict";

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../database");

const router = express.Router();


/* =========================================================
   CONFIGURATION
========================================================= */
const { JWT_SECRET } = require("../config/jwt");

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

    return cleanString(value)
        .toLowerCase();

}


function normalizeAccessCode(value) {

    return cleanString(value)
        .toUpperCase()
        .replace(/\s+/g, "");

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


function safeOnlineStudent(student) {

    if (!student) {

        return null;

    }


    return {

        id:
            student.id,

        firstName:
            student.first_name || "",

        lastName:
            student.last_name || "",

        name:
            `${student.first_name || ""} ${student.last_name || ""}`
                .trim(),

        email:
            student.email || "",

        phone:
            student.phone || "",

        profilePhoto:
            student.profile_photo || null,

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
                "LDC Online Learning authentication routes are working."

        });

    }
);


/* =========================================================
   ONLINE STUDENT REGISTER
========================================================= */

router.post(
    "/register",
    async (req, res) => {

        try {

            const {
                firstName,
                lastName,
                email,
                phone,
                password,
                accessCode
            } = req.body || {};


            /* =================================================
               REQUIRED FIELDS
            ================================================= */

            if (
                !firstName ||
                !email ||
                !password ||
                !accessCode
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "First name, email, password and access code are required."

                });

            }


            /* =================================================
               CLEAN INPUT
            ================================================= */

            const cleanFirstName =
                cleanString(firstName);

            const cleanLastName =
                cleanString(lastName);

            const cleanEmail =
                normalizeEmail(email);

            const cleanPhone =
                cleanString(phone);

            const cleanAccessCode =
                normalizeAccessCode(accessCode);


            /* =================================================
               FIRST NAME VALIDATION
            ================================================= */

            if (
                cleanFirstName.length < 2
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your first name."

                });

            }


            if (
                cleanFirstName.length > 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "First name is too long."

                });

            }


            /* =================================================
               LAST NAME VALIDATION
            ================================================= */

            if (
                cleanLastName.length > 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Last name is too long."

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


            if (
                cleanEmail.length > 255
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Email address is too long."

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
               ACCESS CODE VALIDATION
            ================================================= */

            if (
                !cleanAccessCode
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter your online learning access code."

                });

            }


            if (
                cleanAccessCode.length < 3
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please enter a valid access code."

                });

            }


            if (
                cleanAccessCode.length > 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Access code is too long."

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
               CHECK EMAIL BEFORE HASHING
            ================================================= */

            const existingStudent =
                db.prepare(`
                    SELECT
                        id
                    FROM online_students
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
                        "An online learning account with this email already exists. Please log in instead."

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
               REGISTRATION TRANSACTION
               
               Everything below happens together:
               
               1. Validate access code
               2. Create student
               3. Record code usage
               4. Increase usage count
               5. Auto-enroll in assigned course
               
               If anything fails, SQLite rolls everything back.
            ================================================= */

            let registrationResult;


            try {

                const registerStudent =
                    db.transaction(() => {

                        /* =====================================
                           RE-CHECK EMAIL
                        ===================================== */

                        const existing =
                            db.prepare(`
                                SELECT
                                    id
                                FROM online_students
                                WHERE LOWER(email) = ?
                                LIMIT 1
                            `).get(
                                cleanEmail
                            );


                        if (
                            existing
                        ) {

                            const error =
                                new Error(
                                    "EMAIL_ALREADY_EXISTS"
                                );

                            error.code =
                                "EMAIL_ALREADY_EXISTS";

                            throw error;

                        }


                        /* =====================================
                           FIND ACCESS CODE
                        ===================================== */

                        const accessCodeRecord =
                            db.prepare(`
                                SELECT
                                    id,
                                    code,
                                    course_id,
                                    max_uses,
                                    used_count,
                                    expires_at,
                                    status
                                FROM online_access_codes
                                WHERE UPPER(code) = ?
                                LIMIT 1
                            `).get(
                                cleanAccessCode
                            );


                        /* =====================================
                           CODE NOT FOUND
                        ===================================== */

                        if (
                            !accessCodeRecord
                        ) {

                            const error =
                                new Error(
                                    "ACCESS_CODE_INVALID"
                                );

                            error.code =
                                "ACCESS_CODE_INVALID";

                            throw error;

                        }


                        /* =====================================
                           CODE STATUS
                        ===================================== */

                        if (
                            accessCodeRecord.status !== "active"
                        ) {

                            const error =
                                new Error(
                                    "ACCESS_CODE_INACTIVE"
                                );

                            error.code =
                                "ACCESS_CODE_INACTIVE";

                            throw error;

                        }


                        /* =====================================
                           CODE EXPIRATION
                        ===================================== */

                        if (
                            accessCodeRecord.expires_at
                        ) {

                            const expiryTime =
                                new Date(
                                    accessCodeRecord.expires_at
                                );

                            const currentTime =
                                new Date();


                            if (
                                !Number.isNaN(
                                    expiryTime.getTime()
                                ) &&
                                expiryTime <= currentTime
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


                        /* =====================================
                           CODE USAGE LIMIT
                        ===================================== */

                        const maxUses =
                            Number(
                                accessCodeRecord.max_uses
                            );

                        const usedCount =
                            Number(
                                accessCodeRecord.used_count || 0
                            );


                        if (
                            Number.isFinite(maxUses) &&
                            maxUses > 0 &&
                            usedCount >= maxUses
                        ) {

                            const error =
                                new Error(
                                    "ACCESS_CODE_EXHAUSTED"
                                );

                            error.code =
                                "ACCESS_CODE_EXHAUSTED";

                            throw error;

                        }


                        /* =====================================
                           CHECK ASSIGNED COURSE
                        ===================================== */

                        let assignedCourse =
                            null;


                        if (
                            accessCodeRecord.course_id
                        ) {

                            assignedCourse =
                                db.prepare(`
                                    SELECT
                                        id,
                                        title,
                                        description,
                                        level,
                                        thumbnail,
                                        status
                                    FROM online_courses
                                    WHERE id = ?
                                    LIMIT 1
                                `).get(
                                    accessCodeRecord.course_id
                                );


                            if (
                                !assignedCourse
                            ) {

                                const error =
                                    new Error(
                                        "ACCESS_CODE_COURSE_NOT_FOUND"
                                    );

                                error.code =
                                    "ACCESS_CODE_COURSE_NOT_FOUND";

                                throw error;

                            }

                        }


                        /* =====================================
                           CREATE ONLINE STUDENT
                        ===================================== */

                        const studentInsert =
                            db.prepare(`
                                INSERT INTO online_students (
                                    first_name,
                                    last_name,
                                    email,
                                    password_hash,
                                    phone,
                                    account_status,
                                    online_access_code_id
                                )
                                VALUES (
                                    ?,
                                    ?,
                                    ?,
                                    ?,
                                    ?,
                                    'active',
                                    ?
                                )
                            `).run(
                                cleanFirstName,
                                cleanLastName,
                                cleanEmail,
                                passwordHash,
                                cleanPhone,
                                accessCodeRecord.id
                            );


                        const studentId =
                            Number(
                                studentInsert.lastInsertRowid
                            );


                        /* =====================================
                           RECORD ACCESS CODE USE
                        ===================================== */

                        db.prepare(`
                            INSERT INTO online_access_code_uses (
                                access_code_id,
                                student_id,
                                used_at
                            )
                            VALUES (
                                ?,
                                ?,
                                CURRENT_TIMESTAMP
                            )
                        `).run(
                            accessCodeRecord.id,
                            studentId
                        );


                        /* =====================================
                           INCREMENT CODE USAGE
                        ===================================== */

                        db.prepare(`
                            UPDATE online_access_codes
                            SET
                                used_count = used_count + 1,
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                        `).run(
                            accessCodeRecord.id
                        );


                        /* =====================================
                           AUTO ENROLL
                        ===================================== */

                        let enrollmentCreated =
                            false;


                        if (
                            assignedCourse
                        ) {

                            db.prepare(`
                                INSERT INTO online_enrollments (
                                    student_id,
                                    course_id,
                                    enrolled_at,
                                    status
                                )
                                VALUES (
                                    ?,
                                    ?,
                                    CURRENT_TIMESTAMP,
                                    'active'
                                )
                            `).run(
                                studentId,
                                assignedCourse.id
                            );


                            enrollmentCreated =
                                true;

                        }


                        return {

                            studentId,

                            accessCodeId:
                                accessCodeRecord.id,

                            accessCode:
                                accessCodeRecord.code,

                            courseId:
                                assignedCourse
                                    ? assignedCourse.id
                                    : null,

                            enrollmentCreated,

                            enrolledCourse:
                                assignedCourse

                        };

                    });


                registrationResult =
                    registerStudent();

            } catch (error) {

                /* =============================================
                   DUPLICATE EMAIL
                ============================================= */

                if (
                    error.code ===
                    "EMAIL_ALREADY_EXISTS"
                ) {

                    return res.status(409).json({

                        success: false,

                        message:
                            "An online learning account with this email already exists. Please log in instead."

                    });

                }


                /* =============================================
                   INVALID CODE
                ============================================= */

                if (
                    error.code ===
                    "ACCESS_CODE_INVALID"
                ) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "Invalid online learning access code. Please check your code and try again."

                    });

                }


                /* =============================================
                   INACTIVE CODE
                ============================================= */

                if (
                    error.code ===
                    "ACCESS_CODE_INACTIVE"
                ) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "This access code is not active. Please contact LDC."

                    });

                }


                /* =============================================
                   EXPIRED CODE
                ============================================= */

                if (
                    error.code ===
                    "ACCESS_CODE_EXPIRED"
                ) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "This access code has expired. Please contact LDC for a new code."

                    });

                }


                /* =============================================
                   EXHAUSTED CODE
                ============================================= */

                if (
                    error.code ===
                    "ACCESS_CODE_EXHAUSTED"
                ) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "This access code has already reached its maximum number of uses. Please contact LDC for a new code."

                    });

                }


                /* =============================================
                   COURSE NOT FOUND
                ============================================= */

                if (
                    error.code ===
                    "ACCESS_CODE_COURSE_NOT_FOUND"
                ) {

                    return res.status(500).json({

                        success: false,

                        message:
                            "This access code is linked to a course that is no longer available. Please contact LDC."

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
                `).get(
                    registrationResult.studentId
                );


            /* =================================================
               RESPONSE
            ================================================= */

            return res.status(201).json({

                success: true,

                message:
                    "Online learning account created successfully.",

                student:
                    safeOnlineStudent(
                        student
                    ),

                accessCode: {

                    id:
                        registrationResult.accessCodeId,

                    code:
                        registrationResult.accessCode

                },

                enrollment: {

                    created:
                        registrationResult.enrollmentCreated,

                    course:
                        registrationResult.enrolledCourse
                            ? {

                                id:
                                    registrationResult
                                        .enrolledCourse
                                        .id,

                                title:
                                    registrationResult
                                        .enrolledCourse
                                        .title,

                                description:
                                    registrationResult
                                        .enrolledCourse
                                        .description,

                                level:
                                    registrationResult
                                        .enrolledCourse
                                        .level,

                                thumbnail:
                                    registrationResult
                                        .enrolledCourse
                                        .thumbnail,

                                status:
                                    registrationResult
                                        .enrolledCourse
                                        .status

                            }
                            : null

                }

            });

        } catch (error) {

            console.error(
                "Online student registration error:",
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
                        "An online learning account with this email already exists."

                });

            }


            return sendServerError(
                res,
                "Something went wrong while creating your online learning account."
            );

        }

    }
);


/* =========================================================
   ONLINE STUDENT LOGIN
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
                normalizeEmail(
                    email
                );


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
               FIND ONLINE STUDENT
            ================================================= */

            const student =
                db.prepare(`
                    SELECT *
                    FROM online_students
                    WHERE LOWER(email) = ?
                    LIMIT 1
                `).get(
                    cleanEmail
                );


            /* =================================================
               INVALID LOGIN
            ================================================= */

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
                        "Your online learning account is not active. Please contact LDC."

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
                    UPDATE online_students
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
                    "Could not update online student last login:",
                    error.message
                );

            }


            /* =================================================
               CREATE JWT
            ================================================= */

            const token =
                jwt.sign(
                    {
                        onlineStudentId:
                            student.id,

                        email:
                            student.email,

                        role:
                            "online_student"
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
                `).get(
                    student.id
                );


            /* =================================================
               RESPONSE
            ================================================= */

            return res.json({

                success: true,

                message:
                    "Online learning login successful.",

                token,

                expiresIn:
                    JWT_EXPIRES_IN,

                student:
                    safeOnlineStudent(
                        updatedStudent ||
                        student
                    )

            });

        } catch (error) {

            console.error(
                "Online student login error:",
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
   EXPORT
========================================================= */

module.exports = router;
/* =========================================================
   LINGUA DEUTSCH CONNECT
   ONLINE LEARNING
   ONLINE STUDENT ROUTES
========================================================= */

const express = require("express");

const db = require("../database");

const authenticateOnlineStudent =
    require("../middleware/onlineStudentAuth");

const router = express.Router();


/* =========================================================
   HELPERS
========================================================= */

function cleanString(value) {

    return typeof value === "string"
        ? value.trim()
        : "";

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


function sendServerError(
    res,
    message
) {

    return res.status(500).json({

        success: false,

        message:
            message ||
            "Internal server error."

    });

}


/* =========================================================
   WORD COUNT HELPER
========================================================= */

function countWords(text) {

    const clean =
        cleanString(text);

    if (!clean) {

        return 0;

    }

    return clean
        .split(/\s+/)
        .filter(Boolean)
        .length;

}


/* =========================================================
   CHECK IF WRITING TASK IS ACCESSIBLE
========================================================= */

function canAccessWritingTask(
    studentId,
    task
) {

    if (!task) {

        return false;

    }


    /*
     * Tasks without a course are available to
     * all online students.
     */

    if (!task.course_id) {

        return true;

    }


    const enrollment =
        db.prepare(`
            SELECT
                id
            FROM online_enrollments
            WHERE student_id = ?
            AND course_id = ?
            AND status = 'active'
            LIMIT 1
        `).get(
            studentId,
            task.course_id
        );


    return Boolean(enrollment);

}


/* =========================================================
   TEST ROUTE
========================================================= */

router.get(
    "/test",
    authenticateOnlineStudent,
    (req, res) => {

        return res.json({

            success: true,

            message:
                "LDC Online Student API is working.",

            studentId:
                req.onlineStudentId

        });

    }
);


/* =========================================================
   GET MY PROFILE
========================================================= */

router.get(
    "/profile",
    authenticateOnlineStudent,
    (req, res) => {

        try {

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
                    req.onlineStudentId
                );


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student profile not found."

                });

            }


            return res.json({

                success: true,

                student: {

                    id:
                        student.id,

                    firstName:
                        student.first_name,

                    lastName:
                        student.last_name,

                    name:
                        `${student.first_name || ""} ${student.last_name || ""}`
                            .trim(),

                    email:
                        student.email,

                    phone:
                        student.phone,

                    profilePhoto:
                        student.profile_photo,

                    accountStatus:
                        student.account_status,

                    createdAt:
                        student.created_at,

                    lastLoginAt:
                        student.last_login_at

                }

            });

        } catch (error) {

            console.error(
                "Get online student profile error:",
                error
            );

            return sendServerError(
                res,
                "Could not load your profile."
            );

        }

    }
);


/* =========================================================
   UPDATE MY PROFILE
========================================================= */

router.patch(
    "/profile",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const {
                firstName,
                lastName,
                phone,
                profilePhoto
            } = req.body || {};


            const cleanFirstName =
                cleanString(
                    firstName
                );

            const cleanLastName =
                cleanString(
                    lastName
                );

            const cleanPhone =
                cleanString(
                    phone
                );

            const cleanProfilePhoto =
                cleanString(
                    profilePhoto
                );


            if (
                cleanFirstName &&
                cleanFirstName.length < 2
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "First name is too short."

                });

            }


            if (
                cleanFirstName.length > 100 ||
                cleanLastName.length > 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Name is too long."

                });

            }


            if (
                cleanPhone.length > 30
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Phone number is too long."

                });

            }


            if (
                cleanProfilePhoto.length > 500
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Profile photo URL is too long."

                });

            }


            const current =
                db.prepare(`
                    SELECT
                        first_name,
                        last_name,
                        phone,
                        profile_photo
                    FROM online_students
                    WHERE id = ?
                    LIMIT 1
                `).get(
                    req.onlineStudentId
                );


            if (!current) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student profile not found."

                });

            }


            db.prepare(`
                UPDATE online_students
                SET
                    first_name = ?,
                    last_name = ?,
                    phone = ?,
                    profile_photo = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(

                cleanFirstName ||
                    current.first_name,

                cleanLastName ||
                    current.last_name,

                cleanPhone,

                cleanProfilePhoto ||
                    null,

                req.onlineStudentId

            );


            const updated =
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
                    req.onlineStudentId
                );


            return res.json({

                success: true,

                message:
                    "Profile updated successfully.",

                student: {

                    id:
                        updated.id,

                    firstName:
                        updated.first_name,

                    lastName:
                        updated.last_name,

                    name:
                        `${updated.first_name || ""} ${updated.last_name || ""}`
                            .trim(),

                    email:
                        updated.email,

                    phone:
                        updated.phone,

                    profilePhoto:
                        updated.profile_photo,

                    accountStatus:
                        updated.account_status

                }

            });

        } catch (error) {

            console.error(
                "Update online student profile error:",
                error
            );

            return sendServerError(
                res,
                "Could not update your profile."
            );

        }

    }
);


/* =========================================================
   DASHBOARD
========================================================= */

router.get(
    "/dashboard",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const studentId =
                req.onlineStudentId;


            /* =================================================
               ENROLLED COURSES
            ================================================= */

            const courses =
                db.prepare(`
                    SELECT
                        c.id,
                        c.title,
                        c.description,
                        c.level,
                        c.thumbnail,
                        c.status,
                        e.enrolled_at,
                        e.status AS enrollment_status,
                        e.completed_at
                    FROM online_enrollments e
                    INNER JOIN online_courses c
                        ON c.id = e.course_id
                    WHERE e.student_id = ?
                    ORDER BY e.enrolled_at DESC
                `).all(
                    studentId
                );


            /* =================================================
               COMPLETED LESSONS
            ================================================= */

            const completedResult =
                db.prepare(`
                    SELECT
                        COUNT(*) AS count
                    FROM online_progress
                    WHERE student_id = ?
                    AND completed = 1
                `).get(
                    studentId
                );


            /* =================================================
               TOTAL LESSONS
            ================================================= */

            const totalLessonResult =
                db.prepare(`
                    SELECT
                        COUNT(*) AS count
                    FROM online_enrollments e
                    INNER JOIN online_modules m
                        ON m.course_id = e.course_id
                    INNER JOIN online_lessons l
                        ON l.module_id = m.id
                    WHERE e.student_id = ?
                    AND l.status = 'published'
                `).get(
                    studentId
                );


            /* =================================================
               LEARNING TIME
            ================================================= */

            const learningTimeResult =
                db.prepare(`
                    SELECT
                        COALESCE(
                            SUM(duration_seconds),
                            0
                        ) AS total_seconds
                    FROM online_learning_sessions
                    WHERE student_id = ?
                `).get(
                    studentId
                );


            /* =================================================
               ACTIVE SESSIONS
            ================================================= */

            const activeSessions =
                db.prepare(`
                    SELECT
                        COUNT(*) AS count
                    FROM online_learning_sessions
                    WHERE student_id = ?
                    AND ended_at IS NULL
                `).get(
                    studentId
                );


            /* =================================================
               PARTICIPATION
            ================================================= */

            const participationResult =
                db.prepare(`
                    SELECT
                        COUNT(*) AS count
                    FROM online_participation
                    WHERE student_id = ?
                `).get(
                    studentId
                );


            /* =================================================
               WRITING
            ================================================= */

            const writingTaskResult =
                db.prepare(`
                    SELECT
                        COUNT(*) AS count
                    FROM online_writing_tasks t
                    WHERE t.status = 'published'
                    AND (
                        t.course_id IS NULL
                        OR EXISTS (
                            SELECT 1
                            FROM online_enrollments e
                            WHERE e.student_id = ?
                            AND e.course_id = t.course_id
                            AND e.status = 'active'
                        )
                    )
                `).get(
                    studentId
                );


            const writingSubmissionResult =
                db.prepare(`
                    SELECT
                        COUNT(*) AS count
                    FROM online_writing_submissions
                    WHERE student_id = ?
                `).get(
                    studentId
                );


            const writingReviewedResult =
                db.prepare(`
                    SELECT
                        COUNT(*) AS count
                    FROM online_writing_submissions
                    WHERE student_id = ?
                    AND status = 'reviewed'
                `).get(
                    studentId
                );


            return res.json({

                success: true,

                student: {

                    id:
                        req.onlineStudent.id,

                    firstName:
                        req.onlineStudent.first_name,

                    lastName:
                        req.onlineStudent.last_name,

                    name:
                        `${req.onlineStudent.first_name || ""} ${req.onlineStudent.last_name || ""}`
                            .trim(),

                    email:
                        req.onlineStudent.email,

                    profilePhoto:
                        req.onlineStudent.profile_photo

                },

                statistics: {

                    enrolledCourses:
                        courses.length,

                    completedLessons:
                        Number(
                            completedResult.count
                        ),

                    totalLessons:
                        Number(
                            totalLessonResult.count
                        ),

                    totalLearningSeconds:
                        Number(
                            learningTimeResult.total_seconds
                        ),

                    activeSessions:
                        Number(
                            activeSessions.count
                        ),

                    participationCount:
                        Number(
                            participationResult.count
                        ),

                    writingTasks:
                        Number(
                            writingTaskResult.count
                        ),

                    writingSubmissions:
                        Number(
                            writingSubmissionResult.count
                        ),

                    writingReviewed:
                        Number(
                            writingReviewedResult.count
                        )

                },

                courses

            });

        } catch (error) {

            console.error(
                "Online student dashboard error:",
                error
            );

            return sendServerError(
                res,
                "Could not load your dashboard."
            );

        }

    }
);


/* =========================================================
   GET MY COURSES
========================================================= */

router.get(
    "/courses",
    authenticateOnlineStudent,
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
                        e.id AS enrollment_id,
                        e.enrolled_at,
                        e.status AS enrollment_status,
                        e.completed_at
                    FROM online_enrollments e
                    INNER JOIN online_courses c
                        ON c.id = e.course_id
                    WHERE e.student_id = ?
                    ORDER BY e.enrolled_at DESC
                `).all(
                    req.onlineStudentId
                );


            const enrichedCourses =
                courses.map(
                    course => {

                        const lessonStats =
                            db.prepare(`
                                SELECT
                                    COUNT(*) AS total_lessons
                                FROM online_modules m
                                INNER JOIN online_lessons l
                                    ON l.module_id = m.id
                                WHERE m.course_id = ?
                                AND l.status = 'published'
                            `).get(
                                course.id
                            );

const completedStats =
    db.prepare(`
        SELECT
            COUNT(CASE WHEN p.completed = 1 THEN 1 END) AS completed_lessons,
            COALESCE(SUM(p.progress), 0) AS progress_sum
        FROM online_progress p
        INNER JOIN online_lessons l
            ON l.id = p.lesson_id
        INNER JOIN online_modules m
            ON m.id = l.module_id
        WHERE p.student_id = ?
        AND m.course_id = ?
        AND l.status = 'published'
    `).get(
        req.onlineStudentId,
        course.id
    );

const total = Number(lessonStats.total_lessons);
const completed = Number(completedStats.completed_lessons);

const progress =
    total > 0
        ? Math.min(
            100,
            Math.round(
                Number(completedStats.progress_sum) / total
            )
        )
        : 0;

                        return {

                            ...course,

                            totalLessons:
                                total,

                            completedLessons:
                                completed,

                            progress

                        };

                    }
                );


            return res.json({

                success: true,

                courses:
                    enrichedCourses

            });

        } catch (error) {

            console.error(
                "Get online student courses error:",
                error
            );

            return sendServerError(
                res,
                "Could not load your courses."
            );

        }

    }
);


/* =========================================================
   GET COURSE DETAILS
========================================================= */

router.get(
    "/courses/:courseId",
    authenticateOnlineStudent,
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


            /* =================================================
               CHECK ENROLLMENT
            ================================================= */

            const enrollment =
                db.prepare(`
                    SELECT
                        id,
                        enrolled_at,
                        status,
                        completed_at
                    FROM online_enrollments
                    WHERE student_id = ?
                    AND course_id = ?
                    LIMIT 1
                `).get(
                    req.onlineStudentId,
                    courseId
                );


            if (!enrollment) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You are not enrolled in this course."

                });

            }


            /* =================================================
               COURSE
            ================================================= */

            const course =
                db.prepare(`
                    SELECT
                        id,
                        title,
                        description,
                        level,
                        thumbnail,
                        status,
                        created_at,
                        updated_at
                    FROM online_courses
                    WHERE id = ?
                    LIMIT 1
                `).get(
                    courseId
                );


            if (!course) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Course not found."

                });

            }


            /* =================================================
               MODULES
            ================================================= */

            const modules =
                db.prepare(`
                    SELECT
                        id,
                        title,
                        description,
                        module_order,
                        status
                    FROM online_modules
                    WHERE course_id = ?
                    ORDER BY module_order ASC, id ASC
                `).all(
                    courseId
                );


            const modulesWithLessons =
                modules.map(
                    module => {

                        const lessons =
                            db.prepare(`
                                SELECT
                                    l.id,
                                    l.title,
                                    l.description,
                                    l.duration_minutes,
                                    l.lesson_order,
                                    l.status,

                                    COALESCE(
                                        p.progress,
                                        0
                                    ) AS progress,

                                    COALESCE(
                                        p.completed,
                                        0
                                    ) AS completed,

                                    COALESCE(
                                        p.last_position,
                                        0
                                    ) AS last_position

                                FROM online_lessons l

                                LEFT JOIN online_progress p
                                    ON p.lesson_id = l.id
                                    AND p.student_id = ?

                                WHERE l.module_id = ?

                                ORDER BY
                                    l.lesson_order ASC,
                                    l.id ASC
                            `).all(
                                req.onlineStudentId,
                                module.id
                            );


                        return {

                            ...module,

                            lessons

                        };

                    }
                );


            return res.json({

                success: true,

                course: {

                    ...course,

                    enrollment,

                    modules:
                        modulesWithLessons

                }

            });

        } catch (error) {

            console.error(
                "Get online course details error:",
                error
            );

            return sendServerError(
                res,
                "Could not load the course."
            );

        }

    }
);


/* =========================================================
   GET LESSON DETAILS
========================================================= */

router.get(
    "/lessons/:lessonId",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const lessonId =
                Number(
                    req.params.lessonId
                );


            if (
                !Number.isInteger(lessonId) ||
                lessonId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid lesson ID."

                });

            }


            /* =================================================
               LESSON + COURSE
            ================================================= */

            const lesson =
                db.prepare(`
                    SELECT
                        l.id,
                        l.module_id,
                        l.title,
                        l.description,
                        l.content,
                        l.video_url,
                        l.pdf_url,
                        l.duration_minutes,
                        l.lesson_order,
                        l.status,

                        m.title AS module_title,
                        m.course_id,

                        c.title AS course_title,
                        c.level AS course_level

                    FROM online_lessons l

                    INNER JOIN online_modules m
                        ON m.id = l.module_id

                    INNER JOIN online_courses c
                        ON c.id = m.course_id

                    WHERE l.id = ?

                    LIMIT 1
                `).get(
                    lessonId
                );


            if (!lesson) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Lesson not found."

                });

            }


            /* =================================================
               CHECK ENROLLMENT
            ================================================= */

            const enrollment =
                db.prepare(`
                    SELECT
                        id,
                        enrolled_at,
                        status,
                        completed_at
                    FROM online_enrollments
                    WHERE student_id = ?
                    AND course_id = ?
                    LIMIT 1
                `).get(
                    req.onlineStudentId,
                    lesson.course_id
                );


            if (!enrollment) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You are not enrolled in this course."

                });

            }


            /* =================================================
               PROGRESS
            ================================================= */

            const progress =
                db.prepare(`
                    SELECT
                        id,
                        video_seconds,
                        progress,
                        completed,
                        last_position,
                        updated_at
                    FROM online_progress
                    WHERE student_id = ?
                    AND lesson_id = ?
                    LIMIT 1
                `).get(
                    req.onlineStudentId,
                    lessonId
                );


            /* =================================================
               MATERIALS
            ================================================= */

            const materials =
                db.prepare(`
                    SELECT
                        id,
                        title,
                        type,
                        url,
                        file_name,
                        description,
                        created_at
                    FROM online_lesson_materials
                    WHERE lesson_id = ?
                    ORDER BY id ASC
                `).all(
                    lessonId
                );


            return res.json({

                success: true,

                lesson: {

                    id:
                        lesson.id,

                    moduleId:
                        lesson.module_id,

                    title:
                        lesson.title,

                    description:
                        lesson.description,

                    content:
                        lesson.content,

                    videoUrl:
                        lesson.video_url,

                    pdfUrl:
                        lesson.pdf_url,

                    durationMinutes:
                        lesson.duration_minutes,

                    lessonOrder:
                        lesson.lesson_order,

                    status:
                        lesson.status,

                    moduleTitle:
                        lesson.module_title,

                    courseId:
                        lesson.course_id,

                    courseTitle:
                        lesson.course_title,

                    courseLevel:
                        lesson.course_level,

                    enrollment,

                    progress:
                        progress || {

                            video_seconds: 0,
                            progress: 0,
                            completed: 0,
                            last_position: 0

                        },

                    materials

                }

            });

        } catch (error) {

            console.error(
                "Get online lesson error:",
                error
            );

            return sendServerError(
                res,
                "Could not load the lesson."
            );

        }

    }
);


/* =========================================================
   SAVE LESSON PROGRESS
========================================================= */

router.post(
    "/lessons/:lessonId/progress",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const lessonId =
                Number(
                    req.params.lessonId
                );


            if (
                !Number.isInteger(lessonId) ||
                lessonId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid lesson ID."

                });

            }


            let videoSeconds =
                Number(
                    req.body.videoSeconds
                );

            let progress =
                Number(
                    req.body.progress
                );

            let lastPosition =
                Number(
                    req.body.lastPosition
                );

            let completed =
                req.body.completed
                    ? 1
                    : 0;


            if (
                !Number.isFinite(videoSeconds) ||
                videoSeconds < 0
            ) {

                videoSeconds = 0;

            }


            if (
                !Number.isFinite(progress)
            ) {

                progress = 0;

            }


            if (
                !Number.isFinite(lastPosition) ||
                lastPosition < 0
            ) {

                lastPosition = 0;

            }


            progress =
                Math.max(
                    0,
                    Math.min(
                        100,
                        progress
                    )
                );


            /* =================================================
               CHECK LESSON
            ================================================= */

            const lesson =
                db.prepare(`
                    SELECT
                        l.id,
                        m.course_id
                    FROM online_lessons l
                    INNER JOIN online_modules m
                        ON m.id = l.module_id
                    WHERE l.id = ?
                    LIMIT 1
                `).get(
                    lessonId
                );


            if (!lesson) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Lesson not found."

                });

            }


            /* =================================================
               CHECK ENROLLMENT
            ================================================= */

            const enrollment =
                db.prepare(`
                    SELECT
                        id
                    FROM online_enrollments
                    WHERE student_id = ?
                    AND course_id = ?
                    LIMIT 1
                `).get(
                    req.onlineStudentId,
                    lesson.course_id
                );


            if (!enrollment) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You are not enrolled in this course."

                });

            }


            /*
             * Automatically complete the lesson
             * when progress reaches 100%.
             */

            if (
                progress >= 100
            ) {

                progress = 100;

                completed = 1;

            }


            /* =================================================
               UPSERT PROGRESS
            ================================================= */

            db.prepare(`
                INSERT INTO online_progress (
                    student_id,
                    lesson_id,
                    video_seconds,
                    progress,
                    completed,
                    last_position,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)

                ON CONFLICT(
                    student_id,
                    lesson_id
                )
                DO UPDATE SET

                    video_seconds =
                        excluded.video_seconds,

                    progress =
                        excluded.progress,

                    completed =
                        excluded.completed,

                    last_position =
                        excluded.last_position,

                    updated_at =
                        CURRENT_TIMESTAMP
            `).run(

                req.onlineStudentId,

                lessonId,

                Math.floor(
                    videoSeconds
                ),

                progress,

                completed,

                Math.floor(
                    lastPosition
                )

            );


            const saved =
                db.prepare(`
                    SELECT
                        id,
                        student_id,
                        lesson_id,
                        video_seconds,
                        progress,
                        completed,
                        last_position,
                        updated_at
                    FROM online_progress
                    WHERE student_id = ?
                    AND lesson_id = ?
                    LIMIT 1
                `).get(
                    req.onlineStudentId,
                    lessonId
                );


            return res.json({

                success: true,

                message:
                    "Lesson progress saved.",

                progress:
                    saved

            });

        } catch (error) {

            console.error(
                "Save online lesson progress error:",
                error
            );

            return sendServerError(
                res,
                "Could not save lesson progress."
            );

        }

    }
);


/* =========================================================
   START LEARNING SESSION
========================================================= */

router.post(
    "/sessions/start",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const lessonId =
                req.body.lessonId
                    ? Number(
                        req.body.lessonId
                    )
                    : null;


            if (
                lessonId !== null &&
                (
                    !Number.isInteger(
                        lessonId
                    ) ||
                    lessonId <= 0
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid lesson ID."

                });

            }


            if (
                lessonId
            ) {

                const lesson =
                    db.prepare(`
                        SELECT
                            l.id,
                            m.course_id
                        FROM online_lessons l
                        INNER JOIN online_modules m
                            ON m.id = l.module_id
                        WHERE l.id = ?
                        LIMIT 1
                    `).get(
                        lessonId
                    );


                if (!lesson) {

                    return res.status(404).json({

                        success: false,

                        message:
                            "Lesson not found."

                    });

                }


                const enrollment =
                    db.prepare(`
                        SELECT
                            id
                        FROM online_enrollments
                        WHERE student_id = ?
                        AND course_id = ?
                        LIMIT 1
                    `).get(
                        req.onlineStudentId,
                        lesson.course_id
                    );


                if (!enrollment) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "You are not enrolled in this course."

                    });

                }

            }


            /*
             * Close old abandoned sessions.
             *
             * Sessions with no activity for more than
             * 30 minutes are automatically closed.
             */

            db.prepare(`
                UPDATE online_learning_sessions
                SET
                    ended_at = last_activity,
                    duration_seconds =
                        CASE
                            WHEN started_at IS NOT NULL
                            AND last_activity IS NOT NULL
                            THEN CAST(
                                (
                                    julianday(last_activity) -
                                    julianday(started_at)
                                ) * 86400
                                AS INTEGER
                            )
                            ELSE 0
                        END
                WHERE student_id = ?
                AND ended_at IS NULL
                AND last_activity <
                    datetime('now', '-30 minutes')
            `).run(
                req.onlineStudentId
            );


            /* =================================================
               CREATE SESSION
            ================================================= */

            const now =
                getKigaliDateTime();


            const result =
                db.prepare(`
                    INSERT INTO online_learning_sessions (
                        student_id,
                        lesson_id,
                        started_at,
                        last_activity,
                        duration_seconds
                    )
                    VALUES (?, ?, ?, ?, 0)
                `).run(

                    req.onlineStudentId,

                    lessonId,

                    now,

                    now

                );


            return res.status(201).json({

                success: true,

                message:
                    "Learning session started.",

                session: {

                    id:
                        Number(
                            result.lastInsertRowid
                        ),

                    lessonId,

                    startedAt:
                        now,

                    lastActivity:
                        now

                }

            });

        } catch (error) {

            console.error(
                "Start online learning session error:",
                error
            );

            return sendServerError(
                res,
                "Could not start learning session."
            );

        }

    }
);


/* =========================================================
   HEARTBEAT LEARNING SESSION
========================================================= */

router.post(
    "/sessions/:sessionId/heartbeat",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const sessionId =
                Number(
                    req.params.sessionId
                );


            if (
                !Number.isInteger(sessionId) ||
                sessionId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid session ID."

                });

            }


            const session =
                db.prepare(`
                    SELECT
                        id,
                        student_id,
                        started_at,
                        last_activity,
                        ended_at
                    FROM online_learning_sessions
                    WHERE id = ?
                    AND student_id = ?
                    LIMIT 1
                `).get(
                    sessionId,
                    req.onlineStudentId
                );


            if (!session) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Learning session not found."

                });

            }


            if (
                session.ended_at
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This learning session has already ended."

                });

            }


            const now =
                getKigaliDateTime();


            const duration =
                Math.max(
                    0,
                    Math.floor(
                        (
                            new Date(now) -
                            new Date(session.started_at)
                        ) / 1000
                    )
                );


            db.prepare(`
                UPDATE online_learning_sessions
                SET
                    last_activity = ?,
                    duration_seconds = ?
                WHERE id = ?
                AND student_id = ?
                AND ended_at IS NULL
            `).run(

                now,

                duration,

                sessionId,

                req.onlineStudentId

            );


            return res.json({

                success: true,

                message:
                    "Learning session updated.",

                session: {

                    id:
                        sessionId,

                    lastActivity:
                        now,

                    durationSeconds:
                        duration

                }

            });

        } catch (error) {

            console.error(
                "Online learning heartbeat error:",
                error
            );

            return sendServerError(
                res,
                "Could not update learning session."
            );

        }

    }
);


/* =========================================================
   END LEARNING SESSION
========================================================= */

router.post(
    "/sessions/:sessionId/end",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const sessionId =
                Number(
                    req.params.sessionId
                );


            if (
                !Number.isInteger(sessionId) ||
                sessionId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid session ID."

                });

            }


            const session =
                db.prepare(`
                    SELECT
                        id,
                        started_at,
                        last_activity,
                        ended_at
                    FROM online_learning_sessions
                    WHERE id = ?
                    AND student_id = ?
                    LIMIT 1
                `).get(
                    sessionId,
                    req.onlineStudentId
                );


            if (!session) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Learning session not found."

                });

            }


            if (
                session.ended_at
            ) {

                return res.json({

                    success: true,

                    message:
                        "Learning session was already ended.",

                    session

                });

            }


            const now =
                getKigaliDateTime();


            const duration =
                Math.max(
                    0,
                    Math.floor(
                        (
                            new Date(now) -
                            new Date(session.started_at)
                        ) / 1000
                    )
                );


            db.prepare(`
                UPDATE online_learning_sessions
                SET
                    last_activity = ?,
                    ended_at = ?,
                    duration_seconds = ?
                WHERE id = ?
                AND student_id = ?
                AND ended_at IS NULL
            `).run(

                now,

                now,

                duration,

                sessionId,

                req.onlineStudentId

            );


            return res.json({

                success: true,

                message:
                    "Learning session ended.",

                session: {

                    id:
                        sessionId,

                    startedAt:
                        session.started_at,

                    endedAt:
                        now,

                    durationSeconds:
                        duration

                }

            });

        } catch (error) {

            console.error(
                "End online learning session error:",
                error
            );

            return sendServerError(
                res,
                "Could not end learning session."
            );

        }

    }
);


/* =========================================================
   MY LEARNING TIME
========================================================= */

router.get(
    "/learning-time",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const total =
                db.prepare(`
                    SELECT
                        COALESCE(
                            SUM(duration_seconds),
                            0
                        ) AS total_seconds
                    FROM online_learning_sessions
                    WHERE student_id = ?
                `).get(
                    req.onlineStudentId
                );


            const today =
                db.prepare(`
                    SELECT
                        COALESCE(
                            SUM(duration_seconds),
                            0
                        ) AS total_seconds
                    FROM online_learning_sessions
                    WHERE student_id = ?
                    AND date(started_at) = date('now')
                `).get(
                    req.onlineStudentId
                );


            const recent =
                db.prepare(`
                    SELECT
                        s.id,
                        s.lesson_id,
                        s.started_at,
                        s.last_activity,
                        s.ended_at,
                        s.duration_seconds,
                        l.title AS lesson_title
                    FROM online_learning_sessions s
                    LEFT JOIN online_lessons l
                        ON l.id = s.lesson_id
                    WHERE s.student_id = ?
                    ORDER BY s.started_at DESC
                    LIMIT 20
                `).all(
                    req.onlineStudentId
                );


            return res.json({

                success: true,

                totalSeconds:
                    Number(
                        total.total_seconds
                    ),

                todaySeconds:
                    Number(
                        today.total_seconds
                    ),

                recentSessions:
                    recent

            });

        } catch (error) {

            console.error(
                "Get online learning time error:",
                error
            );

            return sendServerError(
                res,
                "Could not load your learning time."
            );

        }

    }
);


/* =========================================================
   WRITING
   GET AVAILABLE WRITING TASKS
========================================================= */

router.get(
    "/writing",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const studentId =
                req.onlineStudentId;


            const tasks =
                db.prepare(`
                    SELECT
                        t.id,
                        t.title,
                        t.instructions,
                        t.level,
                        t.course_id,
                        t.instagram_url,
                        t.tiktok_url,
                        t.youtube_url,
                        t.deadline,
                        t.status,
                        t.created_at,
                        t.updated_at,

                        c.title AS course_title,

                        s.id AS submission_id,
                        s.answer AS submission_answer,
                        s.word_count AS submission_word_count,
                        s.submitted_at AS submission_submitted_at,
                        s.status AS submission_status,
                        s.score AS submission_score,
                        s.feedback AS submission_feedback,
                        s.reviewed_at AS submission_reviewed_at

                    FROM online_writing_tasks t

                    LEFT JOIN online_courses c
                        ON c.id = t.course_id

                    LEFT JOIN online_writing_submissions s
                        ON s.task_id = t.id
                        AND s.student_id = ?

                    WHERE t.status = 'published'

                    AND (
                        t.course_id IS NULL

                        OR EXISTS (
                            SELECT 1
                            FROM online_enrollments e
                            WHERE e.student_id = ?
                            AND e.course_id = t.course_id
                            AND e.status = 'active'
                        )
                    )

                    ORDER BY
                        CASE
                            WHEN t.deadline IS NULL
                                THEN 1
                            ELSE 0
                        END ASC,

                        t.deadline ASC,

                        t.created_at DESC
                `).all(
                    studentId,
                    studentId
                );


            const now =
                new Date();


            const enrichedTasks =
                tasks.map(
                    task => {

                        let deadlinePassed =
                            false;


                        if (
                            task.deadline
                        ) {

                            const deadline =
                                new Date(
                                    task.deadline
                                );

                            if (
                                !Number.isNaN(
                                    deadline.getTime()
                                ) &&
                                deadline < now
                            ) {

                                deadlinePassed =
                                    true;

                            }

                        }


                        return {

                            id:
                                task.id,

                            title:
                                task.title,

                            instructions:
                                task.instructions,

                            level:
                                task.level,

                            courseId:
                                task.course_id,

                            courseTitle:
                                task.course_title,

                            instagramUrl:
                                task.instagram_url,

                            tiktokUrl:
                                task.tiktok_url,

                            youtubeUrl:
                                task.youtube_url,

                            deadline:
                                task.deadline,

                            deadlinePassed,

                            status:
                                task.status,

                            createdAt:
                                task.created_at,

                            updatedAt:
                                task.updated_at,

                            submission:

                                task.submission_id
                                    ? {

                                        id:
                                            task.submission_id,

                                        answer:
                                            task.submission_answer,

                                        wordCount:
                                            Number(
                                                task.submission_word_count ||
                                                0
                                            ),

                                        submittedAt:
                                            task.submission_submitted_at,

                                        status:
                                            task.submission_status,

                                        score:
                                            task.submission_score,

                                        feedback:
                                            task.submission_feedback,

                                        reviewedAt:
                                            task.submission_reviewed_at

                                    }

                                    : null

                        };

                    }
                );


            return res.json({

                success: true,

                writing:
                    enrichedTasks

            });

        } catch (error) {

            console.error(
                "Get online writing tasks error:",
                error
            );

            return sendServerError(
                res,
                "Could not load writing tasks."
            );

        }

    }
);


/* =========================================================
   GET SINGLE WRITING TASK
========================================================= */

router.get(
    "/writing/:taskId",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const taskId =
                Number(
                    req.params.taskId
                );


            if (
                !Number.isInteger(taskId) ||
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
                        t.id,
                        t.title,
                        t.instructions,
                        t.level,
                        t.course_id,
                        t.instagram_url,
                        t.tiktok_url,
                        t.youtube_url,
                        t.deadline,
                        t.status,
                        t.created_at,
                        t.updated_at,

                        c.title AS course_title

                    FROM online_writing_tasks t

                    LEFT JOIN online_courses c
                        ON c.id = t.course_id

                    WHERE t.id = ?

                    LIMIT 1
                `).get(
                    taskId
                );


            if (!task) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Writing task not found."

                });

            }


            if (
                task.status !==
                "published"
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "This writing task is not available."

                });

            }


            if (
                !canAccessWritingTask(
                    req.onlineStudentId,
                    task
                )
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You do not have access to this writing task."

                });

            }


            const submission =
                db.prepare(`
                    SELECT
                        id,
                        task_id,
                        student_id,
                        answer,
                        word_count,
                        submitted_at,
                        status,
                        score,
                        feedback,
                        reviewed_at,
                        updated_at
                    FROM online_writing_submissions
                    WHERE task_id = ?
                    AND student_id = ?
                    LIMIT 1
                `).get(
                    taskId,
                    req.onlineStudentId
                );


            let deadlinePassed =
                false;


            if (
                task.deadline
            ) {

                const deadline =
                    new Date(
                        task.deadline
                    );


                if (
                    !Number.isNaN(
                        deadline.getTime()
                    ) &&
                    deadline < new Date()
                ) {

                    deadlinePassed =
                        true;

                }

            }


            return res.json({

                success: true,

                task: {

                    id:
                        task.id,

                    title:
                        task.title,

                    instructions:
                        task.instructions,

                    level:
                        task.level,

                    courseId:
                        task.course_id,

                    courseTitle:
                        task.course_title,

                    instagramUrl:
                        task.instagram_url,

                    tiktokUrl:
                        task.tiktok_url,

                    youtubeUrl:
                        task.youtube_url,

                    deadline:
                        task.deadline,

                    deadlinePassed,

                    status:
                        task.status,

                    createdAt:
                        task.created_at,

                    updatedAt:
                        task.updated_at,

                    submission:
                        submission
                            ? {

                                id:
                                    submission.id,

                                answer:
                                    submission.answer,

                                wordCount:
                                    Number(
                                        submission.word_count ||
                                        0
                                    ),

                                submittedAt:
                                    submission.submitted_at,

                                status:
                                    submission.status,

                                score:
                                    submission.score,

                                feedback:
                                    submission.feedback,

                                reviewedAt:
                                    submission.reviewed_at,

                                updatedAt:
                                    submission.updated_at

                            }

                            : null

                }

            });

        } catch (error) {

            console.error(
                "Get online writing task error:",
                error
            );

            return sendServerError(
                res,
                "Could not load the writing task."
            );

        }

    }
);


/* =========================================================
   SUBMIT WRITING
========================================================= */

router.post(
    "/writing/:taskId/submit",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const taskId =
                Number(
                    req.params.taskId
                );


            if (
                !Number.isInteger(taskId) ||
                taskId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid writing task ID."

                });

            }


            const answer =
                cleanString(
                    req.body.answer
                );


            if (!answer) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please write your answer before submitting."

                });

            }


            if (
                answer.length > 50000
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Your answer is too long."

                });

            }


            /* =================================================
               GET TASK
            ================================================= */

            const task =
                db.prepare(`
                    SELECT
                        id,
                        title,
                        level,
                        course_id,
                        deadline,
                        status
                    FROM online_writing_tasks
                    WHERE id = ?
                    LIMIT 1
                `).get(
                    taskId
                );


            if (!task) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Writing task not found."

                });

            }


            if (
                task.status !==
                "published"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This writing task is not currently available."

                });

            }


            /* =================================================
               COURSE ACCESS
            ================================================= */

            if (
                !canAccessWritingTask(
                    req.onlineStudentId,
                    task
                )
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You are not enrolled in the course associated with this writing task."

                });

            }


            /* =================================================
               DEADLINE
            ================================================= */

            if (
                task.deadline
            ) {

                const deadline =
                    new Date(
                        task.deadline
                    );


                if (
                    !Number.isNaN(
                        deadline.getTime()
                    ) &&
                    deadline < new Date()
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "The deadline for this writing task has passed."

                    });

                }

            }


            /* =================================================
               WORD COUNT
            ================================================= */

            const wordCount =
                countWords(
                    answer
                );


            if (
                wordCount === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Your answer must contain at least one word."

                });

            }


            const submittedAt =
                getKigaliDateTime();


            /* =================================================
               EXISTING SUBMISSION
            ================================================= */

            const existing =
                db.prepare(`
                    SELECT
                        id,
                        status,
                        score,
                        feedback,
                        reviewed_at
                    FROM online_writing_submissions
                    WHERE task_id = ?
                    AND student_id = ?
                    LIMIT 1
                `).get(
                    taskId,
                    req.onlineStudentId
                );


            /*
             * Once an admin has reviewed the submission,
             * the student cannot silently overwrite the
             * reviewed answer.
             */

            if (
                existing &&
                existing.status ===
                    "reviewed"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This writing submission has already been reviewed and cannot be changed.",

                    submission: {

                        id:
                            existing.id,

                        status:
                            existing.status,

                        score:
                            existing.score,

                        feedback:
                            existing.feedback,

                        reviewedAt:
                            existing.reviewed_at

                    }

                });

            }


            /* =================================================
               UPDATE EXISTING SUBMISSION
            ================================================= */

            if (
                existing
            ) {

                db.prepare(`
                    UPDATE online_writing_submissions
                    SET
                        answer = ?,
                        word_count = ?,
                        submitted_at = ?,
                        status = 'submitted',
                        score = NULL,
                        feedback = NULL,
                        reviewed_by_admin_id = NULL,
                        reviewed_at = NULL,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    AND student_id = ?
                `).run(

                    answer,

                    wordCount,

                    submittedAt,

                    existing.id,

                    req.onlineStudentId

                );


                const updated =
                    db.prepare(`
                        SELECT
                            id,
                            task_id,
                            student_id,
                            answer,
                            word_count,
                            submitted_at,
                            status,
                            score,
                            feedback,
                            reviewed_at,
                            updated_at
                        FROM online_writing_submissions
                        WHERE id = ?
                        LIMIT 1
                    `).get(
                        existing.id
                    );


                return res.json({

                    success: true,

                    message:
                        "Your writing has been submitted successfully.",

                    submission: {

                        id:
                            updated.id,

                        taskId:
                            updated.task_id,

                        studentId:
                            updated.student_id,

                        answer:
                            updated.answer,

                        wordCount:
                            Number(
                                updated.word_count
                            ),

                        submittedAt:
                            updated.submitted_at,

                        status:
                            updated.status,

                        score:
                            updated.score,

                        feedback:
                            updated.feedback,

                        reviewedAt:
                            updated.reviewed_at,

                        updatedAt:
                            updated.updated_at

                    }

                });

            }


            /* =================================================
               CREATE NEW SUBMISSION
            ================================================= */

            const result =
                db.prepare(`
                    INSERT INTO online_writing_submissions (
                        task_id,
                        student_id,
                        answer,
                        word_count,
                        submitted_at,
                        status,
                        score,
                        feedback,
                        reviewed_by_admin_id,
                        reviewed_at,
                        updated_at
                    )
                    VALUES (
                        ?,
                        ?,
                        ?,
                        ?,
                        ?,
                        'submitted',
                        NULL,
                        NULL,
                        NULL,
                        NULL,
                        CURRENT_TIMESTAMP
                    )
                `).run(

                    taskId,

                    req.onlineStudentId,

                    answer,

                    wordCount,

                    submittedAt

                );


            const submissionId =
                Number(
                    result.lastInsertRowid
                );


            return res.status(201).json({

                success: true,

                message:
                    "Your writing has been submitted successfully.",

                submission: {

                    id:
                        submissionId,

                    taskId,

                    studentId:
                        req.onlineStudentId,

                    answer,

                    wordCount,

                    submittedAt,

                    status:
                        "submitted",

                    score:
                        null,

                    feedback:
                        null,

                    reviewedAt:
                        null

                }

            });

        } catch (error) {

            console.error(
                "Submit online writing error:",
                error
            );


            if (
                error &&
                error.code ===
                    "SQLITE_CONSTRAINT_UNIQUE"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "You already have a submission for this writing task."

                });

            }


            return sendServerError(
                res,
                "Could not submit your writing."
            );

        }

    }
);


/* =========================================================
   MY WRITING SUBMISSIONS
========================================================= */

router.get(
    "/writing/submissions",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const submissions =
                db.prepare(`
                    SELECT
                        s.id,
                        s.task_id,
                        s.answer,
                        s.word_count,
                        s.submitted_at,
                        s.status,
                        s.score,
                        s.feedback,
                        s.reviewed_at,
                        s.updated_at,

                        t.title AS task_title,
                        t.level AS task_level,
                        t.deadline AS task_deadline,

                        c.id AS course_id,
                        c.title AS course_title

                    FROM online_writing_submissions s

                    INNER JOIN online_writing_tasks t
                        ON t.id = s.task_id

                    LEFT JOIN online_courses c
                        ON c.id = t.course_id

                    WHERE s.student_id = ?

                    ORDER BY
                        s.submitted_at DESC
                `).all(
                    req.onlineStudentId
                );


            return res.json({

                success: true,

                submissions:
                    submissions.map(
                        submission => ({

                            id:
                                submission.id,

                            taskId:
                                submission.task_id,

                            taskTitle:
                                submission.task_title,

                            level:
                                submission.task_level,

                            deadline:
                                submission.task_deadline,

                            courseId:
                                submission.course_id,

                            courseTitle:
                                submission.course_title,

                            answer:
                                submission.answer,

                            wordCount:
                                Number(
                                    submission.word_count ||
                                    0
                                ),

                            submittedAt:
                                submission.submitted_at,

                            status:
                                submission.status,

                            score:
                                submission.score,

                            feedback:
                                submission.feedback,

                            reviewedAt:
                                submission.reviewed_at,

                            updatedAt:
                                submission.updated_at

                        })
                    )

            });

        } catch (error) {

            console.error(
                "Get online writing submissions error:",
                error
            );

            return sendServerError(
                res,
                "Could not load your writing submissions."
            );

        }

    }
);


/* =========================================================
   GET SINGLE WRITING SUBMISSION
========================================================= */

router.get(
    "/writing/submissions/:submissionId",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const submissionId =
                Number(
                    req.params.submissionId
                );


            if (
                !Number.isInteger(submissionId) ||
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
                        s.id,
                        s.task_id,
                        s.student_id,
                        s.answer,
                        s.word_count,
                        s.submitted_at,
                        s.status,
                        s.score,
                        s.feedback,
                        s.reviewed_at,
                        s.updated_at,

                        t.title AS task_title,
                        t.instructions AS task_instructions,
                        t.level AS task_level,
                        t.instagram_url,
                        t.tiktok_url,
                        t.youtube_url,
                        t.deadline,

                        c.id AS course_id,
                        c.title AS course_title

                    FROM online_writing_submissions s

                    INNER JOIN online_writing_tasks t
                        ON t.id = s.task_id

                    LEFT JOIN online_courses c
                        ON c.id = t.course_id

                    WHERE s.id = ?
                    AND s.student_id = ?

                    LIMIT 1
                `).get(
                    submissionId,
                    req.onlineStudentId
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

                    id:
                        submission.id,

                    taskId:
                        submission.task_id,

                    taskTitle:
                        submission.task_title,

                    taskInstructions:
                        submission.task_instructions,

                    level:
                        submission.task_level,

                    instagramUrl:
                        submission.instagram_url,

                    tiktokUrl:
                        submission.tiktok_url,

                    youtubeUrl:
                        submission.youtube_url,

                    deadline:
                        submission.deadline,

                    courseId:
                        submission.course_id,

                    courseTitle:
                        submission.course_title,

                    answer:
                        submission.answer,

                    wordCount:
                        Number(
                            submission.word_count ||
                            0
                        ),

                    submittedAt:
                        submission.submitted_at,

                    status:
                        submission.status,

                    score:
                        submission.score,

                    feedback:
                        submission.feedback,

                    reviewedAt:
                        submission.reviewed_at,

                    updatedAt:
                        submission.updated_at

                }

            });

        } catch (error) {

            console.error(
                "Get online writing submission error:",
                error
            );

            return sendServerError(
                res,
                "Could not load your writing submission."
            );

        }

    }
);


/* =========================================================
   SUBMIT PARTICIPATION CODE
========================================================= */

router.post(
    "/participation",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const code =
                cleanString(
                    req.body.code
                ).toUpperCase();


            if (
                !code
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Participation code is required."

                });

            }


            if (
                code.length > 100
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid participation code."

                });

            }


            /* =================================================
               FIND CODE
            ================================================= */

            const participationCode =
                db.prepare(`
                    SELECT
                        id,
                        code,
                        course_id,
                        expires_at,
                        status,
                        created_at
                    FROM online_participation_codes
                    WHERE UPPER(code) = ?
                    LIMIT 1
                `).get(
                    code
                );


            if (
                !participationCode
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Invalid participation code."

                });

            }


            /* =================================================
               STATUS
            ================================================= */

            if (
                participationCode.status !==
                "active"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This participation code is no longer active."

                });

            }


            /* =================================================
               EXPIRATION
            ================================================= */

            if (
                participationCode.expires_at
            ) {

                const expiration =
                    new Date(
                        participationCode.expires_at
                    );

                if (
                    !Number.isNaN(
                        expiration.getTime()
                    ) &&
                    expiration < new Date()
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "This participation code has expired."

                    });

                }

            }


            /* =================================================
               PREVENT DUPLICATE PARTICIPATION
            ================================================= */

            const existing =
                db.prepare(`
                    SELECT
                        id,
                        submitted_at
                    FROM online_participation
                    WHERE student_id = ?
                    AND code_id = ?
                    LIMIT 1
                `).get(
                    req.onlineStudentId,
                    participationCode.id
                );


            if (
                existing
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "You have already submitted this participation code.",

                    participation: {

                        id:
                            existing.id,

                        submittedAt:
                            existing.submitted_at

                    }

                });

            }


            /* =================================================
               COURSE CHECK
            ================================================= */

            if (
                participationCode.course_id
            ) {

                const enrollment =
                    db.prepare(`
                        SELECT
                            id
                        FROM online_enrollments
                        WHERE student_id = ?
                        AND course_id = ?
                        LIMIT 1
                    `).get(
                        req.onlineStudentId,
                        participationCode.course_id
                    );


                if (!enrollment) {

                    return res.status(403).json({

                        success: false,

                        message:
                            "You are not enrolled in the course associated with this code."

                    });

                }

            }


            /* =================================================
               SUBMIT
            ================================================= */

            const submittedAt =
                getKigaliDateTime();


            const result =
                db.prepare(`
                    INSERT INTO online_participation (
                        student_id,
                        code_id,
                        course_id,
                        submitted_at
                    )
                    VALUES (?, ?, ?, ?)
                `).run(

                    req.onlineStudentId,

                    participationCode.id,

                    participationCode.course_id ||
                        null,

                    submittedAt

                );


            return res.status(201).json({

                success: true,

                message:
                    "Participation recorded successfully.",

                participation: {

                    id:
                        Number(
                            result.lastInsertRowid
                        ),

                    code:
                        participationCode.code,

                    courseId:
                        participationCode.course_id,

                    submittedAt

                }

            });

        } catch (error) {

            console.error(
                "Online participation error:",
                error
            );


            if (
                error &&
                error.code ===
                    "SQLITE_CONSTRAINT_UNIQUE"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "You have already submitted this participation code."

                });

            }


            return sendServerError(
                res,
                "Could not record participation."
            );

        }

    }
);


/* =========================================================
   MY PARTICIPATION HISTORY
========================================================= */

router.get(
    "/participation",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const participation =
                db.prepare(`
                    SELECT
                        p.id,
                        p.submitted_at,

                        pc.code,
                        pc.expires_at,

                        c.id AS course_id,
                        c.title AS course_title,
                        c.level AS course_level

                    FROM online_participation p

                    INNER JOIN online_participation_codes pc
                        ON pc.id = p.code_id

                    LEFT JOIN online_courses c
                        ON c.id = p.course_id

                    WHERE p.student_id = ?

                    ORDER BY
                        p.submitted_at DESC
                `).all(
                    req.onlineStudentId
                );


            return res.json({

                success: true,

                participation

            });

        } catch (error) {

            console.error(
                "Get online participation history error:",
                error
            );

            return sendServerError(
                res,
                "Could not load participation history."
            );

        }

    }
);


/* =========================================================
   GET LESSON PROGRESS
========================================================= */

router.get(
    "/lessons/:lessonId/progress",
    authenticateOnlineStudent,
    (req, res) => {

        try {

            const lessonId =
                Number(
                    req.params.lessonId
                );


            if (
                !Number.isInteger(lessonId) ||
                lessonId <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid lesson ID."

                });

            }


            const progress =
                db.prepare(`
                    SELECT
                        id,
                        student_id,
                        lesson_id,
                        video_seconds,
                        progress,
                        completed,
                        last_position,
                        updated_at
                    FROM online_progress
                    WHERE student_id = ?
                    AND lesson_id = ?
                    LIMIT 1
                `).get(
                    req.onlineStudentId,
                    lessonId
                );


            return res.json({

                success: true,

                progress:
                    progress || {

                        student_id:
                            req.onlineStudentId,

                        lesson_id:
                            lessonId,

                        video_seconds: 0,

                        progress: 0,

                        completed: 0,

                        last_position: 0,

                        updated_at: null

                    }

            });

        } catch (error) {

            console.error(
                "Get online lesson progress error:",
                error
            );

            return sendServerError(
                res,
                "Could not load lesson progress."
            );

        }

    }
);


/* =========================================================
   LOGOUT
========================================================= */

/*
 * JWT authentication is stateless.
 *
 * The frontend removes the token.
 *
 * No database operation is required here.
 */

router.post(
    "/logout",
    authenticateOnlineStudent,
    (req, res) => {

        return res.json({

            success: true,

            message:
                "Logged out successfully. Please remove your authentication token."

        });

    }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
const express = require("express");
const jwt = require("jsonwebtoken");

const db = require("../database");

const router = express.Router();

const JWT_SECRET =
    process.env.JWT_SECRET || "ldc_change_this_secret_later";


/* =========================================================
   STUDENT AUTHENTICATION
========================================================= */

function authenticateStudent(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Student authentication required."
            });
        }

        const token = authHeader.startsWith("Bearer ")
            ? authHeader.substring(7).trim()
            : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token."
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        if (!decoded.studentId) {
            return res.status(403).json({
                success: false,
                message: "Invalid student session."
            });
        }

        req.student = decoded;

        next();
    } catch (error) {
        console.error(
            "Student authentication error:",
            error
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired student session."
        });
    }
}


/* =========================================================
   HELPERS
========================================================= */

function getKigaliDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Africa/Kigali",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}


function getKigaliDateTime() {
    return new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Africa/Kigali",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }).format(new Date());
}


/*
 * Converts a YYYY-MM-DD date into a UTC timestamp
 * representing midnight for that calendar date.
 *
 * This avoids server-timezone problems when calculating
 * attendance streaks.
 */
function dateToUtcDay(dateString) {
    if (
        typeof dateString !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dateString)
    ) {
        return null;
    }

    const parts = dateString.split("-").map(Number);

    return Date.UTC(
        parts[0],
        parts[1] - 1,
        parts[2]
    );
}


/*
 * Checks whether an attendance code has expired.
 *
 * SQLite timestamps may come back as:
 * YYYY-MM-DD HH:MM:SS
 * or ISO timestamps.
 *
 * The server's Date parser is used first. For a plain
 * SQLite datetime we explicitly treat it as Kigali time.
 */
function isAttendanceCodeExpired(expiresAt) {
    if (!expiresAt) {
        return false;
    }

    let expiryDate;

    if (
        typeof expiresAt === "string" &&
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(
            expiresAt
        )
    ) {
        expiryDate =
            new Date(
                expiresAt.replace(
                    " ",
                    "T"
                ) + "+02:00"
            );
    } else {
        expiryDate =
            new Date(expiresAt);
    }

    if (
        Number.isNaN(
            expiryDate.getTime()
        )
    ) {
        return true;
    }

    return Date.now() >
        expiryDate.getTime();
}


function validId(value) {
    const id = Number(value);

    return Number.isInteger(id) && id > 0
        ? id
        : null;
}


function clampNumber(
    value,
    min,
    max,
    fallback = min
) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return fallback;
    }

    return Math.max(
        min,
        Math.min(max, number)
    );
}


function parseExerciseOptions(options) {
    if (!options) {
        return [];
    }

    if (Array.isArray(options)) {
        return options;
    }

    try {
        const parsed =
            JSON.parse(options);

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch {
        return [];
    }
}


/*
 * Parses game question options.
 *
 * Game Manager stores options as JSON text in SQLite.
 * Students should always receive an actual array.
 */
function parseGameOptions(options) {
    if (!options) {
        return [];
    }

    if (Array.isArray(options)) {
        return options;
    }

    try {
        const parsed =
            JSON.parse(options);

        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch {
        return [];
    }
}


/* =========================================================
   XP HELPERS
========================================================= */

function getStudentXP(studentId) {
    const xp = db.prepare(`
        SELECT
            total_xp,
            weekly_xp,
            current_streak,
            longest_streak
        FROM student_xp
        WHERE student_id = ?
    `).get(studentId);

    return xp || {
        total_xp: 0,
        weekly_xp: 0,
        current_streak: 0,
        longest_streak: 0
    };
}


function addStudentXP(
    studentId,
    amount
) {
    const xpAmount =
        Math.max(
            0,
            Number(amount || 0)
        );

    if (!xpAmount) {
        return getStudentXP(
            studentId
        );
    }

    const existing =
        db.prepare(`
            SELECT id
            FROM student_xp
            WHERE student_id = ?
        `).get(studentId);

    if (existing) {
        db.prepare(`
            UPDATE student_xp
            SET
                total_xp =
                    total_xp + ?,
                weekly_xp =
                    weekly_xp + ?,
                updated_at =
                    CURRENT_TIMESTAMP
            WHERE student_id = ?
        `).run(
            xpAmount,
            xpAmount,
            studentId
        );
    } else {
        db.prepare(`
            INSERT INTO student_xp (
                student_id,
                total_xp,
                weekly_xp,
                current_streak,
                longest_streak
            )
            VALUES (?, ?, ?, 0, 0)
        `).run(
            studentId,
            xpAmount,
            xpAmount
        );
    }

    return getStudentXP(
        studentId
    );
}


/* =========================================================
   ACHIEVEMENT HELPER
========================================================= */

function unlockAchievement(
    studentId,
    achievementName
) {
    const achievement =
        db.prepare(`
            SELECT
                id,
                name,
                description,
                icon,
                xp_reward
            FROM achievements
            WHERE name = ?
            LIMIT 1
        `).get(
            achievementName
        );

    if (!achievement) {
        return null;
    }

    const alreadyUnlocked =
        db.prepare(`
            SELECT id
            FROM student_achievements
            WHERE student_id = ?
            AND achievement_id = ?
            LIMIT 1
        `).get(
            studentId,
            achievement.id
        );

    if (alreadyUnlocked) {
        return null;
    }

    db.prepare(`
        INSERT INTO student_achievements (
            student_id,
            achievement_id
        )
        VALUES (?, ?)
    `).run(
        studentId,
        achievement.id
    );

    const reward =
        Number(
            achievement.xp_reward || 0
        );

    if (reward > 0) {
        addStudentXP(
            studentId,
            reward
        );
    }

    return {
        ...achievement,
        xp_reward: reward
    };
}


/* =========================================================
   GET STUDENT
========================================================= */

function getStudentById(studentId) {
    return db.prepare(`
        SELECT
            id,
            full_name,
            email,
            phone,
            course,
            course_id,
            level,
            access_code,
            payment_status,
            account_status,
            created_at,
            date_of_birth,
            gender,
            address,
            profile_photo,
            student_number,
            last_login_at,
            updated_at
        FROM students
        WHERE id = ?
    `).get(studentId);
}


/* =========================================================
   TEST ROUTE
========================================================= */

router.get(
    "/test",
    (req, res) => {
        return res.json({
            success: true,
            message:
                "LDC student LMS routes are working."
        });
    }
);


/* =========================================================
   GET STUDENT PROFILE
========================================================= */

router.get(
    "/profile",
    authenticateStudent,
    (req, res) => {
        try {
            const student =
                getStudentById(
                    req.student.studentId
                );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student account not found."
                });
            }

            const xp =
                getStudentXP(
                    student.id
                );

            return res.json({
                success: true,
                student: {
                    ...student,
                    xp
                }
            });
        } catch (error) {
            console.error(
                "Get student profile error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load student profile."
            });
        }
    }
);


/* =========================================================
   GET STUDENT ACHIEVEMENTS
========================================================= */

router.get(
    "/achievements",
    authenticateStudent,
    (req, res) => {
        try {
            const achievements =
                db.prepare(`
                    SELECT
                        a.id,
                        a.name,
                        a.description,
                        a.icon,
                        a.xp_reward,
                        CASE
                            WHEN sa.id IS NOT NULL
                            THEN 1
                            ELSE 0
                        END AS unlocked,
                        sa.earned_at
                    FROM achievements a
                    LEFT JOIN student_achievements sa
                        ON sa.achievement_id = a.id
                        AND sa.student_id = ?
                    ORDER BY
                        unlocked DESC,
                        a.id ASC
                `).all(
                    req.student.studentId
                );

            const unlocked =
                achievements.filter(
                    item =>
                        Number(
                            item.unlocked
                        ) === 1
                ).length;

            return res.json({
                success: true,

                summary: {
                    total:
                        achievements.length,
                    unlocked
                },

                achievements
            });
        } catch (error) {
            console.error(
                "Get student achievements error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load achievements."
            });
        }
    }
);


/* =========================================================
   GET STUDENT XP
========================================================= */

router.get(
    "/xp",
    authenticateStudent,
    (req, res) => {
        try {
            const xp =
                getStudentXP(
                    req.student.studentId
                );

            return res.json({
                success: true,
                xp
            });
        } catch (error) {
            console.error(
                "Get student XP error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load XP."
            });
        }
    }
);


/* =========================================================
   GET STUDENT LEADERBOARD
========================================================= */

router.get(
    "/leaderboard",
    authenticateStudent,
    (req, res) => {
        try {
            const student =
                db.prepare(`
                    SELECT
                        id,
                        level
                    FROM students
                    WHERE id = ?
                `).get(
                    req.student.studentId
                );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student account not found."
                });
            }

            const leaderboard =
                db.prepare(`
                    SELECT
                        s.id,
                        s.full_name,
                        s.level,
                        COALESCE(
                            x.total_xp,
                            0
                        ) AS total_xp,
                        COALESCE(
                            x.current_streak,
                            0
                        ) AS current_streak
                    FROM students s
                    LEFT JOIN student_xp x
                        ON x.student_id = s.id
                    WHERE s.account_status = 'active'
                    AND s.level = ?
                    ORDER BY
                        total_xp DESC,
                        s.id ASC
                `).all(
                    student.level
                );

            const formatted =
                leaderboard.map(
                    (item, index) => ({
                        rank:
                            index + 1,
                        id:
                            item.id,
                        name:
                            item.full_name,
                        level:
                            item.level,
                        total_xp:
                            Number(
                                item.total_xp || 0
                            ),
                        current_streak:
                            Number(
                                item.current_streak || 0
                            ),
                        isCurrentStudent:
                            Number(item.id) ===
                            Number(student.id)
                    })
                );

            const currentStudent =
                formatted.find(
                    item =>
                        item.isCurrentStudent
                );

            return res.json({
                success: true,
                level:
                    student.level,
                leaderboard:
                    formatted,
                currentStudent:
                    currentStudent || null
            });
        } catch (error) {
            console.error(
                "Get leaderboard error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load leaderboard."
            });
        }
    }
);


/* =========================================================
   GET STUDENT COURSE
========================================================= */

router.get(
    "/course",
    authenticateStudent,
    (req, res) => {
        try {
            const student =
                db.prepare(`
                    SELECT
                        id,
                        full_name,
                        course,
                        course_id,
                        level
                    FROM students
                    WHERE id = ?
                `).get(
                    req.student.studentId
                );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student account not found."
                });
            }

            let course = null;

            if (student.course_id) {
                course =
                    db.prepare(`
                        SELECT *
                        FROM courses
                        WHERE id = ?
                        AND status = 'active'
                        LIMIT 1
                    `).get(
                        student.course_id
                    );
            }

            if (
                !course &&
                student.level
            ) {
                course =
                    db.prepare(`
                        SELECT *
                        FROM courses
                        WHERE level = ?
                        AND status = 'active'
                        ORDER BY id ASC
                        LIMIT 1
                    `).get(
                        student.level
                    );
            }

            if (
                !course &&
                student.course
            ) {
                course =
                    db.prepare(`
                        SELECT *
                        FROM courses
                        WHERE name = ?
                        AND status = 'active'
                        LIMIT 1
                    `).get(
                        student.course
                    );
            }

            if (!course) {
                return res.json({
                    success: true,

                    student: {
                        id:
                            student.id,
                        name:
                            student.full_name,
                        course:
                            student.course,
                        level:
                            student.level
                    },

                    course: null,

                    modules: [],

                    progress: {
                        percentage: 0,
                        totalLessons: 0,
                        completedLessons: 0
                    },

                    message:
                        "No LMS course has been assigned yet."
                });
            }

            const modules =
                db.prepare(`
                    SELECT
                        m.id,
                        m.course_id,
                        m.title,
                        m.description,
                        m.module_order,
                        m.status,
                        COUNT(
                            CASE
                                WHEN l.status = 'published'
                                THEN l.id
                            END
                        ) AS lesson_count
                    FROM modules m
                    LEFT JOIN lessons l
                        ON l.module_id = m.id
                    WHERE m.course_id = ?
                    AND m.status = 'active'
                    GROUP BY
                        m.id,
                        m.course_id,
                        m.title,
                        m.description,
                        m.module_order,
                        m.status
                    ORDER BY
                        m.module_order ASC,
                        m.id ASC
                `).all(
                    course.id
                );

            const lessons =
                db.prepare(`
                    SELECT
                        l.id,
                        l.module_id,
                        l.title,
                        l.description,
                        l.lesson_order,
                        l.duration,
                        l.xp_reward,
                        l.status
                    FROM lessons l
                    INNER JOIN modules m
                        ON m.id = l.module_id
                    WHERE m.course_id = ?
                    AND m.status = 'active'
                    AND l.status = 'published'
                    ORDER BY
                        m.module_order ASC,
                        l.lesson_order ASC,
                        l.id ASC
                `).all(
                    course.id
                );

            const progress =
                db.prepare(`
                    SELECT
                        lesson_id,
                        status,
                        progress,
                        score,
                        completed_at
                    FROM student_progress
                    WHERE student_id = ?
                `).all(
                    student.id
                );

            const progressMap = {};

            progress.forEach(
                item => {
                    progressMap[
                        item.lesson_id
                    ] = item;
                }
            );

            const lessonsWithProgress =
                lessons.map(
                    lesson => {
                        const lessonProgress =
                            progressMap[
                                lesson.id
                            ];

                        return {
                            ...lesson,

                            progress:
                                lessonProgress
                                    ? Number(
                                        lessonProgress.progress || 0
                                    )
                                    : 0,

                            progressStatus:
                                lessonProgress
                                    ? lessonProgress.status
                                    : "not_started",

                            score:
                                lessonProgress
                                    ? Number(
                                        lessonProgress.score || 0
                                    )
                                    : 0,

                            completedAt:
                                lessonProgress
                                    ? lessonProgress.completed_at
                                    : null
                        };
                    }
                );

            const modulesWithLessons =
                modules.map(
                    module => {
                        const moduleLessons =
                            lessonsWithProgress.filter(
                                lesson =>
                                    lesson.module_id ===
                                    module.id
                            );

                        const completed =
                            moduleLessons.filter(
                                lesson =>
                                    lesson.progressStatus ===
                                    "completed"
                            ).length;

                        const moduleProgress =
                            moduleLessons.length > 0
                                ? Math.round(
                                    (
                                        completed /
                                        moduleLessons.length
                                    ) * 100
                                )
                                : 0;

                        return {
                            ...module,

                            lesson_count:
                                moduleLessons.length,

                            completedLessons:
                                completed,

                            progress:
                                moduleProgress,

                            lessons:
                                moduleLessons
                        };
                    }
                );

            const totalLessons =
                lessonsWithProgress.length;

            const completedLessons =
                lessonsWithProgress.filter(
                    lesson =>
                        lesson.progressStatus ===
                        "completed"
                ).length;

            const courseProgress =
                totalLessons > 0
                    ? Math.round(
                        (
                            completedLessons /
                            totalLessons
                        ) * 100
                    )
                    : 0;

            return res.json({
                success: true,

                student: {
                    id:
                        student.id,
                    name:
                        student.full_name,
                    course:
                        student.course,
                    level:
                        student.level
                },

                course: {
                    ...course,
                    progress:
                        courseProgress,
                    totalLessons,
                    completedLessons
                },

                progress: {
                    percentage:
                        courseProgress,
                    totalLessons,
                    completedLessons
                },

                modules:
                    modulesWithLessons
            });
        } catch (error) {
            console.error(
                "Get student course error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load student course."
            });
        }
    }
);


/* =========================================================
   GET SINGLE LESSON
========================================================= */

router.get(
    "/lessons/:id",
    authenticateStudent,
    (req, res) => {
        try {
            const lessonId =
                validId(
                    req.params.id
                );

            if (!lessonId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid lesson ID."
                });
            }

            const student =
                db.prepare(`
                    SELECT
                        id,
                        full_name,
                        course,
                        course_id,
                        level,
                        account_status
                    FROM students
                    WHERE id = ?
                `).get(
                    req.student.studentId
                );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student account not found."
                });
            }

            if (
                student.account_status &&
                student.account_status !== "active"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Your student account is not active."
                });
            }

            const lesson =
                db.prepare(`
                    SELECT
                        l.*,

                        m.id AS module_id,
                        m.title AS module_title,
                        m.description AS module_description,
                        m.module_order,
                        m.status AS module_status,

                        c.id AS course_id,
                        c.name AS course_name,
                        c.description AS course_description,
                        c.level AS course_level,
                        c.status AS course_status

                    FROM lessons l

                    INNER JOIN modules m
                        ON m.id = l.module_id

                    INNER JOIN courses c
                        ON c.id = m.course_id

                    WHERE l.id = ?
                    AND l.status = 'published'
                    AND m.status = 'active'
                    AND c.status = 'active'
                `).get(
                    lessonId
                );

            if (!lesson) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Lesson not found or not available."
                });
            }

            const courseMatches =
                (
                    student.course_id &&
                    Number(student.course_id) ===
                        Number(lesson.course_id)
                ) ||
                (
                    student.level &&
                    student.level ===
                        lesson.course_level
                ) ||
                (
                    student.course &&
                    student.course ===
                        lesson.course_name
                );

            if (!courseMatches) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This lesson is not available for your course."
                });
            }

            const progress =
                db.prepare(`
                    SELECT
                        status,
                        progress,
                        score,
                        completed_at
                    FROM student_progress
                    WHERE student_id = ?
                    AND lesson_id = ?
                `).get(
                    student.id,
                    lessonId
                );

            const materials =
                db.prepare(`
                    SELECT
                        id,
                        lesson_id,
                        title,
                        type,
                        url,
                        description,
                        file_name,
                        created_at
                    FROM lesson_materials
                    WHERE lesson_id = ?
                    ORDER BY id ASC
                `).all(
                    lessonId
                );

            const exercises =
                db.prepare(`
                    SELECT
                        id,
                        lesson_id,
                        question,
                        exercise_type,
                        options,
                        explanation,
                        exercise_order,
                        xp_reward,
                        status
                    FROM exercises
                    WHERE lesson_id = ?
                    AND status = 'active'
                    ORDER BY
                        exercise_order ASC,
                        id ASC
                `).all(
                    lessonId
                ).map(
                    exercise => ({
                        id:
                            exercise.id,

                        lesson_id:
                            exercise.lesson_id,

                        question:
                            exercise.question,

                        exercise_type:
                            exercise.exercise_type,

                        options:
                            parseExerciseOptions(
                                exercise.options
                            ),

                        explanation:
                            exercise.explanation,

                        exercise_order:
                            exercise.exercise_order,

                        xp_reward:
                            Number(
                                exercise.xp_reward || 0
                            ),

                        status:
                            exercise.status
                    })
                );

            const safeLesson = {
                id:
                    lesson.id,

                module_id:
                    lesson.module_id,

                title:
                    lesson.title,

                description:
                    lesson.description,

                content:
                    lesson.content,

                lesson_order:
                    lesson.lesson_order,

                duration:
                    lesson.duration,

                xp_reward:
                    Number(
                        lesson.xp_reward || 0
                    ),

                status:
                    lesson.status,

                created_at:
                    lesson.created_at,

                updated_at:
                    lesson.updated_at
            };

            const studentProgress =
                progress || {
                    status:
                        "not_started",
                    progress:
                        0,
                    score:
                        0,
                    completed_at:
                        null
                };

            return res.json({
                success: true,

                lesson:
                    safeLesson,

                course: {
                    id:
                        lesson.course_id,
                    name:
                        lesson.course_name,
                    description:
                        lesson.course_description,
                    level:
                        lesson.course_level
                },

                module: {
                    id:
                        lesson.module_id,
                    course_id:
                        lesson.course_id,
                    title:
                        lesson.module_title,
                    description:
                        lesson.module_description,
                    module_order:
                        lesson.module_order
                },

                progress:
                    studentProgress,

                materials:
                    materials,

                exercises:
                    exercises
            });
        } catch (error) {
            console.error(
                "Get student lesson error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load lesson."
            });
        }
    }
);


/* =========================================================
   SUBMIT EXERCISE ANSWER
========================================================= */

router.post(
    "/lessons/:lessonId/exercises/:exerciseId/answer",
    authenticateStudent,
    (req, res) => {
        try {
            const lessonId =
                validId(
                    req.params.lessonId
                );

            const exerciseId =
                validId(
                    req.params.exerciseId
                );

            if (
                !lessonId ||
                !exerciseId
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid lesson or exercise ID."
                });
            }

            const answer =
                req.body?.answer;

            if (
                answer === undefined ||
                answer === null
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please provide an answer."
                });
            }

            const student =
                db.prepare(`
                    SELECT
                        id,
                        level,
                        course,
                        course_id,
                        account_status
                    FROM students
                    WHERE id = ?
                `).get(
                    req.student.studentId
                );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student account not found."
                });
            }

            const exercise =
                db.prepare(`
                    SELECT
                        e.id,
                        e.lesson_id,
                        e.question,
                        e.exercise_type,
                        e.options,
                        e.correct_answer,
                        e.explanation,
                        e.xp_reward,
                        e.status,

                        c.level AS course_level,
                        c.name AS course_name

                    FROM exercises e

                    INNER JOIN lessons l
                        ON l.id = e.lesson_id

                    INNER JOIN modules m
                        ON m.id = l.module_id

                    INNER JOIN courses c
                        ON c.id = m.course_id

                    WHERE e.id = ?
                    AND e.lesson_id = ?
                    AND e.status = 'active'
                    AND l.status = 'published'
                    AND m.status = 'active'
                    AND c.status = 'active'
                `).get(
                    exerciseId,
                    lessonId
                );

            if (!exercise) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Exercise not found."
                });
            }

            const accessAllowed =
                (
                    student.course_id &&
                    db.prepare(`
                        SELECT id
                        FROM courses
                        WHERE id = ?
                        AND status = 'active'
                    `).get(
                        student.course_id
                    )
                ) ||
                student.level ===
                    exercise.course_level ||
                student.course ===
                    exercise.course_name;

            if (!accessAllowed) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This exercise is not available for your course."
                });
            }

            let expectedValue =
                exercise.correct_answer;

            if (
                typeof expectedValue ===
                "string"
            ) {
                try {
                    const parsed =
                        JSON.parse(
                            expectedValue
                        );

                    if (
                        Array.isArray(parsed)
                    ) {
                        expectedValue =
                            parsed;
                    }
                } catch {
                    /* Keep normal string answer. */
                }
            }

            const expected =
                Array.isArray(
                    expectedValue
                )
                    ? expectedValue
                        .map(
                            item =>
                                String(item)
                                    .trim()
                                    .toLowerCase()
                        )
                        .sort()
                    : String(
                        expectedValue ?? ""
                    )
                        .trim()
                        .toLowerCase();

            const submitted =
                Array.isArray(answer)
                    ? answer
                        .map(
                            item =>
                                String(item)
                                    .trim()
                                    .toLowerCase()
                        )
                        .sort()
                    : String(answer)
                        .trim()
                        .toLowerCase();

            let isCorrect =
                false;

            if (
                Array.isArray(
                    submitted
                ) &&
                Array.isArray(
                    expected
                )
            ) {
                isCorrect =
                    JSON.stringify(
                        submitted
                    ) ===
                    JSON.stringify(
                        expected
                    );
            } else {
                isCorrect =
                    String(submitted) ===
                    String(expected);
            }

            let xpEarned = 0;

            if (isCorrect) {
                xpEarned =
                    Number(
                        exercise.xp_reward || 0
                    );

                if (xpEarned > 0) {
                    addStudentXP(
                        student.id,
                        xpEarned
                    );
                }
            }

            const xp =
                getStudentXP(
                    student.id
                );

            return res.json({
                success: true,

                correct:
                    isCorrect,

                message:
                    isCorrect
                        ? "Correct! 🎉"
                        : "Not quite. Try again.",

                explanation:
                    exercise.explanation ||
                    null,

                xpEarned,

                xp
            });
        } catch (error) {
            console.error(
                "Submit exercise answer error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not check your answer."
            });
        }
    }
);


/* =========================================================
   UPDATE LESSON PROGRESS
========================================================= */

router.post(
    "/lessons/:id/progress",
    authenticateStudent,
    (req, res) => {
        try {
            const lessonId =
                validId(
                    req.params.id
                );

            if (!lessonId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid lesson ID."
                });
            }

            const student =
                db.prepare(`
                    SELECT
                        id,
                        level,
                        course,
                        course_id,
                        account_status
                    FROM students
                    WHERE id = ?
                `).get(
                    req.student.studentId
                );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student account not found."
                });
            }

            if (
                student.account_status &&
                student.account_status !== "active"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Your student account is not active."
                });
            }

            const lesson =
                db.prepare(`
                    SELECT
                        l.id,
                        l.xp_reward,
                        c.id AS course_id,
                        c.name AS course_name,
                        c.level AS course_level

                    FROM lessons l

                    INNER JOIN modules m
                        ON m.id = l.module_id

                    INNER JOIN courses c
                        ON c.id = m.course_id

                    WHERE l.id = ?
                    AND l.status = 'published'
                    AND m.status = 'active'
                    AND c.status = 'active'
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

            const courseMatches =
                (
                    student.course_id &&
                    Number(student.course_id) ===
                        Number(lesson.course_id)
                ) ||
                student.level ===
                    lesson.course_level ||
                student.course ===
                    lesson.course_name;

            if (!courseMatches) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This lesson is not available for your course."
                });
            }

            const requestedProgress =
                clampNumber(
                    req.body?.progress,
                    0,
                    100,
                    0
                );

            const requestedScore =
                clampNumber(
                    req.body?.score,
                    0,
                    100,
                    0
                );

            const requestedStatus =
                req.body?.status;

            const cleanStatus =
                requestedStatus ===
                    "completed" ||
                requestedProgress >= 100
                    ? "completed"
                    : requestedProgress > 0
                        ? "in_progress"
                        : "not_started";

            const existing =
                db.prepare(`
                    SELECT *
                    FROM student_progress
                    WHERE student_id = ?
                    AND lesson_id = ?
                `).get(
                    student.id,
                    lessonId
                );

            const wasAlreadyCompleted =
                existing &&
                existing.status ===
                    "completed";

            const completedAt =
                cleanStatus ===
                    "completed"
                    ? (
                        existing?.completed_at ||
                        getKigaliDateTime()
                    )
                    : null;

            const saveProgress =
                db.transaction(() => {
                    if (existing) {
                        db.prepare(`
                            UPDATE student_progress
                            SET
                                status = ?,
                                progress = ?,
                                score = ?,
                                completed_at = ?,
                                updated_at =
                                    CURRENT_TIMESTAMP
                            WHERE student_id = ?
                            AND lesson_id = ?
                        `).run(
                            cleanStatus,
                            requestedProgress,
                            requestedScore,
                            completedAt,
                            student.id,
                            lessonId
                        );
                    } else {
                        db.prepare(`
                            INSERT INTO student_progress (
                                student_id,
                                lesson_id,
                                status,
                                progress,
                                score,
                                completed_at
                            )
                            VALUES (?, ?, ?, ?, ?, ?)
                        `).run(
                            student.id,
                            lessonId,
                            cleanStatus,
                            requestedProgress,
                            requestedScore,
                            completedAt
                        );
                    }

                    let xpEarned = 0;
                    let achievement = null;

                    if (
                        cleanStatus ===
                            "completed" &&
                        !wasAlreadyCompleted
                    ) {
                        xpEarned =
                            Number(
                                lesson.xp_reward || 50
                            );

                        if (xpEarned > 0) {
                            addStudentXP(
                                student.id,
                                xpEarned
                            );
                        }

                        const completedCount =
                            db.prepare(`
                                SELECT COUNT(*) AS count
                                FROM student_progress
                                WHERE student_id = ?
                                AND status = 'completed'
                            `).get(
                                student.id
                            );

                        if (
                            Number(
                                completedCount.count
                            ) === 1
                        ) {
                            achievement =
                                unlockAchievement(
                                    student.id,
                                    "First Lesson"
                                );
                        }

                        if (
                            Number(
                                completedCount.count
                            ) >= 10
                        ) {
                            const tenLessonAchievement =
                                unlockAchievement(
                                    student.id,
                                    "10 Lessons"
                                );

                            if (
                                tenLessonAchievement
                            ) {
                                achievement =
                                    tenLessonAchievement;
                            }
                        }
                    }

                    return {
                        xpEarned,
                        achievement
                    };
                });

            const result =
                saveProgress();

            const updatedProgress =
                db.prepare(`
                    SELECT
                        status,
                        progress,
                        score,
                        completed_at
                    FROM student_progress
                    WHERE student_id = ?
                    AND lesson_id = ?
                `).get(
                    student.id,
                    lessonId
                );

            const xp =
                getStudentXP(
                    student.id
                );

            return res.json({
                success: true,

                message:
                    cleanStatus ===
                        "completed"
                        ? "Lesson completed! 🎉"
                        : "Lesson progress saved.",

                progress:
                    updatedProgress,

                xp,

                xpEarned:
                    result.xpEarned,

                achievement:
                    result.achievement
            });
        } catch (error) {
            console.error(
                "Update lesson progress error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not save lesson progress."
            });
        }
    }
);


/* =========================================================
   GET STUDENT ATTENDANCE
========================================================= */

router.get(
    "/attendance",
    authenticateStudent,
    (req, res) => {
        try {
            const records =
                db.prepare(`
                    SELECT
                        a.id,
                        a.attendance_date,
                        a.status,
                        a.notes,
                        a.course_id,
                        a.class_id,

                        c.name AS course_name,
                        c.level AS course_level,

                        cl.name AS class_name,
                        cl.room AS class_room

                    FROM attendance a

                    LEFT JOIN courses c
                        ON c.id = a.course_id

                    LEFT JOIN classes cl
                        ON cl.id = a.class_id

                    WHERE a.student_id = ?

                    ORDER BY
                        a.attendance_date DESC,
                        a.id DESC
                `).all(
                    req.student.studentId
                );

            const total =
                records.length;

            const present =
                records.filter(
                    item =>
                        item.status ===
                        "present"
                ).length;

            const late =
                records.filter(
                    item =>
                        item.status ===
                        "late"
                ).length;

            const absent =
                records.filter(
                    item =>
                        item.status ===
                        "absent"
                ).length;

            const excused =
                records.filter(
                    item =>
                        item.status ===
                        "excused"
                ).length;

            const attendancePercentage =
                total > 0
                    ? Math.round(
                        (
                            (
                                present +
                                late
                            ) /
                            total
                        ) * 100
                    )
                    : 0;

            return res.json({
                success: true,

                summary: {
                    total,
                    present,
                    late,
                    absent,
                    excused,
                    percentage:
                        attendancePercentage
                },

                records
            });
        } catch (error) {
            console.error(
                "Get student attendance error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load attendance."
            });
        }
    }
);


/* =========================================================
   GET TODAY'S ATTENDANCE
========================================================= */

router.get(
    "/attendance/today",
    authenticateStudent,
    (req, res) => {
        try {
            const today =
                getKigaliDate();

            const student =
                db.prepare(`
                    SELECT
                        id,
                        full_name,
                        course,
                        course_id,
                        level
                    FROM students
                    WHERE id = ?
                `).get(
                    req.student.studentId
                );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student account not found."
                });
            }

            const attendance =
                db.prepare(`
                    SELECT
                        a.id,
                        a.attendance_date,
                        a.status,
                        a.notes,
                        a.course_id,
                        a.class_id,

                        c.name AS course_name,
                        c.level AS course_level,

                        cl.name AS class_name

                    FROM attendance a

                    LEFT JOIN courses c
                        ON c.id = a.course_id

                    LEFT JOIN classes cl
                        ON cl.id = a.class_id

                    WHERE a.student_id = ?
                    AND a.attendance_date = ?

                    ORDER BY a.id DESC
                `).all(
                    student.id,
                    today
                );

            /*
             * Get today's codes without relying on SQLite's
             * UTC datetime('now'). Expiry is validated in
             * JavaScript using Kigali-aware handling.
             */
            const activeCodes =
                db.prepare(`
                    SELECT
                        ac.id,
                        ac.code,
                        ac.course_id,
                        ac.class_id,
                        ac.level,
                        ac.attendance_date,
                        ac.expires_at,
                        ac.status,

                        c.name AS course_name,
                        c.level AS course_level,

                        cl.name AS class_name,
                        cl.course_id AS class_course_id,
                        cl.status AS class_status

                    FROM attendance_codes ac

                    LEFT JOIN courses c
                        ON c.id = ac.course_id

                    LEFT JOIN classes cl
                        ON cl.id = ac.class_id

                    WHERE ac.attendance_date = ?
                    AND ac.status = 'active'

                    ORDER BY ac.id DESC
                `).all(
                    today
                );

            const matchingCodes =
                activeCodes.filter(
                    code => {
                        if (
                            isAttendanceCodeExpired(
                                code.expires_at
                            )
                        ) {
                            return false;
                        }

                        if (
                            code.class_id &&
                            code.class_status &&
                            code.class_status !==
                                "active"
                        ) {
                            return false;
                        }

                        const levelMatches =
                            !code.level ||
                            code.level ===
                                student.level;

                        if (!levelMatches) {
                            return false;
                        }

                        if (code.class_id) {
                            const classCourseId =
                                code.class_course_id ||
                                code.course_id ||
                                null;

                            const courseMatches =
                                !classCourseId ||
                                Number(
                                    classCourseId
                                ) ===
                                    Number(
                                        student.course_id
                                    ) ||
                                code.course_level ===
                                    student.level ||
                                code.course_name ===
                                    student.course;

                            if (!courseMatches) {
                                return false;
                            }

                            const enrollment =
                                db.prepare(`
                                    SELECT id
                                    FROM enrollments
                                    WHERE student_id = ?
                                    AND class_id = ?
                                    AND status = 'active'
                                    LIMIT 1
                                `).get(
                                    student.id,
                                    code.class_id
                                );

                            if (!enrollment) {
                                return false;
                            }

                            return true;
                        }

                        if (code.course_id) {
                            const courseMatches =
                                Number(
                                    code.course_id
                                ) ===
                                    Number(
                                        student.course_id
                                    ) ||
                                code.course_level ===
                                    student.level ||
                                code.course_name ===
                                    student.course;

                            return courseMatches;
                        }

                        return true;
                    }
                );

            return res.json({
                success: true,

                date:
                    today,

                checkedIn:
                    attendance.length > 0,

                attendance:
                    attendance.length > 0
                        ? attendance[0]
                        : null,

                records:
                    attendance,

                activeCodeAvailable:
                    matchingCodes.length > 0,

                /*
                 * The actual attendance code is deliberately
                 * NOT returned to students.
                 */
                activeCodes:
                    matchingCodes.map(
                        code => ({
                            id:
                                code.id,

                            course_id:
                                code.class_id
                                    ? (
                                        code.class_course_id ||
                                        code.course_id ||
                                        null
                                    )
                                    : code.course_id,

                            class_id:
                                code.class_id,

                            level:
                                code.level,

                            attendance_date:
                                code.attendance_date,

                            expires_at:
                                code.expires_at,

                            course_name:
                                code.course_name,

                            class_name:
                                code.class_name
                        })
                    ),

                course:
                    student.course,

                courseId:
                    student.course_id,

                level:
                    student.level
            });
        } catch (error) {
            console.error(
                "Get today's attendance error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load today's attendance."
            });
        }
    }
);


/* =========================================================
   STUDENT ATTENDANCE CHECK-IN
========================================================= */

router.post(
    "/attendance/check-in",
    authenticateStudent,
    (req, res) => {
        try {
            const code =
                typeof req.body?.code ===
                "string"
                    ? req.body.code
                        .trim()
                        .toUpperCase()
                    : "";

            if (!code) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter the attendance code."
                });
            }

            const student =
                db.prepare(`
                    SELECT
                        id,
                        full_name,
                        course,
                        course_id,
                        level,
                        account_status
                    FROM students
                    WHERE id = ?
                `).get(
                    req.student.studentId
                );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student account not found."
                });
            }

            if (
                student.account_status &&
                student.account_status !==
                    "active"
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "Your student account is not active."
                });
            }

            const today =
                getKigaliDate();

            const attendanceCode =
                db.prepare(`
                    SELECT
                        ac.*,

                        c.name AS course_name,
                        c.level AS course_level,
                        c.status AS course_status,

                        cl.name AS class_name,
                        cl.status AS class_status,
                        cl.course_id AS class_course_id

                    FROM attendance_codes ac

                    LEFT JOIN courses c
                        ON c.id = ac.course_id

                    LEFT JOIN classes cl
                        ON cl.id = ac.class_id

                    WHERE ac.code = ?

                    LIMIT 1
                `).get(
                    code
                );

            if (!attendanceCode) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Invalid attendance code."
                });
            }

            if (
                attendanceCode.status !==
                "active"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This attendance code is no longer active."
                });
            }

            if (
                attendanceCode.attendance_date !==
                today
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This attendance code is not valid today."
                });
            }

            if (
                isAttendanceCodeExpired(
                    attendanceCode.expires_at
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This attendance code has expired."
                });
            }

            if (
                attendanceCode.course_status &&
                attendanceCode.course_status !==
                    "active"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This course is not currently active."
                });
            }

            if (
                attendanceCode.class_status &&
                attendanceCode.class_status !==
                    "active"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This class is not currently active."
                });
            }

            if (
                attendanceCode.level &&
                attendanceCode.level !==
                    student.level
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "This attendance code is not for your level."
                });
            }

            const normalizedCourseId =
                attendanceCode.class_id
                    ? (
                        attendanceCode.class_course_id ||
                        attendanceCode.course_id ||
                        null
                    )
                    : (
                        attendanceCode.course_id ||
                        null
                    );

            if (normalizedCourseId) {
                const course =
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
                        normalizedCourseId
                    );

                if (!course) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "The course connected to this attendance code could not be found."
                    });
                }

                const courseMatches =
                    Number(course.id) ===
                        Number(
                            student.course_id
                        ) ||
                    course.level ===
                        student.level ||
                    course.name ===
                        student.course;

                if (!courseMatches) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "This attendance code is not for your course."
                    });
                }
            }

            if (attendanceCode.class_id) {
                const enrollment =
                    db.prepare(`
                        SELECT
                            id,
                            status
                        FROM enrollments
                        WHERE student_id = ?
                        AND class_id = ?
                        AND status = 'active'
                        LIMIT 1
                    `).get(
                        student.id,
                        attendanceCode.class_id
                    );

                if (!enrollment) {
                    return res.status(403).json({
                        success: false,
                        message:
                            "You are not enrolled in this class."
                    });
                }
            }

            let existingAttendance = null;

            if (
                attendanceCode.class_id
            ) {
                existingAttendance =
                    db.prepare(`
                        SELECT
                            id,
                            attendance_date,
                            status,
                            course_id,
                            class_id
                        FROM attendance
                        WHERE student_id = ?
                        AND attendance_date = ?
                        AND course_id = ?
                        AND class_id = ?
                        LIMIT 1
                    `).get(
                        student.id,
                        today,
                        normalizedCourseId,
                        attendanceCode.class_id
                    );

                if (
                    !existingAttendance
                ) {
                    existingAttendance =
                        db.prepare(`
                            SELECT
                                id,
                                attendance_date,
                                status,
                                course_id,
                                class_id
                            FROM attendance
                            WHERE student_id = ?
                            AND attendance_date = ?
                            AND class_id = ?
                            LIMIT 1
                        `).get(
                            student.id,
                            today,
                            attendanceCode.class_id
                        );
                }
            } else if (
                normalizedCourseId
            ) {
                existingAttendance =
                    db.prepare(`
                        SELECT
                            id,
                            attendance_date,
                            status,
                            course_id,
                            class_id
                        FROM attendance
                        WHERE student_id = ?
                        AND attendance_date = ?
                        AND course_id = ?
                        AND class_id IS NULL
                        LIMIT 1
                    `).get(
                        student.id,
                        today,
                        normalizedCourseId
                    );
            } else {
                existingAttendance =
                    db.prepare(`
                        SELECT
                            id,
                            attendance_date,
                            status,
                            course_id,
                            class_id
                        FROM attendance
                        WHERE student_id = ?
                        AND attendance_date = ?
                        AND course_id IS NULL
                        AND class_id IS NULL
                        LIMIT 1
                    `).get(
                        student.id,
                        today
                    );
            }

            if (existingAttendance) {
                return res.status(409).json({
                    success: false,
                    message:
                        "You have already checked in for this class today.",
                    attendance:
                        existingAttendance
                });
            }

            const checkInTransaction =
                db.transaction(() => {
                    const attendanceResult =
                        db.prepare(`
                            INSERT INTO attendance (
                                student_id,
                                course_id,
                                class_id,
                                attendance_date,
                                status,
                                notes,
                                marked_by_teacher_id
                            )
                            VALUES (?, ?, ?, ?, 'present', ?, NULL)
                        `).run(
                            student.id,
                            normalizedCourseId,
                            attendanceCode.class_id ||
                                null,
                            today,
                            "Student self check-in"
                        );

                    let xpRow =
                        db.prepare(`
                            SELECT *
                            FROM student_xp
                            WHERE student_id = ?
                        `).get(
                            student.id
                        );

                    const previousAttendance =
                        db.prepare(`
                            SELECT
                                attendance_date,
                                status
                            FROM attendance
                            WHERE student_id = ?
                            AND attendance_date < ?
                            AND status IN (
                                'present',
                                'late'
                            )
                            ORDER BY
                                attendance_date DESC,
                                id DESC
                            LIMIT 1
                        `).get(
                            student.id,
                            today
                        );

                    let currentStreak = 1;

                    let longestStreak =
                        xpRow
                            ? Number(
                                xpRow.longest_streak || 0
                            )
                            : 0;

                    if (
                        previousAttendance
                    ) {
                        const previousDay =
                            dateToUtcDay(
                                previousAttendance
                                    .attendance_date
                            );

                        const currentDay =
                            dateToUtcDay(
                                today
                            );

                        if (
                            previousDay !==
                                null &&
                            currentDay !==
                                null
                        ) {
                            const difference =
                                Math.round(
                                    (
                                        currentDay -
                                        previousDay
                                    ) /
                                    (
                                        1000 *
                                        60 *
                                        60 *
                                        24
                                    )
                                );

                            if (
                                difference === 1
                            ) {
                                currentStreak =
                                    xpRow
                                        ? Number(
                                            xpRow.current_streak || 0
                                        ) + 1
                                        : 2;
                            }
                        }
                    }

                    if (
                        currentStreak >
                        longestStreak
                    ) {
                        longestStreak =
                            currentStreak;
                    }

                    const attendanceXP = 10;

                    if (xpRow) {
                        db.prepare(`
                            UPDATE student_xp
                            SET
                                total_xp =
                                    total_xp + ?,
                                weekly_xp =
                                    weekly_xp + ?,
                                current_streak = ?,
                                longest_streak = ?,
                                updated_at =
                                    CURRENT_TIMESTAMP
                            WHERE student_id = ?
                        `).run(
                            attendanceXP,
                            attendanceXP,
                            currentStreak,
                            longestStreak,
                            student.id
                        );
                    } else {
                        db.prepare(`
                            INSERT INTO student_xp (
                                student_id,
                                total_xp,
                                weekly_xp,
                                current_streak,
                                longest_streak
                            )
                            VALUES (?, ?, ?, ?, ?)
                        `).run(
                            student.id,
                            attendanceXP,
                            attendanceXP,
                            currentStreak,
                            longestStreak
                        );
                    }

                    let achievement = null;

                    if (
                        currentStreak >= 7
                    ) {
                        achievement =
                            unlockAchievement(
                                student.id,
                                "7-Day Streak"
                            );
                    }

                    return {
                        attendanceId:
                            attendanceResult
                                .lastInsertRowid,

                        currentStreak,

                        longestStreak,

                        attendanceXP,

                        achievement
                    };
                });

            const result =
                checkInTransaction();

            const attendance =
                db.prepare(`
                    SELECT
                        a.id,
                        a.attendance_date,
                        a.status,
                        a.notes,
                        a.course_id,
                        a.class_id,

                        c.name AS course_name,
                        c.level AS course_level,

                        cl.name AS class_name

                    FROM attendance a

                    LEFT JOIN courses c
                        ON c.id = a.course_id

                    LEFT JOIN classes cl
                        ON cl.id = a.class_id

                    WHERE a.id = ?
                `).get(
                    result.attendanceId
                );

            const xp =
                getStudentXP(
                    student.id
                );

            const achievementXP =
                result.achievement
                    ? Number(
                        result.achievement
                            .xp_reward || 0
                    )
                    : 0;

            const totalXPEarned =
                result.attendanceXP +
                achievementXP;

            return res.status(201).json({
                success: true,

                message:
                    "Attendance check-in successful! 🎉",

                attendance,

                checkedIn:
                    true,

                xp,

                xpEarned:
                    totalXPEarned,

                attendanceXP:
                    result.attendanceXP,

                streak:
                    result.currentStreak,

                longestStreak:
                    result.longestStreak,

                achievement:
                    result.achievement
            });
        } catch (error) {
            console.error(
                "Student attendance check-in error:",
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
                        "You have already checked in for this class today."
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Could not complete attendance check-in."
            });
        }
    }
);


/* =========================================================
   GET STUDENT GAMES
========================================================= */

/*
 * This endpoint is intentionally separate from the
 * Games Manager API.
 *
 * Games Manager:
 *   /api/game-manager/games
 *
 * Student:
 *   /api/student/games
 *
 * Students only receive active games.
 */
router.get(
    "/games",
    authenticateStudent,
    (req, res) => {
        try {
            const games =
                db.prepare(`
                    SELECT
                        id,
                        title,
                        description,
                        level,
                        game_type,
                        xp_reward,
                        status,
                        created_at
                    FROM games
                    WHERE status = 'active'
                    ORDER BY
                        id ASC
                `).all();

            const formattedGames =
                games.map(
                    game => ({
                        id:
                            game.id,

                        title:
                            game.title,

                        description:
                            game.description || "",

                        level:
                            game.level,

                        game_type:
                            game.game_type || "",

                        xp_reward:
                            Number(
                                game.xp_reward || 0
                            ),

                        status:
                            game.status,

                        created_at:
                            game.created_at
                    })
                );

            return res.json({
                success: true,
                games:
                    formattedGames
            });
        } catch (error) {
            console.error(
                "Get student games error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load games."
            });
        }
    }
);


/* =========================================================
   GET STUDENT GAME QUESTIONS
========================================================= */

/*
 * Students can only access questions belonging to an
 * active game.
 *
 * Only active questions are returned.
 *
 * The correct answer is intentionally returned because
 * the current student game engine evaluates answers in
 * the browser. If later we want stronger protection,
 * answer checking can be moved completely to the backend.
 */
router.get(
    "/games/:id/questions",
    authenticateStudent,
    (req, res) => {
        try {
            const gameId =
                validId(
                    req.params.id
                );

            if (!gameId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid game ID."
                });
            }

            const game =
                db.prepare(`
                    SELECT
                        id,
                        title,
                        description,
                        level,
                        game_type,
                        xp_reward,
                        status
                    FROM games
                    WHERE id = ?
                    AND status = 'active'
                    LIMIT 1
                `).get(
                    gameId
                );

            if (!game) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Game not found or is not currently active."
                });
            }

            const questions =
                db.prepare(`
                    SELECT
                        id,
                        game_id,
                        question,
                        question_type,
                        options,
                        correct_answer,
                        explanation,
                        points,
                        question_order,
                        status
                    FROM game_questions
                    WHERE game_id = ?
                    AND status = 'active'
                    ORDER BY
                        question_order ASC,
                        id ASC
                `).all(
                    gameId
                );

            const formattedQuestions =
                questions.map(
                    question => ({
                        id:
                            question.id,

                        game_id:
                            question.game_id,

                        question:
                            question.question,

                        question_type:
                            question.question_type ||
                            "multiple-choice",

                        options:
                            parseGameOptions(
                                question.options
                            ),

                        correct_answer:
                            question.correct_answer,

                        explanation:
                            question.explanation ||
                            "",

                        points:
                            Number(
                                question.points || 1
                            ),

                        question_order:
                            Number(
                                question.question_order || 1
                            ),

                        status:
                            question.status
                    })
                );

            return res.json({
                success: true,

                game: {
                    id:
                        game.id,

                    title:
                        game.title,

                    description:
                        game.description || "",

                    level:
                        game.level,

                    game_type:
                        game.game_type || "",

                    xp_reward:
                        Number(
                            game.xp_reward || 0
                        ),

                    status:
                        game.status
                },

                questions:
                    formattedQuestions,

                count:
                    formattedQuestions.length
            });
        } catch (error) {
            console.error(
                "Get student game questions error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load game questions."
            });
        }
    }
);


/* =========================================================
   GET STUDENT ENROLLED CLASSES
========================================================= */

router.get(
    "/classes",
    authenticateStudent,
    (req, res) => {
        try {
            const classes =
                db.prepare(`
                    SELECT
                        cl.id,
                        cl.name,
                        cl.course_id,
                        cl.level,
                        cl.description,
                        cl.room,
                        cl.schedule,
                        cl.start_date,
                        cl.end_date,
                        cl.max_students,
                        cl.status,

                        c.name AS course_name,

                        e.enrollment_date,
                        e.status AS enrollment_status,
                        e.completion_date,
                        e.notes

                    FROM enrollments e

                    INNER JOIN classes cl
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
                        cl.start_date ASC,
                        cl.id ASC
                `).all(
                    req.student.studentId
                );

            return res.json({
                success: true,
                classes
            });
        } catch (error) {
            console.error(
                "Get student classes error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load your classes."
            });
        }
    }
);


/* =========================================================
   GET STUDENT CLASS DETAILS
========================================================= */

router.get(
    "/classes/:id",
    authenticateStudent,
    (req, res) => {
        try {
            const classId =
                validId(
                    req.params.id
                );

            if (!classId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid class ID."
                });
            }

            const classInfo =
                db.prepare(`
                    SELECT
                        cl.*,
                        c.name AS course_name,
                        c.description AS course_description,
                        c.level AS course_level
                    FROM classes cl
                    LEFT JOIN courses c
                        ON c.id = cl.course_id
                    INNER JOIN enrollments e
                        ON e.class_id = cl.id
                    WHERE cl.id = ?
                    AND e.student_id = ?
                    AND e.status = 'active'
                    LIMIT 1
                `).get(
                    classId,
                    req.student.studentId
                );

            if (!classInfo) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Class not found or you are not enrolled in it."
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
                        tc.is_primary
                    FROM teacher_classes tc
                    INNER JOIN teachers t
                        ON t.id = tc.teacher_id
                    WHERE tc.class_id = ?
                    AND t.status = 'active'
                    ORDER BY
                        tc.is_primary DESC,
                        t.full_name ASC
                `).all(
                    classId
                );

            const attendance =
                db.prepare(`
                    SELECT
                        attendance_date,
                        status,
                        notes
                    FROM attendance
                    WHERE student_id = ?
                    AND class_id = ?
                    ORDER BY
                        attendance_date DESC
                `).all(
                    req.student.studentId,
                    classId
                );

            return res.json({
                success: true,
                class:
                    classInfo,
                teachers,
                attendance
            });
        } catch (error) {
            console.error(
                "Get student class error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load class details."
            });
        }
    }
);


/* =========================================================
   GET STUDENT TEST RESULTS
========================================================= */

router.get(
    "/tests",
    authenticateStudent,
    (req, res) => {
        try {
            const results =
                db.prepare(`
                    SELECT
                        tr.id,
                        tr.test_id,
                        tr.student_id,
                        tr.score,
                        tr.total_points,
                        tr.percentage,
                        tr.rank,
                        tr.teacher_comment,
                        tr.status,
                        tr.graded_at,

                        t.title,
                        t.test_type,
                        t.total_points AS test_total_points,
                        t.test_date,
                        t.due_date,
                        t.description,

                        c.id AS course_id,
                        c.name AS course_name,
                        c.level AS course_level,

                        cl.id AS class_id,
                        cl.name AS class_name

                    FROM test_results tr

                    INNER JOIN tests t
                        ON t.id = tr.test_id

                    LEFT JOIN courses c
                        ON c.id = t.course_id

                    LEFT JOIN classes cl
                        ON cl.id = t.class_id

                    WHERE tr.student_id = ?

                    ORDER BY
                        t.test_date DESC,
                        tr.id DESC
                `).all(
                    req.student.studentId
                );

            const graded =
                results.filter(
                    item =>
                        item.percentage !== null &&
                        item.percentage !== undefined
                );

            const average =
                graded.length > 0
                    ? Math.round(
                        graded.reduce(
                            (
                                sum,
                                item
                            ) =>
                                sum +
                                Number(
                                    item.percentage || 0
                                ),
                            0
                        ) /
                        graded.length
                    )
                    : 0;

            const highest =
                graded.length > 0
                    ? Math.max(
                        ...graded.map(
                            item =>
                                Number(
                                    item.percentage || 0
                                )
                        )
                    )
                    : 0;

            return res.json({
                success: true,

                summary: {
                    total:
                        results.length,
                    graded:
                        graded.length,
                    average,
                    highest
                },

                results
            });
        } catch (error) {
            console.error(
                "Get student tests error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load test results."
            });
        }
    }
);


/* =========================================================
   GET STUDENT PERFORMANCE SUMMARY
========================================================= */

router.get(
    "/performance",
    authenticateStudent,
    (req, res) => {
        try {
            const studentId =
                req.student.studentId;

            const results =
                db.prepare(`
                    SELECT
                        tr.id,
                        tr.test_id,
                        tr.score,
                        tr.total_points,
                        tr.percentage,
                        tr.rank,

                        t.title,
                        t.test_type,
                        t.total_points AS test_total_points,
                        t.test_date
                    FROM test_results tr
                    INNER JOIN tests t
                        ON t.id = tr.test_id
                    WHERE tr.student_id = ?
                    ORDER BY
                        t.test_date DESC,
                        tr.id DESC
                `).all(
                    studentId
                );

            const graded =
                results.filter(
                    result =>
                        result.percentage !== null &&
                        result.percentage !== undefined
                );

            const average =
                graded.length > 0
                    ? Math.round(
                        graded.reduce(
                            (
                                sum,
                                result
                            ) =>
                                sum +
                                Number(
                                    result.percentage || 0
                                ),
                            0
                        ) /
                        graded.length
                    )
                    : 0;

            const highest =
                graded.length > 0
                    ? Math.max(
                        ...graded.map(
                            result =>
                                Number(
                                    result.percentage || 0
                                )
                        )
                    )
                    : 0;

            const lowest =
                graded.length > 0
                    ? Math.min(
                        ...graded.map(
                            result =>
                                Number(
                                    result.percentage || 0
                                )
                        )
                    )
                    : 0;

            const enrollment =
                db.prepare(`
                    SELECT
                        e.class_id,
                        cl.name AS class_name,
                        cl.level,
                        c.name AS course_name
                    FROM enrollments e
                    INNER JOIN classes cl
                        ON cl.id = e.class_id
                    LEFT JOIN courses c
                        ON c.id = cl.course_id
                    WHERE e.student_id = ?
                    AND e.status = 'active'
                    ORDER BY
                        e.enrollment_date DESC,
                        e.id DESC
                    LIMIT 1
                `).get(
                    studentId
                );

            let classRank = null;
            let classSize = 0;
            let classAverage = 0;

            if (enrollment) {
                const classStudents =
                    db.prepare(`
                        SELECT
                            s.id,
                            COALESCE(
                                AVG(tr.percentage),
                                NULL
                            ) AS average
                        FROM enrollments e
                        INNER JOIN students s
                            ON s.id = e.student_id
                        LEFT JOIN test_results tr
                            ON tr.student_id = s.id
                        WHERE e.class_id = ?
                        AND e.status = 'active'
                        GROUP BY s.id
                    `).all(
                        enrollment.class_id
                    );

                classSize =
                    classStudents.length;

                const ranked =
                    classStudents
                        .filter(
                            item =>
                                item.average !==
                                null
                        )
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                Number(
                                    b.average
                                ) -
                                Number(
                                    a.average
                                )
                        );

                const current =
                    ranked.find(
                        item =>
                            Number(item.id) ===
                            Number(studentId)
                    );

                classRank =
                    current
                        ? ranked.indexOf(
                            current
                        ) + 1
                        : null;

                const classAverages =
                    classStudents
                        .filter(
                            item =>
                                item.average !==
                                null
                        )
                        .map(
                            item =>
                                Number(
                                    item.average
                                )
                        );

                classAverage =
                    classAverages.length > 0
                        ? Math.round(
                            classAverages.reduce(
                                (
                                    sum,
                                    value
                                ) =>
                                    sum + value,
                                0
                            ) /
                            classAverages.length
                        )
                        : 0;
            }

            return res.json({
                success: true,

                summary: {
                    testsTaken:
                        results.length,
                    gradedTests:
                        graded.length,
                    average,
                    highest,
                    lowest,
                    classRank,
                    classSize,
                    classAverage
                },

                class:
                    enrollment || null,

                results
            });
        } catch (error) {
            console.error(
                "Get student performance error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load performance."
            });
        }
    }
);


/* =========================================================
   GET STUDENT PAYMENTS
========================================================= */

router.get(
    "/payments",
    authenticateStudent,
    (req, res) => {
        try {
            const payments =
                db.prepare(`
                    SELECT
                        p.*,
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
                `).all(
                    req.student.studentId
                );

            const transactions =
                db.prepare(`
                    SELECT
                        pt.*
                    FROM payment_transactions pt
                    INNER JOIN payments p
                        ON p.id = pt.payment_id
                    WHERE p.student_id = ?
                    ORDER BY
                        pt.created_at DESC,
                        pt.id DESC
                `).all(
                    req.student.studentId
                );

            const totalFee =
                payments.reduce(
                    (
                        sum,
                        payment
                    ) =>
                        sum +
                        Number(
                            payment.total_fee || 0
                        ),
                    0
                );

            const totalPaid =
                payments.reduce(
                    (
                        sum,
                        payment
                    ) =>
                        sum +
                        Number(
                            payment.amount_paid || 0
                        ),
                    0
                );

            const totalRemaining =
                payments.reduce(
                    (
                        sum,
                        payment
                    ) =>
                        sum +
                        Number(
                            payment.amount_remaining ??
                            payment.remaining_amount ??
                            0
                        ),
                    0
                );

            return res.json({
                success: true,

                summary: {
                    totalFee,
                    totalPaid,
                    totalRemaining
                },

                payments,

                transactions
            });
        } catch (error) {
            console.error(
                "Get student payments error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load payment information."
            });
        }
    }
);


/* =========================================================
   GET STUDENT NOTIFICATIONS
========================================================= */

router.get(
    "/notifications",
    authenticateStudent,
    (req, res) => {
        try {
            const studentId =
                req.student.studentId;

            const student =
                db.prepare(`
                    SELECT
                        id,
                        level
                    FROM students
                    WHERE id = ?
                `).get(
                    studentId
                );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student account not found."
                });
            }

            const notifications =
                db.prepare(`
                    SELECT
                        id,
                        title,
                        message,
                        type,
                        is_read,
                        created_at
                    FROM notifications
                    WHERE
                        student_id = ?
                        OR student_id IS NULL
                    ORDER BY
                        created_at DESC,
                        id DESC
                    LIMIT 100
                `).all(
                    studentId
                );

            return res.json({
                success: true,
                notifications
            });
        } catch (error) {
            console.error(
                "Get student notifications error:",
                error
            );

            return res.json({
                success: true,
                notifications: []
            });
        }
    }
);


/* =========================================================
   STUDENT HEALTH
========================================================= */

router.get(
    "/health",
    authenticateStudent,
    (req, res) => {
        try {
            const requiredTables = [
                "students",
                "access_codes",
                "courses",
                "teachers",
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
                "game_questions",
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

            const missingTables = [];

            for (
                const table
                of requiredTables
            ) {
                const exists =
                    db.prepare(`
                        SELECT name
                        FROM sqlite_master
                        WHERE type = 'table'
                        AND name = ?
                        LIMIT 1
                    `).get(
                        table
                    );

                if (!exists) {
                    missingTables.push(
                        table
                    );
                }
            }

            const healthy =
                missingTables.length === 0;

            return res.status(
                healthy ? 200 : 503
            ).json({
                success:
                    healthy,

                status:
                    healthy
                        ? "healthy"
                        : "degraded",

                studentId:
                    req.student.studentId,

                serverTime:
                    new Date().toISOString(),

                kigaliDate:
                    getKigaliDate(),

                database:
                    healthy
                        ? "connected"
                        : "missing tables",

                missingTables
            });
        } catch (error) {
            console.error(
                "Student health error:",
                error
            );

            return res.status(500).json({
                success: false,
                status: "error",
                message:
                    "Student service health check failed."
            });
        }
    }
);

router.get(
    "/class-materials",
    authenticateStudent,
    (req, res) => {
        try {
            const materials = db.prepare(`
                SELECT
                    cm.*,
                    cl.name AS class_name,
                    t.full_name AS teacher_name
                FROM class_materials cm
                JOIN enrollments e
                    ON e.class_id = cm.class_id
                   AND e.student_id = ?
                   AND e.status = 'active'
                JOIN classes cl
                    ON cl.id = cm.class_id
                LEFT JOIN teachers t
                    ON t.id = cm.teacher_id
                WHERE cm.status = 'published'
                ORDER BY cm.id DESC
            `).all(req.student.id);

            return res.json({ materials });
        } catch (error) {
            console.error("Student class materials error:", error);
            return res.status(500).json({ message: "Could not load class materials." });
        }
    }
);
/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
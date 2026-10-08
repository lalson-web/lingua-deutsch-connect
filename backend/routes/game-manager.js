/* =========================================================
   LINGUA DEUTSCH CONNECT
   GAMES MANAGER ROUTES

   IMPORTANT:
   This is completely separate from the main Admin Dashboard.

   Base route:
   /api/game-manager

   Uses the existing admin credentials/JWT system,
   but does NOT modify routes/admin.js.
========================================================= */

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const router = express.Router();
const db = require("../database");

require("dotenv").config();

/* =========================================================
   CONFIG
========================================================= */

const JWT_SECRET =
    process.env.JWT_SECRET ||
    process.env.JWT_SECRET_KEY ||
    "lingua-deutsch-connect-secret";

const ADMIN_EMAIL =
    process.env.ADMIN_EMAIL ||
    "admin@linguadeutschconnect.com";

const ADMIN_PASSWORD =
    process.env.ADMIN_PASSWORD ||
    "admin123";

const ADMIN_PASSWORD_HASH =
    process.env.ADMIN_PASSWORD_HASH || "";


/* =========================================================
   GAME QUESTIONS TABLE
=========================================================

   The existing database already has:

   games
   game_scores

   We only add this small table for the manager.

========================================================= */

try {

    db.prepare(`
        CREATE TABLE IF NOT EXISTS game_questions (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            game_id INTEGER NOT NULL,

            question TEXT NOT NULL,

            question_type TEXT DEFAULT 'multiple-choice',

            options TEXT,

            correct_answer TEXT,

            explanation TEXT,

            points INTEGER DEFAULT 1,

            question_order INTEGER DEFAULT 1,

            status TEXT DEFAULT 'active',

            created_at DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            updated_at DATETIME
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (game_id)
                REFERENCES games(id)
                ON DELETE CASCADE
        )
    `).run();

} catch (error) {

    console.error(
        "Could not create game_questions table:",
        error
    );

}


/* =========================================================
   HELPERS
========================================================= */

function validId(value) {

    const id = Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
}


function cleanString(value) {

    return String(
        value ?? ""
    ).trim();

}


function normalizeStatus(value) {

    const status =
        cleanString(value)
            .toLowerCase();

    if (
        status === "inactive" ||
        status === "disabled"
    ) {
        return "inactive";
    }

    return "active";
}


function parseOptions(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === "string") {

        try {

            const parsed =
                JSON.parse(value);

            if (Array.isArray(parsed)) {
                return parsed;
            }

        } catch (error) {
            // Treat as plain text below.
        }

        return value
            .split("\n")
            .map(item => item.trim())
            .filter(Boolean);
    }

    return [];
}


function parseNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    if (
        !Number.isFinite(number)
    ) {
        return fallback;
    }

    return Math.floor(number);
}


/* =========================================================
   AUTHENTICATION
========================================================= */

function authenticateGameManager(
    req,
    res,
    next
) {

    try {

        const header =
            req.headers.authorization || "";

        if (
            !header.startsWith(
                "Bearer "
            )
        ) {

            return res.status(401).json({
                success: false,
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
                success: false,
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
            decoded.role !== "admin" &&
            decoded.type !== "admin"
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Administrator access required."
            });

        }

        req.admin = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired administrator token."
        });

    }

}


/* =========================================================
   LOGIN
=========================================================

   This allows the Games Manager to have its own login
   page without touching the existing Admin Dashboard.

========================================================= */

router.post(
    "/login",
    (req, res) => {

        try {

            const {
                email,
                password
            } = req.body || {};

            const submittedEmail =
                cleanString(email)
                    .toLowerCase();

            if (
                !submittedEmail ||
                !password
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Email and password are required."
                });

            }

            if (
                submittedEmail !==
                String(
                    ADMIN_EMAIL
                )
                    .trim()
                    .toLowerCase()
            ) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });

            }

            let passwordValid = false;

            if (
                ADMIN_PASSWORD_HASH
            ) {

                passwordValid =
                    bcrypt.compareSync(
                        password,
                        ADMIN_PASSWORD_HASH
                    );

            } else {

                passwordValid =
                    password ===
                    ADMIN_PASSWORD;

            }

            if (!passwordValid) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid email or password."
                });

            }

            const token =
                jwt.sign(
                    {
                        role: "admin",
                        type: "admin",
                        email:
                            submittedEmail,
                        name:
                            "Games Manager"
                    },
                    JWT_SECRET,
                    {
                        expiresIn:
                            "12h"
                    }
                );

            return res.json({

                success: true,

                message:
                    "Games Manager login successful.",

                token,

                admin: {
                    email:
                        submittedEmail,

                    name:
                        "Games Manager",

                    role:
                        "admin"
                }

            });

        } catch (error) {

            console.error(
                "Games Manager login error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Games Manager login failed."
            });

        }

    }
);


/* =========================================================
   MANAGER HEALTH CHECK
========================================================= */

router.get(
    "/health",
    authenticateGameManager,
    (req, res) => {

        try {

            const gamesTable =
                db.prepare(`
                    SELECT name
                    FROM sqlite_master
                    WHERE type = 'table'
                      AND name = 'games'
                `).get();

            const questionsTable =
                db.prepare(`
                    SELECT name
                    FROM sqlite_master
                    WHERE type = 'table'
                      AND name = 'game_questions'
                `).get();

            return res.json({

                success: true,

                manager:
                    "LINGUA DEUTSCH CONNECT GAMES MANAGER",

                authenticated: true,

                database: {
                    games:
                        !!gamesTable,

                    gameQuestions:
                        !!questionsTable
                }

            });

        } catch (error) {

            console.error(
                "Games Manager health error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Health check failed."
            });

        }

    }
);


/* =========================================================
   GET ALL GAMES
========================================================= */

router.get(
    "/games",
    authenticateGameManager,
    (req, res) => {

        try {

            const games =
                db.prepare(`
                    SELECT
                        g.*,

                        (
                            SELECT COUNT(*)
                            FROM game_questions q
                            WHERE q.game_id = g.id
                        ) AS question_count,

                        (
                            SELECT COUNT(*)
                            FROM game_scores gs
                            WHERE gs.game_id = g.id
                        ) AS times_played,

                        (
                            SELECT
                                COUNT(
                                    DISTINCT gs.student_id
                                )
                            FROM game_scores gs
                            WHERE gs.game_id = g.id
                        ) AS unique_players

                    FROM games g

                    ORDER BY
                        g.created_at DESC,
                        g.id DESC
                `).all();

            return res.json({
                success: true,
                games
            });

        } catch (error) {

            console.error(
                "Get games error:",
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
   GET SINGLE GAME
========================================================= */

router.get(
    "/games/:id",
    authenticateGameManager,
    (req, res) => {

        try {

            const gameId =
                validId(req.params.id);

            if (!gameId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid game ID."
                });

            }

            const game =
                db.prepare(`
                    SELECT *
                    FROM games
                    WHERE id = ?
                `).get(gameId);

            if (!game) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Game not found."
                });

            }

            const questions =
                db.prepare(`
                    SELECT *
                    FROM game_questions
                    WHERE game_id = ?
                    ORDER BY
                        question_order ASC,
                        id ASC
                `).all(gameId);

            const parsedQuestions =
                questions.map(
                    question => ({
                        ...question,

                        options:
                            parseOptions(
                                question.options
                            )
                    })
                );

            return res.json({

                success: true,

                game: {
                    ...game,
                    questions:
                        parsedQuestions
                }

            });

        } catch (error) {

            console.error(
                "Get single game error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load game."
            });

        }

    }
);


/* =========================================================
   CREATE GAME
========================================================= */

router.post(
    "/games",
    authenticateGameManager,
    (req, res) => {

        try {

            const {
                title,
                description,
                level,
                game_type,
                xp_reward,
                status
            } = req.body || {};

            const cleanTitle =
                cleanString(title);

            const cleanDescription =
                cleanString(description);

            const cleanLevel =
                cleanString(level)
                    .toUpperCase();

            const cleanGameType =
                cleanString(game_type);

            const xp =
                parseNumber(
                    xp_reward,
                    20
                );

            const cleanStatus =
                normalizeStatus(status);

            if (!cleanTitle) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Game title is required."
                });

            }

            if (!cleanLevel) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Game level is required."
                });

            }

            const result =
                db.prepare(`
                    INSERT INTO games
                    (
                        title,
                        description,
                        level,
                        game_type,
                        xp_reward,
                        status
                    )
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(
                    cleanTitle,
                    cleanDescription || null,
                    cleanLevel,
                    cleanGameType || null,
                    xp,
                    cleanStatus
                );

            const game =
                db.prepare(`
                    SELECT *
                    FROM games
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            return res.status(201).json({

                success: true,

                message:
                    "Game created successfully.",

                game

            });

        } catch (error) {

            console.error(
                "Create game error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not create game."
            });

        }

    }
);


/* =========================================================
   UPDATE GAME
========================================================= */

router.put(
    "/games/:id",
    authenticateGameManager,
    (req, res) => {

        try {

            const gameId =
                validId(req.params.id);

            if (!gameId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid game ID."
                });

            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM games
                    WHERE id = ?
                `).get(gameId);

            if (!existing) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Game not found."
                });

            }

            const {
                title,
                description,
                level,
                game_type,
                xp_reward,
                status
            } = req.body || {};

            const updatedTitle =
                title !== undefined
                    ? cleanString(title)
                    : existing.title;

            const updatedDescription =
                description !== undefined
                    ? cleanString(description)
                    : existing.description;

            const updatedLevel =
                level !== undefined
                    ? cleanString(level)
                        .toUpperCase()
                    : existing.level;

            const updatedGameType =
                game_type !== undefined
                    ? cleanString(game_type)
                    : existing.game_type;

            const updatedXp =
                xp_reward !== undefined
                    ? parseNumber(
                        xp_reward,
                        existing.xp_reward
                    )
                    : existing.xp_reward;

            const updatedStatus =
                status !== undefined
                    ? normalizeStatus(status)
                    : existing.status;

            if (!updatedTitle) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Game title cannot be empty."
                });

            }

            db.prepare(`
                UPDATE games

                SET
                    title = ?,
                    description = ?,
                    level = ?,
                    game_type = ?,
                    xp_reward = ?,
                    status = ?

                WHERE id = ?
            `).run(
                updatedTitle,
                updatedDescription || null,
                updatedLevel,
                updatedGameType || null,
                updatedXp,
                updatedStatus,
                gameId
            );

            const game =
                db.prepare(`
                    SELECT *
                    FROM games
                    WHERE id = ?
                `).get(gameId);

            return res.json({

                success: true,

                message:
                    "Game updated successfully.",

                game

            });

        } catch (error) {

            console.error(
                "Update game error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not update game."
            });

        }

    }
);


/* =========================================================
   DELETE GAME
========================================================= */

router.delete(
    "/games/:id",
    authenticateGameManager,
    (req, res) => {

        try {

            const gameId =
                validId(req.params.id);

            if (!gameId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid game ID."
                });

            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM games
                    WHERE id = ?
                `).get(gameId);

            if (!existing) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Game not found."
                });

            }

            db.prepare(`
                DELETE FROM games
                WHERE id = ?
            `).run(gameId);

            return res.json({

                success: true,

                message:
                    "Game deleted successfully."

            });

        } catch (error) {

            console.error(
                "Delete game error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not delete game."
            });

        }

    }
);


/* =========================================================
   TOGGLE GAME STATUS
========================================================= */

router.patch(
    "/games/:id/status",
    authenticateGameManager,
    (req, res) => {

        try {

            const gameId =
                validId(req.params.id);

            if (!gameId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid game ID."
                });

            }

            const game =
                db.prepare(`
                    SELECT *
                    FROM games
                    WHERE id = ?
                `).get(gameId);

            if (!game) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Game not found."
                });

            }

            const newStatus =
                game.status === "active"
                    ? "inactive"
                    : "active";

            db.prepare(`
                UPDATE games
                SET status = ?
                WHERE id = ?
            `).run(
                newStatus,
                gameId
            );

            return res.json({

                success: true,

                message:
                    `Game ${
                        newStatus === "active"
                            ? "activated"
                            : "deactivated"
                    } successfully.`,

                status:
                    newStatus

            });

        } catch (error) {

            console.error(
                "Toggle game status error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not change game status."
            });

        }

    }
);


/* =========================================================
   GET QUESTIONS FOR A GAME
========================================================= */

router.get(
    "/games/:gameId/questions",
    authenticateGameManager,
    (req, res) => {

        try {

            const gameId =
                validId(
                    req.params.gameId
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
                    SELECT *
                    FROM games
                    WHERE id = ?
                `).get(gameId);

            if (!game) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Game not found."
                });

            }

            const questions =
                db.prepare(`
                    SELECT *
                    FROM game_questions
                    WHERE game_id = ?

                    ORDER BY
                        question_order ASC,
                        id ASC
                `).all(gameId);

            const parsed =
                questions.map(
                    question => ({
                        ...question,

                        options:
                            parseOptions(
                                question.options
                            )
                    })
                );

            return res.json({

                success: true,

                game,

                questions:
                    parsed

            });

        } catch (error) {

            console.error(
                "Get game questions error:",
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
   CREATE QUESTION
========================================================= */

router.post(
    "/games/:gameId/questions",
    authenticateGameManager,
    (req, res) => {

        try {

            const gameId =
                validId(
                    req.params.gameId
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
                    SELECT *
                    FROM games
                    WHERE id = ?
                `).get(gameId);

            if (!game) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Game not found."
                });

            }

            const {
                question,
                question_type,
                options,
                correct_answer,
                explanation,
                points,
                question_order,
                status
            } = req.body || {};

            const cleanQuestion =
                cleanString(question);

            const cleanType =
                cleanString(
                    question_type
                ) ||
                "multiple-choice";

            const cleanAnswer =
                cleanString(
                    correct_answer
                );

            const cleanExplanation =
                cleanString(
                    explanation
                );

            const cleanOptions =
                parseOptions(options);

            const cleanPoints =
                Math.max(
                    1,
                    parseNumber(
                        points,
                        1
                    )
                );

            let cleanOrder =
                parseNumber(
                    question_order,
                    0
                );

            if (
                cleanOrder < 1
            ) {

                const latest =
                    db.prepare(`
                        SELECT
                            MAX(question_order)
                            AS max_order

                        FROM game_questions

                        WHERE game_id = ?
                    `).get(gameId);

                cleanOrder =
                    Number(
                        latest?.max_order || 0
                    ) + 1;

            }

            const cleanStatus =
                normalizeStatus(status);

            if (!cleanQuestion) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Question text is required."
                });

            }

            if (!cleanAnswer) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Correct answer is required."
                });

            }

            const result =
                db.prepare(`
                    INSERT INTO game_questions
                    (
                        game_id,
                        question,
                        question_type,
                        options,
                        correct_answer,
                        explanation,
                        points,
                        question_order,
                        status
                    )

                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    gameId,
                    cleanQuestion,
                    cleanType,
                    JSON.stringify(
                        cleanOptions
                    ),
                    cleanAnswer,
                    cleanExplanation || null,
                    cleanPoints,
                    cleanOrder,
                    cleanStatus
                );

            const created =
                db.prepare(`
                    SELECT *
                    FROM game_questions
                    WHERE id = ?
                `).get(
                    result.lastInsertRowid
                );

            return res.status(201).json({

                success: true,

                message:
                    "Question created successfully.",

                question: {
                    ...created,

                    options:
                        parseOptions(
                            created.options
                        )
                }

            });

        } catch (error) {

            console.error(
                "Create game question error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not create question."
            });

        }

    }
);


/* =========================================================
   UPDATE QUESTION
========================================================= */

router.put(
    "/questions/:id",
    authenticateGameManager,
    (req, res) => {

        try {

            const questionId =
                validId(req.params.id);

            if (!questionId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid question ID."
                });

            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM game_questions
                    WHERE id = ?
                `).get(questionId);

            if (!existing) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Question not found."
                });

            }

            const {
                question,
                question_type,
                options,
                correct_answer,
                explanation,
                points,
                question_order,
                status
            } = req.body || {};

            const updatedQuestion =
                question !== undefined
                    ? cleanString(question)
                    : existing.question;

            const updatedType =
                question_type !== undefined
                    ? cleanString(
                        question_type
                    )
                    : existing.question_type;

            const updatedOptions =
                options !== undefined
                    ? parseOptions(options)
                    : parseOptions(
                        existing.options
                    );

            const updatedAnswer =
                correct_answer !== undefined
                    ? cleanString(
                        correct_answer
                    )
                    : existing.correct_answer;

            const updatedExplanation =
                explanation !== undefined
                    ? cleanString(
                        explanation
                    )
                    : existing.explanation;

            const updatedPoints =
                points !== undefined
                    ? Math.max(
                        1,
                        parseNumber(
                            points,
                            existing.points
                        )
                    )
                    : existing.points;

            const updatedOrder =
                question_order !== undefined
                    ? Math.max(
                        1,
                        parseNumber(
                            question_order,
                            existing.question_order
                        )
                    )
                    : existing.question_order;

            const updatedStatus =
                status !== undefined
                    ? normalizeStatus(status)
                    : existing.status;

            if (!updatedQuestion) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Question text cannot be empty."
                });

            }

            if (!updatedAnswer) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Correct answer cannot be empty."
                });

            }

            db.prepare(`
                UPDATE game_questions

                SET
                    question = ?,
                    question_type = ?,
                    options = ?,
                    correct_answer = ?,
                    explanation = ?,
                    points = ?,
                    question_order = ?,
                    status = ?,
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE id = ?
            `).run(
                updatedQuestion,
                updatedType,
                JSON.stringify(
                    updatedOptions
                ),
                updatedAnswer,
                updatedExplanation || null,
                updatedPoints,
                updatedOrder,
                updatedStatus,
                questionId
            );

            const updated =
                db.prepare(`
                    SELECT *
                    FROM game_questions
                    WHERE id = ?
                `).get(questionId);

            return res.json({

                success: true,

                message:
                    "Question updated successfully.",

                question: {
                    ...updated,

                    options:
                        parseOptions(
                            updated.options
                        )
                }

            });

        } catch (error) {

            console.error(
                "Update game question error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not update question."
            });

        }

    }
);


/* =========================================================
   DELETE QUESTION
========================================================= */

router.delete(
    "/questions/:id",
    authenticateGameManager,
    (req, res) => {

        try {

            const questionId =
                validId(req.params.id);

            if (!questionId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid question ID."
                });

            }

            const existing =
                db.prepare(`
                    SELECT *
                    FROM game_questions
                    WHERE id = ?
                `).get(questionId);

            if (!existing) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Question not found."
                });

            }

            db.prepare(`
                DELETE FROM game_questions
                WHERE id = ?
            `).run(questionId);

            return res.json({

                success: true,

                message:
                    "Question deleted successfully."

            });

        } catch (error) {

            console.error(
                "Delete game question error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not delete question."
            });

        }

    }
);


/* =========================================================
   TOGGLE QUESTION STATUS
========================================================= */

router.patch(
    "/questions/:id/status",
    authenticateGameManager,
    (req, res) => {

        try {

            const questionId =
                validId(req.params.id);

            if (!questionId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid question ID."
                });

            }

            const question =
                db.prepare(`
                    SELECT *
                    FROM game_questions
                    WHERE id = ?
                `).get(questionId);

            if (!question) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Question not found."
                });

            }

            const newStatus =
                question.status === "active"
                    ? "inactive"
                    : "active";

            db.prepare(`
                UPDATE game_questions
                SET
                    status = ?,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(
                newStatus,
                questionId
            );

            return res.json({

                success: true,

                message:
                    `Question ${
                        newStatus === "active"
                            ? "activated"
                            : "deactivated"
                    } successfully.`,

                status:
                    newStatus

            });

        } catch (error) {

            console.error(
                "Toggle question status error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not change question status."
            });

        }

    }
);


/* =========================================================
   GAME STATISTICS
========================================================= */

router.get(
    "/games/:id/statistics",
    authenticateGameManager,
    (req, res) => {

        try {

            const gameId =
                validId(req.params.id);

            if (!gameId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid game ID."
                });

            }

            const game =
                db.prepare(`
                    SELECT *
                    FROM games
                    WHERE id = ?
                `).get(gameId);

            if (!game) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Game not found."
                });

            }

            const stats =
                db.prepare(`
                    SELECT

                        COUNT(*) AS total_plays,

                        COUNT(
                            DISTINCT student_id
                        ) AS unique_players,

                        COALESCE(
                            AVG(score),
                            0
                        ) AS average_score,

                        COALESCE(
                            MAX(score),
                            0
                        ) AS highest_score,

                        COALESCE(
                            SUM(xp_earned),
                            0
                        ) AS total_xp

                    FROM game_scores

                    WHERE game_id = ?
                `).get(gameId);

            const recentScores =
                db.prepare(`
                    SELECT

                        gs.id,
                        gs.student_id,
                        gs.score,
                        gs.xp_earned,
                        gs.played_at,

                        s.first_name,
                        s.last_name,
                        s.email

                    FROM game_scores gs

                    LEFT JOIN students s
                        ON s.id =
                           gs.student_id

                    WHERE gs.game_id = ?

                    ORDER BY
                        gs.played_at DESC,
                        gs.id DESC

                    LIMIT 50
                `).all(gameId);

            return res.json({

                success: true,

                game,

                statistics: {
                    totalPlays:
                        Number(
                            stats.total_plays || 0
                        ),

                    uniquePlayers:
                        Number(
                            stats.unique_players || 0
                        ),

                    averageScore:
                        Number(
                            Number(
                                stats.average_score ||
                                0
                            ).toFixed(2)
                        ),

                    highestScore:
                        Number(
                            stats.highest_score || 0
                        ),

                    totalXp:
                        Number(
                            stats.total_xp || 0
                        )
                },

                recentScores

            });

        } catch (error) {

            console.error(
                "Game statistics error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load game statistics."
            });

        }

    }
);


/* =========================================================
   OVERALL GAMES DASHBOARD STATISTICS
========================================================= */

router.get(
    "/statistics",
    authenticateGameManager,
    (req, res) => {

        try {

            const totalGames =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM games
                `).get();

            const activeGames =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM games
                    WHERE status = 'active'
                `).get();

            const totalQuestions =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM game_questions
                `).get();

            const activeQuestions =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM game_questions
                    WHERE status = 'active'
                `).get();

            const totalPlays =
                db.prepare(`
                    SELECT COUNT(*) AS count
                    FROM game_scores
                `).get();

            const uniquePlayers =
                db.prepare(`
                    SELECT COUNT(
                        DISTINCT student_id
                    ) AS count

                    FROM game_scores
                `).get();

            const totalXp =
                db.prepare(`
                    SELECT COALESCE(
                        SUM(xp_earned),
                        0
                    ) AS total

                    FROM game_scores
                `).get();

            const popularGames =
                db.prepare(`
                    SELECT

                        g.id,
                        g.title,
                        g.level,
                        g.status,

                        COUNT(gs.id)
                            AS plays

                    FROM games g

                    LEFT JOIN game_scores gs
                        ON gs.game_id =
                           g.id

                    GROUP BY
                        g.id

                    ORDER BY
                        plays DESC,
                        g.id DESC

                    LIMIT 10
                `).all();

            return res.json({

                success: true,

                statistics: {

                    totalGames:
                        Number(
                            totalGames.count || 0
                        ),

                    activeGames:
                        Number(
                            activeGames.count || 0
                        ),

                    totalQuestions:
                        Number(
                            totalQuestions.count || 0
                        ),

                    activeQuestions:
                        Number(
                            activeQuestions.count || 0
                        ),

                    totalPlays:
                        Number(
                            totalPlays.count || 0
                        ),

                    uniquePlayers:
                        Number(
                            uniquePlayers.count || 0
                        ),

                    totalXp:
                        Number(
                            totalXp.total || 0
                        )

                },

                popularGames

            });

        } catch (error) {

            console.error(
                "Overall game statistics error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Could not load Games Manager statistics."
            });

        }

    }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
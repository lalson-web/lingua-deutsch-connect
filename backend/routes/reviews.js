const express = require("express");
const db = require("../database"); // your better-sqlite3 instance

const router = express.Router();

db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        level TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        message TEXT NOT NULL,
        approved INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
`);

const LEVELS = ["A1", "A2", "B1", "B2"];

// Public: only approved reviews
router.get("/", (req, res) => {
    const rows = db
        .prepare(
            `SELECT name, level, rating, message, created_at
             FROM reviews
             WHERE approved = 1
             ORDER BY created_at DESC
             LIMIT 50`
        )
        .all();

    res.json(rows);
});

// Public: submit a review (needs admin approval before it shows)
router.post("/", (req, res) => {
    const name = String(req.body.name || "").trim().slice(0, 60);
    const level = String(req.body.level || "");
    const rating = Number(req.body.rating);
    const message = String(req.body.message || "").trim().slice(0, 500);

    if (
        !name ||
        message.length < 10 ||
        !LEVELS.includes(level) ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {
        return res.status(400).json({ error: "Invalid review data" });
    }

    db.prepare(
        `INSERT INTO reviews (name, level, rating, message) VALUES (?, ?, ?, ?)`
    ).run(name, level, rating, message);

    res.status(201).json({ success: true });
});

module.exports = router;
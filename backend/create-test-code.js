const db = require("./database");

const code = "LDC-A1-7K92X";

const existing = db.prepare(`
    SELECT id
    FROM access_codes
    WHERE code = ?
`).get(code);

if (existing) {

    console.log("❌ This access code already exists.");

} else {

    db.prepare(`
        INSERT INTO access_codes (
            code,
            course,
            level,
            payment_status,
            used
        )
        VALUES (?, ?, ?, ?, ?)
    `).run(
        code,
        "German A1",
        "A1",
        "paid",
        0
    );

    console.log("");
    console.log("========================================");
    console.log(" LDC TEST ACCESS CODE CREATED");
    console.log("========================================");
    console.log("");
    console.log(" Code:    LDC-A1-7K92X");
    console.log(" Course:  German A1");
    console.log(" Level:   A1");
    console.log(" Payment: paid");
    console.log(" Status:  unused");
    console.log("");
    console.log("========================================");
}
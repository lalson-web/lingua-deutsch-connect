const db = require("./db"); // same db file you use in routes/reviews.js

const args = process.argv.slice(2);

if (args.length === 0) {
    // No arguments: show reviews that are waiting for approval
    const pending = db
        .prepare("SELECT id, name, level, rating, message FROM reviews WHERE approved = 0")
        .all();

    if (pending.length === 0) {
        console.log("No pending reviews.");
    } else {
        console.log("Pending reviews:\n");
        pending.forEach((r) => {
            console.log(`#${r.id} | ${r.name} (${r.level}) | ${r.rating}/5`);
            console.log(`   ${r.message}\n`);
        });
        console.log("Approve with:  node approve-reviews.js 1 2   (ids)");
        console.log("Or approve all: node approve-reviews.js all");
    }
} else if (args[0] === "all") {
    const result = db.prepare("UPDATE reviews SET approved = 1").run();
    console.log(`Approved ${result.changes} review(s).`);
} else {
    const approve = db.prepare("UPDATE reviews SET approved = 1 WHERE id = ?");
    args.forEach((id) => {
        const result = approve.run(Number(id));
        console.log(
            result.changes ? `Approved review #${id}` : `Review #${id} not found`
        );
    });
}
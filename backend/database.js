/* =========================================================
   LINGUA DEUTSCH CONNECT
   DATABASE INITIALIZATION
   CLASSROOM + ONLINE LEARNING PLATFORM
========================================================= */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");


/* =========================================================
   DATABASE LOCATION
========================================================= */

const databaseFolder =
    path.join(
        __dirname,
        "database"
    );


if (
    !fs.existsSync(databaseFolder)
) {

    fs.mkdirSync(
        databaseFolder,
        {
            recursive: true
        }
    );

}


const databasePath =
    path.join(
        databaseFolder,
        "ldc.db"
    );


/* =========================================================
   DATABASE CONNECTION
========================================================= */

const db =
    new Database(
        databasePath
    );


/* =========================================================
   SQLITE SETTINGS
========================================================= */

db.pragma(
    "journal_mode = WAL"
);

db.pragma(
    "foreign_keys = ON"
);

db.pragma(
    "busy_timeout = 5000"
);

db.pragma(
    "synchronous = NORMAL"
);


/* =========================================================
   HELPERS
========================================================= */

function tableExists(
    tableName
) {

    const result =
        db.prepare(`
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            AND name = ?
            LIMIT 1
        `).get(
            tableName
        );

    return Boolean(result);

}


function columnExists(
    tableName,
    columnName
) {

    if (
        !tableExists(
            tableName
        )
    ) {

        return false;

    }


    const columns =
        db.prepare(
            `PRAGMA table_info(${tableName})`
        ).all();


    return columns.some(
        column =>
            column.name ===
            columnName
    );

}


function addColumn(
    tableName,
    columnName,
    definition
) {

    if (
        !columnExists(
            tableName,
            columnName
        )
    ) {

        db.exec(`
            ALTER TABLE ${tableName}
            ADD COLUMN ${columnName} ${definition}
        `);


        console.log(
            `Added column ${tableName}.${columnName}`
        );

    }

}


function createIndex(
    indexName,
    tableName,
    columns
) {

    try {

        db.exec(`
            CREATE INDEX IF NOT EXISTS
            ${indexName}
            ON ${tableName} (${columns})
        `);

    } catch (error) {

        console.warn(
            `Could not create index ${indexName}:`,
            error.message
        );

    }

}


/* =========================================================
   CLASSROOM SYSTEM
========================================================= */


/* =========================================================
   STUDENTS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS students (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        full_name TEXT NOT NULL,

        email TEXT NOT NULL UNIQUE,

        phone TEXT,

        password_hash TEXT NOT NULL,

        course TEXT,

        level TEXT,

        access_code TEXT UNIQUE,

        payment_status TEXT DEFAULT 'pending',

        account_status TEXT DEFAULT 'active',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP

    );

`);


/* =========================================================
   STUDENT MIGRATIONS
========================================================= */

addColumn(
    "students",
    "date_of_birth",
    "TEXT"
);

addColumn(
    "students",
    "gender",
    "TEXT"
);

addColumn(
    "students",
    "address",
    "TEXT"
);

addColumn(
    "students",
    "profile_photo",
    "TEXT"
);

addColumn(
    "students",
    "student_number",
    "TEXT"
);

addColumn(
    "students",
    "last_login_at",
    "TEXT"
);

addColumn(
    "students",
    "updated_at",
    "TEXT"
);

addColumn(
    "students",
    "course_id",
    "INTEGER"
);


/* =========================================================
   CLASSROOM ACCESS CODES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS access_codes (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        code TEXT NOT NULL UNIQUE,

        course TEXT,

        level TEXT,

        payment_status TEXT DEFAULT 'paid',

        used INTEGER DEFAULT 0,

        student_id INTEGER,

        expires_at TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE SET NULL

    );

`);


addColumn(
    "access_codes",
    "used_by_student_id",
    "INTEGER"
);

addColumn(
    "access_codes",
    "used_at",
    "TEXT"
);

addColumn(
    "access_codes",
    "course_id",
    "INTEGER"
);

addColumn(
    "access_codes",
    "updated_at",
    "TEXT"
);


/* =========================================================
   COURSES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS courses (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL UNIQUE,

        description TEXT,

        level TEXT,

        status TEXT DEFAULT 'active',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP

    );

`);


addColumn(
    "courses",
    "fee",
    "INTEGER DEFAULT 200000"
);

addColumn(
    "courses",
    "duration_weeks",
    "INTEGER DEFAULT 8"
);

addColumn(
    "courses",
    "updated_at",
    "TEXT"
);


/* =========================================================
   TEACHERS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS teachers (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        full_name TEXT NOT NULL,

        email TEXT UNIQUE,

        phone TEXT,

        password_hash TEXT,

        profile_photo TEXT,

        specialization TEXT,

        status TEXT DEFAULT 'active',

        last_login_at TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT

    );

`);


addColumn(
    "teachers",
    "first_name",
    "TEXT"
);

addColumn(
    "teachers",
    "last_name",
    "TEXT"
);


/* =========================================================
   SPLIT TEACHER NAMES
========================================================= */

try {

    const teachers =
        db.prepare(`
            SELECT
                id,
                full_name,
                first_name,
                last_name
            FROM teachers
        `).all();


    const updateTeacher =
        db.prepare(`
            UPDATE teachers
            SET
                first_name = ?,
                last_name = ?
            WHERE id = ?
        `);


    for (
        const teacher of teachers
    ) {

        if (
            teacher.first_name &&
            teacher.last_name
        ) {

            continue;

        }


        const name =
            String(
                teacher.full_name || ""
            )
                .trim()
                .split(/\s+/);


        if (
            name.length === 0
        ) {

            continue;

        }


        const firstName =
            name.shift() || "";

        const lastName =
            name.join(" ") || "";


        updateTeacher.run(
            firstName,
            lastName,
            teacher.id
        );

    }

} catch (error) {

    console.warn(
        "Teacher name migration warning:",
        error.message
    );

}


/* =========================================================
   CLASSES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS classes (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        course_id INTEGER,

        level TEXT,

        description TEXT,

        room TEXT,

        schedule TEXT,

        start_date TEXT,

        end_date TEXT,

        max_students INTEGER DEFAULT 30,

        status TEXT DEFAULT 'active',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT,

        FOREIGN KEY (
            course_id
        )
        REFERENCES courses(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   TEACHER CLASSES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS teacher_classes (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        teacher_id INTEGER NOT NULL,

        class_id INTEGER NOT NULL,

        assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,

        is_primary INTEGER DEFAULT 0,

        UNIQUE (
            teacher_id,
            class_id
        ),

        FOREIGN KEY (
            teacher_id
        )
        REFERENCES teachers(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            class_id
        )
        REFERENCES classes(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   ENROLLMENTS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS enrollments (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER NOT NULL,

        class_id INTEGER NOT NULL,

        enrollment_date TEXT DEFAULT CURRENT_TIMESTAMP,

        status TEXT DEFAULT 'active',

        completion_date TEXT,

        notes TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (
            student_id,
            class_id
        ),

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            class_id
        )
        REFERENCES classes(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   MODULES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS modules (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        course_id INTEGER NOT NULL,

        title TEXT NOT NULL,

        description TEXT,

        module_order INTEGER DEFAULT 1,

        status TEXT DEFAULT 'published',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            course_id
        )
        REFERENCES courses(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   LESSONS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS lessons (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        module_id INTEGER NOT NULL,

        title TEXT NOT NULL,

        description TEXT,

        content TEXT,

        lesson_order INTEGER DEFAULT 1,

        duration INTEGER DEFAULT 0,

        xp_reward INTEGER DEFAULT 50,

        status TEXT DEFAULT 'published',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT,

        FOREIGN KEY (
            module_id
        )
        REFERENCES modules(id)
        ON DELETE CASCADE

    );

`);


addColumn(
    "lessons",
    "teacher_id",
    "INTEGER"
);

addColumn(
    "lessons",
    "duration_minutes",
    "INTEGER"
);


/* =========================================================
   LESSON MATERIALS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS lesson_materials (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        lesson_id INTEGER NOT NULL,

        title TEXT NOT NULL,

        type TEXT,

        url TEXT,

        description TEXT,

        file_name TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            lesson_id
        )
        REFERENCES lessons(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   EXERCISES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS exercises (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        lesson_id INTEGER NOT NULL,

        question TEXT NOT NULL,

        exercise_type TEXT DEFAULT 'multiple_choice',

        options TEXT,

        correct_answer TEXT,

        explanation TEXT,

        exercise_order INTEGER DEFAULT 1,

        xp_reward INTEGER DEFAULT 10,

        status TEXT DEFAULT 'active',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            lesson_id
        )
        REFERENCES lessons(id)
        ON DELETE CASCADE

    );

`);


addColumn(
    "exercises",
    "type",
    "TEXT"
);


/* =========================================================
   STUDENT PROGRESS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS student_progress (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER NOT NULL,

        lesson_id INTEGER NOT NULL,

        status TEXT DEFAULT 'not_started',

        progress REAL DEFAULT 0,

        score REAL DEFAULT 0,

        completed_at TEXT,

        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (
            student_id,
            lesson_id
        ),

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            lesson_id
        )
        REFERENCES lessons(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   ATTENDANCE
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS attendance (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER NOT NULL,

        course_id INTEGER,

        class_id INTEGER,

        attendance_date TEXT NOT NULL,

        status TEXT DEFAULT 'present',

        notes TEXT,

        marked_by_teacher_id INTEGER,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (
            student_id,
            class_id,
            attendance_date
        ),

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            course_id
        )
        REFERENCES courses(id)
        ON DELETE SET NULL,

        FOREIGN KEY (
            class_id
        )
        REFERENCES classes(id)
        ON DELETE SET NULL,

        FOREIGN KEY (
            marked_by_teacher_id
        )
        REFERENCES teachers(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   ATTENDANCE CODES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS attendance_codes (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        code TEXT NOT NULL UNIQUE,

        course_id INTEGER,

        class_id INTEGER,

        level TEXT,

        attendance_date TEXT,

        expires_at TEXT,

        status TEXT DEFAULT 'active',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            course_id
        )
        REFERENCES courses(id)
        ON DELETE SET NULL,

        FOREIGN KEY (
            class_id
        )
        REFERENCES classes(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   GAMES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS games (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        title TEXT NOT NULL,

        description TEXT,

        level TEXT,

        game_type TEXT,

        xp_reward INTEGER DEFAULT 0,

        status TEXT DEFAULT 'active',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP

    );

`);


/* =========================================================
   GAME SCORES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS game_scores (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        game_id INTEGER NOT NULL,

        student_id INTEGER NOT NULL,

        score INTEGER DEFAULT 0,

        xp_earned INTEGER DEFAULT 0,

        played_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            game_id
        )
        REFERENCES games(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   STUDENT XP
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS student_xp (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER NOT NULL UNIQUE,

        total_xp INTEGER DEFAULT 0,

        weekly_xp INTEGER DEFAULT 0,

        current_streak INTEGER DEFAULT 0,

        longest_streak INTEGER DEFAULT 0,

        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   ACHIEVEMENTS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS achievements (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL UNIQUE,

        description TEXT,

        icon TEXT,

        xp_reward INTEGER DEFAULT 0,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP

    );

`);


/* =========================================================
   STUDENT ACHIEVEMENTS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS student_achievements (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER NOT NULL,

        achievement_id INTEGER NOT NULL,

        earned_at TEXT DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (
            student_id,
            achievement_id
        ),

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            achievement_id
        )
        REFERENCES achievements(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   ANNOUNCEMENTS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS announcements (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        title TEXT NOT NULL,

        message TEXT NOT NULL,

        level TEXT,

        class_id INTEGER,

        teacher_id INTEGER,

        status TEXT DEFAULT 'published',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            class_id
        )
        REFERENCES classes(id)
        ON DELETE SET NULL,

        FOREIGN KEY (
            teacher_id
        )
        REFERENCES teachers(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   TESTS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS tests (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        title TEXT NOT NULL,

        description TEXT,

        test_type TEXT DEFAULT 'weekly',

        course_id INTEGER,

        class_id INTEGER,

        teacher_id INTEGER,

        total_points REAL DEFAULT 100,

        test_date TEXT,

        due_date TEXT,

        status TEXT DEFAULT 'published',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT,

        FOREIGN KEY (
            course_id
        )
        REFERENCES courses(id)
        ON DELETE SET NULL,

        FOREIGN KEY (
            class_id
        )
        REFERENCES classes(id)
        ON DELETE SET NULL,

        FOREIGN KEY (
            teacher_id
        )
        REFERENCES teachers(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   TEST FILES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS test_files (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        test_id INTEGER NOT NULL,

        student_id INTEGER,

        title TEXT,

        file_name TEXT,

        file_path TEXT,

        file_type TEXT,

        file_size INTEGER,

        description TEXT,

        uploaded_by_teacher_id INTEGER,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            test_id
        )
        REFERENCES tests(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            uploaded_by_teacher_id
        )
        REFERENCES teachers(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   TEST RESULTS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS test_results (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        test_id INTEGER NOT NULL,

        student_id INTEGER NOT NULL,

        score REAL DEFAULT 0,

        total_points REAL DEFAULT 100,

        percentage REAL DEFAULT 0,

        rank INTEGER,

        teacher_comment TEXT,

        status TEXT DEFAULT 'graded',

        graded_by_teacher_id INTEGER,

        graded_at TEXT,

        updated_at TEXT,

        UNIQUE (
            test_id,
            student_id
        ),

        FOREIGN KEY (
            test_id
        )
        REFERENCES tests(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            graded_by_teacher_id
        )
        REFERENCES teachers(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   STUDENT REPORT FILES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS student_report_files (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER NOT NULL,

        test_id INTEGER,

        title TEXT,

        file_name TEXT,

        file_path TEXT,

        file_type TEXT,

        file_size INTEGER,

        description TEXT,

        uploaded_by_teacher_id INTEGER,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            test_id
        )
        REFERENCES tests(id)
        ON DELETE SET NULL,

        FOREIGN KEY (
            uploaded_by_teacher_id
        )
        REFERENCES teachers(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   PAYMENTS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS payments (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER NOT NULL,

        course_id INTEGER,

        class_id INTEGER,

        total_fee REAL DEFAULT 0,

        amount_paid REAL DEFAULT 0,

        amount_remaining REAL DEFAULT 0,

        currency TEXT DEFAULT 'RWF',

        status TEXT DEFAULT 'pending',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT,

        UNIQUE (
            student_id,
            course_id,
            class_id
        ),

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            course_id
        )
        REFERENCES courses(id)
        ON DELETE SET NULL,

        FOREIGN KEY (
            class_id
        )
        REFERENCES classes(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   PAYMENT MIGRATION
========================================================= */

addColumn(
    "payments",
    "remaining_amount",
    "REAL DEFAULT 0"
);


/* =========================================================
   PAYMENT TRANSACTIONS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS payment_transactions (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        payment_id INTEGER NOT NULL,

        student_id INTEGER NOT NULL,

        amount REAL NOT NULL,

        currency TEXT DEFAULT 'RWF',

        provider TEXT,

        payment_method TEXT,

        transaction_reference TEXT UNIQUE,

        provider_reference TEXT,

        status TEXT DEFAULT 'pending',

        phone_number TEXT,

        metadata TEXT,

        paid_at TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            payment_id
        )
        REFERENCES payments(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   PAYMENT RECEIPTS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS payment_receipts (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        payment_transaction_id INTEGER NOT NULL,

        receipt_number TEXT NOT NULL UNIQUE,

        receipt_file TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            payment_transaction_id
        )
        REFERENCES payment_transactions(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   NOTIFICATIONS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS notifications (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER,

        teacher_id INTEGER,

        title TEXT NOT NULL,

        message TEXT NOT NULL,

        type TEXT DEFAULT 'general',

        is_read INTEGER DEFAULT 0,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            student_id
        )
        REFERENCES students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            teacher_id
        )
        REFERENCES teachers(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   ADMIN ACTIVITY LOGS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS admin_activity_logs (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        admin_name TEXT,

        admin_email TEXT,

        action TEXT,

        entity_type TEXT,

        entity_id INTEGER,

        description TEXT,

        ip_address TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP

    );

`);


addColumn(
    "admin_activity_logs",
    "details",
    "TEXT"
);


/* =========================================================
   SYNC ACTIVITY LOG DETAILS
========================================================= */

try {

    db.prepare(`
        UPDATE admin_activity_logs
        SET details = description
        WHERE
            (
                details IS NULL
                OR details = ''
            )
            AND description IS NOT NULL
    `).run();

} catch (error) {

    console.warn(
        "Could not sync activity log details:",
        error.message
    );

}


/* =========================================================
   SYSTEM SETTINGS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS system_settings (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        setting_key TEXT NOT NULL UNIQUE,

        setting_value TEXT,

        description TEXT,

        updated_at TEXT DEFAULT CURRENT_TIMESTAMP

    );

`);


/* =========================================================
   DATABASE MIGRATIONS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS database_migrations (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        migration_name TEXT NOT NULL UNIQUE,

        applied_at TEXT DEFAULT CURRENT_TIMESTAMP

    );

`);


/* =========================================================
   ONLINE LEARNING SYSTEM
========================================================= */

/*
   IMPORTANT:

   The Online Learning system is intentionally separated
   from the classroom system.

   Online students use:

   online_students
   online_access_codes
   online_enrollments

   Online administrators use:

   online_admins
*/


/* =========================================================
   ONLINE ADMINS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS online_admins (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        name TEXT NOT NULL,

        email TEXT NOT NULL UNIQUE,

        password_hash TEXT NOT NULL,

        account_status TEXT DEFAULT 'active',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        last_login_at TEXT,

        updated_at TEXT

    );

`);


/* =========================================================
   ONLINE STUDENTS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS online_students (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        first_name TEXT NOT NULL,

        last_name TEXT,

        email TEXT NOT NULL UNIQUE,

        password_hash TEXT NOT NULL,

        phone TEXT,

        profile_photo TEXT,

        account_status TEXT DEFAULT 'active',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        last_login_at TEXT,

        updated_at TEXT

    );

`);


/* =========================================================
   ONLINE STUDENT MIGRATIONS
========================================================= */

addColumn(
    "online_students",
    "online_access_code_id",
    "INTEGER"
);


/* =========================================================
   ONLINE COURSES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS online_courses (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        title TEXT NOT NULL,

        description TEXT,

        level TEXT,

        thumbnail TEXT,

        status TEXT DEFAULT 'draft',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT

    );

`);


/* =========================================================
   ONLINE MODULES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS online_modules (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        course_id INTEGER NOT NULL,

        title TEXT NOT NULL,

        description TEXT,

        module_order INTEGER DEFAULT 1,

        status TEXT DEFAULT 'published',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT,

        FOREIGN KEY (
            course_id
        )
        REFERENCES online_courses(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   ONLINE LESSONS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS online_lessons (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        module_id INTEGER NOT NULL,

        title TEXT NOT NULL,

        description TEXT,

        content TEXT,

        video_url TEXT,

        pdf_url TEXT,

        duration_minutes INTEGER DEFAULT 0,

        lesson_order INTEGER DEFAULT 1,

        status TEXT DEFAULT 'published',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT,

        FOREIGN KEY (
            module_id
        )
        REFERENCES online_modules(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   ONLINE LESSON MATERIALS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS online_lesson_materials (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        lesson_id INTEGER NOT NULL,

        title TEXT NOT NULL,

        type TEXT,

        url TEXT,

        file_name TEXT,

        description TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            lesson_id
        )
        REFERENCES online_lessons(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   ONLINE ENROLLMENTS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS online_enrollments (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER NOT NULL,

        course_id INTEGER NOT NULL,

        enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,

        status TEXT DEFAULT 'active',

        completed_at TEXT,

        UNIQUE (
            student_id,
            course_id
        ),

        FOREIGN KEY (
            student_id
        )
        REFERENCES online_students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            course_id
        )
        REFERENCES online_courses(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   ONLINE PROGRESS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS online_progress (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER NOT NULL,

        lesson_id INTEGER NOT NULL,

        video_seconds INTEGER DEFAULT 0,

        progress REAL DEFAULT 0,

        completed INTEGER DEFAULT 0,

        last_position INTEGER DEFAULT 0,

        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (
            student_id,
            lesson_id
        ),

        FOREIGN KEY (
            student_id
        )
        REFERENCES online_students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            lesson_id
        )
        REFERENCES online_lessons(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   ONLINE LEARNING SESSIONS
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS online_learning_sessions (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER NOT NULL,

        lesson_id INTEGER,

        started_at TEXT DEFAULT CURRENT_TIMESTAMP,

        last_activity TEXT DEFAULT CURRENT_TIMESTAMP,

        ended_at TEXT,

        duration_seconds INTEGER DEFAULT 0,

        FOREIGN KEY (
            student_id
        )
        REFERENCES online_students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            lesson_id
        )
        REFERENCES online_lessons(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   ONLINE REGISTRATION ACCESS CODES
========================================================= */

/*
   These codes are ONLY for creating Online Learning
   student accounts.

   They are different from:

   access_codes
   attendance_codes
   online_participation_codes

   Online Admins will create and manage these codes.
*/

db.exec(`

    CREATE TABLE IF NOT EXISTS online_access_codes (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        code TEXT NOT NULL UNIQUE,

        course_id INTEGER,

        status TEXT DEFAULT 'active',

        max_uses INTEGER DEFAULT 1,

        used_count INTEGER DEFAULT 0,

        expires_at TEXT,

        created_by_admin_id INTEGER,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT,

        FOREIGN KEY (
            course_id
        )
        REFERENCES online_courses(id)
        ON DELETE SET NULL,

        FOREIGN KEY (
            created_by_admin_id
        )
        REFERENCES online_admins(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   ONLINE ACCESS CODE USAGE
========================================================= */

/*
   Every successful online registration is recorded here.

   This gives us:

   - which access code was used
   - which student used it
   - when it was used

   UNIQUE(access_code_id, student_id)
   prevents the same student from using the same
   access code more than once.
*/

db.exec(`

    CREATE TABLE IF NOT EXISTS online_access_code_uses (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        access_code_id INTEGER NOT NULL,

        student_id INTEGER NOT NULL,

        used_at TEXT DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (
            access_code_id,
            student_id
        ),

        FOREIGN KEY (
            access_code_id
        )
        REFERENCES online_access_codes(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            student_id
        )
        REFERENCES online_students(id)
        ON DELETE CASCADE

    );

`);


/* =========================================================
   ONLINE PARTICIPATION CODES
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS online_participation_codes (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        code TEXT NOT NULL UNIQUE,

        course_id INTEGER,

        expires_at TEXT,

        status TEXT DEFAULT 'active',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (
            course_id
        )
        REFERENCES online_courses(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   ONLINE PARTICIPATION
========================================================= */

db.exec(`

    CREATE TABLE IF NOT EXISTS online_participation (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        student_id INTEGER NOT NULL,

        code_id INTEGER NOT NULL,

        course_id INTEGER,

        submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (
            student_id,
            code_id
        ),

        FOREIGN KEY (
            student_id
        )
        REFERENCES online_students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            code_id
        )
        REFERENCES online_participation_codes(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            course_id
        )
        REFERENCES online_courses(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   ONLINE WRITING TASKS
========================================================= */

/*
   Writing tasks are created by Online Admins.

   A task can contain optional links to:

   - Instagram
   - TikTok
   - YouTube

   Students can open the external content,
   return to the LDC website, and submit their
   written answer directly through the platform.
*/

db.exec(`

    CREATE TABLE IF NOT EXISTS online_writing_tasks (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        title TEXT NOT NULL,

        instructions TEXT NOT NULL,

        level TEXT,

        course_id INTEGER,

        instagram_url TEXT,

        tiktok_url TEXT,

        youtube_url TEXT,

        deadline TEXT,

        status TEXT DEFAULT 'draft',

        created_by_admin_id INTEGER,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        updated_at TEXT,

        FOREIGN KEY (
            course_id
        )
        REFERENCES online_courses(id)
        ON DELETE SET NULL,

        FOREIGN KEY (
            created_by_admin_id
        )
        REFERENCES online_admins(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   ONLINE WRITING SUBMISSIONS
========================================================= */

/*
   Each student can submit one writing answer
   per task.

   The student can write directly on the LDC website.

   Online Admins can:

   - read the complete answer
   - see word count
   - see submission date
   - mark it reviewed
   - give feedback
   - optionally give a score
*/

db.exec(`

    CREATE TABLE IF NOT EXISTS online_writing_submissions (

        id INTEGER PRIMARY KEY AUTOINCREMENT,

        task_id INTEGER NOT NULL,

        student_id INTEGER NOT NULL,

        answer TEXT NOT NULL,

        word_count INTEGER DEFAULT 0,

        submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,

        status TEXT DEFAULT 'submitted',

        score REAL,

        feedback TEXT,

        reviewed_by_admin_id INTEGER,

        reviewed_at TEXT,

        updated_at TEXT,

        UNIQUE (
            task_id,
            student_id
        ),

        FOREIGN KEY (
            task_id
        )
        REFERENCES online_writing_tasks(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            student_id
        )
        REFERENCES online_students(id)
        ON DELETE CASCADE,

        FOREIGN KEY (
            reviewed_by_admin_id
        )
        REFERENCES online_admins(id)
        ON DELETE SET NULL

    );

`);


/* =========================================================
   ONLINE INDEXES
========================================================= */

createIndex(
    "idx_online_students_email",
    "online_students",
    "email"
);

createIndex(
    "idx_online_students_status",
    "online_students",
    "account_status"
);

createIndex(
    "idx_online_students_access_code",
    "online_students",
    "online_access_code_id"
);


createIndex(
    "idx_online_courses_status",
    "online_courses",
    "status"
);

createIndex(
    "idx_online_courses_level",
    "online_courses",
    "level"
);


createIndex(
    "idx_online_modules_course",
    "online_modules",
    "course_id"
);

createIndex(
    "idx_online_lessons_module",
    "online_lessons",
    "module_id"
);


createIndex(
    "idx_online_enrollments_student",
    "online_enrollments",
    "student_id"
);

createIndex(
    "idx_online_enrollments_course",
    "online_enrollments",
    "course_id"
);


createIndex(
    "idx_online_progress_student",
    "online_progress",
    "student_id"
);

createIndex(
    "idx_online_progress_lesson",
    "online_progress",
    "lesson_id"
);


createIndex(
    "idx_online_sessions_student",
    "online_learning_sessions",
    "student_id"
);

createIndex(
    "idx_online_sessions_lesson",
    "online_learning_sessions",
    "lesson_id"
);

createIndex(
    "idx_online_sessions_activity",
    "online_learning_sessions",
    "last_activity"
);


/* =========================================================
   ONLINE ACCESS CODE INDEXES
========================================================= */

createIndex(
    "idx_online_access_codes_code",
    "online_access_codes",
    "code"
);

createIndex(
    "idx_online_access_codes_status",
    "online_access_codes",
    "status"
);

createIndex(
    "idx_online_access_codes_course",
    "online_access_codes",
    "course_id"
);

createIndex(
    "idx_online_access_codes_expires",
    "online_access_codes",
    "expires_at"
);

createIndex(
    "idx_online_access_codes_admin",
    "online_access_codes",
    "created_by_admin_id"
);


createIndex(
    "idx_online_access_code_uses_code",
    "online_access_code_uses",
    "access_code_id"
);

createIndex(
    "idx_online_access_code_uses_student",
    "online_access_code_uses",
    "student_id"
);

createIndex(
    "idx_online_access_code_uses_date",
    "online_access_code_uses",
    "used_at"
);


createIndex(
    "idx_online_participation_codes_course",
    "online_participation_codes",
    "course_id"
);

createIndex(
    "idx_online_participation_codes_status",
    "online_participation_codes",
    "status"
);


createIndex(
    "idx_online_participation_student",
    "online_participation",
    "student_id"
);

createIndex(
    "idx_online_participation_course",
    "online_participation",
    "course_id"
);


/* =========================================================
   ONLINE WRITING INDEXES
========================================================= */

createIndex(
    "idx_online_writing_tasks_status",
    "online_writing_tasks",
    "status"
);

createIndex(
    "idx_online_writing_tasks_level",
    "online_writing_tasks",
    "level"
);

createIndex(
    "idx_online_writing_tasks_course",
    "online_writing_tasks",
    "course_id"
);

createIndex(
    "idx_online_writing_tasks_deadline",
    "online_writing_tasks",
    "deadline"
);

createIndex(
    "idx_online_writing_tasks_admin",
    "online_writing_tasks",
    "created_by_admin_id"
);


createIndex(
    "idx_online_writing_submissions_task",
    "online_writing_submissions",
    "task_id"
);

createIndex(
    "idx_online_writing_submissions_student",
    "online_writing_submissions",
    "student_id"
);

createIndex(
    "idx_online_writing_submissions_status",
    "online_writing_submissions",
    "status"
);

createIndex(
    "idx_online_writing_submissions_date",
    "online_writing_submissions",
    "submitted_at"
);


/* =========================================================
   CLASSROOM INDEXES
========================================================= */

createIndex(
    "idx_students_email",
    "students",
    "email"
);

createIndex(
    "idx_students_course_id",
    "students",
    "course_id"
);

createIndex(
    "idx_students_level",
    "students",
    "level"
);

createIndex(
    "idx_students_account_status",
    "students",
    "account_status"
);


createIndex(
    "idx_access_codes_code",
    "access_codes",
    "code"
);

createIndex(
    "idx_access_codes_used",
    "access_codes",
    "used"
);

createIndex(
    "idx_access_codes_course_id",
    "access_codes",
    "course_id"
);


createIndex(
    "idx_courses_level",
    "courses",
    "level"
);

createIndex(
    "idx_courses_status",
    "courses",
    "status"
);


createIndex(
    "idx_teachers_status",
    "teachers",
    "status"
);


createIndex(
    "idx_classes_course_id",
    "classes",
    "course_id"
);

createIndex(
    "idx_classes_status",
    "classes",
    "status"
);


createIndex(
    "idx_teacher_classes_teacher",
    "teacher_classes",
    "teacher_id"
);

createIndex(
    "idx_teacher_classes_class",
    "teacher_classes",
    "class_id"
);


createIndex(
    "idx_enrollments_student",
    "enrollments",
    "student_id"
);

createIndex(
    "idx_enrollments_class",
    "enrollments",
    "class_id"
);


createIndex(
    "idx_modules_course",
    "modules",
    "course_id"
);

createIndex(
    "idx_lessons_module",
    "lessons",
    "module_id"
);

createIndex(
    "idx_lesson_materials_lesson",
    "lesson_materials",
    "lesson_id"
);

createIndex(
    "idx_exercises_lesson",
    "exercises",
    "lesson_id"
);


createIndex(
    "idx_student_progress_student",
    "student_progress",
    "student_id"
);

createIndex(
    "idx_student_progress_lesson",
    "student_progress",
    "lesson_id"
);


createIndex(
    "idx_attendance_student",
    "attendance",
    "student_id"
);

createIndex(
    "idx_attendance_class",
    "attendance",
    "class_id"
);

createIndex(
    "idx_attendance_date",
    "attendance",
    "attendance_date"
);


createIndex(
    "idx_attendance_codes_class",
    "attendance_codes",
    "class_id"
);


createIndex(
    "idx_game_scores_student",
    "game_scores",
    "student_id"
);

createIndex(
    "idx_student_xp_student",
    "student_xp",
    "student_id"
);

createIndex(
    "idx_student_achievements_student",
    "student_achievements",
    "student_id"
);


createIndex(
    "idx_announcements_class",
    "announcements",
    "class_id"
);

createIndex(
    "idx_announcements_teacher",
    "announcements",
    "teacher_id"
);


createIndex(
    "idx_tests_course",
    "tests",
    "course_id"
);

createIndex(
    "idx_tests_class",
    "tests",
    "class_id"
);

createIndex(
    "idx_tests_teacher",
    "tests",
    "teacher_id"
);


createIndex(
    "idx_test_results_test",
    "test_results",
    "test_id"
);

createIndex(
    "idx_test_results_student",
    "test_results",
    "student_id"
);


createIndex(
    "idx_payments_student",
    "payments",
    "student_id"
);

createIndex(
    "idx_payment_transactions_student",
    "payment_transactions",
    "student_id"
);


createIndex(
    "idx_notifications_student",
    "notifications",
    "student_id"
);

createIndex(
    "idx_notifications_teacher",
    "notifications",
    "teacher_id"
);


createIndex(
    "idx_admin_activity_created",
    "admin_activity_logs",
    "created_at"
);


/* =========================================================
   DEFAULT CLASSROOM COURSES
========================================================= */

const courseCount =
    db.prepare(`
        SELECT COUNT(*) AS count
        FROM courses
    `).get().count;


if (
    Number(courseCount) === 0
) {

    const insertCourse =
        db.prepare(`
            INSERT INTO courses (
                name,
                description,
                level,
                fee,
                duration_weeks,
                status
            )
            VALUES (?, ?, ?, ?, ?, 'active')
        `);


    insertCourse.run(
        "German A1",
        "German language course for beginners.",
        "A1",
        200000,
        8
    );


    insertCourse.run(
        "German A2",
        "Elementary German language course.",
        "A2",
        200000,
        8
    );


    insertCourse.run(
        "German B1",
        "Intermediate German language course.",
        "B1",
        200000,
        10
    );


    insertCourse.run(
        "German B2",
        "Upper-intermediate German language course.",
        "B2",
        200000,
        10
    );


    console.log(
        "Default classroom courses created."
    );

}


/* =========================================================
   SYNC CLASSROOM STUDENT COURSE IDS
========================================================= */

try {

    db.prepare(`
        UPDATE students
        SET course_id = (
            SELECT c.id
            FROM courses c
            WHERE
                LOWER(TRIM(c.name)) =
                LOWER(TRIM(students.course))
            LIMIT 1
        )
        WHERE
            course_id IS NULL
            AND course IS NOT NULL
            AND TRIM(course) <> ''
    `).run();

} catch (error) {

    console.warn(
        "Could not sync student course IDs:",
        error.message
    );

}


/* =========================================================
   SYNC ACCESS CODE COURSE IDS
========================================================= */

try {

    db.prepare(`
        UPDATE access_codes
        SET course_id = (
            SELECT c.id
            FROM courses c
            WHERE
                LOWER(TRIM(c.name)) =
                LOWER(TRIM(access_codes.course))
            LIMIT 1
        )
        WHERE
            course_id IS NULL
            AND course IS NOT NULL
            AND TRIM(course) <> ''
    `).run();

} catch (error) {

    console.warn(
        "Could not sync access code course IDs:",
        error.message
    );

}


/* =========================================================
   DEFAULT A1 MODULE
========================================================= */

const a1Course =
    db.prepare(`
        SELECT
            id,
            name,
            level
        FROM courses
        WHERE
            UPPER(level) = 'A1'
        ORDER BY id
        LIMIT 1
    `).get();


if (
    a1Course
) {

    const moduleCount =
        db.prepare(`
            SELECT COUNT(*) AS count
            FROM modules
            WHERE course_id = ?
        `).get(
            a1Course.id
        ).count;


    if (
        Number(moduleCount) === 0
    ) {

        const moduleResult =
            db.prepare(`
                INSERT INTO modules (
                    course_id,
                    title,
                    description,
                    module_order,
                    status
                )
                VALUES (?, ?, ?, ?, 'published')
            `).run(
                a1Course.id,
                "Begrüßung",
                "Grundlagen der Begrüßung und Vorstellung.",
                1
            );


        const moduleId =
            Number(
                moduleResult.lastInsertRowid
            );


        /* =====================================================
           DEFAULT A1 LESSON
        ===================================================== */

        const lessonResult =
            db.prepare(`
                INSERT INTO lessons (
                    module_id,
                    title,
                    description,
                    content,
                    lesson_order,
                    duration,
                    xp_reward,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'published')
            `).run(
                moduleId,
                "Hallo!",
                "Grundlegende Begrüßungen auf Deutsch.",
                `
                    <h2>Hallo!</h2>

                    <p>
                        In dieser Lektion lernst du
                        wichtige deutsche Begrüßungen.
                    </p>

                    <ul>
                        <li>Hallo!</li>
                        <li>Guten Morgen!</li>
                        <li>Guten Tag!</li>
                        <li>Guten Abend!</li>
                        <li>Gute Nacht!</li>
                        <li>Tschüss!</li>
                    </ul>
                `,
                1,
                15,
                50
            );


        const lessonId =
            Number(
                lessonResult.lastInsertRowid
            );


        /* =====================================================
           DEFAULT EXERCISES
        ===================================================== */

        const insertExercise =
            db.prepare(`
                INSERT INTO exercises (
                    lesson_id,
                    question,
                    exercise_type,
                    options,
                    correct_answer,
                    explanation,
                    exercise_order,
                    xp_reward,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
            `);


        insertExercise.run(
            lessonId,
            "Wie begrüßt man jemanden am Morgen?",
            "multiple_choice",
            JSON.stringify([
                "Guten Morgen!",
                "Gute Nacht!",
                "Tschüss!",
                "Auf Wiedersehen!"
            ]),
            "Guten Morgen!",
            "„Guten Morgen!“ benutzt man am Morgen.",
            1,
            10
        );


        insertExercise.run(
            lessonId,
            "Was sagt man normalerweise beim Abschied?",
            "multiple_choice",
            JSON.stringify([
                "Tschüss!",
                "Guten Morgen!",
                "Hallo!",
                "Guten Tag!"
            ]),
            "Tschüss!",
            "„Tschüss!“ ist eine häufige informelle Verabschiedung.",
            2,
            10
        );


        console.log(
            "Default A1 module, lesson and exercises created."
        );

    }

}


/* =========================================================
   DEFAULT ACHIEVEMENTS
========================================================= */

const achievementCount =
    db.prepare(`
        SELECT COUNT(*) AS count
        FROM achievements
    `).get().count;


if (
    Number(achievementCount) === 0
) {

    const insertAchievement =
        db.prepare(`
            INSERT INTO achievements (
                name,
                description,
                icon,
                xp_reward
            )
            VALUES (?, ?, ?, ?)
        `);


    insertAchievement.run(
        "First Lesson",
        "Complete your first lesson.",
        "🎯",
        25
    );


    insertAchievement.run(
        "Vocabulary Starter",
        "Start building your German vocabulary.",
        "📚",
        50
    );


    insertAchievement.run(
        "7 Day Streak",
        "Learn for seven consecutive days.",
        "🔥",
        100
    );


    console.log(
        "Default achievements created."
    );

}


/* =========================================================
   DEFAULT GAMES
========================================================= */

const gameCount =
    db.prepare(`
        SELECT COUNT(*) AS count
        FROM games
    `).get().count;


if (
    Number(gameCount) === 0
) {

    const insertGame =
        db.prepare(`
            INSERT INTO games (
                title,
                description,
                level,
                game_type,
                xp_reward,
                status
            )
            VALUES (?, ?, ?, ?, ?, 'active')
        `);


    insertGame.run(
        "German Word Challenge",
        "Practice German vocabulary.",
        "A1",
        "vocabulary",
        25
    );


    insertGame.run(
        "Article Challenge",
        "Practice German articles.",
        "A1",
        "articles",
        25
    );


    console.log(
        "Default classroom games created."
    );

}


/* =========================================================
   DEFAULT SYSTEM SETTINGS
========================================================= */

const defaultSettings = [

    [
        "school_name",
        "LINGUA DEUTSCH CONNECT",
        "School name."
    ],

    [
        "school_timezone",
        "Africa/Kigali",
        "Default school timezone."
    ],

    [
        "default_course_fee",
        "200000",
        "Default classroom course fee in RWF."
    ],

    [
        "currency",
        "RWF",
        "Default currency."
    ],

    [
        "attendance_code_expiry_minutes",
        "15",
        "Default attendance-code expiry time."
    ],

    [
        "default_max_students",
        "30",
        "Default maximum students per classroom."
    ],

    [
        "online_learning_enabled",
        "1",
        "Enable the Online Learning platform."
    ],

    [
        "online_access_code_default_uses",
        "1",
        "Default number of registrations allowed per online access code."
    ],

    [
        "online_access_code_expiry_days",
        "30",
        "Default number of days before an online registration access code expires."
    ]

];


const insertSetting =
    db.prepare(`
        INSERT OR IGNORE INTO system_settings (
            setting_key,
            setting_value,
            description
        )
        VALUES (?, ?, ?)
    `);


for (
    const setting of defaultSettings
) {

    insertSetting.run(
        setting[0],
        setting[1],
        setting[2]
    );

}


/* =========================================================
   DATABASE MIGRATION RECORDS
========================================================= */

function recordMigration(
    migrationName
) {

    db.prepare(`
        INSERT OR IGNORE INTO database_migrations (
            migration_name
        )
        VALUES (?)
    `).run(
        migrationName
    );

}


/* =========================================================
   CLASSROOM PLATFORM MIGRATION
========================================================= */

recordMigration(
    "2026-ldc-complete-platform-schema"
);


/* =========================================================
   ONLINE PLATFORM MIGRATION
========================================================= */

recordMigration(
    "2026-ldc-online-learning-foundation"
);


/* =========================================================
   ONLINE ACCESS CODE MIGRATION
========================================================= */

recordMigration(
    "2026-ldc-online-registration-access-codes"
);


/* =========================================================
   ONLINE WRITING SYSTEM MIGRATION
========================================================= */

recordMigration(
    "2026-ldc-online-writing-system"
);


/* =========================================================
   FINAL CLASSROOM TABLE VALIDATION
========================================================= */

const requiredClassroomTables = [

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
    "student_xp",
    "achievements",
    "student_achievements",
    "announcements",
    "tests",
    "test_files",
    "test_results",
    "student_report_files",
    "payments",
    "payment_transactions",
    "payment_receipts",
    "notifications",
    "admin_activity_logs",
    "system_settings",
    "database_migrations"

];


const missingClassroomTables =
    requiredClassroomTables.filter(
        table =>
            !tableExists(table)
    );


if (
    missingClassroomTables.length > 0
) {

    console.warn(
        "Missing classroom tables:",
        missingClassroomTables
    );

}


/* =========================================================
   FINAL ONLINE TABLE VALIDATION
========================================================= */

const requiredOnlineTables = [

    "online_admins",
    "online_students",
    "online_courses",
    "online_modules",
    "online_lessons",
    "online_lesson_materials",
    "online_enrollments",
    "online_progress",
    "online_learning_sessions",
    "online_access_codes",
    "online_access_code_uses",
    "online_participation_codes",
    "online_participation",
    "online_writing_tasks",
    "online_writing_submissions"

];


const missingOnlineTables =
    requiredOnlineTables.filter(
        table =>
            !tableExists(table)
    );


if (
    missingOnlineTables.length > 0
) {

    console.warn(
        "Missing online learning tables:",
        missingOnlineTables
    );

}


/* =========================================================
   ONLINE ACCESS CODE VALIDATION
========================================================= */

try {

    const invalidAccessCodeRows =
        db.prepare(`
            SELECT
                id,
                code,
                max_uses,
                used_count
            FROM online_access_codes
            WHERE
                max_uses < 1
                OR used_count < 0
        `).all();


    if (
        invalidAccessCodeRows.length > 0
    ) {

        console.warn(
            "Online access codes with invalid usage values:",
            invalidAccessCodeRows.length
        );

    }

} catch (error) {

    console.warn(
        "Could not validate online access codes:",
        error.message
    );

}


/* =========================================================
   ONLINE ACCESS CODE CONSISTENCY
========================================================= */

/*
   Make sure used_count never exceeds max_uses.

   We do not automatically modify existing records here,
   because changing historical usage data could hide a
   previous database problem.
*/

try {

    const inconsistentCodes =
        db.prepare(`
            SELECT
                id,
                code,
                max_uses,
                used_count
            FROM online_access_codes
            WHERE
                max_uses > 0
                AND used_count > max_uses
        `).all();


    if (
        inconsistentCodes.length > 0
    ) {

        console.warn(
            "Online access codes exceeding maximum uses:",
            inconsistentCodes.length
        );

    }

} catch (error) {

    console.warn(
        "Could not check online access-code consistency:",
        error.message
    );

}


/* =========================================================
   ONLINE WRITING VALIDATION
========================================================= */

try {

    const invalidWritingTasks =
        db.prepare(`
            SELECT
                id,
                title,
                status
            FROM online_writing_tasks
            WHERE
                title IS NULL
                OR TRIM(title) = ''
                OR instructions IS NULL
                OR TRIM(instructions) = ''
        `).all();


    if (
        invalidWritingTasks.length > 0
    ) {

        console.warn(
            "Online writing tasks with missing required information:",
            invalidWritingTasks.length
        );

    }

} catch (error) {

    console.warn(
        "Could not validate online writing tasks:",
        error.message
    );

}


try {

    const invalidWritingSubmissions =
        db.prepare(`
            SELECT
                id,
                task_id,
                student_id,
                word_count
            FROM online_writing_submissions
            WHERE
                word_count < 0
        `).all();


    if (
        invalidWritingSubmissions.length > 0
    ) {

        console.warn(
            "Online writing submissions with invalid word counts:",
            invalidWritingSubmissions.length
        );

    }

} catch (error) {

    console.warn(
        "Could not validate online writing submissions:",
        error.message
    );

}


/* =========================================================
   DATABASE SUMMARY
========================================================= */

console.log(`

========================================
LINGUA DEUTSCH CONNECT DATABASE
========================================

Database:
${databasePath}

Classroom platform:
✓ Students
✓ Access codes
✓ Courses
✓ Teachers
✓ Classes
✓ Teacher assignments
✓ Enrollments
✓ Modules
✓ Lessons
✓ Materials
✓ Exercises
✓ Progress
✓ Attendance
✓ Attendance codes
✓ Tests
✓ Test files
✓ Test results
✓ Report files
✓ Payments
✓ Payment transactions
✓ Payment receipts
✓ Games
✓ XP
✓ Achievements
✓ Announcements
✓ Notifications
✓ Admin activity
✓ System settings
✓ Database migrations

Online Learning platform:
✓ Online admins
✓ Online students
✓ Online courses
✓ Online modules
✓ Online lessons
✓ Online lesson materials
✓ Online enrollments
✓ Online progress
✓ Learning sessions
✓ Online registration access codes
✓ Online access-code usage records
✓ Online participation codes
✓ Online participation records
✓ Online writing tasks
✓ Online writing submissions
✓ Writing word counts
✓ Writing scores
✓ Writing feedback
✓ Writing review tracking

Online registration flow:
✓ Admin creates access code
✓ Optional course assignment
✓ Maximum usage limit
✓ Expiration date
✓ Active/inactive status
✓ Usage tracking
✓ Student usage history
✓ Automatic course enrollment

Online writing flow:
✓ Admin creates writing task
✓ A1/A2/B1/B2 level support
✓ Optional course assignment
✓ Instagram link
✓ TikTok link
✓ YouTube link
✓ Deadline
✓ Draft/published status
✓ Student writes directly on website
✓ Student submission tracking
✓ Word count tracking
✓ Admin review
✓ Optional score
✓ Admin feedback
✓ Review date
✓ Reviewer tracking

========================================
Database ready.
========================================

`);


/* =========================================================
   EXPORT
========================================================= */

module.exports = db;
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

const db = require("./database");


/* =========================================================
   CLASSROOM ROUTES
========================================================= */

const authRoutes =
    require("./routes/auth");

const adminRoutes =
    require("./routes/admin");

const studentRoutes =
    require("./routes/student");

const teacherRoutes =
    require("./routes/teacher");


/* =========================================================
   ONLINE LEARNING ROUTES
========================================================= */

const onlineAuthRoutes =
    require("./routes/onlineAuth");

const onlineStudentRoutes =
    require("./routes/onlineStudent");

const onlineAdminRoutes =
    require("./routes/onlineAdmin");


/* =========================================================
   APP
========================================================= */

const app = express();

const PORT =
    process.env.PORT || 5000;


/* =========================================================
   UPLOAD DIRECTORIES
========================================================= */

/*
 * Main uploads directory:
 *
 * backend/uploads/
 *
 * Teacher files:
 *
 * backend/uploads/...
 *
 * Online learning videos:
 *
 * backend/uploads/videos/
 *
 * Create the directories automatically if they
 * do not already exist.
 */

const uploadsDirectory =
    path.join(
        __dirname,
        "uploads"
    );

const videosDirectory =
    path.join(
        uploadsDirectory,
        "videos"
    );


try {

    if (
        !fs.existsSync(
            uploadsDirectory
        )
    ) {

        fs.mkdirSync(
            uploadsDirectory,
            {
                recursive: true
            }
        );

    }


    if (
        !fs.existsSync(
            videosDirectory
        )
    ) {

        fs.mkdirSync(
            videosDirectory,
            {
                recursive: true
            }
        );

    }

} catch (error) {

    console.error(
        "Failed to create upload directories:",
        error
    );

}


/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
/*
 * JSON requests.
 *
 * Video uploads using multipart/form-data are NOT
 * processed by express.json(). They are handled by
 * multer inside onlineAdmin.js.
 */

app.use(
    express.json({
        limit: "10mb"
    })
);


/*
 * URL-encoded requests.
 */

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);


/* =========================================================
   STATIC UPLOADED FILES
========================================================= */

/*
 * Everything inside:
 *
 * backend/uploads/
 *
 * becomes available through:
 *
 * /uploads/...
 *
 *
 * Examples:
 *
 * Teacher file:
 * /uploads/file.pdf
 *
 * Online video:
 * /uploads/videos/my-video.mp4
 *
 *
 * This is important because the online student
 * dashboard needs to be able to play uploaded
 * lesson videos.
 */

app.use(
    "/uploads",
    express.static(
        uploadsDirectory,
        {
            fallthrough: true,

            setHeaders: (
                response,
                filePath
            ) => {

                /*
                 * Allow browsers to stream video files.
                 */

                const extension =
                    path.extname(
                        filePath
                    ).toLowerCase();


                const videoExtensions = [

                    ".mp4",
                    ".webm",
                    ".ogg",
                    ".ogv",
                    ".mov",
                    ".m4v",
                    ".mpeg",
                    ".mpg",
                    ".avi",
                    ".mkv"

                ];


                if (
                    videoExtensions.includes(
                        extension
                    )
                ) {

                    response.setHeader(
                        "Accept-Ranges",
                        "bytes"
                    );

                }


                /*
                 * Prevent browsers from caching
                 * outdated lesson videos too aggressively.
                 */

                response.setHeader(
                    "Cache-Control",
                    "public, max-age=3600"
                );

            }

        }
    )
);



/* =========================================================
   SERVE LINGUA DEUTSCH CONNECT WEBSITE
========================================================= */

app.use(express.static(path.join(__dirname, "..")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "index.html"));
});


/* =========================================================
   CLASSROOM STUDENT AUTH ROUTES
========================================================= */

app.use(
    "/api/auth",
    authRoutes
);


/* =========================================================
   CLASSROOM STUDENT LMS ROUTES
========================================================= */

app.use(
    "/api/student",
    studentRoutes
);


/* =========================================================
   CLASSROOM ADMIN ROUTES
========================================================= */

app.use(
    "/api/admin",
    adminRoutes
);


/* =========================================================
   CLASSROOM TEACHER ROUTES
========================================================= */

app.use(
    "/api/teacher",
    teacherRoutes
);


/* =========================================================
   ONLINE LEARNING AUTH ROUTES
========================================================= */

app.use(
    "/api/online/auth",
    onlineAuthRoutes
);


/* =========================================================
   ONLINE STUDENT LMS ROUTES
========================================================= */

app.use(
    "/api/online/student",
    onlineStudentRoutes
);


/* =========================================================
   ONLINE LEARNING ADMIN ROUTES
========================================================= */

app.use(
    "/api/online-admin",
    onlineAdminRoutes
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            success: true,

            status:
                "online",

            service:
                "Lingua Deutsch Connect Backend",

            port:
                PORT,

            uploads:
                true,

            onlineLearning:
                true

        });

    }
);


/* =========================================================
   404 HANDLER
========================================================= */

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                `Route not found: ${req.method} ${req.originalUrl}`

        });

    }
);


/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
    (err, req, res, next) => {

        console.error(
            "========================================"
        );

        console.error(
            "SERVER ERROR"
        );

        console.error(
            "========================================"
        );

        console.error(
            err
        );


        /*
         * Handle payload-too-large errors.
         */

        if (
            err &&
            err.type === "entity.too.large"
        ) {

            return res.status(413).json({

                success: false,

                message:
                    "The uploaded request is too large."

            });

        }


        /*
         * Handle common multipart/upload errors.
         *
         * Multer errors are normally handled inside
         * onlineAdmin.js, but this provides a safe
         * fallback.
         */

        if (
            err &&
            err.code === "LIMIT_FILE_SIZE"
        ) {

            return res.status(413).json({

                success: false,

                message:
                    "The uploaded file is too large."

            });

        }


        res.status(
            err.status || 500
        ).json({

            success: false,

            message:
                err.message ||
                "Internal server error."

        });

    }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    () => {

        console.log(`

========================================
LINGUA DEUTSCH CONNECT
Backend Server
========================================

Server:
http://localhost:${PORT}

Health:
http://localhost:${PORT}/api/health


========================================
CLASSROOM SYSTEM
========================================

Student Auth:
http://localhost:${PORT}/api/auth/test

Student LMS:
http://localhost:${PORT}/api/student/test

Admin API:
http://localhost:${PORT}/api/admin

Admin Login:
POST http://localhost:${PORT}/api/admin/login

Teacher API:
http://localhost:${PORT}/api/teacher

Teacher Login:
POST http://localhost:${PORT}/api/teacher/login


========================================
ONLINE LEARNING
========================================

Online Auth:
http://localhost:${PORT}/api/online/auth/test

Online Student:
http://localhost:${PORT}/api/online/student/test

Online Admin:
http://localhost:${PORT}/api/online-admin/test

Online Student Register:
POST http://localhost:${PORT}/api/online/auth/register

Online Student Login:
POST http://localhost:${PORT}/api/online/auth/login

Online Admin Login:
POST http://localhost:${PORT}/api/online-admin/login


========================================
ONLINE LEARNING CONTENT
========================================

Uploaded Videos:
http://localhost:${PORT}/uploads/videos/

Uploaded Files:
http://localhost:${PORT}/uploads/


========================================
UPLOAD DIRECTORIES
========================================

Main:
${uploadsDirectory}

Videos:
${videosDirectory}


========================================
SERVER STATUS
========================================

Server is running successfully.

========================================

        `);

    }
);
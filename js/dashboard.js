/* =========================================================
   LINGUA DEUTSCH CONNECT
   STUDENT LMS DASHBOARD
========================================================= */

"use strict";


/* =========================================================
   API CONFIG
========================================================= */

const API_URL = "http://localhost:5000/api";

const TOKEN_KEY = "ldc_token";
const STUDENT_KEY = "ldc_student";
const LEARNING_DATE_KEY = "ldc_last_learning_date";

const KIGALI_TIME_ZONE = "Africa/Kigali";


/* =========================================================
   AUTH
========================================================= */

const token = localStorage.getItem(TOKEN_KEY);
const storedStudent = localStorage.getItem(STUDENT_KEY);


/* =========================================================
   DASHBOARD PROTECTION
========================================================= */

if (!token || !storedStudent) {
    window.location.replace("../login.html");
}


/* =========================================================
   GLOBAL STATE
========================================================= */

let student = null;

let dashboardLoading = false;

let attendanceCheckInLoading = false;

let attendanceAlreadyCheckedIn = false;


/* =========================================================
   AUTH HEADERS
========================================================= */

function authHeaders() {
    return {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(endpoint, options = {}) {

    try {

        const response = await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,

                headers: {
                    ...authHeaders(),
                    ...(options.headers || {})
                }
            }
        );


        const raw = await response.text();

        let data = {};


        try {

            data = raw
                ? JSON.parse(raw)
                : {};

        } catch (error) {

            console.error(
                "Invalid server response:",
                raw
            );

            throw new Error(
                "The server returned an invalid response."
            );
        }


        /* =============================================
           AUTHENTICATION FAILURE
        ============================================= */

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleAuthError(
                new Error(
                    data.message ||
                    "Your session has expired."
                )
            );

            throw new Error(
                "Authentication required."
            );
        }


        /* =============================================
           OTHER API ERROR
        ============================================= */

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Something went wrong."
            );
        }


        return data;

    } catch (error) {

        if (
            error.name === "TypeError"
        ) {

            throw new Error(
                "Unable to connect to the server. Please make sure the LDC server is running."
            );
        }

        throw error;
    }
}


/* =========================================================
   GET ELEMENT
========================================================= */

function getElement(id) {

    return document.getElementById(id);
}


/* =========================================================
   SET TEXT
========================================================= */

function setText(id, value) {

    const element =
        getElement(id);

    if (!element) {
        return;
    }

    element.textContent =
        value == null
            ? "—"
            : value;
}


/* =========================================================
   SAFE NUMBER
========================================================= */

function safeNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


/* =========================================================
   CLAMP PERCENTAGE
========================================================= */

function clampPercentage(value) {

    return Math.max(
        0,
        Math.min(
            100,
            safeNumber(value)
        )
    );
}


/* =========================================================
   FORMAT MONEY
========================================================= */

function formatMoney(value) {

    const amount =
        safeNumber(value);

    return `${amount.toLocaleString()} RWF`;
}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(value) {

    if (!value) {
        return "—";
    }

    const text =
        String(value)
            .replace(/_/g, " ")
            .trim();

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(
        value == null
            ? ""
            : value
    )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   KIGALI DATE
========================================================= */

function getKigaliDate() {

    try {

        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: KIGALI_TIME_ZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(
            new Date()
        );

    } catch (error) {

        console.warn(
            "Kigali date formatting failed:",
            error
        );

        return new Date()
            .toISOString()
            .slice(0, 10);
    }
}


/* =========================================================
   KIGALI DATE/TIME
========================================================= */

function getKigaliDateTime() {

    try {

        return new Intl.DateTimeFormat(
            "sv-SE",
            {
                timeZone: KIGALI_TIME_ZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }
        ).format(
            new Date()
        );

    } catch (error) {

        return new Date()
            .toISOString()
            .replace("T", " ")
            .slice(0, 19);
    }
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }


    let date;

    const stringValue =
        String(value).trim();


    /*
       SQLite style:

       YYYY-MM-DD HH:MM:SS

       Treat this as Kigali local time
       instead of accidentally interpreting
       it as browser UTC/local time.
    */

    if (
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
            .test(stringValue)
    ) {

        const parts =
            stringValue.match(
                /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/
            );

        if (parts) {

            const year =
                Number(parts[1]);

            const month =
                Number(parts[2]) - 1;

            const day =
                Number(parts[3]);

            const hour =
                Number(parts[4]);

            const minute =
                Number(parts[5]);

            const second =
                Number(parts[6]);


            /*
               Create a UTC date using the
               Kigali clock values, then adjust
               by Kigali's UTC+2 offset.
            */

            date =
                new Date(
                    Date.UTC(
                        year,
                        month,
                        day,
                        hour,
                        minute,
                        second
                    ) - (2 * 60 * 60 * 1000)
                );
        }
    }


    if (!date) {

        date =
            new Date(value);
    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);
    }


    try {

        return new Intl.DateTimeFormat(
            undefined,
            {
                timeZone: KIGALI_TIME_ZONE,
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        ).format(date);

    } catch (error) {

        return date.toLocaleDateString(
            undefined,
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    }
}


/* =========================================================
   CLEAR SESSION
========================================================= */

function clearStudentSession() {

    localStorage.removeItem(
        TOKEN_KEY
    );

    localStorage.removeItem(
        STUDENT_KEY
    );
}


/* =========================================================
   LOAD STORED STUDENT
========================================================= */

try {

    student =
        JSON.parse(
            storedStudent
        );

} catch (error) {

    console.error(
        "Invalid stored student data:",
        error
    );

    clearStudentSession();

    window.location.replace(
        "../login.html"
    );
}


/* =========================================================
   VALIDATE STORED STUDENT
========================================================= */

if (
    !student ||
    typeof student !== "object"
) {

    clearStudentSession();

    window.location.replace(
        "../login.html"
    );
}


/* =========================================================
   STUDENT NAME
========================================================= */

function getStudentName(studentData) {

    if (!studentData) {
        return "Student";
    }

    const name =
        studentData.name ||
        studentData.fullName ||
        studentData.full_name ||
        studentData.studentName ||
        studentData.student_name;


    if (
        name &&
        String(name).trim()
    ) {

        return String(name).trim();
    }


    return "Student";
}


/* =========================================================
   ACCOUNT STATUS
========================================================= */

function getAccountStatus(studentData) {

    if (!studentData) {
        return "—";
    }

    return (
        studentData.accountStatus ||
        studentData.account_status ||
        studentData.status ||
        "—"
    );
}


/* =========================================================
   PAYMENT STATUS
========================================================= */

function getPaymentStatus(studentData) {

    if (!studentData) {
        return "—";
    }

    return (
        studentData.paymentStatus ||
        studentData.payment_status ||
        studentData.payment ||
        "—"
    );
}


/* =========================================================
   STUDENT LEVEL
========================================================= */

function getStudentLevel(studentData) {

    if (!studentData) {
        return "";
    }

    return (
        studentData.level ||
        studentData.courseLevel ||
        studentData.course_level ||
        ""
    );
}


/* =========================================================
   SAVE STUDENT
========================================================= */

function saveStudentSession(studentData) {

    if (
        !studentData ||
        typeof studentData !== "object"
    ) {

        return;
    }

    student =
        studentData;

    localStorage.setItem(
        STUDENT_KEY,
        JSON.stringify(studentData)
    );
}


/* =========================================================
   INITIAL STUDENT DISPLAY
========================================================= */

function displayStoredStudent() {

    if (!student) {
        return;
    }


    const studentName =
        getStudentName(student);

    const accountStatus =
        getAccountStatus(student);

    const paymentStatus =
        getPaymentStatus(student);

    const level =
        getStudentLevel(student);


    setText(
        "studentName",
        studentName
    );

    setText(
        "studentFullName",
        studentName
    );


    setText(
        "studentEmail",
        student.email || "—"
    );


    setText(
        "studentPhone",
        student.phone || "—"
    );


    setText(
        "accountStatus",
        formatStatus(
            accountStatus
        )
    );


    /*
       Only update the generic paymentStatus
       element here if there is no dedicated
       dashboard payment status element.
    */

    const dashboardPaymentStatus =
        getElement(
            "dashboardPaymentStatus"
        );

    if (!dashboardPaymentStatus) {

        setText(
            "paymentStatus",
            formatStatus(
                paymentStatus
            )
        );
    }


    setText(
        "topbarLevel",
        level
            ? `German ${level}`
            : "German"
    );
}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    try {

        const data =
            await apiRequest(
                "/student/profile"
            );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Could not load profile."
            );
        }


        const profile =
            data.student ||
            data.profile ||
            data.user;


        if (!profile) {

            console.warn(
                "Profile endpoint returned no student object.",
                data
            );

            return;
        }


        saveStudentSession(
            profile
        );

        displayStoredStudent();


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        if (
            !error.message.includes(
                "Authentication required"
            )
        ) {

            displayStoredStudent();
        }
    }
}


/* =========================================================
   LOAD COURSE
========================================================= */

async function loadCourse() {

    const moduleList =
        getElement(
            "moduleList"
        );


    try {

        const data =
            await apiRequest(
                "/student/course"
            );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Could not load course."
            );
        }


        const course =
            data.course || {};


        const modules =
            Array.isArray(
                data.modules
            )
                ? data.modules
                : [];


        setText(
            "courseTitle",
            course.name ||
            "German Course"
        );


        setText(
            "courseDescription",
            course.description ||
            "Your German learning course."
        );


        setText(
            "courseLevel",
            course.level ||
            getStudentLevel(student) ||
            "—"
        );


        let progressValue =
            data.progress;


        if (
            progressValue === undefined ||
            progressValue === null
        ) {

            progressValue =
                course.progress;
        }


        if (
            typeof progressValue === "object" &&
            progressValue !== null
        ) {

            if (
                progressValue.percentage != null
            ) {

                progressValue =
                    progressValue.percentage;

            } else if (
                progressValue.progress != null
            ) {

                progressValue =
                    progressValue.progress;

            } else if (
                progressValue.value != null
            ) {

                progressValue =
                    progressValue.value;

            } else {

                progressValue = 0;
            }
        }


        const progress =
            clampPercentage(
                progressValue
            );


        setText(
            "courseProgress",
            `${progress}%`
        );


        setText(
            "courseProgressText",
            `${progress}%`
        );


        const progressBar =
            getElement(
                "courseProgressBar"
            );


        if (progressBar) {

            progressBar.style.width =
                `${progress}%`;

            progressBar.setAttribute(
                "aria-valuenow",
                String(progress)
            );
        }


        if (!modules.length) {

            if (moduleList) {

                moduleList.innerHTML = `
                    <div class="empty-message">
                        <strong>
                            Your course is being prepared.
                        </strong>
                        <br>
                        Your teacher will add lessons here soon.
                    </div>
                `;
            }

            return;
        }


        if (moduleList) {

            moduleList.innerHTML = "";


            modules.forEach(
                (module, index) => {

                    moduleList.appendChild(
                        createModuleElement(
                            module,
                            index
                        )
                    );
                }
            );
        }


    } catch (error) {

        console.error(
            "Course loading error:",
            error
        );


        if (
            error.message.includes(
                "Authentication required"
            )
        ) {

            return;
        }


        if (moduleList) {

            moduleList.innerHTML = `
                <div class="error-message">
                    <strong>
                        Could not load your course.
                    </strong>
                    <br>
                    ${escapeHTML(
                        error.message ||
                        "Please try again later."
                    )}
                </div>
            `;
        }
    }
}


/* =========================================================
   CREATE MODULE
========================================================= */

function createModuleElement(
    module,
    moduleIndex
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "module-item";


    const moduleNumber =
        module.module_order != null
            ? module.module_order
            : module.order != null
                ? module.order
                : moduleIndex + 1;


    const title =
        module.title ||
        `Module ${moduleNumber}`;


    const description =
        module.description ||
        "German learning module.";


    wrapper.innerHTML = `
        <div class="module-header">

            <div class="module-left">

                <div class="module-number">
                    ${escapeHTML(
                        moduleNumber
                    )}
                </div>

                <div>

                    <div class="module-title">
                        ${escapeHTML(
                            title
                        )}
                    </div>

                    <div class="module-description">
                        ${escapeHTML(
                            description
                        )}
                    </div>

                </div>

            </div>

        </div>

        <div class="lesson-list"></div>
    `;


    const lessonList =
        wrapper.querySelector(
            ".lesson-list"
        );


    const lessons =
        Array.isArray(
            module.lessons
        )
            ? module.lessons
            : [];


    if (!lessons.length) {

        lessonList.innerHTML = `
            <div class="empty-message">
                No lessons have been added yet.
            </div>
        `;

        return wrapper;
    }


    lessons.forEach(
        lesson => {

            lessonList.appendChild(
                createLessonElement(
                    lesson
                )
            );
        }
    );


    return wrapper;
}


/* =========================================================
   GET LESSON PROGRESS
========================================================= */

function getLessonProgress(lesson) {

    const progress =
        lesson.progress;


    if (
        typeof progress === "number"
    ) {

        return {

            percentage:
                clampPercentage(
                    progress
                ),

            status:
                lesson.status ||
                lesson.progress_status ||
                "not_started"
        };
    }


    if (
        typeof progress === "object" &&
        progress !== null
    ) {

        let objectProgress = 0;


        if (
            progress.progress != null
        ) {

            objectProgress =
                progress.progress;

        } else if (
            progress.percentage != null
        ) {

            objectProgress =
                progress.percentage;
        }


        return {

            percentage:
                clampPercentage(
                    objectProgress
                ),

            status:
                progress.status ||
                lesson.status ||
                lesson.progress_status ||
                "not_started"
        };
    }


    let lessonProgress = 0;


    if (
        lesson.progress_percent != null
    ) {

        lessonProgress =
            lesson.progress_percent;

    } else if (
        lesson.progress_percentage != null
    ) {

        lessonProgress =
            lesson.progress_percentage;
    }


    return {

        percentage:
            clampPercentage(
                lessonProgress
            ),

        status:
            lesson.status ||
            lesson.progress_status ||
            "not_started"
    };
}


/* =========================================================
   CREATE LESSON
========================================================= */

function createLessonElement(
    lesson
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "lesson-item";


    const lessonProgress =
        getLessonProgress(
            lesson
        );


    const status =
        lessonProgress.status ||
        "not_started";


    const progressPercent =
        lessonProgress.percentage;


    let statusLabel =
        "Not started";


    let statusClass =
        "not-started";


    if (
        status === "completed"
    ) {

        statusLabel =
            "Completed";

        statusClass =
            "completed";

    } else if (
        status === "in_progress"
    ) {

        statusLabel =
            "In progress";

        statusClass =
            "in-progress";

    } else if (
        status === "locked"
    ) {

        statusLabel =
            "Locked";

        statusClass =
            "locked";
    }


    const duration =
        lesson.duration
            ? `${lesson.duration} min`
            : "Lesson";


    const xp =
        safeNumber(
            lesson.xp_reward,
            0
        );


    const isLocked =
        status === "locked";


    let buttonText =
        "Start";


    if (isLocked) {

        buttonText =
            "Locked";

    } else if (
        status === "completed"
    ) {

        buttonText =
            "Review";

    } else if (
        status === "in_progress"
    ) {

        buttonText =
            "Continue";
    }


    let progressMeta =
        "";


    if (
        progressPercent > 0 &&
        status !== "completed"
    ) {

        progressMeta = `
            •
            ${progressPercent}%
        `;
    }


    let progressHTML =
        "";


    if (
        progressPercent > 0 &&
        status !== "completed"
    ) {

        progressHTML = `
            <div
                class="lesson-progress-track"
                style="
                    width:100%;
                    height:5px;
                    margin-top:7px;
                    border-radius:10px;
                    overflow:hidden;
                    background:rgba(0,0,0,.08);
                "
            >
                <div
                    class="lesson-progress-fill"
                    style="
                        width:${progressPercent}%;
                        height:100%;
                        border-radius:10px;
                    "
                ></div>
            </div>
        `;
    }


    row.innerHTML = `
        <div class="lesson-info">

            <div class="lesson-title">
                ${escapeHTML(
                    lesson.title ||
                    "Lesson"
                )}
            </div>

            <div class="lesson-meta">
                ${escapeHTML(
                    duration
                )}
                •
                ${xp} XP
                ${progressMeta}
            </div>

            ${progressHTML}

        </div>

        <div
            style="
                display:flex;
                align-items:center;
                gap:8px;
                flex-wrap:wrap;
                justify-content:flex-end;
            "
        >

            <span
                class="
                    lesson-status
                    ${statusClass}
                "
            >
                ${statusLabel}
            </span>

            <button
                type="button"
                class="continue-btn"
                data-lesson-id="${escapeHTML(
                    lesson.id
                )}"
                ${isLocked ? "disabled" : ""}
            >
                ${buttonText}
            </button>

        </div>
    `;


    const button =
        row.querySelector(
            ".continue-btn"
        );


    if (
        button &&
        !isLocked
    ) {

        button.addEventListener(
            "click",
            () => {

                markLearningActivity();

                openLesson(
                    lesson
                );
            }
        );
    }


    return row;
}


/* =========================================================
   OPEN LESSON
========================================================= */

function openLesson(
    lesson
) {

    const lessonId =
        lesson &&
        lesson.id;


    if (!lessonId) {

        alert(
            "This lesson is not available yet."
        );

        return;
    }


    window.location.href =
        `lesson.html?id=${encodeURIComponent(
            lessonId
        )}`;
}


/* =========================================================
   LOAD XP
========================================================= */

async function loadXP() {

    try {

        const data =
            await apiRequest(
                "/student/xp"
            );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Could not load XP."
            );
        }


        const xp =
            data.xp || {};


        let totalXP = 0;


        if (
            xp.total_xp != null
        ) {

            totalXP =
                xp.total_xp;

        } else if (
            xp.totalXp != null
        ) {

            totalXP =
                xp.totalXp;

        } else if (
            xp.xp != null
        ) {

            totalXP =
                xp.xp;
        }


        let currentStreak = 0;


        if (
            xp.current_streak != null
        ) {

            currentStreak =
                xp.current_streak;

        } else if (
            xp.currentStreak != null
        ) {

            currentStreak =
                xp.currentStreak;

        } else if (
            xp.streak != null
        ) {

            currentStreak =
                xp.streak;
        }


        let weeklyXP = 0;


        if (
            xp.weekly_xp != null
        ) {

            weeklyXP =
                xp.weekly_xp;

        } else if (
            xp.weeklyXp != null
        ) {

            weeklyXP =
                xp.weeklyXp;
        }


        let longestStreak = 0;


        if (
            xp.longest_streak != null
        ) {

            longestStreak =
                xp.longest_streak;

        } else if (
            xp.longestStreak != null
        ) {

            longestStreak =
                xp.longestStreak;
        }


        totalXP =
            safeNumber(
                totalXP
            );

        currentStreak =
            safeNumber(
                currentStreak
            );

        weeklyXP =
            safeNumber(
                weeklyXP
            );

        longestStreak =
            safeNumber(
                longestStreak
            );


        setText(
            "totalXp",
            totalXP.toLocaleString()
        );


        setText(
            "currentStreak",
            currentStreak
        );


        setText(
            "weeklyXp",
            weeklyXP.toLocaleString()
        );


        setText(
            "longestStreak",
            longestStreak
        );


    } catch (error) {

        console.error(
            "XP loading error:",
            error
        );
    }
}


/* =========================================================
   LOAD ATTENDANCE
========================================================= */

async function loadAttendance() {

    try {

        const data =
            await apiRequest(
                "/student/attendance"
            );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Could not load attendance."
            );
        }


        const summary =
            data.summary || {};


        const present =
            safeNumber(
                summary.present
            );


        const late =
            safeNumber(
                summary.late
            );


        const absent =
            safeNumber(
                summary.absent
            );


        const excused =
            safeNumber(
                summary.excused
            );


        const percentage =
            clampPercentage(
                summary.percentage
            );


        setText(
            "presentCount",
            present
        );


        setText(
            "lateCount",
            late
        );


        setText(
            "absentCount",
            absent
        );


        setText(
            "excusedCount",
            excused
        );


        setText(
            "attendancePercentage",
            `${percentage}%`
        );


        setText(
            "attendancePercentText",
            `${percentage}%`
        );


        const attendanceBar =
            getElement(
                "attendanceBar"
            );


        if (attendanceBar) {

            attendanceBar.style.width =
                `${percentage}%`;

            attendanceBar.setAttribute(
                "aria-valuenow",
                String(percentage)
            );
        }


    } catch (error) {

        console.error(
            "Attendance loading error:",
            error
        );
    }
}


/* =========================================================
   UPDATE ATTENDANCE UI
========================================================= */

function updateAttendanceCheckInUI(
    checkedIn,
    status = null
) {

    attendanceAlreadyCheckedIn =
        Boolean(checkedIn);


    const input =
        getElement(
            "attendanceCode"
        ) ||
        getElement(
            "attendanceCodeInput"
        );


    const button =
        getElement(
            "attendanceCheckinBtn"
        ) ||
        getElement(
            "checkInBtn"
        );


    const message =
        getElement(
            "checkinMessage"
        ) ||
        getElement(
            "checkInMessage"
        );


    const statusElement =
        getElement(
            "todayAttendance"
        );


    if (
        checkedIn
    ) {

        if (statusElement) {

            statusElement.textContent =
                formatStatus(
                    status ||
                    "present"
                );

            statusElement.dataset.status =
                status ||
                "present";
        }


        if (input) {

            input.disabled =
                true;

            input.setAttribute(
                "aria-disabled",
                "true"
            );
        }


        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Checked In";
        }


        if (message) {

            showInlineMessage(
                message,
                "You are already checked in for today.",
                "success"
            );
        }


        return;
    }


    if (statusElement) {

        statusElement.textContent =
            "Not checked in";

        statusElement.dataset.status =
            "not_checked_in";
    }


    if (input) {

        input.disabled =
            false;

        input.removeAttribute(
            "aria-disabled"
        );
    }


    if (button) {

        button.disabled =
            false;

        if (
            !attendanceCheckInLoading
        ) {

            button.textContent =
                button.dataset.originalText ||
                "Check In";
        }
    }
}


/* =========================================================
   LOAD TODAY'S ATTENDANCE
========================================================= */

async function loadTodayAttendance() {

    try {

        const data =
            await apiRequest(
                "/student/attendance/today"
            );


        if (!data.success) {

            return;
        }


        /*
           Backend compatibility:

           - data.attendance
           - data.record
           - data.records[0]
           - data.checkedIn
        */

        let attendance =
            data.attendance ||
            data.record ||
            null;


        const records =
            Array.isArray(
                data.records
            )
                ? data.records
                : [];


        if (
            !attendance &&
            records.length
        ) {

            attendance =
                records[0];
        }


        /*
           checkedIn is authoritative when
           supplied by the backend.
        */

        let checkedIn;


        if (
            typeof data.checkedIn === "boolean"
        ) {

            checkedIn =
                data.checkedIn;

        } else {

            checkedIn =
                Boolean(
                    attendance
                );
        }


        const status =
            attendance &&
            (
                attendance.status ||
                attendance.attendance_status
            );


        updateAttendanceCheckInUI(
            checkedIn,
            status
        );


    } catch (error) {

        console.warn(
            "Today's attendance could not be loaded:",
            error.message
        );
    }
}


/* =========================================================
   ATTENDANCE CHECK-IN
========================================================= */

async function checkInAttendance() {

    if (
        attendanceCheckInLoading ||
        attendanceAlreadyCheckedIn
    ) {

        return;
    }


    const input =
        getElement(
            "attendanceCode"
        ) ||
        getElement(
            "attendanceCodeInput"
        );


    const button =
        getElement(
            "attendanceCheckinBtn"
        ) ||
        getElement(
            "checkInBtn"
        );


    const message =
        getElement(
            "checkinMessage"
        ) ||
        getElement(
            "checkInMessage"
        );


    if (!input) {
        return;
    }


    const code =
        input.value
            .trim()
            .toUpperCase();


    if (!code) {

        showInlineMessage(
            message,
            "Please enter your attendance code.",
            "error"
        );

        return;
    }


    attendanceCheckInLoading =
        true;


    if (button) {

        button.disabled =
            true;


        if (
            !button.dataset.originalText
        ) {

            button.dataset.originalText =
                button.textContent;
        }


        button.textContent =
            "Checking...";
    }


    try {

        const data =
            await apiRequest(
                "/student/attendance/check-in",
                {
                    method: "POST",

                    body:
                        JSON.stringify({
                            code: code
                        })
                }
            );


        if (!data.success) {

            throw new Error(
                data.message ||
                "Attendance check-in failed."
            );
        }


        /*
           Mark as checked in immediately.
           This prevents a second request even
           before the refresh requests finish.
        */

        attendanceAlreadyCheckedIn =
            true;


        const returnedAttendance =
            data.attendance ||
            data.record ||
            null;


        const returnedStatus =
            returnedAttendance &&
            returnedAttendance.status
                ? returnedAttendance.status
                : "present";


        updateAttendanceCheckInUI(
            true,
            returnedStatus
        );


        showInlineMessage(
            message,
            data.message ||
            "Attendance checked in successfully.",
            "success"
        );


        input.value = "";


        /*
           Refresh attendance statistics and
           today's status.
        */

        await Promise.allSettled([
            loadAttendance(),
            loadTodayAttendance(),
            loadXP()
        ]);


    } catch (error) {

        console.error(
            "Attendance check-in error:",
            error
        );


        /*
           If the backend says the student
           is already checked in, treat it
           as a successful final state.
        */

        const errorMessage =
            String(
                error.message || ""
            ).toLowerCase();


        if (
            errorMessage.includes(
                "already"
            ) &&
            (
                errorMessage.includes(
                    "attendance"
                ) ||
                errorMessage.includes(
                    "check"
                )
            )
        ) {

            attendanceAlreadyCheckedIn =
                true;


            updateAttendanceCheckInUI(
                true,
                "present"
            );


            showInlineMessage(
                message,
                "You are already checked in for today.",
                "success"
            );


        } else {

            showInlineMessage(
                message,
                error.message ||
                "Could not check in.",
                "error"
            );


            /*
               Allow the student to try again
               when the request actually failed.
            */

            attendanceAlreadyCheckedIn =
                false;
        }


    } finally {

        attendanceCheckInLoading =
            false;


        if (
            !attendanceAlreadyCheckedIn &&
            button
        ) {

            button.disabled =
                false;


            button.textContent =
                button.dataset.originalText ||
                "Check In";
        }
    }
}


/* =========================================================
   INLINE MESSAGE
========================================================= */

function showInlineMessage(
    element,
    message,
    type = "info"
) {

    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;


    element.style.display =
        "block";
}


/* =========================================================
   SETUP ATTENDANCE CHECK-IN
========================================================= */

function setupAttendanceCheckIn() {

    const button =
        getElement(
            "attendanceCheckinBtn"
        ) ||
        getElement(
            "checkInBtn"
        );


    const input =
        getElement(
            "attendanceCode"
        ) ||
        getElement(
            "attendanceCodeInput"
        );


    /*
       Prevent duplicate event listeners
       if initialization is triggered again.
    */

    if (
        button &&
        !button.dataset.attendanceBound
    ) {

        button.addEventListener(
            "click",
            checkInAttendance
        );


        button.dataset.attendanceBound =
            "true";
    }


    if (
        input &&
        !input.dataset.attendanceBound
    ) {

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    checkInAttendance();
                }
            }
        );


        input.dataset.attendanceBound =
            "true";
    }
}


/* =========================================================
   LOAD ACHIEVEMENTS
========================================================= */

async function loadAchievements() {

    try {

        const data =
            await apiRequest(
                "/student/achievements"
            );


        if (!data.success) {
            return;
        }


        const achievements =
            Array.isArray(
                data.achievements
            )
                ? data.achievements
                : [];


        const unlocked =
            achievements.filter(
                achievement =>
                    achievement.unlocked ||
                    achievement.is_unlocked ||
                    achievement.unlocked_at
            );


        setText(
            "achievementCount",
            unlocked.length
        );


        const list =
            getElement(
                "achievementList"
            );


        if (!list) {
            return;
        }


        if (!achievements.length) {

            list.innerHTML = `
                <div class="empty-message">
                    No achievements yet.
                    <br>
                    Keep learning to unlock your first achievement!
                </div>
            `;

            return;
        }


        list.innerHTML =
            achievements
                .slice(0, 6)
                .map(
                    achievement => {

                        const name =
                            achievement.name ||
                            achievement.title ||
                            "Achievement";


                        const description =
                            achievement.description ||
                            "";


                        const isUnlocked =
                            Boolean(
                                achievement.unlocked ||
                                achievement.is_unlocked ||
                                achievement.unlocked_at
                            );


                        return `
                            <div class="
                                achievement-item
                                ${isUnlocked
                                    ? "unlocked"
                                    : "locked"}
                            ">

                                <strong>
                                    ${escapeHTML(
                                        name
                                    )}
                                </strong>

                                ${
                                    description
                                        ? `
                                            <small>
                                                ${escapeHTML(
                                                    description
                                                )}
                                            </small>
                                        `
                                        : ""
                                }

                            </div>
                        `;
                    }
                )
                .join("");


    } catch (error) {

        console.warn(
            "Achievements loading error:",
            error.message
        );
    }
}


/* =========================================================
   LOAD LEADERBOARD
========================================================= */

async function loadLeaderboard() {

    try {

        const data =
            await apiRequest(
                "/student/leaderboard"
            );


        if (!data.success) {
            return;
        }


        const leaderboard =
            Array.isArray(
                data.leaderboard
            )
                ? data.leaderboard
                : [];


        const list =
            getElement(
                "leaderboardList"
            );


        if (!list) {
            return;
        }


        let myRank;


        if (
            data.myRank != null
        ) {

            myRank =
                data.myRank;

        } else if (
            data.rank != null
        ) {

            myRank =
                data.rank;

        } else if (
            data.studentRank != null
        ) {

            myRank =
                data.studentRank;

        } else {

            myRank =
                data.position;
        }


        let myXP;


        if (
            data.myWeeklyXp != null
        ) {

            myXP =
                data.myWeeklyXp;

        } else if (
            data.my_weekly_xp != null
        ) {

            myXP =
                data.my_weekly_xp;

        } else if (
            data.weeklyXp != null
        ) {

            myXP =
                data.weeklyXp;

        } else {

            myXP =
                data.weekly_xp;
        }


        if (
            myRank !== undefined &&
            myRank !== null
        ) {

            setText(
                "myRank",
                `#${safeNumber(
                    myRank
                )}`
            );
        }


        if (
            myXP !== undefined &&
            myXP !== null
        ) {

            setText(
                "myWeeklyXp",
                `${safeNumber(
                    myXP
                ).toLocaleString()} XP`
            );
        }


        if (!leaderboard.length) {

            list.innerHTML = `
                <div class="empty-message">
                    No leaderboard data yet.
                </div>
            `;

            return;
        }


        list.innerHTML =
            leaderboard
                .slice(0, 10)
                .map(
                    (entry, index) => {

                        let position;


                        if (
                            entry.rank != null
                        ) {

                            position =
                                entry.rank;

                        } else if (
                            entry.position != null
                        ) {

                            position =
                                entry.position;

                        } else {

                            position =
                                index + 1;
                        }


                        const name =
                            entry.full_name ||
                            entry.fullName ||
                            entry.name ||
                            "Student";


                        let xpValue = 0;


                        if (
                            entry.weekly_xp != null
                        ) {

                            xpValue =
                                entry.weekly_xp;

                        } else if (
                            entry.weeklyXp != null
                        ) {

                            xpValue =
                                entry.weeklyXp;

                        } else if (
                            entry.xp != null
                        ) {

                            xpValue =
                                entry.xp;

                        } else if (
                            entry.total_xp != null
                        ) {

                            xpValue =
                                entry.total_xp;
                        }


                        const xp =
                            safeNumber(
                                xpValue
                            );


                        const isMe =
                            student &&
                            entry.id == student.id;


                        return `
                            <div class="
                                leaderboard-row
                                ${isMe
                                    ? "current-student"
                                    : ""}
                            ">

                                <span class="leaderboard-rank">
                                    #${safeNumber(
                                        position
                                    )}
                                </span>

                                <span class="leaderboard-name">
                                    ${escapeHTML(
                                        name
                                    )}
                                </span>

                                <strong class="leaderboard-xp">
                                    ${xp.toLocaleString()} XP
                                </strong>

                            </div>
                        `;
                    }
                )
                .join("");


    } catch (error) {

        console.warn(
            "Leaderboard loading error:",
            error.message
        );
    }
}


/* =========================================================
   LOAD NOTIFICATIONS
========================================================= */

async function loadNotifications() {

    try {

        const data =
            await apiRequest(
                "/student/notifications"
            );


        if (!data.success) {
            return;
        }


        const notifications =
            Array.isArray(
                data.notifications
            )
                ? data.notifications
                : [];


        const unreadCount =
            notifications.filter(
                notification =>
                    !notification.is_read &&
                    !notification.read_at
            ).length;


        setText(
            "notificationCount",
            unreadCount
        );


        const badge =
            getElement(
                "notificationBadge"
            );


        if (badge) {

            badge.textContent =
                unreadCount;


            badge.style.display =
                unreadCount > 0
                    ? ""
                    : "none";
        }


        const list =
            getElement(
                "notificationList"
            );


        if (!list) {
            return;
        }


        if (!notifications.length) {

            list.innerHTML = `
                <div class="empty-message">
                    No notifications.
                </div>
            `;

            return;
        }


        list.innerHTML =
            notifications
                .slice(0, 8)
                .map(
                    notification => {

                        const title =
                            notification.title ||
                            notification.subject ||
                            "Notification";


                        const message =
                            notification.message ||
                            notification.content ||
                            "";


                        const isUnread =
                            !notification.is_read &&
                            !notification.read_at;


                        return `
                            <div class="
                                notification-item
                                ${isUnread
                                    ? "unread"
                                    : ""}
                            ">

                                <strong>
                                    ${escapeHTML(
                                        title
                                    )}
                                </strong>

                                ${
                                    message
                                        ? `
                                            <p>
                                                ${escapeHTML(
                                                    message
                                                )}
                                            </p>
                                        `
                                        : ""
                                }

                            </div>
                        `;
                    }
                )
                .join("");


    } catch (error) {

        console.warn(
            "Notifications loading error:",
            error.message
        );
    }
}


/* =========================================================
   LOAD CLASS
========================================================= */

async function loadClass() {

    try {

        const data =
            await apiRequest(
                "/student/classes"
            );


        if (!data.success) {
            return;
        }


        const classes =
            Array.isArray(
                data.classes
            )
                ? data.classes
                : [];


        const currentClass =
            classes.find(
                classItem =>
                    String(
                        classItem.status ||
                        "active"
                    ).toLowerCase() ===
                    "active"
            ) ||
            classes[0] ||
            null;


        if (!currentClass) {

            setText(
                "className",
                "No class assigned"
            );

            setText(
                "classSchedule",
                "—"
            );

            setText(
                "classRoom",
                "—"
            );

            setText(
                "classTeacher",
                "—"
            );

            setText(
                "classStudentCount",
                "—"
            );

            return;
        }


        const teacher =
            currentClass.teacher ||
            currentClass.teacher_name ||
            currentClass.teacherName ||
            currentClass.teacher_full_name ||
            "—";


        let studentCount;


        if (
            currentClass.student_count != null
        ) {

            studentCount =
                currentClass.student_count;

        } else if (
            currentClass.students_count != null
        ) {

            studentCount =
                currentClass.students_count;

        } else if (
            currentClass.enrolled_students != null
        ) {

            studentCount =
                currentClass.enrolled_students;

        } else {

            studentCount =
                currentClass.total_students;
        }


        setText(
            "className",
            currentClass.name ||
            "My Class"
        );


        setText(
            "classSchedule",
            currentClass.schedule ||
            "Schedule not set"
        );


        setText(
            "classRoom",
            currentClass.room ||
            "Room not set"
        );


        setText(
            "classTeacher",
            teacher
        );


        setText(
            "classStudentCount",
            studentCount !== undefined
                ? studentCount
                : "—"
        );


    } catch (error) {

        console.warn(
            "Class loading error:",
            error.message
        );
    }
}


/* =========================================================
   LOAD TESTS
========================================================= */

async function loadTests() {

    try {

        const data =
            await apiRequest(
                "/student/tests"
            );


        if (!data.success) {
            return;
        }


        const tests =
            Array.isArray(
                data.tests
            )
                ? data.tests
                : [];


        const list =
            getElement(
                "testList"
            );


        if (!list) {
            return;
        }


        if (!tests.length) {

            list.innerHTML = `
                <div class="empty-message">
                    No tests available yet.
                </div>
            `;

            return;
        }


        list.innerHTML =
            tests
                .slice(0, 8)
                .map(
                    test => {

                        const title =
                            test.title ||
                            test.name ||
                            "Test";


                        let points;


                        if (
                            test.points != null
                        ) {

                            points =
                                test.points;

                        } else if (
                            test.total_points != null
                        ) {

                            points =
                                test.total_points;

                        } else {

                            points =
                                test.max_points;
                        }


                        let result;


                        if (
                            test.result != null
                        ) {

                            result =
                                test.result;

                        } else if (
                            test.score != null
                        ) {

                            result =
                                test.score;

                        } else {

                            result =
                                test.student_score;
                        }


                        const status =
                            test.status ||
                            (
                                result !== undefined
                                    ? "completed"
                                    : "pending"
                            );


                        let pointsHTML =
                            "Test";


                        if (
                            points !== undefined
                        ) {

                            pointsHTML =
                                `${safeNumber(
                                    points
                                )} points`;
                        }


                        let resultHTML;


                        if (
                            result !== undefined
                        ) {

                            resultHTML =
                                `${safeNumber(
                                    result
                                )}`;

                        } else {

                            resultHTML =
                                formatStatus(
                                    status
                                );
                        }


                        return `
                            <div class="test-item">

                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            title
                                        )}
                                    </strong>

                                    <small>
                                        ${pointsHTML}
                                    </small>

                                </div>

                                <span class="test-status">
                                    ${resultHTML}
                                </span>

                            </div>
                        `;
                    }
                )
                .join("");


    } catch (error) {

        console.warn(
            "Tests loading error:",
            error.message
        );
    }
}


/* =========================================================
   LOAD PERFORMANCE
========================================================= */

async function loadPerformance() {

    try {

        const data =
            await apiRequest(
                "/student/performance"
            );


        if (!data.success) {
            return;
        }


        const performance =
            data.performance ||
            data.summary ||
            data;


        let average = 0;


        if (
            performance.average != null
        ) {

            average =
                performance.average;

        } else if (
            performance.average_score != null
        ) {

            average =
                performance.average_score;

        } else if (
            performance.average_percentage != null
        ) {

            average =
                performance.average_percentage;

        } else if (
            performance.averageScore != null
        ) {

            average =
                performance.averageScore;
        }


        let tests = 0;


        if (
            performance.tests != null
        ) {

            tests =
                performance.tests;

        } else if (
            performance.total_tests != null
        ) {

            tests =
                performance.total_tests;

        } else if (
            performance.test_count != null
        ) {

            tests =
                performance.test_count;
        }


        let passed = 0;


        if (
            performance.passed != null
        ) {

            passed =
                performance.passed;

        } else if (
            performance.passed_tests != null
        ) {

            passed =
                performance.passed_tests;
        }


        let failed = 0;


        if (
            performance.failed != null
        ) {

            failed =
                performance.failed;

        } else if (
            performance.failed_tests != null
        ) {

            failed =
                performance.failed_tests;
        }


        const averageElement =
            getElement(
                "averageScore"
            ) ||
            getElement(
                "performanceAverage"
            );


        const testsElement =
            getElement(
                "testsCompleted"
            ) ||
            getElement(
                "performanceTests"
            );


        const passedElement =
            getElement(
                "testsPassed"
            ) ||
            getElement(
                "performancePassed"
            );


        const failedElement =
            getElement(
                "testsFailed"
            ) ||
            getElement(
                "performanceFailed"
            );


        if (averageElement) {

            averageElement.textContent =
                `${clampPercentage(
                    average
                )}%`;
        }


        if (testsElement) {

            testsElement.textContent =
                safeNumber(
                    tests
                );
        }


        if (passedElement) {

            passedElement.textContent =
                safeNumber(
                    passed
                );
        }


        if (failedElement) {

            failedElement.textContent =
                safeNumber(
                    failed
                );
        }


    } catch (error) {

        console.warn(
            "Performance loading error:",
            error.message
        );
    }
}


/* =========================================================
   LOAD PAYMENTS
========================================================= */

async function loadPayments() {

    try {

        const data =
            await apiRequest(
                "/student/payments"
            );


        if (!data.success) {
            return;
        }


        const summary =
            data.summary ||
            data.paymentSummary ||
            {};


        const payments =
            Array.isArray(
                data.payments
            )
                ? data.payments
                : [];


        let total = 0;


        if (
            summary.total != null
        ) {

            total =
                summary.total;

        } else if (
            summary.total_amount != null
        ) {

            total =
                summary.total_amount;

        } else if (
            data.total != null
        ) {

            total =
                data.total;
        }


        let paid = 0;


        if (
            summary.paid != null
        ) {

            paid =
                summary.paid;

        } else if (
            summary.paid_amount != null
        ) {

            paid =
                summary.paid_amount;

        } else if (
            data.paid != null
        ) {

            paid =
                data.paid;
        }


        let remaining = 0;


        if (
            summary.remaining != null
        ) {

            remaining =
                summary.remaining;

        } else if (
            summary.amount_remaining != null
        ) {

            remaining =
                summary.amount_remaining;

        } else if (
            summary.remaining_amount != null
        ) {

            remaining =
                summary.remaining_amount;

        } else if (
            data.remaining != null
        ) {

            remaining =
                data.remaining;

        } else if (
            data.remaining_amount != null
        ) {

            remaining =
                data.remaining_amount;
        }


        const status =
            summary.status ||
            data.status ||
            getPaymentStatus(
                student
            );


        const paymentAmount =
            getElement(
                "dashboardPaymentAmount"
            ) ||
            getElement(
                "paymentTotal"
            );


        const paymentStatusElement =
            getElement(
                "dashboardPaymentStatus"
            );


        /*
           Do not overwrite the profile
           paymentStatus element when a
           dedicated dashboard payment status
           element does not exist.
        */

        const fallbackPaymentElement =
            paymentStatusElement ||
            (
                !getElement(
                    "dashboardPaymentStatus"
                )
                    ? getElement(
                        "paymentStatus"
                    )
                    : null
            );


        if (paymentAmount) {

            paymentAmount.textContent =
                formatMoney(
                    total
                );
        }


        if (fallbackPaymentElement) {

            fallbackPaymentElement.textContent =
                formatStatus(
                    status
                );
        }


        const paymentPaid =
            getElement(
                "paymentPaid"
            );


        if (paymentPaid) {

            paymentPaid.textContent =
                formatMoney(
                    paid
                );
        }


        const paymentRemaining =
            getElement(
                "paymentRemaining"
            );


        if (paymentRemaining) {

            paymentRemaining.textContent =
                formatMoney(
                    remaining
                );
        }


        const list =
            getElement(
                "paymentList"
            );


        if (!list) {
            return;
        }


        if (!payments.length) {

            list.innerHTML = `
                <div class="empty-message">
                    No payment transactions recorded yet.
                </div>
            `;

            return;
        }


        list.innerHTML =
            payments
                .slice(0, 6)
                .map(
                    payment => {

                        let amount = 0;


                        if (
                            payment.amount != null
                        ) {

                            amount =
                                payment.amount;

                        } else if (
                            payment.paid_amount != null
                        ) {

                            amount =
                                payment.paid_amount;
                        }


                        const paymentStatusValue =
                            payment.status ||
                            payment.payment_status ||
                            "recorded";


                        const date =
                            payment.payment_date ||
                            payment.date ||
                            payment.created_at ||
                            "";


                        let dateHTML =
                            "";


                        if (date) {

                            dateHTML = `
                                <small>
                                    ${escapeHTML(
                                        formatDate(
                                            date
                                        )
                                    )}
                                </small>
                            `;
                        }


                        return `
                            <div class="payment-item">

                                <div>

                                    <strong>
                                        ${formatMoney(
                                            amount
                                        )}
                                    </strong>

                                    ${dateHTML}

                                </div>

                                <span>
                                    ${escapeHTML(
                                        formatStatus(
                                            paymentStatusValue
                                        )
                                    )}
                                </span>

                            </div>
                        `;
                    }
                )
                .join("");


    } catch (error) {

        console.warn(
            "Payments loading error:",
            error.message
        );
    }
}


/* =========================================================
   TODAY LEARNING STATUS
========================================================= */

function updateTodayLearningStatus() {

    const element =
        getElement(
            "todayLearningStatus"
        );


    if (!element) {
        return;
    }


    const today =
        getKigaliDate();


    const storedDate =
        localStorage.getItem(
            LEARNING_DATE_KEY
        );


    if (
        storedDate === today
    ) {

        element.textContent =
            "Learning completed today";

        element.dataset.status =
            "completed";

    } else {

        element.textContent =
            "Start learning today";

        element.dataset.status =
            "pending";
    }
}


/* =========================================================
   MARK LEARNING ACTIVITY
========================================================= */

function markLearningActivity() {

    const today =
        getKigaliDate();


    localStorage.setItem(
        LEARNING_DATE_KEY,
        today
    );


    updateTodayLearningStatus();
}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function setupQuickActions() {

    const buttons =
        document.querySelectorAll(
            "[data-coming-soon]"
        );


    buttons.forEach(
        button => {

            if (
                button.dataset.comingSoonBound
            ) {

                return;
            }


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    const strongElement =
                        button.querySelector(
                            "strong"
                        );


                    let title =
                        "This feature";


                    if (
                        strongElement
                    ) {

                        title =
                            strongElement
                                .textContent;

                    } else {

                        title =
                            button.getAttribute(
                                "data-coming-soon"
                            ) ||
                            "This feature";
                    }


                    alert(
                        `${title} is coming soon.`
                    );
                }
            );


            button.dataset.comingSoonBound =
                "true";
        }
    );
}


/* =========================================================
   NOTIFICATION BUTTON
========================================================= */

function setupNotificationButton() {

    const button =
        getElement(
            "notificationBtn"
        );


    if (!button) {
        return;
    }


    if (
        button.dataset.notificationBound
    ) {

        return;
    }


    button.addEventListener(
        "click",
        () => {

            const section =
                getElement(
                    "notificationList"
                );


            if (section) {

                section.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        }
    );


    button.dataset.notificationBound =
        "true";
}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutBtn =
        getElement(
            "logoutBtn"
        );


    if (!logoutBtn) {
        return;
    }


    if (
        logoutBtn.dataset.logoutBound
    ) {

        return;
    }


    logoutBtn.addEventListener(
        "click",
        () => {

            clearStudentSession();


            window.location.href =
                "../login.html?logout=true";
        }
    );


    logoutBtn.dataset.logoutBound =
        "true";
}


/* =========================================================
   HANDLE AUTH ERROR
========================================================= */

function handleAuthError(error) {

    console.error(
        "Authentication error:",
        error
    );


    clearStudentSession();


    window.location.replace(
        "../login.html"
    );
}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

async function refreshDashboard() {

    if (dashboardLoading) {
        return;
    }


    dashboardLoading =
        true;


    try {

        await Promise.allSettled([

            loadProfile(),

            loadCourse(),

            loadXP(),

            loadAttendance(),

            loadTodayAttendance(),

            loadAchievements(),

            loadLeaderboard(),

            loadNotifications(),

            loadClass(),

            loadTests(),

            loadPerformance(),

            loadPayments()

        ]);


    } finally {

        dashboardLoading =
            false;
    }
}


/* =========================================================
   INITIALIZE DASHBOARD
========================================================= */

async function initializeDashboard() {

    displayStoredStudent();


    updateTodayLearningStatus();


    setupLogout();


    setupQuickActions();


    setupAttendanceCheckIn();


    setupNotificationButton();


    await refreshDashboard();
}


/* =========================================================
   PAGE VISIBILITY REFRESH
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            refreshDashboard();
        }
    }
);


/* =========================================================
   LESSON ACTIVITY TRACKING
========================================================= */

document.addEventListener(
    "click",
    event => {

        const lessonButton =
            event.target.closest(
                ".continue-btn"
            );


        if (lessonButton) {

            markLearningActivity();
        }
    }
);


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeDashboard();
    }
);
/* =========================================================
   LINGUA DEUTSCH CONNECT
   TEACHER DASHBOARD
   ========================================================= */

const API_URL = "/api";

const teacherToken =
    localStorage.getItem("ldc_teacher_token");

const storedTeacher =
    localStorage.getItem("ldc_teacher");


/* =========================================================
   AUTH CHECK
========================================================= */

if (!teacherToken) {
    window.location.href = "teacher-login.html";
}


/* =========================================================
   STATE
========================================================= */

let teacherData = {};
let teacherClasses = [];
let selectedClassId = null;
let selectedLessonId = null;
let selectedAttendanceDate = getKigaliDate();


/* =========================================================
   RESTORE TEACHER
========================================================= */

try {

    teacherData = storedTeacher
        ? JSON.parse(storedTeacher)
        : {};

} catch {

    teacherData = {};

}


/* =========================================================
   GENERAL HELPERS
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);


}


function getKigaliDate() {

    try {

        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: "Africa/Kigali",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(
            new Date()
        );

    } catch {

        return new Date()
            .toISOString()
            .slice(0, 10);

    }

}


function formatDate(date) {

    if (!date) return "—";

    try {

        return new Date(
            `${date}T00:00:00`
        ).toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch {

        return date;

    }

}


function formatDateTime(value) {

    if (!value) return "—";

    try {

        return new Date(value)
            .toLocaleString(
                "en-GB",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    } catch {

        return value;

    }

}


function getFileName(file) {

    return (
        file?.name ||
        file?.file_name ||
        file?.filename ||
        file?.original_name ||
        file?.title ||
        "File"
    );

}


function getFileUrl(file) {

    return (
        file?.url ||
        file?.file_url ||
        file?.fileUrl ||
        file?.path ||
        file?.file_path ||
        file?.download_url ||
        file?.downloadUrl ||
        ""
    );

}


function getStudentId(student) {

    return (
        student?.id ||
        student?.student_id ||
        student?.studentId
    );

}


function getStudentName(student) {

    if (!student) return "Student";

    return (
        student.name ||
        student.full_name ||
        student.fullName ||
        [
            student.first_name,
            student.last_name
        ]
            .filter(Boolean)
            .join(" ") ||
        student.email ||
        "Student"
    );

}


/* =========================================================
   DASHBOARD MESSAGE
========================================================= */

function showDashboardMessage(
    message,
    type = "error"
) {

    const box =
        document.getElementById(
            "dashboardMessage"
        );

    if (!box) return;

    box.textContent = message;

    box.className =
        `dashboard-message ${type}`;

    box.hidden = false;

}


function hideDashboardMessage() {

    const box =
        document.getElementById(
            "dashboardMessage"
        );

    if (!box) return;

    box.hidden = true;

}


/* =========================================================
   API
========================================================= */

async function teacherFetch(
    endpoint,
    options = {}
) {

    const headers = {
        Accept: "application/json",
        ...(options.headers || {})
    };

    if (!(options.body instanceof FormData)) {

        headers["Content-Type"] =
            "application/json";

    }

    headers.Authorization =
        `Bearer ${teacherToken}`;

    let response;

    try {

        response = await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    } catch (networkError) {

        throw new Error(
            "Could not connect to the LDC server. Make sure the backend is running."
        );

    }

    const rawResponse =
        await response.text();

    let data = {};

    try {

        data = rawResponse
            ? JSON.parse(rawResponse)
            : {};

    } catch {

        throw new Error(
            "The server returned an invalid response."
        );

    }


    if (
        response.status === 401 ||
        response.status === 403
    ) {

        localStorage.removeItem(
            "ldc_teacher_token"
        );

        localStorage.removeItem(
            "ldc_teacher"
        );

        window.location.href =
            "teacher-login.html";

        throw new Error(
            "Your teacher session has expired."
        );

    }


    if (!response.ok) {

        throw new Error(
            data.message ||
            data.error ||
            "Something went wrong."
        );

    }


    return data;

}


/* =========================================================
   TEACHER PROFILE
========================================================= */

function getTeacherDisplayName() {

    return (
        teacherData.name ||
        teacherData.full_name ||
        teacherData.fullName ||
        [
            teacherData.first_name,
            teacherData.last_name
        ]
            .filter(Boolean)
            .join(" ") ||
        "Teacher"
    );

}


function updateTeacherProfile() {

    const name =
        getTeacherDisplayName();

    const nameElement =
        document.getElementById(
            "teacherName"
        );

    const profileName =
        document.getElementById(
            "teacherProfileName"
        );

    const emailElement =
        document.getElementById(
            "teacherProfileEmail"
        );

    const avatar =
        document.getElementById(
            "teacherAvatar"
        );


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    if (profileName) {

        profileName.textContent =
            name;

    }


    if (emailElement) {

        emailElement.textContent =
            teacherData.email ||
            "Teacher";

    }


    if (avatar) {

        avatar.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


async function loadTeacherProfile() {

    try {

        const data =
            await teacherFetch(
                "/teacher/profile"
            );

        if (data.teacher) {

            teacherData =
                data.teacher;

            localStorage.setItem(
                "ldc_teacher",
                JSON.stringify(
                    teacherData
                )
            );

            updateTeacherProfile();

        }

    } catch (error) {

        console.error(
            "Could not load teacher profile:",
            error
        );

    }

}


/* =========================================================
   CLASS HELPERS
========================================================= */

function getClassId(classItem) {

    return (
        classItem?.id ||
        classItem?.class_id ||
        classItem?.classId
    );

}


function getClassName(classItem) {

    return (
        classItem.name ||
        classItem.class_name ||
        classItem.className ||
        classItem.title ||
        classItem.course_name ||
        `${classItem.level || "German"} Class`
    );

}


function getClassLevel(classItem) {

    return (
        classItem.level ||
        classItem.course_level ||
        classItem.courseLevel ||
        classItem.course_name ||
        "German"
    );

}


function getStudentCount(classItem) {

    return Number(
        classItem.student_count ??
        classItem.students_count ??
        classItem.total_students ??
        classItem.students ??
        0
    );

}


function getLessonCount(classItem) {

    return Number(
        classItem.lesson_count ??
        classItem.lessons_count ??
        classItem.total_lessons ??
        0
    );

}


function getTestCount(classItem) {

    return Number(
        classItem.test_count ??
        classItem.tests_count ??
        classItem.total_tests ??
        0
    );

}


/* =========================================================
   CLASS CARD
========================================================= */

function renderClassCard(
    classItem
) {

    const classId =
        getClassId(classItem);

    const className =
        getClassName(classItem);

    const level =
        getClassLevel(classItem);

    const studentCount =
        getStudentCount(classItem);

    const lessonCount =
        getLessonCount(classItem);

    const schedule =
        classItem.schedule ||
        classItem.class_schedule ||
        classItem.classSchedule ||
        "Schedule not set";


    return `
        <article class="class-card">

            <div class="class-card-top">

                <span class="level-badge">
                    ${escapeHTML(level)}
                </span>

                <span class="class-status">
                    ${escapeHTML(
                        classItem.status ||
                        "active"
                    )}
                </span>

            </div>

            <h3>
                ${escapeHTML(className)}
            </h3>

            <p class="class-schedule">
                ${escapeHTML(schedule)}
            </p>

            <div class="class-card-stats">

                <div>
                    <strong>
                        ${studentCount}
                    </strong>

                    <span>
                        Students
                    </span>
                </div>

                <div>
                    <strong>
                        ${lessonCount}
                    </strong>

                    <span>
                        Lessons
                    </span>
                </div>

                <div>
                    <strong>
                        ${getTestCount(classItem)}
                    </strong>

                    <span>
                        Tests
                    </span>
                </div>

            </div>

            <button
                type="button"
                class="primary-btn class-open-btn"
                data-class-id="${escapeAttribute(classId)}"
            >
                <span>Manage Class</span>
                <span>→</span>
            </button>

        </article>
    `;

}


function renderClasses(
    containerId,
    classes
) {

    const container =
        document.getElementById(
            containerId
        );

    if (!container) return;


    if (!classes.length) {

        container.innerHTML = `
            <div class="empty-card">

                <div class="empty-icon">
                    ▦
                </div>

                <h3>
                    No classes assigned
                </h3>

                <p>
                    You currently do not have
                    any classes assigned to
                    your teacher account.
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML =
        classes
            .map(renderClassCard)
            .join("");


    container
        .querySelectorAll(
            ".class-open-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const classId =
                        button.dataset.classId;

                    if (!classId) return;

                    openClassManager(
                        classId
                    );

                }
            );

        });

}


/* =========================================================
   LOAD CLASSES
========================================================= */

async function loadTeacherClasses() {

    const overview =
        document.getElementById(
            "overviewClasses"
        );

    const allClasses =
        document.getElementById(
            "allClasses"
        );


    try {

        const data =
            await teacherFetch(
                "/teacher/classes"
            );

        teacherClasses =
            data.classes ||
            data.data ||
            [];


        renderClasses(
            "overviewClasses",
            teacherClasses.slice(0, 3)
        );

        renderClasses(
            "allClasses",
            teacherClasses
        );


        buildDynamicClassSelectors();


    } catch (error) {

        console.error(
            "Teacher classes error:",
            error
        );

        const errorHTML = `
            <div class="empty-card">

                <div class="empty-icon">
                    !
                </div>

                <h3>
                    Could not load classes
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;


        if (overview) {

            overview.innerHTML =
                errorHTML;

        }


        if (allClasses) {

            allClasses.innerHTML =
                errorHTML;

        }

    }

}


/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function safeNumber(
    value,
    fallback = 0
) {

    /*
       Never allow NaN to reach the dashboard UI.
    */

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;

}


async function loadTeacherDashboard() {

    try {

        const data =
            await teacherFetch(
                "/teacher/dashboard"
            );


        /*
           Backend response:

           {
               teacherId: 1,

               stats: {
                   classes: 1,
                   students: 2,
                   lessons: 0,
                   tests: 0
               },

               classes: [...]
           }
        */

        const stats =
            data?.stats ||
            data?.statistics ||
            data?.dashboard?.stats ||
            data?.dashboard ||
            {};


        const returnedClasses =
            Array.isArray(
                data?.classes
            )
                ? data.classes
                : [];


        const statClasses =
            document.getElementById(
                "statClasses"
            );

        const statStudents =
            document.getElementById(
                "statStudents"
            );

        const statLessons =
            document.getElementById(
                "statLessons"
            );

        const statTests =
            document.getElementById(
                "statTests"
            );


        /*
           CLASSES

           Prefer the backend numeric statistic.

           If for some reason the backend does not
           provide it, use the number of returned
           teacher-assigned classes.

           NEVER call Number() on the classes array.
        */

        const classCount =
            safeNumber(
                stats.classes ??
                stats.class_count ??
                stats.classCount,
                returnedClasses.length
            );


        /*
           STUDENTS
        */

        const studentCount =
            safeNumber(
                stats.students ??
                stats.student_count ??
                stats.studentCount,
                0
            );


        /*
           LESSONS
        */

        const lessonCount =
            safeNumber(
                stats.lessons ??
                stats.lesson_count ??
                stats.lessonCount,
                0
            );


        /*
           TESTS
        */

        const testCount =
            safeNumber(
                stats.tests ??
                stats.test_count ??
                stats.testCount,
                0
            );


        if (statClasses) {

            statClasses.textContent =
                String(
                    classCount
                );

        }


        if (statStudents) {

            statStudents.textContent =
                String(
                    studentCount
                );

        }


        if (statLessons) {

            statLessons.textContent =
                String(
                    lessonCount
                );

        }


        if (statTests) {

            statTests.textContent =
                String(
                    testCount
                );

        }


        /*
           Keep the local teacher class state
           synchronized with the backend response.

           The backend is responsible for deciding
           which classes this teacher may access.
        */

        if (
            returnedClasses.length &&
            teacherClasses.length === 0
        ) {

            teacherClasses =
                returnedClasses;

            buildDynamicClassSelectors();

        }


    } catch (error) {

        console.error(
            "Dashboard statistics error:",
            error
        );


        /*
           Never display NaN if the request fails.
        */

        const statClasses =
            document.getElementById(
                "statClasses"
            );

        const statStudents =
            document.getElementById(
                "statStudents"
            );

        const statLessons =
            document.getElementById(
                "statLessons"
            );

        const statTests =
            document.getElementById(
                "statTests"
            );


        if (statClasses) {

            statClasses.textContent =
                String(
                    Array.isArray(
                        teacherClasses
                    )
                        ? teacherClasses.length
                        : 0
                );

        }


        if (statStudents) {

            statStudents.textContent =
                "0";

        }


        if (statLessons) {

            statLessons.textContent =
                "0";

        }


        if (statTests) {

            statTests.textContent =
                "0";

        }

    }

}

/* =========================================================
   NAVIGATION
========================================================= */

function showSection(
    sectionName
) {

    const sections =
        document.querySelectorAll(
            ".dashboard-section"
        );

    const navLinks =
        document.querySelectorAll(
            ".teacher-nav-link"
        );


    sections.forEach(section => {

        const isTarget =
            section.id ===
            `section-${sectionName}`;

        section.hidden =
            !isTarget;

        section.classList.toggle(
            "active",
            isTarget
        );

    });


    navLinks.forEach(link => {

        link.classList.toggle(
            "active",
            link.dataset.section ===
            sectionName
        );

    });


    if (sectionName === "attendance") {

        renderAttendanceManager();

    }


    if (sectionName === "lessons") {

        renderLessonsManager();

    }


    if (sectionName === "tests") {

        renderTestsManager();

    }

}


function setupNavigation() {

    document
        .querySelectorAll(
            ".teacher-nav-link"
        )
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    showSection(
                        link.dataset.section
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-section-target]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showSection(
                        button.dataset.sectionTarget
                    );

                }
            );

        });

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const button =
        document.getElementById(
            "teacherLogoutBtn"
        );

    if (!button) return;


    button.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "ldc_teacher_token"
            );

            localStorage.removeItem(
                "ldc_teacher"
            );

            window.location.href =
                "teacher-login.html";

        }
    );

}


/* =========================================================
   DYNAMIC CLASS SELECTORS
========================================================= */

function classOptions(
    includeAll = false
) {

    let html =
        includeAll
            ? `<option value="">Select a class</option>`
            : "";

    teacherClasses.forEach(
        classItem => {

            const id =
                getClassId(classItem);

            html += `
                <option
                    value="${escapeAttribute(id)}"
                >
                    ${escapeHTML(
                        getClassName(
                            classItem
                        )
                    )}
                </option>
            `;

        }
    );

    return html;

}


function buildDynamicClassSelectors() {

    const ids = [
        "attendanceClassSelect",
        "lessonClassSelect",
        "testClassSelect",
        "reportClassSelect"
    ];


    ids.forEach(id => {

        const select =
            document.getElementById(id);

        if (!select) return;

        const current =
            select.value;

        select.innerHTML =
            classOptions(true);

        if (current) {

            select.value =
                current;

        }

    });

}


/* =========================================================
   CLASS MANAGER
========================================================= */

async function openClassManager(
    classId
) {

    selectedClassId =
        String(classId);

    showSection("classes");

    const container =
        document.getElementById(
            "allClasses"
        );

    if (!container) return;


    const classItem =
        teacherClasses.find(
            item =>
                String(
                    getClassId(item)
                ) ===
                String(classId)
        );


    container.innerHTML = `
        <div class="teacher-manager">

            <div class="manager-header">

                <div>
                    <span class="eyebrow">
                        CLASS MANAGEMENT
                    </span>

                    <h2>
                        ${escapeHTML(
                            classItem
                                ? getClassName(
                                    classItem
                                )
                                : "Class"
                        )}
                    </h2>

                    <p>
                        Manage students,
                        lessons and attendance.
                    </p>
                </div>

                <button
                    type="button"
                    class="outline-btn"
                    id="backToClassesBtn"
                >
                    ← All Classes
                </button>

            </div>

            <div
                id="classManagerContent"
            >
                <div class="loading-card">
                    Loading class...
                </div>
            </div>

        </div>
    `;


    document
        .getElementById(
            "backToClassesBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                renderClasses(
                    "allClasses",
                    teacherClasses
                );

            }
        );


    await loadClassStudents(
        classId
    );

}


async function loadClassStudents(
    classId
) {

    const container =
        document.getElementById(
            "classManagerContent"
        );

    if (!container) return;


    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/students`
            );


        const students =
            data.students ||
            data.data ||
            [];


        container.innerHTML = `

            <div class="manager-grid">

                <div class="manager-panel">

                    <div class="panel-heading">

                        <div>
                            <span class="eyebrow">
                                STUDENTS
                            </span>

                            <h3>
                                Class Students
                            </h3>
                        </div>

                        <strong>
                            ${students.length}
                        </strong>

                    </div>

                    <div class="student-manager-list">

                        ${
                            students.length
                                ? students.map(
                                    renderStudentRow
                                ).join("")
                                : `
                                    <div class="empty-card">
                                        <h3>
                                            No students
                                        </h3>

                                        <p>
                                            There are no
                                            active students
                                            in this class.
                                        </p>
                                    </div>
                                `
                        }

                    </div>

                </div>


                <div class="manager-panel">

                    <div class="panel-heading">

                        <div>
                            <span class="eyebrow">
                                QUICK ACTIONS
                            </span>

                            <h3>
                                Class Tools
                            </h3>
                        </div>

                    </div>

                    <div class="quick-action-grid">

                        <button
                            type="button"
                            class="primary-btn"
                            id="classAttendanceBtn"
                        >
                            ◷ Attendance
                        </button>

                        <button
                            type="button"
                            class="outline-btn"
                            id="classLessonsBtn"
                        >
                            ▤ Lessons
                        </button>

                        <button
                            type="button"
                            class="outline-btn"
                            id="classTestsBtn"
                        >
                            ✓ Tests
                        </button>

                    </div>

                </div>

            </div>
        `;


        document
            .getElementById(
                "classAttendanceBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    selectedClassId =
                        classId;

                    showSection(
                        "attendance"
                    );

                    renderAttendanceManager();

                }
            );


        document
            .getElementById(
                "classLessonsBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    selectedClassId =
                        classId;

                    showSection(
                        "lessons"
                    );

                    renderLessonsManager();

                }
            );


        document
            .getElementById(
                "classTestsBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    selectedClassId =
                        classId;

                    showSection(
                        "tests"
                    );

                    renderTestsManager();

                }
            );


    } catch (error) {

        container.innerHTML = `
            <div class="empty-card">

                <h3>
                    Could not load students
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;

    }

}


function renderStudentRow(
    student
) {

    const id =
        getStudentId(student);

    const name =
        getStudentName(student);

    const email =
        student.email ||
        student.email_address ||
        "No email";


    return `
        <div class="student-row">

            <div class="student-row-avatar">
                ${escapeHTML(
                    name
                        .charAt(0)
                        .toUpperCase()
                )}
            </div>

            <div class="student-row-info">

                <strong>
                    ${escapeHTML(name)}
                </strong>

                <span>
                    ${escapeHTML(email)}
                </span>

            </div>

            <button
                type="button"
                class="outline-btn student-view-btn"
                data-student-id="${escapeAttribute(id)}"
            >
                View
            </button>

        </div>
    `;

}


/* =========================================================
   LESSON MANAGER
========================================================= */

function renderLessonsManager() {

    const section =
        document.getElementById(
            "section-lessons"
        );

    if (!section) return;


    section.innerHTML = `

        <div class="section-heading">

            <div>
                <span class="eyebrow">
                    CONTENT MANAGEMENT
                </span>

                <h2>
                    Lessons & Materials
                </h2>

                <p>
                    Create lessons and attach
                    images, PDFs and other
                    learning files.
                </p>
            </div>

        </div>


        <div class="teacher-manager">

            <div class="manager-toolbar">

                <label>
                    <span>
                        Class
                    </span>

                    <select
                        id="lessonClassSelect"
                    >
                        ${classOptions(true)}
                    </select>

                </label>

                <button
                    type="button"
                    class="primary-btn"
                    id="newLessonBtn"
                >
                    + New Lesson
                </button>

            </div>


            <div
                id="lessonManagerContent"
                class="manager-content"
            >
                <div class="empty-card">
                    Select a class to manage lessons.
                </div>
            </div>

        </div>
    `;


    const select =
        document.getElementById(
            "lessonClassSelect"
        );


    if (
        selectedClassId &&
        select
    ) {

        select.value =
            String(
                selectedClassId
            );

        loadLessons(
            selectedClassId
        );

    }


    select?.addEventListener(
        "change",
        () => {

            selectedClassId =
                select.value || null;

            if (selectedClassId) {

                loadLessons(
                    selectedClassId
                );

            } else {

                document
                    .getElementById(
                        "lessonManagerContent"
                    )
                    .innerHTML = `
                        <div class="empty-card">
                            Select a class.
                        </div>
                    `;

            }

        }
    );


    document
        .getElementById(
            "newLessonBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                if (!selectedClassId) {

                    showDashboardMessage(
                        "Select a class first.",
                        "error"
                    );

                    return;

                }

                showCreateLessonForm();

            }
        );

}


async function loadLessons(
    classId
) {

    const container =
        document.getElementById(
            "lessonManagerContent"
        );

    if (!container) return;


    container.innerHTML = `
        <div class="loading-card">
            Loading lessons...
        </div>
    `;


    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/lessons`
            );


        const lessons =
            data.lessons ||
            data.data ||
            [];


        if (!lessons.length) {

            container.innerHTML = `
                <div class="empty-card">

                    <div class="empty-icon">
                        ▤
                    </div>

                    <h3>
                        No lessons yet
                    </h3>

                    <p>
                        Create the first lesson
                        for this class.
                    </p>

                    <button
                        type="button"
                        class="primary-btn"
                        id="emptyCreateLessonBtn"
                    >
                        + Create Lesson
                    </button>

                </div>
            `;


            document
                .getElementById(
                    "emptyCreateLessonBtn"
                )
                ?.addEventListener(
                    "click",
                    showCreateLessonForm
                );

            return;

        }


        container.innerHTML = `
            <div class="lesson-manager-list">

                ${lessons
                    .map(
                        renderLessonCard
                    )
                    .join("")}

            </div>
        `;


        container
            .querySelectorAll(
                ".lesson-open-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectedLessonId =
                            button.dataset.lessonId;

                        loadLessonMaterials(
                            selectedLessonId
                        );

                    }
                );

            });


    } catch (error) {

        container.innerHTML = `
            <div class="empty-card">

                <h3>
                    Could not load lessons
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;

    }

}


function renderLessonCard(
    lesson
) {

    const id =
        lesson.id ||
        lesson.lesson_id ||
        lesson.lessonId;

    const title =
        lesson.title ||
        lesson.name ||
        "Untitled Lesson";

    const description =
        lesson.description ||
        lesson.content ||
        lesson.notes ||
        "";

    const duration =
        lesson.duration ??
        lesson.lesson_duration ??
        "—";


    return `
        <article class="lesson-card">

            <div class="lesson-card-top">

                <span class="level-badge">
                    ${escapeHTML(
                        lesson.level ||
                        "Lesson"
                    )}
                </span>

                <span>
                    ${escapeHTML(
                        String(duration)
                    )} min
                </span>

            </div>

            <h3>
                ${escapeHTML(title)}
            </h3>

            <p>
                ${escapeHTML(
                    description
                )}
            </p>

            <button
                type="button"
                class="outline-btn lesson-open-btn"
                data-lesson-id="${escapeAttribute(id)}"
            >
                Manage Materials →
            </button>

        </article>
    `;

}


/* =========================================================
   CREATE LESSON
========================================================= */

function showCreateLessonForm() {

    const container =
        document.getElementById(
            "lessonManagerContent"
        );

    if (!container) return;


    container.innerHTML = `

        <div class="manager-panel">

            <div class="panel-heading">

                <div>
                    <span class="eyebrow">
                        NEW LESSON
                    </span>

                    <h3>
                        Create Lesson
                    </h3>
                </div>

                <button
                    type="button"
                    class="outline-btn"
                    id="cancelLessonBtn"
                >
                    Cancel
                </button>

            </div>


            <form
                id="createLessonForm"
                class="teacher-form"
            >

                <label>
                    <span>
                        Lesson title *
                    </span>

                    <input
                        type="text"
                        id="lessonTitle"
                        required
                        maxlength="200"
                        placeholder="e.g. Modalverben im Konjunktiv II"
                    >
                </label>


                <label>
                    <span>
                        Description
                    </span>

                    <textarea
                        id="lessonDescription"
                        rows="4"
                        placeholder="Describe what students will learn..."
                    ></textarea>
                </label>


                <div class="form-grid">

                    <label>
                        <span>
                            Duration
                        </span>

                        <input
                            type="number"
                            id="lessonDuration"
                            min="1"
                            value="60"
                        >
                    </label>

                    <label>
                        <span>
                            Order
                        </span>

                        <input
                            type="number"
                            id="lessonOrder"
                            min="0"
                            value="0"
                        >
                    </label>

                </div>


                <label>
                    <span>
                        Lesson content / notes
                    </span>

                    <textarea
                        id="lessonContent"
                        rows="8"
                        placeholder="Enter lesson notes..."
                    ></textarea>
                </label>


                <button
                    type="submit"
                    class="primary-btn"
                >
                    Create Lesson
                </button>

            </form>

        </div>
    `;


    document
        .getElementById(
            "cancelLessonBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                loadLessons(
                    selectedClassId
                );

            }
        );


    document
        .getElementById(
            "createLessonForm"
        )
        ?.addEventListener(
            "submit",
            createLesson
        );

}


async function createLesson(
    event
) {

    event.preventDefault();


    if (!selectedClassId) {

        showDashboardMessage(
            "Select a class first.",
            "error"
        );

        return;

    }


    const title =
        document.getElementById(
            "lessonTitle"
        )?.value.trim();


    const description =
        document.getElementById(
            "lessonDescription"
        )?.value.trim();


    const duration =
        Number(
            document.getElementById(
                "lessonDuration"
            )?.value || 60
        );


    const order =
        Number(
            document.getElementById(
                "lessonOrder"
            )?.value || 0
        );


    const content =
        document.getElementById(
            "lessonContent"
        )?.value.trim();


    if (!title) {

        showDashboardMessage(
            "Lesson title is required.",
            "error"
        );

        return;

    }


    const submitButton =
        event.target.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Creating...";

    }


    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(
                    selectedClassId
                )}/lessons`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        title,
                        description,
                        duration,
                        order,
                        content
                    })
                }
            );


        showDashboardMessage(
            data.message ||
            "Lesson created successfully.",
            "success"
        );


        await loadLessons(
            selectedClassId
        );


    } catch (error) {

        showDashboardMessage(
            error.message,
            "error"
        );


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Create Lesson";

        }

    }

}


/* =========================================================
   LESSON MATERIALS
========================================================= */

async function loadLessonMaterials(
    lessonId
) {

    const container =
        document.getElementById(
            "lessonManagerContent"
        );

    if (!container) return;


    container.innerHTML = `
        <div class="loading-card">
            Loading lesson materials...
        </div>
    `;


    try {

        const data =
            await teacherFetch(
                `/teacher/lessons/${encodeURIComponent(
                    lessonId
                )}/materials`
            );


        const materials =
            data.materials ||
            data.files ||
            data.data ||
            [];


        container.innerHTML = `

            <div class="manager-panel">

                <div class="panel-heading">

                    <div>
                        <span class="eyebrow">
                            LESSON MATERIALS
                        </span>

                        <h3>
                            Files & Images
                        </h3>

                        <p>
                            Upload PDFs, images,
                            documents and other
                            learning materials.
                        </p>
                    </div>

                    <button
                        type="button"
                        class="outline-btn"
                        id="backLessonsBtn"
                    >
                        ← Lessons
                    </button>

                </div>


                <form
                    id="materialUploadForm"
                    class="teacher-form"
                >

                    <label>
                        <span>
                            Material title
                        </span>

                        <input
                            type="text"
                            id="materialTitle"
                            maxlength="200"
                            placeholder="e.g. Grammatik PDF"
                        >
                    </label>


                    <label>
                        <span>
                            Description
                        </span>

                        <textarea
                            id="materialDescription"
                            rows="3"
                            placeholder="Optional description..."
                        ></textarea>
                    </label>


                    <label>
                        <span>
                            Choose file
                        </span>

                        <input
                            type="file"
                            id="materialFile"
                            required
                            accept="
                                image/*,
                                .pdf,
                                .doc,
                                .docx,
                                .ppt,
                                .pptx,
                                .xls,
                                .xlsx,
                                .txt,
                                .zip
                            "
                        >
                    </label>


                    <div
                        id="materialUploadPreview"
                        class="file-preview"
                    ></div>


                    <button
                        type="submit"
                        class="primary-btn"
                    >
                        Upload Material
                    </button>

                </form>


                <div class="panel-heading">
                    <div>
                        <span class="eyebrow">
                            UPLOADED
                        </span>

                        <h3>
                            Lesson Files
                        </h3>
                    </div>

                    <strong>
                        ${materials.length}
                    </strong>
                </div>


                <div
                    id="materialsList"
                    class="file-list"
                >

                    ${
                        materials.length
                            ? materials
                                .map(
                                    renderMaterial
                                )
                                .join("")
                            : `
                                <div class="empty-card">
                                    No materials uploaded yet.
                                </div>
                            `
                    }

                </div>

            </div>
        `;


        document
            .getElementById(
                "backLessonsBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    loadLessons(
                        selectedClassId
                    );

                }
            );


        document
            .getElementById(
                "materialFile"
            )
            ?.addEventListener(
                "change",
                previewSelectedFile
            );


        document
            .getElementById(
                "materialUploadForm"
            )
            ?.addEventListener(
                "submit",
                event => {

                    uploadLessonMaterial(
                        event,
                        lessonId
                    );

                }
            );


        container
            .querySelectorAll(
                ".material-delete-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteLessonMaterial(
                            lessonId,
                            button.dataset.materialId
                        );

                    }
                );

            });


    } catch (error) {

        container.innerHTML = `
            <div class="empty-card">

                <h3>
                    Could not load materials
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

                <button
                    type="button"
                    class="outline-btn"
                    id="retryMaterialsBtn"
                >
                    Try Again
                </button>

            </div>
        `;


        document
            .getElementById(
                "retryMaterialsBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    loadLessonMaterials(
                        lessonId
                    );

                }
            );

    }

}


function previewSelectedFile(
    event
) {

    const file =
        event.target.files?.[0];

    const preview =
        document.getElementById(
            "materialUploadPreview"
        );

    if (!preview) return;


    if (!file) {

        preview.innerHTML = "";

        return;

    }


    const sizeMB =
        (
            file.size /
            1024 /
            1024
        ).toFixed(2);


    preview.innerHTML = `
        <div class="selected-file">

            <strong>
                ${escapeHTML(
                    file.name
                )}
            </strong>

            <span>
                ${escapeHTML(
                    file.type ||
                    "Unknown type"
                )}
                ·
                ${sizeMB} MB
            </span>

        </div>
    `;


    if (
        file.type &&
        file.type.startsWith("image/")
    ) {

        const reader =
            new FileReader();

        reader.onload =
            function () {

                preview.innerHTML += `
                    <img
                        src="${reader.result}"
                        alt="Selected image preview"
                        class="material-image-preview"
                    >
                `;

            };

        reader.readAsDataURL(file);

    }

}


function renderMaterial(
    material
) {

    const id =
        material.id ||
        material.material_id ||
        material.materialId;


    const name =
        getFileName(material);


    const url =
        getFileUrl(material);


    const type =
        material.file_type ||
        material.mime_type ||
        material.mimeType ||
        "";


    const image =
        type.startsWith("image/") ||
        /\.(jpg|jpeg|png|gif|webp|svg)$/i
            .test(name);


    return `
        <article class="file-card">

            ${
                image && url
                    ? `
                        <img
                            src="${escapeAttribute(url)}"
                            alt="${escapeAttribute(name)}"
                            class="file-card-image"
                        >
                    `
                    : `
                        <div class="file-card-icon">
                            📄
                        </div>
                    `
            }


            <div class="file-card-info">

                <strong>
                    ${escapeHTML(name)}
                </strong>

                <span>
                    ${escapeHTML(
                        material.title ||
                        type ||
                        "Learning material"
                    )}
                </span>

            </div>


            <div class="file-card-actions">

                ${
                    url
                        ? `
                            <a
                                href="${escapeAttribute(url)}"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="outline-btn"
                            >
                                Open
                            </a>
                        `
                        : ""
                }


                <button
                    type="button"
                    class="danger-btn material-delete-btn"
                    data-material-id="${escapeAttribute(id)}"
                >
                    Delete
                </button>

            </div>

        </article>
    `;

}


async function uploadLessonMaterial(
    event,
    lessonId
) {

    event.preventDefault();


    const file =
        document.getElementById(
            "materialFile"
        )?.files?.[0];


    if (!file) {

        showDashboardMessage(
            "Please choose a file.",
            "error"
        );

        return;

    }


    const title =
        document.getElementById(
            "materialTitle"
        )?.value.trim();


    const description =
        document.getElementById(
            "materialDescription"
        )?.value.trim();


    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    formData.append(
        "title",
        title ||
        file.name
    );


    formData.append(
        "description",
        description || ""
    );


    const button =
        event.target.querySelector(
            'button[type="submit"]'
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Uploading...";

    }


    try {

        const data =
            await teacherFetch(
                `/teacher/lessons/${encodeURIComponent(
                    lessonId
                )}/materials`,
                {
                    method: "POST",
                    body: formData
                }
            );


        showDashboardMessage(
            data.message ||
            "Material uploaded successfully.",
            "success"
        );


        await loadLessonMaterials(
            lessonId
        );


    } catch (error) {

        showDashboardMessage(
            error.message,
            "error"
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Upload Material";

        }

    }

}


async function deleteLessonMaterial(
    lessonId,
    materialId
) {

    if (!materialId) return;


    const confirmed =
        window.confirm(
            "Delete this material?"
        );


    if (!confirmed) return;


    try {

        const data =
            await teacherFetch(
                `/teacher/lessons/${encodeURIComponent(
                    lessonId
                )}/materials/${encodeURIComponent(
                    materialId
                )}`,
                {
                    method: "DELETE"
                }
            );


        showDashboardMessage(
            data.message ||
            "Material deleted.",
            "success"
        );


        await loadLessonMaterials(
            lessonId
        );


    } catch (error) {

        showDashboardMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   ATTENDANCE MANAGER
========================================================= */

function renderAttendanceManager() {

    const section =
        document.getElementById(
            "section-attendance"
        );

    if (!section) return;


    section.innerHTML = `

        <div class="section-heading">

            <div>
                <span class="eyebrow">
                    STUDENT TRACKING
                </span>

                <h2>
                    Attendance
                </h2>

                <p>
                    Generate student check-in
                    codes and manage attendance.
                </p>
            </div>

        </div>


        <div class="teacher-manager">

            <div class="manager-toolbar">

                <label>
                    <span>
                        Class
                    </span>

                    <select
                        id="attendanceClassSelect"
                    >
                        ${classOptions(true)}
                    </select>
                </label>


                <label>
                    <span>
                        Date
                    </span>

                    <input
                        type="date"
                        id="attendanceDateInput"
                        value="${escapeAttribute(
                            selectedAttendanceDate
                        )}"
                    >
                </label>

            </div>


            <div
                id="attendanceManagerContent"
                class="manager-content"
            >

                <div class="empty-card">

                    <div class="empty-icon">
                        ◷
                    </div>

                    <h3>
                        Select a class
                    </h3>

                    <p>
                        Select a class to view
                        attendance and generate
                        today's check-in code.
                    </p>

                </div>

            </div>

        </div>
    `;


    const classSelect =
        document.getElementById(
            "attendanceClassSelect"
        );


    const dateInput =
        document.getElementById(
            "attendanceDateInput"
        );


    if (
        selectedClassId &&
        classSelect
    ) {

        classSelect.value =
            String(
                selectedClassId
            );

        loadAttendance(
            selectedClassId,
            selectedAttendanceDate
        );

    }


    classSelect?.addEventListener(
        "change",
        () => {

            selectedClassId =
                classSelect.value ||
                null;

            if (selectedClassId) {

                loadAttendance(
                    selectedClassId,
                    selectedAttendanceDate
                );

            }

        }
    );


    dateInput?.addEventListener(
        "change",
        () => {

            selectedAttendanceDate =
                dateInput.value ||
                getKigaliDate();

            if (selectedClassId) {

                loadAttendance(
                    selectedClassId,
                    selectedAttendanceDate
                );

            }

        }
    );

}


async function loadAttendance(
    classId,
    date
) {

    const container =
        document.getElementById(
            "attendanceManagerContent"
        );

    if (!container) return;


    container.innerHTML = `
        <div class="loading-card">
            Loading attendance...
        </div>
    `;


    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/attendance?date=${encodeURIComponent(
                    date
                )}`
            );


        const records =
            data.attendance ||
            data.records ||
            data.data ||
            [];


        const summary =
            data.summary ||
            {};


        container.innerHTML = `

            <div class="attendance-dashboard">


                <div class="attendance-code-panel">

                    <div>

                        <span class="eyebrow">
                            STUDENT CHECK-IN
                        </span>

                        <h3>
                            Attendance Code
                        </h3>

                        <p>
                            Generate a code that
                            students can enter
                            from their dashboard.
                        </p>

                    </div>


                    <div
                        id="activeAttendanceCode"
                        class="attendance-code-display"
                    >
                        Checking code...
                    </div>


                    <div class="attendance-code-actions">

                        <button
                            type="button"
                            class="primary-btn"
                            id="generateAttendanceCodeBtn"
                        >
                            Generate Code
                        </button>

                        <button
                            type="button"
                            class="outline-btn"
                            id="refreshAttendanceBtn"
                        >
                            Refresh
                        </button>

                    </div>

                </div>


                <div class="attendance-summary-grid">

                    ${renderAttendanceSummary(
                        summary,
                        records
                    )}

                </div>


                <div class="manager-panel">

                    <div class="panel-heading">

                        <div>
                            <span class="eyebrow">
                                ${escapeHTML(
                                    formatDate(date)
                                )}
                            </span>

                            <h3>
                                Student Attendance
                            </h3>
                        </div>

                    </div>


                    <div
                        id="attendanceRecords"
                        class="attendance-records"
                    >

                        ${
                            records.length
                                ? records
                                    .map(
                                        record =>
                                            renderAttendanceRecord(
                                                record,
                                                classId,
                                                date
                                            )
                                    )
                                    .join("")
                                : `
                                    <div class="empty-card">
                                        No attendance
                                        records yet.
                                    </div>
                                `
                        }

                    </div>

                </div>


                <div class="manager-panel">

                    <div class="panel-heading">

                        <div>
                            <span class="eyebrow">
                                HISTORY
                            </span>

                            <h3>
                                Attendance History
                            </h3>
                        </div>

                        <button
                            type="button"
                            class="outline-btn"
                            id="loadAttendanceHistoryBtn"
                        >
                            View History
                        </button>

                    </div>


                    <div
                        id="attendanceHistory"
                        class="hidden-manager-area"
                    ></div>

                </div>

            </div>
        `;


        await loadActiveAttendanceCode(
            classId,
            date
        );


        document
            .getElementById(
                "generateAttendanceCodeBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    createAttendanceCode(
                        classId,
                        date
                    );

                }
            );


        document
            .getElementById(
                "refreshAttendanceBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    loadAttendance(
                        classId,
                        date
                    );

                }
            );


        document
            .getElementById(
                "loadAttendanceHistoryBtn"
            )
            ?.addEventListener(
                "click",
                () => {

                    loadAttendanceHistory(
                        classId
                    );

                }
            );


        container
            .querySelectorAll(
                ".attendance-status-btn"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        markAttendance(
                            classId,
                            button.dataset.studentId,
                            button.dataset.status,
                            date
                        );

                    }
                );

            });


    } catch (error) {

        container.innerHTML = `
            <div class="empty-card">

                <h3>
                    Could not load attendance
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;

    }

}


function renderAttendanceSummary(
    summary,
    records
) {

    const total =
        Number(
            summary.total ??
            records.length ??
            0
        );


    const present =
        Number(
            summary.present ??
            records.filter(
                record =>
                    record.status ===
                    "present"
            ).length
        );


    const late =
        Number(
            summary.late ??
            records.filter(
                record =>
                    record.status ===
                    "late"
            ).length
        );


    const absent =
        Number(
            summary.absent ??
            records.filter(
                record =>
                    record.status ===
                    "absent"
            ).length
        );


    const excused =
        Number(
            summary.excused ??
            records.filter(
                record =>
                    record.status ===
                    "excused"
            ).length
        );


    const unmarked =
        Number(
            summary.unmarked ??
            Math.max(
                total -
                present -
                late -
                absent -
                excused,
                0
            )
        );


    return `

        <div class="attendance-stat">
            <span>Total</span>
            <strong>${total}</strong>
        </div>

        <div class="attendance-stat">
            <span>Present</span>
            <strong>${present}</strong>
        </div>

        <div class="attendance-stat">
            <span>Late</span>
            <strong>${late}</strong>
        </div>

        <div class="attendance-stat">
            <span>Absent</span>
            <strong>${absent}</strong>
        </div>

        <div class="attendance-stat">
            <span>Excused</span>
            <strong>${excused}</strong>
        </div>

        <div class="attendance-stat">
            <span>Unmarked</span>
            <strong>${unmarked}</strong>
        </div>

    `;

}


function normalizeAttendanceStatus(
    status
) {

    const value =
        String(
            status ||
            "unmarked"
        )
            .toLowerCase()
            .trim();


    if (
        [
            "present",
            "late",
            "absent",
            "excused"
        ].includes(value)
    ) {

        return value;

    }


    return "unmarked";

}


function renderAttendanceRecord(
    record,
    classId,
    date
) {

    const studentId =
        getStudentId(record) ||
        record.student_id;


    const name =
        getStudentName(
            record.student ||
            record
        );


    const status =
        normalizeAttendanceStatus(
            record.status
        );


    return `
        <div class="attendance-record">

            <div class="attendance-student">

                <div class="student-row-avatar">
                    ${escapeHTML(
                        name
                            .charAt(0)
                            .toUpperCase()
                    )}
                </div>

                <div>
                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <span>
                        ${escapeHTML(
                            record.email ||
                            record.student_email ||
                            ""
                        )}
                    </span>
                </div>

            </div>


            <span
                class="attendance-status status-${escapeAttribute(
                    status
                )}"
            >
                ${escapeHTML(
                    status
                )}
            </span>


            <div class="attendance-actions">

                <button
                    type="button"
                    class="attendance-status-btn"
                    data-student-id="${escapeAttribute(studentId)}"
                    data-status="present"
                >
                    Present
                </button>

                <button
                    type="button"
                    class="attendance-status-btn"
                    data-student-id="${escapeAttribute(studentId)}"
                    data-status="late"
                >
                    Late
                </button>

                <button
                    type="button"
                    class="attendance-status-btn"
                    data-student-id="${escapeAttribute(studentId)}"
                    data-status="absent"
                >
                    Absent
                </button>

                <button
                    type="button"
                    class="attendance-status-btn"
                    data-student-id="${escapeAttribute(studentId)}"
                    data-status="excused"
                >
                    Excused
                </button>

            </div>

        </div>
    `;

}


/* =========================================================
   ATTENDANCE CODE
========================================================= */

async function loadActiveAttendanceCode(
    classId,
    date
) {

    const display =
        document.getElementById(
            "activeAttendanceCode"
        );

    if (!display) return;


    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/attendance?date=${encodeURIComponent(
                    date
                )}`
            );


        const codes =
            data.activeCodes ||
            data.codes ||
            data.attendanceCodes ||
            [];


        const activeCode =
            Array.isArray(codes)
                ? codes.find(
                    code =>
                        String(
                            code.status ||
                            "active"
                        )
                            .toLowerCase() ===
                        "active"
                )
                : null;


        if (activeCode) {

            display.innerHTML = `
                <span>
                    ACTIVE CODE
                </span>

                <strong>
                    ${escapeHTML(
                        activeCode.code
                    )}
                </strong>

                <small>
                    ${
                        activeCode.expires_at ||
                        activeCode.expiresAt
                            ? `Expires ${escapeHTML(
                                formatDateTime(
                                    activeCode.expires_at ||
                                    activeCode.expiresAt
                                )
                            )}`
                            : "No expiry set"
                    }
                </small>

                <button
                    type="button"
                    class="danger-btn"
                    id="deactivateAttendanceCodeBtn"
                    data-code-id="${escapeAttribute(
                        activeCode.id
                    )}"
                >
                    Deactivate Code
                </button>
            `;


            document
                .getElementById(
                    "deactivateAttendanceCodeBtn"
                )
                ?.addEventListener(
                    "click",
                    () => {

                        deactivateAttendanceCode(
                            classId,
                            activeCode.id
                        );

                    }
                );


        } else {

            display.innerHTML = `
                <span>
                    NO ACTIVE CODE
                </span>

                <strong>
                    —
                </strong>

                <small>
                    Generate a code for students.
                </small>
            `;

        }


    } catch (error) {

        console.error(
            "Could not load attendance code:",
            error
        );


        display.innerHTML = `
            <span>
                ATTENDANCE CODE
            </span>

            <strong>
                —
            </strong>

            <small>
                Generate a new code.
            </small>
        `;

    }

}


async function createAttendanceCode(
    classId,
    date
) {

    const button =
        document.getElementById(
            "generateAttendanceCodeBtn"
        );


    if (button) {

        button.disabled =
            true;

        button.textContent =
            "Generating...";

    }


    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/attendance-code`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        attendanceDate:
                            date
                    })
                }
            );


        const code =
            data.code ||
            data.attendanceCode;


        if (code) {

            showDashboardMessage(
                `Attendance code created: ${code}`,
                "success"
            );

        } else {

            showDashboardMessage(
                data.message ||
                "Attendance code created.",
                "success"
            );

        }


        await loadAttendance(
            classId,
            date
        );


    } catch (error) {

        showDashboardMessage(
            error.message,
            "error"
        );


        if (button) {

            button.disabled =
                false;

            button.textContent =
                "Generate Code";

        }

    }

}


async function deactivateAttendanceCode(
    classId,
    codeId
) {

    if (!codeId) return;


    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/attendance-code/${encodeURIComponent(
                    codeId
                )}`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        status: "inactive"
                    })
                }
            );


        showDashboardMessage(
            data.message ||
            "Attendance code deactivated.",
            "success"
        );


        await loadAttendance(
            classId,
            selectedAttendanceDate
        );


    } catch (error) {

        showDashboardMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   MANUAL ATTENDANCE
========================================================= */

async function markAttendance(
    classId,
    studentId,
    status,
    date
) {

    if (!studentId) {

        showDashboardMessage(
            "Student ID is missing.",
            "error"
        );

        return;

    }


    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/attendance`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        studentId,
                        status,
                        attendanceDate:
                            date,
                        notes:
                            ""
                    })
                }
            );


        showDashboardMessage(
            data.message ||
            `Student marked ${status}.`,
            "success"
        );


        await loadAttendance(
            classId,
            date
        );


    } catch (error) {

        showDashboardMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   ATTENDANCE HISTORY
========================================================= */

async function loadAttendanceHistory(
    classId
) {

    const container =
        document.getElementById(
            "attendanceHistory"
        );

    if (!container) return;


    container.classList.remove(
        "hidden-manager-area"
    );


    container.innerHTML = `
        <div class="loading-card">
            Loading attendance history...
        </div>
    `;


    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/attendance/history`
            );


        const history =
            data.attendance ||
            data.history ||
            data.records ||
            data.data ||
            [];


        if (!history.length) {

            container.innerHTML = `
                <div class="empty-card">
                    No attendance history found.
                </div>
            `;

            return;

        }


        container.innerHTML = `

            <div class="attendance-history-list">

                ${history
                    .map(
                        record => `
                            <div class="history-row">

                                <div>
                                    <strong>
                                        ${escapeHTML(
                                            getStudentName(
                                                record.student ||
                                                record
                                            )
                                        )}
                                    </strong>

                                    <span>
                                        ${escapeHTML(
                                            formatDate(
                                                record.attendance_date ||
                                                record.attendanceDate
                                            )
                                        )}
                                    </span>
                                </div>

                                <span
                                    class="attendance-status status-${escapeAttribute(
                                        normalizeAttendanceStatus(
                                            record.status
                                        )
                                    )}"
                                >
                                    ${escapeHTML(
                                        normalizeAttendanceStatus(
                                            record.status
                                        )
                                    )}
                                </span>

                            </div>
                        `
                    )
                    .join("")}

            </div>
        `;


    } catch (error) {

        container.innerHTML = `
            <div class="empty-card">

                <h3>
                    Could not load history
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;

    }

}


/* =========================================================
   TEST MANAGER
========================================================= */

function renderTestsManager() {

    const section =
        document.getElementById(
            "section-tests"
        );

    if (!section) return;


    section.innerHTML = `

        <div class="section-heading">

            <div>
                <span class="eyebrow">
                    ASSESSMENT
                </span>

                <h2>
                    Tests & Results
                </h2>

                <p>
                    Manage tests and inspect
                    student performance.
                </p>
            </div>

        </div>


        <div class="teacher-manager">

            <div class="manager-toolbar">

                <label>
                    <span>
                        Class
                    </span>

                    <select
                        id="testClassSelect"
                    >
                        ${classOptions(true)}
                    </select>
                </label>

            </div>


            <div
                id="testsManagerContent"
                class="manager-content"
            >

                <div class="empty-card">

                    <div class="empty-icon">
                        ✓
                    </div>

                    <h3>
                        Select a class
                    </h3>

                    <p>
                        Choose a class to view
                        available tests and
                        student performance.
                    </p>

                </div>

            </div>

        </div>
    `;


    const select =
        document.getElementById(
            "testClassSelect"
        );


    if (
        selectedClassId &&
        select
    ) {

        select.value =
            String(
                selectedClassId
            );

        loadTeacherTests(
            selectedClassId
        );

    }


    select?.addEventListener(
        "change",
        () => {

            selectedClassId =
                select.value ||
                null;

            if (selectedClassId) {

                loadTeacherTests(
                    selectedClassId
                );

            }

        }
    );

}


async function loadTeacherTests(
    classId
) {

    const container =
        document.getElementById(
            "testsManagerContent"
        );

    if (!container) return;


    container.innerHTML = `
        <div class="loading-card">
            Loading tests...
        </div>
    `;


    /*
       The teacher backend exposes test/result
       functionality. We first try the class
       test endpoint used by the teacher API.
    */

    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/tests`
            );


        const tests =
            data.tests ||
            data.data ||
            [];


        if (!tests.length) {

            container.innerHTML = `
                <div class="empty-card">

                    <div class="empty-icon">
                        ✓
                    </div>

                    <h3>
                        No tests found
                    </h3>

                    <p>
                        There are currently no
                        tests available for
                        this class.
                    </p>

                </div>
            `;

            return;

        }


        container.innerHTML = `
            <div class="test-manager-list">

                ${tests
                    .map(
                        renderTestCard
                    )
                    .join("")}

            </div>
        `;


    } catch (error) {

        container.innerHTML = `
            <div class="empty-card">

                <h3>
                    Test management
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

                <p>
                    The teacher test API is
                    available on the backend,
                    but this dashboard will
                    only call confirmed routes.
                </p>

            </div>
        `;

    }

}


function renderTestCard(
    test
) {

    const id =
        test.id ||
        test.test_id;


    return `
        <article class="test-card">

            <div>

                <span class="eyebrow">
                    TEST
                </span>

                <h3>
                    ${escapeHTML(
                        test.title ||
                        test.name ||
                        "Untitled Test"
                    )}
                </h3>

                <p>
                    ${escapeHTML(
                        test.description ||
                        ""
                    )}
                </p>

            </div>

            <div>

                <strong>
                    ${
                        test.total_marks ??
                        test.totalMarks ??
                        "—"
                    }
                </strong>

                <span>
                    Total marks
                </span>

            </div>

            <button
                type="button"
                class="outline-btn teacher-test-open-btn"
                data-test-id="${escapeAttribute(id)}"
            >
                View Results →
            </button>

        </article>
    `;

}


/* =========================================================
   PERFORMANCE / REPORTS
========================================================= */

async function loadTeacherPerformance(
    classId
) {

    const container =
        document.getElementById(
            "testsManagerContent"
        );

    if (!container) return;


    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/performance`
            );


        const performance =
            data.performance ||
            data.students ||
            data.data ||
            [];


        if (!Array.isArray(performance)) {

            return;

        }


        const reportHTML = `
            <div class="manager-panel">

                <div class="panel-heading">

                    <div>
                        <span class="eyebrow">
                            CLASS PERFORMANCE
                        </span>

                        <h3>
                            Student Reports
                        </h3>
                    </div>

                </div>


                <div class="performance-list">

                    ${
                        performance.length
                            ? performance
                                .map(
                                    renderPerformanceRow
                                )
                                .join("")
                            : `
                                <div class="empty-card">
                                    No performance
                                    data available.
                                </div>
                            `
                    }

                </div>

            </div>
        `;


        container.insertAdjacentHTML(
            "beforeend",
            reportHTML
        );


    } catch (error) {

        console.error(
            "Performance error:",
            error
        );

    }

}


function renderPerformanceRow(
    student
) {

    const name =
        getStudentName(
            student.student ||
            student
        );


    const score =
        student.average ??
        student.average_score ??
        student.score ??
        student.percentage ??
        "—";


    return `
        <div class="performance-row">

            <div class="student-row-info">

                <strong>
                    ${escapeHTML(name)}
                </strong>

            </div>

            <strong>
                ${escapeHTML(
                    String(score)
                )}
            </strong>

        </div>
    `;

}


/* =========================================================
   STUDENT VIEW
========================================================= */

async function loadStudentDetails(
    studentId
) {

    try {

        const data =
            await teacherFetch(
                `/teacher/students/${encodeURIComponent(
                    studentId
                )}`
            );


        const student =
            data.student ||
            data;


        const modal =
            document.createElement(
                "div"
            );


       modal.className =
    "student-modal";


        modal.innerHTML = `

            <div class="teacher-modal-backdrop"></div>

            <div class="teacher-modal-content">

                <div class="panel-heading">

                    <div>
                        <span class="eyebrow">
                            STUDENT
                        </span>

                        <h2>
                            ${escapeHTML(
                                getStudentName(
                                    student
                                )
                            )}
                        </h2>
                    </div>

                    <button
                        type="button"
                        class="outline-btn"
                        id="closeStudentModal"
                    >
                        Close
                    </button>

                </div>


                <div class="student-detail-grid">

                    <div>
                        <span>
                            Email
                        </span>

                        <strong>
                            ${escapeHTML(
                                student.email ||
                                "—"
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Level
                        </span>

                        <strong>
                            ${escapeHTML(
                                student.level ||
                                student.course_level ||
                                "—"
                            )}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Status
                        </span>

                        <strong>
                            ${escapeHTML(
                                student.status ||
                                student.account_status ||
                                "—"
                            )}
                        </strong>
                    </div>

                </div>

            </div>
        `;


        document.body.appendChild(
            modal
        );


        const close = () => {

            modal.remove();

        };


        modal
            .querySelector(
                "#closeStudentModal"
            )
            ?.addEventListener(
                "click",
                close
            );


        modal
            .querySelector(
                ".teacher-modal-backdrop"
            )
            ?.addEventListener(
                "click",
                close
            );


    } catch (error) {

        showDashboardMessage(
            error.message,
            "error"
        );

    }

}


/* =========================================================
   GLOBAL STUDENT BUTTON EVENTS
========================================================= */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".student-view-btn"
            );

        if (!button) return;


        const studentId =
            button.dataset.studentId;


        if (studentId) {

            loadStudentDetails(
                studentId
            );

        }

    }
);


/* =========================================================
   BUILD TEACHER UI STYLES
   This allows the dynamic manager to work
   even before teacher.css is expanded.
========================================================= */

function injectTeacherManagerStyles() {

    if (
        document.getElementById(
            "ldcTeacherDynamicStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "ldcTeacherDynamicStyles";


    style.textContent = `

        .teacher-manager {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .manager-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            align-items: end;
            justify-content: space-between;
        }

        .manager-toolbar label,
        .teacher-form label {
            display: flex;
            flex-direction: column;
            gap: 7px;
            min-width: 180px;
        }

        .manager-toolbar label > span,
        .teacher-form label > span {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .06em;
        }

        .manager-toolbar select,
        .manager-toolbar input,
        .teacher-form input,
        .teacher-form select,
        .teacher-form textarea {
            width: 100%;
            box-sizing: border-box;
            padding: 12px 14px;
            border: 1px solid rgba(255,255,255,.15);
            border-radius: 10px;
            background: rgba(255,255,255,.05);
            color: inherit;
            font: inherit;
        }

        .teacher-form {
            display: flex;
            flex-direction: column;
            gap: 18px;
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 16px;
        }

        .manager-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.4fr) minmax(280px, .8fr);
            gap: 20px;
        }

        .manager-panel,
        .attendance-code-panel {
            border: 1px solid rgba(255,255,255,.1);
            border-radius: 16px;
            padding: 22px;
            background: rgba(255,255,255,.03);
        }

        .panel-heading,
        .manager-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
        }

        .panel-heading h3,
        .manager-header h2 {
            margin: 5px 0;
        }

        .panel-heading p,
        .manager-header p {
            margin: 5px 0 0;
            opacity: .7;
        }

        .quick-action-grid {
            display: grid;
            gap: 12px;
        }

        .student-manager-list,
        .attendance-records,
        .file-list,
        .attendance-history-list,
        .performance-list,
        .lesson-manager-list,
        .test-manager-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .student-row,
        .attendance-record,
        .history-row,
        .performance-row,
        .file-card,
        .lesson-card,
        .test-card {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 16px;
            border: 1px solid rgba(255,255,255,.09);
            border-radius: 13px;
            background: rgba(255,255,255,.025);
        }

        .student-row-info,
        .file-card-info,
        .attendance-student {
            flex: 1;
            min-width: 0;
        }

        .student-row-info,
        .file-card-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .student-row-info span,
        .file-card-info span,
        .attendance-student span {
            opacity: .6;
            font-size: 13px;
        }

        .student-row-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            font-weight: 700;
            background: rgba(255,255,255,.08);
            flex-shrink: 0;
        }

        .attendance-dashboard {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .attendance-code-display {
            margin: 22px 0;
            padding: 24px;
            border-radius: 14px;
            text-align: center;
            background: rgba(255,255,255,.05);
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .attendance-code-display span {
            font-size: 11px;
            letter-spacing: .12em;
            font-weight: 700;
            opacity: .6;
        }

        .attendance-code-display strong {
            font-size: clamp(28px, 5vw, 48px);
            letter-spacing: .12em;
        }

        .attendance-code-display small {
            opacity: .65;
        }

        .attendance-code-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }

        .attendance-summary-grid {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 12px;
        }

        .attendance-stat {
            padding: 16px;
            border: 1px solid rgba(255,255,255,.09);
            border-radius: 12px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .attendance-stat span {
            font-size: 12px;
            opacity: .6;
        }

        .attendance-stat strong {
            font-size: 25px;
        }

        .attendance-student {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .attendance-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .attendance-status-btn {
            border: 1px solid rgba(255,255,255,.1);
            border-radius: 8px;
            padding: 7px 9px;
            background: transparent;
            color: inherit;
            cursor: pointer;
            font-size: 12px;
        }

        .attendance-status {
            padding: 6px 9px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .status-present {
            background: rgba(60,200,120,.15);
        }

        .status-late {
            background: rgba(240,190,60,.15);
        }

        .status-absent {
            background: rgba(230,70,70,.15);
        }

        .status-excused {
            background: rgba(100,150,240,.15);
        }

        .status-unmarked {
            background: rgba(255,255,255,.08);
        }

        .file-card {
            align-items: center;
        }

        .file-card-icon {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            border-radius: 10px;
            background: rgba(255,255,255,.06);
            flex-shrink: 0;
        }

        .file-card-image {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 10px;
            flex-shrink: 0;
        }

        .file-card-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
        }

        .selected-file {
            padding: 12px;
            border-radius: 10px;
            background: rgba(255,255,255,.05);
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .selected-file span {
            opacity: .65;
            font-size: 12px;
        }

        .material-image-preview {
            display: block;
            max-width: 260px;
            max-height: 180px;
            object-fit: contain;
            margin-top: 10px;
            border-radius: 10px;
        }

        .lesson-manager-list,
        .test-manager-list {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .lesson-card,
        .test-card {
            flex-direction: column;
            align-items: flex-start;
        }

        .lesson-card > div,
        .test-card > div {
            width: 100%;
        }

        .lesson-card p,
        .test-card p {
            opacity: .7;
        }

        .hidden-manager-area {
            display: none;
        }

        .hidden-manager-area:not(.hidden-manager-area) {
            display: block;
        }

        .danger-btn {
            border: 1px solid rgba(230,70,70,.35);
            background: rgba(230,70,70,.08);
            color: inherit;
            border-radius: 8px;
            padding: 8px 11px;
            cursor: pointer;
        }

        .teacher-modal {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: grid;
            place-items: center;
            padding: 20px;
        }

        .teacher-modal-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,.75);
        }

        .teacher-modal-content {
            position: relative;
            width: min(680px, 100%);
            max-height: 90vh;
            overflow: auto;
            border-radius: 18px;
            padding: 24px;
            background: #111;
            border: 1px solid rgba(255,255,255,.12);
        }

        .student-detail-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 14px;
        }

        .student-detail-grid > div {
            display: flex;
            flex-direction: column;
            gap: 5px;
            padding: 15px;
            border-radius: 10px;
            background: rgba(255,255,255,.04);
        }

        .student-detail-grid span {
            font-size: 11px;
            opacity: .6;
            text-transform: uppercase;
        }

        @media (max-width: 900px) {

            .manager-grid {
                grid-template-columns: 1fr;
            }

            .attendance-summary-grid {
                grid-template-columns: repeat(3, 1fr);
            }

            .lesson-manager-list,
            .test-manager-list {
                grid-template-columns: 1fr;
            }

        }

        @media (max-width: 600px) {

            .form-grid,
            .student-detail-grid {
                grid-template-columns: 1fr;
            }

            .attendance-summary-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            .attendance-record,
            .student-row,
            .file-card {
                align-items: flex-start;
                flex-direction: column;
            }

            .attendance-actions,
            .file-card-actions {
                width: 100%;
            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   FIX HISTORY VISIBILITY
========================================================= */

function showHistoryArea(
    element
) {

    if (!element) return;

    element.classList.remove(
        "hidden-manager-area"
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeTeacherDashboard() {

   

    updateTeacherProfile();

    setupNavigation();

    setupLogout();

await Promise.all([
    loadTeacherProfile()
]);

await loadTeacherClasses();

await loadTeacherDashboard();

    hideDashboardMessage();


    console.log(
        "LDC Teacher Dashboard ready."
    );

}


initializeTeacherDashboard();
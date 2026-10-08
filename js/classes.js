"use strict";

/* =========================================================
   LINGUA DEUTSCH CONNECT
   STUDENT CLASSES
========================================================= */

const API_URL = "http://localhost:5000/api";

const STUDENT_TOKEN_KEY = "ldc_student_token";
const STUDENT_DATA_KEY = "ldc_student";

let allClasses = [];
let currentStudent = null;


/* =========================================================
   DOM
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message, type = "info") {

    const box = $("classesMessage");

    if (!box) return;

    box.textContent = message;

    box.className = "page-message show";

    if (type === "success") {
        box.classList.add("success");
    }

    if (type === "error") {
        box.classList.add("error");
    }

    if (type === "info") {
        box.classList.add("info");
    }
}


/* =========================================================
   STORAGE
========================================================= */

function getToken() {
    return localStorage.getItem(
        STUDENT_TOKEN_KEY
    );
}


function getStudent() {

    try {

        const stored =
            localStorage.getItem(
                STUDENT_DATA_KEY
            );

        return stored
            ? JSON.parse(stored)
            : null;

    } catch (error) {

        console.error(
            "Could not read student data:",
            error
        );

        return null;
    }
}


/* =========================================================
   API
========================================================= */

async function apiFetch(
    endpoint,
    options = {}
) {

    const token = getToken();

    if (!token) {
        redirectToLogin();
        throw new Error("Not authenticated.");
    }

    const config = {

        method:
            options.method || "GET",

        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }

    };

    config.headers.Authorization =
        `Bearer ${token}`;

    if (options.body !== undefined) {

        config.body =
            typeof options.body === "string"
                ? options.body
                : JSON.stringify(
                    options.body
                );
    }

    let response;

    try {

        response = await fetch(
            `${API_URL}${endpoint}`,
            config
        );

    } catch (error) {

        throw new Error(
            "Could not connect to the LDC server. Make sure the backend is running."
        );
    }

    let data = null;

    try {

        data = await response.json();

    } catch (error) {

        data = null;
    }

    if (!response.ok) {

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            localStorage.removeItem(
                STUDENT_TOKEN_KEY
            );

            localStorage.removeItem(
                STUDENT_DATA_KEY
            );

            redirectToLogin();

            throw new Error(
                "Your session has expired."
            );
        }

        throw new Error(
            data?.message ||
            data?.error ||
            `Request failed (${response.status}).`
        );
    }

    return data;
}


/* =========================================================
   HELPERS
========================================================= */

function getData(response) {

    if (!response) {
        return null;
    }

    return response.data !== undefined
        ? response.data
        : response;
}


function getArray(
    response,
    keys = []
) {

    if (Array.isArray(response)) {
        return response;
    }

    const data =
        getData(response);

    if (Array.isArray(data)) {
        return data;
    }

    for (const key of keys) {

        if (Array.isArray(data?.[key])) {
            return data[key];
        }

        if (Array.isArray(response?.[key])) {
            return response[key];
        }
    }

    return [];
}


function firstDefined(...values) {

    for (const value of values) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {
            return value;
        }
    }

    return null;
}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function redirectToLogin() {
    window.location.href = "login.html";
}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    localStorage.removeItem(
        STUDENT_TOKEN_KEY
    );

    localStorage.removeItem(
        STUDENT_DATA_KEY
    );

    window.location.href =
        "login.html";
}


/* =========================================================
   LOAD CLASSES
========================================================= */

async function loadClasses() {

    const grid =
        $("classGrid");

    if (!grid) return;

    grid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            Loading classes...
        </div>
    `;

    try {

        /*
            Existing student backend contract:
            GET /student/classes
        */

        const response =
            await apiFetch(
                "/student/classes"
            );

        allClasses =
            getArray(
                response,
                [
                    "classes",
                    "enrollments",
                    "items",
                    "results"
                ]
            );

        updateStatistics();

        renderClasses();

    } catch (error) {

        console.error(
            "Could not load classes:",
            error
        );

        grid.innerHTML = `
            <div class="empty-state">

                <strong>
                    Unable to load your classes
                </strong>

                ${escapeHTML(
                    error.message
                )}

            </div>
        `;
    }
}


/* =========================================================
   CLASS NORMALIZATION
========================================================= */

function normalizeClass(classItem) {

    return {

        id: firstDefined(
            classItem.id,
            classItem.classId,
            classItem.class_id
        ),

        name: firstDefined(
            classItem.name,
            classItem.className,
            classItem.class_name,
            "LDC Class"
        ),

        level: firstDefined(
            classItem.level,
            classItem.courseLevel,
            classItem.course_level,
            "—"
        ),

        description: firstDefined(
            classItem.description,
            classItem.classDescription,
            ""
        ),

        teacher: firstDefined(
            classItem.teacherName,
            classItem.teacher_name,
            classItem.teacher?.fullName,
            classItem.teacher?.full_name,
            classItem.teacher?.name,
            "LDC Teacher"
        ),

        room: firstDefined(
            classItem.room,
            classItem.roomName,
            classItem.room_name,
            "—"
        ),

        schedule: firstDefined(
            classItem.schedule,
            classItem.classSchedule,
            classItem.class_schedule,
            "Schedule not set"
        ),

        startDate: firstDefined(
            classItem.startDate,
            classItem.start_date
        ),

        endDate: firstDefined(
            classItem.endDate,
            classItem.end_date
        ),

        maxStudents: Number(
            firstDefined(
                classItem.maxStudents,
                classItem.max_students,
                0
            )
        ),

        studentCount: Number(
            firstDefined(
                classItem.studentCount,
                classItem.student_count,
                classItem.enrolledStudents,
                classItem.enrolled_students,
                0
            )
        ),

        status: firstDefined(
            classItem.status,
            "active"
        )
    };
}


/* =========================================================
   FILTERS
========================================================= */

function getFilteredClasses() {

    const search =
        (
            $("classSearch")?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    const level =
        $("levelFilter")?.value ||
        "all";

    const status =
        $("statusFilter")?.value ||
        "all";

    return allClasses
        .map(normalizeClass)
        .filter(classItem => {

            const searchable = [
                classItem.name,
                classItem.level,
                classItem.teacher,
                classItem.room,
                classItem.schedule,
                classItem.description
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                !search ||
                searchable.includes(search);

            const matchesLevel =
                level === "all" ||
                classItem.level
                    .toString()
                    .toUpperCase()
                    .includes(
                        level.toUpperCase()
                    );

            const matchesStatus =
                status === "all" ||
                normalizeStatus(
                    classItem.status
                ) === status;

            return (
                matchesSearch &&
                matchesLevel &&
                matchesStatus
            );
        });
}


function normalizeStatus(status) {

    return String(
        status || ""
    )
        .toLowerCase()
        .replace(/[_-]/g, " ")
        .trim();
}


/* =========================================================
   RENDER CLASSES
========================================================= */

function renderClasses() {

    const grid =
        $("classGrid");

    if (!grid) return;

    const classes =
        getFilteredClasses();

    if (!classes.length) {

        grid.innerHTML = `
            <div class="empty-state"
                 style="grid-column:1/-1;">

                <strong>
                    No classes found
                </strong>

                Try changing your search
                or filters.

            </div>
        `;

        return;
    }

    grid.innerHTML =
        classes
            .map(renderClassCard)
            .join("");
}


/* =========================================================
   CLASS CARD
========================================================= */

function renderClassCard(classItem) {

    const capacity =
        classItem.maxStudents > 0
            ? Math.min(
                100,
                (
                    classItem.studentCount /
                    classItem.maxStudents
                ) * 100
            )
            : 0;

    const status =
        formatStatus(
            classItem.status
        );

    return `
        <article
            class="class-card"
            data-class-id="${escapeHTML(
                classItem.id
            )}"
        >

            <span class="class-level">
                ${escapeHTML(
                    classItem.level
                )}
            </span>

            <h3>
                ${escapeHTML(
                    classItem.name
                )}
            </h3>

            <p class="class-description">
                ${escapeHTML(
                    classItem.description ||
                    "German course at Lingua Deutsch Connect."
                )}
            </p>

            <div class="class-info">

                <div class="class-info-row">
                    <span>Teacher</span>
                    <span>
                        ${escapeHTML(
                            classItem.teacher
                        )}
                    </span>
                </div>

                <div class="class-info-row">
                    <span>Schedule</span>
                    <span>
                        ${escapeHTML(
                            classItem.schedule
                        )}
                    </span>
                </div>

                <div class="class-info-row">
                    <span>Room</span>
                    <span>
                        ${escapeHTML(
                            classItem.room
                        )}
                    </span>
                </div>

                <div class="class-info-row">
                    <span>Status</span>
                    <span>
                        ${escapeHTML(status)}
                    </span>
                </div>

                <div class="class-info-row">
                    <span>Students</span>
                    <span>
                        ${escapeHTML(
                            classItem.studentCount
                        )}
                        /
                        ${escapeHTML(
                            classItem.maxStudents ||
                            "—"
                        )}
                    </span>
                </div>

            </div>

            <div class="capacity-bar">

                <div
                    class="capacity-fill"
                    style="width:${capacity}%"
                ></div>

            </div>

            <div class="class-actions">

                <button
                    type="button"
                    class="class-btn primary"
                    data-attendance-class="${escapeHTML(
                        classItem.id
                    )}"
                >
                    Attendance
                </button>

                <button
                    type="button"
                    class="class-btn secondary"
                    data-class-details="${escapeHTML(
                        classItem.id
                    )}"
                >
                    Details
                </button>

            </div>

        </article>
    `;
}


/* =========================================================
   STATUS
========================================================= */

function formatStatus(status) {

    switch (
        normalizeStatus(status)
    ) {

        case "active":
            return "Active";

        case "upcoming":
            return "Upcoming";

        case "completed":
            return "Completed";

        case "inactive":
            return "Inactive";

        default:
            return status || "Active";
    }
}


/* =========================================================
   STATISTICS
========================================================= */

function updateStatistics() {

    const classes =
        allClasses.map(
            normalizeClass
        );

    const active =
        classes.filter(
            item =>
                normalizeStatus(
                    item.status
                ) === "active"
        );

    if ($("totalClasses")) {

        $("totalClasses").textContent =
            classes.length;
    }

    if ($("activeClasses")) {

        $("activeClasses").textContent =
            active.length;
    }

    if ($("currentLevel")) {

        const level =
            firstDefined(
                currentStudent?.level,
                classes[0]?.level,
                "—"
            );

        $("currentLevel").textContent =
            level;
    }

    /*
        If the student profile/dashboard already contains
        an attendance percentage, use it here.
    */

    if ($("classAttendance")) {

        const percentage =
            firstDefined(
                currentStudent?.attendancePercentage,
                currentStudent?.attendance_percentage,
                currentStudent?.attendanceRate,
                currentStudent?.attendance_rate,
                0
            );

        $("classAttendance").textContent =
            `${Number(percentage).toFixed(0)}%`;
    }
}


/* =========================================================
   DETAILS
========================================================= */

function openClassDetails(classId) {

    const classItem =
        allClasses
            .map(normalizeClass)
            .find(
                item =>
                    String(item.id) ===
                    String(classId)
            );

    if (!classItem) {
        return;
    }

    /*
        For now the most useful action is to take the student
        directly to attendance for this class.

        The attendance system itself is controlled by the
        teacher-generated attendance code.
    */

    window.location.href =
        `attendance.html?class=${encodeURIComponent(
            classItem.id
        )}`;
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEvents() {

    const search =
        $("classSearch");

    if (search) {

        search.addEventListener(
            "input",
            renderClasses
        );
    }


    const level =
        $("levelFilter");

    if (level) {

        level.addEventListener(
            "change",
            renderClasses
        );
    }


    const status =
        $("statusFilter");

    if (status) {

        status.addEventListener(
            "change",
            renderClasses
        );
    }


    const logoutButton =
        $("logoutBtn");

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );
    }


    const grid =
        $("classGrid");

    if (grid) {

        grid.addEventListener(
            "click",
            event => {

                const attendanceButton =
                    event.target.closest(
                        "[data-attendance-class]"
                    );

                if (attendanceButton) {

                    const classId =
                        attendanceButton.dataset
                            .attendanceClass;

                    window.location.href =
                        `attendance.html?class=${encodeURIComponent(
                            classId
                        )}`;

                    return;
                }


                const detailsButton =
                    event.target.closest(
                        "[data-class-details]"
                    );

                if (detailsButton) {

                    openClassDetails(
                        detailsButton.dataset
                            .classDetails
                    );
                }

            }
        );
    }
}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeClassesPage() {

    const token =
        getToken();

    currentStudent =
        getStudent();

    if (!token || !currentStudent) {

        redirectToLogin();

        return;
    }

    setupEvents();

    await loadClasses();
}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeClassesPage()
            .catch(error => {

                console.error(
                    "Classes initialization failed:",
                    error
                );

                showMessage(
                    error.message ||
                    "Unable to load classes.",
                    "error"
                );
            });
    }
);
/* =========================================================
   LINGUA DEUTSCH CONNECT
   ADMIN DASHBOARD
   FULL REPLACEMENT VERSION
========================================================= */

const API_URL = "/api";

/* =========================================================
   AUTH
========================================================= */

let adminToken =
    localStorage.getItem(
        "ldc_admin_token"
    );

let adminData =
    localStorage.getItem(
        "ldc_admin"
    );

if (
    !adminToken ||
    !adminData
) {
    window.location.href =
        "admin-login.html";
}

/* =========================================================
   GLOBAL STATE
========================================================= */

let selectedCourseId = null;

let editingModuleId = null;
let editingLessonId = null;
let selectedModuleId = null;
let editingExerciseId = null;

let selectedStudentId = null;

let editingTeacherId = null;
let selectedTeacherId = null;

let editingClassId = null;
let selectedClassId = null;
let selectedClassDetails = null;

let classRosterStudents = [];
let classAttendanceMap = {};

let allStudents = [];
let allCourses = [];
let allExercises = [];
let allLessons = [];
let allTeachers = [];
let allClasses = [];
let allAccessCodes = [];

let dashboardStats = {};

/* =========================================================
   AUTH FETCH
========================================================= */

async function adminFetch(
    endpoint,
    options = {}
) {

    const token =
        localStorage.getItem(
            "ldc_admin_token"
        );

    const method =
        String(
            options.method || "GET"
        ).toUpperCase();

    const headers = {
        ...(options.headers || {})
    };

    if (
        options.body !== undefined &&
        !headers["Content-Type"] &&
        !headers["content-type"]
    ) {
        headers["Content-Type"] =
            "application/json";
    }

    if (token) {
        headers.Authorization =
            `Bearer ${token}`;
    }

    let response;

    try {

        response =
            await fetch(
                `${API_URL}${endpoint}`,
                {
                    ...options,
                    method,
                    headers
                }
            );

    } catch (error) {

        throw new Error(
            `Could not connect to the backend. Make sure the server is running on ${API_URL}.`
        );
    }

    let data = null;

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    try {

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            if (text) {

                try {

                    data =
                        JSON.parse(text);

                } catch {

                    data = {
                        message: text
                    };
                }
            }
        }

    } catch {

        data = null;
    }

       const authMessage =
        String(data?.message || data?.error || "");

    const isAuthProblem =
        response.status === 401 ||
        (
            response.status === 403 &&
            /token|session|authenticat|admin access|log in|expired/i.test(authMessage)
        );

    if (isAuthProblem) {

        const message =
            data?.message ||
            data?.error ||
            "Your admin session has expired. Please log in again.";

        localStorage.removeItem(
            "ldc_admin_token"
        );

        localStorage.removeItem(
            "ldc_admin"
        );

        if (
            !window.location.pathname.endsWith(
                "admin-login.html"
            )
        ) {

            window.location.href =
                "admin-login.html";
        }

        throw new Error(
            message
        );
    }

    if (!response.ok) {

        const message =
            data?.message ||
            data?.error ||
            `Request failed: ${method} ${endpoint} (${response.status}).`;

        throw new Error(
            message
        );
    }

    return data;
}

/* =========================================================
   GENERAL HELPERS
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function getNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function getElement(id) {

    return document.getElementById(
        id
    );
}

/*
 * Returns the first existing element
 * from a list of possible IDs.
 *
 * This keeps the dashboard compatible
 * with older/newer HTML IDs.
 */
function getFirstElement(
    ids = []
) {

    for (
        const id of ids
    ) {

        const element =
            getElement(id);

        if (element) {
            return element;
        }
    }

    return null;
}

function showMessageById(
    id,
    message,
    type = "success"
) {

    const element =
        getElement(id);

    if (!element) return;

    element.textContent =
        message || "";

    element.className =
        `message ${type}`;

    element.hidden =
        !message;
}
function hideMessageById(id) {

    const element =
        getElement(id);

    if (!element) return;

    element.textContent = "";
    element.className = "message";
    element.hidden = true;
}
function formToObject(form) {

    const object = {};

    if (!form) {
        return object;
    }

    const formData =
        new FormData(form);

    formData.forEach(
        (
            value,
            key
        ) => {

            object[key] =
                value;
        }
    );

    return object;
}

function setFieldValue(
    id,
    value
) {

    const element =
        getElement(id);

    if (element) {

        element.value =
            value ?? "";
    }
}

function formatDateTime(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHTML(
            value
        );
    }

    return date.toLocaleString();
}

function formatDate(value) {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return escapeHTML(
            value
        );
    }

    return date.toLocaleDateString();
}

function normalizeId(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value);
}

function getArrayFromResponse(
    response,
    keys = []
) {

    if (
        Array.isArray(
            response
        )
    ) {
        return response;
    }

    for (
        const key of keys
    ) {

        if (
            Array.isArray(
                response?.[key]
            )
        ) {

            return response[key];
        }
    }

    if (
        Array.isArray(
            response?.data
        )
    ) {

        return response.data;
    }

    return [];
}

function getBoolean(
    value,
    fallback = false
) {

    if (
        value === true ||
        value === 1 ||
        value === "1"
    ) {

        return true;
    }

    if (
        typeof value === "string" &&
        value.toLowerCase() ===
            "true"
    ) {

        return true;
    }

    if (
        value === false ||
        value === 0 ||
        value === "0"
    ) {

        return false;
    }

    return fallback;
}

/* =========================================================
   MODALS
========================================================= */

function openModal(id) {

    const modal =
        getElement(id);

    if (!modal) {
        return;
    }

    modal.hidden = false;

    modal.classList.add(
        "active"
    );

    document.body.classList.add(
        "modal-open"
    );
}

function closeModal(id) {

    const modal =
        getElement(id);

    if (!modal) {
        return;
    }

    modal.classList.remove(
        "active"
    );

    modal.hidden = true;

    if (
        !document.querySelector(
            ".modal.active"
        )
    ) {

        document.body.classList.remove(
            "modal-open"
        );
    }
}

/* =========================================================
   DASHBOARD STATISTICS
========================================================= */

function getStatisticsObject(
    response
) {

    return (
        response?.statistics ||
        response?.stats ||
        response?.data ||
        response ||
        {}
    );
}

function getStatsValue(
    stats,
    keys,
    fallback = 0
) {

    for (
        const key of keys
    ) {

        const value =
            stats?.[key];

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            return getNumber(
                value,
                fallback
            );
        }
    }

    return fallback;
}

function calculateFallbackStatistics() {

    const accessCodes =
        Array.isArray(
            allAccessCodes
        )
            ? allAccessCodes
            : [];

    const students =
        Array.isArray(
            allStudents
        )
            ? allStudents
            : [];

    const paidStudents =
        students.filter(
            student => {

                const status =
                    String(
                        getStudentPaymentStatus(
                            student
                        )
                    ).toLowerCase();

                return (
                    status === "paid" ||
                    status === "completed" ||
                    status === "complete" ||
                    status === "success" ||
                    status === "successful"
                );
            }
        ).length;

    const unusedCodes =
        accessCodes.filter(
            code =>
                !getBoolean(
                    code.used ??
                    code.isUsed ??
                    code.is_used,
                    false
                )
        ).length;

    return {

        students:
            students.length,

        courses:
            allCourses.length,

        teachers:
            allTeachers.length,

        classes:
            allClasses.length,

        accessCodes:
            accessCodes.length,

        unusedCodes,

        paidStudents
    };
}

function renderStatisticValue(
    ids,
    value
) {

    ids.forEach(
        id => {

            const element =
                getElement(id);

            if (element) {

                element.textContent =
                    value;
            }
        }
    );
}

async function loadDashboardStats() {

    try {

        const response =
            await adminFetch(
                "/admin/statistics"
            );

        const stats =
            getStatisticsObject(
                response
            );

        const fallback =
            calculateFallbackStatistics();

        dashboardStats =
            stats;

        const students =
            getStatsValue(
                stats,
                [
                    "students",
                    "totalStudents",
                    "studentCount",
                    "total_students",
                    "student_count"
                ],
                fallback.students
            );

        const courses =
            getStatsValue(
                stats,
                [
                    "courses",
                    "totalCourses",
                    "courseCount",
                    "total_courses",
                    "course_count"
                ],
                fallback.courses
            );

        const teachers =
            getStatsValue(
                stats,
                [
                    "teachers",
                    "totalTeachers",
                    "teacherCount",
                    "total_teachers",
                    "teacher_count"
                ],
                fallback.teachers
            );

        const classes =
            getStatsValue(
                stats,
                [
                    "classes",
                    "totalClasses",
                    "classCount",
                    "total_classes",
                    "class_count"
                ],
                fallback.classes
            );

        const accessCodes =
            getStatsValue(
                stats,
                [
                    "accessCodes",
                    "totalAccessCodes",
                    "accessCodeCount",
                    "totalCodes",
                    "codeCount",
                    "total_access_codes",
                    "access_code_count"
                ],
                fallback.accessCodes
            );

        const unusedCodes =
            getStatsValue(
                stats,
                [
                    "unusedCodes",
                    "unusedAccessCodes",
                    "unusedCodeCount",
                    "unused_codes",
                    "unused_access_codes"
                ],
                fallback.unusedCodes
            );

        const paidStudents =
            getStatsValue(
                stats,
                [
                    "paidStudents",
                    "paidStudentCount",
                    "totalPaidStudents",
                    "paid_students",
                    "paid_student_count"
                ],
                fallback.paidStudents
            );

        renderStatisticValue(
            [
                "totalStudents",
                "studentCount"
            ],
            students
        );

        renderStatisticValue(
            [
                "totalCourses",
                "courseCount"
            ],
            courses
        );

        renderStatisticValue(
            [
                "totalTeachers",
                "teacherCount"
            ],
            teachers
        );

        renderStatisticValue(
            [
                "totalClasses",
                "classCount"
            ],
            classes
        );

        renderStatisticValue(
            [
                "totalAccessCodes",
                "accessCodeCount",
                "totalCodes",
                "codeCount"
            ],
            accessCodes
        );

        renderStatisticValue(
            [
                "unusedCodes",
                "unusedAccessCodes",
                "unusedCodeCount"
            ],
            unusedCodes
        );

        renderStatisticValue(
            [
                "paidStudents",
                "paidStudentCount",
                "totalPaidStudents"
            ],
            paidStudents
        );

    } catch (error) {

        console.error(
            "Statistics loading error:",
            error
        );

        const fallback =
            calculateFallbackStatistics();

        renderStatisticValue(
            [
                "totalStudents",
                "studentCount"
            ],
            fallback.students
        );

        renderStatisticValue(
            [
                "totalCourses",
                "courseCount"
            ],
            fallback.courses
        );

        renderStatisticValue(
            [
                "totalTeachers",
                "teacherCount"
            ],
            fallback.teachers
        );

        renderStatisticValue(
            [
                "totalClasses",
                "classCount"
            ],
            fallback.classes
        );

        renderStatisticValue(
            [
                "totalAccessCodes",
                "accessCodeCount",
                "totalCodes",
                "codeCount"
            ],
            fallback.accessCodes
        );

        renderStatisticValue(
            [
                "unusedCodes",
                "unusedAccessCodes",
                "unusedCodeCount"
            ],
            fallback.unusedCodes
        );

        renderStatisticValue(
            [
                "paidStudents",
                "paidStudentCount",
                "totalPaidStudents"
            ],
            fallback.paidStudents
        );
    }
}

/* =========================================================
   COURSES
========================================================= */

async function loadCourses() {

    try {

        const response =
            await adminFetch(
                "/admin/courses"
            );

        const courses =
            getArrayFromResponse(
                response,
                [
                    "courses",
                    "data"
                ]
            );

        allCourses =
            courses;

        renderCourses();

        if (
            selectedCourseId &&
            !allCourses.some(
                course =>
                    String(
                        course.id ??
                        course.course_id
                    ) ===
                    String(
                        selectedCourseId
                    )
            )
        ) {

            selectedCourseId =
                null;
        }

    } catch (error) {

        console.error(
            "Courses loading error:",
            error
        );

        allCourses = [];

        renderCourses();
    }
}

function renderCourses() {

    const grid =
        getElement(
            "courseGrid"
        );

    if (!grid) {
        return;
    }

    if (!allCourses.length) {

        grid.innerHTML = `
            <div class="empty-state">
                No courses found.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        allCourses
            .map(
                course => {

                    const id =
                        course.id ??
                        course.course_id;

                    const name =
                        course.name ??
                        course.title ??
                        course.course_name ??
                        "Course";

                    const level =
                        course.level ??
                        course.level_name ??
                        "";

                    return `
                        <div
                            class="course-card"
                            data-course-id="${escapeHTML(id)}"
                        >

                            <div class="course-card-content">

                                <h3>
                                    ${escapeHTML(name)}
                                </h3>

                                ${
                                    level
                                        ? `
                                            <p>
                                                ${escapeHTML(level)}
                                            </p>
                                        `
                                        : ""
                                }

                                <button
                                    type="button"
                                    class="select-course-btn"
                                    data-course-id="${escapeHTML(id)}"
                                >
                                    Manage Course
                                </button>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}

function getSelectedCourse() {

    if (!selectedCourseId) {
        return null;
    }

    return (
        allCourses.find(
            course =>
                String(
                    course.id ??
                    course.course_id
                ) ===
                String(
                    selectedCourseId
                )
        ) || null
    );
}

async function loadCourseModules(
    courseId
) {

    if (!courseId) {
        return [];
    }

    const response =
        await adminFetch(
            `/admin/courses/${courseId}/modules`
        );

    return getArrayFromResponse(
        response,
        [
            "modules",
            "data"
        ]
    );
}

async function selectCourse(
    courseId
) {

    selectedCourseId =
        courseId;
    getElement("lmsBuilder")?.classList.remove("hidden");

    document
        .querySelectorAll(".course-card")
        .forEach(card =>
            card.classList.toggle(
                "selected",
                card.dataset.courseId === String(courseId)
            )
        );
    const course =
        getSelectedCourse();

    const title =
        getElement(
            "selectedCourseTitle"
        );

    if (title) {

        title.textContent =
            course
                ? (
                    course.name ??
                    course.title ??
                    course.course_name ??
                    "Selected Course"
                )
                : "Selected Course";
    }

    await loadSelectedCourse();
}

async function loadSelectedCourse() {

    const builder =
        getElement(
            "lmsBuilder"
        );

    if (!selectedCourseId) {

        if (builder) {

            builder.innerHTML = `
                <div class="empty-state">
                    Select a course to manage its modules and lessons.
                </div>
            `;
        }

        return;
    }

    try {

        const modules =
            await loadCourseModules(
                selectedCourseId
            );

        renderModules(
            modules
        );

        buildAllLessonsFromModules(
            modules
        );

        await loadExercises();

    } catch (error) {

        console.error(
            "Course modules loading error:",
            error
        );

        if (builder) {

            builder.innerHTML = `
                <div class="empty-state">

                    Could not load course content.

                    <br>

                    <small>
                        ${escapeHTML(
                            error.message
                        )}
                    </small>

                </div>
            `;
        }
    }
}

function buildAllLessonsFromModules(
    modules
) {

    allLessons = [];

    if (!Array.isArray(modules)) {
        return;
    }

    modules.forEach(
        module => {

            const lessons =
                module.lessons ||
                module.lessonList ||
                [];

            if (!Array.isArray(lessons)) {
                return;
            }

            lessons.forEach(
                lesson => {

                    allLessons.push({

                        ...lesson,

                        moduleId:
                            lesson.moduleId ??
                            lesson.module_id ??
                            module.id ??
                            module.module_id,

                        moduleTitle:
                            lesson.moduleTitle ??
                            lesson.module_name ??
                            module.name ??
                            module.title ??
                            "Module"
                    });
                }
            );
        }
    );
}

/* =========================================================
   MODULES
========================================================= */

function getModuleOrder(
    module
) {

    return getNumber(
        module.order ??
        module.module_order ??
        module.position ??
        module.sortOrder ??
        module.sort_order,
        0
    );
}

function renderModules(
    modules
) {

    const container =
        getElement(
            "modulesContainer"
        ) ||
        getElement(
            "moduleList"
        ) ||
        getElement(
            "lmsBuilder"
        );

    if (!container) {
        return;
    }

    if (
        !Array.isArray(
            modules
        ) ||
        !modules.length
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <p>
                    No modules found for this course.
                </p>

                <button
                    type="button"
                    id="emptyAddModuleBtn"
                    class="btn btn-primary"
                >
                    Add Module
                </button>

            </div>
        `;

        return;
    }

    const sorted =
        [...modules].sort(
            (
                a,
                b
            ) =>
                getModuleOrder(a) -
                getModuleOrder(b)
        );

    container.innerHTML =
        sorted
            .map(
                module => {

                    const moduleId =
                        module.id ??
                        module.module_id;

                    const name =
                        module.name ??
                        module.title ??
                        "Module";

                    const lessons =
                        Array.isArray(
                            module.lessons
                        )
                            ? [
                                ...module.lessons
                            ]
                            : [];

                    return `
                        <div
                            class="module-card"
                            data-module-id="${escapeHTML(moduleId)}"
                        >

                            <div class="module-header">

                                <div>

                                    <h3>
                                        ${escapeHTML(name)}
                                    </h3>

                                    ${
                                        module.description
                                            ? `
                                                <p>
                                                    ${escapeHTML(
                                                        module.description
                                                    )}
                                                </p>
                                            `
                                            : ""
                                    }

                                </div>

                                <div class="module-actions">

                                    <button
                                        type="button"
                                        class="edit-module-btn"
                                        data-module-id="${escapeHTML(moduleId)}"
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        class="delete-module-btn"
                                        data-module-id="${escapeHTML(moduleId)}"
                                    >
                                        Delete
                                    </button>

                                    <button
                                        type="button"
                                        class="add-lesson-btn"
                                        data-module-id="${escapeHTML(moduleId)}"
                                    >
                                        Add Lesson
                                    </button>

                                </div>

                            </div>

                            <div class="lessons-container">

                                ${
                                    lessons.length
                                        ? lessons
                                            .sort(
                                                (
                                                    a,
                                                    b
                                                ) =>
                                                    getLessonOrder(a) -
                                                    getLessonOrder(b)
                                            )
                                            .map(
                                                renderLesson
                                            )
                                            .join("")
                                        : `
                                            <div class="empty-state">
                                                No lessons in this module.
                                            </div>
                                        `
                                }

                            </div>

                        </div>
                    `;
                }
            )
            .join("");
}

function renderLesson(
    lesson
) {

    const lessonId =
        lesson.id ??
        lesson.lesson_id;

    const name =
        lesson.name ??
        lesson.title ??
        lesson.lesson_name ??
        "Lesson";

    const xp =
        getLessonXp(
            lesson
        );

    return `
        <div
            class="lesson-item"
            data-lesson-id="${escapeHTML(lessonId)}"
        >

            <div class="lesson-content">

                <h4>
                    ${escapeHTML(name)}
                </h4>

                ${
                    lesson.description
                        ? `
                            <p>
                                ${escapeHTML(
                                    lesson.description
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    xp
                        ? `
                            <small>
                                XP: ${xp}
                            </small>
                        `
                        : ""
                }

            </div>

            <div class="lesson-actions">

                <button
                    type="button"
                    class="edit-lesson-btn"
                    data-lesson-id="${escapeHTML(lessonId)}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-lesson-btn"
                    data-lesson-id="${escapeHTML(lessonId)}"
                >
                    Delete
                </button>

            </div>

        </div>
    `;
}

function openModuleModal() {

    editingModuleId =
        null;

    const form =
        getElement(
            "moduleForm"
        );

    if (form) {
        form.reset();
    }

    setFieldValue(
        "moduleOrder",
        getNextModuleOrder()
    );

    const title =
        getElement(
            "moduleModalTitle"
        );

    if (title) {

        title.textContent =
            "Add Module";
    }

    hideMessageById(
        "moduleMessage"
    );

    openModal(
        "moduleModal"
    );
}

function closeModuleModal() {

    closeModal(
        "moduleModal"
    );

    editingModuleId =
        null;
}

function getNextModuleOrder() {

    if (!selectedCourseId) {
        return 1;
    }

    const cards =
        document.querySelectorAll(
            ".module-card"
        );

    if (!cards.length) {
        return 1;
    }

    let max = 0;

    /*
     * The old implementation never updated
     * max. Read the displayed module cards'
     * order when possible and safely fall back.
     */

    const moduleCards =
        Array.from(
            cards
        );

    moduleCards.forEach(
        card => {

            const module =
                card;

            const orderValue =
                module.dataset.order;

            if (orderValue) {

                max =
                    Math.max(
                        max,
                        getNumber(
                            orderValue,
                            0
                        )
                    );
            }
        }
    );

    /*
     * If the HTML does not expose the order,
     * use the number of visible module cards.
     */
    if (!max) {
        max =
            moduleCards.length;
    }

    return max + 1;
}

async function openEditModule(
    moduleId
) {

    const localModules =
        selectedCourseId
            ? await loadCourseModules(
                selectedCourseId
            )
            : [];

    const module =
        localModules.find(
            item =>
                String(
                    item.id ??
                    item.module_id
                ) ===
                String(
                    moduleId
                )
        );

    editingModuleId =
        moduleId;

    const form =
        getElement(
            "moduleForm"
        );

    if (form) {
        form.reset();
    }

    if (module) {

        setFieldValue(
            "moduleTitle",
            module.name ??
            module.title ??
            ""
        );

        setFieldValue(
            "moduleDescription",
            module.description ??
            ""
        );

        setFieldValue(
            "moduleOrder",
            module.order ??
            module.module_order ??
            module.position ??
            ""
        );

    } else {

        try {

            const response =
                await adminFetch(
                    `/admin/modules/${moduleId}`
                );

            const data =
                response.module ||
                response.data ||
                response;

            setFieldValue(
                "moduleTitle",
                data.name ??
                data.title ??
                ""
            );

            setFieldValue(
                "moduleDescription",
                data.description ??
                ""
            );

            setFieldValue(
                "moduleOrder",
                data.order ??
                data.module_order ??
                data.position ??
                ""
            );

        } catch (error) {

            showMessageById(
                "moduleMessage",
                error.message,
                "error"
            );

            return;
        }
    }

    const title =
        getElement(
            "moduleModalTitle"
        );

    if (title) {

        title.textContent =
            "Edit Module";
    }

    hideMessageById(
        "moduleMessage"
    );

    openModal(
        "moduleModal"
    );
}

async function deleteModule(
    moduleId
) {

    if (
        !confirm(
            "Delete this module? All lessons belonging to it may also be affected."
        )
    ) {
        return;
    }

    try {

        await adminFetch(
            `/admin/modules/${moduleId}`,
            {
                method: "DELETE"
            }
        );

        await loadSelectedCourse();

    } catch (error) {

        alert(
            error.message
        );
    }
}

/* =========================================================
   LESSONS
========================================================= */

function getLessonOrder(
    lesson
) {

    return getNumber(
        lesson.order ??
        lesson.lesson_order ??
        lesson.position ??
        lesson.sortOrder ??
        lesson.sort_order,
        0
    );
}

function getLessonXp(
    lesson
) {

    return getNumber(
        lesson.xp ??
        lesson.xp_reward ??
        lesson.experience ??
        lesson.experience_points,
        0
    );
}

function openLessonModal(
    moduleId
) {

    selectedModuleId =
        moduleId;

    editingLessonId =
        null;

    const form =
        getElement(
            "lessonForm"
        );

    if (form) {
        form.reset();
    }

    setFieldValue(
        "lessonOrder",
        getNextLessonOrder(
            moduleId
        )
    );

    const title =
        getElement(
            "lessonModalTitle"
        );

    if (title) {

        title.textContent =
            "Add Lesson";
    }

    hideMessageById(
        "lessonMessage"
    );

    openModal(
        "lessonModal"
    );
}

function getNextLessonOrder(
    moduleId
) {

    const lessons =
        allLessons.filter(
            lesson =>
                String(
                    lesson.moduleId ??
                    lesson.module_id
                ) ===
                String(
                    moduleId
                )
        );

    if (!lessons.length) {
        return 1;
    }

    return (
        Math.max(
            ...lessons.map(
                getLessonOrder
            )
        ) + 1
    );
}

function closeLessonModal() {

    closeModal(
        "lessonModal"
    );

    editingLessonId =
        null;

    selectedModuleId =
        null;
}

async function openEditLesson(
    lessonId
) {

    const lesson =
        allLessons.find(
            item =>
                String(
                    item.id ??
                    item.lesson_id
                ) ===
                String(
                    lessonId
                )
        );

    editingLessonId =
        lessonId;

    selectedModuleId =
        lesson
            ? (
                lesson.moduleId ??
                lesson.module_id
            )
            : null;

    if (!lesson) {

        try {

            const response =
                await adminFetch(
                    `/admin/lessons/${lessonId}`
                );

            const data =
                response.lesson ||
                response.data ||
                response;

            selectedModuleId =
                data.moduleId ??
                data.module_id ??
                null;

            fillLessonForm(
                data
            );

        } catch (error) {

            showMessageById(
                "lessonMessage",
                error.message,
                "error"
            );

            return;
        }

    } else {

        fillLessonForm(
            lesson
        );
    }

    const title =
        getElement(
            "lessonModalTitle"
        );

    if (title) {

        title.textContent =
            "Edit Lesson";
    }

    hideMessageById(
        "lessonMessage"
    );

    openModal(
        "lessonModal"
    );
}

function fillLessonForm(
    lesson
) {

    setFieldValue(
        "lessonTitle",
        lesson.name ??
        lesson.title ??
        lesson.lesson_name ??
        ""
    );

    setFieldValue(
        "lessonDescription",
        lesson.description ??
        ""
    );

    setFieldValue(
        "lessonContent",
        lesson.content ??
        lesson.text ??
        ""
    );

    setFieldValue(
        "lessonOrder",
        lesson.order ??
        lesson.lesson_order ??
        lesson.position ??
        ""
    );

    setFieldValue(
        "lessonXp",
        lesson.xp ??
        lesson.xp_reward ??
        lesson.experience ??
        ""
    );
}

async function deleteLesson(
    lessonId
) {

    if (
        !confirm(
            "Delete this lesson?"
        )
    ) {
        return;
    }

    try {

        await adminFetch(
            `/admin/lessons/${lessonId}`,
            {
                method: "DELETE"
            }
        );

        await loadSelectedCourse();

    } catch (error) {

        alert(
            error.message
        );
    }
}

/* =========================================================
   ACCESS CODES
========================================================= */

async function loadAccessCodes() {

    try {

        const response =
            await adminFetch(
                "/admin/access-codes"
            );

        const codes =
            getArrayFromResponse(
                response,
                [
                    "accessCodes",
                    "access_codes",
                    "codes",
                    "data"
                ]
            );

        allAccessCodes =
            codes;

        renderAccessCodes(
            allAccessCodes
        );

    } catch (error) {

        console.error(
            "Access codes loading error:",
            error
        );

        allAccessCodes =
            [];

        renderAccessCodes(
            [],
            error.message
        );
    }
}

function renderAccessCodes(
    codes,
    errorMessage = ""
) {

    const tbody =
        getElement(
            "accessCodesTable"
        );

    if (!tbody) {
        return;
    }

    if (errorMessage) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    style="text-align:center;"
                >

                    Could not load access codes.

                    <br>

                    <small>
                        ${escapeHTML(
                            errorMessage
                        )}
                    </small>

                </td>

            </tr>
        `;

        return;
    }

    if (!codes.length) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="7"
                    style="text-align:center;"
                >
                    No access codes found.
                </td>

            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        codes
            .map(
                code => {

                    const value =
                        code.code ??
                        code.accessCode ??
                        code.access_code ??
                        "";

                    const course =
                        code.courseName ??
                        code.course_name ??
                        (
                            typeof code.course ===
                            "string"
                                ? code.course
                                : code.course?.name ??
                                  code.course?.title ??
                                  "—"
                        );

                    const level =
                        code.level ??
                        code.courseLevel ??
                        code.course_level ??
                        "—";

                    const rawUsed =
                        code.used ??
                        code.isUsed ??
                        code.is_used ??
                        false;

                    const used =
                        getBoolean(
                            rawUsed,
                            false
                        );

                    const expires =
                        code.expiresAt ??
                        code.expires_at;

                    const created =
                        code.createdAt ??
                        code.created_at ??
                        code.createdOn ??
                        code.created_on;

                    return `
                        <tr>

                            <td>
                                <strong>
                                    ${escapeHTML(value)}
                                </strong>
                            </td>

                            <td>
                                ${escapeHTML(course)}
                            </td>

                            <td>
                                ${escapeHTML(level)}
                            </td>

                            <td>

                                ${
                                    used
                                        ? `
                                            <span class="access-code-used">
                                                Used
                                            </span>
                                        `
                                        : `
                                            <span class="access-code-unused">
                                                Unused
                                            </span>
                                        `
                                }

                            </td>

                            <td>

                                ${
                                    expires
                                        ? formatDateTime(
                                            expires
                                        )
                                        : "No expiry"
                                }

                            </td>

                            <td>

                                ${
                                    created
                                        ? formatDateTime(
                                            created
                                        )
                                        : "—"
                                }

                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="copy-code-btn"
                                    data-code="${escapeHTML(value)}"
                                >
                                    Copy
                                </button>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}

async function generateAccessCode(
    event
) {

    if (event) {
        event.preventDefault();
    }

    const form =
        getElement(
            "accessCodeForm"
        );

    const raw =
        formToObject(
            form
        );

    const payload = {

        courseId:
            raw.courseId ??
            raw.course ??
            getElement(
                "accessCodeCourse"
            )?.value ??
            "",

        level:
            raw.level ??
            getElement(
                "accessCodeLevel"
            )?.value ??
            "",

        expiresAt:
            raw.expiresAt ??
            raw.expiryDate ??
            getElement(
                "accessCodeExpiresAt"
            )?.value ??
            ""
    };

    try {

        await adminFetch(
            "/admin/access-codes",
            {
                method: "POST",
                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

        if (form) {
            form.reset();
        }

        await loadAccessCodes();

        await loadDashboardStats();

    } catch (error) {

        showMessageById(
            "codeMessage",
            error.message,
            "error"
        );
    }
}

/* =========================================================
   STUDENTS
========================================================= */

async function loadStudents() {

    try {

        const response =
            await adminFetch(
                "/admin/students"
            );

        const students =
            getArrayFromResponse(
                response,
                [
                    "students",
                    "data"
                ]
            );

        allStudents =
            students;

        renderStudents(
            allStudents
        );

    } catch (error) {

        console.error(
            "Students loading error:",
            error
        );

        allStudents = [];

        renderStudents(
            [],
            error.message
        );
    }
}

function getStudentId(
    student
) {

    return (
        student?.id ??
        student?.student_id ??
        student?.userId ??
        student?.user_id ??
        ""
    );
}

function getStudentName(
    student
) {

    if (!student) {
        return "Unknown Student";
    }

    if (student.name) {
        return student.name;
    }

    if (student.fullName) {
        return student.fullName;
    }

    if (student.full_name) {
        return student.full_name;
    }

    const first =
        student.firstName ??
        student.first_name ??
        "";

    const last =
        student.lastName ??
        student.last_name ??
        "";

    return (
        `${first} ${last}`.trim() ||
        "Unknown Student"
    );
}

function getStudentEmail(
    student
) {

    return (
        student?.email ??
        ""
    );
}

function getStudentPhone(
    student
) {

    return (
        student?.phone ??
        student?.phoneNumber ??
        student?.phone_number ??
        ""
    );
}

function getStudentCourse(
    student
) {

    const course =
        student?.courseName ??
        student?.course_name ??
        student?.course?.name ??
        (
            typeof student?.course ===
            "string"
                ? student.course
                : ""
        );

    return course ||
        "—";
}

function getStudentLevel(
    student
) {

    return (
        student?.level ??
        student?.courseLevel ??
        student?.course_level ??
        "—"
    );
}

function getStudentPaymentStatus(
    student
) {

    return (
        student?.paymentStatus ??
        student?.payment_status ??
        student?.payment ??
        "—"
    );
}

function getStudentAccountStatus(
    student
) {

    return (
        student?.status ??
        student?.accountStatus ??
        student?.account_status ??
        "active"
    );
}

function formatStudentStatus(
    status
) {

    const value =
        String(
            status || ""
        ).toLowerCase();

    if (
        value === "active"
    ) {

        return "Active";
    }

    if (
        value === "inactive"
    ) {

        return "Inactive";
    }

    return status ||
        "—";
}

function renderStudents(
    students,
    errorMessage = ""
) {

    const tbody =
        getElement(
            "studentsTable"
        );

    if (!tbody) {
        return;
    }

    if (errorMessage) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    style="text-align:center;"
                >

                    Could not load students.

                    <br>

                    <small>
                        ${escapeHTML(
                            errorMessage
                        )}
                    </small>

                </td>

            </tr>
        `;

        return;
    }

    if (
        !Array.isArray(
            students
        ) ||
        !students.length
    ) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="8"
                    style="text-align:center;"
                >
                    No students found.
                </td>

            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        students
            .map(
                student => {

                    const id =
                        getStudentId(
                            student
                        );

                    return `
                        <tr>

                            <td>
                                ${escapeHTML(
                                    getStudentName(
                                        student
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getStudentEmail(
                                        student
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getStudentPhone(
                                        student
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getStudentCourse(
                                        student
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getStudentLevel(
                                        student
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getStudentPaymentStatus(
                                        student
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    formatStudentStatus(
                                        getStudentAccountStatus(
                                            student
                                        )
                                    )
                                )}
                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="edit-student-btn"
                                    data-student-id="${escapeHTML(id)}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="delete-student-btn"
                                    data-student-id="${escapeHTML(id)}"
                                >
                                    Delete
                                </button>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}

function getStudentForm() {

    return getFirstElement(
        [
            "studentForm",
            "studentEditForm"
        ]
    );
}
function openStudentModal(student = null) {

    if (!student) return;

    selectedStudentId = getStudentId(student);

    const info = getElement("studentInfo");

    if (info) {
        info.innerHTML = `
            <strong>${escapeHTML(getStudentName(student))}</strong><br>
            ${escapeHTML(getStudentEmail(student))}<br>
            ${escapeHTML(getStudentPhone(student))}
        `;
    }

    const setSelect = (id, value) => {
        const el = getElement(id);
        if (
            el &&
            [...el.options].some(o => o.value === String(value))
        ) {
            el.value = String(value);
        }
    };

    const level = getStudentLevel(student);

    setSelect("editCourse", student.course ?? student.course_name ?? level);
    setSelect("editLevel", level);
    setSelect("editAccountStatus", String(getStudentAccountStatus(student)).toLowerCase());
    setSelect("editPaymentStatus", String(getStudentPaymentStatus(student)).toLowerCase());

    hideMessageById("studentEditMessage");

    openModal("studentModal");
}
function closeStudentModal() {

    closeModal(
        "studentModal"
    );

    selectedStudentId =
        null;
}

async function saveStudent() {

    if (!selectedStudentId) return;

    const accountStatus = getElement("editAccountStatus")?.value;

    const payload = {
        course: getElement("editCourse")?.value,
        level: getElement("editLevel")?.value,
        accountStatus,
        status: accountStatus,
        paymentStatus: getElement("editPaymentStatus")?.value
    };

    try {

        await adminFetch(
            `/admin/students/${selectedStudentId}`,
            {
                method: "PATCH",
                body: JSON.stringify(payload)
            }
        );

        closeStudentModal();

        await loadStudents();
        await loadDashboardStats();

    } catch (error) {

        showMessageById("studentEditMessage", error.message, "error");
    }
}
async function deleteStudent(
    studentId
) {

    if (!studentId) {
        return;
    }

    if (
        !confirm(
            "Delete this student?"
        )
    ) {
        return;
    }

    try {

        await adminFetch(
            `/admin/students/${studentId}`,
            {
                method: "DELETE"
            }
        );

        await loadStudents();

        await loadClasses();

        await loadDashboardStats();

    } catch (error) {

        alert(
            error.message
        );
    }
}

/* =========================================================
   EXERCISE MANAGER
========================================================= */

function createExerciseManager() {

    const builder =
        document.getElementById(
            "lmsBuilder"
        );

    if (!builder) {
        return;
    }

    if (
        !document.getElementById(
            "exerciseManager"
        )
    ) {

        const section =
            document.createElement(
                "div"
            );

        section.id =
            "exerciseManager";

        section.innerHTML = `
            <div class="section-header">

                <div>

                    <h2>
                        Exercise Manager
                    </h2>

                    <p>
                        Create and manage exercises for lessons.
                    </p>

                </div>

                <button
                    type="button"
                    id="addExerciseBtn"
                    class="btn btn-primary"
                >
                    Add Exercise
                </button>

            </div>

            <div id="exerciseSummary"></div>

            <div id="exerciseList"></div>
        `;

        builder.parentNode?.appendChild(
            section
        );
    }
}

function createExerciseModal() {

    if (
        document.getElementById(
            "exerciseModal"
        )
    ) {
        return;
    }

    const modal =
        document.createElement(
            "div"
        );

    modal.id =
        "exerciseModal";

    modal.className =
        "modal";

    modal.hidden = true;

    modal.innerHTML = `
        <div class="modal-content">

            <div class="modal-header">

                <h2 id="exerciseModalTitle">
                    Add Exercise
                </h2>

                <button
                    type="button"
                    id="closeExerciseModal"
                    class="modal-close"
                >
                    ×
                </button>

            </div>

            <form id="exerciseForm">

                <div
                    id="exerciseMessage"
                    class="message"
                ></div>

                <div class="form-group">

                    <label for="exerciseLesson">
                        Lesson
                    </label>

                    <select
                        id="exerciseLesson"
                        name="lessonId"
                        required
                    ></select>

                </div>

                <div class="form-group">

                    <label for="exerciseType">
                        Type
                    </label>

                    <select
                        id="exerciseType"
                        name="type"
                        required
                    >

                        <option value="multiple_choice">
                            Multiple Choice
                        </option>

                        <option value="true_false">
                            True / False
                        </option>

                        <option value="fill_blank">
                            Fill in the Blank
                        </option>

                        <option value="translation">
                            Translation
                        </option>

                        <option value="short_answer">
                            Short Answer
                        </option>

                    </select>

                </div>

                <div class="form-group">

                    <label for="exerciseQuestion">
                        Question
                    </label>

                    <textarea
                        id="exerciseQuestion"
                        name="question"
                        required
                    ></textarea>

                </div>

                <div id="multipleChoiceOptions"></div>

                <div class="form-group">

                    <label for="exerciseAnswer">
                        Correct Answer
                    </label>

                    <input
                        type="text"
                        id="exerciseAnswer"
                        name="answer"
                    />

                </div>

                <div class="form-group">

                    <label for="exerciseExplanation">
                        Explanation
                    </label>

                    <textarea
                        id="exerciseExplanation"
                        name="explanation"
                    ></textarea>

                </div>

                <div class="form-group">

                    <label for="exerciseXp">
                        XP
                    </label>

                    <input
                        type="number"
                        id="exerciseXp"
                        name="xp"
                        min="0"
                        value="10"
                    />

                </div>

                <div class="form-group">

                    <label for="exerciseOrder">
                        Order
                    </label>

                    <input
                        type="number"
                        id="exerciseOrder"
                        name="order"
                        min="0"
                    />

                </div>

                <div class="modal-actions">

                    <button
                        type="button"
                        id="cancelExerciseBtn"
                        class="btn btn-secondary"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Save Exercise
                    </button>

                </div>

            </form>

        </div>
    `;

    document.body.appendChild(
        modal
    );

    const form =
        document.getElementById(
            "exerciseForm"
        );

    form?.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            saveExercise();
        }
    );

    const type =
        document.getElementById(
            "exerciseType"
        );

    type?.addEventListener(
        "change",
        updateExerciseTypeUI
    );
}

function parseExerciseOptions(
    exercise
) {

    const raw =
        exercise?.options ??
        exercise?.choices ??
        exercise?.answers ??
        [];

    if (Array.isArray(raw)) {
        return raw;
    }

    if (
        typeof raw ===
        "string"
    ) {

        try {

            const parsed =
                JSON.parse(raw);

            return Array.isArray(
                parsed
            )
                ? parsed
                : [];

        } catch {

            return raw
                .split("\n")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);
        }
    }

    return [];
}

function normalizeExercise(
    exercise
) {

    if (!exercise) {
        return null;
    }

    return {

        ...exercise,

        id:
            exercise.id ??
            exercise.exercise_id,

        lessonId:
            exercise.lessonId ??
            exercise.lesson_id ??
            exercise.lesson?.id,

        type:
            exercise.type ??
            exercise.exerciseType ??
            exercise.exercise_type ??
            "multiple_choice",

        question:
            exercise.question ??
            exercise.prompt ??
            "",

        answer:
            exercise.answer ??
            exercise.correctAnswer ??
            exercise.correct_answer ??
            "",

        explanation:
            exercise.explanation ??
            "",

        xp:
            getNumber(
                exercise.xp ??
                exercise.xp_reward ??
                exercise.experience ??
                exercise.experience_points,
                0
            ),

        order:
            getNumber(
                exercise.order ??
                exercise.exercise_order ??
                exercise.position ??
                exercise.sortOrder ??
                exercise.sort_order,
                0
            ),

        options:
            parseExerciseOptions(
                exercise
            )
    };
}

function getExerciseTypeLabel(
    type
) {

    const labels = {

        multiple_choice:
            "Multiple Choice",

        true_false:
            "True / False",

        fill_blank:
            "Fill in the Blank",

        translation:
            "Translation",

        short_answer:
            "Short Answer"
    };

    return (
        labels[type] ||
        type ||
        "Exercise"
    );
}

function getLessonName(
    lessonId
) {

    const lesson =
        allLessons.find(
            item =>
                String(
                    item.id ??
                    item.lesson_id
                ) ===
                String(
                    lessonId
                )
        );

    return lesson
        ? (
            lesson.name ??
            lesson.title ??
            "Lesson"
        )
        : "Lesson";
}

async function loadExercises() {

    if (!selectedCourseId) {

        allExercises = [];

        renderExercises();

        return;
    }

    try {

        const response =
            await adminFetch(
                `/admin/courses/${selectedCourseId}/exercises`
            );

        const exercises =
            getArrayFromResponse(
                response,
                [
                    "exercises",
                    "data"
                ]
            );

        allExercises =
            exercises
                .map(
                    normalizeExercise
                )
                .filter(Boolean);

        renderExercises();

    } catch (error) {

        console.warn(
            "Course exercise endpoint unavailable, trying lesson exercises:",
            error
        );

        allExercises = [];

        for (
            const lesson of allLessons
        ) {

            const lessonId =
                lesson.id ??
                lesson.lesson_id;

            if (!lessonId) {
                continue;
            }

            try {

                const response =
                    await adminFetch(
                        `/admin/lessons/${lessonId}/exercises`
                    );

                const exercises =
                    getArrayFromResponse(
                        response,
                        [
                            "exercises",
                            "data"
                        ]
                    );

                if (
                    Array.isArray(
                        exercises
                    )
                ) {

                    allExercises.push(
                        ...exercises
                            .map(
                                normalizeExercise
                            )
                            .filter(Boolean)
                    );
                }

            } catch {
                /* Ignore individual lesson errors. */
            }
        }

        renderExercises();
    }
}

function renderExercises() {

    const list =
        getElement(
            "exerciseList"
        );

    if (!list) {
        return;
    }

    updateExerciseSummary();

    if (!allExercises.length) {

        list.innerHTML = `
            <div class="empty-state">
                No exercises found.
            </div>
        `;

        return;
    }

    const sorted =
        [...allExercises].sort(
            (
                a,
                b
            ) =>
                getNumber(
                    a.order,
                    0
                ) -
                getNumber(
                    b.order,
                    0
                )
        );

    list.innerHTML =
        sorted
            .map(
                renderExerciseCard
            )
            .join("");
}

function updateExerciseSummary() {

    const summary =
        getElement(
            "exerciseSummary"
        );

    if (!summary) {
        return;
    }

    const count =
        allExercises.length;

    const xp =
        allExercises.reduce(
            (
                total,
                exercise
            ) =>
                total +
                getNumber(
                    exercise.xp,
                    0
                ),
            0
        );

    summary.innerHTML = `
        <div class="stats-grid">

            <div class="stat-card">

                <span>
                    Exercises
                </span>

                <strong>
                    ${count}
                </strong>

            </div>

            <div class="stat-card">

                <span>
                    Total XP
                </span>

                <strong>
                    ${xp}
                </strong>

            </div>

        </div>
    `;
}

function renderExerciseCard(
    exercise
) {

    const id =
        exercise.id;

    const lessonId =
        exercise.lessonId;

    return `
        <div
            class="exercise-card"
            data-exercise-id="${escapeHTML(id)}"
        >

            <div class="exercise-card-content">

                <div class="exercise-card-top">

                    <span class="status-badge">
                        ${escapeHTML(
                            getExerciseTypeLabel(
                                exercise.type
                            )
                        )}
                    </span>

                    <span>
                        ${escapeHTML(
                            getLessonName(
                                lessonId
                            )
                        )}
                    </span>

                </div>

                <h3>
                    ${escapeHTML(
                        exercise.question
                    )}
                </h3>

                ${
                    exercise.options?.length
                        ? `
                            <ul>

                                ${
                                    exercise.options
                                        .map(
                                            option => `
                                                <li>
                                                    ${escapeHTML(
                                                        typeof option === "object"
                                                            ? (
                                                                option.text ??
                                                                option.label ??
                                                                option.value ??
                                                                ""
                                                            )
                                                            : option
                                                    )}
                                                </li>
                                            `
                                        )
                                        .join("")
                                }

                            </ul>
                        `
                        : ""
                }

                ${
                    exercise.answer
                        ? `
                            <p>

                                <strong>
                                    Answer:
                                </strong>

                                ${escapeHTML(
                                    exercise.answer
                                )}

                            </p>
                        `
                        : ""
                }

                <small>
                    XP:
                    ${getNumber(
                        exercise.xp,
                        0
                    )}
                </small>

            </div>

            <div class="exercise-card-actions">

                <button
                    type="button"
                    class="edit-exercise-btn"
                    data-exercise-id="${escapeHTML(id)}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-exercise-btn"
                    data-exercise-id="${escapeHTML(id)}"
                >
                    Delete
                </button>

            </div>

        </div>
    `;
}

function populateExerciseLessonSelect() {

    const select =
        getElement(
            "exerciseLesson"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select Lesson
        </option>

        ${
            allLessons
                .map(
                    lesson => {

                        const id =
                            lesson.id ??
                            lesson.lesson_id;

                        const name =
                            lesson.name ??
                            lesson.title ??
                            "Lesson";

                        return `
                            <option
                                value="${escapeHTML(id)}"
                            >
                                ${escapeHTML(name)}
                            </option>
                        `;
                    }
                )
                .join("")
        }
    `;
}

function updateExerciseTypeUI() {

    const type =
        getElement(
            "exerciseType"
        )?.value;

    const options =
        getElement(
            "multipleChoiceOptions"
        );

    if (!options) {
        return;
    }

    if (
        type ===
        "multiple_choice"
    ) {

        renderMultipleChoiceOptions(
            getMultipleChoiceOptions()
        );

    } else {

        options.innerHTML = "";
    }
}

function renderMultipleChoiceOptions(
    options = []
) {

    const container =
        getElement(
            "multipleChoiceOptions"
        );

    if (!container) {
        return;
    }

    const values =
        Array.isArray(options)
            ? options
            : [];

    container.innerHTML = `
        <div class="form-group">

            <label>
                Answer Options
            </label>

            <div id="mcOptionsList">

                ${
                    values
                        .map(
                            (
                                option,
                                index
                            ) => `
                                <div
                                    class="mc-option-row"
                                >

                                    <input
                                        type="text"
                                        class="mc-option-input"
                                        data-index="${index}"
                                        value="${escapeHTML(
                                            typeof option === "object"
                                                ? (
                                                    option.text ??
                                                    option.label ??
                                                    option.value ??
                                                    ""
                                                )
                                                : option
                                        )}"
                                        placeholder="Option ${index + 1}"
                                    />

                                    <button
                                        type="button"
                                        class="remove-mc-option"
                                        data-index="${index}"
                                    >
                                        Remove
                                    </button>

                                </div>
                            `
                        )
                        .join("")
                }

            </div>

            <button
                type="button"
                id="addMcOptionBtn"
                class="btn btn-primary"
            >
                Add Option
            </button>

        </div>
    `;
}

function getMultipleChoiceOptions() {

    const inputs =
        document.querySelectorAll(
            ".mc-option-input"
        );

    return Array.from(
        inputs
    ).map(
        input =>
            input.value.trim()
    );
}

function openExerciseModal(
    exercise = null
) {

    createExerciseManager();

    createExerciseModal();

    editingExerciseId =
        exercise
            ? (
                exercise.id ??
                exercise.exercise_id
            )
            : null;

    const form =
        getElement(
            "exerciseForm"
        );

    if (form) {
        form.reset();
    }

    populateExerciseLessonSelect();

    if (exercise) {

        const normalized =
            normalizeExercise(
                exercise
            );

        setFieldValue(
            "exerciseLesson",
            normalized.lessonId
        );

        setFieldValue(
            "exerciseType",
            normalized.type
        );

        setFieldValue(
            "exerciseQuestion",
            normalized.question
        );

        setFieldValue(
            "exerciseAnswer",
            normalized.answer
        );

        setFieldValue(
            "exerciseExplanation",
            normalized.explanation
        );

        setFieldValue(
            "exerciseXp",
            normalized.xp
        );

        setFieldValue(
            "exerciseOrder",
            normalized.order
        );

        updateExerciseTypeUI();

        if (
            normalized.type ===
            "multiple_choice"
        ) {

            renderMultipleChoiceOptions(
                normalized.options.length >= 2
                    ? normalized.options
                    : [
                        "",
                        ""
                    ]
            );
        }

    } else {

        setFieldValue(
            "exerciseType",
            "multiple_choice"
        );

        setFieldValue(
            "exerciseXp",
            10
        );

        setFieldValue(
            "exerciseOrder",
            getNextExerciseOrder()
        );

        renderMultipleChoiceOptions(
            [
                "",
                ""
            ]
        );
    }

    const title =
        getElement(
            "exerciseModalTitle"
        );

    if (title) {

        title.textContent =
            exercise
                ? "Edit Exercise"
                : "Add Exercise";
    }

    hideMessageById(
        "exerciseMessage"
    );

    openModal(
        "exerciseModal"
    );
}

function closeExerciseModal() {

    closeModal(
        "exerciseModal"
    );

    editingExerciseId =
        null;
}

async function openEditExercise(
    exerciseId
) {

    let exercise =
        allExercises.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    exerciseId
                )
        );

    if (!exercise) {

        try {

            const response =
                await adminFetch(
                    `/admin/exercises/${exerciseId}`
                );

            exercise =
                response.exercise ||
                response.data ||
                response;

        } catch (error) {

            createExerciseModal();

            showMessageById(
                "exerciseMessage",
                error.message,
                "error"
            );

            openModal(
                "exerciseModal"
            );

            return;
        }
    }

    openExerciseModal(
        exercise
    );
}

async function deleteExercise(
    exerciseId
) {

    if (
        !confirm(
            "Delete this exercise?"
        )
    ) {
        return;
    }

    try {

        await adminFetch(
            `/admin/exercises/${exerciseId}`,
            {
                method: "DELETE"
            }
        );

        await loadExercises();

    } catch (error) {

        alert(
            error.message
        );
    }
}

function getNextExerciseOrder() {

    if (!allExercises.length) {
        return 1;
    }

    return (
        Math.max(
            ...allExercises.map(
                exercise =>
                    getNumber(
                        exercise.order,
                        0
                    )
            )
        ) + 1
    );
}

async function saveExercise() {

    const lessonId =
        getElement(
            "exerciseLesson"
        )?.value ||
        "";

    const type =
        getElement(
            "exerciseType"
        )?.value ||
        "multiple_choice";

    const question =
        getElement(
            "exerciseQuestion"
        )?.value.trim() ||
        "";

    if (!lessonId) {

        showMessageById(
            "exerciseMessage",
            "Please select a lesson.",
            "error"
        );

        return;
    }

    if (!question) {

        showMessageById(
            "exerciseMessage",
            "Please enter a question.",
            "error"
        );

        return;
    }

    const options =
        type ===
        "multiple_choice"
            ? getMultipleChoiceOptions()
                .filter(Boolean)
            : [];

    const payload = {

        lessonId,

        type,

        question,

        answer:
            getElement(
                "exerciseAnswer"
            )?.value.trim() ||
            "",

        explanation:
            getElement(
                "exerciseExplanation"
            )?.value.trim() ||
            "",

        xp:
            getNumber(
                getElement(
                    "exerciseXp"
                )?.value,
                0
            ),

        order:
            getNumber(
                getElement(
                    "exerciseOrder"
                )?.value,
                0
            ),

        options
    };

    try {

        const endpoint =
            editingExerciseId
                ? `/admin/exercises/${editingExerciseId}`
                : `/admin/lessons/${lessonId}/exercises`;

        const method =
            editingExerciseId
                ? "PATCH"
                : "POST";

        await adminFetch(
            endpoint,
            {
                method,
                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

        closeExerciseModal();

        await loadExercises();

    } catch (error) {

        showMessageById(
            "exerciseMessage",
            error.message,
            "error"
        );
    }
}

/* =========================================================
   TEACHERS
========================================================= */

async function loadTeachers() {

    try {

        const response =
            await adminFetch(
                "/admin/teachers"
            );

        const teachers =
            getArrayFromResponse(
                response,
                [
                    "teachers",
                    "data"
                ]
            );

        allTeachers =
            teachers;

        renderTeachers();

    } catch (error) {

        console.error(
            "Teachers loading error:",
            error
        );
        showMessageById(
            "teacherMessage",
            "Could not load teachers: " + error.message,
            "error"
        );
        allTeachers = [];

        renderTeachers();
    }
}

function getTeacherId(
    teacher
) {

    return (
        teacher?.id ??
        teacher?.teacher_id ??
        teacher?.teacherId ??
        ""
    );
}

function firstNameFromTeacher(
    teacher
) {

    return (
        teacher?.firstName ??
        teacher?.first_name ??
        ""
    );
}

function lastNameFromTeacher(
    teacher
) {

    return (
        teacher?.lastName ??
        teacher?.last_name ??
        ""
    );
}

function getTeacherFullName(
    teacher
) {

    if (!teacher) {
        return "Unknown Teacher";
    }

    const fullName =
        teacher.fullName ??
        teacher.full_name ??
        teacher.name ??
        `${firstNameFromTeacher(teacher)} ${lastNameFromTeacher(teacher)}`.trim();

    return (
        String(
            fullName || ""
        ).trim() ||
        "Unknown Teacher"
    );
}

function teacherName(
    teacher
) {

    return getTeacherFullName(
        teacher
    );
}

function getTeacherClassCount(
    teacher
) {

    return getNumber(
        teacher.classCount ??
        teacher.class_count ??
        teacher.totalClasses,
        0
    );
}

function getTeacherStudentCount(
    teacher
) {

    return getNumber(
        teacher.studentCount ??
        teacher.student_count ??
        teacher.totalStudents,
        0
    );
}

function renderTeachers() {

    const container =
        getElement(
            "teacherGrid"
        ) ||
        getElement(
            "teachersContainer"
        );

    if (!container) {
        return;
    }

    if (!allTeachers.length) {

        container.innerHTML = `
            <div class="empty-state">
                No teachers found.
            </div>
        `;

        return;
    }

    container.innerHTML =
        allTeachers
            .map(
                teacher => {

                    const id =
                        getTeacherId(
                            teacher
                        );

                    const status =
                        teacher.status ??
                        "active";

                    const specialization =
                        teacher.specialization ??
                        teacher.specialisation ??
                        "";

                    return `
                        <div
                            class="teacher-card"
                            data-teacher-id="${escapeHTML(id)}"
                        >

                            <div class="teacher-card-content">

                                <h3>
                                    ${escapeHTML(
                                        getTeacherFullName(
                                            teacher
                                        )
                                    )}
                                </h3>

                                <p>
                                    ${escapeHTML(
                                        teacher.email ??
                                        ""
                                    )}
                                </p>

                                <p>
                                    ${escapeHTML(
                                        teacher.phone ??
                                        ""
                                    )}
                                </p>

                                ${
                                    specialization
                                        ? `
                                            <p>
                                                ${escapeHTML(
                                                    specialization
                                                )}
                                            </p>
                                        `
                                        : ""
                                }

                                <p>
                                    Classes:
                                    ${getTeacherClassCount(
                                        teacher
                                    )}
                                </p>

                                <p>
                                    Students:
                                    ${getTeacherStudentCount(
                                        teacher
                                    )}
                                </p>

                                <span class="status-badge">
                                    ${escapeHTML(status)}
                                </span>

                            </div>

                            <div class="teacher-actions">

                                <button
                                    type="button"
                                    class="edit-teacher-btn"
                                    data-teacher-id="${escapeHTML(id)}"
                                >
                                    Edit
                                </button>

                                <button
                                    type="button"
                                    class="assign-class-btn"
                                    data-teacher-id="${escapeHTML(id)}"
                                >
                                    Assign Class
                                </button>

                                <button
                                    type="button"
                                    class="toggle-teacher-btn"
                                    data-teacher-id="${escapeHTML(id)}"
                                    data-status="${escapeHTML(status)}"
                                >
                                    ${
                                        String(
                                            status
                                        ).toLowerCase() ===
                                        "active"
                                            ? "Deactivate"
                                            : "Activate"
                                    }
                                </button>

                                <button
                                    type="button"
                                    class="delete-teacher-btn"
                                    data-teacher-id="${escapeHTML(id)}"
                                >
                                    Delete
                                </button>

                            </div>

                            <div
                                class="teacher-assignments"
                                data-teacher-id="${escapeHTML(id)}"
                            >
                                Loading assignments...
                            </div>

                        </div>
                    `;
                }
            )
            .join("");

    allTeachers.forEach(
        teacher => {

            const id =
                getTeacherId(
                    teacher
                );

            if (id) {

                loadTeacherAssignments(
                    id
                );
            }
        }
    );
}

async function loadTeacherAssignments(
    teacherId
) {

    if (
        teacherId === null ||
        teacherId === undefined ||
        teacherId === ""
    ) {
        return;
    }

    let container = null;

    try {

        const selector =
            `.teacher-assignments[data-teacher-id="${CSS.escape(String(teacherId))}"]`;

        container =
            document.querySelector(
                selector
            );

    } catch {

        /*
         * CSS.escape may not exist in a few
         * older environments.
         */
        const containers =
            document.querySelectorAll(
                ".teacher-assignments"
            );

        container =
            Array.from(
                containers
            ).find(
                item =>
                    String(
                        item.dataset.teacherId
                    ) ===
                    String(
                        teacherId
                    )
            );
    }

    if (!container) {
        return;
    }

    try {

        const response =
            await adminFetch(
                `/admin/teachers/${teacherId}/classes`
            );

        const assignments =
            getArrayFromResponse(
                response,
                [
                    "classes",
                    "data"
                ]
            );

        if (!assignments.length) {

            container.innerHTML =
                "<small>No class assignments.</small>";

            return;
        }

        container.innerHTML = `
            <strong>
                Assigned Classes
            </strong>

            <div class="assignment-list">

                ${
                    assignments
                        .map(
                            assignment => {

                                const classId =
                                    assignment.class_id ??
                                    assignment.classId ??
                                    assignment.class?.id ??
                                    assignment.class?.class_id ??
                                    /*
                                     * Fallback only if no real
                                     * class ID field exists.
                                     */
                                    null;

                                const className =
                                    assignment.name ??
                                    assignment.class_name ??
                                    assignment.title ??
                                    assignment.class?.name ??
                                    assignment.class?.title ??
                                    "Class";

                                if (
                                    classId === null ||
                                    classId === undefined ||
                                    classId === ""
                                ) {

                                    return `
                                        <div class="assignment-item">
                                            <span>
                                                ${escapeHTML(
                                                    className
                                                )}
                                            </span>
                                        </div>
                                    `;
                                }

                                return `
                                    <div class="assignment-item">

                                        <span>
                                            ${escapeHTML(
                                                className
                                            )}
                                        </span>

                                        <button
                                            type="button"
                                            class="remove-assignment-btn"
                                            data-teacher-id="${escapeHTML(teacherId)}"
                                            data-class-id="${escapeHTML(classId)}"
                                        >
                                            Remove
                                        </button>

                                    </div>
                                `;
                            }
                        )
                        .join("")
                }

            </div>
        `;

    } catch (error) {

        console.error(
            `Teacher ${teacherId} assignments loading error:`,
            error
        );

        container.innerHTML =
            "<small>Could not load assignments.</small>";
    }
}

function openTeacherModal(
    teacher = null
) {

    editingTeacherId =
        teacher
            ? getTeacherId(
                teacher
            )
            : null;

    const form =
        getElement(
            "teacherForm"
        );

    if (form) {
        form.reset();
    }

    if (teacher) {

        setFieldValue(
            "teacherFirstName",
            firstNameFromTeacher(
                teacher
            )
        );

        setFieldValue(
            "teacherLastName",
            lastNameFromTeacher(
                teacher
            )
        );

        setFieldValue(
            "teacherEmail",
            teacher.email ??
            ""
        );

        setFieldValue(
            "teacherPhone",
            teacher.phone ??
            ""
        );

        setFieldValue(
            "teacherSpecialization",
            teacher.specialization ??
            teacher.specialisation ??
            ""
        );

        setFieldValue(
            "teacherStatus",
            teacher.status ??
            "active"
        );
    }

    const title =
        getElement(
            "teacherModalTitle"
        );

    if (title) {

        title.textContent =
            teacher
                ? "Edit Teacher"
                : "Add Teacher";
    }

    hideMessageById(
        "teacherFormMessage"
    );

    openModal(
        "teacherModal"
    );
}

function closeTeacherModal() {

    closeModal(
        "teacherModal"
    );

    editingTeacherId =
        null;
}

async function editTeacher(
    teacherId
) {

    let teacher =
        allTeachers.find(
            item =>
                String(
                    getTeacherId(
                        item
                    )
                ) ===
                String(
                    teacherId
                )
        );

    if (!teacher) {

        try {

            const response =
                await adminFetch(
                    `/admin/teachers/${teacherId}`
                );

            teacher =
                response.teacher ||
                response.data ||
                response;

        } catch (error) {

            showMessageById(
                "teacherFormMessage",
                error.message,
                "error"
            );

            return;
        }
    }

    openTeacherModal(
        teacher
    );
}

async function deleteTeacher(
    teacherId
) {

    if (
        !confirm(
            "Delete this teacher?"
        )
    ) {
        return;
    }

    try {

        await adminFetch(
            `/admin/teachers/${teacherId}`,
            {
                method: "DELETE"
            }
        );

        await loadTeachers();

        await loadClasses();

        await loadDashboardStats();

    } catch (error) {

        alert(
            error.message
        );
    }
}

async function toggleTeacherStatus(
    teacherId,
    currentStatus
) {

    const isActive =
        String(
            currentStatus
        ).toLowerCase() ===
        "active";

    const newStatus =
        isActive
            ? "inactive"
            : "active";

    try {

        await adminFetch(
            `/admin/teachers/${teacherId}`,
            {
                method: "PATCH",
                body:
                    JSON.stringify({
                        status:
                            newStatus
                    })
            }
        );

        await loadTeachers();

        /*
         * Reload classes because an inactive
         * teacher should not leave stale state.
         */
        await loadClasses();

    } catch (error) {

        alert(
            error.message
        );
    }
}

/* =========================================================
   CLASSES
========================================================= */

async function loadClasses() {

    try {

        const response =
            await adminFetch(
                "/admin/classes"
            );

        const classes =
            getArrayFromResponse(
                response,
                [
                    "classes",
                    "data"
                ]
            );

        allClasses =
            classes.map(
                enrichClassWithCourse
            );

        populateClassLevelFilter();

        /*
         * Teacher information is resolved AFTER
         * the raw classes are loaded and BEFORE
         * rendering the cards.
         */
        await enrichClassesWithTeachers();

        renderFilteredClasses();

        populateClassCourseSelects();

    } catch (error) {

        console.error(
            "Classes loading error:",
            error
        );
                showMessageById(
            "classMessage",
            "Could not load classes: " + error.message,
            "error"
        );

        allClasses = [];

        renderFilteredClasses();
    }
}

function enrichClassWithCourse(
    classItem
) {

    if (!classItem) {
        return {};
    }

    const courseId =
        getClassCourseId(
            classItem
        );

    const course =
        allCourses.find(
            item =>
                String(
                    item.id ??
                    item.course_id
                ) ===
                String(
                    courseId
                )
        ) || {};

    return {

        ...classItem,

        courseName:
            classItem.courseName ??
            classItem.course_name ??
            course.name ??
            course.title ??
            course.course_name,

        course:
            classItem.course ??
            course
    };
}

/* =========================================================
   TEACHER RESOLUTION HELPERS
========================================================= */

function getAssignmentClassId(
    assignment
) {

    if (!assignment) {
        return "";
    }

    /*
     * VERY IMPORTANT:
     * assignment_id is NOT class_id.
     */
    return (
        assignment.class_id ??
        assignment.classId ??
        assignment.class?.id ??
        assignment.class?.class_id ??
        ""
    );
}

function getAssignmentTeacherId(
    assignment,
    fallbackTeacherId = null
) {

    return (
        assignment?.teacher_id ??
        assignment?.teacherId ??
        assignment?.teacher?.id ??
        assignment?.teacher?.teacher_id ??
        fallbackTeacherId ??
        ""
    );
}

function getAssignmentDate(
    assignment
) {

    return (
        assignment?.assigned_at ??
        assignment?.assignedAt ??
        assignment?.created_at ??
        assignment?.createdAt ??
        null
    );
}

function getTeacherFromClassData(
    classItem
) {

    if (!classItem) {
        return null;
    }

    if (
        classItem.teacher &&
        typeof classItem.teacher ===
            "object"
    ) {

        return classItem.teacher;
    }

    const teacherId =
        classItem.teacherId ??
        classItem.teacher_id ??
        null;

    if (
        teacherId === null ||
        teacherId === undefined ||
        teacherId === ""
    ) {

        return null;
    }

    const matched =
        allTeachers.find(
            teacher =>
                String(
                    getTeacherId(
                        teacher
                    )
                ) ===
                String(
                    teacherId
                )
        );

    return (
        matched ||
        null
    );
}

function getDirectClassTeacherId(
    classItem
) {

    if (!classItem) {
        return "";
    }

    return (
        classItem.teacherId ??
        classItem.teacher_id ??
        classItem.teacher?.id ??
        classItem.teacher?.teacher_id ??
        ""
    );
}

function getDirectClassTeacherName(
    classItem
) {

    if (!classItem) {
        return "";
    }

    const candidates = [
        classItem.teacherName,
        classItem.teacher_name,
        classItem.teacher?.fullName,
        classItem.teacher?.full_name,
        classItem.teacher?.name
    ];

    for (
        const candidate of candidates
    ) {

        if (
            candidate !== undefined &&
            candidate !== null &&
            String(
                candidate
            ).trim() !== ""
        ) {

            return String(
                candidate
            ).trim();
        }
    }

    const teacher =
        getTeacherFromClassData(
            classItem
        );

    if (teacher) {

        const name =
            getTeacherFullName(
                teacher
            );

        if (
            name &&
            name !==
                "Unknown Teacher"
        ) {

            return name;
        }
    }

    return "";
}

function shouldReplaceTeacherAssignment(
    existing,
    incoming
) {

    if (!existing) {
        return true;
    }

    /*
     * Primary assignment always wins.
     */
    if (
        incoming.isPrimary &&
        !existing.isPrimary
    ) {

        return true;
    }

    if (
        existing.isPrimary &&
        !incoming.isPrimary
    ) {

        return false;
    }

    /*
     * If both have same primary state,
     * use assigned time.
     */
    const existingTime =
        existing.assignedAt
            ? new Date(
                existing.assignedAt
              ).getTime()
            : 0;

    const incomingTime =
        incoming.assignedAt
            ? new Date(
                incoming.assignedAt
              ).getTime()
            : 0;

    return (
        incomingTime >=
        existingTime
    );
}

async function enrichClassesWithTeachers() {

    if (
        !Array.isArray(
            allClasses
        ) ||
        !allClasses.length
    ) {

        return;
    }

    /*
     * STEP 1:
     * Build a teacher lookup from the teachers
     * already loaded.
     */
    const teachersById =
        new Map();

    allTeachers.forEach(
        teacher => {

            const teacherId =
                getTeacherId(
                    teacher
                );

            if (
                teacherId !== ""
            ) {

                teachersById.set(
                    String(
                        teacherId
                    ),
                    teacher
                );
            }
        }
    );

    /*
     * STEP 2:
     * Start with direct data from /admin/classes.
     *
     * This endpoint already knows the primary/
     * most-recent teacher, so preserve that data.
     */
    const resolvedClasses =
        allClasses.map(
            classItem => {

                const directTeacherId =
                    getDirectClassTeacherId(
                        classItem
                    );

                const directTeacherName =
                    getDirectClassTeacherName(
                        classItem
                    );

                const directTeacher =
                    getTeacherFromClassData(
                        classItem
                    ) ||
                    (
                        directTeacherId !== ""
                            ? teachersById.get(
                                String(
                                    directTeacherId
                                )
                            ) || null
                            : null
                    );

                return {

                    classItem,

                    directTeacherId:
                        directTeacherId ||
                        directTeacher?.id ||
                        directTeacher?.teacher_id ||
                        "",

                    directTeacherName:
                        directTeacherName ||
                        (
                            directTeacher
                                ? getTeacherFullName(
                                    directTeacher
                                )
                                : ""
                        ),

                    directTeacher:
                        directTeacher ||
                        null
                };
            }
        );

    /*
     * STEP 3:
     * Load assignment records as a SECOND source.
     *
     * This is mainly a fallback/verification layer.
     */
    const classAssignments =
        new Map();

    const teacherResults =
        await Promise.all(
            allTeachers.map(
                async teacher => {

                    const teacherId =
                        getTeacherId(
                            teacher
                        );

                    if (!teacherId) {

                        return {
                            teacher,
                            assignments: []
                        };
                    }

                    try {

                        const response =
                            await adminFetch(
                                `/admin/teachers/${teacherId}/classes`
                            );

                        const assignments =
                            getArrayFromResponse(
                                response,
                                [
                                    "classes",
                                    "data"
                                ]
                            );

                        return {

                            teacher,

                            assignments:
                                Array.isArray(
                                    assignments
                                )
                                    ? assignments
                                    : []
                        };

                    } catch (error) {

                        console.warn(
                            `Could not load assignments for teacher ${teacherId}:`,
                            error
                        );

                        return {

                            teacher,

                            assignments:
                                []
                        };
                    }
                }
            )
        );

    teacherResults.forEach(
        ({
            teacher,
            assignments
        }) => {

            if (
                !Array.isArray(
                    assignments
                )
            ) {

                return;
            }

            assignments.forEach(
                assignment => {

                    const classId =
                        getAssignmentClassId(
                            assignment
                        );

                    if (
                        classId === "" ||
                        classId === null ||
                        classId === undefined
                    ) {

                        return;
                    }

                    const isPrimary =
                        getBoolean(
                            assignment.isPrimary ??
                            assignment.is_primary,
                            false
                        );

                    const assignedAt =
                        getAssignmentDate(
                            assignment
                        );

                    const key =
                        String(
                            classId
                        );

                    const entry = {

                        teacher,

                        teacherId:
                            getAssignmentTeacherId(
                                assignment,
                                getTeacherId(
                                    teacher
                                )
                            ),

                        isPrimary,

                        assignedAt,

                        assignmentId:
                            assignment.assignment_id ??
                            assignment.assignmentId ??
                            null,

                        assignment
                    };

                    const existing =
                        classAssignments.get(
                            key
                        );

                    if (
                        shouldReplaceTeacherAssignment(
                            existing,
                            entry
                        )
                    ) {

                        classAssignments.set(
                            key,
                            entry
                        );
                    }
                }
            );
        }
    );

    /*
     * STEP 4:
     * Resolve the final teacher for every class.
     */
    allClasses =
        resolvedClasses.map(
            ({
                classItem,
                directTeacherId,
                directTeacherName,
                directTeacher
            }) => {

                const classId =
                    classItem.id ??
                    classItem.class_id ??
                    "";

                const assignment =
                    classAssignments.get(
                        String(
                            classId
                        )
                    );

                /*
                 * If the assignment is explicitly primary,
                 * it wins over direct fallback data.
                 *
                 * Otherwise direct /admin/classes data
                 * remains authoritative because that query
                 * already orders primary/recent correctly.
                 */
                let finalTeacher =
                    directTeacher ||
                    null;

                let finalTeacherId =
                    directTeacherId ||
                    "";

                let finalTeacherName =
                    directTeacherName ||
                    "";

                if (
                    assignment?.isPrimary
                ) {

                    finalTeacher =
                        assignment.teacher ||
                        finalTeacher;

                    finalTeacherId =
                        assignment.teacherId ||
                        getTeacherId(
                            finalTeacher
                        ) ||
                        finalTeacherId;

                    finalTeacherName =
                        getTeacherFullName(
                            finalTeacher
                        );

                } else if (
                    !finalTeacherId &&
                    assignment
                ) {

                    finalTeacher =
                        assignment.teacher ||
                        null;

                    finalTeacherId =
                        assignment.teacherId ||
                        getTeacherId(
                            finalTeacher
                        ) ||
                        "";

                    finalTeacherName =
                        getTeacherFullName(
                            finalTeacher
                        );
                }

                /*
                 * Last local lookup by teacher ID.
                 */
                if (
                    !finalTeacher &&
                    finalTeacherId !== ""
                ) {

                    finalTeacher =
                        teachersById.get(
                            String(
                                finalTeacherId
                            )
                        ) ||
                        null;
                }

                if (
                    !finalTeacherName &&
                    finalTeacher
                ) {

                    finalTeacherName =
                        getTeacherFullName(
                            finalTeacher
                        );
                }

                /*
                 * Preserve backend aliases too.
                 */
                return {

                    ...classItem,

                    teacher:
                        finalTeacher ||
                        null,

                    teacherId:
                        finalTeacherId ||
                        null,

                    teacher_id:
                        finalTeacherId ||
                        null,

                    teacherName:
                        finalTeacherName ||
                        "",

                    teacher_name:
                        finalTeacherName ||
                        "",

                    /*
                     * Helpful metadata without replacing
                     * existing backend fields.
                     */
                    teacherAssignmentId:
                        assignment?.assignmentId ??
                        classItem.teacherAssignmentId ??
                        null,

                    teacherIsPrimary:
                        assignment?.isPrimary ??
                        getBoolean(
                            classItem.teacherIsPrimary ??
                            classItem.teacher_is_primary,
                            false
                        )
                };
            }
        );
}

function getClassCourseId(
    classItem
) {

    if (!classItem) {
        return "";
    }

    return (
        classItem.courseId ??
        classItem.course_id ??
        classItem.course?.id ??
        classItem.course?.course_id ??
        ""
    );
}

function getClassCourseName(
    classItem
) {

    const courseName =
        classItem.courseName ??
        classItem.course_name ??
        classItem.course?.name ??
        (
            typeof classItem.course ===
            "string"
                ? classItem.course
                : ""
        );

    return courseName ||
        "—";
}

function getClassTeacherId(
    classItem
) {

    if (!classItem) {
        return "";
    }

    return (
        classItem.teacherId ??
        classItem.teacher_id ??
        classItem.teacher?.id ??
        classItem.teacher?.teacher_id ??
        ""
    );
}

function getClassTeacherName(
    classItem
) {

    if (!classItem) {
        return "No teacher";
    }

    const candidates = [

        classItem.teacherName,

        classItem.teacher_name,

        classItem.teacher?.fullName,

        classItem.teacher?.full_name,

        classItem.teacher?.name
    ];

    for (
        const candidate of candidates
    ) {

        if (
            candidate !== undefined &&
            candidate !== null &&
            String(
                candidate
            ).trim() !== ""
        ) {

            return String(
                candidate
            ).trim();
        }
    }

    const teacherId =
        getClassTeacherId(
            classItem
        );

    if (
        teacherId !== ""
    ) {

        const matched =
            allTeachers.find(
                teacher =>
                    String(
                        getTeacherId(
                            teacher
                        )
                    ) ===
                    String(
                        teacherId
                    )
            );

        if (matched) {

            const name =
                getTeacherFullName(
                    matched
                );

            if (
                name &&
                name !==
                    "Unknown Teacher"
            ) {

                return name;
            }
        }
    }

    return "No teacher";
}

function getClassStudentCount(
    classItem
) {

    return getNumber(
        classItem.studentCount ??
        classItem.student_count ??
        classItem.totalStudents ??
        classItem.enrolledStudents ??
        classItem.enrollmentCount,
        0
    );
}

function getClassMaxStudents(
    classItem
) {

    return getNumber(
        classItem.maxStudents ??
        classItem.max_students ??
        classItem.capacity,
        0
    );
}

function getClassStatus(
    classItem
) {

    return (
        classItem.status ||
        "active"
    );
}

function populateClassLevelFilter() {

    const select =
        getElement(
            "classLevelFilter"
        );

    if (!select) {
        return;
    }

    const current =
        select.value;

    const levels =
        [
            ...new Set(
                allClasses
                    .map(
                        classItem =>
                            classItem.level
                    )
                    .filter(Boolean)
            )
        ]
        .sort();

    select.innerHTML = `
        <option value="">
            All Levels
        </option>

        ${
            levels
                .map(
                    level => `
                        <option
                            value="${escapeHTML(level)}"
                        >
                            ${escapeHTML(level)}
                        </option>
                    `
                )
                .join("")
        }
    `;

    if (
        levels.includes(
            current
        )
    ) {

        select.value =
            current;
    }
}

function getClassSearchText(
    classItem
) {

    return [

        classItem.name,

        classItem.description,

        classItem.room,

        classItem.schedule,

        classItem.level,

        getClassCourseName(
            classItem
        ),

        getClassTeacherName(
            classItem
        ),

        getClassStatus(
            classItem
        )

    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
}

function getFilteredClasses() {

    const search =
        getElement(
            "classSearch"
        )?.value
            ?.toLowerCase()
            ?.trim() ||
        "";

    const status =
        getElement(
            "classStatusFilter"
        )?.value ||
        "";

    const level =
        getElement(
            "classLevelFilter"
        )?.value ||
        "";

    return allClasses.filter(
        classItem => {

            const matchesSearch =
                !search ||
                getClassSearchText(
                    classItem
                ).includes(
                    search
                );

            const matchesStatus =
                !status ||
                String(
                    getClassStatus(
                        classItem
                    )
                ).toLowerCase() ===
                String(
                    status
                ).toLowerCase();

            const matchesLevel =
                !level ||
                String(
                    classItem.level ||
                    ""
                ) ===
                String(
                    level
                );

            return (
                matchesSearch &&
                matchesStatus &&
                matchesLevel
            );
        }
    );
}

function renderFilteredClasses() {

    renderClasses(
        getFilteredClasses()
    );
}

function renderClasses(
    classes
) {

    const grid =
        getElement(
            "classGrid"
        );

    if (!grid) {
        return;
    }

    if (
        !Array.isArray(
            classes
        ) ||
        !classes.length
    ) {

        grid.innerHTML = `
            <div class="empty-state">
                No classes found.
            </div>
        `;

        return;
    }

    grid.innerHTML =
        classes
            .map(
                renderClassCard
            )
            .join("");
}

function renderClassCard(
    classItem
) {

    const id =
        classItem.id ??
        classItem.class_id;

    const name =
        classItem.name ??
        classItem.title ??
        "Unnamed Class";

    const level =
        classItem.level ??
        "—";

    const status =
        getClassStatus(
            classItem
        );

    const studentCount =
        getClassStudentCount(
            classItem
        );

    const maxStudents =
        getClassMaxStudents(
            classItem
        );

    const teacherName =
        getClassTeacherName(
            classItem
        );

    return `
        <div
            class="class-card"
            data-class-id="${escapeHTML(id)}"
        >

            <div class="class-card-content">

                <h3>
                    ${escapeHTML(name)}
                </h3>

                <p>
                    Course:
                    ${escapeHTML(
                        getClassCourseName(
                            classItem
                        )
                    )}
                </p>

                <p>
                    Level:
                    ${escapeHTML(level)}
                </p>

                <p>
                    Teacher:
                    <strong>
                        ${escapeHTML(
                            teacherName
                        )}
                    </strong>
                </p>

                <p>
                    Students:
                    ${studentCount}${
                        maxStudents
                            ? ` / ${maxStudents}`
                            : ""
                    }
                </p>

                <small>
                    ${escapeHTML(status)}
                </small>

            </div>

            <div class="class-actions">

                <button
                    type="button"
                    class="edit-class-btn"
                    data-class-id="${escapeHTML(id)}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="view-class-btn"
                    data-class-id="${escapeHTML(id)}"
                >
                    View Class
                </button>

                <button
                    type="button"
                    class="toggle-class-btn"
                    data-class-id="${escapeHTML(id)}"
                    data-status="${escapeHTML(status)}"
                >
                    ${
                        String(
                            status
                        ).toLowerCase() ===
                        "active"
                            ? "Deactivate"
                            : "Activate"
                    }
                </button>

                <button
                    type="button"
                    class="delete-class-btn"
                    data-class-id="${escapeHTML(id)}"
                >
                    Delete
                </button>

            </div>

        </div>
    `;
}

function populateClassCourseSelects() {

    const selects =
        [
            getElement("course"),
            getElement("classCourse")
        ]
        .filter(Boolean);

    selects.forEach(
        select => {

            const current =
                select.value;

            select.innerHTML = `
                <option value="">
                    Select Course
                </option>

                ${
                    allCourses
                        .map(
                            course => {

                                const id =
                                    course.id ??
                                    course.course_id;

                                const name =
                                    course.name ??
                                    course.title ??
                                    course.course_name ??
                                    "Course";

                                return `
                                    <option
                                        value="${escapeHTML(id)}"
                                    >
                                        ${escapeHTML(name)}
                                    </option>
                                `;
                            }
                        )
                        .join("")
                }
            `;

            if (current) {

                select.value =
                    current;
            }
        }
    );
}

function populateAssignClassSelect() {

    const select =
        getElement(
            "assignClassSelect"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select Class
        </option>

        ${
            allClasses
                .map(
                    classItem => {

                        const id =
                            classItem.id ??
                            classItem.class_id;

                        const name =
                            classItem.name ??
                            classItem.title ??
                            "Class";

                        const teacher =
                            getClassTeacherName(
                                classItem
                            );

                        return `
                            <option
                                value="${escapeHTML(id)}"
                            >
                                ${escapeHTML(name)}
                                ${
                                    teacher !==
                                    "No teacher"
                                        ? ` — Teacher: ${escapeHTML(teacher)}`
                                        : ""
                                }
                            </option>
                        `;
                    }
                )
                .join("")
        }
    `;
}

function openClassModal(
    classItem = null
) {

    editingClassId =
        classItem
            ? (
                classItem.id ??
                classItem.class_id
            )
            : null;

    const form =
        getElement(
            "classForm"
        );

    if (form) {
        form.reset();
    }

    setFieldValue(
        "classCourse",
        classItem
            ? getClassCourseId(
                classItem
            )
            : ""
    );

    setFieldValue(
        "course",
        classItem
            ? getClassCourseId(
                classItem
            )
            : ""
    );

    setFieldValue(
        "classLevel",
        classItem
            ? classItem.level || ""
            : ""
    );

    setFieldValue(
        "className",
        classItem
            ? (
                classItem.name ??
                classItem.title ??
                ""
            )
            : ""
    );

    setFieldValue(
        "classDescription",
        classItem
            ? classItem.description || ""
            : ""
    );

    setFieldValue(
        "classRoom",
        classItem
            ? classItem.room || ""
            : ""
    );

    setFieldValue(
        "classSchedule",
        classItem
            ? classItem.schedule || ""
            : ""
    );

    setFieldValue(
        "classStartDate",
        classItem
            ? (
                classItem.startDate ??
                classItem.start_date ??
                ""
            )
            : ""
    );

    setFieldValue(
        "classEndDate",
        classItem
            ? (
                classItem.endDate ??
                classItem.end_date ??
                ""
            )
            : ""
    );

    setFieldValue(
        "classMaxStudents",
        classItem
            ? getClassMaxStudents(
                classItem
            )
            : ""
    );

    setFieldValue(
        "classStatus",
        classItem
            ? getClassStatus(
                classItem
            )
            : "active"
    );

    const title =
        getElement(
            "classModalTitle"
        );

    if (title) {

        title.textContent =
            classItem
                ? "Edit Class"
                : "Add Class";
    }

    hideMessageById(
        "classFormMessage"
    );

    hideMessageById(
        "classFormMessage"
    );

    openModal(
        "classModal"
    );
}

function closeClassModal() {

    closeModal(
        "classModal"
    );

    editingClassId =
        null;
}

async function openEditClass(
    classId
) {

    const localClass =
        allClasses.find(
            item =>
                String(
                    item.id ??
                    item.class_id
                ) ===
                String(
                    classId
                )
        );

    if (localClass) {

        openClassModal(
            localClass
        );

        return;
    }

    try {

        const response =
            await adminFetch(
                `/admin/classes/${classId}`
            );

        const classItem =
            response.class ||
            response.data ||
            response;

        openClassModal(
            classItem
        );

    } catch (error) {

        showMessageById(
            "classFormMessage",
            error.message,
            "error"
        );
    }
}

async function saveClass() {

    const payload = {

        courseId:
            getElement(
                "classCourse"
            )?.value ||
            getElement(
                "course"
            )?.value ||
            "",

        level:
            getElement(
                "classLevel"
            )?.value ||
            "",

        name:
            getElement(
                "className"
            )?.value.trim() ||
            "",

        description:
            getElement(
                "classDescription"
            )?.value.trim() ||
            "",

        room:
            getElement(
                "classRoom"
            )?.value.trim() ||
            "",

        schedule:
            getElement(
                "classSchedule"
            )?.value.trim() ||
            "",

                startDate:
            getElement("classStartDate")?.value || null,

        endDate:
            getElement("classEndDate")?.value || null,
        maxStudents:
            getNumber(
                getElement(
                    "classMaxStudents"
                )?.value,
                0
            ),

        status:
            getElement(
                "classStatus"
            )?.value ||
            "active"
    };

    if (!payload.name) {

        showMessageById(
            "classFormMessage",
            "Please enter a class name.",
            "error"
        );

        return;
    }

    if (!payload.courseId) {

        showMessageById(
            "classMessage",
            "Please select a course.",
            "error"
        );

        return;
    }

    try {

        const endpoint =
            editingClassId
                ? `/admin/classes/${editingClassId}`
                : "/admin/classes";

        const method =
            editingClassId
                ? "PATCH"
                : "POST";

        await adminFetch(
            endpoint,
            {
                method,
                body:
                    JSON.stringify(
                        payload
                    )
            }
        );

        closeClassModal();

        await loadClasses();

        await loadDashboardStats();

    } catch (error) {

        showMessageById(
            "classMessage",
            error.message,
            "error"
        );
    }
}

async function toggleClassStatus(
    classId,
    currentStatus
) {

    const isActive =
        String(
            currentStatus
        ).toLowerCase() ===
        "active";

    const newStatus =
        isActive
            ? "inactive"
            : "active";

    try {

        await adminFetch(
            `/admin/classes/${classId}`,
            {
                method: "PATCH",
                body:
                    JSON.stringify({
                        status:
                            newStatus
                    })
            }
        );

        await loadClasses();

    } catch (error) {

        alert(
            error.message
        );
    }
}

async function deleteClass(
    classId
) {

    if (
        !confirm(
            "Delete this class?"
        )
    ) {
        return;
    }

    try {

        await adminFetch(
            `/admin/classes/${classId}`,
            {
                method: "DELETE"
            }
        );

        await loadClasses();

        await loadDashboardStats();

    } catch (error) {

        alert(
            error.message
        );
    }
}

/* =========================================================
   CLASS DETAILS / ROSTER
========================================================= */

async function viewClass(
    classId
) {

    selectedClassId =
        classId;

    const classItem =
        allClasses.find(
            item =>
                String(
                    item.id ??
                    item.class_id
                ) ===
                String(
                    classId
                )
        );

    selectedClassDetails =
        classItem ||
        null;

    updateClassDetailsHeader();

    openModal(
        "classDetailsModal"
    );

    await loadClassDetails(
        classId
    );
}function updateClassDetailsHeader() {

    const c = selectedClassDetails;

    if (!c) return;

    const set = (id, value) => {
        const el = getElement(id);
        if (el) el.textContent = value;
    };

    const name = c.name ?? c.title ?? "Class";

    set("classDetailsModalTitle", name);
    set("rosterClassName", name);

    set(
        "rosterClassMeta",
        [
            getClassCourseName(c),
            c.level,
            c.schedule,
            c.room
        ]
            .filter(x => x && x !== "—")
            .join(" • ") || "No details"
    );

    set("rosterStudentCount", classRosterStudents.length);
    set("rosterCapacity", getClassMaxStudents(c) || "—");
    set("rosterTeacher", getClassTeacherName(c));
}

async function loadClassDetails(
    classId
) {

    try {

        await Promise.all([
            loadClassAttendance(
                classId
            ),
            loadClassRoster(
                classId
            )
        ]);

    } catch (error) {

        console.error(
            "Class details error:",
            error
        );
    }
}

async function loadClassRoster(
    classId
) {

    try {

        const response =
            await adminFetch(
                `/admin/classes/${classId}/students`
            );

        const roster =
            getArrayFromResponse(
                response,
                [
                    "students",
                    "roster",
                    "enrollments",
                    "data"
                ]
            );

        classRosterStudents =
            roster;
        updateClassDetailsHeader();
        renderClassRoster(
            classRosterStudents
        );

    } catch (error) {

        console.error(
            "Class roster error:",
            error
        );

        classRosterStudents =
            [];

        renderClassRoster(
            []
        );
    }
}

async function loadClassAttendance(
    classId
) {

    classAttendanceMap = {};

    try {

        const response =
            await adminFetch(
                `/admin/classes/${classId}/attendance`
            );

        const attendance =
            getArrayFromResponse(
                response,
                [
                    "attendance",
                    "data"
                ]
            );

        attendance.forEach(
            record => {

                const studentId =
                    record.studentId ??
                    record.student_id ??
                    record.student?.id;

                if (!studentId) {
                    return;
                }

                classAttendanceMap[
                    String(
                        studentId
                    )
                ] =
                    record;
            }
        );

    } catch (error) {

        console.warn(
            "Could not load class attendance:",
            error
        );
    }
}

function getLatestAttendance(
    studentId
) {

    return (
        classAttendanceMap[
            String(
                studentId
            )
        ] ||
        null
    );
}

function getAttendanceLabel(
    attendance
) {

    if (!attendance) {
        return "No record";
    }

    return (
        attendance.status ??
        attendance.attendanceStatus ??
        attendance.attendance_status ??
        (
            attendance.present === true
                ? "Present"
                : attendance.present === false
                    ? "Absent"
                    : "Recorded"
        )
    );
}

function getEnrollmentStudent(
    enrollment
) {

    if (!enrollment) {
        return null;
    }

    return (
        enrollment.student ||
        enrollment.user ||
        enrollment
    );
}

function getEnrollmentStudentId(
    enrollment
) {

    const student =
        getEnrollmentStudent(
            enrollment
        );

    return (
        enrollment.studentId ??
        enrollment.student_id ??
        student?.id ??
        student?.student_id ??
        ""
    );
}

function getEnrollmentStatus(
    enrollment
) {

    return (
        enrollment.status ??
        enrollment.enrollmentStatus ??
        enrollment.enrollment_status ??
        "active"
    );
}

function getClassRosterTable() {

    return getFirstElement(
        [
            "classRosterTable",
            "classRosterBody",
            "classStudentsTable"
        ]
    );
}

function renderClassRoster(
    students
) {

    const tbody =
        getClassRosterTable();

    if (!tbody) {
        return;
    }

    if (
        !Array.isArray(
            students
        ) ||
        !students.length
    ) {

        tbody.innerHTML = `
            <tr>

                <td
                    colspan="6"
                    style="text-align:center;"
                >
                    No students enrolled in this class.
                </td>

            </tr>
        `;

        return;
    }

    tbody.innerHTML =
        students
            .map(
                enrollment => {

                    const student =
                        getEnrollmentStudent(
                            enrollment
                        );

                    const studentId =
                        getEnrollmentStudentId(
                            enrollment
                        );

                    const name =
                        getStudentName(
                            student
                        );

                    const email =
                        getStudentEmail(
                            student
                        );

                    const level =
                        getStudentLevel(
                            student
                        );

                    const attendance =
                        getLatestAttendance(
                            studentId
                        );

                    return `
                        <tr>

                            <td>
                                ${escapeHTML(name)}
                            </td>

                            <td>
                                ${escapeHTML(email)}
                            </td>

                            <td>
                                ${escapeHTML(level)}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getAttendanceLabel(
                                        attendance
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    getEnrollmentStatus(
                                        enrollment
                                    )
                                )}
                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="remove-class-student-btn"
                                    data-student-id="${escapeHTML(studentId)}"
                                >
                                    Remove
                                </button>

                            </td>

                        </tr>
                    `;
                }
            )
            .join("");
}

function closeClassDetailsModal() {

    closeModal(
        "classDetailsModal"
    );

    selectedClassId =
        null;

    selectedClassDetails =
        null;

    classRosterStudents =
        [];

    classAttendanceMap =
        {};
}

/* =========================================================
   ENROLLMENT
========================================================= */

function openEnrollStudentModal() {

    if (!selectedClassId) {
        return;
    }

    const search =
        getFirstElement(
            [
                "enrollStudentSearch",
                "enrollmentStudentSearch"
            ]
        );

    if (search) {
        search.value = "";
    }

    populateEnrollmentStudentList();

    hideMessageById(
        "enrollStudentMessage"
    );

    openModal(
        "enrollStudentModal"
    );
}

function closeEnrollStudentModal() {

    closeModal(
        "enrollStudentModal"
    );
}

function populateEnrollmentStudentList() {

    const select =
        getElement(
            "enrollStudentSelect"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select Student
        </option>

        ${
            allStudents
                .map(
                    student => {

                        const id =
                            getStudentId(
                                student
                            );

                        return `
                            <option
                                value="${escapeHTML(id)}"
                            >
                                ${escapeHTML(
                                    getStudentName(
                                        student
                                    )
                                )}
                                —
                                ${escapeHTML(
                                    getStudentEmail(
                                        student
                                    )
                                )}
                            </option>
                        `;
                    }
                )
                .join("")
        }
    `;
}

async function saveEnrollment() {

    if (!selectedClassId) {
        return;
    }

    const studentId =
        getElement(
            "enrollStudentSelect"
        )?.value;

    if (!studentId) {

        showMessageById(
            "enrollStudentMessage",
            "Please select a student.",
            "error"
        );

        return;
    }

    try {

        await adminFetch(
            `/admin/classes/${selectedClassId}/students`,
            {
                method: "POST",
                body:
                    JSON.stringify({
                        studentId
                    })
            }
        );

        closeEnrollStudentModal();

        await loadClassDetails(
            selectedClassId
        );

        await loadClasses();

    } catch (error) {

        showMessageById(
            "enrollStudentMessage",
            error.message,
            "error"
        );
    }
}

async function removeStudentFromClass(
    studentId
) {

    if (!selectedClassId) {
        return;
    }

    if (
        !confirm(
            "Remove this student from the class?"
        )
    ) {
        return;
    }

    try {

        await adminFetch(
            `/admin/classes/${selectedClassId}/students/${studentId}`,
            {
                method: "DELETE"
            }
        );

        await loadClassDetails(
            selectedClassId
        );

        await loadClasses();

    } catch (error) {

        alert(
            error.message
        );
    }
}

/* =========================================================
   TEACHER → CLASS ASSIGNMENT
========================================================= */

function openAssignClassModal(
    teacherId
) {

    selectedTeacherId =
        teacherId;

    populateAssignClassSelect();

    setFieldValue(
        "assignClassSelect",
        ""
    );

    hideMessageById(
        "assignTeacherMessage"
    );

    /*
     * Update the small information box if
     * the HTML has it.
     */
    const info =
        getElement(
            "assignTeacherInfo"
        );

    if (info) {

        const teacher =
            allTeachers.find(
                item =>
                    String(
                        getTeacherId(
                            item
                        )
                    ) ===
                    String(
                        teacherId
                    )
            );

        info.textContent =
            teacher
                ? `Select a class for ${getTeacherFullName(teacher)}.`
                : "Select a class for this teacher.";
    }

    openModal(
        "assignTeacherModal"
    );
}

function closeAssignClassModal() {

    closeModal(
        "assignTeacherModal"
    );

    selectedTeacherId =
        null;
}

async function saveTeacherAssignment() {

    if (!selectedTeacherId) {

        showMessageById(
            "assignTeacherMessage",
            "Please select a teacher first.",
            "error"
        );

        return;
    }

    const classId =
        getElement(
            "assignClassSelect"
        )?.value;

    if (!classId) {

        showMessageById(
            "assignTeacherMessage",
            "Please select a class.",
            "error"
        );

        return;
    }

    /*
     * Prevent accidental duplicate assignment
     * when the current teacher is already attached
     * to the selected class.
     */
    const currentTeacherId =
        selectedTeacherId;

    const classItem =
        allClasses.find(
            item =>
                String(
                    item.id ??
                    item.class_id
                ) ===
                String(
                    classId
                )
        );

    const existingTeacherId =
        getClassTeacherId(
            classItem
        );

    /*
     * Do not block assigning another teacher.
     * The backend decides how existing assignments
     * are handled. We explicitly request primary.
     */

    const submitButton =
        getFirstElement(
            [
                "saveTeacherAssignmentBtn",
                "assignTeacherBtn"
            ]
        );

    const originalButtonText =
        submitButton?.textContent ||
        "Assign Class";

    try {

        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Assigning...";
        }

        /*
         * CRITICAL:
         * Use the exact form/backend contract.
         */
        await adminFetch(
            `/admin/teachers/${currentTeacherId}/classes`,
            {
                method: "POST",
                body:
                    JSON.stringify({

                        classId:

                            String(
                                classId
                            ),

                        isPrimary:
                            true
                    })
            }
        );

        /*
         * Refresh the teacher list first so
         * assignment counts + assignment cards
         * are current.
         */
        await loadTeachers();

        /*
         * Refresh classes SECOND so the newly
         * assigned teacher is visible in
         * class cards.
         */
        await loadClasses();

        /*
         * Refresh statistics afterwards.
         */
        await loadDashboardStats();

        /*
         * Keep class select state in sync.
         */
        populateAssignClassSelect();

        /*
         * If the class being viewed is still open,
         * refresh its teacher information too.
         */
        if (
            selectedClassId &&
            String(
                selectedClassId
            ) ===
            String(
                classId
            )
        ) {

            selectedClassDetails =
                allClasses.find(
                    item =>
                        String(
                            item.id ??
                            item.class_id
                        ) ===
                        String(
                            classId
                        )
                ) ||
                selectedClassDetails;

            updateClassDetailsHeader();
        }

        closeAssignClassModal();

    } catch (error) {

        console.error(
            "Teacher assignment error:",
            error
        );

        showMessageById(
            "assignTeacherMessage",
            error.message ||
                "Could not assign teacher to class.",
            "error"
        );

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                originalButtonText;
        }
    }
}

async function removeTeacherAssignment(
    teacherId,
    classId
) {

    if (
        !teacherId ||
        !classId
    ) {

        alert(
            "A valid teacher and class are required."
        );

        return;
    }

    if (
        !confirm(
            "Remove this class assignment?"
        )
    ) {
        return;
    }

    try {

        await adminFetch(
            `/admin/teachers/${teacherId}/classes/${classId}`,
            {
                method: "DELETE"
            }
        );

        /*
         * Keep both sides synchronized.
         */
        await loadTeachers();

        await loadClasses();

        await loadDashboardStats();

    } catch (error) {

        alert(
            error.message
        );
    }
}

/* =========================================================
   STATIC FORM HANDLERS
========================================================= */

function initializeStaticForms() {

    const accessCodeForm =
        getElement(
            "accessCodeForm"
        );

    if (accessCodeForm) {

        accessCodeForm.addEventListener(
            "submit",
            generateAccessCode
        );
    }

    const moduleForm =
        getElement(
            "moduleForm"
        );

    if (moduleForm) {

        moduleForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                if (!selectedCourseId) {

                    showMessageById(
                        "moduleMessage",
                        "Please select a course first.",
                        "error"
                    );

                    return;
                }

                const raw =
                    formToObject(
                        moduleForm
                    );

                const payload = {

                    courseId:
                        selectedCourseId,

                    title:
                        raw.title ??
                        raw.name ??
                        raw.moduleTitle ??
                        getElement(
                            "moduleTitle"
                        )?.value ??
                        "",

                    name:
                        raw.name ??
                        raw.title ??
                        raw.moduleTitle ??
                        getElement(
                            "moduleTitle"
                        )?.value ??
                        "",

                    description:
                        raw.description ??
                        raw.moduleDescription ??
                        getElement(
                            "moduleDescription"
                        )?.value ??
                        "",

                    order:
                        raw.order ??
                        raw.moduleOrder ??
                        getElement(
                            "moduleOrder"
                        )?.value ??
                        "",

                    moduleOrder:
                        raw.moduleOrder ??
                        raw.order ??
                        getElement(
                            "moduleOrder"
                        )?.value ??
                        ""
                };

                try {

                    const endpoint =
                        editingModuleId
                            ? `/admin/modules/${editingModuleId}`
                            : "/admin/modules";

                    const method =
                        editingModuleId
                            ? "PATCH"
                            : "POST";

                    await adminFetch(
                        endpoint,
                        {
                            method,
                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                    closeModuleModal();

                    await loadSelectedCourse();

                } catch (error) {

                    showMessageById(
                        "moduleMessage",
                        error.message,
                        "error"
                    );
                }
            }
        );
    }

    const lessonForm =
        getElement(
            "lessonForm"
        );

    if (lessonForm) {

        lessonForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                if (!selectedModuleId) {

                    showMessageById(
                        "lessonMessage",
                        "Please select a module.",
                        "error"
                    );

                    return;
                }

                const raw =
                    formToObject(
                        lessonForm
                    );

                const payload = {

                    moduleId:
                        selectedModuleId,

                    title:
                        raw.title ??
                        raw.name ??
                        raw.lessonTitle ??
                        getElement(
                            "lessonTitle"
                        )?.value ??
                        "",

                    name:
                        raw.name ??
                        raw.title ??
                        raw.lessonTitle ??
                        getElement(
                            "lessonTitle"
                        )?.value ??
                        "",

                    description:
                        raw.description ??
                        raw.lessonDescription ??
                        getElement(
                            "lessonDescription"
                        )?.value ??
                        "",

                    content:
                        raw.content ??
                        raw.lessonContent ??
                        getElement(
                            "lessonContent"
                        )?.value ??
                        "",

                    order:
                        raw.order ??
                        raw.lessonOrder ??
                        getElement(
                            "lessonOrder"
                        )?.value ??
                        "",

                    lessonOrder:
                        raw.lessonOrder ??
                        raw.order ??
                        getElement(
                            "lessonOrder"
                        )?.value ??
                        "",

                    xp:
                        raw.xp ??
                        raw.lessonXp ??
                        getElement(
                            "lessonXp"
                        )?.value ??
                        "",

                    xpReward:
                        raw.xpReward ??
                        raw.xp ??
                        raw.lessonXp ??
                        getElement(
                            "lessonXp"
                        )?.value ??
                        ""
                };

                try {

                    const endpoint =
                        editingLessonId
                            ? `/admin/lessons/${editingLessonId}`
                            : `/admin/modules/${selectedModuleId}/lessons`;

                    const method =
                        editingLessonId
                            ? "PATCH"
                            : "POST";

                    await adminFetch(
                        endpoint,
                        {
                            method,
                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                    closeLessonModal();

                    await loadSelectedCourse();

                } catch (error) {

                    showMessageById(
                        "lessonMessage",
                        error.message,
                        "error"
                    );
                }
            }
        );
    }

    const teacherForm =
        getElement(
            "teacherForm"
        );

    if (teacherForm) {

        teacherForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const raw =
                    formToObject(
                        teacherForm
                    );

                const firstName =
                    raw.firstName ??
                    raw.first_name ??
                    raw.teacherFirstName ??
                    getElement(
                        "teacherFirstName"
                    )?.value ??
                    "";

                const lastName =
                    raw.lastName ??
                    raw.last_name ??
                    raw.teacherLastName ??
                    getElement(
                        "teacherLastName"
                    )?.value ??
                    "";

                const fullName =
                    raw.fullName ??
                    `${firstName} ${lastName}`.trim();

                const payload = {

                    fullName,

                    firstName,

                    lastName,

                    email:
                        raw.email ??
                        raw.teacherEmail ??
                        getElement(
                            "teacherEmail"
                        )?.value ??
                        "",

                    phone:
                        raw.phone ??
                        raw.teacherPhone ??
                        getElement(
                            "teacherPhone"
                        )?.value ??
                        "",

                    specialization:
                        raw.specialization ??
                        raw.specialisation ??
                        raw.teacherSpecialization ??
                        getElement(
                            "teacherSpecialization"
                        )?.value ??
                        "",

                    status:
                        raw.status ??
                        raw.teacherStatus ??
                        getElement(
                            "teacherStatus"
                        )?.value ??
                        "active"
                };

                const password =
                    raw.password ??
                    raw.teacherPassword ??
                    getElement(
                        "teacherPassword"
                    )?.value ??
                    "";
                                    if (
                    !editingTeacherId &&
                    String(password).length < 6
                ) {

                    showMessageById(
                        "teacherFormMessage",
                        "A password of at least 6 characters is required when creating a teacher.",
                        "error"
                    );

                    return;
                }

                if (password) {

                    payload.password =
                        password;
                }

                try {

                    const endpoint =
                        editingTeacherId
                            ? `/admin/teachers/${editingTeacherId}`
                            : "/admin/teachers";

                    const method =
                        editingTeacherId
                            ? "PATCH"
                            : "POST";

                    await adminFetch(
                        endpoint,
                        {
                            method,
                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                    closeTeacherModal();

                    await loadTeachers();

                    await loadClasses();

                    await loadDashboardStats();

                } catch (error) {

                    showMessageById(
                        "teacherFormMessage",
                        error.message,
                        "error"
                    );
                }
            }
        );
    }

    const classForm =
        getElement(
            "classForm"
        );

    if (classForm) {

        classForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await saveClass();
            }
        );
    }

    /*
     * Support both the newer enrollmentForm
     * and any alternative ID that might exist.
     */
    const enrollmentForm =
        getFirstElement(
            [
                "enrollmentForm",
                "enrollStudentForm"
            ]
        );

    if (enrollmentForm) {

        enrollmentForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await saveEnrollment();
            }
        );
    }

    /*
     * CRITICAL FIX:
     *
     * HTML uses:
     *      assignTeacherForm
     *
     * Older JS used:
     *      teacherAssignmentForm
     *
     * Support both, with the real current
     * HTML ID taking priority.
     */
    const assignmentForm =
        getFirstElement(
            [
                "assignTeacherForm",
                "teacherAssignmentForm"
            ]
        );

    if (assignmentForm) {

        assignmentForm.addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                await saveTeacherAssignment();
            }
        );
    }
}

/* =========================================================
   BUTTON HELPER
========================================================= */

function bindButton(
    id,
    handler
) {

    const button =
        getElement(id);

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        event => {

            /*
             * Do not always preventDefault on
             * submit buttons because forms need
             * native validation before submit.
             */
            if (
                button.type !==
                "submit"
            ) {

                event.preventDefault();
            }

            handler(event);
        }
    );
}

/* =========================================================
   STATIC BUTTON INITIALIZATION
========================================================= */

function initializeStaticButtons() {

    bindButton(
        "logoutBtn",
        () => {

            localStorage.removeItem(
                "ldc_admin_token"
            );

            localStorage.removeItem(
                "ldc_admin"
            );

            window.location.href =
                "admin-login.html";
        }
    );

    bindButton(
        "addModuleBtn",
        () => {

            if (!selectedCourseId) {

                showMessageById(
                    "moduleMessage",
                    "Please select a course first.",
                    "error"
                );

                return;
            }

            openModuleModal();
        }
    );

    bindButton(
        "closeModuleModal",
        closeModuleModal
    );

    bindButton(
        "cancelModuleBtn",
        closeModuleModal
    );

    bindButton(
        "closeLessonModal",
        closeLessonModal
    );

    bindButton(
        "cancelLessonBtn",
        closeLessonModal
    );

    bindButton(
        "closeStudentModal",
        closeStudentModal
    );

    bindButton(
        "cancelStudentBtn",
        closeStudentModal
    );

    bindButton(
        "saveStudentBtn",
        saveStudent
    );

    bindButton(
        "addTeacherBtn",
        () => openTeacherModal()
    );
    bindButton(
        "deleteStudentBtn",
        async () => {

            const id = selectedStudentId;

            if (!id) return;

            closeStudentModal();

            await deleteStudent(id);
        }
    );
    bindButton(
        "closeTeacherModal",
        closeTeacherModal
    );

    bindButton(
        "cancelTeacherBtn",
        closeTeacherModal
    );

    bindButton(
        "addClassBtn",
        () => openClassModal()
    );

    bindButton(
        "closeClassModal",
        closeClassModal
    );

    bindButton(
        "cancelClassBtn",
        closeClassModal
    );

    bindButton(
        "closeClassDetailsModal",
        closeClassDetailsModal
    );

    bindButton(
        "addStudentToClassBtn",
        openEnrollStudentModal
    );

    bindButton(
        "closeEnrollStudentModal",
        closeEnrollStudentModal
    );

    bindButton(
        "cancelEnrollStudentBtn",
        closeEnrollStudentModal
    );

    bindButton(
        "closeAssignTeacherModal",
        closeAssignClassModal
    );

    bindButton(
        "cancelAssignTeacherBtn",
        closeAssignClassModal
    );
}

/* =========================================================
   SEARCH + FILTERS
========================================================= */

function initializeSearchAndFilters() {

    const studentSearch =
        getElement(
            "studentSearch"
        );

    if (studentSearch) {

        studentSearch.addEventListener(
            "input",
            event => {

                const query =
                    event.target.value
                        .toLowerCase()
                        .trim();

                const filtered =
                    allStudents.filter(
                        student => {

                            const searchableText =
                                [

                                    getStudentName(
                                        student
                                    ),

                                    getStudentEmail(
                                        student
                                    ),

                                    getStudentPhone(
                                        student
                                    ),

                                    getStudentCourse(
                                        student
                                    ),

                                    getStudentLevel(
                                        student
                                    ),

                                    getStudentPaymentStatus(
                                        student
                                    ),

                                    getStudentAccountStatus(
                                        student
                                    )

                                ]
                                    .join(" ")
                                    .toLowerCase();

                            return searchableText.includes(
                                query
                            );
                        }
                    );

                renderStudents(
                    filtered
                );
            }
        );
    }

    const classSearch =
        getElement(
            "classSearch"
        );

    if (classSearch) {

        classSearch.addEventListener(
            "input",
            renderFilteredClasses
        );
    }

    const classStatusFilter =
        getElement(
            "classStatusFilter"
        );

    if (classStatusFilter) {

        classStatusFilter.addEventListener(
            "change",
            renderFilteredClasses
        );
    }

    const classLevelFilter =
        getElement(
            "classLevelFilter"
        );

    if (classLevelFilter) {

        classLevelFilter.addEventListener(
            "change",
            renderFilteredClasses
        );
    }

    const classStudentSearch =
        getElement(
            "classStudentSearch"
        );

    if (classStudentSearch) {

        classStudentSearch.addEventListener(
            "input",
            event => {

                const query =
                    event.target.value
                        .toLowerCase()
                        .trim();

                const filtered =
                    classRosterStudents.filter(
                        enrollment => {

                            const student =
                                getEnrollmentStudent(
                                    enrollment
                                );

                            const searchableText =
                                [

                                    getStudentName(
                                        student
                                    ),

                                    getStudentEmail(
                                        student
                                    ),

                                    getStudentPhone(
                                        student
                                    ),

                                    getStudentLevel(
                                        student
                                    ),

                                    getEnrollmentStatus(
                                        enrollment
                                    )

                                ]
                                    .join(" ")
                                    .toLowerCase();

                            return searchableText.includes(
                                query
                            );
                        }
                    );

                renderClassRoster(
                    filtered
                );
            }
        );
    }

    const enrollSearch =
        getFirstElement(
            [
                "enrollStudentSearch",
                "enrollmentStudentSearch"
            ]
        );

    if (enrollSearch) {

        enrollSearch.addEventListener(
            "input",
            event => {

                const query =
                    event.target.value
                        .toLowerCase()
                        .trim();

                const select =
                    getElement(
                        "enrollStudentSelect"
                    );

                if (!select) {
                    return;
                }

                const matchingStudents =
                    allStudents.filter(
                        student =>
                            [

                                getStudentName(
                                    student
                                ),

                                getStudentEmail(
                                    student
                                ),

                                getStudentPhone(
                                    student
                                )

                            ]
                                .join(" ")
                                .toLowerCase()
                                .includes(
                                    query
                                )
                    );

                select.innerHTML = `
                    <option value="">
                        Select Student
                    </option>

                    ${
                        matchingStudents
                            .map(
                                student => {

                                    const id =
                                        getStudentId(
                                            student
                                        );

                                    return `
                                        <option
                                            value="${escapeHTML(id)}"
                                        >
                                            ${escapeHTML(
                                                getStudentName(
                                                    student
                                                )
                                            )}
                                            —
                                            ${escapeHTML(
                                                getStudentEmail(
                                                    student
                                                )
                                            )}
                                        </option>
                                    `;
                                }
                            )
                            .join("")
                    }
                `;
            }
        );
    }
}

/* =========================================================
   DYNAMIC EVENT DELEGATION
========================================================= */

async function handleDashboardClick(
    event
) {

    const button =
        event.target.closest(
            "button"
        );

    if (!button) {
        return;
    }

    if (
        button.type ===
        "submit"
    ) {

        /*
         * Let the form submit listeners handle
         * submit buttons. This avoids double
         * execution.
         */
        return;
    }

    if (
        button.classList.contains(
            "select-course-btn"
        )
    ) {

        await selectCourse(
            button.dataset.courseId
        );

        return;
    }

    if (
        button.id ===
        "emptyAddModuleBtn"
    ) {

        if (selectedCourseId) {
            openModuleModal();
        }

        return;
    }

    if (
        button.classList.contains(
            "edit-module-btn"
        )
    ) {

        await openEditModule(
            button.dataset.moduleId
        );

        return;
    }

    if (
        button.classList.contains(
            "delete-module-btn"
        )
    ) {

        await deleteModule(
            button.dataset.moduleId
        );

        return;
    }

    if (
        button.classList.contains(
            "add-lesson-btn"
        )
    ) {

        openLessonModal(
            button.dataset.moduleId
        );

        return;
    }

    if (
        button.classList.contains(
            "edit-lesson-btn"
        )
    ) {

        await openEditLesson(
            button.dataset.lessonId
        );

        return;
    }

    if (
        button.classList.contains(
            "delete-lesson-btn"
        )
    ) {

        await deleteLesson(
            button.dataset.lessonId
        );

        return;
    }

    if (
        button.classList.contains(
            "copy-code-btn"
        )
    ) {

        const code =
            button.dataset.code ||
            "";

        try {

            await navigator.clipboard.writeText(
                code
            );

            const original =
                button.textContent;

            button.textContent =
                "Copied!";

            setTimeout(
                () => {

                    button.textContent =
                        original;

                },
                1200
            );

        } catch (error) {

            console.error(
                "Copy failed:",
                error
            );

            alert(
                "Could not copy the access code."
            );
        }

        return;
    }

    if (
        button.classList.contains(
            "edit-student-btn"
        )
    ) {

        const student =
            allStudents.find(
                item =>
                    String(
                        getStudentId(
                            item
                        )
                    ) ===
                    String(
                        button.dataset.studentId
                    )
            );

        if (student) {

            openStudentModal(
                student
            );
        }

        return;
    }

    if (
        button.classList.contains(
            "delete-student-btn"
        )
    ) {

        await deleteStudent(
            button.dataset.studentId
        );

        return;
    }

    if (
        button.id ===
        "addExerciseBtn"
    ) {

        openExerciseModal();

        return;
    }

    if (
        button.id ===
        "closeExerciseModal"
    ) {

        closeExerciseModal();

        return;
    }

    if (
        button.id ===
        "cancelExerciseBtn"
    ) {

        closeExerciseModal();

        return;
    }

    if (
        button.id ===
        "addMcOptionBtn"
    ) {

        const current =
            getMultipleChoiceOptions();

        current.push("");

        renderMultipleChoiceOptions(
            current
        );

        return;
    }

    if (
        button.classList.contains(
            "remove-mc-option"
        )
    ) {

        const index =
            getNumber(
                button.dataset.index,
                -1
            );

        const current =
            getMultipleChoiceOptions();

        if (
            index >= 0 &&
            index < current.length
        ) {

            current.splice(
                index,
                1
            );

            renderMultipleChoiceOptions(
                current.length >= 2
                    ? current
                    : [
                        "",
                        ""
                    ]
            );
        }

        return;
    }

    if (
        button.classList.contains(
            "edit-exercise-btn"
        )
    ) {

        await openEditExercise(
            button.dataset.exerciseId
        );

        return;
    }

    if (
        button.classList.contains(
            "delete-exercise-btn"
        )
    ) {

        await deleteExercise(
            button.dataset.exerciseId
        );

        return;
    }

    if (
        button.classList.contains(
            "edit-teacher-btn"
        )
    ) {

        await editTeacher(
            button.dataset.teacherId
        );

        return;
    }

    if (
        button.classList.contains(
            "assign-class-btn"
        )
    ) {

        openAssignClassModal(
            button.dataset.teacherId
        );

        return;
    }

    if (
        button.classList.contains(
            "toggle-teacher-btn"
        )
    ) {

        await toggleTeacherStatus(
            button.dataset.teacherId,
            button.dataset.status
        );

        return;
    }

    if (
        button.classList.contains(
            "delete-teacher-btn"
        )
    ) {

        await deleteTeacher(
            button.dataset.teacherId
        );

        return;
    }

    if (
        button.classList.contains(
            "remove-assignment-btn"
        )
    ) {

        await removeTeacherAssignment(
            button.dataset.teacherId,
            button.dataset.classId
        );

        return;
    }

    if (
        button.id ===
        "emptyAddClassBtn"
    ) {

        openClassModal();

        return;
    }

    if (
        button.classList.contains(
            "edit-class-btn"
        )
    ) {

        await openEditClass(
            button.dataset.classId
        );

        return;
    }

    if (
        button.classList.contains(
            "view-class-btn"
        )
    ) {

        await viewClass(
            button.dataset.classId
        );

        return;
    }

    if (
        button.classList.contains(
            "toggle-class-btn"
        )
    ) {

        await toggleClassStatus(
            button.dataset.classId,
            button.dataset.status
        );

        return;
    }

    if (
        button.classList.contains(
            "delete-class-btn"
        )
    ) {

        await deleteClass(
            button.dataset.classId
        );

        return;
    }

    if (
        button.classList.contains(
            "remove-class-student-btn"
        )
    ) {

        await removeStudentFromClass(
            button.dataset.studentId
        );

        return;
    }
}

/* =========================================================
   MODAL BACKDROP
========================================================= */

function initializeModalBackdrop() {

    document.addEventListener(
        "click",
        event => {

            const modal =
                event.target.closest(
                    ".modal"
                );

            if (!modal) {
                return;
            }

            if (
                event.target !==
                modal
            ) {
                return;
            }

            const id =
                modal.id;

            closeModal(
                id
            );

            switch (id) {

                case "studentModal":

                    selectedStudentId =
                        null;

                    break;

                case "teacherModal":

                    editingTeacherId =
                        null;

                    break;

                case "classModal":

                    editingClassId =
                        null;

                    break;

                case "classDetailsModal":

                    selectedClassId =
                        null;

                    selectedClassDetails =
                        null;

                    classRosterStudents =
                        [];

                    classAttendanceMap =
                        {};

                    break;

                case "moduleModal":

                    editingModuleId =
                        null;

                    break;

                case "lessonModal":

                    editingLessonId =
                        null;

                    selectedModuleId =
                        null;

                    break;

                case "exerciseModal":

                    editingExerciseId =
                        null;

                    break;

                case "assignTeacherModal":

                    selectedTeacherId =
                        null;

                    break;
            }
        }
    );
}

/* =========================================================
   ESCAPE KEY
========================================================= */

function initializeEscapeKey() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Escape"
            ) {

                return;
            }

            const visibleModals =
                document.querySelectorAll(
                    ".modal:not([hidden])"
                );

            visibleModals.forEach(
                modal => {

                    closeModal(
                        modal.id
                    );
                }
            );

            selectedStudentId =
                null;

            editingTeacherId =
                null;

            editingClassId =
                null;

            editingModuleId =
                null;

            editingLessonId =
                null;

            selectedModuleId =
                null;

            editingExerciseId =
                null;

            selectedTeacherId =
                null;

            selectedClassId =
                null;

            selectedClassDetails =
                null;
        }
    );
}

/* =========================================================
   INITIALIZE ADMIN DASHBOARD
========================================================= */

async function initializeAdminDashboard() {

    console.log(
        "LDC Admin Dashboard starting..."
    );

    try {

        createExerciseManager();

        createExerciseModal();

        /*
         * Courses first because classes,
         * access codes and LMS content depend
         * on course data.
         */
        await loadCourses();

        /*
         * Load teachers before classes.
         * This ensures teacher lookup data exists
         * before the class cards are rendered.
         */
        await Promise.all([
            loadStudents(),
            loadTeachers(),
            loadAccessCodes()
        ]);

        /*
         * Classes are enriched with teacher
         * assignments before rendering.
         */
        await loadClasses();

        /*
         * Statistics after underlying data.
         */
        await loadDashboardStats();

        renderFilteredClasses();

        populateClassCourseSelects();

        populateAssignClassSelect();

        console.log(
            "LDC Admin Dashboard ready."
        );

    } catch (error) {

        console.error(
            "Admin dashboard initialization error:",
            error
        );
    }
}

/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        adminToken =
            localStorage.getItem(
                "ldc_admin_token"
            );

        adminData =
            localStorage.getItem(
                "ldc_admin"
            );

        if (
            !adminToken ||
            !adminData
        ) {

            window.location.href =
                "admin-login.html";

            return;
        }

        initializeStaticButtons();

        initializeStaticForms();

        initializeSearchAndFilters();

        initializeModalBackdrop();

        initializeEscapeKey();

        document.addEventListener(
            "click",
            handleDashboardClick
        );

        await initializeAdminDashboard();

    },
    {
        once: true
    }
);
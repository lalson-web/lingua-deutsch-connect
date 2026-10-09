"use strict";

/* =========================================================
   LINGUA DEUTSCH CONNECT
   ATTENDANCE SYSTEM
========================================================= */

const API_URL = "/api";

const STUDENT_TOKEN_KEY = "ldc_student_token";
const STUDENT_DATA_KEY = "ldc_student";

const TEACHER_TOKEN_KEY = "ldc_teacher_token";
const TEACHER_DATA_KEY = "ldc_teacher";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let currentRole = null;

let teacherClasses = [];
let selectedTeacherClassId = null;

let attendanceRefreshTimer = null;


/* =========================================================
   DOM HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(message, type = "info") {

    const box = $("attendanceMessage");

    if (!box) {
        return;
    }

    box.textContent = message;

    box.className = "page-message show";

    if (type === "success") {
        box.classList.add("success");
    } else if (type === "error") {
        box.classList.add("error");
    } else {
        box.classList.add("info");
    }
}


function hideMessage() {

    const box = $("attendanceMessage");

    if (!box) {
        return;
    }

    box.textContent = "";
    box.className = "page-message";
}


/* =========================================================
   STORAGE
========================================================= */

function getStudentToken() {
    return localStorage.getItem(STUDENT_TOKEN_KEY);
}


function getTeacherToken() {
    return localStorage.getItem(TEACHER_TOKEN_KEY);
}


function getStoredStudent() {

    try {

        const data =
            localStorage.getItem(STUDENT_DATA_KEY);

        return data
            ? JSON.parse(data)
            : null;

    } catch (error) {

        console.error(
            "Could not read student data:",
            error
        );

        return null;
    }
}


function getStoredTeacher() {

    try {

        const data =
            localStorage.getItem(TEACHER_DATA_KEY);

        return data
            ? JSON.parse(data)
            : null;

    } catch (error) {

        console.error(
            "Could not read teacher data:",
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
    options = {},
    token = null
) {

    const config = {

        method:
            options.method ||
            "GET",

        headers: {

            "Content-Type":
                "application/json",

            ...(options.headers || {})
        }
    };


    if (options.body !== undefined) {

        config.body =
            typeof options.body === "string"
                ? options.body
                : JSON.stringify(options.body);
    }


    if (token) {

        config.headers.Authorization =
            `Bearer ${token}`;
    }


    let response;

    try {

        response =
            await fetch(
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

        data =
            await response.json();

    } catch (error) {

        data = null;
    }


    if (!response.ok) {

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            throw new Error(
                data?.message ||
                "Your session has expired. Please log in again."
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
   AUTHENTICATION
========================================================= */

function determineUserRole() {

    const studentToken =
        getStudentToken();

    const teacherToken =
        getTeacherToken();

    const student =
        getStoredStudent();

    const teacher =
        getStoredTeacher();


    /*
        Student has priority when both
        localStorage entries accidentally exist.
    */

    if (
        studentToken &&
        student
    ) {

        currentRole = "student";
        currentUser = student;

        return true;
    }


    if (
        teacherToken &&
        teacher
    ) {

        currentRole = "teacher";
        currentUser = teacher;

        return true;
    }


    currentRole = null;
    currentUser = null;

    return false;
}


function redirectToLogin() {

    window.location.href =
        "login.html";
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

    localStorage.removeItem(
        TEACHER_TOKEN_KEY
    );

    localStorage.removeItem(
        TEACHER_DATA_KEY
    );


    if (attendanceRefreshTimer) {

        clearInterval(
            attendanceRefreshTimer
        );

        attendanceRefreshTimer = null;
    }


    redirectToLogin();
}


/* =========================================================
   NORMALIZATION HELPERS
========================================================= */

function getDataObject(response) {

    if (!response) {
        return null;
    }

    if (
        response.data !== undefined
    ) {

        return response.data;
    }

    return response;
}


function getArray(
    response,
    possibleKeys = []
) {

    if (Array.isArray(response)) {
        return response;
    }


    const data =
        getDataObject(response);


    if (Array.isArray(data)) {
        return data;
    }


    for (
        const key of possibleKeys
    ) {

        if (
            Array.isArray(
                response?.[key]
            )
        ) {

            return response[key];
        }


        if (
            Array.isArray(
                data?.[key]
            )
        ) {

            return data[key];
        }
    }


    return [];
}


function firstDefined(...values) {

    for (
        const value of values
    ) {

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


function getStudentId(student) {

    return firstDefined(
        student?.id,
        student?.studentId,
        student?.student_id
    );
}


function getClassId(classItem) {

    return firstDefined(
        classItem?.id,
        classItem?.classId,
        classItem?.class_id
    );
}


/* =========================================================
   DATE HELPERS
========================================================= */

function getTodayDate() {

    const now =
        new Date();

    const year =
        now.getFullYear();

    const month =
        String(
            now.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            now.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;
}


function getCodeExpiry() {

    /*
        Attendance code remains valid for 15 minutes.
        The server still controls the actual validity.
    */

    const expiry =
        new Date(
            Date.now() +
            15 * 60 * 1000
        );

    return expiry.toISOString();
}


function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateValue
        );
    }


    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


function formatTime(dateValue) {

    if (!dateValue) {
        return "—";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateValue
        );
    }


    return date.toLocaleTimeString(
        undefined,
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   HTML SAFETY
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


/* =========================================================
   STUDENT INITIALIZATION
========================================================= */

async function initializeStudentAttendance() {

    const token =
        getStudentToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    try {

        await Promise.all([

            loadStudentTodayAttendance(),

            loadStudentAttendanceHistory(),

            loadStudentAttendanceSummary()
        ]);

    } catch (error) {

        console.error(
            "Student attendance initialization error:",
            error
        );

        showMessage(
            error.message ||
            "Unable to load attendance.",
            "error"
        );
    }
}


/* =========================================================
   STUDENT CHECK-IN
========================================================= */

async function submitAttendanceCode(event) {

    event.preventDefault();


    const input =
        $("attendanceCode");

    const button =
        $("attendanceCheckinBtn");


    if (!input || !button) {
        return;
    }


    const code =
        input.value
            .trim()
            .toUpperCase();


    if (!code) {

        showMessage(
            "Please enter the attendance code provided by your teacher.",
            "error"
        );

        input.focus();

        return;
    }


    const token =
        getStudentToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    button.disabled = true;

    button.textContent =
        "Checking...";

    hideMessage();


    try {

        const response =
            await apiFetch(
                "/student/attendance/check-in",
                {
                    method: "POST",

                    body: {
                        code
                    }
                },
                token
            );


        showMessage(
            response?.message ||
            "✓ Attendance marked successfully!",
            "success"
        );


        input.value = "";


        await Promise.all([

            loadStudentTodayAttendance(),

            loadStudentAttendanceHistory(),

            loadStudentAttendanceSummary()
        ]);

    } catch (error) {

        console.error(
            "Attendance check-in failed:",
            error
        );

        showMessage(
            error.message ||
            "Unable to mark attendance.",
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "✓ Mark Attendance";
    }
}


/* =========================================================
   STUDENT TODAY ATTENDANCE
========================================================= */

async function loadStudentTodayAttendance() {

    const token =
        getStudentToken();


    if (!token) {
        return;
    }


    try {

        const response =
            await apiFetch(
                "/student/attendance/today",
                {},
                token
            );


        const data =
            getDataObject(response);


        const attendance =
            data?.attendance ||
            data?.record ||
            (
                data &&
                (
                    data.status ||
                    data.attendanceStatus
                )
                    ? data
                    : null
            );


        renderStudentTodayAttendance(
            attendance
        );

    } catch (error) {

        console.warn(
            "Could not load today's attendance:",
            error.message
        );

        renderStudentTodayAttendance(
            null
        );
    }
}


function renderStudentTodayAttendance(
    attendance
) {

    const statusElement =
        $("todayAttendanceStatus");

    const timeElement =
        $("todayAttendanceTime");


    if (
        !statusElement ||
        !timeElement
    ) {

        return;
    }


    if (!attendance) {

        statusElement.textContent =
            "Not marked";

        timeElement.textContent =
            "—";

        return;
    }


    const status =
        String(
            firstDefined(
                attendance.status,
                attendance.attendanceStatus,
                "Present"
            )
        );


    statusElement.textContent =
        formatAttendanceStatus(
            status
        );


    const checkInTime =
        firstDefined(

            attendance.checkInTime,

            attendance.check_in_time,

            attendance.time,

            attendance.createdAt,

            attendance.created_at
        );


    timeElement.textContent =
        formatTime(
            checkInTime
        );
}


/* =========================================================
   STUDENT SUMMARY
========================================================= */

async function loadStudentAttendanceSummary() {

    const token =
        getStudentToken();


    if (!token) {
        return;
    }


    try {

        /*
            There is NO:
            /student/attendance/summary

            The existing backend endpoint:
            GET /student/attendance

            already provides the attendance records
            and summary information.
        */

        const response =
            await apiFetch(
                "/student/attendance",
                {},
                token
            );


        const data =
            getDataObject(response) || {};


        const summary =
            data.summary ||
            response?.summary ||
            {};


        const percentage =
            firstDefined(

                summary.attendancePercentage,

                summary.attendance_percentage,

                summary.percentage,

                summary.rate,

                data.attendancePercentage,

                data.attendance_percentage,

                data.percentage,

                data.rate,

                0
            );


        const streak =
            firstDefined(

                summary.currentStreak,

                summary.current_streak,

                summary.streak,

                data.currentStreak,

                data.current_streak,

                data.streak,

                0
            );


        if (
            $("attendancePercentage")
        ) {

            const numericPercentage =
                Number(
                    percentage
                );


            $("attendancePercentage")
                .textContent =
                `${Number.isFinite(numericPercentage)
                    ? numericPercentage.toFixed(0)
                    : "0"}%`;
        }


        if (
            $("attendanceStreak")
        ) {

            const numericStreak =
                Number(
                    streak
                );


            $("attendanceStreak")
                .textContent =
                `${Number.isFinite(numericStreak)
                    ? numericStreak
                    : 0} day${
                        numericStreak === 1
                            ? ""
                            : "s"
                    }`;
        }

    } catch (error) {

        console.warn(
            "Could not load attendance summary:",
            error.message
        );
    }
}


/* =========================================================
   STUDENT HISTORY
========================================================= */

async function loadStudentAttendanceHistory() {

    const container =
        $("attendanceHistory");


    if (!container) {
        return;
    }


    const token =
        getStudentToken();


    if (!token) {
        return;
    }


    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            Loading attendance history...
        </div>
    `;


    try {

        const response =
            await apiFetch(
                "/student/attendance",
                {},
                token
            );


        const records =
            getArray(
                response,
                [
                    "attendance",
                    "records",
                    "history",
                    "items"
                ]
            );


        renderStudentHistory(
            records
        );

    } catch (error) {

        console.warn(
            "Could not load attendance history:",
            error.message
        );


        container.innerHTML = `
            <div class="empty-state">
                <strong>No attendance history available</strong>
                Your attendance records will appear here.
            </div>
        `;
    }
}


function renderStudentHistory(
    records
) {

    const container =
        $("attendanceHistory");


    if (!container) {
        return;
    }


    if (!records.length) {

        container.innerHTML = `
            <div class="empty-state">
                <strong>No attendance records yet</strong>
                Your previous attendance will appear here.
            </div>
        `;

        return;
    }


    const sortedRecords =
        [...records].sort(
            (a, b) => {

                const dateB =
                    firstDefined(

                        b.date,

                        b.attendanceDate,

                        b.attendance_date,

                        b.createdAt,

                        b.created_at
                    );


                const dateA =
                    firstDefined(

                        a.date,

                        a.attendanceDate,

                        a.attendance_date,

                        a.createdAt,

                        a.created_at
                    );


                return (
                    new Date(dateB) -
                    new Date(dateA)
                );
            }
        );


    container.innerHTML =
        sortedRecords
            .slice(0, 12)
            .map(record => {

                const date =
                    firstDefined(

                        record.date,

                        record.attendanceDate,

                        record.attendance_date,

                        record.createdAt,

                        record.created_at
                    );


                const status =
                    firstDefined(

                        record.status,

                        record.attendanceStatus,

                        record.attendance_status,

                        "Present"
                    );


                const className =
                    firstDefined(

                        record.className,

                        record.class_name,

                        record.class?.name,

                        "Class"
                    );


                const checkInTime =
                    firstDefined(

                        record.checkInTime,

                        record.check_in_time,

                        record.time,

                        record.createdAt,

                        record.created_at
                    );


                return `
                    <article class="history-card">

                        <div class="history-date">
                            ${escapeHTML(
                                formatDate(date)
                            )}
                        </div>

                        <h3>
                            ${escapeHTML(
                                className
                            )}
                        </h3>

                        <p>
                            Status:
                            <strong class="${getStatusClass(status)}">
                                ${escapeHTML(
                                    formatAttendanceStatus(
                                        status
                                    )
                                )}
                            </strong>
                        </p>

                        <p>
                            ${escapeHTML(
                                formatTime(
                                    checkInTime
                                )
                            )}
                        </p>

                    </article>
                `;
            })
            .join("");
}


/* =========================================================
   TEACHER INITIALIZATION
========================================================= */

async function initializeTeacherAttendance() {

    const token =
        getTeacherToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    const panel =
        $("teacherAttendancePanel");


    if (panel) {

        panel.classList.add(
            "visible"
        );
    }


    await loadTeacherClasses();


    startTeacherAttendanceRefresh();
}


/* =========================================================
   TEACHER CLASSES
========================================================= */

async function loadTeacherClasses() {

    const select =
        $("teacherClassSelect");


    if (!select) {
        return;
    }


    const token =
        getTeacherToken();


    if (!token) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Loading classes...
        </option>
    `;


    try {

        const response =
            await apiFetch(
                "/teacher/classes",
                {},
                token
            );


        teacherClasses =
            getArray(
                response,
                [
                    "classes",
                    "items",
                    "results"
                ]
            );


        renderTeacherClassSelect();

    } catch (error) {

        console.error(
            "Could not load teacher classes:",
            error
        );


        select.innerHTML = `
            <option value="">
                Unable to load classes
            </option>
        `;


        showMessage(
            error.message ||
            "Unable to load teacher classes.",
            "error"
        );
    }
}


function renderTeacherClassSelect() {

    const select =
        $("teacherClassSelect");


    if (!select) {
        return;
    }


    if (!teacherClasses.length) {

        select.innerHTML = `
            <option value="">
                No classes assigned
            </option>
        `;

        return;
    }


    select.innerHTML = `
        <option value="">
            Select a class...
        </option>

        ${teacherClasses
            .map(classItem => {

                const id =
                    getClassId(
                        classItem
                    );


                const name =
                    firstDefined(

                        classItem.name,

                        classItem.className,

                        classItem.class_name,

                        `Class ${id}`
                    );


                const level =
                    firstDefined(
                        classItem.level,
                        ""
                    );


                return `
                    <option value="${escapeHTML(id)}">
                        ${escapeHTML(name)}
                        ${
                            level
                                ? ` — ${escapeHTML(level)}`
                                : ""
                        }
                    </option>
                `;
            })
            .join("")}
    `;
}


/* =========================================================
   TEACHER CLASS CHANGE
========================================================= */

async function handleTeacherClassChange(
    event
) {

    selectedTeacherClassId =
        event.target.value ||
        null;


    const generatedBox =
        $("generatedCodeBox");


    if (generatedBox) {

        generatedBox.classList.remove(
            "visible"
        );
    }


    if (!selectedTeacherClassId) {

        renderTeacherAttendanceTable(
            []
        );

        return;
    }


    await loadTeacherClassAttendance(
        selectedTeacherClassId
    );
}


/* =========================================================
   GENERATE ATTENDANCE CODE
========================================================= */

async function generateAttendanceCode() {

    const select =
        $("teacherClassSelect");

    const button =
        $("generateAttendanceCodeBtn");


    if (
        !select ||
        !button
    ) {

        return;
    }


    const classId =
        select.value;


    if (!classId) {

        showMessage(
            "Please select a class first.",
            "error"
        );

        return;
    }


    const token =
        getTeacherToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    button.disabled = true;

    button.textContent =
        "Generating...";

    hideMessage();


    try {

        /*
            IMPORTANT:

            Backend endpoint:
            POST /teacher/classes/:classId/attendance-code

            NOT:
            /attendance/code
        */


        const response =
            await apiFetch(

                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/attendance-code`,

                {
                    method: "POST",

                    body: {

                        attendanceDate:
                            getTodayDate(),

                        expiresAt:
                            getCodeExpiry()
                    }
                },

                token
            );


        const data =
            getDataObject(response) ||
            {};


        const code =
            firstDefined(

                data.code,

                data.attendanceCode,

                data.attendance_code,

                response?.code,

                response?.attendanceCode
            );


        if (!code) {

            throw new Error(
                "The server did not return an attendance code."
            );
        }


        showGeneratedCode(
            code,
            data
        );


        showMessage(
            response?.message ||
            "Attendance code generated successfully.",
            "success"
        );


        await loadTeacherClassAttendance(
            classId
        );

    } catch (error) {

        console.error(
            "Could not generate attendance code:",
            error
        );


        showMessage(
            error.message ||
            "Unable to generate attendance code.",
            "error"
        );

    } finally {

        button.disabled = false;

        button.textContent =
            "+ Generate Code";
    }
}


/* =========================================================
   SHOW GENERATED CODE
========================================================= */

function showGeneratedCode(
    code,
    data = {}
) {

    const box =
        $("generatedCodeBox");

    const codeElement =
        $("generatedAttendanceCode");

    const expiryElement =
        $("generatedCodeExpiry");


    if (
        !box ||
        !codeElement
    ) {

        return;
    }


    codeElement.textContent =
        String(code)
            .toUpperCase();


    const expiresAt =
        firstDefined(

            data.expiresAt,

            data.expires_at,

            data.expiry,

            data.expires
        );


    if (expiryElement) {

        if (expiresAt) {

            expiryElement.textContent =
                `Valid until ${formatTime(
                    expiresAt
                )}.`;

        } else {

            expiryElement.textContent =
                "Give this code to the students in your class.";
        }
    }


    box.classList.add(
        "visible"
    );
}


/* =========================================================
   TEACHER ATTENDANCE
========================================================= */

async function loadTeacherClassAttendance(
    classId
) {

    if (!classId) {
        return;
    }


    const token =
        getTeacherToken();


    if (!token) {

        redirectToLogin();

        return;
    }


    const table =
        $("teacherAttendanceTable");


    if (table) {

        table.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="loading">
                        <div class="spinner"></div>
                        Loading attendance...
                    </div>
                </td>
            </tr>
        `;
    }


    try {

        const response =
            await apiFetch(

                `/teacher/classes/${encodeURIComponent(
                    classId
                )}/attendance`,

                {
                    method: "GET"
                },

                token
            );


        /*
            Backend returns the enrolled students
            with today's attendance information.
        */

        const records =
            getArray(
                response,
                [
                    "attendance",
                    "records",
                    "students",
                    "items"
                ]
            );


        renderTeacherAttendanceTable(
            records
        );

    } catch (error) {

        console.error(
            "Could not load class attendance:",
            error
        );


        renderTeacherAttendanceTable(
            []
        );


        showMessage(
            error.message ||
            "Unable to load class attendance.",
            "error"
        );
    }
}


function renderTeacherAttendanceTable(
    records
) {

    const table =
        $("teacherAttendanceTable");


    if (!table) {
        return;
    }


    if (!records.length) {

        table.innerHTML = `
            <tr>
                <td colspan="4">

                    <div class="empty-state">

                        <strong>
                            No students found
                        </strong>

                        Students enrolled in this class
                        will appear here.

                    </div>

                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        records
            .map(record => {

                /*
                    The teacher attendance backend returns
                    student information directly, including:

                    full_name
                    email
                    phone
                    status
                    created_at
                */

                const studentName =
                    firstDefined(

                        record.studentName,

                        record.student_name,

                        record.fullName,

                        record.full_name,

                        record.name,

                        "Student"
                    );


                const className =
                    firstDefined(

                        record.className,

                        record.class_name,

                        record.class?.name,

                        "Class"
                    );


                const status =
                    firstDefined(

                        record.status,

                        record.attendanceStatus,

                        record.attendance_status,

                        "Not checked in"
                    );


                const checkInTime =
                    firstDefined(

                        record.checkInTime,

                        record.check_in_time,

                        record.time,

                        record.createdAt,

                        record.created_at
                    );


                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(
                                    studentName
                                )}
                            </strong>
                        </td>

                        <td>
                            ${escapeHTML(
                                className
                            )}
                        </td>

                        <td>

                            <span class="status-pill ${getStatusPillClass(
                                status
                            )}">

                                ${escapeHTML(
                                    getStatusIcon(
                                        status
                                    )
                                )}

                                ${escapeHTML(
                                    formatAttendanceStatus(
                                        status
                                    )
                                )}

                            </span>

                        </td>

                        <td>
                            ${escapeHTML(
                                formatTime(
                                    checkInTime
                                )
                            )}
                        </td>

                    </tr>
                `;
            })
            .join("");
}


/* =========================================================
   TEACHER LIVE REFRESH
========================================================= */

function startTeacherAttendanceRefresh() {

    if (attendanceRefreshTimer) {

        clearInterval(
            attendanceRefreshTimer
        );
    }


    attendanceRefreshTimer =
        setInterval(
            () => {

                if (
                    currentRole === "teacher" &&
                    selectedTeacherClassId
                ) {

                    loadTeacherClassAttendance(
                        selectedTeacherClassId
                    );
                }

            },
            10000
        );
}


/* =========================================================
   STATUS HELPERS
========================================================= */

function normalizeStatus(status) {

    return String(
        status || ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /[_-]/g,
            " "
        );
}


function formatAttendanceStatus(
    status
) {

    const normalized =
        normalizeStatus(status);


    switch (normalized) {

        case "present":
            return "Present";

        case "late":
            return "Late";

        case "absent":
            return "Absent";

        case "excused":
            return "Excused";

        case "pending":

        case "not checked in":

        case "not checked-in":

            return "Not checked in";

        default:

            return status
                ? String(status)
                : "Not checked in";
    }
}


function getStatusClass(status) {

    const normalized =
        normalizeStatus(status);


    switch (normalized) {

        case "present":
            return "status-present";

        case "late":
            return "status-late";

        case "absent":
            return "status-absent";

        case "excused":
            return "status-excused";

        default:
            return "status-pending";
    }
}


function getStatusPillClass(
    status
) {

    return getStatusClass(
        status
    );
}


function getStatusIcon(status) {

    const normalized =
        normalizeStatus(status);


    switch (normalized) {

        case "present":
            return "●";

        case "late":
            return "●";

        case "absent":
            return "●";

        case "excused":
            return "●";

        default:
            return "○";
    }
}


/* =========================================================
   INPUT FORMATTING
========================================================= */

function setupAttendanceCodeInput() {

    const input =
        $("attendanceCode");


    if (!input) {
        return;
    }


    input.addEventListener(
        "input",
        () => {

            input.value =
                input.value
                    .toUpperCase()
                    .replace(
                        /\s+/g,
                        ""
                    );
        }
    );
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    const form =
        $("attendanceCheckinForm");


    if (form) {

        form.addEventListener(
            "submit",
            submitAttendanceCode
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


    const classSelect =
        $("teacherClassSelect");


    if (classSelect) {

        classSelect.addEventListener(
            "change",
            handleTeacherClassChange
        );
    }


    const generateButton =
        $("generateAttendanceCodeBtn");


    if (generateButton) {

        generateButton.addEventListener(
            "click",
            generateAttendanceCode
        );
    }


    setupAttendanceCodeInput();
}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

async function initializeAttendancePage() {

    const authenticated =
        determineUserRole();


    if (!authenticated) {

        redirectToLogin();

        return;
    }


    setupEventListeners();


    /*
        Student:
        - enter attendance code
        - see today's attendance
        - see percentage
        - see streak
        - see history

        Teacher:
        - see assigned classes
        - generate attendance code
        - see live attendance
    */

    if (
        currentRole === "student"
    ) {

        await initializeStudentAttendance();

    } else if (
        currentRole === "teacher"
    ) {

        await initializeTeacherAttendance();
    }
}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (attendanceRefreshTimer) {

            clearInterval(
                attendanceRefreshTimer
            );

            attendanceRefreshTimer = null;
        }
    }
);


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeAttendancePage()
            .catch(error => {

                console.error(
                    "Attendance page initialization failed:",
                    error
                );


                showMessage(
                    error.message ||
                    "Unable to load attendance.",
                    "error"
                );
            });
    }
);
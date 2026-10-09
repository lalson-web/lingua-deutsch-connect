const API_URL = "/api";

const teacherToken =
    localStorage.getItem("ldc_teacher_token");

if (!teacherToken) {
    window.location.href = "teacher-login.html";
}


const params =
    new URLSearchParams(window.location.search);

const classId =
    params.get("id");


let classData = null;
let classStudents = [];
let classLessons = [];
let classTests = [];
let editingLessonId = null;


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function showClassMessage(message, type = "error") {

    const box =
        document.getElementById("classMessage");

    if (!box) return;

    box.textContent = message;
    box.className =
        `dashboard-message ${type}`;

    box.hidden = false;
}


function hideClassMessage() {

    const box =
        document.getElementById("classMessage");

    if (!box) return;

    box.hidden = true;
}


async function teacherFetch(endpoint, options = {}) {

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

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    const raw =
        await response.text();

    let data = {};

    try {
        data = raw ? JSON.parse(raw) : {};
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
            "Request failed."
        );
    }

    return data;
}


function getClassName(data) {

    return (
        data.name ||
        data.class_name ||
        data.title ||
        data.course_name ||
        "German Class"
    );
}


function updateClassHeader() {

    if (!classData) return;

    const title =
        document.getElementById("classTitle");

    const level =
        document.getElementById("classLevel");

    const meta =
        document.getElementById("classMeta");

    const students =
        document.getElementById(
            "classStudentsCount"
        );

    const lessons =
        document.getElementById(
            "classLessonsCount"
        );

    const tests =
        document.getElementById(
            "classTestsCount"
        );

    if (title) {
        title.textContent =
            getClassName(classData);
    }

    if (level) {
        level.textContent =
            classData.level ||
            classData.course_level ||
            "GERMAN CLASS";
    }

    if (meta) {

        const teacher =
            classData.teacher_name ||
            classData.teacher ||
            "Teacher";

        const schedule =
            classData.schedule ||
            "Schedule not set";

        meta.textContent =
            `Teacher: ${teacher} • ${schedule}`;
    }

    if (students) {
        students.textContent =
            classData.student_count ??
            classData.students_count ??
            classStudents.length ??
            0;
    }

    if (lessons) {
        lessons.textContent =
            classData.lesson_count ??
            classData.lessons_count ??
            classLessons.length ??
            0;
    }

    if (tests) {
        tests.textContent =
            classData.test_count ??
            classData.tests_count ??
            classTests.length ??
            0;
    }
}


async function loadClass() {

    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(classId)}`
            );

        classData =
            data.class ||
            data.data ||
            data;

        updateClassHeader();

    } catch (error) {

        console.error(
            "Load class error:",
            error
        );

        showClassMessage(
            error.message,
            "error"
        );
    }
}


async function loadStudents() {

    const container =
        document.getElementById(
            "studentsList"
        );

    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(classId)}/students`
            );

        classStudents =
            data.students ||
            data.data ||
            [];

        if (!classStudents.length) {

            container.innerHTML = `
                <div class="empty-card">
                    <div class="empty-icon">👨‍🎓</div>
                    <h3>No students yet</h3>
                    <p>
                        There are currently no students
                        assigned to this class.
                    </p>
                </div>
            `;

            return;
        }


        container.innerHTML = `
            <table class="teacher-table">

                <thead>
                    <tr>
                        <th>#</th>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Level</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>

                    ${classStudents.map(
                        (student, index) => {

                            const name =
                                student.name ||
                                student.full_name ||
                                `${student.first_name || ""} ${student.last_name || ""}`.trim() ||
                                "Student";

                            return `
                                <tr>

                                    <td>
                                        ${index + 1}
                                    </td>

                                    <td>
                                        <strong>
                                            ${escapeHTML(name)}
                                        </strong>
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            student.email || "—"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            student.level || "—"
                                        )}
                                    </td>

                                    <td>
                                        <span class="table-status">
                                            ${escapeHTML(
                                                student.account_status ||
                                                student.status ||
                                                "active"
                                            )}
                                        </span>
                                    </td>

                                </tr>
                            `;
                        }
                    ).join("")}

                </tbody>

            </table>
        `;

        document.getElementById(
            "classStudentsCount"
        ).textContent =
            classStudents.length;

    } catch (error) {

        console.error(
            "Load students error:",
            error
        );

        container.innerHTML = `
            <div class="empty-card">
                <h3>Could not load students</h3>
                <p>
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;
    }
}


function renderLessons() {

    const container =
        document.getElementById(
            "lessonsList"
        );

    if (!container) return;

    if (!classLessons.length) {

        container.innerHTML = `
            <div class="empty-card">

                <div class="empty-icon">
                    📚
                </div>

                <h3>No lessons yet</h3>

                <p>
                    Start building this class by
                    adding its first lesson.
                </p>

                <button
                    type="button"
                    class="primary-btn"
                    id="emptyAddLessonBtn"
                >
                    + Add First Lesson
                </button>

            </div>
        `;

        document
            .getElementById("emptyAddLessonBtn")
            ?.addEventListener(
                "click",
                openLessonModal
            );

        return;
    }


    container.innerHTML = `
        <table class="teacher-table">

            <thead>
                <tr>
                    <th>#</th>
                    <th>Lesson</th>
                    <th>Duration</th>
                    <th>XP</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>

            <tbody>

                ${classLessons.map(
                    lesson => {

                        const id =
                            lesson.id ||
                            lesson.lesson_id;

                        return `
                            <tr>

                                <td>
                                    ${escapeHTML(
                                        lesson.lesson_order ??
                                        lesson.order ??
                                        "—"
                                    )}
                                </td>

                                <td>
                                    <strong>
                                        ${escapeHTML(
                                            lesson.title ||
                                            "Untitled Lesson"
                                        )}
                                    </strong>

                                    ${
                                        lesson.description
                                            ? `
                                                <small class="table-secondary">
                                                    ${escapeHTML(
                                                        lesson.description
                                                    )}
                                                </small>
                                            `
                                            : ""
                                    }
                                </td>

                                <td>
                                    ${escapeHTML(
                                        lesson.duration_minutes ??
                                        lesson.duration ??
                                        "—"
                                    )}
                                    min
                                </td>

                                <td>
                                    ${escapeHTML(
                                        lesson.xp_reward ??
                                        lesson.xp ??
                                        0
                                    )}
                                </td>

                                <td>
                                    <span class="table-status">
                                        ${escapeHTML(
                                            lesson.status ||
                                            "published"
                                        )}
                                    </span>
                                </td>

                                <td>
                                    <button
                                        type="button"
                                        class="table-action edit-lesson-btn"
                                        data-id="${id}"
                                    >
                                        Edit
                                    </button>
                                </td>

                            </tr>
                        `;
                    }
                ).join("")}

            </tbody>

        </table>
    `;


    container
        .querySelectorAll(".edit-lesson-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const lesson =
                        classLessons.find(
                            item =>
                                String(
                                    item.id ||
                                    item.lesson_id
                                ) ===
                                String(
                                    button.dataset.id
                                )
                        );

                    if (lesson) {
                        openLessonModal(lesson);
                    }
                }
            );
        });
}


async function loadLessons() {

    const container =
        document.getElementById(
            "lessonsList"
        );

    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(classId)}/lessons`
            );

        classLessons =
            data.lessons ||
            data.data ||
            [];

        renderLessons();

        document.getElementById(
            "classLessonsCount"
        ).textContent =
            classLessons.length;

    } catch (error) {

        console.error(
            "Load lessons error:",
            error
        );

        container.innerHTML = `
            <div class="empty-card">
                <h3>Could not load lessons</h3>
                <p>
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;
    }
}


function openLessonModal(lesson = null) {

    const modal =
        document.getElementById(
            "lessonModal"
        );

    const title =
        document.getElementById(
            "lessonModalTitle"
        );

    const form =
        document.getElementById(
            "lessonForm"
        );

    editingLessonId =
        lesson
            ? lesson.id || lesson.lesson_id
            : null;

    if (lesson) {

        title.textContent =
            "Edit Lesson";

        document.getElementById(
            "lessonTitle"
        ).value =
            lesson.title || "";

        document.getElementById(
            "lessonOrder"
        ).value =
            lesson.lesson_order ??
            lesson.order ??
            1;

        document.getElementById(
            "lessonDuration"
        ).value =
            lesson.duration_minutes ??
            lesson.duration ??
            60;

        document.getElementById(
            "lessonDescription"
        ).value =
            lesson.description || "";

        document.getElementById(
            "lessonContent"
        ).value =
            lesson.content || "";

    } else {

        title.textContent =
            "Add Lesson";

        form.reset();

        document.getElementById(
            "lessonOrder"
        ).value =
            classLessons.length + 1;

        document.getElementById(
            "lessonDuration"
        ).value =
            60;
    }

    modal.hidden = false;

    document.getElementById(
        "lessonTitle"
    ).focus();
}


function closeLessonModal() {

    const modal =
        document.getElementById(
            "lessonModal"
        );

    modal.hidden = true;

    editingLessonId = null;

    document.getElementById(
        "lessonForm"
    ).reset();

    document.getElementById(
        "lessonFormMessage"
    ).hidden = true;
}


async function saveLesson(event) {

    event.preventDefault();

    const message =
        document.getElementById(
            "lessonFormMessage"
        );

    const button =
        document.getElementById(
            "saveLessonBtn"
        );


    const title =
        document.getElementById(
            "lessonTitle"
        ).value.trim();

    const lessonOrder =
        Number(
            document.getElementById(
                "lessonOrder"
            ).value
        );

    const duration =
        Number(
            document.getElementById(
                "lessonDuration"
            ).value
        );

    const description =
        document.getElementById(
            "lessonDescription"
        ).value.trim();

    const content =
        document.getElementById(
            "lessonContent"
        ).value.trim();


    if (!title) {

        message.textContent =
            "Please enter a lesson title.";

        message.className =
            "form-message error";

        message.hidden = false;

        return;
    }


    button.disabled = true;
    button.textContent = "Saving...";


    try {

        const payload = {
            title,
            lessonOrder:
                Number.isFinite(lessonOrder) &&
                lessonOrder > 0
                    ? lessonOrder
                    : 1,

            duration:
                Number.isFinite(duration) &&
                duration > 0
                    ? duration
                    : 60,

            description,
            content,
            status: "published"
        };


        if (editingLessonId) {

            await teacherFetch(
                `/teacher/lessons/${encodeURIComponent(editingLessonId)}`,
                {
                    method: "PATCH",
                    body: JSON.stringify(payload)
                }
            );

            showClassMessage(
                "Lesson updated successfully.",
                "success"
            );

        } else {

            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(classId)}/lessons`,
                {
                    method: "POST",
                    body: JSON.stringify(payload)
                }
            );

            showClassMessage(
                "Lesson created successfully.",
                "success"
            );
        }


        closeLessonModal();

        await loadLessons();

    } catch (error) {

        console.error(
            "Save lesson error:",
            error
        );

        message.textContent =
            error.message;

        message.className =
            "form-message error";

        message.hidden = false;

    } finally {

        button.disabled = false;

        button.textContent =
            "Save Lesson";
    }
}


async function loadAttendance() {

    const container =
        document.getElementById(
            "attendancePanel"
        );

    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(classId)}/attendance`
            );

        const attendance =
            data.attendance ||
            data.records ||
            data.data ||
            [];

        if (!attendance.length) {

            container.innerHTML = `
                <div class="empty-card">
                    <div class="empty-icon">
                        ◷
                    </div>

                    <h3>No attendance records</h3>

                    <p>
                        Attendance records for this class
                        will appear here.
                    </p>
                </div>
            `;

            return;
        }


        container.innerHTML = `
            <table class="teacher-table">

                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Student</th>
                        <th>Status</th>
                        <th>Notes</th>
                    </tr>
                </thead>

                <tbody>

                    ${attendance.map(
                        record => {

                            const studentName =
                                record.student_name ||
                                record.name ||
                                "Student";

                            return `
                                <tr>

                                    <td>
                                        ${escapeHTML(
                                            record.attendance_date ||
                                            record.date ||
                                            "—"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            studentName
                                        )}
                                    </td>

                                    <td>
                                        <span class="table-status">
                                            ${escapeHTML(
                                                record.status ||
                                                "—"
                                            )}
                                        </span>
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            record.notes ||
                                            "—"
                                        )}
                                    </td>

                                </tr>
                            `;
                        }
                    ).join("")}

                </tbody>

            </table>
        `;

    } catch (error) {

        console.error(
            "Attendance error:",
            error
        );

        container.innerHTML = `
            <div class="empty-card">
                <h3>Could not load attendance</h3>
                <p>
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;
    }
}


async function loadTests() {

    const container =
        document.getElementById(
            "testsList"
        );

    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(classId)}/tests`
            );

        classTests =
            data.tests ||
            data.data ||
            [];

        if (!classTests.length) {

            container.innerHTML = `
                <div class="empty-card">

                    <div class="empty-icon">
                        📝
                    </div>

                    <h3>No tests yet</h3>

                    <p>
                        Create your first weekly test
                        for this class.
                    </p>

                </div>
            `;

            return;
        }


        container.innerHTML = `
            <table class="teacher-table">

                <thead>
                    <tr>
                        <th>Test</th>
                        <th>Total Points</th>
                        <th>Date</th>
                        <th>Results</th>
                    </tr>
                </thead>

                <tbody>

                    ${classTests.map(
                        test => {

                            return `
                                <tr>

                                    <td>
                                        <strong>
                                            ${escapeHTML(
                                                test.title ||
                                                test.name ||
                                                "Test"
                                            )}
                                        </strong>
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            test.total_points ??
                                            test.totalPoints ??
                                            100
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            test.test_date ||
                                            test.date ||
                                            "—"
                                        )}
                                    </td>

                                    <td>
                                        ${escapeHTML(
                                            test.result_count ??
                                            test.results_count ??
                                            0
                                        )}
                                    </td>

                                </tr>
                            `;
                        }
                    ).join("")}

                </tbody>

            </table>
        `;

        document.getElementById(
            "classTestsCount"
        ).textContent =
            classTests.length;

    } catch (error) {

        console.error(
            "Tests error:",
            error
        );

        container.innerHTML = `
            <div class="empty-card">
                <h3>Could not load tests</h3>
                <p>
                    ${escapeHTML(error.message)}
                </p>
            </div>
        `;
    }
}


async function generateAttendanceCode() {

    const button =
        document.getElementById(
            "generateAttendanceCodeBtn"
        );

    button.disabled = true;

    button.innerHTML = `
        <span>Generating...</span>
        <span>⏳</span>
    `;


    try {

        const data =
            await teacherFetch(
                `/teacher/classes/${encodeURIComponent(classId)}/attendance-code`,
                {
                    method: "POST"
                }
            );

        const code =
            data.code ||
            data.attendanceCode ||
            data.attendance_code;

        showClassMessage(
            code
                ? `Attendance code created: ${code}`
                : "Attendance code created successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Attendance code error:",
            error
        );

        showClassMessage(
            error.message,
            "error"
        );

    } finally {

        button.disabled = false;

        button.innerHTML = `
            <span>Generate Attendance Code</span>
            <span>+</span>
        `;
    }
}


function setupTabs() {

    document
        .querySelectorAll(".class-tab")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const tab =
                        button.dataset.tab;

                    document
                        .querySelectorAll(".class-tab")
                        .forEach(item => {
                            item.classList.toggle(
                                "active",
                                item === button
                            );
                        });


                    document
                        .querySelectorAll(".class-tab-panel")
                        .forEach(panel => {

                            const isActive =
                                panel.id ===
                                `class-tab-${tab}`;

                            panel.hidden =
                                !isActive;

                            panel.classList.toggle(
                                "active",
                                isActive
                            );
                        });


                    if (tab === "students") {
                        await loadStudents();
                    }

                    if (tab === "lessons") {
                        await loadLessons();
                    }

                    if (tab === "attendance") {
                        await loadAttendance();
                    }

                    if (tab === "tests") {
                        await loadTests();
                    }
                }
            );
        });
}


function setupModal() {

    document
        .getElementById(
            "addLessonBtn"
        )
        ?.addEventListener(
            "click",
            () => openLessonModal()
        );


    document
        .getElementById(
            "closeLessonModal"
        )
        ?.addEventListener(
            "click",
            closeLessonModal
        );


    document
        .getElementById(
            "cancelLessonBtn"
        )
        ?.addEventListener(
            "click",
            closeLessonModal
        );


    document
        .getElementById(
            "lessonForm"
        )
        ?.addEventListener(
            "submit",
            saveLesson
        );


    document
        .getElementById(
            "lessonModal"
        )
        ?.addEventListener(
            "click",
            event => {

                if (
                    event.target.id ===
                    "lessonModal"
                ) {
                    closeLessonModal();
                }
            }
        );
}


function setupActions() {

    document
        .getElementById(
            "generateAttendanceCodeBtn"
        )
        ?.addEventListener(
            "click",
            generateAttendanceCode
        );


    document
        .getElementById(
            "teacherClassLogout"
        )
        ?.addEventListener(
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


    document
        .getElementById(
            "addTestBtn"
        )
        ?.addEventListener(
            "click",
            () => {

                showClassMessage(
                    "Test creation is the next assessment module. The backend endpoint is ready.",
                    "success"
                );
            }
        );
}


async function initializeTeacherClass() {

    if (!classId) {

        showClassMessage(
            "No class was selected. Please return to the teacher dashboard.",
            "error"
        );

        return;
    }


    setupTabs();

    setupModal();

    setupActions();


    await loadClass();

    await Promise.all([
        loadLessons(),
        loadStudents(),
        loadTests()
    ]);


    console.log(
        "LDC Teacher Class ready."
    );
}


initializeTeacherClass();
const API_BASE = "http://localhost:5000/api";

const token = localStorage.getItem("ldc_token");

let lessonId = null;
let currentLesson = null;
let exercises = [];
let currentExerciseIndex = 0;
let selectedAnswer = null;
let score = 0;
let answered = false;


/* =========================
   API
========================= */

async function apiGet(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Could not load data."
        );
    }

    return data;
}


async function apiPost(endpoint, body) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Could not save progress."
        );
    }

    return data;
}


/* =========================
   HELPERS
========================= */

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getElement(id) {
    return document.getElementById(id);
}


/* =========================
   ERROR
========================= */

function showError(message) {
    const loading = getElement("lessonLoading");
    const error = getElement("lessonError");
    const errorMessage = getElement("lessonErrorMessage");

    if (loading) {
        loading.hidden = true;
    }

    if (errorMessage) {
        errorMessage.textContent = message;
    }

    if (error) {
        error.hidden = false;
    }
}


/* =========================
   LESSON BODY
========================= */

function renderLessonBody(content) {
    const body = getElement("lessonBody");

    if (!body) {
        return;
    }

    if (!content) {
        body.innerHTML = `
            <p>
                This lesson does not have content yet.
            </p>
        `;

        return;
    }

    body.innerHTML = String(content)
        .replace(/\n/g, "<br>");
}


/* =========================
   MATERIALS
========================= */

function renderMaterials(materials) {
    const section = getElement("materialsSection");
    const list = getElement("materialsList");

    if (!section || !list) {
        return;
    }

    if (!materials || materials.length === 0) {
        section.hidden = true;
        return;
    }

    section.hidden = false;

    list.innerHTML = materials
        .map((material) => `
            <a
                class="material-item"
                href="${escapeHTML(material.url || "#")}"
                target="_blank"
                rel="noopener noreferrer">

                <strong>
                    ${escapeHTML(material.title)}
                </strong>

                <span>
                    ${escapeHTML(material.type || "Material")}
                </span>

            </a>
        `)
        .join("");
}


/* =========================
   PROGRESS
========================= */

function updateProgress(progress) {
    const value =
        Number(progress?.progress) || 0;

    const text =
        getElement("lessonProgressText");

    const bar =
        getElement("lessonProgressBar");

    if (text) {
        text.textContent = `${value}%`;
    }

    if (bar) {
        bar.style.width = `${value}%`;
    }
}


function updateStatus(status) {
    const badge =
        getElement("lessonStatusBadge");

    if (!badge) {
        return;
    }

    if (status === "completed") {
        badge.textContent = "Completed";
        badge.classList.add("completed");
    } else if (status === "in_progress") {
        badge.textContent = "In Progress";
        badge.classList.remove("completed");
    } else {
        badge.textContent = "Not Started";
        badge.classList.remove("completed");
    }
}


/* =========================
   EXERCISE ENGINE
========================= */

function setupExercises(data) {
    exercises =
        data.exercises ||
        currentLesson?.exercises ||
        [];

    if (!Array.isArray(exercises)) {
        exercises = [];
    }

    if (exercises.length === 0) {
        const section =
            getElement("exerciseSection");

        if (section) {
            section.hidden = true;
        }

        return;
    }

    currentExerciseIndex = 0;
    selectedAnswer = null;
    score = 0;
    answered = false;

    const section =
        getElement("exerciseSection");

    if (section) {
        section.hidden = false;
    }

    renderExercise();
}


function renderExercise() {
    const exercise =
        exercises[currentExerciseIndex];

    if (!exercise) {
        finishExercises();
        return;
    }

    selectedAnswer = null;
    answered = false;

    const question =
        getElement("exerciseQuestion");

    const options =
        getElement("exerciseOptions");

    const feedback =
        getElement("exerciseFeedback");

    const checkButton =
        getElement("checkAnswerBtn");

    const nextButton =
        getElement("nextQuestionBtn");

    const counter =
        getElement("exerciseCounter");

    if (counter) {
        counter.textContent =
            `Question ${currentExerciseIndex + 1} / ${exercises.length}`;
    }

    if (question) {
        question.textContent =
            exercise.question || "";
    }

    if (feedback) {
        feedback.hidden = true;
        feedback.className =
            "exercise-feedback";
        feedback.textContent = "";
    }

    if (checkButton) {
        checkButton.hidden = false;
        checkButton.disabled = false;
        checkButton.textContent = "Check Answer";
    }

    if (nextButton) {
        nextButton.hidden = true;
    }

    if (!options) {
        return;
    }

    let parsedOptions = exercise.options;

    if (typeof parsedOptions === "string") {
        try {
            parsedOptions =
                JSON.parse(parsedOptions);
        } catch {
            parsedOptions = [];
        }
    }

    if (!Array.isArray(parsedOptions)) {
        parsedOptions = [];
    }

    options.innerHTML =
        parsedOptions
            .map((option, index) => `
                <button
                    type="button"
                    class="exercise-option"
                    data-answer="${escapeHTML(option)}">

                    <span>
                        ${String.fromCharCode(65 + index)}.
                    </span>

                    ${escapeHTML(option)}

                </button>
            `)
            .join("");

    document
        .querySelectorAll(".exercise-option")
        .forEach((button) => {
            button.addEventListener(
                "click",
                () => selectAnswer(button)
            );
        });
}


function selectAnswer(button) {
    if (answered) {
        return;
    }

    document
        .querySelectorAll(".exercise-option")
        .forEach((item) => {
            item.classList.remove("selected");
        });

    button.classList.add("selected");

    selectedAnswer =
        button.dataset.answer;
}


function checkAnswer() {
    if (answered) {
        return;
    }

    if (!selectedAnswer) {
        alert("Please select an answer first.");
        return;
    }

    const exercise =
        exercises[currentExerciseIndex];

    const correctAnswer =
        String(exercise.correct_answer || "")
            .trim();

    const isCorrect =
        selectedAnswer.trim() ===
        correctAnswer;

    answered = true;

    const feedback =
        getElement("exerciseFeedback");

    const checkButton =
        getElement("checkAnswerBtn");

    const nextButton =
        getElement("nextQuestionBtn");

    document
        .querySelectorAll(".exercise-option")
        .forEach((button) => {

            const answer =
                button.dataset.answer?.trim();

            if (answer === correctAnswer) {
                button.classList.add("correct");
            }

            if (
                answer === selectedAnswer &&
                !isCorrect
            ) {
                button.classList.add("wrong");
            }

            button.disabled = true;
        });

    if (isCorrect) {
        score++;

        if (feedback) {
            feedback.hidden = false;
            feedback.className =
                "exercise-feedback correct";

            feedback.innerHTML =
                `✅ Correct! ${escapeHTML(
                    exercise.explanation || ""
                )}`;
        }
    } else {
        if (feedback) {
            feedback.hidden = false;
            feedback.className =
                "exercise-feedback wrong";

            feedback.innerHTML =
                `❌ Not quite. The correct answer is <strong>${escapeHTML(
                    correctAnswer
                )}</strong>.<br>${escapeHTML(
                    exercise.explanation || ""
                )}`;
        }
    }

    if (checkButton) {
        checkButton.hidden = true;
    }

    if (nextButton) {
        nextButton.hidden = false;

        if (
            currentExerciseIndex ===
            exercises.length - 1
        ) {
            nextButton.textContent =
                "Finish Exercises →";
        } else {
            nextButton.textContent =
                "Next Question →";
        }
    }
}


function nextExercise() {
    if (!answered) {
        return;
    }

    currentExerciseIndex++;

    if (
        currentExerciseIndex >=
        exercises.length
    ) {
        finishExercises();
        return;
    }

    renderExercise();
}


async function finishExercises() {
    const percentage =
        exercises.length > 0
            ? Math.round(
                (score / exercises.length) * 100
            )
            : 0;

    const question =
        getElement("exerciseQuestion");

    const options =
        getElement("exerciseOptions");

    const feedback =
        getElement("exerciseFeedback");

    const checkButton =
        getElement("checkAnswerBtn");

    const nextButton =
        getElement("nextQuestionBtn");

    const counter =
        getElement("exerciseCounter");

    if (counter) {
        counter.textContent = "Completed";
    }

    if (question) {
        question.textContent =
            `You scored ${score}/${exercises.length} (${percentage}%).`;
    }

    if (options) {
        options.innerHTML = "";
    }

    if (feedback) {
        feedback.hidden = false;
        feedback.className =
            percentage >= 70
                ? "exercise-feedback correct"
                : "exercise-feedback wrong";

        feedback.innerHTML =
            percentage >= 70
                ? "🎉 Great work! You passed the exercises."
                : "💪 Keep practicing! You can try again.";
    }

    if (checkButton) {
        checkButton.hidden = true;
    }

    if (nextButton) {
        nextButton.hidden = true;
    }

    if (percentage >= 70) {
        await saveProgress(true);
    }
}


/* =========================
   SAVE PROGRESS
========================= */

async function saveProgress(completed = false) {
    const button =
        getElement("saveProgressBtn");

    const completeButton =
        getElement("completeLessonBtn");

    try {
        if (button) {
            button.disabled = true;
        }

        if (completeButton) {
            completeButton.disabled = true;
        }

        const data = await apiPost(
            `/student/lessons/${encodeURIComponent(
                lessonId
            )}/progress`,
            {
                status: completed
                    ? "completed"
                    : "in_progress",

                progress: completed
                    ? 100
                    : 50,

                score: completed
                    ? score
                    : 0
            }
        );

        const progress =
            data.progress ||
            data.lessonProgress ||
            {
                progress: completed ? 100 : 50,
                status: completed
                    ? "completed"
                    : "in_progress"
            };

        updateProgress(progress);
        updateStatus(progress.status);

        if (completed) {
            showCompletedState(
                data.xpEarned ||
                data.xp ||
                currentLesson?.xp_reward ||
                0
            );
        }

    } catch (error) {
        console.error(error);

        alert(
            error.message ||
            "Could not save your progress."
        );

        if (button) {
            button.disabled = false;
        }

        if (completeButton) {
            completeButton.disabled = false;
        }
    }
}


/* =========================
   COMPLETION
========================= */

function showCompletedState(xp) {
    const card =
        getElement("completionCard");

    const message =
        getElement("completionMessage");

    const saveButton =
        getElement("saveProgressBtn");

    const completeButton =
        getElement("completeLessonBtn");

    if (card) {
        card.hidden = false;
    }

    if (message) {
        message.innerHTML =
            `🎉 Lesson completed! You earned <strong>+${xp} XP</strong>.`;
    }

    if (saveButton) {
        saveButton.disabled = true;
    }

    if (completeButton) {
        completeButton.disabled = true;
        completeButton.textContent =
            "Lesson Completed ✓";
    }
}


/* =========================
   BUTTONS
========================= */

function setupButtons() {
    const saveButton =
        getElement("saveProgressBtn");

    const completeButton =
        getElement("completeLessonBtn");

    const checkButton =
        getElement("checkAnswerBtn");

    const nextButton =
        getElement("nextQuestionBtn");

    if (saveButton) {
        saveButton.addEventListener(
            "click",
            () => saveProgress(false)
        );
    }

    if (completeButton) {
        completeButton.addEventListener(
            "click",
            () => saveProgress(true)
        );
    }

    if (checkButton) {
        checkButton.addEventListener(
            "click",
            checkAnswer
        );
    }

    if (nextButton) {
        nextButton.addEventListener(
            "click",
            nextExercise
        );
    }
}


/* =========================
   LOAD LESSON
========================= */

async function loadLesson() {
    if (!token) {
        window.location.href =
            "login.html";
        return;
    }

    const params =
        new URLSearchParams(
            window.location.search
        );

    lessonId =
        params.get("id");

    if (!lessonId) {
        showError(
            "No lesson ID was provided."
        );
        return;
    }

    try {
        const data =
            await apiGet(
                `/student/lessons/${encodeURIComponent(
                    lessonId
                )}`
            );

        currentLesson =
            data.lesson ||
            data;

        const course =
            data.course ||
            currentLesson.course ||
            {};

        const module =
            data.module ||
            currentLesson.module ||
            {};

        const progress =
            data.progress ||
            currentLesson.progress ||
            {};

        const materials =
            data.materials ||
            currentLesson.materials ||
            [];

        getElement("breadcrumbCourse")
            .textContent =
            course.name ||
            course.title ||
            "Course";

        getElement("breadcrumbModule")
            .textContent =
            module.title ||
            "Module";

        getElement("lessonLevel")
            .textContent =
            course.level ||
            currentLesson.level ||
            "";

        getElement("lessonModule")
            .textContent =
            module.title ||
            "";

        getElement("lessonLevelBadge")
            .textContent =
            course.level ||
            currentLesson.level ||
            "German";

        getElement("lessonTitle")
            .textContent =
            currentLesson.title ||
            "Lesson";

        getElement("lessonDescription")
            .textContent =
            currentLesson.description ||
            "";

        getElement("lessonDuration")
            .textContent =
            `${currentLesson.duration || 0} min`;

        getElement("lessonXP")
            .textContent =
            `${currentLesson.xp_reward || 0} XP`;

        renderLessonBody(
            currentLesson.content
        );

        renderMaterials(materials);

        updateProgress(progress);

        updateStatus(
            progress.status ||
            "not_started"
        );

        setupExercises(data);

        getElement("lessonLoading")
            .hidden = true;

        getElement("lessonContent")
            .hidden = false;

        if (
            progress.status ===
            "completed"
        ) {
            showCompletedState(
                currentLesson.xp_reward || 0
            );
        }

    } catch (error) {
        console.error(
            "Lesson loading error:",
            error
        );

        showError(
            error.message ||
            "Could not load this lesson."
        );
    }
}


/* =========================
   START
========================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        setupButtons();
        loadLesson();
    }
);
const API_URL = "http://localhost:5000/api";

const teacherLoginForm = document.getElementById("teacherLoginForm");
const teacherMessage = document.getElementById("teacherMessage");
const teacherLoginBtn = document.getElementById("teacherLoginBtn");
const toggleTeacherPassword = document.getElementById("toggleTeacherPassword");
const teacherPassword = document.getElementById("teacherPassword");


function showTeacherMessage(message, type = "error") {
    if (!teacherMessage) return;

    teacherMessage.textContent = message;
    teacherMessage.className = `form-message ${type}`;
    teacherMessage.hidden = false;
}


function hideTeacherMessage() {
    if (!teacherMessage) return;

    teacherMessage.hidden = true;
}


if (toggleTeacherPassword && teacherPassword) {
    toggleTeacherPassword.addEventListener("click", () => {
        const isPassword = teacherPassword.type === "password";

        teacherPassword.type = isPassword ? "text" : "password";
        toggleTeacherPassword.textContent = isPassword ? "Hide" : "Show";
        toggleTeacherPassword.setAttribute(
            "aria-label",
            isPassword ? "Hide password" : "Show password"
        );
    });
}


if (teacherLoginForm) {
    teacherLoginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        hideTeacherMessage();

        const email = document
            .getElementById("teacherEmail")
            ?.value
            .trim();

        const password = document
            .getElementById("teacherPassword")
            ?.value;

        if (!email || !password) {
            showTeacherMessage(
                "Please enter your email and password.",
                "error"
            );
            return;
        }

        teacherLoginBtn.disabled = true;
        teacherLoginBtn.innerHTML = `
            <span>Logging in...</span>
            <span>⏳</span>
        `;

        try {
            const response = await fetch(`${API_URL}/teacher/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const rawResponse = await response.text();

            let data;

            try {
                data = JSON.parse(rawResponse);
            } catch {
                throw new Error(
                    "The server returned an invalid response. Make sure the backend is running."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Teacher login failed."
                );
            }

            if (!data.token) {
                throw new Error(
                    "Login succeeded but no teacher token was returned."
                );
            }

            localStorage.setItem(
                "ldc_teacher_token",
                data.token
            );

            localStorage.setItem(
                "ldc_teacher",
                JSON.stringify(data.teacher || {})
            );

            showTeacherMessage(
                "Login successful. Opening your dashboard...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "teacher-dashboard.html";
            }, 700);

        } catch (error) {
            console.error("Teacher login error:", error);

            showTeacherMessage(
                error.message ||
                "Could not connect to the LDC server.",
                "error"
            );

        } finally {
            teacherLoginBtn.disabled = false;

            teacherLoginBtn.innerHTML = `
                <span>Teacher Login</span>
                <span>→</span>
            `;
        }
    });
}
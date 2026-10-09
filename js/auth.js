/* =========================================================
   LINGUA DEUTSCH CONNECT
   AUTHENTICATION SYSTEM
   STUDENT LOGIN / REGISTRATION
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL = "/api";

const STUDENT_TOKEN_KEY = "ldc_token";
const STUDENT_DATA_KEY = "ldc_student";


/* =========================================================
   DOM HELPERS
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   MESSAGE SYSTEM
========================================================= */

function showMessage(form, message, type = "error") {

    if (!form) return;

    let messageBox =
        form.querySelector(".form-message");

    if (!messageBox) {

        messageBox =
            document.createElement("div");

        messageBox.className =
            "form-message";

        messageBox.setAttribute(
            "role",
            "alert"
        );

        messageBox.setAttribute(
            "aria-live",
            "polite"
        );

        form.appendChild(messageBox);
    }

    messageBox.textContent =
        String(message || "");

    messageBox.className =
        `form-message ${
            type === "success"
                ? "success-message"
                : "error-message"
        }`;

    messageBox.hidden = false;
}


function clearMessage(form) {

    if (!form) return;

    const messageBox =
        form.querySelector(".form-message");

    if (!messageBox) return;

    messageBox.hidden = true;

    messageBox.textContent = "";

    messageBox.className =
        "form-message";
}


/* =========================================================
   SAFE JSON RESPONSE
========================================================= */

async function parseResponse(response) {

    const contentType =
        response.headers.get("content-type") || "";

    if (
        contentType.includes("application/json")
    ) {

        return await response.json();
    }

    const text =
        await response.text();

    return {
        message: text || ""
    };
}


/* =========================================================
   API ERROR MESSAGE
========================================================= */

function getApiErrorMessage(
    data,
    fallback
) {

    if (!data) {
        return fallback;
    }

    if (
        typeof data.message === "string" &&
        data.message.trim()
    ) {

        return data.message.trim();
    }

    if (
        typeof data.error === "string" &&
        data.error.trim()
    ) {

        return data.error.trim();
    }

    return fallback;
}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function setupPasswordToggle(
    buttonId,
    inputId
) {

    const button =
        getElement(buttonId);

    const input =
        getElement(inputId);

    if (!button || !input) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            const showingPassword =
                input.type === "text";


            if (showingPassword) {

                input.type = "password";

                button.textContent =
                    "Show";

                button.setAttribute(
                    "aria-label",
                    "Show password"
                );

                button.setAttribute(
                    "aria-pressed",
                    "false"
                );

            } else {

                input.type = "text";

                button.textContent =
                    "Hide";

                button.setAttribute(
                    "aria-label",
                    "Hide password"
                );

                button.setAttribute(
                    "aria-pressed",
                    "true"
                );

            }

            input.focus();
        }
    );
}


/* =========================================================
   BUTTON LOADING STATE
========================================================= */

function setButtonLoading(
    button,
    loading,
    loadingText,
    normalText,
    normalArrow = "→"
) {

    if (!button) return;

    if (loading) {

        button.disabled = true;

        button.classList.add(
            "is-loading"
        );

        button.setAttribute(
            "aria-busy",
            "true"
        );

        button.innerHTML = `
            <span>${loadingText}</span>
            <span aria-hidden="true">⏳</span>
        `;

    } else {

        button.disabled = false;

        button.classList.remove(
            "is-loading"
        );

        button.removeAttribute(
            "aria-busy"
        );

        button.innerHTML = `
            <span>${normalText}</span>
            <span aria-hidden="true">${normalArrow}</span>
        `;
    }
}


/* =========================================================
   CLEAR EXISTING STUDENT SESSION
========================================================= */

function clearStudentSession() {

    localStorage.removeItem(
        STUDENT_TOKEN_KEY
    );

    localStorage.removeItem(
        STUDENT_DATA_KEY
    );
}


/* =========================================================
   SAVE STUDENT SESSION
========================================================= */

function saveStudentSession(
    token,
    student
) {

    if (!token || !student) {
        throw new Error(
            "Invalid login response from the server."
        );
    }

    localStorage.setItem(
        STUDENT_TOKEN_KEY,
        token
    );

    localStorage.setItem(
        STUDENT_DATA_KEY,
        JSON.stringify(student)
    );
}


/* =========================================================
   REGISTER
========================================================= */

const registerForm =
    getElement("registerForm");


if (registerForm) {


    /* PASSWORD TOGGLES */

    setupPasswordToggle(
        "toggleRegisterPassword",
        "registerPassword"
    );

    setupPasswordToggle(
        "toggleConfirmPassword",
        "confirmPassword"
    );


    /* =====================================================
       REGISTER SUBMIT
    ===================================================== */

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage(registerForm);


            /* =============================================
               GET VALUES
            ============================================== */

            const accessCode =
                getElement("accessCode")
                    ?.value
                    .trim()
                    .toUpperCase();

            const fullName =
                getElement("fullName")
                    ?.value
                    .trim();

            const email =
                getElement("registerEmail")
                    ?.value
                    .trim()
                    .toLowerCase();

            const phone =
                getElement("phone")
                    ?.value
                    .trim();

            const password =
                getElement("registerPassword")
                    ?.value || "";

            const confirmPassword =
                getElement("confirmPassword")
                    ?.value || "";

            const terms =
                getElement("terms")
                    ?.checked === true;

            const button =
                getElement("registerBtn");


            /* =============================================
               REQUIRED FIELDS
            ============================================== */

            if (
                !accessCode ||
                !fullName ||
                !email ||
                !phone ||
                !password ||
                !confirmPassword
            ) {

                showMessage(
                    registerForm,
                    "Please complete all required fields.",
                    "error"
                );

                return;
            }


            /* =============================================
               NAME
            ============================================== */

            if (fullName.length < 2) {

                showMessage(
                    registerForm,
                    "Please enter your full name.",
                    "error"
                );

                return;
            }


            /* =============================================
               EMAIL
            ============================================== */

            if (!isValidEmail(email)) {

                showMessage(
                    registerForm,
                    "Please enter a valid email address.",
                    "error"
                );

                return;
            }


            /* =============================================
               ACCESS CODE
            ============================================== */

            if (accessCode.length < 4) {

                showMessage(
                    registerForm,
                    "Please enter a valid student access code.",
                    "error"
                );

                return;
            }


            /* =============================================
               PASSWORD
            ============================================== */

            if (password.length < 8) {

                showMessage(
                    registerForm,
                    "Password must contain at least 8 characters.",
                    "error"
                );

                return;
            }


            /* =============================================
               PASSWORD MATCH
            ============================================== */

            if (
                password !== confirmPassword
            ) {

                showMessage(
                    registerForm,
                    "Passwords do not match.",
                    "error"
                );

                return;
            }


            /* =============================================
               TERMS
            ============================================== */

            if (!terms) {

                showMessage(
                    registerForm,
                    "Please accept the student terms and conditions.",
                    "error"
                );

                return;
            }


            /* =============================================
               LOADING
            ============================================== */

            setButtonLoading(
                button,
                true,
                "Creating account...",
                "Create Student Account"
            );


            try {

                /* =========================================
                   REQUEST
                ========================================== */

                const response =
                    await fetch(
                        `${API_URL}/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                accessCode,
                                fullName,
                                email,
                                phone,
                                password
                            })
                        }
                    );


                const data =
                    await parseResponse(
                        response
                    );


                /* =========================================
                   SERVER ERROR
                ========================================== */

                if (!response.ok) {

                    throw new Error(
                        getApiErrorMessage(
                            data,
                            "Registration failed. Please try again."
                        )
                    );
                }


                /* =========================================
                   SUCCESS
                ========================================== */

                showMessage(
                    registerForm,
                    "Account created successfully! Redirecting to login...",
                    "success"
                );


                registerForm.reset();


                /* =========================================
                   REDIRECT
                ========================================== */

                setTimeout(
                    () => {

                        window.location.href =
                            "login.html?registered=true";

                    },
                    1500
                );


            } catch (error) {

                console.error(
                    "LDC registration error:",
                    error
                );


                let message =
                    "Could not connect to the LDC server. Please try again.";


                if (
                    error instanceof TypeError
                ) {

                    message =
                        "Unable to connect to the LDC server. Make sure the backend is running.";

                } else if (
                    error.message
                ) {

                    message =
                        error.message;
                }


                showMessage(
                    registerForm,
                    message,
                    "error"
                );


            } finally {

                setButtonLoading(
                    button,
                    false,
                    "",
                    "Create Student Account"
                );
            }

        }
    );
}


/* =========================================================
   LOGIN
========================================================= */

const loginForm =
    getElement("loginForm");


if (loginForm) {


    /* PASSWORD TOGGLE */

    setupPasswordToggle(
        "toggleLoginPassword",
        "loginPassword"
    );


    /* =====================================================
       CHECK URL PARAMETERS
    ===================================================== */

    const params =
        new URLSearchParams(
            window.location.search
        );


    /* REGISTERED SUCCESS */

    if (
        params.get("registered") === "true"
    ) {

        showMessage(
            loginForm,
            "Account created successfully. You can now log in.",
            "success"
        );
    }


    /* LOGGED OUT */

    if (
        params.get("logout") === "true"
    ) {

        showMessage(
            loginForm,
            "You have been logged out successfully.",
            "success"
        );
    }


    /* =====================================================
       LOGIN SUBMIT
    ===================================================== */

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            clearMessage(loginForm);


            /* =============================================
               GET VALUES
            ============================================== */

            const email =
                getElement("loginEmail")
                    ?.value
                    .trim()
                    .toLowerCase();

            const password =
                getElement("loginPassword")
                    ?.value || "";

            const button =
                getElement("loginBtn");


            /* =============================================
               VALIDATION
            ============================================== */

            if (!email || !password) {

                showMessage(
                    loginForm,
                    "Please enter your email and password.",
                    "error"
                );

                return;
            }


            if (!isValidEmail(email)) {

                showMessage(
                    loginForm,
                    "Please enter a valid email address.",
                    "error"
                );

                return;
            }


            /* =============================================
               LOADING
            ============================================== */

            setButtonLoading(
                button,
                true,
                "Logging in...",
                "Log In"
            );


            try {

                /* =========================================
                   LOGIN REQUEST
                ========================================== */

                const response =
                    await fetch(
                        `${API_URL}/auth/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email,
                                password
                            })
                        }
                    );


                const data =
                    await parseResponse(
                        response
                    );


                /* =========================================
                   LOGIN ERROR
                ========================================== */

                if (!response.ok) {

                    throw new Error(
                        getApiErrorMessage(
                            data,
                            "Login failed. Please check your email and password."
                        )
                    );
                }


                /* =========================================
                   VALIDATE RESPONSE
                ========================================== */

                if (
                    !data.token ||
                    !data.student
                ) {

                    throw new Error(
                        "The server returned an incomplete login response."
                    );
                }


                /* =========================================
                   SAVE SESSION
                ========================================== */

                saveStudentSession(
                    data.token,
                    data.student
                );


                /* =========================================
                   SUCCESS MESSAGE
                ========================================== */

                showMessage(
                    loginForm,
                    "Login successful! Opening your student dashboard...",
                    "success"
                );


                /* =========================================
                   REDIRECT
                ========================================== */

                setTimeout(
                    () => {

                        window.location.href =
                            "dashboard.html";

                    },
                    700
                );


            } catch (error) {

                console.error(
                    "LDC login error:",
                    error
                );


                let message =
                    "Could not connect to the LDC server. Please try again.";


                if (
                    error instanceof TypeError
                ) {

                    message =
                        "Unable to connect to the LDC server. Make sure the backend is running.";

                } else if (
                    error.message
                ) {

                    message =
                        error.message;
                }


                showMessage(
                    loginForm,
                    message,
                    "error"
                );


            } finally {

                setButtonLoading(
                    button,
                    false,
                    "",
                    "Log In"
                );
            }

        }
    );
}


/* =========================================================
   PREVENT DOUBLE FORM SUBMISSION
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key !== "Enter"
        ) {
            return;
        }


        const activeElement =
            document.activeElement;


        if (
            activeElement?.tagName === "BUTTON"
        ) {
            return;
        }
    }
);


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "LDC authentication system initialized."
        );

    }
);  
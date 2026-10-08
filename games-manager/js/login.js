/* =========================================================
   LINGUA DEUTSCH CONNECT
   GAMES MANAGER LOGIN
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE_URL =
    "http://localhost:5000/api/game-manager";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginForm =
    document.getElementById(
        "gameManagerLoginForm"
    );

const emailInput =
    document.getElementById(
        "email"
    );

const passwordInput =
    document.getElementById(
        "password"
    );

const togglePassword =
    document.getElementById(
        "togglePassword"
    );

const loginButton =
    document.getElementById(
        "loginButton"
    );

const loginButtonText =
    document.getElementById(
        "loginButtonText"
    );

const loginMessage =
    document.getElementById(
        "loginMessage"
    );


/* =========================================================
   ALREADY LOGGED IN
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const token =
            localStorage.getItem(
                "ldc_game_manager_token"
            );

        if (token) {

            /*
             * If a token already exists,
             * go directly to the manager.
             */

            window.location.href =
                "./dashboard.html";

        }

    }
);


/* =========================================================
   SHOW / HIDE PASSWORD
========================================================= */

if (togglePassword) {

    togglePassword.addEventListener(
        "click",
        () => {

            if (
                passwordInput.type ===
                "password"
            ) {

                passwordInput.type =
                    "text";

                togglePassword.textContent =
                    "Hide";

                togglePassword.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            } else {

                passwordInput.type =
                    "password";

                togglePassword.textContent =
                    "Show";

                togglePassword.setAttribute(
                    "aria-label",
                    "Show password"
                );

            }

        }
    );

}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    message,
    type = "error"
) {

    if (!loginMessage) {
        return;
    }

    loginMessage.hidden = false;

    loginMessage.textContent =
        message;

    loginMessage.className =
        `gm-message ${type}`;

}


/* =========================================================
   HIDE MESSAGE
========================================================= */

function hideMessage() {

    if (!loginMessage) {
        return;
    }

    loginMessage.hidden = true;

    loginMessage.textContent = "";

    loginMessage.className =
        "gm-message";

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setLoading(
    loading
) {

    if (!loginButton) {
        return;
    }

    loginButton.disabled =
        loading;

    if (loginButtonText) {

        loginButtonText.textContent =
            loading
                ? "Signing in..."
                : "Sign In";

    }

}


/* =========================================================
   LOGIN
========================================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            hideMessage();

            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";

            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            /* -----------------------------------------
               VALIDATION
            ----------------------------------------- */

            if (!email) {

                showMessage(
                    "Please enter your email."
                );

                if (emailInput) {
                    emailInput.focus();
                }

                return;
            }


            if (!password) {

                showMessage(
                    "Please enter your password."
                );

                if (passwordInput) {
                    passwordInput.focus();
                }

                return;
            }


            /* -----------------------------------------
               SEND LOGIN REQUEST
            ----------------------------------------- */

            setLoading(true);

            try {

                const response =
                    await fetch(
                        `${API_BASE_URL}/login`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                email,
                                password
                            })
                        }
                    );


                let data = null;

                try {

                    data =
                        await response.json();

                } catch (jsonError) {

                    data = null;

                }


                /* -------------------------------------
                   LOGIN FAILED
                ------------------------------------- */

                if (
                    !response.ok ||
                    !data ||
                    !data.success
                ) {

                    const message =
                        data &&
                        data.message
                            ? data.message
                            : "Login failed. Please check your email and password.";

                    showMessage(
                        message,
                        "error"
                    );

                    setLoading(false);

                    return;
                }


                /* -------------------------------------
                   TOKEN
                ------------------------------------- */

                const token =
                    data.token;


                if (!token) {

                    showMessage(
                        "Login succeeded, but no authentication token was returned.",
                        "error"
                    );

                    setLoading(false);

                    return;
                }


                /* -------------------------------------
                   SAVE SESSION
                ------------------------------------- */

                localStorage.setItem(
                    "ldc_game_manager_token",
                    token
                );


                /* -------------------------------------
                   SAVE USER DATA
                ------------------------------------- */

                if (data.admin) {

                    localStorage.setItem(
                        "ldc_game_manager_user",
                        JSON.stringify(
                            data.admin
                        )
                    );

                }


                /* -------------------------------------
                   SUCCESS
                ------------------------------------- */

                showMessage(
                    "Login successful. Opening Games Manager...",
                    "success"
                );


                /*
                 * Small delay so the user can
                 * see the success message.
                 */

                setTimeout(
                    () => {

                        window.location.href =
                            "./dashboard.html";

                    },
                    500
                );

            } catch (error) {

                console.error(
                    "Games Manager login error:",
                    error
                );

                showMessage(
                    "Could not connect to the server. Make sure the backend is running on port 5000.",
                    "error"
                );

                setLoading(false);

            }

        }
    );

}


/* =========================================================
   ENTER KEY SUPPORT
========================================================= */

if (emailInput) {

    emailInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter" &&
                passwordInput
            ) {

                passwordInput.focus();

            }

        }
    );

}


/* =========================================================
   PASSWORD ENTER
========================================================= */

if (passwordInput) {

    passwordInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                loginForm?.requestSubmit();

            }

        }
    );

}


/* =========================================================
   EXPORT / DEBUG INFO
========================================================= */

console.log(
    "LDC Games Manager Login loaded."
);

console.log(
    "API:",
    API_BASE_URL
);
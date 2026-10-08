const API_URL = "http://localhost:5000/api";

/* ========================================
   MESSAGE
======================================== */

function showAdminMessage(message, type = "error") {
    const box = document.getElementById("adminMessage");

    if (!box) return;

    box.textContent = message;
    box.className = `form-message ${type}`;
    box.hidden = false;
}

/* ========================================
   ADMIN LOGIN
======================================== */

const adminLoginForm =
    document.getElementById("adminLoginForm");

if (adminLoginForm) {
    adminLoginForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const email =
                document
                    .getElementById("adminEmail")
                    ?.value
                    .trim();

            const password =
                document
                    .getElementById("adminPassword")
                    ?.value;

            const button =
                document.getElementById("adminLoginBtn");

            if (!email || !password) {
                showAdminMessage(
                    "Please enter your admin email and password.",
                    "error"
                );
                return;
            }

            if (button) {
                button.disabled = true;

                button.innerHTML = `
                    <span>Logging in...</span>
                    <span>⏳</span>
                `;
            }

            try {
                console.log(
                    "Admin login URL:",
                    `${API_URL}/admin/login`
                );

                const response =
                    await fetch(
                        `${API_URL}/admin/login`,
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

                /*
                 * Get the raw response first.
                 * This prevents the ugly
                 * "Unexpected token <" error.
                 */
                const rawResponse =
                    await response.text();

                console.log(
                    "Admin server response:",
                    rawResponse
                );

                let data;

                try {
                    data =
                        JSON.parse(
                            rawResponse
                        );
                } catch (jsonError) {
                    console.error(
                        "Server did not return JSON:",
                        rawResponse
                    );

                    throw new Error(
                        "The server returned an unexpected response. Make sure the LDC backend is running on http://localhost:5000."
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Admin login failed."
                    );
                }

                /*
                 * Save admin session
                 */
                localStorage.setItem(
                    "ldc_admin_token",
                    data.token
                );

                localStorage.setItem(
                    "ldc_admin",
                    JSON.stringify(
                        data.admin
                    )
                );

                showAdminMessage(
                    "Admin login successful. Opening dashboard...",
                    "success"
                );

                setTimeout(() => {
                    window.location.href =
                        "admin.html";
                }, 700);

            } catch (error) {
                console.error(
                    "Admin login error:",
                    error
                );

                showAdminMessage(
                    error.message ||
                    "Could not connect to the LDC server.",
                    "error"
                );

            } finally {
                if (button) {
                    button.disabled = false;

                    button.innerHTML = `
                        <span>Admin Login</span>
                        <span>→</span>
                    `;
                }
            }
        }
    );
}
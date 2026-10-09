/* =========================================================
   LINGUA DEUTSCH CONNECT
   GAMES MANAGER DASHBOARD
========================================================= */

"use strict";


/* =========================================================
   CONFIG
========================================================= */

const API_BASE_URL =
    "/api/game-manager";

const TOKEN_KEY =
    "ldc_game_manager_token";

const USER_KEY =
    "ldc_game_manager_user";


/* =========================================================
   STATE
========================================================= */

let games = [];

let selectedGame = null;

let questions = [];

let editingGameId = null;

let editingQuestionId = null;


/* =========================================================
   DOM HELPER
========================================================= */

function $(selector) {
    return document.querySelector(selector);
}


function $$(selector) {
    return document.querySelectorAll(selector);
}


/* =========================================================
   AUTH
========================================================= */

function getToken() {

    return localStorage.getItem(
        TOKEN_KEY
    );

}


function logout() {

    localStorage.removeItem(
        TOKEN_KEY
    );

    localStorage.removeItem(
        USER_KEY
    );

    window.location.href =
        "./login.html";

}


/* =========================================================
   AUTH CHECK
========================================================= */

if (!getToken()) {

    window.location.href =
        "./login.html";

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const token =
        getToken();

    if (!token) {

        logout();

        throw new Error(
            "Authentication required."
        );

    }


    const requestOptions = {
        ...options,

        headers: {
            "Content-Type":
                "application/json",

            ...(options.headers || {}),

            "Authorization":
                `Bearer ${token}`
        }
    };


    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            requestOptions
        );


    let data = null;

    try {

        data =
            await response.json();

    } catch (error) {

        data = null;

    }


    if (
        response.status === 401 ||
        response.status === 403
    ) {

        logout();

        throw new Error(
            "Your session has expired. Please log in again."
        );

    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            "Request failed."
        );

    }


    return data;

}


/* =========================================================
   MESSAGE HELPERS
========================================================= */

function showFormMessage(
    element,
    message,
    type = "error"
) {

    if (!element) {
        return;
    }

    element.hidden = false;

    element.textContent =
        message;

    element.className =
        `gm-message ${type}`;

}


function hideFormMessage(
    element
) {

    if (!element) {
        return;
    }

    element.hidden = true;

    element.textContent = "";

    element.className =
        "gm-message";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
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
   FORMAT NUMBERS
========================================================= */

function formatNumber(
    value
) {

    const number =
        Number(value) || 0;

    return number.toLocaleString();

}


/* =========================================================
   NORMALIZE API ARRAYS
========================================================= */

function extractArray(
    data,
    possibleKeys = []
) {

    if (Array.isArray(data)) {
        return data;
    }


    for (
        const key of possibleKeys
    ) {

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


/* =========================================================
   NAVIGATION
========================================================= */

function showSection(
    sectionName
) {

    const sections = {
        overview:
            $("#overviewSection"),

        games:
            $("#gamesSection"),

        questions:
            $("#questionsSection"),

        statistics:
            $("#statisticsSection")
    };


    Object.entries(
        sections
    ).forEach(
        ([name, section]) => {

            if (!section) {
                return;
            }

            section.hidden =
                name !== sectionName;

        }
    );


    $$(
        ".gm-nav button"
    ).forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                    sectionName
            );

        }
    );


    if (
        sectionName ===
        "overview"
    ) {

        loadOverview();

    }


    if (
        sectionName ===
        "games"
    ) {

        loadGames();

    }


    if (
        sectionName ===
        "questions"
    ) {

        loadQuestionGames();

    }


    if (
        sectionName ===
        "statistics"
    ) {

        loadStatistics();

    }

}


/* =========================================================
   NAV BUTTONS
========================================================= */

$$(
    "[data-section]"
).forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const section =
                    button.dataset.section;

                if (!section) {
                    return;
                }

                showSection(
                    section
                );

            }
        );

    }
);


/* =========================================================
   LOGOUT
========================================================= */

const logoutButton =
    $("#logoutButton");

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            logout();

        }
    );

}


/* =========================================================
   LOAD GAMES
========================================================= */

async function loadGames() {

    const tableBody =
        $("#gamesTableBody");

    if (tableBody) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        padding:50px 20px;
                        text-align:center;
                        color:#777;
                    "
                >
                    Loading games...
                </td>
            </tr>
        `;

    }


    try {

        const data =
            await apiRequest(
                "/games"
            );


        games =
            extractArray(
                data,
                [
                    "games",
                    "data"
                ]
            );


        renderGamesTable();

        renderOverviewGames();

        updateOverviewStats();


    } catch (error) {

        console.error(
            "Load games error:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        style="
                            padding:50px 20px;
                            text-align:center;
                            color:#ff8f8f;
                        "
                    >
                        ${escapeHTML(
                            error.message
                        )}
                    </td>
                </tr>
            `;

        }

    }

}


/* =========================================================
   RENDER GAMES TABLE
========================================================= */

function renderGamesTable() {

    const tableBody =
        $("#gamesTableBody");

    if (!tableBody) {
        return;
    }


    const search =
        (
            $("#gameSearch")?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const level =
        $("#gameLevelFilter")?.value ||
        "";


    const status =
        $("#gameStatusFilter")?.value ||
        "";


    const filteredGames =
        games.filter(
            game => {

                const title =
                    String(
                        game.title || ""
                    )
                        .toLowerCase();


                const description =
                    String(
                        game.description || ""
                    )
                        .toLowerCase();


                const gameLevel =
                    String(
                        game.level || ""
                    )
                        .toUpperCase();


                const gameStatus =
                    String(
                        game.status || ""
                    )
                        .toLowerCase();


                const matchesSearch =
                    !search ||
                    title.includes(search) ||
                    description.includes(search);


                const matchesLevel =
                    !level ||
                    gameLevel ===
                        level;


                const matchesStatus =
                    !status ||
                    gameStatus ===
                        status;


                return (
                    matchesSearch &&
                    matchesLevel &&
                    matchesStatus
                );

            }
        );


    if (!filteredGames.length) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    style="
                        padding:50px 20px;
                        text-align:center;
                        color:#777;
                    "
                >
                    No games found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        filteredGames
            .map(
                game =>
                    renderGameRow(
                        game
                    )
            )
            .join("");


    attachGameActions();

}


/* =========================================================
   GAME ROW
========================================================= */

function renderGameRow(
    game
) {

    const id =
        Number(game.id);


    const status =
        String(
            game.status ||
            "active"
        ).toLowerCase();


    const isActive =
        status ===
        "active";


    return `
        <tr
            style="
                border-top:
                    1px solid
                    rgba(255,255,255,.06);
            "
        >

            <td
                style="
                    padding:17px 15px;
                "
            >

                <div
                    style="
                        font-weight:700;
                        color:#fff;
                    "
                >
                    ${escapeHTML(
                        game.title
                    )}
                </div>

                <div
                    style="
                        margin-top:4px;
                        color:#777;
                        font-size:11px;
                    "
                >
                    ${escapeHTML(
                        game.description ||
                        "No description"
                    )}
                </div>

            </td>


            <td
                style="
                    padding:17px 15px;
                "
            >

                <span
                    style="
                        display:inline-flex;
                        padding:5px 9px;
                        border-radius:7px;
                        background:
                            rgba(212,175,55,.10);
                        color:#d4af37;
                        font-size:11px;
                        font-weight:800;
                    "
                >
                    ${escapeHTML(
                        String(
                            game.level ||
                            ""
                        ).toUpperCase()
                    )}
                </span>

            </td>


            <td
                style="
                    padding:17px 15px;
                    color:#aaa;
                    font-size:12px;
                "
            >
                ${escapeHTML(
                    game.game_type ||
                    game.gameType ||
                    "—"
                )}
            </td>


            <td
                style="
                    padding:17px 15px;
                    color:#d4af37;
                    font-weight:800;
                "
            >
                ${formatNumber(
                    game.xp_reward
                )}
            </td>


            <td
                style="
                    padding:17px 15px;
                "
            >

                <span
                    style="
                        display:inline-flex;
                        padding:5px 9px;
                        border-radius:7px;
                        background:
                            ${
                                isActive
                                    ? "rgba(80,200,120,.10)"
                                    : "rgba(255,90,90,.10)"
                            };
                        color:
                            ${
                                isActive
                                    ? "#8ee8aa"
                                    : "#ff9b9b"
                            };
                        font-size:11px;
                        font-weight:800;
                    "
                >
                    ${
                        isActive
                            ? "ACTIVE"
                            : "INACTIVE"
                    }
                </span>

            </td>


            <td
                style="
                    padding:17px 15px;
                    text-align:right;
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:flex-end;
                        gap:7px;
                        flex-wrap:wrap;
                    "
                >

                    <button
                        type="button"
                        class="gm-button"
                        data-action="questions"
                        data-id="${id}"
                    >
                        ❓
                    </button>


                    <button
                        type="button"
                        class="gm-button"
                        data-action="edit"
                        data-id="${id}"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="gm-button"
                        data-action="toggle"
                        data-id="${id}"
                    >
                        ${
                            isActive
                                ? "Deactivate"
                                : "Activate"
                        }
                    </button>


                    <button
                        type="button"
                        class="gm-button"
                        data-action="delete"
                        data-id="${id}"
                        style="
                            color:#ff9b9b;
                        "
                    >
                        Delete
                    </button>

                </div>

            </td>

        </tr>
    `;

}


/* =========================================================
   GAME ACTIONS
========================================================= */

function attachGameActions() {

    $$(
        "[data-action]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    const action =
                        button.dataset.action;

                    const id =
                        Number(
                            button.dataset.id
                        );


                    if (
                        action ===
                        "edit"
                    ) {

                        openGameModal(
                            id
                        );

                    }


                    if (
                        action ===
                        "questions"
                    ) {

                        showSection(
                            "questions"
                        );

                        await selectGameForQuestions(
                            id
                        );

                    }


                    if (
                        action ===
                        "toggle"
                    ) {

                        await toggleGame(
                            id
                        );

                    }


                    if (
                        action ===
                        "delete"
                    ) {

                        await deleteGame(
                            id
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   OVERVIEW GAMES
========================================================= */

function renderOverviewGames() {

    const container =
        $("#overviewGamesList");

    if (!container) {
        return;
    }


    if (!games.length) {

        container.innerHTML = `
            <div
                style="
                    padding:35px 20px;
                    text-align:center;
                    color:#777;
                "
            >
                No games have been created yet.
            </div>
        `;

        return;

    }


    container.innerHTML =
        games
            .slice(0, 6)
            .map(
                game => {

                    const active =
                        String(
                            game.status ||
                            ""
                        ).toLowerCase() ===
                        "active";


                    return `
                        <div
                            style="
                                display:flex;
                                align-items:center;
                                justify-content:space-between;
                                gap:15px;
                                padding:15px 0;
                                border-top:
                                    1px solid
                                    rgba(255,255,255,.06);
                            "
                        >

                            <div>

                                <strong
                                    style="
                                        display:block;
                                        font-size:13px;
                                    "
                                >
                                    ${escapeHTML(
                                        game.title
                                    )}
                                </strong>

                                <span
                                    style="
                                        display:block;
                                        margin-top:4px;
                                        color:#777;
                                        font-size:11px;
                                    "
                                >
                                    ${escapeHTML(
                                        String(
                                            game.level ||
                                            ""
                                        ).toUpperCase()
                                    )}
                                    •
                                    ${formatNumber(
                                        game.xp_reward
                                    )}
                                    XP
                                </span>

                            </div>


                            <span
                                style="
                                    color:
                                        ${
                                            active
                                                ? "#8ee8aa"
                                                : "#ff9b9b"
                                        };
                                    font-size:10px;
                                    font-weight:800;
                                "
                            >
                                ${
                                    active
                                        ? "ACTIVE"
                                        : "INACTIVE"
                                }
                            </span>

                        </div>
                    `;

                }
            )
            .join("");

}


/* =========================================================
   OVERVIEW STATS
========================================================= */

function updateOverviewStats() {

    const total =
        games.length;


    const active =
        games.filter(
            game =>
                String(
                    game.status ||
                    ""
                ).toLowerCase() ===
                "active"
        ).length;


    let plays = 0;

    let xp = 0;


    games.forEach(
        game => {

            plays +=
                Number(
                    game.play_count ??
                    game.plays ??
                    game.total_plays ??
                    0
                );


            xp +=
                Number(
                    game.total_xp ??
                    game.xp_earned ??
                    0
                );

        }
    );


    if ($("#totalGames")) {

        $("#totalGames").textContent =
            formatNumber(total);

    }


    if ($("#activeGames")) {

        $("#activeGames").textContent =
            formatNumber(active);

    }


    if ($("#totalPlays")) {

        $("#totalPlays").textContent =
            formatNumber(plays);

    }


    if ($("#totalXp")) {

        $("#totalXp").textContent =
            formatNumber(xp);

    }

}


/* =========================================================
   LOAD OVERVIEW
========================================================= */

async function loadOverview() {

    await loadGames();

}


/* =========================================================
   CREATE GAME BUTTONS
========================================================= */

$("#createGameButton")
    ?.addEventListener(
        "click",
        () => {

            openGameModal();

        }
    );


$("#createGameFromOverview")
    ?.addEventListener(
        "click",
        () => {

            showSection(
                "games"
            );

            openGameModal();

        }
    );


/* =========================================================
   OPEN GAME MODAL
========================================================= */

function openGameModal(
    gameId = null
) {

    const modal =
        $("#gameModal");

    if (!modal) {
        return;
    }


    editingGameId =
        gameId;


    const title =
        $("#gameModalTitle");


    const form =
        $("#gameForm");


    hideFormMessage(
        $("#gameFormMessage")
    );


    if (form) {

        form.reset();

    }


    if (gameId) {

        const game =
            games.find(
                item =>
                    Number(item.id) ===
                    Number(gameId)
            );


        if (!game) {
            return;
        }


        if (title) {

            title.textContent =
                "Edit Game";

        }


        $("#gameId").value =
            game.id;


        $("#gameTitle").value =
            game.title || "";


        $("#gameDescription").value =
            game.description || "";


        $("#gameLevel").value =
            String(
                game.level ||
                "A1"
            ).toUpperCase();


        $("#gameType").value =
            game.game_type ||
            game.gameType ||
            "quiz";


        $("#gameXp").value =
            Number(
                game.xp_reward
            ) || 20;

    } else {

        if (title) {

            title.textContent =
                "Create Game";

        }


        $("#gameId").value =
            "";


        $("#gameLevel").value =
            "A1";


        $("#gameType").value =
            "quiz";


        $("#gameXp").value =
            20;

    }


    modal.hidden = false;

}


/* =========================================================
   CLOSE GAME MODAL
========================================================= */

function closeGameModal() {

    const modal =
        $("#gameModal");

    if (modal) {

        modal.hidden =
            true;

    }

    editingGameId =
        null;

}


$("#closeGameModal")
    ?.addEventListener(
        "click",
        closeGameModal
    );


$("#cancelGameButton")
    ?.addEventListener(
        "click",
        closeGameModal
    );


$("#gameModal")
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("#gameModal")
            ) {

                closeGameModal();

            }

        }
    );


/* =========================================================
   SAVE GAME
========================================================= */

$("#gameForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const message =
                $("#gameFormMessage");


            hideFormMessage(
                message
            );


            const title =
                $("#gameTitle")
                    ?.value
                    .trim();


            const description =
                $("#gameDescription")
                    ?.value
                    .trim();


            const level =
                $("#gameLevel")
                    ?.value;


            const gameType =
                $("#gameType")
                    ?.value;


            const xpReward =
                Number(
                    $("#gameXp")
                        ?.value
                );


            if (!title) {

                showFormMessage(
                    message,
                    "Please enter a game title."
                );

                return;

            }


            if (
                !level
            ) {

                showFormMessage(
                    message,
                    "Please select a level."
                );

                return;

            }


            if (
                Number.isNaN(
                    xpReward
                ) ||
                xpReward < 0
            ) {

                showFormMessage(
                    message,
                    "Please enter a valid XP reward."
                );

                return;

            }


            const saveButton =
                $("#saveGameButton");


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "Saving...";

            }


            try {

                const payload = {

                    title,

                    description,

                    level,

                    game_type:
                        gameType,

                    xp_reward:
                        xpReward

                };


                let data;


                if (editingGameId) {

                    data =
                        await apiRequest(
                            `/games/${editingGameId}`,
                            {
                                method:
                                    "PUT",

                                body:
                                    JSON.stringify(
                                        payload
                                    )
                            }
                        );

                } else {

                    data =
                        await apiRequest(
                            "/games",
                            {
                                method:
                                    "POST",

                                body:
                                    JSON.stringify(
                                        payload
                                    )
                            }
                        );

                }


                console.log(
                    "Game saved:",
                    data
                );


                closeGameModal();

                await loadGames();


            } catch (error) {

                console.error(
                    "Save game error:",
                    error
                );


                showFormMessage(
                    message,
                    error.message
                );

            } finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "Save Game";

                }

            }

        }
    );


/* =========================================================
   TOGGLE GAME
========================================================= */

async function toggleGame(
    gameId
) {

    const game =
        games.find(
            item =>
                Number(item.id) ===
                Number(gameId)
        );


    if (!game) {
        return;
    }


    const currentStatus =
        String(
            game.status ||
            "active"
        ).toLowerCase();


    const newStatus =
        currentStatus ===
            "active"
            ? "inactive"
            : "active";


    const confirmed =
        confirm(
            `${newStatus === "active"
                ? "Activate"
                : "Deactivate"
            } "${game.title}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/games/${gameId}/status`,
            {
                method:
                    "PATCH",

                body:
                    JSON.stringify({
                        status:
                            newStatus
                    })
            }
        );


        await loadGames();


    } catch (error) {

        console.error(
            "Toggle game error:",
            error
        );


        alert(
            error.message
        );

    }

}


/* =========================================================
   DELETE GAME
========================================================= */

async function deleteGame(
    gameId
) {

    const game =
        games.find(
            item =>
                Number(item.id) ===
                Number(gameId)
        );


    if (!game) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${game.title}"?\n\nThis will also delete all questions belonging to this game.`
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/games/${gameId}`,
            {
                method:
                    "DELETE"
            }
        );


        await loadGames();


    } catch (error) {

        console.error(
            "Delete game error:",
            error
        );


        alert(
            error.message
        );

    }

}


/* =========================================================
   GAME SEARCH
========================================================= */

$("#gameSearch")
    ?.addEventListener(
        "input",
        renderGamesTable
    );


$("#gameLevelFilter")
    ?.addEventListener(
        "change",
        renderGamesTable
    );


$("#gameStatusFilter")
    ?.addEventListener(
        "change",
        renderGamesTable
    );


/* =========================================================
   QUESTIONS — LOAD GAMES
========================================================= */

async function loadQuestionGames() {

    const container =
        $("#questionGameSelector");

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div
            style="
                padding:35px;
                text-align:center;
                color:#777;
            "
        >
            Loading games...
        </div>
    `;


    try {

        if (!games.length) {

            const data =
                await apiRequest(
                    "/games"
                );


            games =
                extractArray(
                    data,
                    [
                        "games",
                        "data"
                    ]
                );

        }


        renderQuestionGameSelector();


    } catch (error) {

        console.error(
            "Load question games error:",
            error
        );


        container.innerHTML = `
            <div
                style="
                    padding:35px;
                    text-align:center;
                    color:#ff9b9b;
                "
            >
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;

    }

}


/* =========================================================
   QUESTION GAME SELECTOR
========================================================= */

function renderQuestionGameSelector() {

    const container =
        $("#questionGameSelector");

    if (!container) {
        return;
    }


    if (!games.length) {

        container.innerHTML = `
            <div
                style="
                    padding:35px;
                    text-align:center;
                    color:#777;
                "
            >
                Create a game first.
            </div>
        `;

        return;

    }


    container.innerHTML =
        games
            .map(
                game => `
                    <button
                        type="button"
                        class="gm-question-game"
                        data-game-id="${Number(
                            game.id
                        )}"
                        style="
                            padding:20px;
                            border:1px solid rgba(255,255,255,.07);
                            border-radius:15px;
                            background:rgba(255,255,255,.035);
                            color:#fff;
                            text-align:left;
                            cursor:pointer;
                            font-family:inherit;
                        "
                    >

                        <strong
                            style="
                                display:block;
                                font-size:14px;
                            "
                        >
                            ${escapeHTML(
                                game.title
                            )}
                        </strong>

                        <span
                            style="
                                display:block;
                                margin-top:7px;
                                color:#d4af37;
                                font-size:11px;
                                font-weight:800;
                            "
                        >
                            ${escapeHTML(
                                String(
                                    game.level ||
                                    ""
                                ).toUpperCase()
                            )}
                            •
                            ${formatNumber(
                                game.xp_reward
                            )}
                            XP
                        </span>

                    </button>
                `
            )
            .join("");


    $$('.gm-question-game')
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        selectGameForQuestions(
                            Number(
                                button.dataset.gameId
                            )
                        );

                    }
                );

            }
        );

}


/* =========================================================
   SELECT GAME FOR QUESTIONS
========================================================= */

async function selectGameForQuestions(
    gameId
) {

    const game =
        games.find(
            item =>
                Number(item.id) ===
                Number(gameId)
        );


    if (!game) {
        return;
    }


    selectedGame =
        game;


    const manager =
        $("#questionManager");


    if (manager) {

        manager.hidden =
            false;

    }


    if ($("#selectedGameTitle")) {

        $("#selectedGameTitle")
            .textContent =
                game.title;

    }


    if ($("#selectedGameInfo")) {

        $("#selectedGameInfo")
            .textContent =
                `${String(
                    game.level || ""
                ).toUpperCase()} • ${
                    game.game_type ||
                    game.gameType ||
                    "Quiz"
                } • ${
                    formatNumber(
                        game.xp_reward
                    )
                } XP`;

    }


    await loadQuestions(
        gameId
    );

}


/* =========================================================
   LOAD QUESTIONS
========================================================= */

async function loadQuestions(
    gameId
) {

    const container =
        $("#questionsList");

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div
            style="
                padding:40px;
                text-align:center;
                color:#777;
            "
        >
            Loading questions...
        </div>
    `;


    try {

        const data =
            await apiRequest(
                `/games/${gameId}/questions`
            );


        questions =
            extractArray(
                data,
                [
                    "questions",
                    "data"
                ]
            );


        renderQuestions();


    } catch (error) {

        console.error(
            "Load questions error:",
            error
        );


        container.innerHTML = `
            <div
                style="
                    padding:40px;
                    text-align:center;
                    color:#ff9b9b;
                "
            >
                ${escapeHTML(
                    error.message
                )}
            </div>
        `;

    }

}


/* =========================================================
   RENDER QUESTIONS
========================================================= */

function renderQuestions() {

    const container =
        $("#questionsList");

    if (!container) {
        return;
    }


    if (!questions.length) {

        container.innerHTML = `
            <div
                style="
                    padding:45px 20px;
                    text-align:center;
                    border:1px solid rgba(255,255,255,.07);
                    border-radius:15px;
                    background:rgba(255,255,255,.025);
                "
            >

                <div
                    style="
                        font-size:30px;
                        margin-bottom:12px;
                    "
                >
                    ❓
                </div>

                <strong>
                    No questions yet
                </strong>

                <p
                    style="
                        margin-top:7px;
                        color:#777;
                        font-size:12px;
                    "
                >
                    Add the first question to this game.
                </p>

            </div>
        `;

        return;

    }


    const sortedQuestions =
        [...questions]
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        a.question_order ||
                        1
                    ) -
                    Number(
                        b.question_order ||
                        1
                    )
            );


    container.innerHTML =
        sortedQuestions
            .map(
                question =>
                    renderQuestionCard(
                        question
                    )
            )
            .join("");


    attachQuestionActions();

}


/* =========================================================
   QUESTION CARD
========================================================= */

function renderQuestionCard(
    question
) {

    const id =
        Number(question.id);


    const status =
        String(
            question.status ||
            "active"
        ).toLowerCase();


    const active =
        status === "active";


    let optionsText = "";


    if (
        Array.isArray(
            question.options
        )
    ) {

        optionsText =
            question.options.join(
                " • "
            );

    } else if (
        question.options
    ) {

        try {

            const parsed =
                JSON.parse(
                    question.options
                );


            if (
                Array.isArray(
                    parsed
                )
            ) {

                optionsText =
                    parsed.join(
                        " • "
                    );

            } else {

                optionsText =
                    String(
                        question.options
                    );

            }

        } catch {

            optionsText =
                String(
                    question.options
                );

        }

    }


    return `
        <article
            style="
                margin-bottom:12px;
                padding:20px;
                border:1px solid rgba(255,255,255,.07);
                border-radius:15px;
                background:rgba(255,255,255,.025);
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    gap:15px;
                "
            >

                <div>

                    <span
                        style="
                            color:#d4af37;
                            font-size:10px;
                            font-weight:800;
                        "
                    >
                        QUESTION ${
                            Number(
                                question.question_order ||
                                1
                            )
                        }
                    </span>

                    <h3
                        style="
                            margin-top:7px;
                            font-size:15px;
                        "
                    >
                        ${escapeHTML(
                            question.question
                        )}
                    </h3>

                </div>


                <span
                    style="
                        flex-shrink:0;
                        color:
                            ${
                                active
                                    ? "#8ee8aa"
                                    : "#ff9b9b"
                            };
                        font-size:10px;
                        font-weight:800;
                    "
                >
                    ${
                        active
                            ? "ACTIVE"
                            : "INACTIVE"
                    }
                </span>

            </div>


            <div
                style="
                    display:grid;
                    gap:7px;
                    margin-top:16px;
                    font-size:12px;
                "
            >

                <div
                    style="
                        color:#999;
                    "
                >
                    Type:
                    <strong
                        style="color:#ddd;"
                    >
                        ${escapeHTML(
                            question.question_type ||
                            "multiple-choice"
                        )}
                    </strong>
                </div>


                ${
                    optionsText
                        ? `
                            <div
                                style="
                                    color:#999;
                                "
                            >
                                Options:
                                <span
                                    style="color:#bbb;"
                                >
                                    ${escapeHTML(
                                        optionsText
                                    )}
                                </span>
                            </div>
                        `
                        : ""
                }


                <div
                    style="
                        color:#999;
                    "
                >
                    Correct answer:
                    <strong
                        style="
                            color:#8ee8aa;
                        "
                    >
                        ${escapeHTML(
                            question.correct_answer
                        )}
                    </strong>
                </div>


                <div
                    style="
                        color:#999;
                    "
                >
                    Points:
                    <strong
                        style="color:#d4af37;"
                    >
                        ${formatNumber(
                            question.points
                        )}
                    </strong>
                </div>

            </div>


            <div
                style="
                    display:flex;
                    justify-content:flex-end;
                    gap:8px;
                    margin-top:17px;
                "
            >

                <button
                    type="button"
                    class="gm-button"
                    data-question-action="edit"
                    data-id="${id}"
                >
                    Edit
                </button>


                <button
                    type="button"
                    class="gm-button"
                    data-question-action="toggle"
                    data-id="${id}"
                >
                    ${
                        active
                            ? "Deactivate"
                            : "Activate"
                    }
                </button>


                <button
                    type="button"
                    class="gm-button"
                    data-question-action="delete"
                    data-id="${id}"
                    style="
                        color:#ff9b9b;
                    "
                >
                    Delete
                </button>

            </div>

        </article>
    `;

}


/* =========================================================
   QUESTION ACTIONS
========================================================= */

function attachQuestionActions() {

    $$(
        "[data-question-action]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    const action =
                        button.dataset
                            .questionAction;


                    const id =
                        Number(
                            button.dataset.id
                        );


                    if (
                        action ===
                        "edit"
                    ) {

                        openQuestionModal(
                            id
                        );

                    }


                    if (
                        action ===
                        "toggle"
                    ) {

                        await toggleQuestion(
                            id
                        );

                    }


                    if (
                        action ===
                        "delete"
                    ) {

                        await deleteQuestion(
                            id
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   ADD QUESTION
========================================================= */

$("#addQuestionButton")
    ?.addEventListener(
        "click",
        () => {

            openQuestionModal();

        }
    );


/* =========================================================
   OPEN QUESTION MODAL
========================================================= */

function openQuestionModal(
    questionId = null
) {

    if (!selectedGame) {

        alert(
            "Please select a game first."
        );

        return;

    }


    const modal =
        $("#questionModal");


    if (!modal) {
        return;
    }


    editingQuestionId =
        questionId;


    hideFormMessage(
        $("#questionFormMessage")
    );


    $("#questionForm")
        ?.reset();


    if (questionId) {

        const question =
            questions.find(
                item =>
                    Number(item.id) ===
                    Number(questionId)
            );


        if (!question) {
            return;
        }


        $("#questionModalTitle")
            .textContent =
                "Edit Question";


        $("#questionId").value =
            question.id;


        $("#questionText").value =
            question.question || "";


        $("#questionType").value =
            question.question_type ||
            "multiple-choice";


        let options = [];


        if (
            Array.isArray(
                question.options
            )
        ) {

            options =
                question.options;

        } else if (
            question.options
        ) {

            try {

                const parsed =
                    JSON.parse(
                        question.options
                    );


                if (
                    Array.isArray(
                        parsed
                    )
                ) {

                    options =
                        parsed;

                }

            } catch {

                options =
                    String(
                        question.options
                    )
                        .split("\n")
                        .map(
                            item =>
                                item.trim()
                        )
                        .filter(Boolean);

            }

        }


        $("#questionOptions").value =
            options.join("\n");


        $("#correctAnswer").value =
            question.correct_answer ||
            "";


        $("#questionExplanation").value =
            question.explanation ||
            "";


        $("#questionPoints").value =
            Number(
                question.points
            ) || 1;


        $("#questionOrder").value =
            Number(
                question.question_order
            ) || 1;

    } else {

        $("#questionModalTitle")
            .textContent =
                "Add Question";


        $("#questionId").value =
            "";


        $("#questionType").value =
            "multiple-choice";


        $("#questionPoints").value =
            1;


        $("#questionOrder").value =
            questions.length + 1;

    }


    modal.hidden =
        false;

}


/* =========================================================
   CLOSE QUESTION MODAL
========================================================= */

function closeQuestionModal() {

    const modal =
        $("#questionModal");

    if (modal) {

        modal.hidden =
            true;

    }

    editingQuestionId =
        null;

}


$("#closeQuestionModal")
    ?.addEventListener(
        "click",
        closeQuestionModal
    );


$("#cancelQuestionButton")
    ?.addEventListener(
        "click",
        closeQuestionModal
    );


$("#questionModal")
    ?.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                $("#questionModal")
            ) {

                closeQuestionModal();

            }

        }
    );


/* =========================================================
   SAVE QUESTION
========================================================= */

$("#questionForm")
    ?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!selectedGame) {

                showFormMessage(
                    $("#questionFormMessage"),
                    "Please select a game first."
                );

                return;

            }


            const message =
                $("#questionFormMessage");


            hideFormMessage(
                message
            );


            const question =
                $("#questionText")
                    ?.value
                    .trim();


            const questionType =
                $("#questionType")
                    ?.value;


            const optionsText =
                $("#questionOptions")
                    ?.value
                    .trim();


            const correctAnswer =
                $("#correctAnswer")
                    ?.value
                    .trim();


            const explanation =
                $("#questionExplanation")
                    ?.value
                    .trim();


            const points =
                Number(
                    $("#questionPoints")
                        ?.value
                );


            const questionOrder =
                Number(
                    $("#questionOrder")
                        ?.value
                );


            if (!question) {

                showFormMessage(
                    message,
                    "Please enter the question."
                );

                return;

            }


            if (!correctAnswer) {

                showFormMessage(
                    message,
                    "Please enter the correct answer."
                );

                return;

            }


            const options =
                optionsText
                    ? optionsText
                        .split("\n")
                        .map(
                            item =>
                                item.trim()
                        )
                        .filter(Boolean)
                    : [];


            const saveButton =
                $("#saveQuestionButton");


            if (saveButton) {

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "Saving...";

            }


            try {

                const payload = {

                    question,

                    question_type:
                        questionType,

                    options,

                    correct_answer:
                        correctAnswer,

                    explanation,

                    points:
                        Number.isFinite(points)
                            ? points
                            : 1,

                    question_order:
                        Number.isFinite(
                            questionOrder
                        )
                            ? questionOrder
                            : 1

                };


                if (
                    editingQuestionId
                ) {

                    await apiRequest(
                        `/questions/${editingQuestionId}`,
                        {
                            method:
                                "PUT",

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                } else {

                    await apiRequest(
                        `/games/${selectedGame.id}/questions`,
                        {
                            method:
                                "POST",

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );

                }


                closeQuestionModal();


                await loadQuestions(
                    selectedGame.id
                );


            } catch (error) {

                console.error(
                    "Save question error:",
                    error
                );


                showFormMessage(
                    message,
                    error.message
                );

            } finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "Save Question";

                }

            }

        }
    );


/* =========================================================
   TOGGLE QUESTION
========================================================= */

async function toggleQuestion(
    questionId
) {

    const question =
        questions.find(
            item =>
                Number(item.id) ===
                Number(questionId)
        );


    if (!question) {
        return;
    }


    const currentStatus =
        String(
            question.status ||
            "active"
        ).toLowerCase();


    const newStatus =
        currentStatus ===
            "active"
            ? "inactive"
            : "active";


    try {

        await apiRequest(
            `/questions/${questionId}/status`,
            {
                method:
                    "PATCH",

                body:
                    JSON.stringify({
                        status:
                            newStatus
                    })
            }
        );


        await loadQuestions(
            selectedGame.id
        );


    } catch (error) {

        console.error(
            "Toggle question error:",
            error
        );


        alert(
            error.message
        );

    }

}


/* =========================================================
   DELETE QUESTION
========================================================= */

async function deleteQuestion(
    questionId
) {

    const question =
        questions.find(
            item =>
                Number(item.id) ===
                Number(questionId)
        );


    if (!question) {
        return;
    }


    const confirmed =
        confirm(
            "Delete this question?"
        );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(
            `/questions/${questionId}`,
            {
                method:
                    "DELETE"
            }
        );


        await loadQuestions(
            selectedGame.id
        );


    } catch (error) {

        console.error(
            "Delete question error:",
            error
        );


        alert(
            error.message
        );

    }

}


/* =========================================================
   STATISTICS
========================================================= */

async function loadStatistics() {

    const container =
        $("#statisticsContainer");

    if (!container) {
        return;
    }


    container.innerHTML = `
        <div
            style="
                padding:40px;
                text-align:center;
                color:#777;
            "
        >
            Loading statistics...
        </div>
    `;


    try {

        const data =
            await apiRequest(
                "/statistics"
            );


        renderStatistics(
            data
        );


    } catch (error) {

        console.error(
            "Statistics error:",
            error
        );


        /*
         * If there are no scores yet,
         * still show a useful empty state.
         */

        container.innerHTML = `
            <div
                style="
                    padding:45px;
                    text-align:center;
                    border:1px solid rgba(255,255,255,.07);
                    border-radius:15px;
                    background:rgba(255,255,255,.025);
                "
            >

                <div
                    style="
                        font-size:30px;
                        margin-bottom:12px;
                    "
                >
                    📈
                </div>

                <strong>
                    No statistics available yet
                </strong>

                <p
                    style="
                        margin-top:8px;
                        color:#777;
                        font-size:12px;
                    "
                >
                    Statistics will appear here once students start playing games.
                </p>

            </div>
        `;

    }

}


/* =========================================================
   RENDER STATISTICS
========================================================= */

function renderStatistics(
    data
) {

    const container =
        $("#statisticsContainer");

    if (!container) {
        return;
    }


    const stats =
        data?.statistics ||
        data?.data ||
        data ||
        {};


    const gameStats =
        extractArray(
            stats,
            [
                "games",
                "gameStats",
                "game_statistics"
            ]
        );


    const totalPlays =
        Number(
            stats.total_plays ??
            stats.totalPlays ??
            0
        );


    const totalXp =
        Number(
            stats.total_xp ??
            stats.totalXp ??
            0
        );


    const totalPlayers =
        Number(
            stats.total_players ??
            stats.totalPlayers ??
            0
        );


    container.innerHTML = `

        <div
            class="gm-stats-grid"
            style="
                margin-bottom:25px;
            "
        >

            <div class="gm-stat-card">

                <span>
                    Total Plays
                </span>

                <strong>
                    ${formatNumber(
                        totalPlays
                    )}
                </strong>

            </div>


            <div class="gm-stat-card">

                <span>
                    XP Earned
                </span>

                <strong>
                    ${formatNumber(
                        totalXp
                    )}
                </strong>

            </div>


            <div class="gm-stat-card">

                <span>
                    Players
                </span>

                <strong>
                    ${formatNumber(
                        totalPlayers
                    )}
                </strong>

            </div>


            <div class="gm-stat-card">

                <span>
                    Games
                </span>

                <strong>
                    ${formatNumber(
                        games.length
                    )}
                </strong>

            </div>

        </div>


        <div
            style="
                padding:24px;
                border:1px solid rgba(255,255,255,.07);
                border-radius:16px;
                background:rgba(255,255,255,.025);
            "
        >

            <h2
                style="
                    font-family:'Space Grotesk',sans-serif;
                    font-size:19px;
                    margin-bottom:20px;
                "
            >
                Game Performance
            </h2>


            ${
                gameStats.length
                    ? gameStats
                        .map(
                            stat => `
                                <div
                                    style="
                                        display:flex;
                                        justify-content:space-between;
                                        gap:15px;
                                        padding:14px 0;
                                        border-top:
                                            1px solid
                                            rgba(255,255,255,.06);
                                    "
                                >

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                stat.title ||
                                                stat.game_title ||
                                                "Game"
                                            )}
                                        </strong>

                                        <div
                                            style="
                                                margin-top:4px;
                                                color:#777;
                                                font-size:11px;
                                            "
                                        >
                                            ${formatNumber(
                                                stat.plays ??
                                                stat.total_plays ??
                                                0
                                            )}
                                            plays
                                        </div>

                                    </div>


                                    <strong
                                        style="
                                            color:#d4af37;
                                        "
                                    >
                                        ${formatNumber(
                                            stat.xp_earned ??
                                            stat.total_xp ??
                                            0
                                        )}
                                        XP
                                    </strong>

                                </div>
                            `
                        )
                        .join("")
                    : `
                        <div
                            style="
                                padding:30px;
                                text-align:center;
                                color:#777;
                            "
                        >
                            No game performance data yet.
                        </div>
                    `
            }

        </div>
    `;

}


/* =========================================================
   INITIAL LOAD
========================================================= */

async function initializeDashboard() {

    try {

        await loadOverview();

    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );

    }

}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeDashboard();

    }
);


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "LDC Games Manager Dashboard loaded."
);
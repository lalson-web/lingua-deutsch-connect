/* =========================================================
   LINGUA DEUTSCH CONNECT
   STUDENT LEARNING GAMES
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL = "/api";

const TOKEN_KEY = "ldc_token";
const STUDENT_KEY = "ldc_student";

const GAME_STATS_KEY = "ldc_game_stats";
const DAILY_GAME_KEY = "ldc_daily_game";


/* =========================================================
   GAME DATA
========================================================= */

const GAMES = {

    "word-match": {
        title: "🧩 Wort-Match",
        description: "Match German words with their correct meanings.",
        xp: 20,
        questions: 5
    },

    "article-challenge": {
        title: "📝 Artikel-Challenge",
        description: "Choose the correct German article.",
        xp: 25,
        questions: 5
    },

    "verb-race": {
        title: "🏃 Verb-Rennen",
        description: "Choose the correct verb form before time runs out.",
        xp: 30,
        questions: 5
    },

    "sentence-builder": {
        title: "🔤 Satz-Baumeister",
        description: "Build correct German sentences.",
        xp: 30,
        questions: 5
    },

    "listening-quiz": {
        title: "🎧 Hör-Quiz",
        description: "Listen carefully and answer the question.",
        xp: 35,
        questions: 5
    },

    "deutsch-meister": {
        title: "🇩🇪 Deutsch-Meister",
        description: "A mixed German challenge.",
        xp: 50,
        questions: 8
    }

};


/* =========================================================
   DATABASE GAME STATE
========================================================= */

let studentGames = [];

const studentGameCache = {};

let gamesCatalogLoaded = false;


/* =========================================================
   QUESTION BANKS
   FALLBACK QUESTIONS
========================================================= */

const WORD_MATCH_QUESTIONS = [

    {
        question: "Was bedeutet „Haus“?",
        options: ["House", "Car", "School", "Table"],
        answer: "House"
    },

    {
        question: "Was bedeutet „Wasser“?",
        options: ["Bread", "Water", "Milk", "Coffee"],
        answer: "Water"
    },

    {
        question: "Was bedeutet „Freund“?",
        options: ["Teacher", "Brother", "Friend", "Father"],
        answer: "Friend"
    },

    {
        question: "Was bedeutet „essen“?",
        options: ["To drink", "To sleep", "To eat", "To run"],
        answer: "To eat"
    },

    {
        question: "Was bedeutet „schnell“?",
        options: ["Slow", "Fast", "Beautiful", "Small"],
        answer: "Fast"
    },

    {
        question: "Was bedeutet „arbeiten“?",
        options: ["To work", "To travel", "To learn", "To speak"],
        answer: "To work"
    },

    {
        question: "Was bedeutet „Buch“?",
        options: ["Pen", "Book", "Chair", "Window"],
        answer: "Book"
    },

    {
        question: "Was bedeutet „kaufen“?",
        options: ["To sell", "To buy", "To open", "To close"],
        answer: "To buy"
    },

    {
        question: "Was bedeutet „heute“?",
        options: ["Tomorrow", "Yesterday", "Today", "Always"],
        answer: "Today"
    },

    {
        question: "Was bedeutet „schön“?",
        options: ["Ugly", "Beautiful", "Expensive", "Cheap"],
        answer: "Beautiful"
    }

];


const ARTICLE_QUESTIONS = [

    {
        question: "___ Mann",
        options: ["der", "die", "das"],
        answer: "der"
    },

    {
        question: "___ Frau",
        options: ["der", "die", "das"],
        answer: "die"
    },

    {
        question: "___ Kind",
        options: ["der", "die", "das"],
        answer: "das"
    },

    {
        question: "___ Tisch",
        options: ["der", "die", "das"],
        answer: "der"
    },

    {
        question: "___ Lampe",
        options: ["der", "die", "das"],
        answer: "die"
    },

    {
        question: "___ Auto",
        options: ["der", "die", "das"],
        answer: "das"
    },

    {
        question: "___ Schule",
        options: ["der", "die", "das"],
        answer: "die"
    },

    {
        question: "___ Lehrer",
        options: ["der", "die", "das"],
        answer: "der"
    },

    {
        question: "___ Mädchen",
        options: ["der", "die", "das"],
        answer: "das"
    },

    {
        question: "___ Stadt",
        options: ["der", "die", "das"],
        answer: "die"
    }

];


const VERB_RACE_QUESTIONS = [

    {
        question: "Ich ___ Deutsch.",
        options: ["lerne", "lernst", "lernt", "lernen"],
        answer: "lerne"
    },

    {
        question: "Du ___ Fußball.",
        options: ["spiele", "spielst", "spielt", "spielen"],
        answer: "spielst"
    },

    {
        question: "Er ___ jeden Morgen.",
        options: ["laufe", "läufst", "läuft", "laufen"],
        answer: "läuft"
    },

    {
        question: "Wir ___ in Kigali.",
        options: ["wohne", "wohnst", "wohnt", "wohnen"],
        answer: "wohnen"
    },

    {
        question: "Ihr ___ sehr gut Deutsch.",
        options: ["spreche", "sprichst", "spricht", "sprecht"],
        answer: "sprecht"
    },

    {
        question: "Sie ___ heute nach Hause.",
        options: ["geht", "gehen", "gehst", "gehe"],
        answer: "gehen"
    },

    {
        question: "Ich ___ einen Kaffee.",
        options: ["trinke", "trinkst", "trinkt", "trinken"],
        answer: "trinke"
    },

    {
        question: "Du ___ sehr schnell.",
        options: ["laufe", "läufst", "läuft", "laufen"],
        answer: "läufst"
    },

    {
        question: "Wir ___ morgen nach Deutschland.",
        options: ["fahre", "fährst", "fährt", "fahren"],
        answer: "fahren"
    },

    {
        question: "Sie ___ gerne Musik.",
        options: ["höre", "hörst", "hört", "hören"],
        answer: "hören"
    }

];


const SENTENCE_QUESTIONS = [

    {
        words: ["heute", "Ich", "Deutsch", "lerne"],
        answer: "Ich lerne heute Deutsch."
    },

    {
        words: ["in Kigali", "wohnt", "Er"],
        answer: "Er wohnt in Kigali."
    },

    {
        words: ["gern", "Sie", "Musik", "hört"],
        answer: "Sie hört gern Musik."
    },

    {
        words: ["morgen", "Wir", "nach Hause", "gehen"],
        answer: "Wir gehen morgen nach Hause."
    },

    {
        words: ["einen Kaffee", "Ich", "trinke"],
        answer: "Ich trinke einen Kaffee."
    },

    {
        words: ["Deutsch", "sprechen", "Wir", "im Kurs"],
        answer: "Wir sprechen Deutsch im Kurs."
    },

    {
        words: ["heute", "Er", "arbeitet"],
        answer: "Er arbeitet heute."
    },

    {
        words: ["am Wochenende", "Sie", "Fußball", "spielt"],
        answer: "Sie spielt am Wochenende Fußball."
    }

];


const LISTENING_QUESTIONS = [

    {
        text: "Ich wohne in Kigali.",
        question: "Wo wohnt die Person?",
        options: ["Berlin", "Kigali", "Paris", "Frankfurt"],
        answer: "Kigali"
    },

    {
        text: "Maria trinkt jeden Morgen Kaffee.",
        question: "Was trinkt Maria?",
        options: ["Tee", "Wasser", "Kaffee", "Milch"],
        answer: "Kaffee"
    },

    {
        text: "Peter fährt am Samstag nach Berlin.",
        question: "Wann fährt Peter nach Berlin?",
        options: ["Montag", "Freitag", "Samstag", "Sonntag"],
        answer: "Samstag"
    },

    {
        text: "Anna lernt seit zwei Jahren Deutsch.",
        question: "Was lernt Anna?",
        options: ["Englisch", "Deutsch", "Französisch", "Spanisch"],
        answer: "Deutsch"
    },

    {
        text: "Der Kurs beginnt um acht Uhr.",
        question: "Wann beginnt der Kurs?",
        options: ["7 Uhr", "8 Uhr", "9 Uhr", "10 Uhr"],
        answer: "8 Uhr"
    },

    {
        text: "Tom arbeitet in einem Restaurant.",
        question: "Wo arbeitet Tom?",
        options: [
            "In einer Schule",
            "In einem Restaurant",
            "In einem Hotel",
            "Zu Hause"
        ],
        answer: "In einem Restaurant"
    },

    {
        text: "Lisa hat zwei Geschwister.",
        question: "Wie viele Geschwister hat Lisa?",
        options: ["Ein", "Zwei", "Drei", "Vier"],
        answer: "Zwei"
    }

];


const DEUTSCH_MEISTER_QUESTIONS = [

    {
        question: "Was ist der Plural von „das Kind“?",
        options: [
            "die Kinde",
            "die Kinder",
            "die Kinds",
            "die Kindern"
        ],
        answer: "die Kinder"
    },

    {
        question: "Welche Form ist richtig?",
        options: [
            "Ich habe gegangen.",
            "Ich bin gegangen.",
            "Ich habe gehen.",
            "Ich bin gehen."
        ],
        answer: "Ich bin gegangen."
    },

    {
        question: "Was bedeutet „sich verabreden“?",
        options: [
            "To get lost",
            "To make an appointment",
            "To get angry",
            "To sleep"
        ],
        answer: "To make an appointment"
    },

    {
        question: "Welche Präposition passt? Ich warte ___ den Bus.",
        options: ["auf", "mit", "bei", "von"],
        answer: "auf"
    },

    {
        question: "Welche Form ist richtig?",
        options: [
            "Wenn ich Zeit habe, komme ich.",
            "Wenn ich Zeit habe, ich komme.",
            "Wenn ich habe Zeit, komme ich.",
            "Wenn Zeit ich habe, komme ich."
        ],
        answer: "Wenn ich Zeit habe, komme ich."
    },

    {
        question: "Was ist das Präteritum von „gehen“?",
        options: [
            "gegangen",
            "ging",
            "geht",
            "gehte"
        ],
        answer: "ging"
    },

    {
        question: "Welche Form ist Konjunktiv II?",
        options: [
            "Ich kann",
            "Ich konnte",
            "Ich könnte",
            "Ich gekonnt"
        ],
        answer: "Ich könnte"
    },

    {
        question: "Was bedeutet „Pflicht“?",
        options: [
            "Freedom",
            "Duty / obligation",
            "Holiday",
            "Opportunity"
        ],
        answer: "Duty / obligation"
    },

    {
        question: "Welche Antwort passt? „Wie geht es dir?“",
        options: [
            "Ich bin 18.",
            "Es geht mir gut.",
            "Ich wohne in Kigali.",
            "Ich heiße Lalson."
        ],
        answer: "Es geht mir gut."
    },

    {
        question: "Was ist der Superlativ von „gut“?",
        options: [
            "guter",
            "guten",
            "am besten",
            "guterer"
        ],
        answer: "am besten"
    }

];


/* =========================================================
   FALLBACK MAP
========================================================= */

const FALLBACK_QUESTION_BANKS = {

    "word-match":
        WORD_MATCH_QUESTIONS,

    "article-challenge":
        ARTICLE_QUESTIONS,

    "verb-race":
        VERB_RACE_QUESTIONS,

    "sentence-builder":
        SENTENCE_QUESTIONS,

    "listening-quiz":
        LISTENING_QUESTIONS,

    "deutsch-meister":
        DEUTSCH_MEISTER_QUESTIONS

};


/* =========================================================
   STATE
========================================================= */

let currentGame = null;
let currentQuestions = [];
let currentQuestionIndex = 0;
let currentScore = 0;
let currentTimer = null;
let currentTimeLeft = 0;
let sentenceSelectedWords = [];
let gameFinished = false;


/* =========================================================
   BASIC HELPERS
========================================================= */

function $(selector) {

    return document.querySelector(
        selector
    );

}


function escapeHTML(value) {

    return String(value ?? "")
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


function shuffle(array) {

    const copy =
        Array.isArray(array)
            ? [...array]
            : [];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];

    }

    return copy;

}


function getTodayKey() {

    const date =
        new Date();

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )
    ].join("-");

}


/* =========================================================
   DATABASE GAME HELPERS
========================================================= */

/*
 * The Games Manager stores game_type in the database.
 * These values correspond to the data-game values
 * already used by games.html.
 */

function normalizeGameType(value) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /_/g,
            "-"
        )
        .replace(
            /\s+/g,
            "-"
        );

}


function findDatabaseGame(
    gameId
) {

    const normalized =
        normalizeGameType(
            gameId
        );

    return studentGames.find(
        game =>
            normalizeGameType(
                game.game_type
            ) === normalized
    ) || null;

}


/* =========================================================
   PARSE DATABASE OPTIONS
========================================================= */

function parseDatabaseOptions(
    value
) {

    if (
        Array.isArray(value)
    ) {

        return value;

    }

    if (
        value === null ||
        value === undefined
    ) {

        return [];

    }

    if (
        typeof value === "object"
    ) {

        return Object.values(
            value
        );

    }

    const stringValue =
        String(value).trim();

    if (!stringValue) {

        return [];

    }

    try {

        const parsed =
            JSON.parse(
                stringValue
            );

        if (
            Array.isArray(parsed)
        ) {

            return parsed;

        }

        if (
            parsed &&
            typeof parsed === "object"
        ) {

            return Object.values(
                parsed
            );

        }

    } catch {

        /*
         * It may simply be a comma-separated
         * list entered by the manager.
         */

    }

    return stringValue
        .split(",")
        .map(
            item =>
                item.trim()
        )
        .filter(
            Boolean
        );

}


/* =========================================================
   NORMALIZE DATABASE QUESTION
========================================================= */

function normalizeDatabaseQuestion(
    rawQuestion,
    gameId
) {

    if (
        !rawQuestion
    ) {

        return null;

    }

    const options =
        parseDatabaseOptions(
            rawQuestion.options
        );

    const answer =
        rawQuestion.correct_answer ??
        rawQuestion.answer ??
        "";

    const questionText =
        rawQuestion.question ??
        rawQuestion.text ??
        "";

    const normalized = {

        id:
            rawQuestion.id,

        question:
            String(
                questionText
            ),

        options:
            options.map(
                option =>
                    String(
                        option
                    )
            ),

        answer:
            String(
                answer
            ),

        explanation:
            rawQuestion.explanation ||
            "",

        points:
            Number(
                rawQuestion.points
            ) || 1,

        questionType:
            rawQuestion.question_type ||
            "multiple-choice"

    };


    /*
     * Sentence Builder needs a word bank.
     *
     * The Games Manager stores options as JSON.
     * Therefore, when game_type is sentence-builder,
     * options become the available words.
     *
     * If the manager did not enter options,
     * generate a basic word bank from the answer.
     */

    if (
        normalizeGameType(
            gameId
        ) ===
        "sentence-builder"
    ) {

        if (
            normalized.options.length === 0 &&
            normalized.answer
        ) {

            normalized.words =
                normalized.answer
                    .replace(
                        /[.!?,;:]+$/g,
                        ""
                    )
                    .split(
                        /\s+/
                    )
                    .filter(
                        Boolean
                    );

        } else {

            normalized.words =
                normalized.options;

        }

    }


    /*
     * Listening Quiz needs a text value
     * for speech synthesis.
     *
     * The current database schema does not
     * have a dedicated listening text field,
     * so use question.text if supplied,
     * otherwise use the question itself.
     */

    if (
        normalizeGameType(
            gameId
        ) ===
        "listening-quiz"
    ) {

        normalized.text =
            rawQuestion.text ||
            rawQuestion.audio_text ||
            rawQuestion.question ||
            "";

    }


    return normalized;

}


/* =========================================================
   LOAD STUDENT GAMES
========================================================= */

async function loadStudentGames() {

    try {

        const data =
            await apiFetch(
                "/student/games"
            );

        if (
            data &&
            Array.isArray(
                data.games
            )
        ) {

            studentGames =
                data.games;

            gamesCatalogLoaded =
                true;

            console.log(
                "Student games loaded from database:",
                studentGames
            );

            return studentGames;

        }

        studentGames = [];

    } catch (error) {

        gamesCatalogLoaded =
            false;

        studentGames = [];

        console.warn(
            "Could not load student games from database. Using fallback games.",
            error
        );

    }

    return studentGames;

}


/* =========================================================
   LOAD QUESTIONS FOR A DATABASE GAME
========================================================= */

async function loadDatabaseQuestions(
    gameId
) {

    const databaseGame =
        findDatabaseGame(
            gameId
        );

    if (
        !databaseGame
    ) {

        return null;

    }

    const databaseGameId =
        databaseGame.id;

    if (
        studentGameCache[
            databaseGameId
        ]
    ) {

        return studentGameCache[
            databaseGameId
        ];

    }

    try {

        const data =
            await apiFetch(
                `/student/games/${databaseGameId}/questions`
            );

        if (
            !data ||
            !Array.isArray(
                data.questions
            )
        ) {

            return null;

        }

        const questions =
            data.questions
                .map(
                    question =>
                        normalizeDatabaseQuestion(
                            question,
                            gameId
                        )
                )
                .filter(
                    Boolean
                );

        if (
            questions.length === 0
        ) {

            return null;

        }

        studentGameCache[
            databaseGameId
        ] =
            questions;

        console.log(
            `Loaded ${questions.length} database questions for ${gameId}.`
        );

        return questions;

    } catch (error) {

        console.warn(
            `Could not load database questions for ${gameId}. Using fallback questions.`,
            error
        );

        return null;

    }

}


/* =========================================================
   GET QUESTIONS FOR STUDENT GAME
========================================================= */

async function getQuestionsForGame(
    gameId
) {

    /*
     * Try the database first.
     */

    const databaseQuestions =
        await loadDatabaseQuestions(
            gameId
        );

    if (
        Array.isArray(
            databaseQuestions
        ) &&
        databaseQuestions.length > 0
    ) {

        return databaseQuestions;

    }


    /*
     * Fallback to the original hardcoded
     * question bank.
     */

    const fallback =
        FALLBACK_QUESTION_BANKS[
            gameId
        ] || [];

    console.warn(
        `Using fallback questions for ${gameId}.`
    );

    return fallback;

}


/* =========================================================
   GAME LOADING SCREEN
========================================================= */

function showGameLoading() {

    const stage =
        $("#gameStage");

    if (!stage) return;

    stage.innerHTML = `

        <div
            style="
                min-height:220px;
                display:flex;
                align-items:center;
                justify-content:center;
                flex-direction:column;
                gap:14px;
                text-align:center;
            "
        >

            <div
                style="
                    width:42px;
                    height:42px;
                    border:4px solid #e8e8e8;
                    border-top-color:#d4a900;
                    border-radius:50%;
                    animation:ldcGameSpin .8s linear infinite;
                "
            ></div>

            <strong
                style="
                    color:#111;
                    font-size:15px;
                "
            >
                Loading game questions...
            </strong>

            <span
                style="
                    color:#777;
                    font-size:12px;
                "
            >
                Preparing your German challenge.
            </span>

        </div>

    `;

    if (
        !document.getElementById(
            "ldcGameSpinStyle"
        )
    ) {

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "ldcGameSpinStyle";

        style.textContent = `

            @keyframes ldcGameSpin {

                to {
                    transform: rotate(360deg);
                }

            }

        `;

        document.head.appendChild(
            style
        );

    }

}


/* =========================================================
   LOCAL GAME STATISTICS
========================================================= */

function getGameStats() {

    try {

        const raw =
            localStorage.getItem(
                GAME_STATS_KEY
            );

        if (!raw) {

            return {
                xp: 0,
                gamesPlayed: 0,
                bestScore: 0,
                history: []
            };

        }

        const parsed =
            JSON.parse(
                raw
            );

        return {

            xp:
                Number(
                    parsed.xp
                ) || 0,

            gamesPlayed:
                Number(
                    parsed.gamesPlayed
                ) || 0,

            bestScore:
                Number(
                    parsed.bestScore
                ) || 0,

            history:
                Array.isArray(
                    parsed.history
                )
                    ? parsed.history
                    : []

        };

    } catch (error) {

        console.warn(
            "Could not read game statistics:",
            error
        );

        return {
            xp: 0,
            gamesPlayed: 0,
            bestScore: 0,
            history: []
        };

    }

}


function saveGameStats(
    stats
) {

    try {

        localStorage.setItem(
            GAME_STATS_KEY,
            JSON.stringify(
                stats
            )
        );

    } catch (error) {

        console.warn(
            "Could not save game statistics:",
            error
        );

    }

}


function updateGameStatistics() {

    const stats =
        getGameStats();

    const xpElement =
        $("#gameTotalXp");

    const playedElement =
        $("#gamesPlayed");

    const bestElement =
        $("#bestGameScore");

    if (xpElement) {

        xpElement.textContent =
            stats.xp;

    }

    if (playedElement) {

        playedElement.textContent =
            stats.gamesPlayed;

    }

    if (bestElement) {

        bestElement.textContent =
            `${stats.bestScore}%`;

    }

}


/* =========================================================
   MODAL CREATION
========================================================= */

function createGameModal() {

    let modal =
        document.getElementById(
            "gameModal"
        );

    if (modal) {

        return modal;

    }

    modal =
        document.createElement(
            "div"
        );

    modal.id =
        "gameModal";

    modal.innerHTML = `

        <div
            class="ldc-game-overlay"
            id="gameOverlay"
        >

            <div
                class="ldc-game-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="gameModalTitle"
            >

                <div class="ldc-game-modal-top">

                    <div>

                        <div
                            class="ldc-game-modal-kicker"
                            id="gameModalKicker"
                        >
                            LINGUA DEUTSCH CONNECT
                        </div>

                        <h2
                            id="gameModalTitle"
                        >
                            German Game
                        </h2>

                        <p
                            id="gameModalDescription"
                        >
                            Let's play!
                        </p>

                    </div>

                    <button
                        type="button"
                        class="ldc-game-close"
                        id="gameModalClose"
                        aria-label="Close game"
                    >
                        ×
                    </button>

                </div>

                <div
                    class="ldc-game-stage"
                    id="gameStage"
                ></div>

            </div>

        </div>

    `;

    document.body.appendChild(
        modal
    );

    addModalStyles();

    const closeButton =
        document.getElementById(
            "gameModalClose"
        );

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeGame
        );

    }

    const overlay =
        document.getElementById(
            "gameOverlay"
        );

    if (overlay) {

        overlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    overlay
                ) {

                    closeGame();

                }

            }
        );

    }

    return modal;

}


/* =========================================================
   MODAL STYLES
========================================================= */

function addModalStyles() {

    if (
        document.getElementById(
            "ldcGameModalStyles"
        )
    ) {

        return;

    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "ldcGameModalStyles";

    style.textContent = `

        #gameModal {
            display: block;
        }

        .ldc-game-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(5, 8, 18, .78);
            backdrop-filter: blur(10px);
            overflow-y: auto;
        }

        .ldc-game-modal {
            width: min(720px, 100%);
            max-height: calc(100vh - 40px);
            overflow-y: auto;
            border-radius: 26px;
            background: #ffffff;
            box-shadow: 0 30px 90px rgba(0, 0, 0, .35);
            animation: ldcGameModalIn .22s ease;
        }

        @keyframes ldcGameModalIn {

            from {
                opacity: 0;
                transform: translateY(20px) scale(.97);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }

        }

        .ldc-game-modal-top {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding: 26px 28px 20px;
            border-bottom: 1px solid #eceef2;
        }

        .ldc-game-modal-kicker {
            margin-bottom: 7px;
            color: #c8102e;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1.2px;
        }

        .ldc-game-modal h2 {
            margin: 0;
            color: #101010;
            font-family: "Space Grotesk", sans-serif;
            font-size: 28px;
        }

        .ldc-game-modal-top p {
            margin: 5px 0 0;
            color: #666;
            font-size: 13px;
        }

        .ldc-game-close {
            flex-shrink: 0;
            width: 42px;
            height: 42px;
            border: 0;
            border-radius: 50%;
            background: #f1f2f5;
            color: #111;
            font-size: 26px;
            line-height: 1;
            cursor: pointer;
        }

        .ldc-game-close:hover {
            background: #101010;
            color: #fff;
        }

        .ldc-game-stage {
            padding: 28px;
        }

        .ldc-game-progress {
            height: 7px;
            margin-bottom: 22px;
            overflow: hidden;
            border-radius: 999px;
            background: #e9ebef;
        }

        .ldc-game-progress-fill {
            width: 0%;
            height: 100%;
            border-radius: inherit;
            background: #d4a900;
            transition: width .25s ease;
        }

        .ldc-game-question-number {
            margin-bottom: 9px;
            color: #1255d8;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .8px;
        }

        .ldc-game-question {
            margin: 0 0 24px;
            color: #101010;
            font-family: "Space Grotesk", sans-serif;
            font-size: clamp(23px, 5vw, 34px);
            line-height: 1.2;
        }

        .ldc-game-options {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .ldc-game-option {
            min-height: 58px;
            padding: 13px 16px;
            border: 1px solid #e1e4e9;
            border-radius: 15px;
            background: #fff;
            color: #111;
            font-size: 14px;
            font-weight: 800;
            text-align: left;
            cursor: pointer;
            transition: .18s ease;
        }

        .ldc-game-option:hover {
            border-color: #1255d8;
            background: #f2f5ff;
            transform: translateY(-2px);
        }

        .ldc-game-option.correct {
            border-color: #167333;
            background: #eaf7ed;
            color: #167333;
        }

        .ldc-game-option.wrong {
            border-color: #c8102e;
            background: #fff0f2;
            color: #c8102e;
        }

        .ldc-game-feedback {
            min-height: 48px;
            margin-top: 18px;
            padding: 13px 15px;
            border-radius: 14px;
            background: #f5f6f8;
            color: #555;
            font-size: 13px;
            line-height: 1.5;
        }

        .ldc-game-feedback.success {
            background: #eaf7ed;
            color: #167333;
        }

        .ldc-game-feedback.error {
            background: #fff0f2;
            color: #c8102e;
        }

        .ldc-game-next {
            width: 100%;
            min-height: 50px;
            margin-top: 16px;
            border: 0;
            border-radius: 14px;
            background: #101010;
            color: #fff;
            font-size: 13px;
            font-weight: 900;
            cursor: pointer;
        }

        .ldc-game-next:hover {
            background: #d4a900;
            color: #101010;
        }

        .ldc-game-timer {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 90px;
            margin-bottom: 16px;
            padding: 9px 13px;
            border-radius: 999px;
            background: #fff5df;
            color: #8a6a00;
            font-size: 12px;
            font-weight: 900;
        }

        .ldc-game-word-bank {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-bottom: 18px;
        }

        .ldc-game-word {
            padding: 11px 14px;
            border: 1px solid #dfe2e7;
            border-radius: 12px;
            background: #fff;
            color: #111;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
        }

        .ldc-game-word:hover {
            border-color: #1255d8;
            background: #eef3ff;
        }

        .ldc-game-built {
            min-height: 64px;
            margin-bottom: 15px;
            padding: 13px;
            border: 2px dashed #d8dbe1;
            border-radius: 15px;
            background: #fafafa;
        }

        .ldc-game-built-word {
            display: inline-flex;
            margin: 4px;
            padding: 8px 11px;
            border-radius: 9px;
            background: #101010;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
        }

        .ldc-game-reset {
            min-height: 43px;
            padding: 0 16px;
            border: 1px solid #ddd;
            border-radius: 12px;
            background: #fff;
            font-weight: 800;
            cursor: pointer;
        }

        .ldc-game-listen-box {
            margin-bottom: 20px;
            padding: 18px;
            border-radius: 17px;
            background: #101010;
            color: #fff;
            text-align: center;
        }

        .ldc-game-listen-text {
            margin-bottom: 14px;
            font-size: 16px;
            font-weight: 700;
            line-height: 1.5;
        }

        .ldc-game-speak {
            min-height: 44px;
            padding: 0 17px;
            border: 0;
            border-radius: 999px;
            background: #ffce00;
            color: #101010;
            font-size: 12px;
            font-weight: 900;
            cursor: pointer;
        }

        .ldc-game-result {
            text-align: center;
        }

        .ldc-game-result-icon {
            font-size: 58px;
            margin-bottom: 8px;
        }

        .ldc-game-result h3 {
            margin: 0 0 8px;
            font-family: "Space Grotesk", sans-serif;
            font-size: 30px;
        }

        .ldc-game-result-score {
            margin: 10px 0;
            font-family: "Space Grotesk", sans-serif;
            font-size: 48px;
            font-weight: 900;
        }

        .ldc-game-result-xp {
            display: inline-flex;
            padding: 9px 15px;
            border-radius: 999px;
            background: #fff8dc;
            color: #8a6a00;
            font-size: 13px;
            font-weight: 900;
        }

        .ldc-game-result-message {
            margin: 18px 0;
            color: #666;
            font-size: 14px;
        }

        .ldc-game-play-again,
        .ldc-game-finish {
            width: 100%;
            min-height: 50px;
            margin-top: 9px;
            border: 0;
            border-radius: 14px;
            background: #101010;
            color: #fff;
            font-weight: 900;
            cursor: pointer;
        }

        .ldc-game-finish {
            background: #d4a900;
            color: #101010;
        }

        @media (max-width: 600px) {

            .ldc-game-overlay {
                padding: 10px;
                align-items: flex-end;
            }

            .ldc-game-modal {
                max-height: calc(100vh - 20px);
                border-radius: 23px 23px 0 0;
            }

            .ldc-game-modal-top {
                padding: 20px;
            }

            .ldc-game-stage {
                padding: 20px;
            }

            .ldc-game-options {
                grid-template-columns: 1fr;
            }

        }

    `;

    document.head.appendChild(
        style
    );

}


/* =========================================================
   SHOW / HIDE MODAL
========================================================= */

function showGameModal() {

    const modal =
        createGameModal();

    modal.style.display =
        "block";

    document.body.style.overflow =
        "hidden";

}


function closeGame() {

    if (currentTimer) {

        clearInterval(
            currentTimer
        );

        currentTimer = null;

    }

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();

    }

    const modal =
        document.getElementById(
            "gameModal"
        );

    if (modal) {

        modal.style.display =
            "none";

    }

    document.body.style.overflow =
        "";

    currentGame = null;

}


/* =========================================================
   GAME HEADER
========================================================= */

function setGameHeader(
    gameId
) {

    const game =
        GAMES[gameId];

    if (!game) return;

    const title =
        $("#gameModalTitle");

    const description =
        $("#gameModalDescription");

    if (title) {

        title.textContent =
            game.title;

    }

    if (description) {

        description.textContent =
            game.description;

    }

}


/* =========================================================
   OPEN GAME
========================================================= */

async function openGame(
    gameId
) {

    if (!GAMES[gameId]) {

        console.warn(
            "Unknown game:",
            gameId
        );

        return;

    }

    if (currentTimer) {

        clearInterval(
            currentTimer
        );

        currentTimer = null;

    }

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();

    }

    currentGame =
        gameId;

    currentQuestionIndex =
        0;

    currentScore =
        0;

    gameFinished =
        false;

    sentenceSelectedWords =
        [];

    showGameModal();

    setGameHeader(
        gameId
    );

    showGameLoading();


    /*
     * IMPORTANT:
     *
     * Every time a game is opened, we first try
     * to load the questions created by the Games Manager.
     *
     * If that fails, the original questions are used.
     */

    currentQuestions =
        await getQuestionsForGame(
            gameId
        );


    /*
     * Make sure the game was not closed
     * while the request was running.
     */

    if (
        currentGame !== gameId
    ) {

        return;

    }


    if (
        !Array.isArray(
            currentQuestions
        ) ||
        currentQuestions.length === 0
    ) {

        const stage =
            $("#gameStage");

        if (stage) {

            stage.innerHTML = `

                <div
                    style="
                        padding:35px 10px;
                        text-align:center;
                    "
                >

                    <div
                        style="
                            font-size:48px;
                            margin-bottom:15px;
                        "
                    >
                        📚
                    </div>

                    <h3
                        style="
                            margin:0 0 10px;
                            color:#111;
                        "
                    >
                        No questions available
                    </h3>

                    <p
                        style="
                            margin:0;
                            color:#777;
                            font-size:14px;
                        "
                    >
                        This game does not have any questions yet.
                    </p>

                </div>

            `;

        }

        return;

    }


    /*
     * Start the correct game.
     */

    switch (gameId) {

        case "word-match":

            startWordMatch();

            break;

        case "article-challenge":

            startArticleChallenge();

            break;

        case "verb-race":

            startVerbRace();

            break;

        case "sentence-builder":

            startSentenceBuilder();

            break;

        case "listening-quiz":

            startListeningQuiz();

            break;

        case "deutsch-meister":

            startDeutschMeister();

            break;

    }

}


/* =========================================================
   GENERIC GAME HELPERS
========================================================= */

function prepareQuestions(
    questions,
    amount
) {

    const safeQuestions =
        Array.isArray(
            questions
        )
            ? questions
            : [];

    return shuffle(
        safeQuestions
    ).slice(
        0,
        Math.min(
            amount,
            safeQuestions.length
        )
    );

}


function renderProgress(
    total,
    current
) {

    if (!total) {

        return "";

    }

    const percentage =
        Math.round(
            (current / total) * 100
        );

    return `

        <div class="ldc-game-progress">

            <div
                class="ldc-game-progress-fill"
                style="width:${percentage}%"
            ></div>

        </div>

    `;

}


function renderQuestionNumber(
    current,
    total
) {

    return `

        <div class="ldc-game-question-number">

            Question ${current} of ${total}

        </div>

    `;

}


/* =========================================================
   WORD MATCH
========================================================= */

function startWordMatch() {

    currentQuestions =
        prepareQuestions(
            currentQuestions,
            5
        );

    currentQuestionIndex =
        0;

    currentScore =
        0;

    renderWordMatchQuestion();

}


function renderWordMatchQuestion() {

    const stage =
        $("#gameStage");

    if (!stage) return;

    const question =
        currentQuestions[
            currentQuestionIndex
        ];

    if (!question) {

        finishGame();

        return;

    }

    stage.innerHTML = `

        ${renderProgress(
            currentQuestions.length,
            currentQuestionIndex
        )}

        ${renderQuestionNumber(
            currentQuestionIndex + 1,
            currentQuestions.length
        )}

        <h3 class="ldc-game-question">
            ${escapeHTML(
                question.question
            )}
        </h3>

        <div class="ldc-game-options">

            ${shuffle(
                question.options || []
            )
                .map(
                    option => `

                        <button
                            type="button"
                            class="ldc-game-option"
                            data-answer="${escapeHTML(
                                option
                            )}"
                        >
                            ${escapeHTML(
                                option
                            )}
                        </button>

                    `
                )
                .join("")}

        </div>

        <div
            class="ldc-game-feedback"
            id="gameFeedback"
        >
            Choose the correct answer.
        </div>

    `;

    stage
        .querySelectorAll(
            ".ldc-game-option"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        answerMultipleChoice(
                            button,
                            question.answer,
                            renderWordMatchNext
                        );

                    }
                );

            }
        );

}


function renderWordMatchNext() {

    currentQuestionIndex++;

    if (
        currentQuestionIndex >=
        currentQuestions.length
    ) {

        finishGame();

        return;

    }

    renderWordMatchQuestion();

}


/* =========================================================
   ARTICLE CHALLENGE
========================================================= */

function startArticleChallenge() {

    currentQuestions =
        prepareQuestions(
            currentQuestions,
            5
        );

    currentQuestionIndex =
        0;

    currentScore =
        0;

    renderArticleQuestion();

}


function renderArticleQuestion() {

    const stage =
        $("#gameStage");

    if (!stage) return;

    const question =
        currentQuestions[
            currentQuestionIndex
        ];

    if (!question) {

        finishGame();

        return;

    }

    stage.innerHTML = `

        ${renderProgress(
            currentQuestions.length,
            currentQuestionIndex
        )}

        ${renderQuestionNumber(
            currentQuestionIndex + 1,
            currentQuestions.length
        )}

        <h3 class="ldc-game-question">
            ${escapeHTML(
                question.question
            )}
        </h3>

        <div class="ldc-game-options">

            ${(
                question.options || []
            )
                .map(
                    option => `

                        <button
                            type="button"
                            class="ldc-game-option"
                            data-answer="${escapeHTML(
                                option
                            )}"
                        >
                            ${escapeHTML(
                                option
                            )}
                        </button>

                    `
                )
                .join("")}

        </div>

        <div
            class="ldc-game-feedback"
            id="gameFeedback"
        >
            Choose der, die or das.
        </div>

    `;

    stage
        .querySelectorAll(
            ".ldc-game-option"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        answerMultipleChoice(
                            button,
                            question.answer,
                            renderArticleNext
                        );

                    }
                );

            }
        );

}


function renderArticleNext() {

    currentQuestionIndex++;

    if (
        currentQuestionIndex >=
        currentQuestions.length
    ) {

        finishGame();

        return;

    }

    renderArticleQuestion();

}


/* =========================================================
   GENERIC MULTIPLE CHOICE ANSWER
========================================================= */

function answerMultipleChoice(
    clickedButton,
    correctAnswer,
    nextFunction
) {

    const stage =
        $("#gameStage");

    if (!stage) return;

    const buttons =
        stage.querySelectorAll(
            ".ldc-game-option"
        );

    buttons.forEach(
        button => {

            button.disabled =
                true;

            if (
                button.dataset.answer ===
                String(
                    correctAnswer
                )
            ) {

                button.classList.add(
                    "correct"
                );

            }

        }
    );

    const feedback =
        $("#gameFeedback");

    if (
        clickedButton.dataset.answer ===
        String(
            correctAnswer
        )
    ) {

        currentScore++;

        clickedButton.classList.add(
            "correct"
        );

        if (feedback) {

            feedback.className =
                "ldc-game-feedback success";

            feedback.innerHTML =
                "✓ Correct! Great job!";

        }

    } else {

        clickedButton.classList.add(
            "wrong"
        );

        if (feedback) {

            feedback.className =
                "ldc-game-feedback error";

            feedback.innerHTML =
                `✗ Not quite. The correct answer is <strong>${escapeHTML(
                    correctAnswer
                )}</strong>.`;

        }

    }

    const nextButton =
        document.createElement(
            "button"
        );

    nextButton.type =
        "button";

    nextButton.className =
        "ldc-game-next";

    nextButton.textContent =
        "Next →";

    nextButton.addEventListener(
        "click",
        nextFunction
    );

    stage.appendChild(
        nextButton
    );

}


/* =========================================================
   VERB RACE
========================================================= */

function startVerbRace() {

    currentQuestions =
        prepareQuestions(
            currentQuestions,
            5
        );

    currentQuestionIndex =
        0;

    currentScore =
        0;

    currentTimeLeft =
        10;

    renderVerbQuestion();

}


function renderVerbQuestion() {

    const stage =
        $("#gameStage");

    if (!stage) return;

    const question =
        currentQuestions[
            currentQuestionIndex
        ];

    if (!question) {

        finishGame();

        return;

    }

    currentTimeLeft =
        10;

    stage.innerHTML = `

        ${renderProgress(
            currentQuestions.length,
            currentQuestionIndex
        )}

        <div
            class="ldc-game-timer"
            id="gameTimer"
        >
            ⏱ 10 seconds
        </div>

        ${renderQuestionNumber(
            currentQuestionIndex + 1,
            currentQuestions.length
        )}

        <h3 class="ldc-game-question">
            ${escapeHTML(
                question.question
            )}
        </h3>

        <div class="ldc-game-options">

            ${shuffle(
                question.options || []
            )
                .map(
                    option => `

                        <button
                            type="button"
                            class="ldc-game-option"
                            data-answer="${escapeHTML(
                                option
                            )}"
                        >
                            ${escapeHTML(
                                option
                            )}
                        </button>

                    `
                )
                .join("")}

        </div>

        <div
            class="ldc-game-feedback"
            id="gameFeedback"
        >
            Race against the clock!
        </div>

    `;

    stage
        .querySelectorAll(
            ".ldc-game-option"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        stopTimer();

                        answerMultipleChoice(
                            button,
                            question.answer,
                            renderVerbNext
                        );

                    }
                );

            }
        );

    currentTimer =
        setInterval(
            () => {

                currentTimeLeft--;

                const timer =
                    $("#gameTimer");

                if (timer) {

                    timer.textContent =
                        `⏱ ${currentTimeLeft} seconds`;

                }

                if (
                    currentTimeLeft <= 0
                ) {

                    stopTimer();

                    disableCurrentQuestion(
                        question.answer,
                        renderVerbNext
                    );

                }

            },
            1000
        );

}


function stopTimer() {

    if (currentTimer) {

        clearInterval(
            currentTimer
        );

        currentTimer = null;

    }

}


function disableCurrentQuestion(
    correctAnswer,
    nextFunction
) {

    const stage =
        $("#gameStage");

    if (!stage) return;

    const buttons =
        stage.querySelectorAll(
            ".ldc-game-option"
        );

    buttons.forEach(
        button => {

            button.disabled =
                true;

            if (
                button.dataset.answer ===
                String(
                    correctAnswer
                )
            ) {

                button.classList.add(
                    "correct"
                );

            }

        }
    );

    const feedback =
        $("#gameFeedback");

    if (feedback) {

        feedback.className =
            "ldc-game-feedback error";

        feedback.innerHTML =
            `⏰ Time's up! The correct answer is <strong>${escapeHTML(
                correctAnswer
            )}</strong>.`;

    }

    const nextButton =
        document.createElement(
            "button"
        );

    nextButton.type =
        "button";

    nextButton.className =
        "ldc-game-next";

    nextButton.textContent =
        "Next →";

    nextButton.addEventListener(
        "click",
        nextFunction
    );

    stage.appendChild(
        nextButton
    );

}


function renderVerbNext() {

    stopTimer();

    currentQuestionIndex++;

    if (
        currentQuestionIndex >=
        currentQuestions.length
    ) {

        finishGame();

        return;

    }

    renderVerbQuestion();

}


/* =========================================================
   SENTENCE BUILDER
========================================================= */

function startSentenceBuilder() {

    currentQuestions =
        prepareQuestions(
            currentQuestions,
            5
        );

    currentQuestionIndex =
        0;

    currentScore =
        0;

    sentenceSelectedWords =
        [];

    renderSentenceQuestion();

}


function renderSentenceQuestion() {

    const stage =
        $("#gameStage");

    if (!stage) return;

    const question =
        currentQuestions[
            currentQuestionIndex
        ];

    if (!question) {

        finishGame();

        return;

    }

    sentenceSelectedWords =
        [];

    const sourceWords =
        Array.isArray(
            question.words
        )
            ? question.words
            : (
                Array.isArray(
                    question.options
                )
                    ? question.options
                    : []
            );

    const words =
        shuffle(
            sourceWords
        );

    stage.innerHTML = `

        ${renderProgress(
            currentQuestions.length,
            currentQuestionIndex
        )}

        ${renderQuestionNumber(
            currentQuestionIndex + 1,
            currentQuestions.length
        )}

        <h3 class="ldc-game-question">
            Build the correct sentence:
        </h3>

        <div
            class="ldc-game-built"
            id="sentenceBuilt"
        >
            Click the words below.
        </div>

        <div
            class="ldc-game-word-bank"
            id="sentenceWordBank"
        >

            ${words
                .map(
                    (word, index) => `

                        <button
                            type="button"
                            class="ldc-game-word"
                            data-word-index="${index}"
                            data-word="${escapeHTML(
                                word
                            )}"
                        >
                            ${escapeHTML(
                                word
                            )}
                        </button>

                    `
                )
                .join("")}

        </div>

        <button
            type="button"
            class="ldc-game-reset"
            id="sentenceReset"
        >
            Reset
        </button>

        <div
            class="ldc-game-feedback"
            id="gameFeedback"
        >
            Build the sentence, then check it.
        </div>

        <button
            type="button"
            class="ldc-game-next"
            id="sentenceCheck"
        >
            Check Sentence ✓
        </button>

    `;

    const wordButtons =
        stage.querySelectorAll(
            ".ldc-game-word"
        );

    wordButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        button.disabled
                    ) return;

                    button.disabled =
                        true;

                    sentenceSelectedWords.push(
                        button.dataset.word
                    );

                    renderBuiltSentence();

                }
            );

        }
    );

    const resetButton =
        $("#sentenceReset");

    if (resetButton) {

        resetButton.addEventListener(
            "click",
            () => {

                renderSentenceQuestion();

            }
        );

    }

    const checkButton =
        $("#sentenceCheck");

    if (checkButton) {

        checkButton.addEventListener(
            "click",
            checkSentence
        );

    }

}


function renderBuiltSentence() {

    const built =
        $("#sentenceBuilt");

    if (!built) return;

    if (
        sentenceSelectedWords.length === 0
    ) {

        built.textContent =
            "Click the words below.";

        return;

    }

    built.innerHTML =
        sentenceSelectedWords
            .map(
                word =>
                    `<span class="ldc-game-built-word">${escapeHTML(
                        word
                    )}</span>`
            )
            .join("");

}


/* =========================================================
   SENTENCE NORMALIZATION
========================================================= */

function normalizeSentence(
    sentence
) {

    return String(
        sentence ?? ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /[.!?,;:]+$/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        );

}


/* =========================================================
   CHECK SENTENCE
========================================================= */

function checkSentence() {

    const question =
        currentQuestions[
            currentQuestionIndex
        ];

    if (!question) {

        return;

    }

    const builtSentence =
        sentenceSelectedWords.join(
            " "
        );

    const userAnswer =
        normalizeSentence(
            builtSentence
        );

    const correctAnswer =
        normalizeSentence(
            question.answer
        );

    const correct =
        userAnswer ===
        correctAnswer;

    const feedback =
        $("#gameFeedback");

    const checkButton =
        $("#sentenceCheck");

    if (checkButton) {

        checkButton.disabled =
            true;

    }

    if (correct) {

        currentScore++;

        if (feedback) {

            feedback.className =
                "ldc-game-feedback success";

            feedback.innerHTML =
                "✓ Perfect! The sentence is correct.";

        }

    } else {

        if (feedback) {

            feedback.className =
                "ldc-game-feedback error";

            feedback.innerHTML =
                `✗ Correct sentence: <strong>${escapeHTML(
                    question.answer
                )}</strong>`;

        }

    }

    const nextButton =
        document.createElement(
            "button"
        );

    nextButton.type =
        "button";

    nextButton.className =
        "ldc-game-next";

    nextButton.textContent =
        "Next →";

    nextButton.addEventListener(
        "click",
        renderSentenceNext
    );

    const stage =
        $("#gameStage");

    if (stage) {

        stage.appendChild(
            nextButton
        );

    }

}


function renderSentenceNext() {

    currentQuestionIndex++;

    if (
        currentQuestionIndex >=
        currentQuestions.length
    ) {

        finishGame();

        return;

    }

    renderSentenceQuestion();

}


/* =========================================================
   LISTENING QUIZ
========================================================= */

function startListeningQuiz() {

    currentQuestions =
        prepareQuestions(
            currentQuestions,
            5
        );

    currentQuestionIndex =
        0;

    currentScore =
        0;

    renderListeningQuestion();

}


function speakGerman(
    text
) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;

    }

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(
            text
        );

    speech.lang =
        "de-DE";

    speech.rate =
        0.82;

    speech.pitch =
        1;

    window.speechSynthesis.speak(
        speech
    );

}


function renderListeningQuestion() {

    const stage =
        $("#gameStage");

    if (!stage) return;

    const question =
        currentQuestions[
            currentQuestionIndex
        ];

    if (!question) {

        finishGame();

        return;

    }

    const speechText =
        question.text ||
        question.audio_text ||
        question.question ||
        "";

    stage.innerHTML = `

        ${renderProgress(
            currentQuestions.length,
            currentQuestionIndex
        )}

        ${renderQuestionNumber(
            currentQuestionIndex + 1,
            currentQuestions.length
        )}

        <div class="ldc-game-listen-box">

            <div class="ldc-game-listen-text">
                🎧 Listen to the German sentence
            </div>

            <button
                type="button"
                class="ldc-game-speak"
                id="speakGermanButton"
            >
                🔊 Play Audio
            </button>

        </div>

        <h3 class="ldc-game-question">
            ${escapeHTML(
                question.question
            )}
        </h3>

        <div class="ldc-game-options">

            ${shuffle(
                question.options || []
            )
                .map(
                    option => `

                        <button
                            type="button"
                            class="ldc-game-option"
                            data-answer="${escapeHTML(
                                option
                            )}"
                        >
                            ${escapeHTML(
                                option
                            )}
                        </button>

                    `
                )
                .join("")}

        </div>

        <div
            class="ldc-game-feedback"
            id="gameFeedback"
        >
            Listen carefully and choose the answer.
        </div>

    `;

    const speakButton =
        $("#speakGermanButton");

    if (speakButton) {

        speakButton.addEventListener(
            "click",
            () => {

                speakGerman(
                    speechText
                );

            }
        );

    }

    stage
        .querySelectorAll(
            ".ldc-game-option"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        answerMultipleChoice(
                            button,
                            question.answer,
                            renderListeningNext
                        );

                    }
                );

            }
        );

    setTimeout(
        () => {

            if (
                currentGame ===
                "listening-quiz"
            ) {

                speakGerman(
                    speechText
                );

            }

        },
        350
    );

}


function renderListeningNext() {

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();

    }

    currentQuestionIndex++;

    if (
        currentQuestionIndex >=
        currentQuestions.length
    ) {

        finishGame();

        return;

    }

    renderListeningQuestion();

}


/* =========================================================
   DEUTSCH-MEISTER
========================================================= */

function startDeutschMeister() {

    currentQuestions =
        prepareQuestions(
            currentQuestions,
            8
        );

    currentQuestionIndex =
        0;

    currentScore =
        0;

    currentTimeLeft =
        12;

    renderDeutschMeisterQuestion();

}


function renderDeutschMeisterQuestion() {

    const stage =
        $("#gameStage");

    if (!stage) return;

    const question =
        currentQuestions[
            currentQuestionIndex
        ];

    if (!question) {

        finishGame();

        return;

    }

    currentTimeLeft =
        12;

    stage.innerHTML = `

        ${renderProgress(
            currentQuestions.length,
            currentQuestionIndex
        )}

        <div
            class="ldc-game-timer"
            id="gameTimer"
        >
            ⚡ 12 seconds
        </div>

        ${renderQuestionNumber(
            currentQuestionIndex + 1,
            currentQuestions.length
        )}

        <h3 class="ldc-game-question">
            ${escapeHTML(
                question.question
            )}
        </h3>

        <div class="ldc-game-options">

            ${shuffle(
                question.options || []
            )
                .map(
                    option => `

                        <button
                            type="button"
                            class="ldc-game-option"
                            data-answer="${escapeHTML(
                                option
                            )}"
                        >
                            ${escapeHTML(
                                option
                            )}
                        </button>

                    `
                )
                .join("")}

        </div>

        <div
            class="ldc-game-feedback"
            id="gameFeedback"
        >
            The clock is running!
        </div>

    `;

    stage
        .querySelectorAll(
            ".ldc-game-option"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        stopTimer();

                        answerMultipleChoice(
                            button,
                            question.answer,
                            renderDeutschMeisterNext
                        );

                    }
                );

            }
        );

    currentTimer =
        setInterval(
            () => {

                currentTimeLeft--;

                const timer =
                    $("#gameTimer");

                if (timer) {

                    timer.textContent =
                        `⚡ ${currentTimeLeft} seconds`;

                }

                if (
                    currentTimeLeft <= 0
                ) {

                    stopTimer();

                    disableCurrentQuestion(
                        question.answer,
                        renderDeutschMeisterNext
                    );

                }

            },
            1000
        );

}


function renderDeutschMeisterNext() {

    stopTimer();

    currentQuestionIndex++;

    if (
        currentQuestionIndex >=
        currentQuestions.length
    ) {

        finishGame();

        return;

    }

    renderDeutschMeisterQuestion();

}


/* =========================================================
   FINISH GAME
========================================================= */

function finishGame() {

    stopTimer();

    if (
        "speechSynthesis" in window
    ) {

        window.speechSynthesis.cancel();

    }

    if (gameFinished) {

        return;

    }

    gameFinished =
        true;

    const game =
        GAMES[currentGame];

    if (!game) {

        return;

    }

    const total =
        currentQuestions.length;

    if (!total) {

        return;

    }

    const percentage =
        Math.round(
            (
                currentScore /
                total
            ) * 100
        );

    const earnedXP =
        Math.round(
            game.xp *
            (
                currentScore /
                total
            )
        );

    const stats =
        getGameStats();

    stats.xp +=
        earnedXP;

    stats.gamesPlayed +=
        1;

    if (
        percentage >
        stats.bestScore
    ) {

        stats.bestScore =
            percentage;

    }

    stats.history.unshift({

        game:
            currentGame,

        score:
            currentScore,

        total:
            total,

        percentage:
            percentage,

        xp:
            earnedXP,

        date:
            new Date().toISOString()

    });

    stats.history =
        stats.history.slice(
            0,
            30
        );

    saveGameStats(
        stats
    );

    updateGameStatistics();

    updateDailyChallenge();

    renderGameResult(
        percentage,
        earnedXP
    );

}


/* =========================================================
   RESULT SCREEN
========================================================= */

function renderGameResult(
    percentage,
    earnedXP
) {

    const stage =
        $("#gameStage");

    if (!stage) return;

    let icon =
        "🎯";

    let message =
        "Keep practicing!";

    if (
        percentage >= 90
    ) {

        icon =
            "🏆";

        message =
            "Outstanding! You really know your German!";

    } else if (
        percentage >= 70
    ) {

        icon =
            "🔥";

        message =
            "Great work! Your German is getting stronger!";

    } else if (
        percentage >= 50
    ) {

        icon =
            "💪";

        message =
            "Good effort! Keep practicing and you'll improve.";

    } else {

        icon =
            "📚";

        message =
            "Keep learning! Every mistake is another chance to improve.";

    }

    stage.innerHTML = `

        <div class="ldc-game-result">

            <div class="ldc-game-result-icon">
                ${icon}
            </div>

            <h3>
                Game Complete!
            </h3>

            <div class="ldc-game-result-score">
                ${percentage}%
            </div>

            <div class="ldc-game-result-xp">
                +${earnedXP} XP
            </div>

            <p class="ldc-game-result-message">
                ${message}
            </p>

            <button
                type="button"
                class="ldc-game-play-again"
                id="gamePlayAgain"
            >
                🔄 Play Again
            </button>

            <button
                type="button"
                class="ldc-game-finish"
                id="gameFinishButton"
            >
                ✓ Back to Games
            </button>

        </div>

    `;

    const playAgain =
        $("#gamePlayAgain");

    if (playAgain) {

        playAgain.addEventListener(
            "click",
            () => {

                openGame(
                    currentGame
                );

            }
        );

    }

    const finishButton =
        $("#gameFinishButton");

    if (finishButton) {

        finishButton.addEventListener(
            "click",
            closeGame
        );

    }

}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function getDailyChallenge() {

    const today =
        getTodayKey();

    try {

        const raw =
            localStorage.getItem(
                DAILY_GAME_KEY
            );

        if (!raw) {

            return {
                date: today,
                completed: false
            };

        }

        const data =
            JSON.parse(
                raw
            );

        if (
            data.date !==
            today
        ) {

            return {
                date: today,
                completed: false
            };

        }

        return data;

    } catch {

        return {
            date: today,
            completed: false
        };

    }

}


function updateDailyChallenge() {

    const daily =
        getDailyChallenge();

    const stats =
        getGameStats();

    const completedToday =
        stats.history.some(
            game => {

                if (
                    !game.date
                ) {

                    return false;

                }

                const gameDate =
                    new Date(
                        game.date
                    );

                const today =
                    new Date();

                return (
                    gameDate.getFullYear() ===
                    today.getFullYear() &&

                    gameDate.getMonth() ===
                    today.getMonth() &&

                    gameDate.getDate() ===
                    today.getDate()
                );

            }
        );

    if (
        completedToday
    ) {

        daily.completed =
            true;

    }

    daily.date =
        getTodayKey();

    try {

        localStorage.setItem(
            DAILY_GAME_KEY,
            JSON.stringify(
                daily
            )
        );

    } catch {}

    const text =
        $("#dailyProgressText");

    const bar =
        $("#dailyProgressBar");

    if (
        daily.completed
    ) {

        if (text) {

            text.textContent =
                "1 / 1";

        }

        if (bar) {

            bar.style.width =
                "100%";

        }

    } else {

        if (text) {

            text.textContent =
                "0 / 1";

        }

        if (bar) {

            bar.style.width =
                "0%";

        }

    }

}


/* =========================================================
   AUTH
========================================================= */

function getToken() {

    try {

        return localStorage.getItem(
            TOKEN_KEY
        );

    } catch {

        return null;

    }

}


/* =========================================================
   API FETCH
========================================================= */

async function apiFetch(
    endpoint,
    options = {}
) {

    const token =
        getToken();

    const headers = {
        ...(options.headers || {})
    };

    if (
        !headers["Content-Type"] &&
        !(options.body instanceof FormData)
    ) {

        headers["Content-Type"] =
            "application/json";

    }

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );

    let data = null;

    try {

        data =
            await response.json();

    } catch {

        data = null;

    }

    if (
        !response.ok
    ) {

        throw new Error(
            data?.message ||
            `Request failed with status ${response.status}`
        );

    }

    return data;

}


/* =========================================================
   STUDENT PROFILE
========================================================= */

async function loadStudentProfile() {

    try {

        const data =
            await apiFetch(
                "/student/profile"
            );

        if (
            data?.student
        ) {

            try {

                localStorage.setItem(
                    STUDENT_KEY,
                    JSON.stringify(
                        data.student
                    )
                );

            } catch {}

        }

    } catch (error) {

        console.warn(
            "Student profile could not be loaded. Games will continue normally."
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    try {

        localStorage.removeItem(
            TOKEN_KEY
        );

        localStorage.removeItem(
            STUDENT_KEY
        );

    } catch {}

    window.location.href =
        "../index.html";

}


/* =========================================================
   IMPORTANT CLICK HANDLER
========================================================= */

function initializeGameClicks() {

    document.addEventListener(
        "click",
        function (event) {

            const playButton =
                event.target.closest(
                    "[data-game]"
                );

            if (!playButton) {

                return;

            }

            const gameId =
                playButton.dataset.game;

            if (
                !GAMES[gameId]
            ) {

                return;

            }

            event.preventDefault();

            event.stopPropagation();

            openGame(
                gameId
            );

        },
        true
    );

}


/* =========================================================
   LOGOUT BUTTON
========================================================= */

function initializeLogout() {

    const logoutButton =
        $("#logoutBtn");

    if (!logoutButton) {

        return;

    }

    logoutButton.addEventListener(
        "click",
        function () {

            const confirmed =
                window.confirm(
                    "Are you sure you want to log out?"
                );

            if (
                confirmed
            ) {

                logout();

            }

        }
    );

}


/* =========================================================
   KEYBOARD CONTROLS
========================================================= */

function initializeKeyboard() {

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                const modal =
                    document.getElementById(
                        "gameModal"
                    );

                if (
                    modal &&
                    modal.style.display !==
                    "none"
                ) {

                    closeGame();

                }

            }

        }
    );

}


/* =========================================================
   INITIALIZATION
========================================================= */

async function initializeGamesPage() {

    console.log(
        "LDC Games page initializing..."
    );

    updateGameStatistics();

    updateDailyChallenge();

    initializeGameClicks();

    initializeLogout();

    initializeKeyboard();

    /*
     * Load student profile.
     */

    loadStudentProfile();


    /*
     * Load games created/managed from
     * the Games Manager.
     *
     * This does NOT break the page if
     * the request fails.
     */

    await loadStudentGames();


    /*
     * We DO NOT call /student/dashboard.
     * That route was causing the previous 404.
     */

    console.log(
        "LDC Games page initialized successfully."
    );

    console.log(
        "Database games available:",
        studentGames
    );

}


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeGamesPage
    );

} else {

    initializeGamesPage();

}
/* =========================================================
   LINGUA DEUTSCH CONNECT
   GRAMMAR PAGE
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL = "http://localhost:5000/api";

const STUDENT_TOKEN_KEY = "ldc_student_token";
const STUDENT_DATA_KEY = "ldc_student";

const GRAMMAR_STATS_KEY = "ldc_grammar_stats";


/* =========================================================
   GRAMMAR DATA
========================================================= */

const grammarTopics = [

    /* =====================================================
       A1
    ====================================================== */

    {
        id: "a1-articles",
        level: "A1",
        title: "Artikel: der, die, das",
        category: "Basics",
        description: "Learn the three German definite articles and how to recognize them.",
        rule: "Every German noun has a grammatical gender. The definite articles are der for masculine, die for feminine, and das for neuter.",
        examples: [
            "der Mann",
            "die Frau",
            "das Kind",
            "der Tisch",
            "die Schule",
            "das Buch"
        ],
        question: "___ Frau kommt aus Deutschland.",
        answers: [
            {
                text: "Der",
                correct: false
            },
            {
                text: "Die",
                correct: true
            },
            {
                text: "Das",
                correct: false
            }
        ]
    },


    {
        id: "a1-nominativ",
        level: "A1",
        title: "Nominativ",
        category: "Cases",
        description: "Learn how to identify the subject of a German sentence.",
        rule: "The Nominativ is used for the subject of the sentence. Ask: Wer? or Was?",
        examples: [
            "Der Mann arbeitet.",
            "Die Frau lernt Deutsch.",
            "Das Kind spielt.",
            "Ich bin Student."
        ],
        question: "___ Mann arbeitet heute.",
        answers: [
            {
                text: "Der",
                correct: true
            },
            {
                text: "Den",
                correct: false
            },
            {
                text: "Dem",
                correct: false
            }
        ]
    },


    {
        id: "a1-verb-position",
        level: "A1",
        title: "Verb Position",
        category: "Sentence Structure",
        description: "Learn where the conjugated verb goes in a normal German sentence.",
        rule: "In a normal German main clause, the conjugated verb is in position 2.",
        examples: [
            "Ich lerne Deutsch.",
            "Heute lerne ich Deutsch.",
            "Am Montag arbeite ich.",
            "Mein Bruder wohnt in Frankfurt."
        ],
        question: "Heute ___ ich Deutsch.",
        answers: [
            {
                text: "lerne",
                correct: true
            },
            {
                text: "Deutsch",
                correct: false
            },
            {
                text: "ich",
                correct: false
            }
        ]
    },


    {
        id: "a1-present-tense",
        level: "A1",
        title: "Präsens",
        category: "Verbs",
        description: "Learn how regular verbs are conjugated in the present tense.",
        rule: "German verbs change their endings depending on the subject. For example: ich lerne, du lernst, er lernt.",
        examples: [
            "Ich lerne Deutsch.",
            "Du lernst schnell.",
            "Er arbeitet heute.",
            "Wir wohnen in Kigali."
        ],
        question: "Ich ___ Deutsch.",
        answers: [
            {
                text: "lerne",
                correct: true
            },
            {
                text: "lernst",
                correct: false
            },
            {
                text: "lernt",
                correct: false
            }
        ]
    },


    {
        id: "a1-negation",
        level: "A1",
        title: "Negation: nicht und kein",
        category: "Basics",
        description: "Learn how to make German sentences negative.",
        rule: "Use kein to negate nouns with an indefinite article or no article. Use nicht to negate verbs, adjectives, adverbs or specific information.",
        examples: [
            "Ich habe kein Auto.",
            "Das ist kein Problem.",
            "Ich komme nicht heute.",
            "Das ist nicht teuer."
        ],
        question: "Ich habe ___ Auto.",
        answers: [
            {
                text: "nicht",
                correct: false
            },
            {
                text: "kein",
                correct: true
            },
            {
                text: "keine",
                correct: false
            }
        ]
    },


    {
        id: "a1-modal-verbs",
        level: "A1",
        title: "Modalverben",
        category: "Verbs",
        description: "Learn the basic German modal verbs such as können, müssen and wollen.",
        rule: "The conjugated modal verb comes in position 2, while the main verb goes to the end in the infinitive.",
        examples: [
            "Ich kann Deutsch sprechen.",
            "Du musst heute arbeiten.",
            "Wir wollen nach Deutschland reisen.",
            "Er möchte Kaffee trinken."
        ],
        question: "Ich kann Deutsch ___.",
        answers: [
            {
                text: "spreche",
                correct: false
            },
            {
                text: "sprechen",
                correct: true
            },
            {
                text: "gesprochen",
                correct: false
            }
        ]
    },


    /* =====================================================
       A2
    ====================================================== */

    {
        id: "a2-dativ",
        level: "A2",
        title: "Dativ",
        category: "Cases",
        description: "Learn when and how to use the German Dativ case.",
        rule: "The Dativ often marks the indirect object. Ask: Wem? The articles change to dem, der, dem and den.",
        examples: [
            "Ich helfe dem Mann.",
            "Ich gebe der Frau ein Buch.",
            "Wir helfen den Kindern.",
            "Das gehört mir."
        ],
        question: "Ich helfe ___ Mann.",
        answers: [
            {
                text: "der",
                correct: false
            },
            {
                text: "den",
                correct: false
            },
            {
                text: "dem",
                correct: true
            }
        ]
    },


    {
        id: "a2-akkusativ",
        level: "A2",
        title: "Akkusativ",
        category: "Cases",
        description: "Learn the German accusative case and its articles.",
        rule: "The Akkusativ is commonly used for the direct object. The masculine article changes from der to den and ein to einen.",
        examples: [
            "Ich sehe den Mann.",
            "Ich kaufe einen Computer.",
            "Sie liest das Buch.",
            "Wir besuchen die Schule."
        ],
        question: "Ich kaufe ___ Computer.",
        answers: [
            {
                text: "ein",
                correct: false
            },
            {
                text: "einen",
                correct: true
            },
            {
                text: "einem",
                correct: false
            }
        ]
    },


    {
        id: "a2-reflexive-verbs",
        level: "A2",
        title: "Reflexive Verben",
        category: "Verbs",
        description: "Learn how to use reflexive verbs such as sich freuen and sich erinnern.",
        rule: "Reflexive verbs use a reflexive pronoun that refers back to the subject.",
        examples: [
            "Ich freue mich.",
            "Du erinnerst dich.",
            "Er wäscht sich.",
            "Wir treffen uns."
        ],
        question: "Ich freue ___.",
        answers: [
            {
                text: "mich",
                correct: true
            },
            {
                text: "mir",
                correct: false
            },
            {
                text: "dich",
                correct: false
            }
        ]
    },


    {
        id: "a2-weil",
        level: "A2",
        title: "weil-Sätze",
        category: "Conjunctions",
        description: "Learn how to give reasons with weil.",
        rule: "After weil, the conjugated verb goes to the end of the subordinate clause.",
        examples: [
            "Ich lerne Deutsch, weil ich in Deutschland arbeiten möchte.",
            "Ich bleibe zu Hause, weil ich krank bin.",
            "Sie kommt nicht, weil sie arbeiten muss."
        ],
        question: "Ich lerne Deutsch, weil ich in Deutschland arbeiten ___.",
        answers: [
            {
                text: "möchte",
                correct: true
            },
            {
                text: "will ich",
                correct: false
            },
            {
                text: "möchten",
                correct: false
            }
        ]
    },


    {
        id: "a2-dass",
        level: "A2",
        title: "dass-Sätze",
        category: "Conjunctions",
        description: "Learn how to express thoughts, opinions and information with dass.",
        rule: "Dass introduces a subordinate clause. The conjugated verb goes to the end.",
        examples: [
            "Ich glaube, dass er heute kommt.",
            "Ich weiß, dass du Deutsch lernst.",
            "Sie sagt, dass sie keine Zeit hat."
        ],
        question: "Ich weiß, dass er heute ___ .",
        answers: [
            {
                text: "kommt",
                correct: true
            },
            {
                text: "kommen",
                correct: false
            },
            {
                text: "ist kommt",
                correct: false
            }
        ]
    },


    {
        id: "a2-seit-bis",
        level: "A2",
        title: "seit(dem) und bis",
        category: "Conjunctions",
        description: "Learn how to talk about starting points and endpoints in time.",
        rule: "Seit(dem) describes something that started in the past and continues until now. Bis describes an endpoint.",
        examples: [
            "Seit ich Deutsch lerne, verstehe ich mehr.",
            "Seitdem ich hier wohne, habe ich viele Freunde.",
            "Ich bleibe hier, bis du kommst."
        ],
        question: "Ich warte, ___ du kommst.",
        answers: [
            {
                text: "seit",
                correct: false
            },
            {
                text: "bis",
                correct: true
            },
            {
                text: "weil",
                correct: false
            }
        ]
    },


    {
        id: "a2-imperativ",
        level: "A2",
        title: "Imperativ",
        category: "Verbs",
        description: "Learn how to give commands, instructions and friendly requests.",
        rule: "The Imperativ is used for commands and requests. Examples include Komm!, Kommt!, and Kommen Sie!",
        examples: [
            "Komm bitte hierher!",
            "Lernt die Wörter!",
            "Machen Sie die Tür zu!",
            "Sei vorsichtig!"
        ],
        question: "___ bitte die Tür!",
        answers: [
            {
                text: "Mach",
                correct: true
            },
            {
                text: "Macht",
                correct: false
            },
            {
                text: "Machen",
                correct: false
            }
        ]
    },


    {
        id: "a2-perfect",
        level: "A2",
        title: "Perfekt",
        category: "Tenses",
        description: "Learn how to talk about completed actions in the past.",
        rule: "The Perfekt is formed with haben or sein plus the Partizip II.",
        examples: [
            "Ich habe Deutsch gelernt.",
            "Wir haben Fußball gespielt.",
            "Er ist nach Deutschland gefahren.",
            "Sie ist nach Hause gegangen."
        ],
        question: "Ich ___ Deutsch gelernt.",
        answers: [
            {
                text: "bin",
                correct: false
            },
            {
                text: "habe",
                correct: true
            },
            {
                text: "werde",
                correct: false
            }
        ]
    },


    /* =====================================================
       B1
    ====================================================== */

    {
        id: "b1-genitive",
        level: "B1",
        title: "Genitiv",
        category: "Cases",
        description: "Learn how to express possession and relationships with the Genitiv.",
        rule: "The Genitiv often expresses possession. Masculine and neuter nouns commonly take -s or -es.",
        examples: [
            "Das ist das Auto meines Vaters.",
            "Die Farbe des Hauses ist schön.",
            "Die Tasche meiner Mutter ist neu."
        ],
        question: "Das ist das Auto ___ Vaters.",
        answers: [
            {
                text: "meinen",
                correct: false
            },
            {
                text: "meines",
                correct: true
            },
            {
                text: "meinem",
                correct: false
            }
        ]
    },


    {
        id: "b1-relative-clauses",
        level: "B1",
        title: "Relativsätze",
        category: "Sentence Structure",
        description: "Learn how to connect information about a person or thing with relative clauses.",
        rule: "The relative pronoun agrees in gender and number with the noun it refers to, while its case depends on its role in the relative clause.",
        examples: [
            "Das ist der Mann, der dort arbeitet.",
            "Das ist die Frau, die ich kenne.",
            "Das ist das Buch, das ich lese.",
            "Der Mann, mit dem ich spreche, ist mein Lehrer."
        ],
        question: "Das ist der Mann, ___ dort arbeitet.",
        answers: [
            {
                text: "der",
                correct: true
            },
            {
                text: "den",
                correct: false
            },
            {
                text: "dem",
                correct: false
            }
        ]
    },


    {
        id: "b1-passive",
        level: "B1",
        title: "Passiv",
        category: "Sentence Structure",
        description: "Learn how to form the German passive voice.",
        rule: "The passive focuses on the action rather than the person doing it. Präsens Passiv = werden + Partizip II.",
        examples: [
            "Das Auto wird repariert.",
            "Das Haus wird gebaut.",
            "Die Briefe werden geschrieben.",
            "Deutsch wird in vielen Ländern gelernt."
        ],
        question: "Das Auto ___ repariert.",
        answers: [
            {
                text: "wird",
                correct: true
            },
            {
                text: "hat",
                correct: false
            },
            {
                text: "ist",
                correct: false
            }
        ]
    },


    {
        id: "b1-konjunktiv-ii",
        level: "B1",
        title: "Konjunktiv II",
        category: "Verb Forms",
        description: "Learn how to express wishes, polite requests and hypothetical situations.",
        rule: "Konjunktiv II is used for unreal or hypothetical situations, wishes and polite requests. Common forms include wäre, hätte and würde.",
        examples: [
            "Ich wäre gern in Deutschland.",
            "Ich hätte gern einen Kaffee.",
            "Ich würde gern Deutsch lernen.",
            "Könnten Sie mir helfen?"
        ],
        question: "Ich ___ gern nach Deutschland reisen.",
        answers: [
            {
                text: "würde",
                correct: true
            },
            {
                text: "werde",
                correct: false
            },
            {
                text: "wurde",
                correct: false
            }
        ]
    },


    {
        id: "b1-prateritum-modal",
        level: "B1",
        title: "Präteritum der Modalverben",
        category: "Tenses",
        description: "Learn the common past forms of German modal verbs.",
        rule: "The Präteritum forms are: konnte, musste, wollte, durfte, sollte and mochte.",
        examples: [
            "Ich konnte gestern nicht kommen.",
            "Wir mussten lange warten.",
            "Er wollte Deutsch lernen.",
            "Sie durfte nicht gehen."
        ],
        question: "Ich ___ gestern arbeiten.",
        answers: [
            {
                text: "musste",
                correct: true
            },
            {
                text: "müsste",
                correct: false
            },
            {
                text: "muss",
                correct: false
            }
        ]
    },


    {
        id: "b1-adjective-declension",
        level: "B1",
        title: "Adjektivdeklination",
        category: "Adjectives",
        description: "Learn how adjective endings change after different articles.",
        rule: "Adjective endings depend on the article, gender, number and case of the noun.",
        examples: [
            "der gute Mann",
            "die schöne Stadt",
            "ein großes Haus",
            "mit einem guten Freund"
        ],
        question: "Das ist ein ___ Haus.",
        answers: [
            {
                text: "großes",
                correct: true
            },
            {
                text: "großen",
                correct: false
            },
            {
                text: "große",
                correct: false
            }
        ]
    },


    {
        id: "b1-verbs-prepositions",
        level: "B1",
        title: "Verben mit Präpositionen",
        category: "Verbs",
        description: "Learn common German verbs that require specific prepositions.",
        rule: "Many German verbs are used with a fixed preposition. You need to learn the verb and preposition together.",
        examples: [
            "Ich warte auf den Bus.",
            "Ich denke an meine Familie.",
            "Wir sprechen über das Problem.",
            "Er interessiert sich für Deutsch."
        ],
        question: "Ich warte ___ den Bus.",
        answers: [
            {
                text: "auf",
                correct: true
            },
            {
                text: "an",
                correct: false
            },
            {
                text: "mit",
                correct: false
            }
        ]
    },


    /* =====================================================
       B2
    ====================================================== */

    {
        id: "b2-passive-perfect",
        level: "B2",
        title: "Passiv im Perfekt",
        category: "Advanced Grammar",
        description: "Learn how to form passive sentences in the Perfekt.",
        rule: "The Perfekt Passive is generally formed with ist + Partizip II + worden.",
        examples: [
            "Das Auto ist repariert worden.",
            "Das Haus ist gebaut worden.",
            "Die Aufgabe ist erledigt worden."
        ],
        question: "Das Auto ist repariert ___ .",
        answers: [
            {
                text: "geworden",
                correct: false
            },
            {
                text: "worden",
                correct: true
            },
            {
                text: "werden",
                correct: false
            }
        ]
    },


    {
        id: "b2-konjunktiv-past",
        level: "B2",
        title: "Konjunktiv II Vergangenheit",
        category: "Advanced Grammar",
        description: "Learn how to talk about unreal situations in the past and things that did not happen.",
        rule: "Konjunktiv II Vergangenheit is formed with hätte or wäre + Partizip II.",
        examples: [
            "Ich hätte mehr gelernt.",
            "Ich wäre früher gekommen.",
            "Wenn ich Zeit gehabt hätte, wäre ich gekommen.",
            "Sie hätte die Prüfung bestanden."
        ],
        question: "Wenn ich Zeit gehabt ___, wäre ich gekommen.",
        answers: [
            {
                text: "habe",
                correct: false
            },
            {
                text: "hätte",
                correct: true
            },
            {
                text: "hat",
                correct: false
            }
        ]
    },


    {
        id: "b2-advanced-relative",
        level: "B2",
        title: "Erweiterte Relativsätze",
        category: "Advanced Grammar",
        description: "Use relative clauses with different cases and prepositions.",
        rule: "The relative pronoun takes its gender and number from the noun, but its case comes from its grammatical function in the relative clause.",
        examples: [
            "Der Mann, mit dem ich gesprochen habe, ist Lehrer.",
            "Die Stadt, in der ich geboren wurde, ist Kigali.",
            "Das Thema, über das wir sprechen, ist wichtig."
        ],
        question: "Das ist die Frau, mit ___ ich gesprochen habe.",
        answers: [
            {
                text: "die",
                correct: false
            },
            {
                text: "der",
                correct: true
            },
            {
                text: "dem",
                correct: false
            }
        ]
    },


    {
        id: "b2-partizipial-adjectives",
        level: "B2",
        title: "Partizipien als Adjektive",
        category: "Advanced Grammar",
        description: "Learn how Partizip I and Partizip II can be used as adjectives.",
        rule: "Partizip I often describes an active or ongoing action, while Partizip II often describes a completed action or result.",
        examples: [
            "ein lachendes Kind",
            "die arbeitenden Menschen",
            "die geschlossene Tür",
            "ein geschriebenes Dokument"
        ],
        question: "Die Tür ist ___.",
        answers: [
            {
                text: "geschlossen",
                correct: true
            },
            {
                text: "schließend",
                correct: false
            },
            {
                text: "schließt",
                correct: false
            }
        ]
    },


    {
        id: "b2-dass-ohne-dass",
        level: "B2",
        title: "Infinitiv mit zu",
        category: "Sentence Structure",
        description: "Learn how to replace certain subordinate clauses with infinitive constructions.",
        rule: "The infinitive with zu is often used when the subject of the main and infinitive clauses is the same.",
        examples: [
            "Ich versuche, Deutsch zu lernen.",
            "Sie plant, nach Deutschland zu reisen.",
            "Er hat vergessen, die Tür zu schließen."
        ],
        question: "Ich versuche, Deutsch ___ lernen.",
        answers: [
            {
                text: "zu",
                correct: true
            },
            {
                text: "um",
                correct: false
            },
            {
                text: "dass",
                correct: false
            }
        ]
    },


    {
        id: "b2-um-zu",
        level: "B2",
        title: "um ... zu",
        category: "Conjunctions",
        description: "Learn how to express purpose using um ... zu.",
        rule: "Um ... zu expresses purpose. The subject of both parts is normally the same.",
        examples: [
            "Ich lerne Deutsch, um in Deutschland zu arbeiten.",
            "Ich gehe zum Supermarkt, um Lebensmittel zu kaufen.",
            "Sie spart Geld, um eine Reise zu machen."
        ],
        question: "Ich lerne Deutsch, um in Deutschland ___ arbeiten.",
        answers: [
            {
                text: "zu",
                correct: true
            },
            {
                text: "zum",
                correct: false
            },
            {
                text: "dass",
                correct: false
            }
        ]
    },


    {
        id: "b2-je-desto",
        level: "B2",
        title: "je ... desto",
        category: "Advanced Grammar",
        description: "Learn how to express proportional relationships.",
        rule: "Je ... desto/umso means the more ... the more. The adjective is usually in the comparative.",
        examples: [
            "Je mehr ich lerne, desto besser spreche ich Deutsch.",
            "Je früher du kommst, desto besser.",
            "Je länger ich warte, desto ungeduldiger werde ich."
        ],
        question: "Je mehr ich lerne, ___ besser spreche ich Deutsch.",
        answers: [
            {
                text: "desto",
                correct: true
            },
            {
                text: "weil",
                correct: false
            },
            {
                text: "obwohl",
                correct: false
            }
        ]
    }

];


/* =========================================================
   STATE
========================================================= */

let selectedLevel = "all";
let searchTerm = "";

let currentTopic = null;
let currentQuestionIndex = 0;
let questionAnswered = false;

let grammarStats = {
    topicsStudied: 0,
    exercisesCompleted: 0,
    streak: 0,
    xp: 0,
    lastStudyDate: null,
    completedTopics: []
};


/* =========================================================
   DOM ELEMENTS
========================================================= */

let grammarGrid;
let grammarEmptyState;
let grammarSearch;
let grammarTopicCount;

let topicsStudied;
let grammarExercises;
let grammarStreak;
let grammarXp;

let grammarModal;
let grammarModalOverlay;
let closeGrammarModal;

let grammarModalLevel;
let grammarModalTitle;
let grammarModalDescription;
let grammarModalRule;
let grammarModalExamples;

let grammarQuestion;
let grammarAnswers;
let grammarFeedback;

let nextGrammarQuestion;
let markGrammarComplete;

let randomGrammarBtn;
let clearGrammarSearch;
let dailyGrammarBtn;
let grammarDailyText;
let grammarDailyBar;


/* =========================================================
   SESSION
========================================================= */

function getStudentToken() {
    return localStorage.getItem(STUDENT_TOKEN_KEY);
}


function getStudentData() {

    try {

        const saved =
            localStorage.getItem(
                STUDENT_DATA_KEY
            );

        if (!saved) {
            return null;
        }

        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "Could not load student data:",
            error
        );

        return null;
    }
}


function hasStudentSession() {
    return Boolean(getStudentToken());
}


/* =========================================================
   API
========================================================= */

async function studentFetch(endpoint, options = {}) {

    const token =
        getStudentToken();

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }

    try {

        const response =
            await fetch(
                `${API_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            logoutStudent();

            return null;
        }

        let data = null;

        try {

            data =
                await response.json();

        } catch {

            data = null;

        }

        if (!response.ok) {

            console.warn(
                `Grammar API error ${response.status}`,
                data
            );

            return null;
        }

        return data;

    } catch (error) {

        console.warn(
            "Grammar API unavailable:",
            error
        );

        return null;
    }
}


/* =========================================================
   LOGOUT
========================================================= */

function logoutStudent() {

    localStorage.removeItem(
        STUDENT_TOKEN_KEY
    );

    localStorage.removeItem(
        STUDENT_DATA_KEY
    );

    window.location.href =
        "../login.html";
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadGrammarStats() {

    try {

        const saved =
            localStorage.getItem(
                GRAMMAR_STATS_KEY
            );

        if (!saved) {
            return;
        }

        const parsed =
            JSON.parse(saved);

        if (
            parsed &&
            typeof parsed === "object"
        ) {

            grammarStats = {
                ...grammarStats,
                ...parsed
            };

        }

        if (
            !Array.isArray(
                grammarStats.completedTopics
            )
        ) {

            grammarStats.completedTopics = [];

        }

    } catch (error) {

        console.error(
            "Could not load grammar stats:",
            error
        );

    }

}


function saveGrammarStats() {

    localStorage.setItem(
        GRAMMAR_STATS_KEY,
        JSON.stringify(grammarStats)
    );

}


/* =========================================================
   FILTERING
========================================================= */

function getFilteredTopics() {

    return grammarTopics.filter(topic => {

        const levelMatch =
            selectedLevel === "all" ||
            topic.level === selectedLevel;

        const searchableText = [
            topic.title,
            topic.level,
            topic.category,
            topic.description,
            topic.rule,
            ...topic.examples
        ]
            .join(" ")
            .toLowerCase();

        const searchMatch =
            !searchTerm ||
            searchableText.includes(searchTerm);

        return (
            levelMatch &&
            searchMatch
        );

    });

}


/* =========================================================
   RENDER TOPICS
========================================================= */

function renderGrammarTopics() {

    if (!grammarGrid) {
        return;
    }

    const topics =
        getFilteredTopics();

    grammarGrid.innerHTML = "";

    if (grammarTopicCount) {

        grammarTopicCount.textContent =
            `${topics.length} ${
                topics.length === 1
                    ? "topic"
                    : "topics"
            }`;

    }

    if (topics.length === 0) {

        if (grammarEmptyState) {

            grammarEmptyState.style.display =
                "block";

        }

        return;
    }

    if (grammarEmptyState) {

        grammarEmptyState.style.display =
            "none";

    }

    topics.forEach(topic => {

        const card =
            createGrammarCard(topic);

        grammarGrid.appendChild(card);

    });

}


/* =========================================================
   CREATE TOPIC CARD
========================================================= */

function createGrammarCard(topic) {

    const card =
        document.createElement("article");

    card.className =
        "grammar-card";

    card.dataset.level =
        topic.level;

    card.dataset.topicId =
        topic.id;

    const completed =
        grammarStats.completedTopics
            .includes(topic.id);

    card.innerHTML = `

        <div class="grammar-card-top">

            <span class="grammar-level">
                ${escapeHTML(topic.level)}
            </span>

            ${
                completed
                    ? `
                        <span class="grammar-completed">
                            ✓ Completed
                        </span>
                      `
                    : ""
            }

        </div>


        <div class="grammar-card-icon">
            ${
                getLevelIcon(
                    topic.level
                )
            }
        </div>


        <span class="grammar-category">
            ${escapeHTML(topic.category)}
        </span>


        <h3>
            ${escapeHTML(topic.title)}
        </h3>


        <p>
            ${escapeHTML(topic.description)}
        </p>


        <div class="grammar-card-footer">

            <span>
                ${topic.examples.length} examples
            </span>

            <button
                type="button"
                class="grammar-open-btn"
                data-topic-id="${escapeHTML(topic.id)}"
            >
                Study →
            </button>

        </div>

    `;


    const openButton =
        card.querySelector(
            ".grammar-open-btn"
        );

    if (openButton) {

        openButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                openGrammarTopic(
                    topic.id
                );

            }
        );

    }


    card.addEventListener(
        "click",
        () => {

            openGrammarTopic(
                topic.id
            );

        }
    );


    return card;

}


/* =========================================================
   LEVEL ICON
========================================================= */

function getLevelIcon(level) {

    switch (level) {

        case "A1":
            return "🌱";

        case "A2":
            return "📘";

        case "B1":
            return "🚀";

        case "B2":
            return "🏆";

        default:
            return "📚";

    }

}


/* =========================================================
   OPEN TOPIC
========================================================= */

function openGrammarTopic(topicId) {

    const topic =
        grammarTopics.find(
            item => item.id === topicId
        );

    if (!topic) {
        return;
    }

    currentTopic =
        topic;

    currentQuestionIndex = 0;
    questionAnswered = false;

    fillGrammarModal();

    if (grammarModal) {

        grammarModal.classList.add(
            "active"
        );

        grammarModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "modal-open"
        );

    }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeGrammarTopic() {

    if (!grammarModal) {
        return;
    }

    grammarModal.classList.remove(
        "active"
    );

    grammarModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "modal-open"
    );

    currentTopic = null;
    questionAnswered = false;

}


/* =========================================================
   FILL MODAL
========================================================= */

function fillGrammarModal() {

    if (!currentTopic) {
        return;
    }

    if (grammarModalLevel) {

        grammarModalLevel.textContent =
            currentTopic.level;

    }

    if (grammarModalTitle) {

        grammarModalTitle.textContent =
            currentTopic.title;

    }

    if (grammarModalDescription) {

        grammarModalDescription.textContent =
            currentTopic.description;

    }

    if (grammarModalRule) {

        grammarModalRule.textContent =
            currentTopic.rule;

    }


    renderExamples();

    renderQuestion();

    if (grammarFeedback) {

        grammarFeedback.style.display =
            "none";

        grammarFeedback.textContent =
            "";

    }

}


/* =========================================================
   EXAMPLES
========================================================= */

function renderExamples() {

    if (!grammarModalExamples ||
        !currentTopic) {

        return;
    }

    grammarModalExamples.innerHTML = "";

    currentTopic.examples.forEach(
        example => {

            const exampleElement =
                document.createElement("div");

            exampleElement.className =
                "grammar-example";

            exampleElement.textContent =
                example;

            grammarModalExamples.appendChild(
                exampleElement
            );

        }
    );

}


/* =========================================================
   QUESTIONS
========================================================= */

function renderQuestion() {

    if (
        !currentTopic ||
        !grammarQuestion ||
        !grammarAnswers
    ) {

        return;
    }

    const question =
        currentTopic.answers
            ? currentTopic
            : null;

    if (!question) {
        return;
    }

    grammarQuestion.textContent =
        currentTopic.question;

    grammarAnswers.innerHTML = "";

    questionAnswered = false;

    currentTopic.answers.forEach(
        (answer, index) => {

            const button =
                document.createElement("button");

            button.type =
                "button";

            button.className =
                "grammar-answer";

            button.dataset.answerIndex =
                String(index);

            button.textContent =
                answer.text;

            button.addEventListener(
                "click",
                () => {

                    answerQuestion(
                        index
                    );

                }
            );

            grammarAnswers.appendChild(
                button
            );

        }
    );

    if (grammarFeedback) {

        grammarFeedback.style.display =
            "none";

        grammarFeedback.textContent =
            "";

    }

}


/* =========================================================
   ANSWER QUESTION
========================================================= */

function answerQuestion(answerIndex) {

    if (
        !currentTopic ||
        questionAnswered
    ) {

        return;
    }

    const answer =
        currentTopic.answers[
            answerIndex
        ];

    if (!answer) {
        return;
    }

    questionAnswered = true;

    const buttons =
        grammarAnswers.querySelectorAll(
            ".grammar-answer"
        );

    buttons.forEach(
        (button, index) => {

            button.disabled =
                true;

            const currentAnswer =
                currentTopic.answers[index];

            if (currentAnswer.correct) {

                button.classList.add(
                    "correct"
                );

            }

            if (
                index === answerIndex &&
                !currentAnswer.correct
            ) {

                button.classList.add(
                    "incorrect"
                );

            }

        }
    );


    grammarStats.exercisesCompleted++;

    if (answer.correct) {

        grammarStats.xp += 10;

        showGrammarFeedback(
            "✓ Correct! Great job.",
            true
        );

    } else {

        showGrammarFeedback(
            `✗ Not quite. The correct answer is "${getCorrectAnswer()}".`,
            false
        );

    }


    updateGrammarStats();

    saveGrammarStats();

    updateDailyChallenge();

    saveGrammarExerciseToBackend(
        currentTopic,
        answer.correct
    );

}


/* =========================================================
   CORRECT ANSWER
========================================================= */

function getCorrectAnswer() {

    if (!currentTopic) {
        return "";
    }

    const correct =
        currentTopic.answers.find(
            answer => answer.correct
        );

    return correct
        ? correct.text
        : "";

}


/* =========================================================
   FEEDBACK
========================================================= */

function showGrammarFeedback(
    message,
    correct
) {

    if (!grammarFeedback) {
        return;
    }

    grammarFeedback.textContent =
        message;

    grammarFeedback.style.display =
        "block";

    grammarFeedback.classList.remove(
        "correct",
        "incorrect"
    );

    grammarFeedback.classList.add(
        correct
            ? "correct"
            : "incorrect"
    );

}


/* =========================================================
   NEXT QUESTION
========================================================= */

function setupNextQuestion() {

    if (!nextGrammarQuestion) {
        return;
    }

    nextGrammarQuestion.addEventListener(
        "click",
        () => {

            if (!currentTopic) {
                return;
            }

            /*
                Each topic currently contains one
                practice question. Clicking next gives
                the learner a fresh attempt.
            */

            currentQuestionIndex++;

            renderQuestion();

        }
    );

}


/* =========================================================
   MARK TOPIC COMPLETE
========================================================= */

function setupMarkComplete() {

    if (!markGrammarComplete) {
        return;
    }

    markGrammarComplete.addEventListener(
        "click",
        () => {

            if (!currentTopic) {
                return;
            }

            const alreadyCompleted =
                grammarStats.completedTopics
                    .includes(
                        currentTopic.id
                    );

            if (!alreadyCompleted) {

                grammarStats.completedTopics.push(
                    currentTopic.id
                );

                grammarStats.topicsStudied++;

                grammarStats.xp += 25;

                updateGrammarStreak();

                saveGrammarStats();

                updateGrammarStats();

                renderGrammarTopics();

                updateDailyChallenge();

                saveGrammarTopicToBackend(
                    currentTopic
                );

                showGrammarMessage(
                    "✓ Grammar topic completed! +25 XP"
                );

            } else {

                showGrammarMessage(
                    "✓ You already completed this topic."
                );

            }

        }
    );

}


/* =========================================================
   RANDOM TOPIC
========================================================= */

function setupRandomGrammar() {

    if (!randomGrammarBtn) {
        return;
    }

    randomGrammarBtn.addEventListener(
        "click",
        () => {

            const topics =
                getFilteredTopics();

            if (topics.length === 0) {

                showGrammarMessage(
                    "No grammar topics match your filters."
                );

                return;
            }

            const randomIndex =
                Math.floor(
                    Math.random() *
                    topics.length
                );

            openGrammarTopic(
                topics[randomIndex].id
            );

        }
    );

}


/* =========================================================
   SEARCH
========================================================= */

function setupGrammarSearch() {

    if (!grammarSearch) {
        return;
    }

    grammarSearch.addEventListener(
        "input",
        () => {

            searchTerm =
                grammarSearch.value
                    .trim()
                    .toLowerCase();

            renderGrammarTopics();

        }
    );

}


/* =========================================================
   LEVEL FILTER
========================================================= */

function setupLevelFilters() {

    const filters =
        document.querySelectorAll(
            ".grammar-filter"
        );

    filters.forEach(
        filter => {

            filter.addEventListener(
                "click",
                () => {

                    filters.forEach(
                        item => {
                            item.classList.remove(
                                "active"
                            );
                        }
                    );

                    filter.classList.add(
                        "active"
                    );

                    selectedLevel =
                        filter.dataset.level ||
                        "all";

                    renderGrammarTopics();

                }
            );

        }
    );

}


/* =========================================================
   CLEAR SEARCH
========================================================= */

function setupClearSearch() {

    if (!clearGrammarSearch) {
        return;
    }

    clearGrammarSearch.addEventListener(
        "click",
        () => {

            searchTerm = "";
            selectedLevel = "all";

            if (grammarSearch) {
                grammarSearch.value = "";
            }

            const filters =
                document.querySelectorAll(
                    ".grammar-filter"
                );

            filters.forEach(
                filter => {

                    filter.classList.remove(
                        "active"
                    );

                    if (
                        filter.dataset.level ===
                        "all"
                    ) {

                        filter.classList.add(
                            "active"
                        );

                    }

                }
            );

            renderGrammarTopics();

        }
    );

}


/* =========================================================
   QUICK LEVEL BUTTONS
========================================================= */

function setupQuickLevelButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-quick-level]"
        );

    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const level =
                        button.dataset.quickLevel;

                    selectedLevel =
                        level;

                    searchTerm = "";

                    if (grammarSearch) {
                        grammarSearch.value = "";
                    }

                    const filters =
                        document.querySelectorAll(
                            ".grammar-filter"
                        );

                    filters.forEach(
                        filter => {

                            filter.classList.remove(
                                "active"
                            );

                            if (
                                filter.dataset.level ===
                                level
                            ) {

                                filter.classList.add(
                                    "active"
                                );

                            }

                        }
                    );

                    renderGrammarTopics();

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }
            );

        }
    );

}


/* =========================================================
   DAILY CHALLENGE
========================================================= */

function setupDailyChallenge() {

    if (!dailyGrammarBtn) {
        return;
    }

    dailyGrammarBtn.addEventListener(
        "click",
        () => {

            const dailyTopic =
                getDailyTopic();

            if (!dailyTopic) {
                return;
            }

            openGrammarTopic(
                dailyTopic.id
            );

        }
    );

    updateDailyChallenge();

}


function getDailyTopic() {

    if (grammarTopics.length === 0) {
        return null;
    }

    const today =
        getLocalDateString();

    let hash = 0;

    for (
        let index = 0;
        index < today.length;
        index++
    ) {

        hash =
            (
                hash * 31 +
                today.charCodeAt(index)
            ) | 0;

    }

    const topicIndex =
        Math.abs(hash) %
        grammarTopics.length;

    return grammarTopics[
        topicIndex
    ];

}


function updateDailyChallenge() {

    const dailyTopic =
        getDailyTopic();

    if (!dailyTopic) {
        return;
    }

    const completed =
        grammarStats.completedTopics
            .includes(
                dailyTopic.id
            );

    if (grammarDailyText) {

        grammarDailyText.textContent =
            completed
                ? "1 / 1"
                : "0 / 1";

    }

    if (grammarDailyBar) {

        grammarDailyBar.style.width =
            completed
                ? "100%"
                : "0%";

    }

    if (dailyGrammarBtn) {

        dailyGrammarBtn.textContent =
            completed
                ? "✓ Challenge Completed"
                : "Start Today's Challenge";

    }

}


/* =========================================================
   STREAK
========================================================= */

function updateGrammarStreak() {

    const today =
        getLocalDateString();

    const lastDate =
        grammarStats.lastStudyDate;

    if (!lastDate) {

        grammarStats.streak = 1;

    } else if (
        lastDate === today
    ) {

        return;

    } else {

        const previous =
            new Date(
                `${lastDate}T00:00:00`
            );

        const current =
            new Date(
                `${today}T00:00:00`
            );

        const difference =
            Math.round(
                (
                    current -
                    previous
                ) /
                86400000
            );

        if (difference === 1) {

            grammarStats.streak =
                Number(
                    grammarStats.streak || 0
                ) + 1;

        } else {

            grammarStats.streak = 1;

        }

    }

    grammarStats.lastStudyDate =
        today;

}


function getLocalDateString() {

    const date =
        new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* =========================================================
   STATS UI
========================================================= */

function updateGrammarStats() {

    if (topicsStudied) {

        topicsStudied.textContent =
            formatNumber(
                grammarStats.topicsStudied
            );

    }

    if (grammarExercises) {

        grammarExercises.textContent =
            formatNumber(
                grammarStats.exercisesCompleted
            );

    }

    if (grammarStreak) {

        grammarStreak.textContent =
            formatNumber(
                grammarStats.streak
            );

    }

    if (grammarXp) {

        grammarXp.textContent =
            formatNumber(
                grammarStats.xp
            );

    }

}


function formatNumber(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString();

}


/* =========================================================
   STUDENT PROFILE
========================================================= */

async function loadStudentProfile() {

    const student =
        getStudentData();

    if (!student) {
        return;
    }

    const displayName =
        student.fullName ||
        student.name ||
        student.firstName ||
        "Student";

    const elements =
        document.querySelectorAll(
            "#studentName, #grammarStudentName, .student-name"
        );

    elements.forEach(
        element => {

            element.textContent =
                displayName;

        }
    );

}


/* =========================================================
   BACKEND SAVE — EXERCISE
========================================================= */

async function saveGrammarExerciseToBackend(
    topic,
    correct
) {

    if (!hasStudentSession()) {
        return;
    }

    /*
        This request is optional. If the backend does
        not expose a vocabulary/grammar-specific route,
        local progress continues working normally.
    */

    try {

        await studentFetch(
            "/student/grammar/progress",
            {
                method: "POST",
                body: JSON.stringify({
                    topicId: topic.id,
                    topic: topic.title,
                    level: topic.level,
                    correct: Boolean(correct),
                    xp: correct ? 10 : 0
                })
            }
        );

    } catch (error) {

        console.warn(
            "Grammar backend progress unavailable:",
            error
        );

    }

}


/* =========================================================
   BACKEND SAVE — TOPIC
========================================================= */

async function saveGrammarTopicToBackend(
    topic
) {

    if (!hasStudentSession()) {
        return;
    }

    try {

        await studentFetch(
            "/student/grammar/progress",
            {
                method: "POST",
                body: JSON.stringify({
                    topicId: topic.id,
                    topic: topic.title,
                    level: topic.level,
                    completed: true,
                    xp: 25
                })
            }
        );

    } catch (error) {

        console.warn(
            "Grammar backend topic progress unavailable:",
            error
        );

    }

}


/* =========================================================
   GENERAL MESSAGE
========================================================= */

function showGrammarMessage(message) {

    let element =
        document.getElementById(
            "grammarMessage"
        );

    if (!element) {

        element =
            document.createElement("div");

        element.id =
            "grammarMessage";

        element.className =
            "grammar-message";

        document.body.appendChild(
            element
        );

    }

    element.textContent =
        message;

    element.classList.add(
        "show"
    );

    clearTimeout(
        showGrammarMessage.timeout
    );

    showGrammarMessage.timeout =
        setTimeout(
            () => {

                element.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const logoutBtn =
        document.getElementById(
            "logoutBtn"
        );

    if (!logoutBtn) {
        return;
    }

    logoutBtn.addEventListener(
        "click",
        event => {

            event.preventDefault();

            logoutStudent();

        }
    );

}


/* =========================================================
   MODAL CONTROLS
========================================================= */

function setupModalControls() {

    if (closeGrammarModal) {

        closeGrammarModal.addEventListener(
            "click",
            closeGrammarTopic
        );

    }

    if (grammarModalOverlay) {

        grammarModalOverlay.addEventListener(
            "click",
            closeGrammarTopic
        );

    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                grammarModal &&
                grammarModal.classList.contains(
                    "active"
                )
            ) {

                closeGrammarTopic();

            }

        }
    );

}


/* =========================================================
   KEYBOARD SHORTCUTS
========================================================= */

function setupKeyboardShortcuts() {

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "/" &&
                document.activeElement !==
                    grammarSearch
            ) {

                event.preventDefault();

                if (grammarSearch) {
                    grammarSearch.focus();
                }

            }

            if (
                event.key.toLowerCase() === "r" &&
                document.activeElement.tagName !==
                    "INPUT" &&
                document.activeElement.tagName !==
                    "TEXTAREA" &&
                document.activeElement.tagName !==
                    "SELECT"
            ) {

                const topics =
                    getFilteredTopics();

                if (topics.length > 0) {

                    const randomIndex =
                        Math.floor(
                            Math.random() *
                            topics.length
                        );

                    openGrammarTopic(
                        topics[randomIndex].id
                    );

                }

            }

        }
    );

}


/* =========================================================
   INITIALIZE DOM
========================================================= */

function cacheGrammarElements() {

    grammarGrid =
        document.getElementById(
            "grammarGrid"
        );

    grammarEmptyState =
        document.getElementById(
            "grammarEmptyState"
        );

    grammarSearch =
        document.getElementById(
            "grammarSearch"
        );

    grammarTopicCount =
        document.getElementById(
            "grammarTopicCount"
        );


    topicsStudied =
        document.getElementById(
            "topicsStudied"
        );

    grammarExercises =
        document.getElementById(
            "grammarExercises"
        );

    grammarStreak =
        document.getElementById(
            "grammarStreak"
        );

    grammarXp =
        document.getElementById(
            "grammarXp"
        );


    grammarModal =
        document.getElementById(
            "grammarModal"
        );

    grammarModalOverlay =
        document.getElementById(
            "grammarModalOverlay"
        );

    closeGrammarModal =
        document.getElementById(
            "closeGrammarModal"
        );


    grammarModalLevel =
        document.getElementById(
            "modalGrammarLevel"
        );

    grammarModalTitle =
        document.getElementById(
            "grammarModalTitle"
        );

    grammarModalDescription =
        document.getElementById(
            "grammarModalDescription"
        );

    grammarModalRule =
        document.getElementById(
            "grammarModalRule"
        );

    grammarModalExamples =
        document.getElementById(
            "grammarModalExamples"
        );


    grammarQuestion =
        document.getElementById(
            "grammarQuestion"
        );

    grammarAnswers =
        document.getElementById(
            "grammarAnswers"
        );

    grammarFeedback =
        document.getElementById(
            "grammarFeedback"
        );


    nextGrammarQuestion =
        document.getElementById(
            "nextGrammarQuestion"
        );

    markGrammarComplete =
        document.getElementById(
            "markGrammarComplete"
        );


    randomGrammarBtn =
        document.getElementById(
            "randomGrammarBtn"
        );

    clearGrammarSearch =
        document.getElementById(
            "clearGrammarSearch"
        );

    dailyGrammarBtn =
        document.getElementById(
            "dailyGrammarBtn"
        );

    grammarDailyText =
        document.getElementById(
            "grammarDailyText"
        );

    grammarDailyBar =
        document.getElementById(
            "grammarDailyBar"
        );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   INITIALIZE
========================================================= */

async function initGrammarPage() {

    cacheGrammarElements();

    loadGrammarStats();

    setupLogout();

    setupGrammarSearch();

    setupLevelFilters();

    setupClearSearch();

    setupQuickLevelButtons();

    setupRandomGrammar();

    setupNextQuestion();

    setupMarkComplete();

    setupDailyChallenge();

    setupModalControls();

    setupKeyboardShortcuts();

    updateGrammarStats();

    renderGrammarTopics();

    updateDailyChallenge();

    await loadStudentProfile();

}


/* =========================================================
   START APP
========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initGrammarPage
    );

} else {

    initGrammarPage();

}
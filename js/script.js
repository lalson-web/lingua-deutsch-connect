/* =====================================================
   LINGUA DEUTSCH CONNECT
   MAIN JAVASCRIPT
===================================================== */


/* =====================================================
   GLOBAL HELPERS
===================================================== */

const navbar = document.querySelector(".navbar");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");


/* =====================================================
   MOBILE MENU
===================================================== */

if (menuToggle && mobileMenu) {

    menuToggle.addEventListener("click", () => {

        const isOpen =
            mobileMenu.classList.toggle("open");

        menuToggle.classList.toggle(
            "active",
            isOpen
        );

        menuToggle.setAttribute(
            "aria-expanded",
            isOpen ? "true" : "false"
        );

        menuToggle.setAttribute(
            "aria-label",
            isOpen
                ? "Close menu"
                : "Open menu"
        );

    });

}


function closeMobileMenu() {

    if (mobileMenu) {

        mobileMenu.classList.remove("open");

    }

    if (menuToggle) {

        menuToggle.classList.remove("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        menuToggle.setAttribute(
            "aria-label",
            "Open menu"
        );

    }

}


document
    .querySelectorAll(".mobile-menu a")
    .forEach((link) => {

        link.addEventListener(
            "click",
            closeMobileMenu
        );

    });


/* =====================================================
   NAVBAR SCROLL EFFECT
===================================================== */

function updateNavbar() {

    if (!navbar) return;

    if (window.scrollY > 30) {

        navbar.style.background =
            "rgba(255, 255, 255, 0.96)";

        navbar.style.boxShadow =
            "0 8px 30px rgba(0, 0, 0, 0.06)";

    } else {

        navbar.style.background =
            "rgba(255, 255, 255, 0.90)";

        navbar.style.boxShadow =
            "none";

    }

}


window.addEventListener(
    "scroll",
    updateNavbar,
    { passive: true }
);


updateNavbar();


/* =====================================================
   SMOOTH SCROLL
===================================================== */

document
    .querySelectorAll('a[href^="#"]')
    .forEach((link) => {

        link.addEventListener(
            "click",
            (event) => {

                const targetId =
                    link.getAttribute("href");

                if (
                    !targetId ||
                    targetId === "#"
                ) {

                    return;

                }

                /*
                 * Registration links are handled
                 * separately below.
                 */

                if (
                    link.hasAttribute(
                        "data-open-registration"
                    )
                ) {

                    return;

                }

                const target =
                    document.querySelector(targetId);

                if (!target) {

                    return;

                }

                event.preventDefault();

                const navbarHeight =
                    navbar
                        ? navbar.offsetHeight
                        : 0;

                const targetPosition =
                    target.getBoundingClientRect().top +
                    window.scrollY -
                    navbarHeight;

                window.scrollTo({

                    top: targetPosition,

                    behavior: "smooth"

                });

            }
        );

    });


/* =====================================================
   HERO MOUSE PARALLAX
===================================================== */

const heroVisual =
    document.querySelector(".hero-visual");

const visualCard =
    document.querySelector(".visual-card");


if (
    heroVisual &&
    visualCard &&
    window.innerWidth > 850
) {

    window.addEventListener(
        "mousemove",
        (event) => {

            const x =
                (
                    event.clientX /
                    window.innerWidth -
                    0.5
                ) * 8;

            const y =
                (
                    event.clientY /
                    window.innerHeight -
                    0.5
                ) * 8;

            visualCard.style.transform =
                `translate3d(${x * 0.25}px, ${y * 0.25}px, 0)`;

        },
        { passive: true }
    );

}


if (visualCard) {

    visualCard.addEventListener(
        "mouseleave",
        () => {

            visualCard.style.transform =
                "translate3d(0, 0, 0)";

        }
    );

}


/* =====================================================
   COURSE DATA
===================================================== */

const courseData = {

    A1: {

        level: "A1",

        title:
            "German for beginners.",

        subtitle:
            "Build your foundation.",

        description:
            "Start with the basics of German and learn how to introduce yourself, understand everyday expressions, ask simple questions, and communicate in familiar situations.",

        focus:
            "Foundations",

        topics: [

            "Greetings & introductions",
            "Everyday vocabulary",
            "Numbers, dates & time",
            "Basic grammar"

        ]

    },


    A2: {

        level: "A2",

        title:
            "German for everyday life.",

        subtitle:
            "Understand more. Speak more.",

        description:
            "Expand your vocabulary, strengthen your grammar, and become more comfortable talking about daily routines, experiences, plans, and familiar topics.",

        focus:
            "Everyday Communication",

        topics: [

            "Everyday conversations",
            "Past & future",
            "Opinions & experiences",
            "Practical grammar"

        ]

    },


    B1: {

        level: "B1",

        title:
            "Speak German with confidence.",

        subtitle:
            "Communicate independently.",

        description:
            "Develop stronger communication skills, understand more complex content, and handle real-life situations in everyday life, work, and study.",

        focus:
            "Fluency",

        topics: [

            "Confident speaking",
            "Opinions & discussions",
            "Complex sentences",
            "Real-life communication"

        ]

    },


    B2: {

        level: "B2",

        title:
            "Communicate professionally.",

        subtitle:
            "Take your German further.",

        description:
            "Strengthen your German for study, work, and life in Germany with more precise vocabulary, advanced grammar, and confident communication.",

        focus:
            "Advanced Communication",

        topics: [

            "Professional German",
            "Advanced grammar",
            "Presentations & discussions",
            "Study & work communication"

        ]

    }

};


/* =====================================================
   COURSE MODAL
===================================================== */

const courseButtons =
    document.querySelectorAll(".course-button");

let courseModal = null;


if (courseButtons.length > 0) {

    courseModal =
        document.createElement("div");

    courseModal.className =
        "course-modal";

    courseModal.innerHTML = `

        <div class="course-modal-backdrop"></div>

        <div
            class="course-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="courseModalTitle"
        >

            <button
                class="course-modal-close"
                type="button"
                aria-label="Close course details"
            >
                ×
            </button>

            <div class="course-modal-top">

                <span class="course-modal-label">
                    COURSE
                </span>

                <span
                    class="course-modal-level"
                    id="courseModalLevel"
                >
                    A1
                </span>

            </div>

            <div class="course-modal-content">

                <span
                    class="course-modal-subtitle"
                    id="courseModalSubtitle"
                >
                    Build your foundation.
                </span>

                <h2 id="courseModalTitle">
                    German for beginners.
                </h2>

                <p id="courseModalDescription">
                    Start with the basics of German.
                </p>

                <div class="course-modal-divider"></div>

                <div class="course-modal-focus">

                    <span>
                        COURSE FOCUS
                    </span>

                    <strong id="courseModalFocus">
                        Foundations
                    </strong>

                </div>

                <div class="course-modal-topics">

                    <span>
                        WHAT YOU WILL LEARN
                    </span>

                    <div id="courseModalTopics"></div>

                </div>

            </div>

            <a
                href="#start-learning"
                class="course-modal-cta"
                id="courseModalCta"
            >

                Start Learning

                <span>
                    ↗
                </span>

            </a>

        </div>
    `;

    document.body.appendChild(courseModal);

}


function openCourseModal(courseLevel) {

    if (!courseModal) return;

    const course =
        courseData[courseLevel];

    if (!course) return;

    const level =
        courseModal.querySelector("#courseModalLevel");

    const title =
        courseModal.querySelector("#courseModalTitle");

    const subtitle =
        courseModal.querySelector("#courseModalSubtitle");

    const description =
        courseModal.querySelector("#courseModalDescription");

    const focus =
        courseModal.querySelector("#courseModalFocus");

    const topics =
        courseModal.querySelector("#courseModalTopics");

    const cta =
        courseModal.querySelector("#courseModalCta");

    level.textContent =
        course.level;

    title.textContent =
        course.title;

    subtitle.textContent =
        course.subtitle;

    description.textContent =
        course.description;

    focus.textContent =
        course.focus;

    topics.innerHTML =
        course.topics
            .map(
                (topic) => `

                    <div class="modal-topic">

                        <span>
                            ✓
                        </span>

                        <p>
                            ${topic}
                        </p>

                    </div>

                `
            )
            .join("");

    cta.dataset.course =
        course.level;

    courseModal.classList.add("open");

    document.body.classList.add("modal-open");

    closeMobileMenu();

    setTimeout(() => {

        const closeButton =
            courseModal.querySelector(
                ".course-modal-close"
            );

        if (closeButton) {

            closeButton.focus();

        }

    }, 100);

}


function closeCourseModal() {

    if (!courseModal) return;

    courseModal.classList.remove("open");

    document.body.classList.remove("modal-open");

}


courseButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            openCourseModal(
                button.dataset.course
            );

        }
    );

});


if (courseModal) {

    const backdrop =
        courseModal.querySelector(
            ".course-modal-backdrop"
        );

    const closeButton =
        courseModal.querySelector(
            ".course-modal-close"
        );

    const cta =
        courseModal.querySelector(
            "#courseModalCta"
        );

    closeButton.addEventListener(
        "click",
        closeCourseModal
    );

    backdrop.addEventListener(
        "click",
        closeCourseModal
    );

    cta.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            const selectedCourse =
                cta.dataset.course || "";

            closeCourseModal();

            openRegistration(
                selectedCourse
            );

        }
    );

}


/* =====================================================
   REGISTRATION MODAL
===================================================== */

let registrationModal = null;


function createRegistrationModal() {

    if (registrationModal) {

        return;

    }

    registrationModal =
        document.createElement("div");

    registrationModal.className =
        "registration-modal";

    registrationModal.innerHTML = `

        <div class="registration-backdrop"></div>

        <div
            class="registration-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registrationTitle"
        >

            <button
                type="button"
                class="registration-close"
                aria-label="Close registration form"
            >
                ×
            </button>

            <div class="registration-header">

                <span class="registration-label">
                    START YOUR JOURNEY
                </span>

                <h2 id="registrationTitle">
                    Let’s get you started.
                </h2>

                <p>
                    Fill in your details and send your
                    registration directly to
                    LINGUA DEUTSCH CONNECT on WhatsApp.
                </p>

            </div>

            <form
                class="registration-form"
                id="registrationForm"
            >

                <div class="registration-row">

                    <div class="registration-field">

                        <label for="studentName">
                            Full Name *
                        </label>

                        <input
                            type="text"
                            id="studentName"
                            name="studentName"
                            placeholder="Your full name"
                            autocomplete="name"
                            required
                        >

                    </div>

                    <div class="registration-field">

                        <label for="studentPhone">
                            WhatsApp / Phone *
                        </label>

                        <input
                            type="tel"
                            id="studentPhone"
                            name="studentPhone"
                            placeholder="e.g. 0788 123 456"
                            autocomplete="tel"
                            required
                        >

                    </div>

                </div>

                <div class="registration-row">

                    <div class="registration-field">

                        <label for="studentEmail">
                            Email
                        </label>

                        <input
                            type="email"
                            id="studentEmail"
                            name="studentEmail"
                            placeholder="your@email.com"
                            autocomplete="email"
                        >

                    </div>

                    <div class="registration-field">

                        <label for="currentLevel">
                            Current German Level *
                        </label>

                        <select
                            id="currentLevel"
                            name="currentLevel"
                            required
                        >

                            <option value="">
                                Select your level
                            </option>

                            <option value="Beginner / No German">
                                Beginner / No German
                            </option>

                            <option value="A1">
                                A1
                            </option>

                            <option value="A2">
                                A2
                            </option>

                            <option value="B1">
                                B1
                            </option>

                            <option value="B2">
                                B2
                            </option>

                            <option value="Not sure">
                                Not sure
                            </option>

                        </select>

                    </div>

                </div>

                <div class="registration-field">

                    <label for="desiredCourse">
                        Course You Want *
                    </label>

                    <select
                        id="desiredCourse"
                        name="desiredCourse"
                        required
                    >

                        <option value="">
                            Select a course
                        </option>

                        <option value="A1">
                            A1 — Beginner
                        </option>

                        <option value="A2">
                            A2 — Elementary
                        </option>

                        <option value="B1">
                            B1 — Intermediate
                        </option>

                        <option value="B2">
                            B2 — Upper Intermediate
                        </option>

                        <option value="Not sure">
                            Not sure — Help me choose
                        </option>

                    </select>

                </div>

                <div class="registration-field">

                    <label for="intakeSchedule">
                        Intake Schedule *
                    </label>

                    <select
                        id="intakeSchedule"
                        name="intakeSchedule"
                        required
                    >

                        <option value="">
                            Select your schedule
                        </option>

                        <option value="Morning">
                            Morning
                        </option>

                        <option value="Evening">
                            Evening
                        </option>

                        <option value="Weekend">
                            Weekend
                        </option>

                    </select>

                </div>

                <div class="registration-field">

                    <label for="intakeDate">
                        Intake Date
                    </label>

                    <input
                        type="text"
                        id="intakeDate"
                        name="intakeDate"
                        value="October 5, 2026"
                        readonly
                    >

                </div>

                <div class="registration-field">

                    <label for="studentMessage">
                        Message
                    </label>

                    <textarea
                        id="studentMessage"
                        name="studentMessage"
                        placeholder="Tell us anything important about your learning goals..."
                    ></textarea>

                </div>

                <div class="registration-note">

                    <span class="registration-note-icon">
                        i
                    </span>

                    <span>
                        After clicking the button,
                        WhatsApp will open with your
                        registration details ready to send
                        to LINGUA DEUTSCH CONNECT.
                    </span>

                </div>

                <button
                    type="submit"
                    class="registration-submit"
                >

                    Send Registration on WhatsApp

                    <span>
                        ↗
                    </span>

                </button>

            </form>

            <div
                class="registration-success"
                id="registrationSuccess"
            >

                <div class="registration-success-icon">
                    ✓
                </div>

                <h3>
                    Registration ready!
                </h3>

                <p>
                    WhatsApp should now open with your
                    registration message. Send the message
                    to complete your registration request.
                </p>

            </div>

        </div>
    `;

    document.body.appendChild(
        registrationModal
    );


    const backdrop =
        registrationModal.querySelector(
            ".registration-backdrop"
        );

    const closeButton =
        registrationModal.querySelector(
            ".registration-close"
        );

    const form =
        registrationModal.querySelector(
            "#registrationForm"
        );

    const success =
        registrationModal.querySelector(
            "#registrationSuccess"
        );


    closeButton.addEventListener(
        "click",
        closeRegistration
    );

    backdrop.addEventListener(
        "click",
        closeRegistration
    );


    form.addEventListener(
        "submit",
        handleRegistrationSubmit
    );


    registrationModal.setCourse =
        (course) => {

            const select =
                registrationModal.querySelector(
                    "#desiredCourse"
                );

            if (
                select &&
                [
                    "A1",
                    "A2",
                    "B1",
                    "B2"
                ].includes(course)
            ) {

                select.value = course;

            }

        };


    registrationModal.setIntake =
        (schedule, date) => {

            const scheduleSelect =
                registrationModal.querySelector(
                    "#intakeSchedule"
                );

            const dateInput =
                registrationModal.querySelector(
                    "#intakeDate"
                );


            if (
                scheduleSelect &&
                [
                    "Morning",
                    "Evening",
                    "Weekend"
                ].includes(schedule)
            ) {

                scheduleSelect.value =
                    schedule;

            }


            if (dateInput && date) {

                dateInput.value =
                    date;

            }

        };

}


function closeRegistration() {

    if (!registrationModal) return;

    registrationModal.classList.remove("open");

    document.body.classList.remove(
        "registration-open"
    );

    document.body.classList.remove(
        "modal-open"
    );

}


function handleRegistrationSubmit(event) {

    event.preventDefault();

    if (!registrationModal) return;


    const name =
        registrationModal
            .querySelector("#studentName")
            .value
            .trim();

    const phone =
        registrationModal
            .querySelector("#studentPhone")
            .value
            .trim();

    const email =
        registrationModal
            .querySelector("#studentEmail")
            .value
            .trim();

    const currentLevel =
        registrationModal
            .querySelector("#currentLevel")
            .value;

    const course =
        registrationModal
            .querySelector("#desiredCourse")
            .value;

    const schedule =
        registrationModal
            .querySelector("#intakeSchedule")
            .value;

    const date =
        registrationModal
            .querySelector("#intakeDate")
            .value;

    const message =
        registrationModal
            .querySelector("#studentMessage")
            .value
            .trim();


    const whatsappMessage =

`🇩🇪 *NEW REGISTRATION — LINGUA DEUTSCH CONNECT*

👤 *Full Name:* ${name}

📱 *WhatsApp / Phone:* ${phone}

📧 *Email:* ${email || "Not provided"}

📚 *Current German Level:* ${currentLevel}

🎯 *Course Interested In:* ${course}

📅 *Intake:* ${date}

🕐 *Schedule:* ${schedule}

💬 *Message:*
${message || "No additional message."}

━━━━━━━━━━━━━━━━━━
LINGUA DEUTSCH CONNECT
Kigali, Rwanda`;


    const whatsappURL =
        "https://wa.me/250788517961?text=" +
        encodeURIComponent(
            whatsappMessage
        );


    const form =
        registrationModal.querySelector(
            "#registrationForm"
        );

    const success =
        registrationModal.querySelector(
            "#registrationSuccess"
        );


    if (form) {

        form.style.display =
            "none";

    }


    if (success) {

        success.classList.add("show");

    }


    window.open(
        whatsappURL,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =====================================================
   OPEN REGISTRATION
===================================================== */

function openRegistration(
    selectedCourse = "",
    selectedSchedule = "",
    selectedDate = "October 5, 2026"
) {

    createRegistrationModal();


    const form =
        registrationModal.querySelector(
            "#registrationForm"
        );

    const success =
        registrationModal.querySelector(
            "#registrationSuccess"
        );

    const courseSelect =
        registrationModal.querySelector(
            "#desiredCourse"
        );

    const scheduleSelect =
        registrationModal.querySelector(
            "#intakeSchedule"
        );

    const dateInput =
        registrationModal.querySelector(
            "#intakeDate"
        );


    /*
     * Reset everything first.
     */

    if (form) {

        form.reset();

        form.style.display =
            "flex";

    }


    if (success) {

        success.classList.remove(
            "show"
        );

    }


    /*
     * Check if the level test stored
     * a recommended course.
     */

    let courseToSelect =
        selectedCourse || "";


    if (!courseToSelect) {

        const savedCourse =
            localStorage.getItem(
                "ldcRegistrationCourse"
            );


        if (
            [
                "A1",
                "A2",
                "B1",
                "B2"
            ].includes(savedCourse)
        ) {

            courseToSelect =
                savedCourse;

        }

    }


    if (
        courseSelect &&
        [
            "A1",
            "A2",
            "B1",
            "B2"
        ].includes(courseToSelect)
    ) {

        courseSelect.value =
            courseToSelect;

    }


    /*
     * Intake schedule.
     */

    if (
        scheduleSelect &&
        [
            "Morning",
            "Evening",
            "Weekend"
        ].includes(selectedSchedule)
    ) {

        scheduleSelect.value =
            selectedSchedule;

    }


    /*
     * Intake date.
     */

    if (dateInput) {

        dateInput.value =
            selectedDate ||
            "October 5, 2026";

    }


    /*
     * Open modal.
     */

    registrationModal.classList.add(
        "open"
    );

    document.body.classList.add(
        "registration-open"
    );

    document.body.classList.add(
        "modal-open"
    );


    closeMobileMenu();


    /*
     * Course information from level test
     * should only be used once.
     */

    localStorage.removeItem(
        "ldcRegistrationCourse"
    );


    setTimeout(() => {

        const nameInput =
            registrationModal.querySelector(
                "#studentName"
            );

        if (nameInput) {

            nameInput.focus();

        }

    }, 150);

}


/* =====================================================
   START LEARNING LINKS
===================================================== */

const registrationLinks =
    document.querySelectorAll(
        '[data-open-registration], a[href="#start-learning"]'
    );


registrationLinks.forEach((link) => {

    link.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            closeMobileMenu();

            openRegistration();

        }
    );

});


/* =====================================================
   INTAKE REGISTER BUTTONS
===================================================== */

const intakeButtons =
    document.querySelectorAll(
        ".intake-register"
    );


intakeButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            const schedule =
                button.dataset.intakeSchedule ||
                button.dataset.schedule ||
                "";

            const date =
                button.dataset.intakeDate ||
                button.dataset.date ||
                "October 5, 2026";


            openRegistration(
                "",
                schedule,
                date
            );

        }
    );

});


/* =====================================================
   OPPORTUNITY DATA
===================================================== */

const opportunityData = {

    ausbildung: {

        title:
            "Ausbildung",

        label:
            "VOCATIONAL TRAINING",

        description:
            "Ausbildung is a vocational training pathway in Germany that combines practical training in a company with vocational school education. It is available in many different professions.",

        points: [

            "Practical workplace training",
            "Vocational school education",
            "Many professions and industries",
            "German language is important for communication and training"

        ]

    },


    aupair: {

        title:
            "Au Pair",

        label:
            "CULTURAL EXCHANGE",

        description:
            "An Au Pair arrangement allows young people to live with a host family in Germany, help with childcare and experience German family life and culture.",

        points: [

            "Live with a host family",
            "Help with childcare",
            "Experience everyday German life",
            "Cultural and language exchange"

        ]

    },


    studium: {

        title:
            "Studium",

        label:
            "HIGHER EDUCATION",

        description:
            "Studium means university or higher education study. Germany offers a wide range of academic programmes at universities and other higher education institutions.",

        points: [

            "Bachelor's programmes",
            "Master's programmes",
            "Academic and professional development",
            "German or English-taught programmes may be available depending on the institution"

        ]

    },


    work: {

        title:
            "Work",

        label:
            "PROFESSIONAL CAREER",

        description:
            "Germany offers professional pathways across many industries. Strong German communication skills can be useful when working with colleagues, customers and employers.",

        points: [

            "Professional communication",
            "Workplace vocabulary",
            "Industry-specific language",
            "Preparation for everyday professional situations"

        ]

    },


    freiwilligendienst: {

        title:
            "Freiwilligendienst",

        label:
            "VOLUNTEERING",

        description:
            "Freiwilligendienst refers to structured voluntary service opportunities. Examples include FSJ and BFD, depending on the programme and eligibility requirements.",

        points: [

            "Social and community service",
            "Education and care",
            "Culture and environmental projects",
            "Practical experience and personal development"

        ]

    }

};


/* =====================================================
   OPPORTUNITY MODAL
===================================================== */

const opportunityButtons =
    document.querySelectorAll(
        ".opportunity-button"
    );

let opportunityModal = null;


if (opportunityButtons.length > 0) {

    opportunityModal =
        document.createElement("div");

    opportunityModal.className =
        "opportunity-modal";

    opportunityModal.innerHTML = `

        <div class="opportunity-modal-backdrop"></div>

        <div
            class="opportunity-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="opportunityModalTitle"
        >

            <button
                type="button"
                class="opportunity-modal-close"
                aria-label="Close opportunity details"
            >
                ×
            </button>

            <div class="opportunity-modal-top">

                <span
                    class="opportunity-modal-label"
                >
                    GERMANY
                </span>

            </div>

            <div class="opportunity-modal-content">

                <span
                    class="opportunity-modal-category"
                    id="opportunityModalCategory"
                >
                    VOCATIONAL TRAINING
                </span>

                <h2 id="opportunityModalTitle">
                    Ausbildung
                </h2>

                <p id="opportunityModalDescription">
                    Learn more about this pathway.
                </p>

                <div class="opportunity-modal-divider"></div>

                <span class="opportunity-modal-heading">
                    KEY INFORMATION
                </span>

                <div id="opportunityModalPoints"></div>

            </div>

            <a
                href="#start-learning"
                class="opportunity-modal-cta"
                id="opportunityModalCta"
            >

                Start Learning German

                <span>
                    ↗
                </span>

            </a>

        </div>
    `;

    document.body.appendChild(
        opportunityModal
    );

}


function openOpportunityModal(
    opportunityKey
) {

    if (!opportunityModal) return;

    const opportunity =
        opportunityData[opportunityKey];

    if (!opportunity) return;


    const category =
        opportunityModal.querySelector(
            "#opportunityModalCategory"
        );

    const title =
        opportunityModal.querySelector(
            "#opportunityModalTitle"
        );

    const description =
        opportunityModal.querySelector(
            "#opportunityModalDescription"
        );

    const points =
        opportunityModal.querySelector(
            "#opportunityModalPoints"
        );


    category.textContent =
        opportunity.label;

    title.textContent =
        opportunity.title;

    description.textContent =
        opportunity.description;

    points.innerHTML =
        opportunity.points
            .map(
                (point) => `

                    <div class="modal-topic">

                        <span>
                            ✓
                        </span>

                        <p>
                            ${point}
                        </p>

                    </div>

                `
            )
            .join("");


    opportunityModal.classList.add(
        "open"
    );

    document.body.classList.add(
        "modal-open"
    );

    closeMobileMenu();


    setTimeout(() => {

        const closeButton =
            opportunityModal.querySelector(
                ".opportunity-modal-close"
            );

        if (closeButton) {

            closeButton.focus();

        }

    }, 100);

}


function closeOpportunityModal() {

    if (!opportunityModal) return;

    opportunityModal.classList.remove(
        "open"
    );

    document.body.classList.remove(
        "modal-open"
    );

}


opportunityButtons.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            openOpportunityModal(
                button.dataset.opportunity
            );

        }
    );

});


if (opportunityModal) {

    const backdrop =
        opportunityModal.querySelector(
            ".opportunity-modal-backdrop"
        );

    const closeButton =
        opportunityModal.querySelector(
            ".opportunity-modal-close"
        );

    const cta =
        opportunityModal.querySelector(
            "#opportunityModalCta"
        );


    closeButton.addEventListener(
        "click",
        closeOpportunityModal
    );


    backdrop.addEventListener(
        "click",
        closeOpportunityModal
    );


    cta.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            closeOpportunityModal();

            openRegistration();

        }
    );

}


/* =====================================================
   ESCAPE KEY — CLOSE ALL MODALS
===================================================== */

document.addEventListener(
    "keydown",
    (event) => {

        if (event.key !== "Escape") {

            return;

        }


        if (
            courseModal &&
            courseModal.classList.contains("open")
        ) {

            closeCourseModal();

            return;

        }


        if (
            opportunityModal &&
            opportunityModal.classList.contains("open")
        ) {

            closeOpportunityModal();

            return;

        }


        if (
            registrationModal &&
            registrationModal.classList.contains("open")
        ) {

            closeRegistration();

        }

    }
);


/* =====================================================
   FOOTER YEAR
===================================================== */

const yearElement =
    document.querySelector(
        "#current-year"
    );


if (yearElement) {

    yearElement.textContent =
        new Date().getFullYear();

}


/* =====================================================
   LEVEL TEST → REGISTRATION
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const savedCourse =
            localStorage.getItem(
                "ldcRegistrationCourse"
            );

        const cameFromLevelTest =
            window.location.hash ===
            "#start-learning";


        if (
            cameFromLevelTest &&
            [
                "A1",
                "A2",
                "B1",
                "B2"
            ].includes(savedCourse)
        ) {

            setTimeout(() => {

                openRegistration(
                    savedCourse
                );

            }, 350);

        }

    }
);


/* =====================================================
   RESET HASH AFTER LEVEL TEST REGISTRATION
===================================================== */

window.addEventListener(
    "load",
    () => {

        if (
            window.location.hash ===
            "#start-learning"
        ) {

            /*
             * Keep the hash long enough for the
             * registration modal to open, then
             * remove it from the URL.
             */

            setTimeout(() => {

                if (
                    history.replaceState
                ) {

                    history.replaceState(
                        null,
                        "",
                        window.location.pathname +
                        window.location.search
                    );

                }

            }, 800);

        }

    }
);
/* =====================================================
   STUDENT REVIEWS
===================================================== */

(function () {
    const list = document.getElementById("reviewsList");
    const form = document.getElementById("reviewForm");
    const feedback = document.getElementById("reviewFeedback");

    if (!list || !form) return;

   // Change 3000 if your backend uses another port.
// When the site is served by Express itself, the base stays empty.
const API_BASE =
    window.LDC_API_BASE ||
    (location.port && location.port !== "3000" ? "http://localhost:3000" : "");

const API_URL = API_BASE + "/api/reviews";

    function setFeedback(text, type) {
        feedback.textContent = text;
        feedback.className = "review-feedback " + (type || "");
    }

    function renderReviews(reviews) {
        list.innerHTML = "";

        if (!reviews.length) {
            const empty = document.createElement("p");
            empty.className = "reviews-empty";
            empty.textContent = "No reviews yet. Be the first to share your experience!";
            list.appendChild(empty);
            return;
        }

        reviews.forEach(function (review) {
            const card = document.createElement("article");
            card.className = "review-card";

            const top = document.createElement("div");
            top.className = "review-card-top";

            const who = document.createElement("div");

            const author = document.createElement("span");
            author.className = "review-author";
            author.textContent = review.name;
            who.appendChild(author);

            if (review.level) {
                const level = document.createElement("span");
                level.className = "review-level";
                level.textContent = review.level;
                who.appendChild(level);
            }

            const rating = Math.max(1, Math.min(5, Number(review.rating) || 5));
            const stars = document.createElement("span");
            stars.className = "review-stars";
            stars.setAttribute("aria-label", rating + " out of 5 stars");
            stars.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);

            top.appendChild(who);
            top.appendChild(stars);

            const text = document.createElement("p");
            text.textContent = review.message;

            card.appendChild(top);
            card.appendChild(text);

            if (review.created_at) {
                const date = document.createElement("span");
                date.className = "review-date";
                date.textContent = new Date(review.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                });
                card.appendChild(date);
            }

            list.appendChild(card);
        });
    }

    async function loadReviews() {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error("Request failed");
            const data = await res.json();
            renderReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            list.innerHTML = "";
            const msg = document.createElement("p");
            msg.className = "reviews-empty";
            msg.textContent = "Reviews are currently unavailable. Please try again later.";
            list.appendChild(msg);
        }
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = form.name.value.trim();
        const level = form.level.value;
        const message = form.message.value.trim();
        const ratingInput = form.querySelector('input[name="rating"]:checked');
        const rating = ratingInput ? Number(ratingInput.value) : 0;

        if (!name || !level || !rating || message.length < 10) {
            setFeedback("Please fill in all fields, choose a rating and write at least 10 characters.", "error");
            return;
        }

        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        setFeedback("Sending...", "");

        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, level, rating, message })
            });

            if (!res.ok) throw new Error("Request failed");

            form.reset();
            setFeedback("Thank you! Your review will appear after approval.", "success");
       } catch (err) {
    console.error("Review error:", err);
    setFeedback("Could not reach the server. Make sure the backend is running.", "error");
}finally {
            button.disabled = false;
        }
    });

    loadReviews();
})();
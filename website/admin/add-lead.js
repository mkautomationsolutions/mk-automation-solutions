const supabaseClient =
    window.mkSupabase;


/* =================================
   DOM ELEMENTS
================================= */

const addLeadForm =
    document.getElementById(
        "add-lead-form"
    );

const nameInput =
    document.getElementById(
        "lead-name"
    );

const emailInput =
    document.getElementById(
        "lead-email"
    );

const phoneInput =
    document.getElementById(
        "lead-phone"
    );

const companyInput =
    document.getElementById(
        "lead-company"
    );

const serviceInput =
    document.getElementById(
        "lead-service"
    );

const sourceInput =
    document.getElementById(
        "lead-source"
    );

const priorityInput =
    document.getElementById(
        "lead-priority"
    );

const assignedToInput =
    document.getElementById(
        "lead-assigned-to"
    );

const assignmentFieldHelp =
    document.getElementById(
        "add-assignment-field-help"
    );


const statusInput =
    document.getElementById(
        "lead-status"
    );

const followUpInput =
    document.getElementById(
        "lead-follow-up"
    );

const messageInput =
    document.getElementById(
        "lead-message"
    );

const notesInput =
    document.getElementById(
        "lead-notes"
    );

const formMessage =
    document.getElementById(
        "add-lead-message"
    );

const saveLeadButton =
    document.getElementById(
        "save-lead-btn"
    );

const resetFormButton =
    document.getElementById(
        "reset-lead-form-btn"
    );

const logoutButton =
    document.getElementById(
        "logout-btn"
    );


/* =================================
   PAGE STATE
================================= */

let teamMembers = [];

let canManageAssignments = false;

let currentTeamMemberId = null;


/* =================================
   AUTHENTICATION
================================= */

async function protectAddLeadPage() {

    const {
        data: { session },
        error
    } =
        await supabaseClient.auth
            .getSession();


    if (error) {

        console.error(
            "Unable to verify login session:",
            error
        );

        window.location.replace(
            "login.html"
        );

        return false;

    }


    if (!session) {

        window.location.replace(
            "login.html"
        );

        return false;

    }


    return true;

}


/* =================================
   HELPER FUNCTIONS
================================= */

function normalizeEmail(value) {

    return String(value || "")
        .trim()
        .toLowerCase();

}


function getPhoneDigits(value) {

    return String(value || "")
        .replace(/\D/g, "");

}


function normalizePhone(value) {

    const originalValue =
        String(value || "").trim();

    const digits =
        getPhoneDigits(
            originalValue
        );


    if (!digits) {
        return "";
    }


    if (
        originalValue.startsWith("+")
    ) {

        return `+${digits}`;

    }


    return digits;

}


function isValidEmail(value) {

    if (!value) {
        return true;
    }


    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(value);

}


function toDateTimeLocalValue(date) {

    const timezoneOffset =
        date.getTimezoneOffset();


    const localDate =
        new Date(
            date.getTime() -
            timezoneOffset * 60 * 1000
        );


    return localDate
        .toISOString()
        .slice(0, 16);

}


/* =================================
   FORM MESSAGE
================================= */

function showFormMessage(
    message,
    type
) {

    formMessage.textContent =
        message;


    formMessage.className =
        `add-lead-message show ${type}`;

}


function clearFormMessage() {

    formMessage.textContent =
        "";


    formMessage.className =
        "add-lead-message";

}


/* =================================
   FIELD VALIDATION DISPLAY
================================= */

function getFormGroup(input) {

    return input.closest(
        ".form-group"
    );

}


function showFieldError(
    input,
    message
) {

    const formGroup =
        getFormGroup(input);


    if (!formGroup) {
        return;
    }


    formGroup.classList.add(
        "has-error"
    );


    const errorElement =
        formGroup.querySelector(
            ".field-error"
        );


    if (errorElement) {

        errorElement.textContent =
            message;

    }

}


function clearFieldError(input) {

    const formGroup =
        getFormGroup(input);


    if (!formGroup) {
        return;
    }


    formGroup.classList.remove(
        "has-error"
    );


    const errorElement =
        formGroup.querySelector(
            ".field-error"
        );


    if (errorElement) {

        errorElement.textContent =
            "";

    }

}


function clearAllFieldErrors() {

    addLeadForm
        .querySelectorAll(
            ".form-group"
        )
        .forEach((formGroup) => {

            formGroup.classList.remove(
                "has-error"
            );


            const errorElement =
                formGroup.querySelector(
                    ".field-error"
                );


            if (errorElement) {

                errorElement.textContent =
                    "";

            }

        });

}


/* =================================
   LEAD ASSIGNMENT
================================= */

function escapeAssignmentHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function populateAssignmentOptions() {

    const activeMembers =
        teamMembers.filter(
            member =>
                member.status === "active"
        );


    if (canManageAssignments) {

        assignedToInput.innerHTML = `
            <option value="">
                Unassigned
            </option>

            ${activeMembers
                .map(
                    member => `
                        <option value="${escapeAssignmentHtml(member.id)}">
                            ${escapeAssignmentHtml(member.full_name)}
                            — ${escapeAssignmentHtml(member.role)}
                        </option>
                    `
                )
                .join("")
            }
        `;


        assignedToInput.disabled =
            false;


        assignmentFieldHelp.textContent =
            "Assign this lead now or leave it unassigned.";


        return;

    }


    const currentMember =
        teamMembers.find(
            member =>
                String(member.id) ===
                String(currentTeamMemberId)
        );


    assignedToInput.innerHTML =
        currentMember
            ? `
                <option value="${escapeAssignmentHtml(currentMember.id)}">
                    ${escapeAssignmentHtml(currentMember.full_name)}
                </option>
            `
            : `
                <option value="">
                    Assignment unavailable
                </option>
            `;


    assignedToInput.value =
        currentMember?.id || "";


    assignedToInput.disabled =
        true;


    assignmentFieldHelp.textContent =
        currentMember
            ? "New leads created by you are assigned to your account."
            : "Your CRM team account is not connected. Contact the administrator.";

}


async function loadAssignmentContext() {

    const accessContext =
        window.crmAccess?.sessionUser
            ? window.crmAccess
            : typeof window.loadCrmAccessContext === "function"
                ? await window.loadCrmAccessContext()
                : null;


    canManageAssignments =
        accessContext?.canManage === true;


    currentTeamMemberId =
        accessContext?.currentMember?.id ||
        null;


    const { data, error } =
        await supabaseClient
            .from("team_members")
            .select(`
                id,
                full_name,
                role,
                status
            `)
            .order(
                "full_name",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Unable to load assignment options:",
            error
        );

        teamMembers = [];

    } else {

        teamMembers =
            data ?? [];

    }


    populateAssignmentOptions();

}


function resetAssignmentSelection() {

    if (canManageAssignments) {

        assignedToInput.value =
            "";

    } else {

        assignedToInput.value =
            currentTeamMemberId ||
            "";

    }

}


/* =================================
   DEFAULT FOLLOW-UP
================================= */

function setDefaultFollowUpDate() {

    if (followUpInput.value) {
        return;
    }


    const configuredDays =
        Number(
            window.crmSettings
                ?.default_followup_days
        );


    const defaultDays =
        Number.isFinite(
            configuredDays
        )
            ? Math.max(
                0,
                configuredDays
            )
            : 2;


    const followUpDate =
        new Date();


    followUpDate.setDate(
        followUpDate.getDate() +
        defaultDays
    );


    followUpDate.setSeconds(
        0,
        0
    );


    const currentMinutes =
        followUpDate.getMinutes();


    const roundedMinutes =
        Math.ceil(
            currentMinutes / 15
        ) * 15;


    if (roundedMinutes === 60) {

        followUpDate.setHours(
            followUpDate.getHours() + 1,
            0,
            0,
            0
        );

    } else {

        followUpDate.setMinutes(
            roundedMinutes,
            0,
            0
        );

    }


    followUpInput.value =
        toDateTimeLocalValue(
            followUpDate
        );

}


/* =================================
   GET FORM VALUES
================================= */

function getFormValues() {

    const followUpDate =
        followUpInput.value
            ? new Date(
                followUpInput.value
            )
            : null;


    return {

        name:
            nameInput.value.trim(),

        email:
            normalizeEmail(
                emailInput.value
            ),

        phone:
            normalizePhone(
                phoneInput.value
            ),

        phoneDigits:
            getPhoneDigits(
                phoneInput.value
            ),

        company:
            companyInput.value.trim(),

        service:
            serviceInput.value,

        leadSource:
            sourceInput.value,

        priority:
            priorityInput.value,

        assignedTo:
            assignedToInput.value,

        status:
            statusInput.value,

        followUpDate,

        message:
            messageInput.value.trim(),

        notes:
            notesInput.value.trim()

    };

}


/* =================================
   VALIDATE FORM
================================= */

function validateForm(values) {

    clearAllFieldErrors();

    clearFormMessage();


    let isValid = true;


    if (
        values.name.length < 2
    ) {

        showFieldError(
            nameInput,
            "Enter a valid customer name."
        );

        isValid = false;

    }


    if (
        values.email &&
        !isValidEmail(values.email)
    ) {

        showFieldError(
            emailInput,
            "Enter a valid email address."
        );

        isValid = false;

    }


    if (
        values.phoneDigits.length < 10 ||
        values.phoneDigits.length > 15
    ) {

        showFieldError(
            phoneInput,
            "Enter a valid phone number containing 10 to 15 digits."
        );

        isValid = false;

    }


    if (!values.service) {

        showFieldError(
            serviceInput,
            "Select the required service."
        );

        isValid = false;

    }


    if (!values.leadSource) {

        showFieldError(
            sourceInput,
            "Select the lead source."
        );

        isValid = false;

    }


    if (
        ![
            "low",
            "medium",
            "high"
        ].includes(
            values.priority
        )
    ) {

        showFieldError(
            priorityInput,
            "Select a valid priority."
        );

        isValid = false;

    }


    if (
        ![
            "new",
            "contacted",
            "converted"
        ].includes(
            values.status
        )
    ) {

        showFieldError(
            statusInput,
            "Select a valid status."
        );

        isValid = false;

    }


    if (
        values.followUpDate &&
        Number.isNaN(
            values.followUpDate
                .getTime()
        )
    ) {

        showFieldError(
            followUpInput,
            "Select a valid follow-up date."
        );

        isValid = false;

    }


    if (
        values.followUpDate &&
        values.followUpDate.getTime() <
            Date.now() - 60000
    ) {

        showFieldError(
            followUpInput,
            "Follow-up date cannot be in the past."
        );

        isValid = false;

    }


    if (!isValid) {

        showFormMessage(
            "Please correct the highlighted fields.",
            "error"
        );

    }


    return isValid;

}


/* =================================
   DUPLICATE CHECK
================================= */

async function findDuplicateLead(
    values
) {

    const { data, error } =
        await supabaseClient
            .from("Leads")
            .select(`
                id,
                name,
                email,
                phone
            `);


    if (error) {

        console.error(
            "Unable to check duplicate leads:",
            error
        );


        throw error;

    }


    const existingLeads =
        data ?? [];


    const duplicatePhone =
        existingLeads.find(
            lead =>
                getPhoneDigits(
                    lead.phone
                ) ===
                values.phoneDigits
        );


    const duplicateEmail =
        values.email
            ? existingLeads.find(
                lead =>
                    normalizeEmail(
                        lead.email
                    ) ===
                    values.email
            )
            : null;


    return {
        duplicatePhone,
        duplicateEmail
    };

}


/* =================================
   DISABLE / ENABLE FORM
================================= */

function setFormSavingState(
    isSaving
) {

    saveLeadButton.disabled =
        isSaving;


    resetFormButton.disabled =
        isSaving;


    assignedToInput.disabled =
        isSaving ||
        !canManageAssignments;


    saveLeadButton.textContent =
        isSaving
            ? "Saving..."
            : "Save Lead";

}


/* =================================
   SAVE LEAD
================================= */

async function saveLead(event) {

    event.preventDefault();


    const values =
        getFormValues();


    const formIsValid =
        validateForm(values);


    if (!formIsValid) {
        return;
    }


    setFormSavingState(
        true
    );


    showFormMessage(
        "Checking customer details...",
        "info"
    );


    try {

        const {
            duplicatePhone,
            duplicateEmail
        } =
            await findDuplicateLead(
                values
            );


        if (
            duplicatePhone ||
            duplicateEmail
        ) {

            if (duplicatePhone) {

                showFieldError(
                    phoneInput,
                    `This phone number already exists for ${
                        duplicatePhone.name ||
                        "another lead"
                    }.`
                );

            }


            if (duplicateEmail) {

                showFieldError(
                    emailInput,
                    `This email already exists for ${
                        duplicateEmail.name ||
                        "another lead"
                    }.`
                );

            }


            showFormMessage(
                "A lead with the same phone number or email already exists.",
                "error"
            );


            setFormSavingState(
                false
            );


            return;

        }


        showFormMessage(
            "Saving new lead...",
            "info"
        );


        const leadRecord = {

            name:
                values.name,

            email:
                values.email || null,

            phone:
                values.phone,

            company:
                values.company || null,

            service:
                values.service,

            lead_source:
                values.leadSource,

            priority:
                values.priority,

            status:
                values.status,

            message:
                values.message || null,

            notes:
                values.notes || null,

            follow_up_at:
                values.followUpDate
                    ? values.followUpDate
                        .toISOString()
                    : null,

            assigned_to:
                values.assignedTo ||
                null,

            assigned_by:
                values.assignedTo
                    ? currentTeamMemberId
                    : null,

            assigned_at:
                values.assignedTo
                    ? new Date()
                        .toISOString()
                    : null

        };


        const { data, error } =
            await supabaseClient
                .from("Leads")
                .insert(
                    leadRecord
                )
                .select(
                    "id"
                )
                .single();


        if (error) {

            console.error(
                "Unable to save lead:",
                error
            );


            showFormMessage(
                `Unable to save lead: ${error.message}`,
                "error"
            );


            setFormSavingState(
                false
            );


            return;

        }


        showFormMessage(
            `Lead saved successfully. Lead ID: ${data.id}`,
            "success"
        );


        addLeadForm.reset();


        priorityInput.value =
            "medium";


        statusInput.value =
            "new";


        resetAssignmentSelection();


        clearAllFieldErrors();


        setFormSavingState(
            false
        );


        window.setTimeout(
            () => {

                window.location.href =
                    "leads.html";

            },
            1200
        );

    } catch (error) {

        console.error(
            "Unexpected lead creation error:",
            error
        );


        showFormMessage(
            "Unable to complete the request. Please try again.",
            "error"
        );


        setFormSavingState(
            false
        );

    }

}


/* =================================
   RESET FORM
================================= */

function handleFormReset() {

    window.setTimeout(
        () => {

            clearAllFieldErrors();

            clearFormMessage();


            priorityInput.value =
                "medium";


            statusInput.value =
                "new";


            resetAssignmentSelection();


            setDefaultFollowUpDate();

        },
        0
    );

}


/* =================================
   CLEAR INDIVIDUAL ERRORS
================================= */

function registerFieldListeners() {

    const fields = [

        nameInput,
        emailInput,
        phoneInput,
        companyInput,
        serviceInput,
        sourceInput,
        priorityInput,
        assignedToInput,
        statusInput,
        followUpInput,
        messageInput,
        notesInput

    ];


    fields.forEach(
        (field) => {

            field.addEventListener(
                "input",
                () =>
                    clearFieldError(
                        field
                    )
            );


            field.addEventListener(
                "change",
                () =>
                    clearFieldError(
                        field
                    )
            );

        }
    );

}


/* =================================
   LOGOUT
================================= */

async function logout() {

    const { error } =
        await supabaseClient.auth
            .signOut();


    if (error) {

        console.error(
            "Logout failed:",
            error
        );

        return;

    }


    window.location.replace(
        "login.html"
    );

}


/* =================================
   INITIALISE PAGE
================================= */

async function initialiseAddLeadPage() {

    const isAuthenticated =
        await protectAddLeadPage();


    if (!isAuthenticated) {
        return;
    }


    await window
        .loadAndApplyCrmSettings();


    await loadAssignmentContext();


    setDefaultFollowUpDate();

    registerFieldListeners();

}


/* =================================
   EVENT LISTENERS
================================= */

addLeadForm.addEventListener(
    "submit",
    saveLead
);


addLeadForm.addEventListener(
    "reset",
    handleFormReset
);


logoutButton.addEventListener(
    "click",
    logout
);


initialiseAddLeadPage()
    .finally(() => {

        window.finishCrmPageLoading?.();

    });
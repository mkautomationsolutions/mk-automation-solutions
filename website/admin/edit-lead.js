const supabaseClient =
    window.mkSupabase;


/* =================================
   DOM ELEMENTS
================================= */

const editLeadLoading =
    document.getElementById(
        "edit-lead-loading"
    );

const editLeadForm =
    document.getElementById(
        "edit-lead-form"
    );

const editLeadHeading =
    document.getElementById(
        "edit-lead-heading"
    );

const nameInput =
    document.getElementById(
        "edit-lead-name"
    );

const emailInput =
    document.getElementById(
        "edit-lead-email"
    );

const phoneInput =
    document.getElementById(
        "edit-lead-phone"
    );

const companyInput =
    document.getElementById(
        "edit-lead-company"
    );

const serviceInput =
    document.getElementById(
        "edit-lead-service"
    );

const sourceInput =
    document.getElementById(
        "edit-lead-source"
    );

const priorityInput =
    document.getElementById(
        "edit-lead-priority"
    );

const assignedToInput =
    document.getElementById(
        "edit-lead-assigned-to"
    );

const assignmentFieldHelp =
    document.getElementById(
        "assignment-field-help"
    );

const assignmentCard =
    document.getElementById(
        "lead-assignment-card"
    );

const assignmentMemberName =
    document.getElementById(
        "assignment-member-name"
    );

const assignmentMemberDetails =
    document.getElementById(
        "assignment-member-details"
    );

const assignmentDateElement =
    document.getElementById(
        "assignment-date"
    );


const statusInput =
    document.getElementById(
        "edit-lead-status"
    );

const followUpInput =
    document.getElementById(
        "edit-lead-follow-up"
    );

const messageInput =
    document.getElementById(
        "edit-lead-message"
    );

const notesInput =
    document.getElementById(
        "edit-lead-notes"
    );

const leadIdElement =
    document.getElementById(
        "edit-lead-id"
    );

const createdAtElement =
    document.getElementById(
        "edit-lead-created-at"
    );

const formMessage =
    document.getElementById(
        "edit-lead-message-box"
    );

const archiveLeadButton =
    document.getElementById(
        "archive-lead-btn"
    );

const saveChangesButton =
    document.getElementById(
        "save-lead-changes-btn"
    );

const logoutButton =
    document.getElementById(
        "logout-btn"
    );
    const activityLoading =
    document.getElementById(
        "activity-loading"
    );

const activityTimeline =
    document.getElementById(
        "activity-timeline"
    );

const refreshActivityButton =
    document.getElementById(
        "refresh-activity-btn"
    );


/* =================================
   PAGE STATE
================================= */

let activeLeadId = null;

let originalLead = null;

let teamMembers = [];

let canManageAssignments = false;

let currentTeamMemberId = null;


/* =================================
   AUTHENTICATION
================================= */

async function protectEditLeadPage() {

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
   URL LEAD ID
================================= */

function getLeadIdFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return (
        params.get("id") ||
        params.get("lead")
    );

}


/* =================================
   HELPERS
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
        String(value || "")
            .trim();


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


function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


function toDateTimeLocal(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }


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


function ensureSelectOption(
    selectElement,
    value
) {

    const normalizedValue =
        String(value || "")
            .trim();


    if (!normalizedValue) {
        return;
    }


    const optionExists =
        Array.from(
            selectElement.options
        )
            .some(
                option =>
                    option.value ===
                    normalizedValue
            );


    if (optionExists) {
        return;
    }


    const option =
        document.createElement(
            "option"
        );


    option.value =
        normalizedValue;


    option.textContent =
        normalizedValue
            .replaceAll("-", " ")
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );


    selectElement.appendChild(
        option
    );

}

/* =================================
   LEAD ASSIGNMENT HELPERS
================================= */

function getTeamMemberById(memberId) {

    if (!memberId) {
        return null;
    }


    return teamMembers.find(
        member =>
            String(member.id) ===
            String(memberId)
    ) || null;

}


function populateAssignmentOptions(
    selectedMemberId = ""
) {

    const selectedId =
        String(selectedMemberId || "");


    const selectableMembers =
        teamMembers.filter(
            member =>
                member.status === "active" ||
                String(member.id) === selectedId
        );


    assignedToInput.innerHTML = `
        <option value="">
            Unassigned
        </option>

        ${selectableMembers
            .map(
                member => `
                    <option
                        value="${escapeHtml(member.id)}"
                    >
                        ${escapeHtml(member.full_name)}
                        — ${escapeHtml(
                            formatMetadataLabel(member.role)
                        )}${
                            member.status !== "active"
                                ? " (Inactive)"
                                : ""
                        }
                    </option>
                `
            )
            .join("")
        }
    `;


    assignedToInput.value =
        selectedId;

}


function renderAssignmentCard(lead) {

    assignmentCard.hidden =
        false;


    const member =
        getTeamMemberById(
            lead.assigned_to
        );


    if (!lead.assigned_to) {

        assignmentMemberName.textContent =
            "Unassigned";

        assignmentMemberDetails.textContent =
            "This lead has not been assigned to a team member.";

        assignmentDateElement.textContent =
            "-";

        return;

    }


    assignmentMemberName.textContent =
        member?.full_name ||
        "Assigned team member";


    assignmentMemberDetails.textContent =
        member
            ? `${member.email} • ${formatMetadataLabel(member.role)}`
            : "The assigned team member is not available in the current directory.";


    assignmentDateElement.textContent =
        formatDate(
            lead.assigned_at
        );

}


async function loadAssignmentContext() {

    const accessContext =
        typeof window.loadCrmAccessContext === "function"
            ? await window.loadCrmAccessContext()
            : window.crmAccess;


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
                email,
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
            "Unable to load team members for assignment:",
            error
        );

        teamMembers = [];

    } else {

        teamMembers =
            data ?? [];

    }


    assignedToInput.disabled =
        !canManageAssignments;


    assignmentFieldHelp.textContent =
        canManageAssignments
            ? "Assign, reassign or unassign this lead."
            : "Assignment can be changed only by an administrator or manager.";

}


function getAssignmentUpdate(
    selectedMemberId
) {

    if (!canManageAssignments) {
        return {};
    }


    const previousMemberId =
        String(
            originalLead?.assigned_to ||
            ""
        );


    const nextMemberId =
        String(
            selectedMemberId ||
            ""
        );


    if (
        previousMemberId ===
        nextMemberId
    ) {
        return {};
    }


    return {

        assigned_to:
            nextMemberId || null,

        assigned_by:
            currentTeamMemberId,

        assigned_at:
            new Date()
                .toISOString()

    };

}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function getActivityTitle(
    activityType
) {

    const titles = {

        lead_created:
            "Lead Created",

        history_started:
            "Activity History Started",

        status_changed:
            "Status Changed",

        followup_scheduled:
            "Follow-up Scheduled",

        followup_rescheduled:
            "Follow-up Rescheduled",

        followup_cleared:
            "Follow-up Cleared",

        notes_updated:
            "Notes Updated",

        lead_updated:
            "Lead Details Updated",

        lead_archived:
            "Lead Archived",

        lead_restored:
            "Lead Restored",

        lead_assigned:
            "Lead Assigned",

        lead_reassigned:
            "Lead Reassigned",

        lead_unassigned:
            "Lead Unassigned"

    };


    return (
        titles[activityType] ||
        "Lead Activity"
    );

}


function getActivityIcon(
    activityType
) {

    const icons = {

        lead_created: "➕",

        history_started: "🕘",

        status_changed: "🔄",

        followup_scheduled: "📅",

        followup_rescheduled: "⏰",

        followup_cleared: "✖",

        notes_updated: "📝",

        lead_updated: "✏️",

        lead_archived: "🗄️",

        lead_restored: "♻️",

        lead_assigned: "👤",

        lead_reassigned: "🔁",

        lead_unassigned: "➖"

    };


    return (
        icons[activityType] ||
        "•"
    );

}


function formatActivityDate(
    value
) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }


    return date.toLocaleString(
        "en-IN",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


function formatMetadataLabel(
    value
) {

    return String(value || "")
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


function formatMetadataValue(
    key,
    value
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }


    if (
        key.includes("at") ||
        key.includes("date")
    ) {

        const date =
            new Date(value);


        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return date.toLocaleString(
                "en-IN",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );

        }

    }


    return formatMetadataLabel(
        value
    );

}


/* =================================
   PAGE MESSAGE
================================= */

function showFormMessage(
    message,
    type
) {

    formMessage.textContent =
        message;


    formMessage.className =
        `edit-lead-message show ${type}`;

}


function clearFormMessage() {

    formMessage.textContent =
        "";


    formMessage.className =
        "edit-lead-message";

}


/* =================================
   FIELD ERRORS
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

    editLeadForm
        .querySelectorAll(
            ".form-group"
        )
        .forEach(
            formGroup => {

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
        );

}


/* =================================
   BUSY STATE
================================= */

function setBusyState(
    isBusy,
    action = "save"
) {

    saveChangesButton.disabled =
        isBusy;


    archiveLeadButton.disabled =
        isBusy;


    assignedToInput.disabled =
        isBusy ||
        !canManageAssignments;


    if (
        isBusy &&
        action === "archive"
    ) {

        archiveLeadButton.textContent =
            "Archiving...";

        saveChangesButton.textContent =
            "Save Changes";

        return;

    }


    if (
        isBusy &&
        action === "save"
    ) {

        saveChangesButton.textContent =
            "Saving...";

        archiveLeadButton.textContent =
            "Archive Lead";

        return;

    }


    saveChangesButton.textContent =
        "Save Changes";


    archiveLeadButton.textContent =
        "Archive Lead";

}


/* =================================
   SHOW LOADING ERROR
================================= */

function showLoadingError(message) {

    editLeadLoading.textContent =
        message;


    editLeadLoading.style.color =
        "#dc2626";


    editLeadLoading.style.borderColor =
        "#fecaca";


    editLeadLoading.style.background =
        "#fef2f2";

}


/* =================================
   POPULATE FORM
================================= */

function populateLeadForm(lead) {

    originalLead =
        lead;


    activeLeadId =
        lead.id;


    ensureSelectOption(
        serviceInput,
        lead.service
    );


    ensureSelectOption(
        sourceInput,
        lead.lead_source
    );


    nameInput.value =
        lead.name || "";


    emailInput.value =
        lead.email || "";


    phoneInput.value =
        lead.phone || "";


    companyInput.value =
        lead.company || "";


    serviceInput.value =
        lead.service || "";


    sourceInput.value =
        lead.lead_source ||
        "website";


    priorityInput.value =
        lead.priority ||
        "medium";


    populateAssignmentOptions(
        lead.assigned_to
    );


    assignedToInput.value =
        lead.assigned_to || "";


    renderAssignmentCard(
        lead
    );


    statusInput.value =
        lead.status ||
        "new";


    followUpInput.value =
        toDateTimeLocal(
            lead.follow_up_at
        );


    messageInput.value =
        lead.message || "";


    notesInput.value =
        lead.notes || "";


    leadIdElement.textContent =
        lead.id;


    createdAtElement.textContent =
        formatDate(
            lead.created_at
        );


    editLeadHeading.textContent =
        lead.name
            ? `Edit ${lead.name}`
            : `Edit Lead #${lead.id}`;


    editLeadLoading.hidden =
        true;


    editLeadForm.hidden =
        false;

}


/* =================================
   LOAD LEAD
================================= */

async function loadLead() {

    const leadId =
        getLeadIdFromUrl();


    if (!leadId) {

        showLoadingError(
            "Lead ID was not provided. Open this page from the Leads section."
        );

        return;

    }


    const { data, error } =
        await supabaseClient
            .from("Leads")
            .select(`
                id,
                name,
                email,
                phone,
                company,
                service,
                lead_source,
                priority,
                status,
                message,
                notes,
                follow_up_at,
                created_at,
                is_archived,
                archived_at,
                assigned_to,
                assigned_by,
                assigned_at
            `)
            .eq(
                "id",
                leadId
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to load lead:",
            error
        );


        showLoadingError(
            `Unable to load lead: ${error.message}`
        );

        return;

    }


    if (!data) {

        showLoadingError(
            "The selected lead was not found."
        );

        return;

    }


    if (data.is_archived) {

        showLoadingError(
            "This lead has already been archived."
        );

        return;

    }


    populateLeadForm(data);

}
function renderActivityMetadata(
    metadata
) {

    if (
        !metadata ||
        typeof metadata !== "object"
    ) {
        return "";
    }


    const entries =
        Object.entries(metadata)
            .filter(
                ([, value]) =>
                    value !== null &&
                    value !== undefined &&
                    value !== ""
            );


    if (
        entries.length === 0
    ) {
        return "";
    }


    return `
        <div class="activity-metadata">

            ${entries
                .map(
                    ([key, value]) => `
                        <span>
                            ${escapeHtml(
                                formatMetadataLabel(
                                    key
                                )
                            )}:
                            ${escapeHtml(
                                formatMetadataValue(
                                    key,
                                    value
                                )
                            )}
                        </span>
                    `
                )
                .join("")
            }

        </div>
    `;

}


function renderLeadActivities(
    activities
) {

    activityLoading.hidden =
        true;


    activityTimeline.hidden =
        false;


    if (
        activities.length === 0
    ) {

        activityTimeline.innerHTML = `
            <div class="activity-empty-state">
                No activity history found for this lead.
            </div>
        `;

        return;

    }


    activityTimeline.innerHTML =
        activities
            .map(
                activity => {

                    const activityType =
                        String(
                            activity.activity_type ||
                            "activity"
                        )
                            .toLowerCase()
                            .trim();


                    return `
                        <article
                            class="
                                activity-item
                                ${escapeHtml(
                                    activityType
                                )}
                            "
                        >

                            <div class="activity-icon">
                                ${escapeHtml(
                                    getActivityIcon(
                                        activityType
                                    )
                                )}
                            </div>


                            <div class="activity-content">

                                <div class="activity-content-header">

                                    <strong>
                                        ${escapeHtml(
                                            getActivityTitle(
                                                activityType
                                            )
                                        )}
                                    </strong>

                                    <time>
                                        ${escapeHtml(
                                            formatActivityDate(
                                                activity.created_at
                                            )
                                        )}
                                    </time>

                                </div>


                                <p>
                                    ${escapeHtml(
                                        activity.activity_text ||
                                        "Lead activity recorded."
                                    )}
                                </p>


                                ${renderActivityMetadata(
                                    activity.metadata
                                )}

                            </div>

                        </article>
                    `;

                }
            )
            .join("");

}


async function loadLeadActivities() {

    if (!activeLeadId) {
        return;
    }


    activityLoading.hidden =
        false;


    activityLoading.textContent =
        "Loading activity history...";


    activityLoading.style.color =
        "";


    activityTimeline.hidden =
        true;


    refreshActivityButton.disabled =
        true;


    refreshActivityButton.textContent =
        "Refreshing...";


    const { data, error } =
        await supabaseClient
            .from("lead_activities")
            .select(`
                id,
                lead_id,
                activity_type,
                activity_text,
                metadata,
                created_by,
                created_at
            `)
            .eq(
                "lead_id",
                activeLeadId
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    refreshActivityButton.disabled =
        false;


    refreshActivityButton.textContent =
        "Refresh";


    if (error) {

        console.error(
            "Unable to load lead activities:",
            error
        );


        activityLoading.hidden =
            false;


        activityLoading.textContent =
            `Unable to load activity history: ${error.message}`;


        activityLoading.style.color =
            "#dc2626";


        activityTimeline.hidden =
            true;


        return;

    }


    renderLeadActivities(
        data ?? []
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
                phone,
                is_archived
            `);


    if (error) {

        console.error(
            "Unable to check duplicates:",
            error
        );


        throw error;

    }


    const otherLeads =
        (data ?? [])
            .filter(
                lead =>
                    String(lead.id) !==
                    String(activeLeadId)
            );


    const duplicatePhone =
        otherLeads.find(
            lead =>
                getPhoneDigits(
                    lead.phone
                ) ===
                values.phoneDigits
        );


    const duplicateEmail =
        values.email
            ? otherLeads.find(
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
   UPDATE LEAD
================================= */

async function updateLead(event) {

    event.preventDefault();


    if (!activeLeadId) {

        showFormMessage(
            "Lead ID was not found.",
            "error"
        );

        return;

    }


    const values =
        getFormValues();


    if (!validateForm(values)) {
        return;
    }


    setBusyState(
        true,
        "save"
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
                    `This phone number already belongs to ${
                        duplicatePhone.name ||
                        "another lead"
                    }.`
                );

            }


            if (duplicateEmail) {

                showFieldError(
                    emailInput,
                    `This email already belongs to ${
                        duplicateEmail.name ||
                        "another lead"
                    }.`
                );

            }


            showFormMessage(
                "Another lead already uses the same phone number or email.",
                "error"
            );


            setBusyState(false);

            return;

        }


        showFormMessage(
            "Saving lead changes...",
            "info"
        );


        const updatedValues = {

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

            ...getAssignmentUpdate(
                values.assignedTo
            )

        };


        const { data, error } =
            await supabaseClient
                .from("Leads")
                .update(
                    updatedValues
                )
                .eq(
                    "id",
                    activeLeadId
                )
                .eq(
                    "is_archived",
                    false
                )
                .select(`
                    id,
                    name,
                    email,
                    phone,
                    company,
                    service,
                    lead_source,
                    priority,
                    status,
                    message,
                    notes,
                    follow_up_at,
                    created_at,
                    is_archived,
                    archived_at,
                    assigned_to,
                    assigned_by,
                    assigned_at
                `)
                .single();


        if (error) {

            console.error(
                "Unable to update lead:",
                error
            );


            showFormMessage(
                `Unable to update lead: ${error.message}`,
                "error"
            );


            setBusyState(false);

            return;

        }


        originalLead =
            data;


        populateAssignmentOptions(
            data.assigned_to
        );


        renderAssignmentCard(
            data
        );


        await loadLeadActivities();


        editLeadHeading.textContent =
            `Edit ${data.name}`;


        showFormMessage(
            "Lead updated successfully.",
            "success"
        );


        setBusyState(false);

    } catch (error) {

        console.error(
            "Unexpected update error:",
            error
        );


        showFormMessage(
            "Unable to complete the update. Please try again.",
            "error"
        );


        setBusyState(false);

    }

}


/* =================================
   ARCHIVE LEAD
================================= */

async function archiveLead() {

    if (!activeLeadId) {

        showFormMessage(
            "Lead ID was not found.",
            "error"
        );

        return;

    }


    const leadName =
        originalLead?.name ||
        `Lead #${activeLeadId}`;


    const confirmed =
        window.confirm(
            `Archive ${leadName}?\n\n` +
            "The lead will be removed from active leads and follow-ups."
        );


    if (!confirmed) {
        return;
    }


    setBusyState(
        true,
        "archive"
    );


    showFormMessage(
        "Archiving lead...",
        "info"
    );


    const { error } =
        await supabaseClient
            .from("Leads")
            .update({

                is_archived:
                    true,

                archived_at:
                    new Date()
                        .toISOString(),

                follow_up_at:
                    null

            })
            .eq(
                "id",
                activeLeadId
            )
            .eq(
                "is_archived",
                false
            );


    if (error) {

        console.error(
            "Unable to archive lead:",
            error
        );


        showFormMessage(
            `Unable to archive lead: ${error.message}`,
            "error"
        );


        setBusyState(false);

        return;

    }


    showFormMessage(
        "Lead archived successfully.",
        "success"
    );
    await loadLeadActivities();


    window.setTimeout(
        () => {

            window.location.replace(
                "leads.html"
            );

        },
        900
    );

}


/* =================================
   CLEAR FIELD ERRORS
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
        field => {

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

async function initialiseEditLeadPage() {

    const isAuthenticated =
        await protectEditLeadPage();


    if (!isAuthenticated) {
        return;
    }


    await window
        .loadAndApplyCrmSettings();


    registerFieldListeners();


    await loadAssignmentContext();


    await loadLead();

if (activeLeadId) {

    await loadLeadActivities();

}

}


/* =================================
   EVENT LISTENERS
================================= */

editLeadForm.addEventListener(
    "submit",
    updateLead
);


archiveLeadButton.addEventListener(
    "click",
    archiveLead
);
refreshActivityButton.addEventListener(
    "click",
    loadLeadActivities
);


logoutButton.addEventListener(
    "click",
    logout
);


initialiseEditLeadPage()
    .finally(() => {

        window.finishCrmPageLoading?.();

    });
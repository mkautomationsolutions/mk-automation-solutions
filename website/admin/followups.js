const supabaseClient =
    window.mkSupabase;


const tableBody =
    document.getElementById(
        "followups-table-body"
    );

const searchInput =
    document.getElementById(
        "followup-search"
    );

const timeFilter =
    document.getElementById(
        "time-filter"
    );

const statusFilter =
    document.getElementById(
        "followup-status-filter"
    );

const totalElement =
    document.getElementById(
        "total-followups"
    );

const overdueElement =
    document.getElementById(
        "overdue-followups"
    );

const todayElement =
    document.getElementById(
        "today-followups"
    );

const upcomingElement =
    document.getElementById(
        "upcoming-followups"
    );

const logoutButton =
    document.getElementById(
        "logout-btn"
    );
    const actionMessage =
    document.getElementById(
        "followup-action-message"
    );

const rescheduleModal =
    document.getElementById(
        "reschedule-modal"
    );

const rescheduleDateInput =
    document.getElementById(
        "reschedule-date"
    );

const rescheduleMessage =
    document.getElementById(
        "reschedule-message"
    );

const rescheduleCloseButton =
    document.getElementById(
        "reschedule-close-btn"
    );

const cancelRescheduleButton =
    document.getElementById(
        "cancel-reschedule-btn"
    );

const saveRescheduleButton =
    document.getElementById(
        "save-reschedule-btn"
    );


let activeFollowUpId = null;


let followUps = [];


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatLabel(value) {

    if (!value) {
        return "-";
    }

    return String(value)
        .replaceAll("-", " ")
        .replace(
            /\b\w/g,
            character =>
                character.toUpperCase()
        );

}


function formatFollowUpDate(value) {

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return {
            date: "-",
            time: "-"
        };
    }


    return {

        date:
            date.toLocaleDateString(
                "en-IN",
                {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                }
            ),

        time:
            date.toLocaleTimeString(
                "en-IN",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            )

    };

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

function getDateBoundaries() {

    const now =
        new Date();

    const startOfToday =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

    const endOfToday =
        new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59,
            999
        );


    return {
        startOfToday,
        endOfToday
    };

}


function getFollowUpCategory(value) {

    const followUpDate =
        new Date(value);

    const {
        startOfToday,
        endOfToday
    } =
        getDateBoundaries();


    if (
        followUpDate <
        startOfToday
    ) {
        return "overdue";
    }


    if (
        followUpDate <=
        endOfToday
    ) {
        return "today";
    }


    return "upcoming";

}


function getTimingClass(category) {

    if (category === "overdue") {
        return "followup-overdue";
    }

    if (category === "today") {
        return "followup-today";
    }

    return "followup-upcoming";

}


function getStatusClass(status) {

    const normalizedStatus =
        String(status || "new")
            .toLowerCase()
            .trim();


    if (
        normalizedStatus ===
        "contacted"
    ) {
        return "status-contacted";
    }


    if (
        normalizedStatus ===
        "converted"
    ) {
        return "status-converted";
    }


    return "status-new";

}


function updateStatistics() {

    totalElement.textContent =
        followUps.length;


    overdueElement.textContent =
        followUps.filter(
            lead =>
                getFollowUpCategory(
                    lead.follow_up_at
                ) === "overdue"
        ).length;


    todayElement.textContent =
        followUps.filter(
            lead =>
                getFollowUpCategory(
                    lead.follow_up_at
                ) === "today"
        ).length;


    upcomingElement.textContent =
        followUps.filter(
            lead =>
                getFollowUpCategory(
                    lead.follow_up_at
                ) === "upcoming"
        ).length;

}


function renderFollowUps() {

    const searchValue =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedTime =
        timeFilter.value;


    const selectedStatus =
        statusFilter.value;


    const filteredFollowUps =
        followUps.filter((lead) => {

            const searchableText = `
                ${lead.name ?? ""}
                ${lead.email ?? ""}
                ${lead.phone ?? ""}
                ${lead.company ?? ""}
                ${lead.service ?? ""}
                ${lead.notes ?? ""}
            `.toLowerCase();


            const category =
                getFollowUpCategory(
                    lead.follow_up_at
                );


            const status =
                String(
                    lead.status || "new"
                )
                    .toLowerCase()
                    .trim();


            const matchesSearch =
                searchableText.includes(
                    searchValue
                );


            const matchesTime =
                selectedTime === "all" ||
                category === selectedTime;


            const matchesStatus =
                selectedStatus === "all" ||
                status === selectedStatus;


            return (
                matchesSearch &&
                matchesTime &&
                matchesStatus
            );

        });


    if (
        filteredFollowUps.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No follow-ups found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        filteredFollowUps.map(
            (lead) => {

                const category =
                    getFollowUpCategory(
                        lead.follow_up_at
                    );


                const formattedDate =
                    formatFollowUpDate(
                        lead.follow_up_at
                    );


                const status =
                    String(
                        lead.status || "new"
                    )
                        .toLowerCase()
                        .trim();


                return `
                    <tr>

                        <td>

                            <strong>
                                ${escapeHtml(lead.name)}
                            </strong>

                        </td>


                        <td>

                            <a
                                href="mailto:${escapeHtml(lead.email)}"
                            >
                                ${escapeHtml(lead.email)}
                            </a>

                            <small>
                                ${escapeHtml(lead.phone)}
                            </small>

                        </td>


                        <td>
                            ${escapeHtml(
                                lead.company || "-"
                            )}
                        </td>


                        <td class="followup-date">

                            <strong>
                                ${formattedDate.date}
                            </strong>

                            <small>
                                ${formattedDate.time}
                            </small>

                        </td>


                        <td>

                            <span
                                class="
                                    followup-time
                                    ${getTimingClass(category)}
                                "
                            >
                                ${formatLabel(category)}
                            </span>

                        </td>


                        <td>

                            <span
                                class="
                                    status
                                    ${getStatusClass(status)}
                                "
                            >
                                ${formatLabel(status)}
                            </span>

                        </td>

<td>

    <div class="followup-actions">

        <button
            type="button"
            class="
                followup-action-btn
                followup-view-btn
            "
            data-action="view"
            data-lead-id="${lead.id}"
        >
            View
        </button>


        <button
            type="button"
            class="
                followup-action-btn
                followup-contact-btn
            "
            data-action="contacted"
            data-lead-id="${lead.id}"
        >
            Contacted
        </button>


        <button
            type="button"
            class="
                followup-action-btn
                followup-reschedule-btn
            "
            data-action="reschedule"
            data-lead-id="${lead.id}"
        >
            Reschedule
        </button>


        <button
            type="button"
            class="
                followup-action-btn
                followup-complete-btn
            "
            data-action="complete"
            data-lead-id="${lead.id}"
        >
            Complete
        </button>

    </div>

</td>

                    </tr>
                `;

            }
        ).join("");

}
async function updateFollowUpLead(
    leadId,
    values
) {

    actionMessage.textContent =
        "Updating follow-up...";

    actionMessage.style.color =
        "#2563eb";


    const { data, error } =
        await supabaseClient
            .from("Leads")
            .update(values)
            .eq(
                "id",
                leadId
            )
            .select(`
                id,
                status,
                follow_up_at
            `)
            .single();


    if (error) {

        console.error(
            "Unable to update follow-up:",
            error
        );

        actionMessage.textContent =
            `${error.code || "ERROR"}: ${error.message}`;

        actionMessage.style.color =
            "#dc2626";

        return null;

    }


    return data;

}
async function markLeadContacted(
    leadId
) {

    const updatedLead =
        await updateFollowUpLead(
            leadId,
            {
                status: "contacted"
            }
        );


    if (!updatedLead) {
        return;
    }


    const lead =
        followUps.find(
            item =>
                String(item.id) ===
                String(leadId)
        );


    if (lead) {
        lead.status = "contacted";
    }


    updateStatistics();

    renderFollowUps();


    actionMessage.textContent =
        "Lead marked as contacted.";

    actionMessage.style.color =
        "#047857";

}
async function completeFollowUp(
    leadId
) {

    const confirmed =
        window.confirm(
            "Mark this follow-up as completed?"
        );


    if (!confirmed) {
        return;
    }


    const updatedLead =
        await updateFollowUpLead(
            leadId,
            {
                follow_up_at: null
            }
        );


    if (!updatedLead) {
        return;
    }


    followUps =
        followUps.filter(
            lead =>
                String(lead.id) !==
                String(leadId)
        );


    updateStatistics();

    renderFollowUps();


    actionMessage.textContent =
        "Follow-up completed successfully.";

    actionMessage.style.color =
        "#047857";

}
function openRescheduleModal(
    leadId
) {

    const selectedLead =
        followUps.find(
            lead =>
                String(lead.id) ===
                String(leadId)
        );


    if (!selectedLead) {
        return;
    }


    activeFollowUpId =
        selectedLead.id;


    rescheduleDateInput.value =
        toDateTimeLocal(
            selectedLead.follow_up_at
        );


    rescheduleMessage.textContent = "";


    rescheduleModal.classList.add(
        "active"
    );


    rescheduleModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );

}


function closeRescheduleModal() {

    rescheduleModal.classList.remove(
        "active"
    );


    rescheduleModal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );


    activeFollowUpId = null;

    rescheduleMessage.textContent = "";

}
async function saveRescheduledDate() {

    if (!activeFollowUpId) {

        rescheduleMessage.textContent =
            "Lead ID was not found.";

        return;

    }


    if (!rescheduleDateInput.value) {

        rescheduleMessage.textContent =
            "Select a new date and time.";

        return;

    }


    const newFollowUpDate =
        new Date(
            rescheduleDateInput.value
        );


    if (
        Number.isNaN(
            newFollowUpDate.getTime()
        )
    ) {

        rescheduleMessage.textContent =
            "Invalid date or time.";

        return;

    }


    saveRescheduleButton.disabled = true;

    saveRescheduleButton.textContent =
        "Saving...";


    const updatedLead =
        await updateFollowUpLead(
            activeFollowUpId,
            {
                follow_up_at:
                    newFollowUpDate.toISOString()
            }
        );


    saveRescheduleButton.disabled = false;

    saveRescheduleButton.textContent =
        "Save New Date";


    if (!updatedLead) {

        rescheduleMessage.textContent =
            "Unable to reschedule.";

        return;

    }


    const lead =
        followUps.find(
            item =>
                String(item.id) ===
                String(activeFollowUpId)
        );


    if (lead) {

        lead.follow_up_at =
            updatedLead.follow_up_at;

    }


    followUps.sort(
        (firstLead, secondLead) =>
            new Date(
                firstLead.follow_up_at
            ) -
            new Date(
                secondLead.follow_up_at
            )
    );


    updateStatistics();

    renderFollowUps();

    closeRescheduleModal();


    actionMessage.textContent =
        "Follow-up rescheduled successfully.";

    actionMessage.style.color =
        "#047857";

}


async function protectPage() {

    const {
        data: { session }
    } =
        await supabaseClient.auth
            .getSession();


    if (!session) {

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


async function loadFollowUps() {

    tableBody.innerHTML = `
        <tr>
            <td colspan="7">
                Loading follow-ups...
            </td>
        </tr>
    `;


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
                status,
                notes,
                follow_up_at
            `)
            .eq(
    "is_archived",
    false
)
            .not(
                "follow_up_at",
                "is",
                null
            )
            .order(
                "follow_up_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Unable to load follow-ups:",
            error
        );

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    Unable to load follow-ups.
                </td>
            </tr>
        `;

        return;

    }


    followUps =
        data ?? [];


    updateStatistics();

    renderFollowUps();

}


searchInput.addEventListener(
    "input",
    renderFollowUps
);


timeFilter.addEventListener(
    "change",
    renderFollowUps
);


statusFilter.addEventListener(
    "change",
    renderFollowUps
);


logoutButton.addEventListener(
    "click",
    async () => {

        await supabaseClient.auth
            .signOut();


        window.location.href =
            "login.html";

    }
);


async function initialiseFollowUps() {

    const isAuthenticated =
        await protectPage();


    if (!isAuthenticated) {
        return;
    }
    await window.loadAndApplyCrmSettings();


    await loadFollowUps();

}
tableBody.addEventListener(
    "click",
    async (event) => {

        const actionButton =
            event.target.closest(
                "[data-action]"
            );


        if (!actionButton) {
            return;
        }


        const leadId =
            actionButton.dataset.leadId;


        const action =
            actionButton.dataset.action;


        if (action === "view") {

            window.location.href =
                `index.html?lead=${leadId}`;

            return;

        }


        if (action === "contacted") {

            await markLeadContacted(
                leadId
            );

            return;

        }


        if (action === "reschedule") {

            openRescheduleModal(
                leadId
            );

            return;

        }


        if (action === "complete") {

            await completeFollowUp(
                leadId
            );

        }

    }
);


saveRescheduleButton.addEventListener(
    "click",
    saveRescheduledDate
);


rescheduleCloseButton.addEventListener(
    "click",
    closeRescheduleModal
);


cancelRescheduleButton.addEventListener(
    "click",
    closeRescheduleModal
);


rescheduleModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target.hasAttribute(
                "data-close-reschedule"
            )
        ) {

            closeRescheduleModal();

        }

    }
);


document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            rescheduleModal.classList
                .contains("active")
        ) {

            closeRescheduleModal();

        }

    }
);


initialiseFollowUps()
    .finally(() => {

        window.finishCrmPageLoading?.();

    });
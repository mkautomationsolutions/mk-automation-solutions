const supabaseClient =
    window.mkSupabase;


/* =================================
   DOM ELEMENTS
================================= */

const tableBody =
    document.getElementById(
        "archived-leads-table-body"
    );

const searchInput =
    document.getElementById(
        "archived-leads-search"
    );

const sourceFilter =
    document.getElementById(
        "archived-source-filter"
    );

const priorityFilter =
    document.getElementById(
        "archived-priority-filter"
    );

const resetFiltersButton =
    document.getElementById(
        "reset-archived-filters"
    );

const actionMessage =
    document.getElementById(
        "archived-action-message"
    );

const resultCountElement =
    document.getElementById(
        "archived-leads-count"
    );

const previousPageButton =
    document.getElementById(
        "archived-previous-btn"
    );

const nextPageButton =
    document.getElementById(
        "archived-next-btn"
    );

const paginationInfo =
    document.getElementById(
        "archived-pagination-info"
    );

const logoutButton =
    document.getElementById(
        "logout-btn"
    );


/* =================================
   PAGE STATE
================================= */

let archivedLeads = [];

let filteredArchivedLeads = [];

let currentPage = 1;

const pageSize = 10;


/* =================================
   AUTHENTICATION
================================= */

async function protectArchivedLeadsPage() {

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
   HELPERS
================================= */

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


function normalizeSource(value) {

    return String(
        value || "website"
    )
        .toLowerCase()
        .trim();

}


function normalizePriority(value) {

    const priority =
        String(
            value || "medium"
        )
            .toLowerCase()
            .trim();


    if (
        [
            "low",
            "medium",
            "high"
        ].includes(priority)
    ) {
        return priority;
    }


    return "medium";

}


function normalizeEmail(value) {

    return String(value || "")
        .trim()
        .toLowerCase();

}


function getPhoneDigits(value) {

    return String(value || "")
        .replace(/\D/g, "");

}


function formatArchivedDate(value) {

    if (!value) {

        return {
            date: "-",
            time: "-"
        };

    }


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


function getPriorityClass(priority) {

    if (priority === "high") {
        return "archived-priority-high";
    }


    if (priority === "low") {
        return "archived-priority-low";
    }


    return "archived-priority-medium";

}


/* =================================
   ACTION MESSAGE
================================= */

function showActionMessage(
    message,
    type
) {

    actionMessage.textContent =
        message;


    actionMessage.className =
        `archived-action-message show ${type}`;

}


function clearActionMessage() {

    actionMessage.textContent =
        "";


    actionMessage.className =
        "archived-action-message";

}


/* =================================
   FILTER ARCHIVED LEADS
================================= */

function applyFilters(
    resetPage = true
) {

    if (resetPage) {
        currentPage = 1;
    }


    const searchValue =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedSource =
        sourceFilter.value;


    const selectedPriority =
        priorityFilter.value;


    filteredArchivedLeads =
        archivedLeads.filter(
            lead => {

                const searchableText = `
                    ${lead.name ?? ""}
                    ${lead.email ?? ""}
                    ${lead.phone ?? ""}
                    ${lead.company ?? ""}
                    ${lead.service ?? ""}
                    ${lead.lead_source ?? ""}
                    ${lead.priority ?? ""}
                    ${lead.message ?? ""}
                    ${lead.notes ?? ""}
                `.toLowerCase();


                const source =
                    normalizeSource(
                        lead.lead_source
                    );


                const priority =
                    normalizePriority(
                        lead.priority
                    );


                const matchesSearch =
                    searchableText.includes(
                        searchValue
                    );


                const matchesSource =
                    selectedSource === "all" ||
                    selectedSource === "" ||
                    source === selectedSource;


                const matchesPriority =
                    selectedPriority === "all" ||
                    priority === selectedPriority;


                return (
                    matchesSearch &&
                    matchesSource &&
                    matchesPriority
                );

            }
        );


    renderArchivedLeads();

}


/* =================================
   RENDER TABLE
================================= */

function renderArchivedLeads() {

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredArchivedLeads.length /
                pageSize
            )
        );


    if (currentPage > totalPages) {
        currentPage = totalPages;
    }


    const startIndex =
        (currentPage - 1) *
        pageSize;


    const endIndex =
        startIndex +
        pageSize;


    const currentPageLeads =
        filteredArchivedLeads.slice(
            startIndex,
            endIndex
        );


    if (
        currentPageLeads.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="archived-empty-state"
                >
                    No archived leads found.
                </td>
            </tr>
        `;

    } else {

        tableBody.innerHTML =
            currentPageLeads
                .map(
                    lead => {

                        const source =
                            normalizeSource(
                                lead.lead_source
                            );


                        const priority =
                            normalizePriority(
                                lead.priority
                            );


                        const archivedDate =
                            formatArchivedDate(
                                lead.archived_at
                            );


                        const email =
                            String(
                                lead.email || ""
                            ).trim();


                        return `
                            <tr>

                                <td>

                                    <strong>
                                        ${escapeHtml(
                                            lead.name ||
                                            "-"
                                        )}
                                    </strong>

                                    <small>
                                        Lead ID:
                                        ${escapeHtml(
                                            lead.id
                                        )}
                                    </small>

                                </td>


                                <td>

                                    ${
                                        email
                                            ? `
                                                <a
                                                    href="mailto:${escapeHtml(
                                                        email
                                                    )}"
                                                >
                                                    ${escapeHtml(
                                                        email
                                                    )}
                                                </a>
                                            `
                                            : `
                                                <span>-</span>
                                            `
                                    }

                                    <small>
                                        ${escapeHtml(
                                            lead.phone ||
                                            "-"
                                        )}
                                    </small>

                                </td>


                                <td>
                                    ${escapeHtml(
                                        lead.company ||
                                        "-"
                                    )}
                                </td>


                                <td>
                                    ${escapeHtml(
                                        formatLabel(
                                            lead.service
                                        )
                                    )}
                                </td>


                                <td>

                                    <span class="archived-source">

                                        ${escapeHtml(
                                            formatLabel(
                                                source
                                            )
                                        )}

                                    </span>

                                </td>


                                <td>

                                    <span
                                        class="
                                            archived-priority
                                            ${getPriorityClass(
                                                priority
                                            )}
                                        "
                                    >

                                        ${escapeHtml(
                                            formatLabel(
                                                priority
                                            )
                                        )}

                                    </span>

                                </td>


                                <td class="archived-date">

                                    <strong>
                                        ${escapeHtml(
                                            archivedDate.date
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHtml(
                                            archivedDate.time
                                        )}
                                    </small>

                                </td>


                                <td>

                                    <button
                                        type="button"
                                        class="restore-lead-btn"
                                        data-lead-id="${escapeHtml(
                                            lead.id
                                        )}"
                                    >
                                        Restore
                                    </button>

                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");

    }


    updateResultSummary(
        startIndex,
        currentPageLeads.length
    );


    updatePagination(
        totalPages
    );

}


/* =================================
   RESULT SUMMARY
================================= */

function updateResultSummary(
    startIndex,
    visibleCount
) {

    if (
        filteredArchivedLeads.length === 0
    ) {

        resultCountElement.textContent =
            `0 archived leads found. Total archived: ${archivedLeads.length}`;

        return;

    }


    const firstVisible =
        startIndex + 1;


    const lastVisible =
        startIndex +
        visibleCount;


    resultCountElement.textContent =
        `Showing ${firstVisible}–${lastVisible} of ` +
        `${filteredArchivedLeads.length} archived leads. ` +
        `Total archived: ${archivedLeads.length}`;

}


/* =================================
   PAGINATION
================================= */

function updatePagination(
    totalPages
) {

    paginationInfo.textContent =
        `Page ${currentPage} of ${totalPages}`;


    previousPageButton.disabled =
        currentPage <= 1;


    nextPageButton.disabled =
        currentPage >= totalPages;

}


function goToPreviousPage() {

    if (currentPage <= 1) {
        return;
    }


    currentPage -= 1;


    renderArchivedLeads();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function goToNextPage() {

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredArchivedLeads.length /
                pageSize
            )
        );


    if (
        currentPage >= totalPages
    ) {
        return;
    }


    currentPage += 1;


    renderArchivedLeads();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =================================
   LOAD ARCHIVED LEADS
================================= */

async function loadArchivedLeads() {

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="archived-empty-state"
            >
                Loading archived leads...
            </td>
        </tr>
    `;


    resultCountElement.textContent =
        "Loading archived leads...";


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
                created_at,
                is_archived,
                archived_at
            `)
            .eq(
                "is_archived",
                true
            )
            .order(
                "archived_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "Unable to load archived leads:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="archived-empty-state"
                >
                    Unable to load archived leads.
                </td>
            </tr>
        `;


        resultCountElement.textContent =
            "Unable to load archived leads.";


        return;

    }


    archivedLeads =
        data ?? [];


    applyFilters();

}


/* =================================
   DUPLICATE CHECK BEFORE RESTORE
================================= */

async function findActiveDuplicate(
    archivedLead
) {

    const { data, error } =
        await supabaseClient
            .from("Leads")
            .select(`
                id,
                name,
                email,
                phone
            `)
            .eq(
                "is_archived",
                false
            );


    if (error) {

        console.error(
            "Unable to check active duplicates:",
            error
        );


        throw error;

    }


    const archivedEmail =
        normalizeEmail(
            archivedLead.email
        );


    const archivedPhone =
        getPhoneDigits(
            archivedLead.phone
        );


    const activeLeads =
        data ?? [];


    const duplicatePhone =
        archivedPhone
            ? activeLeads.find(
                lead =>
                    getPhoneDigits(
                        lead.phone
                    ) ===
                    archivedPhone
            )
            : null;


    const duplicateEmail =
        archivedEmail
            ? activeLeads.find(
                lead =>
                    normalizeEmail(
                        lead.email
                    ) ===
                    archivedEmail
            )
            : null;


    return (
        duplicatePhone ||
        duplicateEmail ||
        null
    );

}


/* =================================
   RESTORE LEAD
================================= */

async function restoreLead(
    leadId,
    button
) {

    const selectedLead =
        archivedLeads.find(
            lead =>
                String(lead.id) ===
                String(leadId)
        );


    if (!selectedLead) {

        showActionMessage(
            "Archived lead was not found.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Restore ${selectedLead.name || "this lead"}?\n\n` +
            "The lead will return to the active Leads page."
        );


    if (!confirmed) {
        return;
    }


    clearActionMessage();


    button.disabled =
        true;


    button.textContent =
        "Restoring...";


    showActionMessage(
        "Checking lead details...",
        "info"
    );


    try {

        const duplicateLead =
            await findActiveDuplicate(
                selectedLead
            );


        if (duplicateLead) {

            showActionMessage(
                `Unable to restore. An active lead named ` +
                `"${duplicateLead.name || "Unknown"}" already uses ` +
                "the same email address or phone number.",
                "error"
            );


            button.disabled =
                false;


            button.textContent =
                "Restore";


            return;

        }


        showActionMessage(
            "Restoring lead...",
            "info"
        );


        const { data, error } =
            await supabaseClient
                .from("Leads")
                .update({

                    is_archived:
                        false,

                    archived_at:
                        null

                })
                .eq(
                    "id",
                    selectedLead.id
                )
                .eq(
                    "is_archived",
                    true
                )
                .select(`
                    id,
                    is_archived,
                    archived_at
                `)
                .single();


        if (error) {

            console.error(
                "Unable to restore lead:",
                error
            );


            showActionMessage(
                `Unable to restore lead: ${error.message}`,
                "error"
            );


            button.disabled =
                false;


            button.textContent =
                "Restore";


            return;

        }


        if (data.is_archived) {

            showActionMessage(
                "The lead could not be restored.",
                "error"
            );


            button.disabled =
                false;


            button.textContent =
                "Restore";


            return;

        }


        archivedLeads =
            archivedLeads.filter(
                lead =>
                    String(lead.id) !==
                    String(selectedLead.id)
            );


        applyFilters(
            false
        );


        showActionMessage(
            `${selectedLead.name || "Lead"} restored successfully.`,
            "success"
        );

    } catch (error) {

        console.error(
            "Unexpected restore error:",
            error
        );


        showActionMessage(
            "Unable to restore the lead. Please try again.",
            "error"
        );


        button.disabled =
            false;


        button.textContent =
            "Restore";

    }

}


/* =================================
   RESET FILTERS
================================= */

function resetFilters() {

    searchInput.value =
        "";


    sourceFilter.value =
        "all";


    priorityFilter.value =
        "all";


    currentPage =
        1;


    clearActionMessage();


    applyFilters(
        false
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
   EVENT LISTENERS
================================= */

searchInput.addEventListener(
    "input",
    () => applyFilters()
);


sourceFilter.addEventListener(
    "change",
    () => applyFilters()
);


priorityFilter.addEventListener(
    "change",
    () => applyFilters()
);


resetFiltersButton.addEventListener(
    "click",
    resetFilters
);


previousPageButton.addEventListener(
    "click",
    goToPreviousPage
);


nextPageButton.addEventListener(
    "click",
    goToNextPage
);


tableBody.addEventListener(
    "click",
    async (event) => {

        const restoreButton =
            event.target.closest(
                ".restore-lead-btn"
            );


        if (!restoreButton) {
            return;
        }


        await restoreLead(
            restoreButton.dataset.leadId,
            restoreButton
        );

    }
);


logoutButton.addEventListener(
    "click",
    logout
);


/* =================================
   INITIALISE PAGE
================================= */

async function initialiseArchivedLeadsPage() {

    const isAuthenticated =
        await protectArchivedLeadsPage();


    if (!isAuthenticated) {
        return;
    }


    await window
        .loadAndApplyCrmSettings();


    await loadArchivedLeads();

}


initialiseArchivedLeadsPage()
    .finally(() => {

        window.finishCrmPageLoading?.();

    });
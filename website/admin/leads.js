const supabaseClient =
    window.mkSupabase;


/* =================================
   DOM ELEMENTS
================================= */

const tableBody =
    document.getElementById(
        "all-leads-table-body"
    );

const searchInput =
    document.getElementById(
        "leads-search"
    );

const statusFilter =
    document.getElementById(
        "leads-status-filter"
    );

const serviceFilter =
    document.getElementById(
        "leads-service-filter"
    );

const sourceFilter =
    document.getElementById(
        "leads-source-filter"
    );

const priorityFilter =
    document.getElementById(
        "leads-priority-filter"
    );

const assigneeFilter =
    document.getElementById(
        "leads-assignee-filter"
    );


const fromDateInput =
    document.getElementById(
        "leads-from-date"
    );

const toDateInput =
    document.getElementById(
        "leads-to-date"
    );

const resetFiltersButton =
    document.getElementById(
        "reset-leads-filters"
    );

const exportButton =
    document.getElementById(
        "export-leads-btn"
    );

const resultCountElement =
    document.getElementById(
        "leads-result-count"
    );

const previousPageButton =
    document.getElementById(
        "previous-page-btn"
    );

const nextPageButton =
    document.getElementById(
        "next-page-btn"
    );

const paginationInfo =
    document.getElementById(
        "pagination-info"
    );

const logoutButton =
    document.getElementById(
        "logout-btn"
    );


const bulkToolbar =
    document.getElementById(
        "bulk-assignment-toolbar"
    );

const bulkSelectedCount =
    document.getElementById(
        "bulk-selected-count"
    );

const bulkSelectionDetail =
    document.getElementById(
        "bulk-selection-detail"
    );

const selectCurrentPageButton =
    document.getElementById(
        "select-current-page-btn"
    );

const selectAllFilteredButton =
    document.getElementById(
        "select-all-filtered-btn"
    );

const clearSelectedLeadsButton =
    document.getElementById(
        "clear-selected-leads-btn"
    );

const bulkAssigneeSelect =
    document.getElementById(
        "bulk-assignee-select"
    );

const includeAssignedLeadsCheckbox =
    document.getElementById(
        "include-assigned-leads"
    );

const bulkAssignButton =
    document.getElementById(
        "bulk-assign-btn"
    );

const bulkUnassignButton =
    document.getElementById(
        "bulk-unassign-btn"
    );

const selectCurrentPageCheckbox =
    document.getElementById(
        "select-current-page-checkbox"
    );


/* =================================
   PAGE STATE
================================= */

let allLeads = [];

let filteredLeads = [];

let teamMembers = [];

let teamMemberMap =
    new Map();

let currentPage = 1;

const pageSize = 10;

const selectedLeadIds =
    new Set();

let isBulkUpdating = false;


/* =================================
   AUTHENTICATION
================================= */

async function protectLeadsPage() {

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


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


function normalizeStatus(value) {

    const status =
        String(value || "new")
            .toLowerCase()
            .trim();


    if (
        ["new", "contacted", "converted"]
            .includes(status)
    ) {
        return status;
    }


    return "new";

}


function normalizePriority(value) {

    const priority =
        String(value || "medium")
            .toLowerCase()
            .trim();


    if (
        ["low", "medium", "high"]
            .includes(priority)
    ) {
        return priority;
    }


    return "medium";

}


function normalizeSource(value) {

    return String(value || "website")
        .toLowerCase()
        .trim();

}


function getStatusClass(status) {

    if (status === "contacted") {
        return "lead-status-contacted";
    }


    if (status === "converted") {
        return "lead-status-converted";
    }


    return "lead-status-new";

}


function getPriorityClass(priority) {

    if (priority === "high") {
        return "lead-priority-high";
    }


    if (priority === "low") {
        return "lead-priority-low";
    }


    return "lead-priority-medium";

}


function getFromDateBoundary() {

    if (!fromDateInput.value) {
        return null;
    }


    const date =
        new Date(
            `${fromDateInput.value}T00:00:00`
        );


    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

}


function getToDateBoundary() {

    if (!toDateInput.value) {
        return null;
    }


    const date =
        new Date(
            `${toDateInput.value}T23:59:59.999`
        );


    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

}


/* =================================
   TEAM MEMBERS / ASSIGNEES
================================= */

function getMemberInitials(name) {

    const parts =
        String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 0) {
        return "TM";
    }


    if (parts.length === 1) {

        return parts[0]
            .slice(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


function getAssigneeForLead(lead) {

    if (!lead?.assigned_to) {
        return null;
    }


    return teamMemberMap.get(
        String(lead.assigned_to)
    ) || null;

}


function populateAssigneeFilter() {

    const previousValue =
        assigneeFilter.value ||
        "all";


    assigneeFilter.innerHTML = `
        <option value="all">
            All Assignees
        </option>

        <option value="unassigned">
            Unassigned
        </option>

        ${teamMembers
            .map(
                member => `
                    <option value="${escapeHtml(member.id)}">
                        ${escapeHtml(member.full_name)}
                        ${
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


    const optionExists =
        Array.from(
            assigneeFilter.options
        )
        .some(
            option =>
                option.value ===
                previousValue
        );


    assigneeFilter.value =
        optionExists
            ? previousValue
            : "all";

}


function populateBulkAssigneeSelect() {

    if (!bulkAssigneeSelect) {
        return;
    }


    const previousValue =
        bulkAssigneeSelect.value ||
        "";


    bulkAssigneeSelect.innerHTML = `
        <option value="">
            Select Employee
        </option>

        ${teamMembers
            .filter(
                member =>
                    member.status ===
                    "active"
            )
            .map(
                member => `
                    <option value="${escapeHtml(
                        member.id
                    )}">
                        ${escapeHtml(
                            member.full_name
                        )}
                        — ${escapeHtml(
                            formatLabel(
                                member.role
                            )
                        )}
                    </option>
                `
            )
            .join("")
        }
    `;


    const optionExists =
        Array.from(
            bulkAssigneeSelect.options
        )
        .some(
            option =>
                option.value ===
                previousValue
        );


    bulkAssigneeSelect.value =
        optionExists
            ? previousValue
            : "";

}


async function loadTeamMembers() {

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
            "Unable to load lead assignees:",
            error
        );

        teamMembers = [];

    } else {

        teamMembers =
            data ?? [];

    }


    teamMemberMap =
        new Map(
            teamMembers.map(
                member => [
                    String(member.id),
                    member
                ]
            )
        );


    populateAssigneeFilter();

    populateBulkAssigneeSelect();

}


/* =================================
   INLINE LEAD ASSIGNMENT
================================= */

function canManageLeadAssignments() {

    return (
        window.crmAccess?.canManage ===
        true
    );

}


function renderLeadAssigneeControl(
    lead,
    assignee
) {

    const displayMarkup =
        assignee
            ? `
                <span class="lead-assignee">

                    <span class="lead-assignee-avatar">
                        ${escapeHtml(
                            getMemberInitials(
                                assignee.full_name
                            )
                        )}
                    </span>

                    <span class="lead-assignee-details">

                        <strong>
                            ${escapeHtml(
                                assignee.full_name
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                formatLabel(
                                    assignee.role
                                )
                            )}
                        </small>

                    </span>

                </span>
            `
            : `
                <span class="lead-assignee-unassigned">
                    Unassigned
                </span>
            `;


    if (
        !canManageLeadAssignments()
    ) {

        return displayMarkup;

    }


    return `
        <button
            type="button"
            class="lead-assignee-inline-btn ${
                assignee
                    ? ""
                    : "is-unassigned"
            }"
            data-action="assign-inline"
            data-lead-id="${escapeHtml(
                lead.id
            )}"
            title="Click to assign or reassign this lead"
        >

            ${displayMarkup}

            <span class="lead-assignment-change">
                Change
            </span>

        </button>
    `;

}


function showLeadAssignmentToast(
    message,
    type = "success"
) {

    let toast =
        document.getElementById(
            "lead-assignment-toast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "lead-assignment-toast";

        toast.className =
            "lead-assignment-toast";

        toast.setAttribute(
            "role",
            "status"
        );

        toast.setAttribute(
            "aria-live",
            "polite"
        );

        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;

    toast.className =
        `lead-assignment-toast ${type} visible`;


    window.clearTimeout(
        showLeadAssignmentToast
            .timeoutId
    );


    showLeadAssignmentToast
        .timeoutId =
        window.setTimeout(
            () => {

                toast.classList.remove(
                    "visible"
                );

            },
            3200
        );

}


function openInlineAssigneeEditor(
    leadId,
    triggerButton
) {

    if (
        !canManageLeadAssignments()
    ) {
        return;
    }


    const lead =
        allLeads.find(
            item =>
                String(item.id) ===
                String(leadId)
        );


    const tableCell =
        triggerButton.closest(
            "td"
        );


    if (
        !lead ||
        !tableCell
    ) {
        return;
    }


    const currentAssigneeId =
        String(
            lead.assigned_to ||
            ""
        );


    const memberOptions =
        teamMembers
            .filter(
                member =>
                    member.status ===
                        "active" ||
                    String(member.id) ===
                        currentAssigneeId
            )
            .map(
                member => {

                    const isSelected =
                        String(member.id) ===
                        currentAssigneeId;


                    const isInactive =
                        member.status !==
                        "active";


                    return `
                        <option
                            value="${escapeHtml(
                                member.id
                            )}"
                            ${
                                isSelected
                                    ? "selected"
                                    : ""
                            }
                            ${
                                isInactive &&
                                !isSelected
                                    ? "disabled"
                                    : ""
                            }
                        >
                            ${escapeHtml(
                                member.full_name
                            )}
                            ${
                                isInactive
                                    ? " (Inactive)"
                                    : ""
                            }
                        </option>
                    `;

                }
            )
            .join("");


    tableCell.innerHTML = `
        <div class="inline-assignee-editor">

            <select
                class="inline-assignee-select"
                data-inline-assignee-select
                data-lead-id="${escapeHtml(
                    lead.id
                )}"
                aria-label="Assign lead to team member"
            >

                <option value="">
                    Unassigned
                </option>

                ${memberOptions}

            </select>


            <button
                type="button"
                class="inline-assignee-cancel"
                data-action="cancel-inline"
                data-lead-id="${escapeHtml(
                    lead.id
                )}"
                aria-label="Cancel assignment change"
                title="Cancel"
            >
                ×
            </button>

        </div>
    `;


    const select =
        tableCell.querySelector(
            ".inline-assignee-select"
        );


    select?.focus();

}


async function updateLeadAssigneeInline(
    leadId,
    newAssigneeId,
    selectElement
) {

    if (
        !canManageLeadAssignments()
    ) {
        return;
    }


    const lead =
        allLeads.find(
            item =>
                String(item.id) ===
                String(leadId)
        );


    if (!lead) {

        showLeadAssignmentToast(
            "Lead was not found.",
            "error"
        );

        renderLeads();

        return;

    }


    const normalizedAssigneeId =
        String(
            newAssigneeId ||
            ""
        );


    const currentAssigneeId =
        String(
            lead.assigned_to ||
            ""
        );


    if (
        normalizedAssigneeId ===
        currentAssigneeId
    ) {

        renderLeads();

        return;

    }


    selectElement.disabled =
        true;

    selectElement.classList.add(
        "is-saving"
    );


    const assignedTo =
        normalizedAssigneeId ||
        null;


    const assignmentTime =
        assignedTo
            ? new Date()
                .toISOString()
            : null;


    const assignedBy =
        window.crmAccess
            ?.currentMember
            ?.id ||
        null;


    const { data, error } =
        await supabaseClient
            .from("Leads")
            .update({

                assigned_to:
                    assignedTo,

                assigned_by:
                    assignedBy,

                assigned_at:
                    assignmentTime

            })
            .eq(
                "id",
                leadId
            )
            .eq(
                "is_archived",
                false
            )
            .select(`
                id,
                assigned_to,
                assigned_by,
                assigned_at
            `)
            .single();


    if (error) {

        console.error(
            "Unable to update lead assignment:",
            error
        );


        showLeadAssignmentToast(
            `Unable to update assignment: ${error.message}`,
            "error"
        );


        renderLeads();

        return;

    }


    Object.assign(
        lead,
        data
    );


    renderLeads();


    const assignedMember =
        assignedTo
            ? teamMemberMap.get(
                String(assignedTo)
            )
            : null;


    showLeadAssignmentToast(
        assignedMember
            ? `Lead assigned to ${assignedMember.full_name}.`
            : "Lead marked as unassigned.",
        "success"
    );

}


/* =================================
   BULK LEAD SELECTION / ASSIGNMENT
================================= */

function getCurrentPageLeads() {

    const startIndex =
        (currentPage - 1) *
        pageSize;


    return filteredLeads.slice(
        startIndex,
        startIndex + pageSize
    );

}


function getSelectedLeads() {

    return allLeads.filter(
        lead =>
            selectedLeadIds.has(
                String(lead.id)
            )
    );

}


function syncBulkSelectionUI(
    currentPageLeads =
        getCurrentPageLeads()
) {

    const canManage =
        canManageLeadAssignments();


    document.body.classList.toggle(
        "leads-assignment-readonly",
        !canManage
    );


    if (!canManage) {

        bulkToolbar.hidden =
            true;

        return;

    }


    const selectedLeads =
        getSelectedLeads();

    const selectedCount =
        selectedLeads.length;

    const selectedAssignedCount =
        selectedLeads.filter(
            lead =>
                Boolean(
                    lead.assigned_to
                )
        ).length;

    const selectedUnassignedCount =
        selectedCount -
        selectedAssignedCount;


    bulkToolbar.hidden =
        selectedCount === 0;


    bulkSelectedCount.textContent =
        `${selectedCount} lead${
            selectedCount === 1
                ? ""
                : "s"
        } selected`;


    bulkSelectionDetail.textContent =
        selectedCount === 0
            ? "Select leads using the table checkboxes."
            : `${selectedUnassignedCount} unassigned · ${selectedAssignedCount} already assigned`;


    const pageIds =
        currentPageLeads.map(
            lead =>
                String(lead.id)
        );

    const selectedPageCount =
        pageIds.filter(
            id =>
                selectedLeadIds.has(id)
        ).length;


    selectCurrentPageCheckbox.checked =
        pageIds.length > 0 &&
        selectedPageCount ===
            pageIds.length;

    selectCurrentPageCheckbox.indeterminate =
        selectedPageCount > 0 &&
        selectedPageCount <
            pageIds.length;

    selectCurrentPageCheckbox.disabled =
        pageIds.length === 0 ||
        isBulkUpdating;


    selectCurrentPageButton.disabled =
        pageIds.length === 0 ||
        isBulkUpdating;

    selectAllFilteredButton.disabled =
        filteredLeads.length === 0 ||
        isBulkUpdating;

    clearSelectedLeadsButton.disabled =
        selectedCount === 0 ||
        isBulkUpdating;

    bulkAssigneeSelect.disabled =
        isBulkUpdating;

    includeAssignedLeadsCheckbox.disabled =
        isBulkUpdating;

    bulkAssignButton.disabled =
        selectedCount === 0 ||
        !bulkAssigneeSelect.value ||
        isBulkUpdating;

    bulkUnassignButton.disabled =
        selectedAssignedCount === 0 ||
        isBulkUpdating;


    document
        .querySelectorAll(
            "[data-lead-select-checkbox]"
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    selectedLeadIds.has(
                        String(
                            checkbox.dataset
                                .leadId
                        )
                    );

                checkbox.disabled =
                    isBulkUpdating;

            }
        );

}


function setLeadSelected(
    leadId,
    shouldSelect
) {

    const normalizedId =
        String(leadId);


    if (shouldSelect) {

        selectedLeadIds.add(
            normalizedId
        );

    } else {

        selectedLeadIds.delete(
            normalizedId
        );

    }


    renderLeads();

}


function selectCurrentPageLeads() {

    getCurrentPageLeads()
        .forEach(
            lead => {

                selectedLeadIds.add(
                    String(lead.id)
                );

            }
        );


    renderLeads();

}


function toggleCurrentPageSelection(
    shouldSelect
) {

    getCurrentPageLeads()
        .forEach(
            lead => {

                const id =
                    String(lead.id);


                if (shouldSelect) {
                    selectedLeadIds.add(id);
                } else {
                    selectedLeadIds.delete(id);
                }

            }
        );


    renderLeads();

}


function selectAllFilteredLeads() {

    filteredLeads.forEach(
        lead => {

            selectedLeadIds.add(
                String(lead.id)
            );

        }
    );


    renderLeads();


    showLeadAssignmentToast(
        `${filteredLeads.length} filtered leads selected.`,
        "success"
    );

}


function clearLeadSelection() {

    selectedLeadIds.clear();

    renderLeads();

}


function setBulkAssignmentBusy(
    isBusy
) {

    isBulkUpdating =
        isBusy;


    bulkAssignButton.textContent =
        isBusy
            ? "Updating..."
            : "Assign Selected";

    bulkUnassignButton.textContent =
        isBusy
            ? "Updating..."
            : "Unassign Selected";


    syncBulkSelectionUI();

}


async function updateLeadAssignmentsInChunks(
    leadIds,
    payload
) {

    const updatedRows = [];

    const failedIds = [];

    const chunkSize = 200;


    for (
        let index = 0;
        index < leadIds.length;
        index += chunkSize
    ) {

        const chunkIds =
            leadIds.slice(
                index,
                index + chunkSize
            );


        const { data, error } =
            await supabaseClient
                .from("Leads")
                .update(payload)
                .in(
                    "id",
                    chunkIds
                )
                .eq(
                    "is_archived",
                    false
                )
                .select(`
                    id,
                    assigned_to,
                    assigned_by,
                    assigned_at
                `);


        if (error) {

            console.error(
                "Bulk assignment chunk failed:",
                error
            );

            failedIds.push(
                ...chunkIds
            );

            continue;

        }


        updatedRows.push(
            ...(data ?? [])
        );

    }


    return {
        updatedRows,
        failedIds
    };

}


function applyAssignmentRowsLocally(
    updatedRows
) {

    const updatedMap =
        new Map(
            updatedRows.map(
                row => [
                    String(row.id),
                    row
                ]
            )
        );


    allLeads.forEach(
        lead => {

            const updatedRow =
                updatedMap.get(
                    String(lead.id)
                );


            if (updatedRow) {

                Object.assign(
                    lead,
                    updatedRow
                );

            }

        }
    );

}


async function bulkAssignSelectedLeads() {

    if (
        isBulkUpdating ||
        !canManageLeadAssignments()
    ) {
        return;
    }


    const assigneeId =
        bulkAssigneeSelect.value;


    if (!assigneeId) {

        showLeadAssignmentToast(
            "Select an employee for bulk assignment.",
            "error"
        );

        return;

    }


    const selectedLeads =
        getSelectedLeads();

    const includeAssigned =
        includeAssignedLeadsCheckbox
            .checked;

    const candidateLeads =
        includeAssigned
            ? selectedLeads
            : selectedLeads.filter(
                lead =>
                    !lead.assigned_to
            );

    const skippedAssignedCount =
        selectedLeads.length -
        candidateLeads.length;


    if (
        candidateLeads.length === 0
    ) {

        showLeadAssignmentToast(
            skippedAssignedCount > 0
                ? "All selected leads are already assigned. Enable ‘Include already assigned leads’ to reassign them."
                : "Select at least one lead.",
            "error"
        );

        return;

    }


    const assignee =
        teamMemberMap.get(
            String(assigneeId)
        );


    const confirmed =
        window.confirm(
            `Assign ${candidateLeads.length} lead${candidateLeads.length === 1 ? "" : "s"} to ${assignee?.full_name || "the selected employee"}?` +
            `${skippedAssignedCount > 0 ? `\n\n${skippedAssignedCount} already assigned lead(s) will be skipped.` : ""}`
        );


    if (!confirmed) {
        return;
    }


    setBulkAssignmentBusy(true);


    const assignmentTime =
        new Date()
            .toISOString();

    const assignedBy =
        window.crmAccess
            ?.currentMember
            ?.id ||
        null;


    try {

        const result =
            await updateLeadAssignmentsInChunks(
                candidateLeads.map(
                    lead =>
                        lead.id
                ),
                {
                    assigned_to:
                        assigneeId,
                    assigned_by:
                        assignedBy,
                    assigned_at:
                        assignmentTime
                }
            );


        applyAssignmentRowsLocally(
            result.updatedRows
        );


        result.updatedRows
            .forEach(
                row =>
                    selectedLeadIds.delete(
                        String(row.id)
                    )
            );


        renderLeads();


        const successfulCount =
            result.updatedRows.length;

        const failedCount =
            result.failedIds.length;


        showLeadAssignmentToast(
            failedCount > 0
                ? `${successfulCount} leads assigned; ${failedCount} failed.`
                : `${successfulCount} leads assigned to ${assignee?.full_name || "the selected employee"}.`,
            failedCount > 0
                ? "error"
                : "success"
        );

    } finally {

        setBulkAssignmentBusy(false);

    }

}


async function bulkUnassignSelectedLeads() {

    if (
        isBulkUpdating ||
        !canManageLeadAssignments()
    ) {
        return;
    }


    const selectedLeads =
        getSelectedLeads();

    const candidateLeads =
        selectedLeads.filter(
            lead =>
                Boolean(
                    lead.assigned_to
                )
        );


    if (
        candidateLeads.length === 0
    ) {

        showLeadAssignmentToast(
            "None of the selected leads are assigned.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Remove assignment from ${candidateLeads.length} lead${candidateLeads.length === 1 ? "" : "s"}?`
        );


    if (!confirmed) {
        return;
    }


    setBulkAssignmentBusy(true);


    try {

        const result =
            await updateLeadAssignmentsInChunks(
                candidateLeads.map(
                    lead =>
                        lead.id
                ),
                {
                    assigned_to: null,
                    assigned_by: null,
                    assigned_at: null
                }
            );


        applyAssignmentRowsLocally(
            result.updatedRows
        );


        result.updatedRows
            .forEach(
                row =>
                    selectedLeadIds.delete(
                        String(row.id)
                    )
            );


        renderLeads();


        const successfulCount =
            result.updatedRows.length;

        const failedCount =
            result.failedIds.length;


        showLeadAssignmentToast(
            failedCount > 0
                ? `${successfulCount} leads unassigned; ${failedCount} failed.`
                : `${successfulCount} leads marked as unassigned.`,
            failedCount > 0
                ? "error"
                : "success"
        );

    } finally {

        setBulkAssignmentBusy(false);

    }

}


/* =================================
   SERVICE FILTER
================================= */

function populateServiceFilter() {

    const services =
        [
            ...new Set(
                allLeads
                    .map(
                        lead =>
                            String(
                                lead.service || ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ]
            .sort(
                (
                    firstService,
                    secondService
                ) =>
                    firstService.localeCompare(
                        secondService
                    )
            );


    serviceFilter.innerHTML = `
        <option value="all">
            All Services
        </option>

        ${services
            .map(
                service => `
                    <option
                        value="${escapeHtml(service)}"
                    >
                        ${escapeHtml(
                            formatLabel(service)
                        )}
                    </option>
                `
            )
            .join("")
        }
    `;

}


/* =================================
   FILTER LEADS
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


    const selectedStatus =
        statusFilter.value;


    const selectedService =
        serviceFilter.value;


    const selectedSource =
        sourceFilter.value;


    const selectedPriority =
        priorityFilter.value;


    const selectedAssignee =
        assigneeFilter.value;


    const fromDate =
        getFromDateBoundary();


    const toDate =
        getToDateBoundary();


    filteredLeads =
        allLeads.filter(
            (lead) => {

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
                    ${getAssigneeForLead(lead)?.full_name ?? ""}
                    ${getAssigneeForLead(lead)?.email ?? ""}
                `.toLowerCase();


                const status =
                    normalizeStatus(
                        lead.status
                    );


                const service =
                    String(
                        lead.service || ""
                    ).trim();


                const source =
                    normalizeSource(
                        lead.lead_source
                    );


                const priority =
                    normalizePriority(
                        lead.priority
                    );


                const createdDate =
                    new Date(
                        lead.created_at
                    );


                const validCreatedDate =
                    !Number.isNaN(
                        createdDate.getTime()
                    );


                const matchesSearch =
                    searchableText.includes(
                        searchValue
                    );


                const matchesStatus =
                    selectedStatus === "all" ||
                    status === selectedStatus;


                const matchesService =
                    selectedService === "all" ||
                    service === selectedService;


                const matchesSource =
                    selectedSource === "all" ||
                    selectedSource === "" ||
                    source === selectedSource;


                const matchesPriority =
                    selectedPriority === "all" ||
                    priority === selectedPriority;


                const matchesAssignee =
                    selectedAssignee === "all" ||
                    (
                        selectedAssignee === "unassigned" &&
                        !lead.assigned_to
                    ) ||
                    String(lead.assigned_to || "") ===
                        selectedAssignee;


                const matchesFromDate =
                    !fromDate ||
                    (
                        validCreatedDate &&
                        createdDate >= fromDate
                    );


                const matchesToDate =
                    !toDate ||
                    (
                        validCreatedDate &&
                        createdDate <= toDate
                    );


                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesService &&
                    matchesSource &&
                    matchesPriority &&
                    matchesAssignee &&
                    matchesFromDate &&
                    matchesToDate
                );

            }
        );


    renderLeads();

}


/* =================================
   RENDER LEADS
================================= */

function renderLeads() {

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredLeads.length /
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
        filteredLeads.slice(
            startIndex,
            endIndex
        );


    if (
        currentPageLeads.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="leads-empty-state"
                >
                    No leads found for the selected filters.
                </td>
            </tr>
        `;

    } else {

        tableBody.innerHTML =
            currentPageLeads
                .map((lead) => {

                    const status =
                        normalizeStatus(
                            lead.status
                        );


                    const priority =
                        normalizePriority(
                            lead.priority
                        );


                    const source =
                        normalizeSource(
                            lead.lead_source
                        );


                    const email =
                        String(
                            lead.email || ""
                        ).trim();


                    const assignee =
                        getAssigneeForLead(
                            lead
                        );


                    const isSelected =
                        selectedLeadIds.has(
                            String(lead.id)
                        );


                    return `
                        <tr class="${
                            isSelected
                                ? "lead-row-selected"
                                : ""
                        }">

                            <td class="lead-select-column">
                                <input
                                    type="checkbox"
                                    class="lead-selection-checkbox"
                                    data-lead-select-checkbox
                                    data-lead-id="${escapeHtml(
                                        lead.id
                                    )}"
                                    ${
                                        isSelected
                                            ? "checked"
                                            : ""
                                    }
                                    aria-label="Select ${escapeHtml(
                                        lead.name ||
                                        `lead ${lead.id}`
                                    )}"
                                >
                            </td>

                            <td>

                                <strong>
                                    ${escapeHtml(
                                        lead.name || "-"
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
                                        lead.phone || "-"
                                    )}
                                </small>

                            </td>


                            <td>
                                ${escapeHtml(
                                    lead.company || "-"
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

                                <span class="lead-source">
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
                                        lead-priority
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


                            <td>

                                ${renderLeadAssigneeControl(
                                    lead,
                                    assignee
                                )}

                            </td>


                            <td>

                                <span
                                    class="
                                        lead-status
                                        ${getStatusClass(
                                            status
                                        )}
                                    "
                                >
                                    ${escapeHtml(
                                        formatLabel(
                                            status
                                        )
                                    )}
                                </span>

                            </td>


                            <td>
                                ${escapeHtml(
                                    formatDate(
                                        lead.created_at
                                    )
                                )}
                            </td>


                           <td>

    <div class="lead-row-actions">

        <button
            type="button"
            class="lead-view-btn"
            data-action="view"
            data-lead-id="${escapeHtml(
                lead.id
            )}"
        >
            View
        </button>

        <button
            type="button"
            class="lead-edit-btn"
            data-action="edit"
            data-lead-id="${escapeHtml(
                lead.id
            )}"
        >
            Edit
        </button>

    </div>

</td>

                        </tr>
                    `;

                })
                .join("");

    }


    updateResultSummary(
        startIndex,
        currentPageLeads.length
    );


    updatePagination(
        totalPages
    );


    exportButton.disabled =
        filteredLeads.length === 0;


    syncBulkSelectionUI(
        currentPageLeads
    );

}


/* =================================
   RESULT SUMMARY
================================= */

function updateResultSummary(
    startIndex,
    pageLeadCount
) {

    if (
        filteredLeads.length === 0
    ) {

        resultCountElement.textContent =
            `0 leads found. Total leads: ${allLeads.length}`;

        return;

    }


    const firstVisibleLead =
        startIndex + 1;


    const lastVisibleLead =
        startIndex +
        pageLeadCount;


    resultCountElement.textContent =
        `Showing ${firstVisibleLead}–${lastVisibleLead} of ` +
        `${filteredLeads.length} matching leads. ` +
        `Total leads: ${allLeads.length}`;

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

    renderLeads();


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
                filteredLeads.length /
                pageSize
            )
        );


    if (
        currentPage >= totalPages
    ) {
        return;
    }


    currentPage += 1;

    renderLeads();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =================================
   LOAD LEADS
================================= */

async function loadLeads() {

    tableBody.innerHTML = `
        <tr>
            <td
                colspan="11"
                class="leads-empty-state"
            >
                Loading leads...
            </td>
        </tr>
    `;


    resultCountElement.textContent =
        "Loading leads...";


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
            message,
            status,
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
            "is_archived",
            false
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Unable to load leads:",
            error
        );


        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="11"
                    class="leads-empty-state"
                >
                    Unable to load leads.
                </td>
            </tr>
        `;


        resultCountElement.textContent =
            "Unable to load leads.";


        exportButton.disabled =
            true;


        return;

    }


    allLeads =
        data ?? [];


    const activeLeadIds =
        new Set(
            allLeads.map(
                lead =>
                    String(lead.id)
            )
        );


    Array.from(
        selectedLeadIds
    ).forEach(
        leadId => {

            if (
                !activeLeadIds.has(
                    leadId
                )
            ) {
                selectedLeadIds.delete(
                    leadId
                );
            }

        }
    );


    populateServiceFilter();

    applyFilters();

}


/* =================================
   CSV EXPORT
================================= */

function csvEscape(value) {

    return `"${String(value ?? "")
        .replaceAll(
            '"',
            '""'
        )}"`;

}


function exportFilteredLeads() {

    if (
        filteredLeads.length === 0
    ) {
        return;
    }


    const csvHeaders = [
        "Lead ID",
        "Name",
        "Email",
        "Phone",
        "Company",
        "Service",
        "Lead Source",
        "Priority",
        "Assigned To",
        "Assigned Email",
        "Assigned At",
        "Status",
        "Message",
        "Notes",
        "Follow-up Date",
        "Created Date"
    ];


    const csvRows =
        filteredLeads.map(
            lead => [

                lead.id,

                lead.name,

                lead.email,

                lead.phone,

                lead.company,

                formatLabel(
                    lead.service
                ),

                formatLabel(
                    normalizeSource(
                        lead.lead_source
                    )
                ),

                formatLabel(
                    normalizePriority(
                        lead.priority
                    )
                ),

                getAssigneeForLead(lead)
                    ?.full_name || "Unassigned",

                getAssigneeForLead(lead)
                    ?.email || "",

                lead.assigned_at
                    ? new Date(
                        lead.assigned_at
                    ).toLocaleString(
                        "en-IN"
                    )
                    : "",

                formatLabel(
                    normalizeStatus(
                        lead.status
                    )
                ),

                lead.message,

                lead.notes,

                lead.follow_up_at
                    ? new Date(
                        lead.follow_up_at
                    ).toLocaleString(
                        "en-IN"
                    )
                    : "",

                lead.created_at
                    ? new Date(
                        lead.created_at
                    ).toLocaleString(
                        "en-IN"
                    )
                    : ""

            ]
                .map(csvEscape)
                .join(",")
        );


    const csvContent =
        [
            csvHeaders
                .map(csvEscape)
                .join(","),

            ...csvRows
        ].join("\n");


    const csvBlob =
        new Blob(
            [
                "\uFEFF",
                csvContent
            ],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const downloadUrl =
        URL.createObjectURL(
            csvBlob
        );


    const downloadLink =
        document.createElement(
            "a"
        );


    const currentDate =
        new Date()
            .toISOString()
            .slice(0, 10);


    downloadLink.href =
        downloadUrl;


    downloadLink.download =
        `crm-leads-${currentDate}.csv`;


    document.body.appendChild(
        downloadLink
    );


    downloadLink.click();

    downloadLink.remove();


    URL.revokeObjectURL(
        downloadUrl
    );

}


/* =================================
   RESET FILTERS
================================= */

function resetFilters() {

    searchInput.value = "";

    statusFilter.value = "all";

    serviceFilter.value = "all";

    sourceFilter.value = "all";

    priorityFilter.value = "all";

    assigneeFilter.value = "all";

    fromDateInput.value = "";

    toDateInput.value = "";

    currentPage = 1;


    applyFilters(
        false
    );

}


/* =================================
   EVENT LISTENERS
================================= */

searchInput.addEventListener(
    "input",
    () => applyFilters()
);


statusFilter.addEventListener(
    "change",
    () => applyFilters()
);


serviceFilter.addEventListener(
    "change",
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


assigneeFilter.addEventListener(
    "change",
    () => applyFilters()
);


fromDateInput.addEventListener(
    "change",
    () => applyFilters()
);


toDateInput.addEventListener(
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


exportButton.addEventListener(
    "click",
    exportFilteredLeads
);


selectCurrentPageButton.addEventListener(
    "click",
    selectCurrentPageLeads
);


selectAllFilteredButton.addEventListener(
    "click",
    selectAllFilteredLeads
);


clearSelectedLeadsButton.addEventListener(
    "click",
    clearLeadSelection
);


selectCurrentPageCheckbox.addEventListener(
    "change",
    () => {

        toggleCurrentPageSelection(
            selectCurrentPageCheckbox
                .checked
        );

    }
);


bulkAssigneeSelect.addEventListener(
    "change",
    () =>
        syncBulkSelectionUI()
);


includeAssignedLeadsCheckbox.addEventListener(
    "change",
    () =>
        syncBulkSelectionUI()
);


bulkAssignButton.addEventListener(
    "click",
    bulkAssignSelectedLeads
);


bulkUnassignButton.addEventListener(
    "click",
    bulkUnassignSelectedLeads
);


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


        if (
            action ===
            "assign-inline"
        ) {

            openInlineAssigneeEditor(
                leadId,
                actionButton
            );

            return;

        }


        if (
            action ===
            "cancel-inline"
        ) {

            renderLeads();

            return;

        }


        if (action === "view") {

            window.location.href =
                `index.html?lead=${encodeURIComponent(
                    leadId
                )}`;

            return;

        }


        if (action === "edit") {

            window.location.href =
                `edit-lead.html?id=${encodeURIComponent(
                    leadId
                )}`;

        }

    }
);

tableBody.addEventListener(
    "change",
    async (event) => {

        const leadCheckbox =
            event.target.closest(
                "[data-lead-select-checkbox]"
            );


        if (leadCheckbox) {

            setLeadSelected(
                leadCheckbox.dataset
                    .leadId,
                leadCheckbox.checked
            );

            return;

        }


        const selectElement =
            event.target.closest(
                "[data-inline-assignee-select]"
            );


        if (!selectElement) {
            return;
        }


        await updateLeadAssigneeInline(
            selectElement.dataset
                .leadId,
            selectElement.value,
            selectElement
        );

    }
);


logoutButton.addEventListener(
    "click",
    async () => {

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
);


/* =================================
   INITIALISE PAGE
================================= */

async function initialiseLeadsPage() {

    const isAuthenticated =
        await protectLeadsPage();


    if (!isAuthenticated) {
        return;
    }


    await window
        .loadAndApplyCrmSettings();


    document.body.classList.toggle(
        "leads-assignment-readonly",
        !canManageLeadAssignments()
    );


    await loadTeamMembers();


    await loadLeads();

}


initialiseLeadsPage()
    .finally(() => {

        window.finishCrmPageLoading?.();

    });
const supabaseClient = window.mkSupabase;


/* ---------------------------------
   DOM ELEMENTS
---------------------------------- */

const searchInput =
    document.getElementById("lead-search");

const statusFilter =
    document.getElementById("status-filter");

const tableBody =
    document.getElementById("leads-table-body");

const totalLeadsElement =
    document.getElementById("total-leads");

const newLeadsElement =
    document.getElementById("new-leads");

const contactedLeadsElement =
    document.getElementById("contacted-leads");

const convertedLeadsElement =
    document.getElementById("converted-leads");

const logoutButton =
    document.getElementById("logout-btn");

const leadModal =
    document.getElementById("lead-modal");

const modalCloseButton =
    document.getElementById("modal-close-btn");

const modalName =
    document.getElementById("modal-name");

const modalEmail =
    document.getElementById("modal-email");

const modalPhone =
    document.getElementById("modal-phone");

const modalCompany =
    document.getElementById("modal-company");

const modalService =
    document.getElementById("modal-service");

const modalCreatedAt =
    document.getElementById("modal-created-at");

const modalMessage =
    document.getElementById("modal-message");

const modalStatusSelect =
    document.getElementById(
        "modal-status-select"
    );

const modalFollowUp =
    document.getElementById(
        "modal-follow-up"
    );

const modalAssignedTo =
    document.getElementById(
        "modal-assigned-to"
    );

const modalAssignmentHelp =
    document.getElementById(
        "modal-assignment-help"
    );


const modalNotes =
    document.getElementById(
        "modal-notes"
    );

const saveStatusButton =
    document.getElementById(
        "save-status-btn"
    );

const statusSaveMessage =
    document.getElementById(
        "status-save-message"
    );
    const dashboardActivityLoading =
    document.getElementById(
        "dashboard-activity-loading"
    );

const dashboardActivityTimeline =
    document.getElementById(
        "dashboard-activity-timeline"
    );

const dashboardRefreshActivityButton =
    document.getElementById(
        "dashboard-refresh-activity-btn"
    );
    const notificationCenter =
    document.getElementById(
        "notification-center"
    );

const notificationButton =
    document.getElementById(
        "notification-btn"
    );

const notificationBadge =
    document.getElementById(
        "notification-badge"
    );

const notificationPanel =
    document.getElementById(
        "notification-panel"
    );

const notificationCloseButton =
    document.getElementById(
        "notification-close-btn"
    );

const notificationOverdueCount =
    document.getElementById(
        "notification-overdue-count"
    );

const notificationTodayCount =
    document.getElementById(
        "notification-today-count"
    );

const notificationLoading =
    document.getElementById(
        "notification-loading"
    );

const notificationList =
    document.getElementById(
        "notification-list"
    );

const refreshNotificationsButton =
    document.getElementById(
        "refresh-notifications-btn"
    );
const notificationActionMessage =
    document.getElementById(
        "notification-action-message"
    );


/* ---------------------------------
   STATE
---------------------------------- */

let leads = [];

let activeLeadId = null;
let followUpNotifications = [];

let teamMembers = [];

let teamMemberMap =
    new Map();

let canManageAssignments = false;

let currentTeamMemberId = null;


/* ---------------------------------
   AUTHENTICATION
---------------------------------- */

async function protectDashboard() {

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


/* ---------------------------------
   HELPER FUNCTIONS
---------------------------------- */

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


    if (Number.isNaN(date.getTime())) {
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


    if (Number.isNaN(date.getTime())) {
        return "";
    }


    const offset =
        date.getTimezoneOffset();


    const localDate =
        new Date(
            date.getTime() -
            offset * 60 * 1000
        );


    return localDate
        .toISOString()
        .slice(0, 16);

}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

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
/* ---------------------------------
   TEAM MEMBERS / LEAD ASSIGNMENT
---------------------------------- */

function getDashboardMemberInitials(name) {

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


function getDashboardAssignee(lead) {

    if (!lead?.assigned_to) {
        return null;
    }


    return teamMemberMap.get(
        String(lead.assigned_to)
    ) || null;

}


function populateDashboardAssignmentOptions(
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


    modalAssignedTo.innerHTML = `
        <option value="">
            Unassigned
        </option>

        ${selectableMembers
            .map(
                member => `
                    <option value="${escapeHtml(member.id)}">
                        ${escapeHtml(member.full_name)}
                        — ${escapeHtml(formatLabel(member.role))}${
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


    modalAssignedTo.value =
        selectedId;


    modalAssignedTo.disabled =
        !canManageAssignments;


    modalAssignmentHelp.textContent =
        canManageAssignments
            ? "Assign, reassign or unassign this lead."
            : "Assignment can be changed only by an administrator or manager.";

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
            "Unable to load dashboard assignees:",
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

}


function getDashboardAssignmentUpdate(
    lead,
    nextMemberId
) {

    if (!canManageAssignments) {
        return {};
    }


    const previousId =
        String(
            lead?.assigned_to ||
            ""
        );


    const selectedId =
        String(
            nextMemberId ||
            ""
        );


    if (previousId === selectedId) {
        return {};
    }


    return {

        assigned_to:
            selectedId || null,

        assigned_by:
            currentTeamMemberId,

        assigned_at:
            new Date()
                .toISOString()

    };

}


function getNotificationDateBoundaries() {

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


function getNotificationCategory(
    value
) {

    const followUpDate =
        new Date(value);


    if (
        Number.isNaN(
            followUpDate.getTime()
        )
    ) {
        return "upcoming";
    }


    const {
        startOfToday,
        endOfToday
    } =
        getNotificationDateBoundaries();


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


function formatNotificationDate(
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
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


function openNotificationPanel() {

    notificationPanel.classList.add(
        "active"
    );


    notificationPanel.setAttribute(
        "aria-hidden",
        "false"
    );


    notificationButton.setAttribute(
        "aria-expanded",
        "true"
    );

}


function closeNotificationPanel() {

    notificationPanel.classList.remove(
        "active"
    );


    notificationPanel.setAttribute(
        "aria-hidden",
        "true"
    );


    notificationButton.setAttribute(
        "aria-expanded",
        "false"
    );

}


function toggleNotificationPanel() {

    const panelIsOpen =
        notificationPanel.classList
            .contains("active");


    if (panelIsOpen) {

        closeNotificationPanel();

        return;

    }


    openNotificationPanel();

}
function getTomorrowFollowUpDate(
    currentFollowUpValue
) {

    const existingDate =
        new Date(
            currentFollowUpValue
        );


    const tomorrow =
        new Date();


    tomorrow.setDate(
        tomorrow.getDate() + 1
    );


    if (
        !Number.isNaN(
            existingDate.getTime()
        )
    ) {

        tomorrow.setHours(
            existingDate.getHours(),
            existingDate.getMinutes(),
            0,
            0
        );

    } else {

        tomorrow.setHours(
            10,
            0,
            0,
            0
        );

    }


    return tomorrow;

}
function updateNotificationBadge(
    count
) {

    if (count <= 0) {

        notificationBadge.hidden =
            true;


        notificationBadge.textContent =
            "0";


        return;

    }


    notificationBadge.hidden =
        false;


    notificationBadge.textContent =
        count > 99
            ? "99+"
            : String(count);

}

function renderFollowUpNotifications() {

    const overdueNotifications =
        followUpNotifications.filter(
            lead =>
                getNotificationCategory(
                    lead.follow_up_at
                ) === "overdue"
        );


    const todayNotifications =
        followUpNotifications.filter(
            lead =>
                getNotificationCategory(
                    lead.follow_up_at
                ) === "today"
        );


    const alertNotifications = [

        ...overdueNotifications,
        ...todayNotifications

    ].sort(
        (firstLead, secondLead) =>
            new Date(
                firstLead.follow_up_at
            ) -
            new Date(
                secondLead.follow_up_at
            )
    );


    notificationOverdueCount.textContent =
        overdueNotifications.length;


    notificationTodayCount.textContent =
        todayNotifications.length;


    updateNotificationBadge(
        alertNotifications.length
    );


    notificationLoading.hidden =
        true;


    notificationList.hidden =
        false;


    if (
        alertNotifications.length === 0
    ) {

        notificationList.innerHTML = `
            <div class="notification-empty">
                No overdue or today's follow-ups.
            </div>
        `;

        return;

    }


    notificationList.innerHTML =
        alertNotifications
            .map(
                lead => {

                    const category =
                        getNotificationCategory(
                            lead.follow_up_at
                        );


                    const icon =
                        category === "overdue"
                            ? "⚠️"
                            : "📞";


                    const contactText =
                        lead.phone ||
                        lead.company ||
                        "No contact details";


                    return `
                        <article
                            class="
                                notification-item
                                ${escapeHtml(category)}
                            "
                        >

                            <button
                                type="button"
                                class="notification-open-btn"
                                data-notification-action="open"
                                data-notification-lead-id="${escapeHtml(
                                    lead.id
                                )}"
                            >

                                <span class="notification-item-icon">
                                    ${icon}
                                </span>


                                <span class="notification-item-content">

                                    <span class="notification-item-top">

                                        <strong>
                                            ${escapeHtml(
                                                lead.name ||
                                                "Unnamed Lead"
                                            )}
                                        </strong>


                                        <span class="notification-timing">
                                            ${escapeHtml(
                                                category
                                            )}
                                        </span>

                                    </span>


                                    <p>
                                        ${escapeHtml(
                                            contactText
                                        )}
                                    </p>


                                    <span class="notification-item-time">
                                        ${escapeHtml(
                                            formatNotificationDate(
                                                lead.follow_up_at
                                            )
                                        )}
                                    </span>

                                </span>

                            </button>


                            <div class="notification-quick-actions">

                                <button
                                    type="button"
                                    class="
                                        notification-quick-btn
                                        notification-snooze-btn
                                    "
                                    data-notification-action="snooze"
                                    data-notification-lead-id="${escapeHtml(
                                        lead.id
                                    )}"
                                >
                                    Snooze +1 Day
                                </button>


                                <button
                                    type="button"
                                    class="
                                        notification-quick-btn
                                        notification-complete-btn
                                    "
                                    data-notification-action="complete"
                                    data-notification-lead-id="${escapeHtml(
                                        lead.id
                                    )}"
                                >
                                    Complete
                                </button>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");

}
async function loadFollowUpNotifications() {

    notificationLoading.hidden =
        false;


    notificationLoading.textContent =
        "Loading follow-up alerts...";


    notificationLoading.style.color =
        "";


    notificationList.hidden =
        true;


    refreshNotificationsButton.disabled =
        true;


    refreshNotificationsButton.textContent =
        "Refreshing...";


    const { data, error } =
        await supabaseClient
            .from("Leads")
            .select(`
                id,
                name,
                phone,
                company,
                status,
                follow_up_at,
                is_archived
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


    refreshNotificationsButton.disabled =
        false;


    refreshNotificationsButton.textContent =
        "Refresh";


    if (error) {

        console.error(
            "Unable to load follow-up notifications:",
            error
        );


        notificationLoading.hidden =
            false;


        notificationLoading.textContent =
            `Unable to load notifications: ${error.message}`;


        notificationLoading.style.color =
            "#dc2626";


        notificationList.hidden =
            true;


        notificationOverdueCount.textContent =
            "0";


        notificationTodayCount.textContent =
            "0";


        updateNotificationBadge(0);


        return;

    }


    followUpNotifications =
        data ?? [];


    renderFollowUpNotifications();

}
function updateLocalFollowUpValue(
    leadId,
    followUpAt
) {

    const dashboardLead =
        leads.find(
            lead =>
                String(lead.id) ===
                String(leadId)
        );


    if (dashboardLead) {

        dashboardLead.follow_up_at =
            followUpAt;

    }


    const notificationLead =
        followUpNotifications.find(
            lead =>
                String(lead.id) ===
                String(leadId)
        );


    if (notificationLead) {

        notificationLead.follow_up_at =
            followUpAt;

    }

}
async function snoozeNotificationLead(
    leadId,
    button
) {

    const selectedLead =
        followUpNotifications.find(
            lead =>
                String(lead.id) ===
                String(leadId)
        );


    if (!selectedLead) {

        showNotificationActionMessage(
            "Lead was not found.",
            "error"
        );

        return;

    }


    const tomorrowDate =
        getTomorrowFollowUpDate(
            selectedLead.follow_up_at
        );


    button.disabled =
        true;


    const originalText =
        button.textContent;


    button.textContent =
        "Snoozing...";


    clearNotificationActionMessage();


    showNotificationActionMessage(
        "Rescheduling follow-up...",
        "info"
    );


    const { data, error } =
        await supabaseClient
            .from("Leads")
            .update({

                follow_up_at:
                    tomorrowDate.toISOString()

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
                follow_up_at
            `)
            .single();


    if (error) {

        console.error(
            "Unable to snooze follow-up:",
            error
        );


        showNotificationActionMessage(
            `Unable to snooze: ${error.message}`,
            "error"
        );


        button.disabled =
            false;


        button.textContent =
            originalText;


        return;

    }


    updateLocalFollowUpValue(
        leadId,
        data.follow_up_at
    );


    await loadFollowUpNotifications();


    showNotificationActionMessage(
        `${selectedLead.name || "Lead"} snoozed until tomorrow.`,
        "success"
    );

}
async function completeNotificationLead(
    leadId,
    button
) {

    const selectedLead =
        followUpNotifications.find(
            lead =>
                String(lead.id) ===
                String(leadId)
        );


    if (!selectedLead) {

        showNotificationActionMessage(
            "Lead was not found.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Complete follow-up for ${
                selectedLead.name ||
                "this lead"
            }?\n\n` +
            "The scheduled follow-up date will be cleared."
        );


    if (!confirmed) {
        return;
    }


    button.disabled =
        true;


    const originalText =
        button.textContent;


    button.textContent =
        "Completing...";


    clearNotificationActionMessage();


    showNotificationActionMessage(
        "Completing follow-up...",
        "info"
    );


    const { data, error } =
        await supabaseClient
            .from("Leads")
            .update({

                follow_up_at:
                    null

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
                follow_up_at
            `)
            .single();


    if (error) {

        console.error(
            "Unable to complete follow-up:",
            error
        );


        showNotificationActionMessage(
            `Unable to complete: ${error.message}`,
            "error"
        );


        button.disabled =
            false;


        button.textContent =
            originalText;


        return;

    }


    updateLocalFollowUpValue(
        leadId,
        data.follow_up_at
    );


    await loadFollowUpNotifications();


    showNotificationActionMessage(
        `${selectedLead.name || "Lead"} follow-up completed.`,
        "success"
    );

}
function getDashboardActivityTitle(
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


function getDashboardActivityIcon(
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


function formatDashboardMetadataValue(
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
        key.includes("_at") ||
        key.includes("date")
    ) {

        const formattedValue =
            formatDate(value);


        if (formattedValue !== "-") {
            return formattedValue;
        }

    }


    return formatLabel(value);

}


function renderDashboardActivityMetadata(
    metadata
) {

    if (
        !metadata ||
        typeof metadata !== "object"
    ) {
        return "";
    }


    const metadataEntries =
        Object.entries(metadata)
            .filter(
                ([, value]) =>
                    value !== null &&
                    value !== undefined &&
                    value !== ""
            );


    if (
        metadataEntries.length === 0
    ) {
        return "";
    }


    return `
        <div class="dashboard-activity-metadata">

            ${metadataEntries
                .map(
                    ([key, value]) => `
                        <span>
                            ${escapeHtml(
                                formatLabel(key)
                            )}:
                            ${escapeHtml(
                                formatDashboardMetadataValue(
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
function renderDashboardLeadActivities(
    activities
) {

    dashboardActivityLoading.hidden =
        true;


    dashboardActivityTimeline.hidden =
        false;


    if (
        activities.length === 0
    ) {

        dashboardActivityTimeline.innerHTML = `
            <div class="dashboard-activity-empty">
                No activity history found for this lead.
            </div>
        `;

        return;

    }


    dashboardActivityTimeline.innerHTML =
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
                            class="dashboard-activity-item ${escapeHtml(
                                activityType
                            )}"
                        >

                            <div class="dashboard-activity-icon">

                                ${escapeHtml(
                                    getDashboardActivityIcon(
                                        activityType
                                    )
                                )}

                            </div>


                            <div class="dashboard-activity-content">

                                <div class="dashboard-activity-title">

                                    <strong>
                                        ${escapeHtml(
                                            getDashboardActivityTitle(
                                                activityType
                                            )
                                        )}
                                    </strong>


                                    <time>
                                        ${escapeHtml(
                                            formatDate(
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


                                ${renderDashboardActivityMetadata(
                                    activity.metadata
                                )}

                            </div>

                        </article>
                    `;

                }
            )
            .join("");

}


async function loadDashboardLeadActivities() {

    if (!activeLeadId) {

        dashboardActivityLoading.hidden =
            false;


        dashboardActivityLoading.textContent =
            "Select a lead to view activity.";


        dashboardActivityTimeline.hidden =
            true;


        dashboardActivityTimeline.innerHTML =
            "";


        return;

    }


    dashboardActivityLoading.hidden =
        false;


    dashboardActivityLoading.textContent =
        "Loading activity history...";


    dashboardActivityLoading.style.color =
        "";


    dashboardActivityTimeline.hidden =
        true;


    dashboardRefreshActivityButton.disabled =
        true;


    dashboardRefreshActivityButton.textContent =
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
            )
            .limit(20);


    dashboardRefreshActivityButton.disabled =
        false;


    dashboardRefreshActivityButton.textContent =
        "Refresh";


    if (error) {

        console.error(
            "Unable to load dashboard activities:",
            error
        );


        dashboardActivityLoading.hidden =
            false;


        dashboardActivityLoading.textContent =
            `Unable to load activity history: ${error.message}`;


        dashboardActivityLoading.style.color =
            "#dc2626";


        dashboardActivityTimeline.hidden =
            true;


        return;

    }


    renderDashboardLeadActivities(
        data ?? []
    );

}



/* ---------------------------------
   MODAL
---------------------------------- */

function openLeadModal(leadId) {

    const selectedLead =
        leads.find(
            lead =>
                String(lead.id) ===
                String(leadId)
        );


    if (!selectedLead) {
        return;
    }


    activeLeadId =
        selectedLead.id;


    modalName.textContent =
        selectedLead.name || "-";


    modalEmail.textContent =
        selectedLead.email || "-";


    modalEmail.href =
        selectedLead.email
            ? `mailto:${selectedLead.email}`
            : "#";


    modalPhone.textContent =
        selectedLead.phone || "-";


    modalPhone.href =
        selectedLead.phone
            ? `tel:${selectedLead.phone}`
            : "#";


    modalCompany.textContent =
        selectedLead.company || "-";


    modalService.textContent =
        formatLabel(
            selectedLead.service
        );


    modalCreatedAt.textContent =
        formatDate(
            selectedLead.created_at
        );


    modalMessage.textContent =
        selectedLead.message || "-";


    const currentStatus =
        String(
            selectedLead.status ||
            "new"
        )
            .toLowerCase()
            .trim();


    modalStatusSelect.value =
        [
            "new",
            "contacted",
            "converted"
        ].includes(currentStatus)
            ? currentStatus
            : "new";


    modalNotes.value =
        selectedLead.notes || "";


    modalFollowUp.value =
        toDateTimeLocal(
            selectedLead.follow_up_at
        );


    populateDashboardAssignmentOptions(
        selectedLead.assigned_to
    );


    statusSaveMessage.textContent =
        "";


    leadModal.classList.add(
        "active"
    );


    leadModal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );
    loadDashboardLeadActivities();

}


function closeLeadModal() {

    leadModal.classList.remove(
        "active"
    );


    leadModal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );


    activeLeadId = null;


    statusSaveMessage.textContent =
        "";
        dashboardActivityLoading.hidden =
    false;


dashboardActivityLoading.textContent =
    "Select a lead to view activity.";


dashboardActivityLoading.style.color =
    "";


dashboardActivityTimeline.hidden =
    true;


dashboardActivityTimeline.innerHTML =
    "";


}


/* ---------------------------------
   LEAD STATISTICS
---------------------------------- */

function updateStatistics() {

    totalLeadsElement.textContent =
        leads.length;


    newLeadsElement.textContent =
        leads.filter(
            lead =>
                String(
                    lead.status || "new"
                )
                    .toLowerCase()
                    .trim() === "new"
        ).length;


    contactedLeadsElement.textContent =
        leads.filter(
            lead =>
                String(
                    lead.status || "new"
                )
                    .toLowerCase()
                    .trim() ===
                "contacted"
        ).length;


    convertedLeadsElement.textContent =
        leads.filter(
            lead =>
                String(
                    lead.status || "new"
                )
                    .toLowerCase()
                    .trim() ===
                "converted"
        ).length;

}
function showNotificationActionMessage(
    message,
    type
) {

    notificationActionMessage.hidden =
        false;

    notificationActionMessage.textContent =
        message;

    notificationActionMessage.className =
        `notification-action-message ${type}`;

}


function clearNotificationActionMessage() {

    notificationActionMessage.hidden =
        true;

    notificationActionMessage.textContent =
        "";

    notificationActionMessage.className =
        "notification-action-message";

}


/* ---------------------------------
   RENDER LEADS
---------------------------------- */

function renderLeads() {

    const searchValue =
        searchInput.value
            .toLowerCase()
            .trim();


    const selectedStatus =
        statusFilter.value;


    const filteredLeads =
        leads.filter(
            (lead) => {

                const searchableText = `
                    ${lead.name ?? ""}
                    ${lead.email ?? ""}
                    ${lead.phone ?? ""}
                    ${lead.company ?? ""}
                    ${lead.service ?? ""}
                    ${getDashboardAssignee(lead)?.full_name ?? ""}
                    ${getDashboardAssignee(lead)?.email ?? ""}
                `.toLowerCase();


                const leadStatus =
                    String(
                        lead.status ||
                        "new"
                    )
                        .toLowerCase()
                        .trim();


                const matchesSearch =
                    searchableText.includes(
                        searchValue
                    );


                const matchesStatus =
                    selectedStatus ===
                    "all" ||
                    leadStatus ===
                    selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    if (
        filteredLeads.length === 0
    ) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    No leads found.
                </td>
            </tr>
        `;

        return;

    }


    tableBody.innerHTML =
        filteredLeads
            .map((lead) => {

                const status =
                    String(
                        lead.status ||
                        "new"
                    )
                        .toLowerCase()
                        .trim();


                const assignee =
                    getDashboardAssignee(
                        lead
                    );


                return `
                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(
                                    lead.name ||
                                    "-"
                                )}
                            </strong>
                        </td>

                        <td>

                            <a
                                href="mailto:${escapeHtml(
                                    lead.email ||
                                    ""
                                )}"
                            >
                                ${escapeHtml(
                                    lead.email ||
                                    "-"
                                )}
                            </a>

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

                            ${
                                assignee
                                    ? `
                                        <div class="dashboard-assignee">

                                            <span class="dashboard-assignee-avatar">
                                                ${escapeHtml(
                                                    getDashboardMemberInitials(
                                                        assignee.full_name
                                                    )
                                                )}
                                            </span>

                                            <span class="dashboard-assignee-details">

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

                                        </div>
                                    `
                                    : `
                                        <span class="dashboard-unassigned">
                                            Unassigned
                                        </span>
                                    `
                            }

                        </td>

                        <td>

                            <span
                                class="
                                    status
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

                            <button
                                type="button"
                                class="view-btn"
                                data-lead-id="${escapeHtml(
                                    lead.id
                                )}"
                            >
                                View
                            </button>

                        </td>

                    </tr>
                `;

            })
            .join("");

}


/* ---------------------------------
   LOAD LEADS
---------------------------------- */

async function loadLeads() {

    tableBody.innerHTML = `
        <tr>
            <td colspan="7">
                Loading leads...
            </td>
        </tr>
    `;


    const { data, error } =
        await supabaseClient
            .from("Leads")
            .select("*")
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
                <td colspan="7">
                    Unable to load leads.
                </td>
            </tr>
        `;


        return;

    }


    leads =
        data ?? [];


    updateStatistics();

    renderLeads();

}


/* ---------------------------------
   SAVE LEAD CHANGES
---------------------------------- */

async function saveLeadStatus() {

    if (!activeLeadId) {

        statusSaveMessage.textContent =
            "Lead ID was not found.";


        statusSaveMessage.style.color =
            "#dc2626";


        return;

    }


    const newStatus =
        modalStatusSelect.value;


    const notes =
        modalNotes.value.trim();


    const followUpAt =
        modalFollowUp.value
            ? new Date(
                modalFollowUp.value
            ).toISOString()
            : null;


    const selectedLead =
        leads.find(
            lead =>
                String(lead.id) ===
                String(activeLeadId)
        );


    const updatePayload = {

        status:
            newStatus,

        notes:
            notes || null,

        follow_up_at:
            followUpAt,

        ...getDashboardAssignmentUpdate(
            selectedLead,
            modalAssignedTo.value
        )

    };


    saveStatusButton.disabled =
        true;


    saveStatusButton.textContent =
        "Saving...";


    modalAssignedTo.disabled =
        true;


    statusSaveMessage.textContent =
        "";


    const { data, error } =
        await supabaseClient
            .from("Leads")
            .update(
                updatePayload
            )
            .eq(
                "id",
                activeLeadId
            )
            .select(
                `
                    id,
                    status,
                    notes,
                    follow_up_at,
                    assigned_to,
                    assigned_by,
                    assigned_at
                `
            )
            .single();


    if (error) {

        console.error(
            "Unable to update lead:",
            error
        );


        statusSaveMessage.textContent =
            "Unable to update lead.";


        statusSaveMessage.style.color =
            "#dc2626";


        saveStatusButton.disabled =
            false;


        saveStatusButton.textContent =
            "Save Changes";


        modalAssignedTo.disabled =
            !canManageAssignments;


        return;

    }


    const leadIndex =
        leads.findIndex(
            lead =>
                String(lead.id) ===
                String(activeLeadId)
        );


    if (leadIndex !== -1) {

        leads[leadIndex].status =
            data.status;


        leads[leadIndex].notes =
            data.notes;


        leads[leadIndex].follow_up_at =
            data.follow_up_at;


        leads[leadIndex].assigned_to =
            data.assigned_to;


        leads[leadIndex].assigned_by =
            data.assigned_by;


        leads[leadIndex].assigned_at =
            data.assigned_at;

    }


    updateStatistics();

    renderLeads();

    await loadFollowUpNotifications();

    await loadDashboardLeadActivities();


    statusSaveMessage.textContent =
        "Lead updated successfully.";


    statusSaveMessage.style.color =
        "#047857";


    saveStatusButton.disabled =
        false;


    saveStatusButton.textContent =
        "Save Changes";


    populateDashboardAssignmentOptions(
        data.assigned_to
    );

}


/* ---------------------------------
   OPEN LEAD FROM URL
---------------------------------- */

function openLeadFromUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const leadId =
        params.get("lead");


    if (!leadId) {
        return;
    }


    openLeadModal(leadId);


    window.history.replaceState(
        {},
        "",
        "index.html"
    );

}


/* ---------------------------------
   EVENT LISTENERS
---------------------------------- */

searchInput.addEventListener(
    "input",
    renderLeads
);


statusFilter.addEventListener(
    "change",
    renderLeads
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


tableBody.addEventListener(
    "click",
    (event) => {

        const viewButton =
            event.target.closest(
                ".view-btn"
            );


        if (!viewButton) {
            return;
        }


        openLeadModal(
            viewButton.dataset.leadId
        );

    }
);


modalCloseButton.addEventListener(
    "click",
    closeLeadModal
);


leadModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target.hasAttribute(
                "data-close-modal"
            )
        ) {

            closeLeadModal();

        }

    }
);


saveStatusButton.addEventListener(
    "click",
    saveLeadStatus
);
dashboardRefreshActivityButton.addEventListener(
    "click",
    loadDashboardLeadActivities
);


document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            leadModal.classList.contains(
                "active"
            )
        ) {

            closeLeadModal();

        }
        if (
    event.key === "Escape" &&
    notificationPanel.classList
        .contains("active")
) {

    closeNotificationPanel();

}

    }
);
notificationButton.addEventListener(
    "click",
    toggleNotificationPanel
);


notificationCloseButton.addEventListener(
    "click",
    closeNotificationPanel
);

refreshNotificationsButton.addEventListener(
    "click",
    async () => {

        clearNotificationActionMessage();

        await loadFollowUpNotifications();

    }
);

notificationList.addEventListener(
    "click",
    async (event) => {

        const actionButton =
            event.target.closest(
                "[data-notification-action]"
            );


        if (!actionButton) {
            return;
        }


        const leadId =
            actionButton.dataset
                .notificationLeadId;


        const action =
            actionButton.dataset
                .notificationAction;


        if (action === "open") {

            closeNotificationPanel();


            openLeadModal(
                leadId
            );


            return;

        }


        if (action === "snooze") {

            await snoozeNotificationLead(
                leadId,
                actionButton
            );


            return;

        }


        if (action === "complete") {

            await completeNotificationLead(
                leadId,
                actionButton
            );

        }

    }
);
document.addEventListener(
    "click",
    (event) => {

        const panelIsOpen =
            notificationPanel.classList
                .contains("active");


        if (!panelIsOpen) {
            return;
        }


        if (
            notificationCenter.contains(
                event.target
            )
        ) {
            return;
        }


        closeNotificationPanel();

    }
);


/* ---------------------------------
   INITIALISE DASHBOARD
---------------------------------- */

async function initialiseDashboard() {

    const isAuthenticated =
        await protectDashboard();


    if (!isAuthenticated) {
        return;
    }


    await window
        .loadAndApplyCrmSettings();


    await loadAssignmentContext();


    await loadLeads();
    await loadFollowUpNotifications();



    openLeadFromUrl();

}


initialiseDashboard()
    .finally(() => {

        window.finishCrmPageLoading?.();

    });
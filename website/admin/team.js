(() => {

    "use strict";


    /* =================================
       SUPABASE
    ================================= */

    const supabaseClient =
        window.mkSupabase;
    const TEAM_INVITE_WEBHOOK_URL =
        window.MK_CONFIG?.TEAM_INVITE_WEBHOOK_URL ||
        "https://n8n.srv1856618.hstgr.cloud/webhook/crm-team-invite";


    /* =================================
       DOM ELEMENTS
    ================================= */

    const addMemberButton =
        document.getElementById(
            "add-member-btn"
        );

    const logoutButton =
        document.getElementById(
            "logout-btn"
        );

    const refreshTeamButton =
        document.getElementById(
            "refresh-team-btn"
        );

    const teamPageMessage =
        document.getElementById(
            "team-page-message"
        );


    const teamTotalCount =
        document.getElementById(
            "team-total-count"
        );

    const teamActiveCount =
        document.getElementById(
            "team-active-count"
        );

    const teamManagerCount =
        document.getElementById(
            "team-manager-count"
        );

    const teamEmployeeCount =
        document.getElementById(
            "team-employee-count"
        );


    const teamSearch =
        document.getElementById(
            "team-search"
        );

    const teamRoleFilter =
        document.getElementById(
            "team-role-filter"
        );

    const teamStatusFilter =
        document.getElementById(
            "team-status-filter"
        );


    const teamLoading =
        document.getElementById(
            "team-loading"
        );

    const teamEmpty =
        document.getElementById(
            "team-empty"
        );

    const teamTableWrapper =
        document.getElementById(
            "team-table-wrapper"
        );

    const teamTableBody =
        document.getElementById(
            "team-table-body"
        );


    const teamModal =
        document.getElementById(
            "team-modal"
        );

    const teamModalTitle =
        document.getElementById(
            "team-modal-title"
        );

    const closeTeamModalButton =
        document.getElementById(
            "close-team-modal-btn"
        );

    const teamMemberForm =
        document.getElementById(
            "team-member-form"
        );

    const memberIdInput =
        document.getElementById(
            "member-id"
        );

    const memberFullNameInput =
        document.getElementById(
            "member-full-name"
        );

    const memberEmailInput =
        document.getElementById(
            "member-email"
        );

    const memberPhoneInput =
        document.getElementById(
            "member-phone"
        );

    const memberRoleInput =
        document.getElementById(
            "member-role"
        );

    const memberStatusInput =
        document.getElementById(
            "member-status"
        );

    const memberIsTestInput =
        document.getElementById(
            "member-is-test"
        );

    const teamFormMessage =
        document.getElementById(
            "team-form-message"
        );

    const saveMemberButton =
        document.getElementById(
            "save-member-btn"
        );

    const modalCloseElements =
        document.querySelectorAll(
            "[data-close-team-modal]"
        );

    const archiveMemberModal =
        document.getElementById(
            "archive-member-modal"
        );

    const archiveMemberForm =
        document.getElementById(
            "archive-member-form"
        );

    const archiveMemberIdInput =
        document.getElementById(
            "archive-member-id"
        );

    const archiveMemberName =
        document.getElementById(
            "archive-member-name"
        );

    const archiveTransferTo =
        document.getElementById(
            "archive-transfer-to"
        );

    const archiveTransferHelp =
        document.getElementById(
            "archive-transfer-help"
        );

    const archiveMemberMessage =
        document.getElementById(
            "archive-member-message"
        );

    const confirmArchiveMemberButton =
        document.getElementById(
            "confirm-archive-member-btn"
        );

    const closeArchiveModalButton =
        document.getElementById(
            "close-archive-modal-btn"
        );

    const archiveModalCloseElements =
        document.querySelectorAll(
            "[data-close-archive-modal]"
        );


    /* =================================
       STATE
    ================================= */

    let teamMembers = [];

    let assignedLeadCounts =
        new Map();

    let currentAuthUserId =
        null;

    let currentMemberId =
        null;

    let activeArchiveMemberId =
        null;


    /* =================================
       BASIC HELPERS
    ================================= */

    function escapeHtml(
        value
    ) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    function formatLabel(
        value
    ) {

        if (!value) {
            return "-";
        }


        return String(value)
            .replaceAll("_", " ")
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );

    }


    function formatDate(
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


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    function getMemberInitials(
        fullName
    ) {

        const parts =
            String(fullName || "")
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (
            parts.length === 0
        ) {
            return "TM";
        }


        if (
            parts.length === 1
        ) {

            return parts[0]
                .slice(0, 2)
                .toUpperCase();

        }


        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();

    }


    function normalizeEmail(
        value
    ) {

        return String(value || "")
            .trim()
            .toLowerCase();

    }


    function normalizePhone(
        value
    ) {

        return String(value || "")
            .trim()
            .replace(/[^\d+]/g, "");

    }


    function isCurrentAccount(
        member
    ) {

        return Boolean(
            member.auth_user_id &&
            currentAuthUserId &&
            String(
                member.auth_user_id
            ) ===
            String(
                currentAuthUserId
            )
        );

    }


    /* =================================
       PAGE MESSAGES
    ================================= */

    function showTeamPageMessage(
        message,
        type = "info"
    ) {

        teamPageMessage.hidden =
            false;

        teamPageMessage.textContent =
            message;

        teamPageMessage.className =
            `team-page-message ${type}`;

    }


    function clearTeamPageMessage() {

        teamPageMessage.hidden =
            true;

        teamPageMessage.textContent =
            "";

        teamPageMessage.className =
            "team-page-message";

    }


    function showTeamFormMessage(
        message,
        type = "info"
    ) {

        teamFormMessage.hidden =
            false;

        teamFormMessage.textContent =
            message;

        teamFormMessage.className =
            `team-form-message ${type}`;

    }


    function clearTeamFormMessage() {

        teamFormMessage.hidden =
            true;

        teamFormMessage.textContent =
            "";

        teamFormMessage.className =
            "team-form-message";

    }


    function showArchiveMemberMessage(
        message,
        type = "info"
    ) {

        archiveMemberMessage.hidden =
            false;

        archiveMemberMessage.textContent =
            message;

        archiveMemberMessage.className =
            `team-form-message ${type}`;

    }


    function clearArchiveMemberMessage() {

        archiveMemberMessage.hidden =
            true;

        archiveMemberMessage.textContent =
            "";

        archiveMemberMessage.className =
            "team-form-message";

    }


    /* =================================
       AUTHENTICATION + ACCESS
    ================================= */

    async function protectTeamPage() {

        if (!supabaseClient) {

            console.error(
                "Supabase client is unavailable."
            );

            window.location.href =
                "login.html";

            return false;

        }


        const {
            data: sessionData,
            error: sessionError
        } =
            await supabaseClient
                .auth
                .getSession();


        if (
            sessionError ||
            !sessionData.session
        ) {

            window.location.href =
                "login.html";

            return false;

        }


        currentAuthUserId =
            sessionData
                .session
                .user
                .id;


        const {
            data: canManage,
            error: roleError
        } =
            await supabaseClient
                .rpc(
                    "can_manage_crm"
                );


        if (
            roleError ||
            canManage !== true
        ) {

            console.error(
                "Team access denied:",
                roleError
            );


            window.location.href =
                "index.html";

            return false;

        }


        return true;

    }


    /* =================================
       LOADING STATE
    ================================= */

    function showTeamLoading() {

        teamLoading.hidden =
            false;

        teamLoading.textContent =
            "Loading team members...";

        teamLoading.style.color =
            "";

        teamEmpty.hidden =
            true;

        teamTableWrapper.hidden =
            true;

        refreshTeamButton.disabled =
            true;

        refreshTeamButton.textContent =
            "Refreshing...";

    }


    function hideTeamLoading() {

        teamLoading.hidden =
            true;

        refreshTeamButton.disabled =
            false;

        refreshTeamButton.textContent =
            "Refresh";

    }


    function showTeamLoadingError(
        message
    ) {

        teamLoading.hidden =
            false;

        teamLoading.textContent =
            message;

        teamLoading.style.color =
            "#dc2626";

        teamEmpty.hidden =
            true;

        teamTableWrapper.hidden =
            true;

        refreshTeamButton.disabled =
            false;

        refreshTeamButton.textContent =
            "Refresh";

    }


    /* =================================
       STATISTICS
    ================================= */

    function updateTeamStatistics() {

        const directoryMembers =
            teamMembers.filter(
                member =>
                    member.is_archived !== true
            );


        const activeMembers =
            directoryMembers.filter(
                member =>
                    member.status ===
                    "active"
            );


        const managers =
            directoryMembers.filter(
                member =>
                    member.role ===
                    "manager"
            );


        const employees =
            directoryMembers.filter(
                member =>
                    member.role ===
                    "employee"
            );


        teamTotalCount.textContent =
            String(
                directoryMembers.length
            );

        teamActiveCount.textContent =
            String(
                activeMembers.length
            );

        teamManagerCount.textContent =
            String(
                managers.length
            );

        teamEmployeeCount.textContent =
            String(
                employees.length
            );

    }


    /* =================================
       FILTER TEAM MEMBERS
    ================================= */

    function getFilteredTeamMembers() {

        const searchValue =
            teamSearch.value
                .trim()
                .toLowerCase();


        const roleValue =
            teamRoleFilter.value;


        const statusValue =
            teamStatusFilter.value;


        return teamMembers.filter(
            member => {

                const searchText = [

                    member.full_name,
                    member.email,
                    member.phone

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !searchValue ||
                    searchText.includes(
                        searchValue
                    );


                const matchesRole =
                    roleValue === "all" ||
                    member.role ===
                        roleValue;


                const effectiveStatus =
                    member.is_archived === true
                        ? "archived"
                        : member.status;


                const matchesStatus =
                    statusValue === "all" ||
                    effectiveStatus ===
                        statusValue;


                return (
                    matchesSearch &&
                    matchesRole &&
                    matchesStatus
                );

            }
        );

    }


    /* =================================
       RENDER TEAM TABLE
    ================================= */

    function renderTeamMembers() {

        const filteredMembers =
            getFilteredTeamMembers();


        updateTeamStatistics();


        teamLoading.hidden =
            true;


        if (
            filteredMembers.length === 0
        ) {

            teamEmpty.hidden =
                false;

            teamTableWrapper.hidden =
                true;

            teamTableBody.innerHTML =
                "";

            return;

        }


        teamEmpty.hidden =
            true;

        teamTableWrapper.hidden =
            false;


        teamTableBody.innerHTML =
            filteredMembers
                .map(
                    member => {

                        const assignedCount =
                            assignedLeadCounts.get(
                                String(
                                    member.id
                                )
                            ) || 0;


                        const currentAccount =
                            isCurrentAccount(
                                member
                            );


                        const archived =
                            member.is_archived === true;


                        const effectiveStatus =
                            archived
                                ? "archived"
                                : member.status;


                        const nextStatus =
                            member.status ===
                                "active"
                                ? "inactive"
                                : "active";


                        const statusButtonText =
                            member.status ===
                                "active"
                                ? "Deactivate"
                                : "Activate";


                        const statusButtonClass =
                            member.status ===
                                "active"
                                ? "deactivate"
                                : "activate";


                        const connectionLabel =
                            member.auth_user_id
                                ? "CRM login connected"
                                : "Login invite pending";


                        const accountConnectionText = [
                            connectionLabel,
                            member.is_test
                                ? "Test account"
                                : "",
                            archived
                                ? "Archived"
                                : ""
                        ]
                            .filter(Boolean)
                            .join(" · ");


                        const phoneValue =
                            member.phone ||
                            "No phone number";


                        const inviteAction =
                            !member.auth_user_id &&
                            !archived &&
                            member.status !== "inactive"
                                ? `
                                    <button
                                        type="button"
                                        class="team-invite-btn"
                                        data-team-action="invite-test"
                                        data-member-id="${escapeHtml(member.id)}"
                                    >
                                        Send Invite
                                    </button>
                                `
                                : "";


                        const statusAction =
                            currentAccount
                                ? `
                                    <button
                                        type="button"
                                        class="team-status-btn deactivate"
                                        disabled
                                        title="Current account is protected"
                                    >
                                        Current Account
                                    </button>
                                `
                                : archived
                                    ? ""
                                    : `
                                        <button
                                            type="button"
                                            class="team-status-btn ${escapeHtml(statusButtonClass)}"
                                            data-team-action="status"
                                            data-member-id="${escapeHtml(member.id)}"
                                            data-next-status="${escapeHtml(nextStatus)}"
                                        >
                                            ${escapeHtml(statusButtonText)}
                                        </button>
                                    `;


                        const archiveAction =
                            currentAccount
                                ? ""
                                : archived
                                    ? `
                                        <button
                                            type="button"
                                            class="team-restore-btn"
                                            data-team-action="restore"
                                            data-member-id="${escapeHtml(member.id)}"
                                        >
                                            Restore
                                        </button>
                                    `
                                    : `
                                        <button
                                            type="button"
                                            class="team-archive-btn"
                                            data-team-action="archive"
                                            data-member-id="${escapeHtml(member.id)}"
                                        >
                                            Archive
                                        </button>
                                    `;


                        const deleteTestAction =
                            member.is_test === true &&
                            !currentAccount
                                ? `
                                    <button
                                        type="button"
                                        class="team-delete-test-btn"
                                        data-team-action="delete-test"
                                        data-member-id="${escapeHtml(member.id)}"
                                        title="Permanently delete this test account"
                                    >
                                        Delete Test
                                    </button>
                                `
                                : "";


                        return `
                            <tr class="${archived ? "team-row-archived" : ""}">

                                <td>
                                    <div class="team-member-profile">
                                        <div class="team-member-avatar">
                                            ${escapeHtml(getMemberInitials(member.full_name))}
                                        </div>

                                        <div class="team-member-details">
                                            <strong>
                                                ${escapeHtml(member.full_name)}
                                                ${member.is_test ? '<span class="team-test-label">TEST</span>' : ""}
                                            </strong>
                                            <span>${escapeHtml(accountConnectionText)}</span>
                                        </div>
                                    </div>
                                </td>

                                <td>
                                    <div class="team-contact-details">
                                        <a href="mailto:${escapeHtml(member.email)}">
                                            ${escapeHtml(member.email)}
                                        </a>
                                        <span>${escapeHtml(phoneValue)}</span>
                                    </div>
                                </td>

                                <td>
                                    <span class="team-role-badge ${escapeHtml(member.role)}">
                                        ${escapeHtml(formatLabel(member.role))}
                                    </span>
                                </td>

                                <td>
                                    <span class="team-status-badge ${escapeHtml(effectiveStatus)}">
                                        ${escapeHtml(formatLabel(effectiveStatus))}
                                    </span>
                                </td>

                                <td>
                                    <span class="team-assigned-count">
                                        ${escapeHtml(assignedCount)}
                                    </span>
                                </td>

                                <td>
                                    ${escapeHtml(formatDate(member.created_at))}
                                </td>

                                <td>
                                    <div class="team-table-actions">
                                        ${inviteAction}

                                        <button
                                            type="button"
                                            class="team-edit-btn"
                                            data-team-action="edit"
                                            data-member-id="${escapeHtml(member.id)}"
                                        >
                                            Edit
                                        </button>

                                        ${statusAction}
                                        ${archiveAction}
                                        ${deleteTestAction}
                                    </div>
                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");

    }


    /* =================================
       LOAD TEAM MEMBERS
    ================================= */

    async function loadAssignedLeadCounts() {

        assignedLeadCounts =
            new Map();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("Leads")
                .select(`
                    assigned_to
                `)
                .eq(
                    "is_archived",
                    false
                )
                .not(
                    "assigned_to",
                    "is",
                    null
                );


        if (error) {

            console.error(
                "Unable to load assigned lead counts:",
                error
            );

            return;

        }


        for (
            const lead of data ?? []
        ) {

            const memberId =
                String(
                    lead.assigned_to
                );


            const currentCount =
                assignedLeadCounts.get(
                    memberId
                ) || 0;


            assignedLeadCounts.set(
                memberId,
                currentCount + 1
            );

        }

    }


    async function loadTeamMembers() {

        showTeamLoading();

        clearTeamPageMessage();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("team_members")
                .select(`
                    id,
                    auth_user_id,
                    full_name,
                    email,
                    phone,
                    role,
                    status,
                    is_archived,
                    archived_at,
                    archived_by,
                    is_test,
                    created_at,
                    updated_at
                `)
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Unable to load team members:",
                error
            );


            showTeamLoadingError(
                `Unable to load team members: ${error.message}`
            );

            return;

        }


        teamMembers =
            data ?? [];


        await loadAssignedLeadCounts();


        hideTeamLoading();

        renderTeamMembers();

    }


    /* =================================
       MODAL
    ================================= */

    function resetTeamMemberForm() {

        teamMemberForm.reset();

        memberIdInput.value =
            "";

        memberRoleInput.value =
            "employee";

        memberStatusInput.value =
            "invited";

        memberIsTestInput.checked =
            false;

        memberEmailInput.disabled =
            false;

        memberRoleInput.disabled =
            false;

        memberStatusInput.disabled =
            false;

        memberIsTestInput.disabled =
            false;

        currentMemberId =
            null;

        clearTeamFormMessage();

    }


    function openAddMemberModal() {

        resetTeamMemberForm();


        teamModalTitle.textContent =
            "Add Team Member";

        saveMemberButton.textContent =
            "Save Team Member";


        teamModal.classList.add(
            "active"
        );

        teamModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "team-modal-open"
        );


        window.setTimeout(
            () => {

                memberFullNameInput.focus();

            },
            50
        );

    }


    function openEditMemberModal(
        memberId
    ) {

        const member =
            teamMembers.find(
                item =>
                    String(item.id) ===
                    String(memberId)
            );


        if (!member) {

            showTeamPageMessage(
                "Team member was not found.",
                "error"
            );

            return;

        }


        resetTeamMemberForm();


        currentMemberId =
            member.id;


        memberIdInput.value =
            member.id;

        memberFullNameInput.value =
            member.full_name || "";

        memberEmailInput.value =
            member.email || "";

        memberPhoneInput.value =
            member.phone || "";

        memberRoleInput.value =
            member.role || "employee";

        memberStatusInput.value =
            member.status || "invited";

        memberIsTestInput.checked =
            member.is_test === true;


        /*
        Connected login email should not be
        changed only in team_members table.
        */

        if (member.auth_user_id) {

            memberEmailInput.disabled =
                true;

        }


        /*
        Protect current logged-in account
        from accidental role/status changes.
        */

        if (
            isCurrentAccount(
                member
            )
        ) {

            memberRoleInput.disabled =
                true;

            memberStatusInput.disabled =
                true;

            memberIsTestInput.disabled =
                true;

        }


        if (member.is_archived === true) {

            memberStatusInput.disabled =
                true;

        }


        teamModalTitle.textContent =
            "Edit Team Member";

        saveMemberButton.textContent =
            "Update Team Member";


        teamModal.classList.add(
            "active"
        );

        teamModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "team-modal-open"
        );


        window.setTimeout(
            () => {

                memberFullNameInput.focus();

            },
            50
        );

    }


    function closeTeamMemberModal() {

        teamModal.classList.remove(
            "active"
        );

        teamModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "team-modal-open"
        );

        resetTeamMemberForm();

    }


    /* =================================
       ARCHIVE / RESTORE / TEST DELETE
    ================================= */

    function closeArchiveMemberModal() {

        archiveMemberModal.classList.remove(
            "active"
        );

        archiveMemberModal.setAttribute(
            "aria-hidden",
            "true"
        );

        archiveMemberForm.reset();

        archiveMemberIdInput.value =
            "";

        activeArchiveMemberId =
            null;

        confirmArchiveMemberButton.disabled =
            false;

        confirmArchiveMemberButton.textContent =
            "Archive Member";

        clearArchiveMemberMessage();

        document.body.classList.remove(
            "team-modal-open"
        );

    }


    function openArchiveMemberModal(
        memberId
    ) {

        const member =
            teamMembers.find(
                item =>
                    String(item.id) ===
                    String(memberId)
            );


        if (!member) {

            showTeamPageMessage(
                "Team member was not found.",
                "error"
            );

            return;

        }


        if (
            isCurrentAccount(
                member
            )
        ) {

            showTeamPageMessage(
                "Your current admin account cannot be archived.",
                "error"
            );

            return;

        }


        if (member.is_archived === true) {

            showTeamPageMessage(
                "This team member is already archived.",
                "info"
            );

            return;

        }


        activeArchiveMemberId =
            member.id;

        archiveMemberIdInput.value =
            member.id;

        archiveMemberName.textContent =
            member.full_name;


        const assignedCount =
            assignedLeadCounts.get(
                String(member.id)
            ) || 0;


        const transferCandidates =
            teamMembers.filter(
                candidate =>
                    String(candidate.id) !==
                        String(member.id) &&
                    candidate.is_archived !== true &&
                    candidate.status === "active"
            );


        archiveTransferTo.innerHTML =
            assignedCount > 0
                ? `
                    <option value="">Select a team member</option>
                    ${transferCandidates
                        .map(
                            candidate => `
                                <option value="${escapeHtml(candidate.id)}">
                                    ${escapeHtml(candidate.full_name)} — ${escapeHtml(formatLabel(candidate.role))}
                                </option>
                            `
                        )
                        .join("")}
                `
                : `
                    <option value="">No transfer required</option>
                `;


        archiveTransferTo.required =
            assignedCount > 0;

        archiveTransferTo.disabled =
            assignedCount === 0;


        if (assignedCount > 0) {

            archiveTransferHelp.textContent =
                `${assignedCount} active lead(s) must be transferred before archive.`;

            if (transferCandidates.length === 0) {

                confirmArchiveMemberButton.disabled =
                    true;

                showArchiveMemberMessage(
                    "No active team member is available for lead transfer. Activate or add another member first.",
                    "error"
                );

            } else {

                confirmArchiveMemberButton.disabled =
                    false;

                clearArchiveMemberMessage();

            }

        } else {

            archiveTransferHelp.textContent =
                "No active assigned leads found. CRM history will still be preserved.";

            confirmArchiveMemberButton.disabled =
                false;

            clearArchiveMemberMessage();

        }


        archiveMemberModal.classList.add(
            "active"
        );

        archiveMemberModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "team-modal-open"
        );

    }


    async function archiveTeamMember(
        event
    ) {

        event.preventDefault();


        const member =
            teamMembers.find(
                item =>
                    String(item.id) ===
                    String(activeArchiveMemberId)
            );


        if (!member) {

            showArchiveMemberMessage(
                "Team member was not found.",
                "error"
            );

            return;

        }


        const assignedCount =
            assignedLeadCounts.get(
                String(member.id)
            ) || 0;


        const transferTo =
            archiveTransferTo.value ||
            null;


        if (
            assignedCount > 0 &&
            !transferTo
        ) {

            showArchiveMemberMessage(
                "Select a team member to receive the assigned leads.",
                "error"
            );

            return;

        }


        confirmArchiveMemberButton.disabled =
            true;

        confirmArchiveMemberButton.textContent =
            "Archiving...";

        showArchiveMemberMessage(
            "Transferring leads and archiving the account...",
            "info"
        );


        const {
            data,
            error
        } =
            await supabaseClient
                .rpc(
                    "crm_archive_team_member",
                    {
                        p_member_id:
                            String(member.id),
                        p_transfer_to:
                            transferTo
                                ? String(transferTo)
                                : null
                    }
                );


        if (error) {

            console.error(
                "Unable to archive team member:",
                error
            );

            showArchiveMemberMessage(
                `Unable to archive team member: ${error.message}`,
                "error"
            );

            confirmArchiveMemberButton.disabled =
                false;

            confirmArchiveMemberButton.textContent =
                "Archive Member";

            return;

        }


        const transferredCount =
            Number(
                data?.transferred_leads ??
                assignedCount
            ) || 0;


        closeArchiveMemberModal();

        await loadTeamMembers();

        showTeamPageMessage(
            `${member.full_name} archived successfully. ${transferredCount} active lead(s) transferred.`,
            "success"
        );

    }


    async function restoreTeamMember(
        memberId,
        button
    ) {

        const member =
            teamMembers.find(
                item =>
                    String(item.id) ===
                    String(memberId)
            );


        if (!member) {

            showTeamPageMessage(
                "Team member was not found.",
                "error"
            );

            return;

        }


        const confirmed =
            window.confirm(
                `Restore ${member.full_name}?\n\nThe account will be restored as inactive. Activate it separately when login access should resume.`
            );


        if (!confirmed) {
            return;
        }


        button.disabled =
            true;

        const originalText =
            button.textContent;

        button.textContent =
            "Restoring...";


        const {
            error
        } =
            await supabaseClient
                .rpc(
                    "crm_restore_team_member",
                    {
                        p_member_id:
                            String(member.id)
                    }
                );


        if (error) {

            console.error(
                "Unable to restore team member:",
                error
            );

            showTeamPageMessage(
                `Unable to restore team member: ${error.message}`,
                "error"
            );

            button.disabled =
                false;

            button.textContent =
                originalText;

            return;

        }


        await loadTeamMembers();

        showTeamPageMessage(
            `${member.full_name} restored as inactive. Activate the account when ready.`,
            "success"
        );

    }


    async function deleteTestTeamMember(
        memberId,
        button
    ) {

        const member =
            teamMembers.find(
                item =>
                    String(item.id) ===
                    String(memberId)
            );


        if (!member) {

            showTeamPageMessage(
                "Team member was not found.",
                "error"
            );

            return;

        }


        if (
            member.is_test !== true
        ) {

            showTeamPageMessage(
                "Permanent deletion is allowed only for accounts marked as test.",
                "error"
            );

            return;

        }


        if (
            isCurrentAccount(
                member
            )
        ) {

            showTeamPageMessage(
                "Your current admin account cannot be deleted.",
                "error"
            );

            return;

        }


        const assignedCount =
            assignedLeadCounts.get(
                String(member.id)
            ) || 0;


        if (assignedCount > 0) {

            showTeamPageMessage(
                "Archive this test member and transfer assigned leads before permanent deletion.",
                "error"
            );

            return;

        }


        const confirmationText =
            `DELETE ${member.full_name}`;

        const typedValue =
            window.prompt(
                `This permanently deletes the test CRM account and connected Supabase Auth user.\n\nType exactly:\n${confirmationText}`
            );


        if (typedValue !== confirmationText) {

            if (typedValue !== null) {

                showTeamPageMessage(
                    "Delete confirmation did not match. No data was deleted.",
                    "info"
                );

            }

            return;

        }


        button.disabled =
            true;

        const originalText =
            button.textContent;

        button.textContent =
            "Deleting...";


        const {
            error
        } =
            await supabaseClient
                .rpc(
                    "crm_delete_test_team_member",
                    {
                        p_member_id:
                            String(member.id)
                    }
                );


        if (error) {

            console.error(
                "Unable to delete test team member:",
                error
            );

            showTeamPageMessage(
                `Unable to delete test account: ${error.message}`,
                "error"
            );

            button.disabled =
                false;

            button.textContent =
                originalText;

            return;

        }


        await loadTeamMembers();

        showTeamPageMessage(
            `${member.full_name} test account permanently deleted.`,
            "success"
        );

    }


    /* =================================
       SAVE BUTTON STATE
    ================================= */

    function setSaveMemberBusy(
        isBusy
    ) {

        saveMemberButton.disabled =
            isBusy;

        memberFullNameInput.disabled =
            isBusy;

        memberPhoneInput.disabled =
            isBusy;


        const existingMember =
            teamMembers.find(
                member =>
                    String(member.id) ===
                    String(currentMemberId)
            );


        const emailShouldRemainDisabled =
            Boolean(
                existingMember &&
                existingMember.auth_user_id
            );


        const currentAccount =
            Boolean(
                existingMember &&
                isCurrentAccount(
                    existingMember
                )
            );


        if (isBusy) {

            memberEmailInput.disabled =
                true;

            memberRoleInput.disabled =
                true;

            memberStatusInput.disabled =
                true;

            memberIsTestInput.disabled =
                true;

            saveMemberButton.textContent =
                currentMemberId
                    ? "Updating..."
                    : "Saving...";

            return;

        }


        memberEmailInput.disabled =
            emailShouldRemainDisabled;

        memberRoleInput.disabled =
            currentAccount;

        memberStatusInput.disabled =
            currentAccount ||
            existingMember?.is_archived === true;

        memberIsTestInput.disabled =
            currentAccount;


        saveMemberButton.textContent =
            currentMemberId
                ? "Update Team Member"
                : "Save Team Member";

    }


    /* =================================
       VALIDATION
    ================================= */

    function validateTeamMemberForm(
        memberData
    ) {

        if (
            memberData.full_name.length <
            2
        ) {

            return "Please enter a valid full name.";

        }


        if (
            !memberData.email ||
            !memberData.email.includes("@")
        ) {

            return "Please enter a valid email address.";

        }


        if (
            memberData.phone &&
            memberData.phone
                .replace(/\D/g, "")
                .length < 8
        ) {

            return "Please enter a valid phone number.";

        }


        if (
            ![
                "admin",
                "manager",
                "employee"
            ].includes(
                memberData.role
            )
        ) {

            return "Please select a valid CRM role.";

        }


        if (
            ![
                "active",
                "invited",
                "inactive"
            ].includes(
                memberData.status
            )
        ) {

            return "Please select a valid account status.";

        }


        const duplicateMember =
            teamMembers.find(
                member => {

                    const sameEmail =
                        normalizeEmail(
                            member.email
                        ) ===
                        memberData.email;


                    const differentRecord =
                        String(member.id) !==
                        String(
                            currentMemberId
                        );


                    return (
                        sameEmail &&
                        differentRecord
                    );

                }
            );


        if (duplicateMember) {

            return "A team member with this email already exists.";

        }


        return "";

    }


    /* =================================
       SAVE TEAM MEMBER
    ================================= */

    async function saveTeamMember(
        event
    ) {

        event.preventDefault();

        clearTeamFormMessage();


        const existingMember =
            teamMembers.find(
                member =>
                    String(member.id) ===
                    String(currentMemberId)
            );


        const memberData = {

            full_name:
                memberFullNameInput
                    .value
                    .trim(),

            email:
                existingMember &&
                existingMember.auth_user_id
                    ? normalizeEmail(
                        existingMember.email
                    )
                    : normalizeEmail(
                        memberEmailInput.value
                    ),

            phone:
                normalizePhone(
                    memberPhoneInput.value
                ) || null,

            role:
                existingMember &&
                isCurrentAccount(
                    existingMember
                )
                    ? existingMember.role
                    : memberRoleInput.value,

            status:
                existingMember &&
                (
                    isCurrentAccount(
                        existingMember
                    ) ||
                    existingMember.is_archived === true
                )
                    ? existingMember.status
                    : memberStatusInput.value,

            is_test:
                existingMember &&
                isCurrentAccount(
                    existingMember
                )
                    ? existingMember.is_test === true
                    : memberIsTestInput.checked === true

        };


        const validationError =
            validateTeamMemberForm(
                memberData
            );


        if (validationError) {

            showTeamFormMessage(
                validationError,
                "error"
            );

            return;

        }


        setSaveMemberBusy(
            true
        );


        showTeamFormMessage(
            currentMemberId
                ? "Updating team member..."
                : "Adding team member...",
            "info"
        );


        let databaseError =
            null;


        if (currentMemberId) {

            /*
            Use a server-side RPC for edits. A direct browser UPDATE can
            be silently filtered by Row Level Security and return no error
            while changing zero rows. The RPC verifies the acting admin,
            protects the current account and persists is_test reliably.
            */

            const {
                error
            } =
                await supabaseClient
                    .rpc(
                        "crm_update_team_member",
                        {
                            p_member_id:
                                String(currentMemberId),

                            p_full_name:
                                memberData.full_name,

                            p_email:
                                memberData.email,

                            p_phone:
                                memberData.phone,

                            p_role:
                                memberData.role,

                            p_status:
                                memberData.status,

                            p_is_test:
                                memberData.is_test
                        }
                    );


            databaseError =
                error;

        } else {

            const {
                error
            } =
                await supabaseClient
                    .from("team_members")
                    .insert({

                        full_name:
                            memberData.full_name,

                        email:
                            memberData.email,

                        phone:
                            memberData.phone,

                        role:
                            memberData.role,

                        status:
                            memberData.status,

                        is_test:
                            memberData.is_test

                    });


            databaseError =
                error;

        }


        if (databaseError) {

            console.error(
                "Unable to save team member:",
                databaseError
            );


            let friendlyMessage =
                databaseError.code ===
                    "23505"
                    ? "A team member with this email already exists."
                    : `Unable to save team member: ${databaseError.message}`;


            if (
                databaseError.code === "PGRST202" ||
                databaseError.code === "42883" ||
                String(databaseError.message || "")
                    .toLowerCase()
                    .includes("crm_update_team_member")
            ) {

                friendlyMessage =
                    "Team update function is not installed yet. Run deployment/04_FIX_TEAM_MEMBER_UPDATE_RPC.sql in Supabase, then try again.";

            }


            showTeamFormMessage(
                friendlyMessage,
                "error"
            );


            setSaveMemberBusy(
                false
            );

            return;

        }


        const successMessage =
            currentMemberId
                ? "Team member updated successfully."
                : "Team member added successfully. Login access will be connected through the invitation step.";


        closeTeamMemberModal();


        await loadTeamMembers();


        showTeamPageMessage(
            successMessage,
            "success"
        );

    }


    /* =================================
       ACTIVATE / DEACTIVATE
    ================================= */

    async function changeMemberStatus(
        memberId,
        nextStatus,
        button
    ) {

        const member =
            teamMembers.find(
                item =>
                    String(item.id) ===
                    String(memberId)
            );


        if (!member) {

            showTeamPageMessage(
                "Team member was not found.",
                "error"
            );

            return;

        }


        if (
            isCurrentAccount(
                member
            )
        ) {

            showTeamPageMessage(
                "You cannot deactivate your current account from this page.",
                "error"
            );

            return;

        }


        if (member.is_archived === true) {

            showTeamPageMessage(
                "Restore the archived member before changing account status.",
                "error"
            );

            return;

        }


        if (
            nextStatus === "inactive"
        ) {

            const confirmed =
                window.confirm(
                    `Deactivate ${member.full_name}?\n\n` +
                    "The member will lose CRM access after their login account is connected."
                );


            if (!confirmed) {
                return;
            }

        }


        clearTeamPageMessage();


        button.disabled =
            true;


        const originalText =
            button.textContent;


        button.textContent =
            nextStatus === "active"
                ? "Activating..."
                : "Deactivating...";


        const {
            error
        } =
            await supabaseClient
                .from("team_members")
                .update({

                    status:
                        nextStatus

                })
                .eq(
                    "id",
                    memberId
                );


        if (error) {

            console.error(
                "Unable to update member status:",
                error
            );


            showTeamPageMessage(
                `Unable to update member status: ${error.message}`,
                "error"
            );


            button.disabled =
                false;

            button.textContent =
                originalText;

            return;

        }


        await loadTeamMembers();


        showTeamPageMessage(
            `${member.full_name} ${
                nextStatus === "active"
                    ? "activated"
                    : "deactivated"
            } successfully.`,
            "success"
        );

    }
/* =================================
   VERIFY TEAM INVITE WEBHOOK
================================= */

async function verifyTeamInviteAccess(
    memberId,
    button
) {

    const member =
        teamMembers.find(
            item =>
                String(item.id) ===
                String(memberId)
        );


    if (!member) {

        showTeamPageMessage(
            "Team member was not found.",
            "error"
        );

        return;

    }


    clearTeamPageMessage();


    button.disabled =
        true;


    const originalButtonText =
        button.textContent;


    button.textContent =
        "Sending...";


    const {
        data: sessionData,
        error: sessionError
    } =
        await supabaseClient
            .auth
            .getSession();


    const session =
        sessionData?.session;


    if (
        sessionError ||
        !session ||
        !session.access_token
    ) {

        console.error(
            "Unable to read CRM session:",
            sessionError
        );


        showTeamPageMessage(
            "Your CRM session is unavailable. Please login again.",
            "error"
        );


        button.disabled =
            false;

        button.textContent =
            originalButtonText;

        return;

    }


    showTeamPageMessage(
        "Sending secure CRM invitation through n8n...",
        "info"
    );


    try {

        const inviteRedirectUrl =
            new URL(
                "accept-invite.html",
                window.location.href
            ).href;


        const response =
            await fetch(
                TEAM_INVITE_WEBHOOK_URL,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${session.access_token}`

                    },

                    body:
                        JSON.stringify({

                            memberId:
                                member.id,

                            email:
                                member.email,

                            fullName:
                                member.full_name,

                            role:
                                member.role,

                            redirectTo:
                                inviteRedirectUrl

                        })
                }
            );


        const responseText =
            await response.text();


        let responseData =
            null;


        try {

            responseData =
                responseText
                    ? JSON.parse(
                        responseText
                    )
                    : {};

        } catch {

            responseData = {

                message:
                    responseText ||
                    "Unexpected webhook response."

            };

        }


        console.log(
            "Team invite verification response:",
            responseData
        );


        if (!response.ok) {

            throw new Error(
                responseData?.message ||
                `Webhook returned HTTP ${response.status}.`
            );

        }


        showTeamPageMessage(
            responseData?.message ||
            "Invitation request completed successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Team invite webhook error:",
            error
        );


        let friendlyMessage =
            error.message;


        if (
            error instanceof TypeError &&
            error.message.includes(
                "fetch"
            )
        ) {

            friendlyMessage =
                "Unable to connect to n8n. Confirm n8n is running and the webhook is listening.";

        }


        showTeamPageMessage(
            friendlyMessage,
            "error"
        );

    } finally {

        button.disabled =
            false;

        button.textContent =
            originalButtonText;

    }

}

    /* =================================
       TABLE ACTIONS
    ================================= */

    async function handleTeamTableAction(
        event
    ) {

        const actionButton =
            event.target.closest(
                "[data-team-action]"
            );


        if (!actionButton) {
            return;
        }


        const action =
            actionButton.dataset
                .teamAction;


        const memberId =
            actionButton.dataset
                .memberId;
        if (
    action === "invite-test"
) {

    await verifyTeamInviteAccess(
        memberId,
        actionButton
    );

    return;

}


        if (action === "edit") {

            openEditMemberModal(
                memberId
            );

            return;

        }


        if (action === "archive") {

            openArchiveMemberModal(
                memberId
            );

            return;

        }


        if (action === "restore") {

            await restoreTeamMember(
                memberId,
                actionButton
            );

            return;

        }


        if (action === "delete-test") {

            await deleteTestTeamMember(
                memberId,
                actionButton
            );

            return;

        }


        if (action === "status") {

            const nextStatus =
                actionButton.dataset
                    .nextStatus;


            await changeMemberStatus(
                memberId,
                nextStatus,
                actionButton
            );

        }

    }


    /* =================================
       LOGOUT
    ================================= */

    async function logout() {

        logoutButton.disabled =
            true;

        logoutButton.textContent =
            "Logging out...";


        const {
            error
        } =
            await supabaseClient
                .auth
                .signOut();


        if (error) {

            console.error(
                "Unable to logout:",
                error
            );


            showTeamPageMessage(
                `Unable to logout: ${error.message}`,
                "error"
            );


            logoutButton.disabled =
                false;

            logoutButton.textContent =
                "Logout";

            return;

        }


        window.location.href =
            "login.html";

    }


    /* =================================
       EVENT LISTENERS
    ================================= */

    addMemberButton.addEventListener(
        "click",
        openAddMemberModal
    );


    refreshTeamButton.addEventListener(
        "click",
        loadTeamMembers
    );


    teamSearch.addEventListener(
        "input",
        renderTeamMembers
    );


    teamRoleFilter.addEventListener(
        "change",
        renderTeamMembers
    );


    teamStatusFilter.addEventListener(
        "change",
        renderTeamMembers
    );


    teamTableBody.addEventListener(
        "click",
        handleTeamTableAction
    );


    teamMemberForm.addEventListener(
        "submit",
        saveTeamMember
    );


    archiveMemberForm.addEventListener(
        "submit",
        archiveTeamMember
    );


    closeTeamModalButton.addEventListener(
        "click",
        closeTeamMemberModal
    );


    modalCloseElements.forEach(
        element => {

            element.addEventListener(
                "click",
                closeTeamMemberModal
            );

        }
    );


    closeArchiveModalButton.addEventListener(
        "click",
        closeArchiveMemberModal
    );


    archiveModalCloseElements.forEach(
        element => {

            element.addEventListener(
                "click",
                closeArchiveMemberModal
            );

        }
    );


    logoutButton.addEventListener(
        "click",
        logout
    );


    document.addEventListener(
        "keydown",
        event => {

            if (event.key !== "Escape") {
                return;
            }


            if (
                archiveMemberModal.classList
                    .contains("active")
            ) {

                closeArchiveMemberModal();

                return;

            }


            if (
                teamModal.classList
                    .contains("active")
            ) {

                closeTeamMemberModal();

            }

        }
    );


    /* =================================
       INITIALIZE
    ================================= */

    async function initialiseTeamPage() {

        const hasAccess =
            await protectTeamPage();


        if (!hasAccess) {
            return;
        }


        if (
            typeof window
                .loadAndApplyCrmSettings ===
            "function"
        ) {

            await window
                .loadAndApplyCrmSettings();

        }


        await loadTeamMembers();

    }


    initialiseTeamPage()
        .finally(() => {

            window.finishCrmPageLoading?.();

        });

})();
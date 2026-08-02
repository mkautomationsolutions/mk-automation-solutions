(() => {

    "use strict";


    /* =================================
       SUPABASE
    ================================= */

    const supabaseClient =
        window.mkSupabase;


    /* =================================
       DOM ELEMENTS
    ================================= */

    const refreshPageButton =
        document.getElementById(
            "refresh-source-page-btn"
        );

    const logoutButton =
        document.getElementById(
            "logout-btn"
        );

    const pageMessage =
        document.getElementById(
            "source-page-message"
        );

    const sourceTotalCount =
        document.getElementById(
            "source-total-count"
        );

    const sourceEnabledCount =
        document.getElementById(
            "source-enabled-count"
        );

    const sourceAutoCount =
        document.getElementById(
            "source-auto-count"
        );

    const sourceWeekCount =
        document.getElementById(
            "source-week-count"
        );

    const intakeUrlElement =
        document.getElementById(
            "master-intake-url"
        );

    const copyIntakeUrlButton =
        document.getElementById(
            "copy-intake-url-btn"
        );

    const sourceSearch =
        document.getElementById(
            "source-search"
        );

    const sourceStatusFilter =
        document.getElementById(
            "source-status-filter"
        );

    const rulesLoading =
        document.getElementById(
            "source-rules-loading"
        );

    const rulesEmpty =
        document.getElementById(
            "source-rules-empty"
        );

    const rulesTableWrapper =
        document.getElementById(
            "source-rules-table-wrapper"
        );

    const rulesTableBody =
        document.getElementById(
            "source-rules-table-body"
        );

    const logsLoading =
        document.getElementById(
            "intake-logs-loading"
        );

    const logsEmpty =
        document.getElementById(
            "intake-logs-empty"
        );

    const logsTableWrapper =
        document.getElementById(
            "intake-logs-table-wrapper"
        );

    const logsTableBody =
        document.getElementById(
            "intake-logs-table-body"
        );

    const sourceModal =
        document.getElementById(
            "source-rule-modal"
        );

    const sourceModalTitle =
        document.getElementById(
            "source-rule-modal-title"
        );

    const closeSourceModalButton =
        document.getElementById(
            "close-source-modal-btn"
        );

    const sourceRuleForm =
        document.getElementById(
            "source-rule-form"
        );

    const sourceRuleIdInput =
        document.getElementById(
            "source-rule-id"
        );

    const sourceDisplayNameInput =
        document.getElementById(
            "source-display-name"
        );

    const sourceEnabledInput =
        document.getElementById(
            "source-enabled"
        );

    const sourceAssignmentModeInput =
        document.getElementById(
            "source-assignment-mode"
        );

    const fixedMemberGroup =
        document.getElementById(
            "source-fixed-member-group"
        );

    const sourceAssignedMemberInput =
        document.getElementById(
            "source-assigned-member"
        );

    const sourceDefaultServiceInput =
        document.getElementById(
            "source-default-service"
        );

    const sourceDefaultPriorityInput =
        document.getElementById(
            "source-default-priority"
        );

    const sourceDefaultStatusInput =
        document.getElementById(
            "source-default-status"
        );

    const sourceFollowupDaysInput =
        document.getElementById(
            "source-followup-days"
        );

    const sourceNotifyAdminInput =
        document.getElementById(
            "source-notify-admin"
        );

    const sourceFormMessage =
        document.getElementById(
            "source-form-message"
        );

    const saveSourceRuleButton =
        document.getElementById(
            "save-source-rule-btn"
        );

    const modalCloseElements =
        document.querySelectorAll(
            "[data-close-source-modal]"
        );


    /* =================================
       STATE
    ================================= */

    let sourceRules = [];
    let teamMembers = [];
    let intakeLogs = [];
    let currentRuleId = null;


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
            .replaceAll("_", " ")
            .replaceAll("-", " ")
            .replace(
                /\b\w/g,
                character =>
                    character.toUpperCase()
            );

    }


    function formatDateTime(value) {

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


    function getSourceIcon(sourceKey) {

        const icons = {
            website: "🌐",
            facebook: "📘",
            instagram: "📸",
            whatsapp: "💬",
            "google-ads": "🔎",
            referral: "🤝",
            linkedin: "💼",
            upwork: "🟢",
            "direct-outreach": "📤",
            "existing-customer": "♻️",
            employee: "🧑‍💼",
            "phone-call": "📞",
            api: "⚡",
            other: "🔌"
        };


        return icons[sourceKey] || "🔌";

    }


    function getMemberById(memberId) {

        return teamMembers.find(
            member =>
                String(member.id) ===
                String(memberId)
        ) || null;

    }


    function getMasterIntakeUrl() {

        return (
            window.MK_CONFIG
                ?.MASTER_LEAD_INTAKE_WEBHOOK_URL ||
            "https://n8n.srv1856618.hstgr.cloud/webhook/crm-master-lead-intake"
        );

    }


    /* =================================
       MESSAGES
    ================================= */

    function showPageMessage(
        message,
        type = "info"
    ) {

        pageMessage.hidden =
            false;

        pageMessage.textContent =
            message;

        pageMessage.className =
            `source-page-message ${type}`;

    }


    function clearPageMessage() {

        pageMessage.hidden =
            true;

        pageMessage.textContent =
            "";

        pageMessage.className =
            "source-page-message";

    }


    function showFormMessage(
        message,
        type = "info"
    ) {

        sourceFormMessage.hidden =
            false;

        sourceFormMessage.textContent =
            message;

        sourceFormMessage.className =
            `source-form-message ${type}`;

    }


    function clearFormMessage() {

        sourceFormMessage.hidden =
            true;

        sourceFormMessage.textContent =
            "";

        sourceFormMessage.className =
            "source-form-message";

    }


    /* =================================
       AUTHENTICATION
    ================================= */

    async function protectSourcePage() {

        if (!supabaseClient) {

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


        if (
            typeof window
                .loadAndApplyCrmSettings ===
            "function"
        ) {

            await window
                .loadAndApplyCrmSettings();

        }


        if (
            window.crmAccess
                ?.canManage !== true
        ) {

            window.location.href =
                "index.html";

            return false;

        }


        return true;

    }


    /* =================================
       STATISTICS
    ================================= */

    function updateStatistics(
        weekCount = 0
    ) {

        const enabledSources =
            sourceRules.filter(
                rule =>
                    rule.is_enabled
            );


        const automatedSources =
            sourceRules.filter(
                rule =>
                    rule.is_enabled &&
                    rule.assignment_mode !==
                        "unassigned"
            );


        sourceTotalCount.textContent =
            String(
                sourceRules.length
            );

        sourceEnabledCount.textContent =
            String(
                enabledSources.length
            );

        sourceAutoCount.textContent =
            String(
                automatedSources.length
            );

        sourceWeekCount.textContent =
            String(
                weekCount || 0
            );

    }


    /* =================================
       TEAM MEMBER OPTIONS
    ================================= */

    function populateMemberOptions() {

        const currentValue =
            sourceAssignedMemberInput.value;


        const activeMembers =
            teamMembers.filter(
                member =>
                    member.status ===
                    "active" &&
                    [
                        "employee",
                        "manager"
                    ].includes(
                        member.role
                    )
            );


        sourceAssignedMemberInput.innerHTML = `
            <option value="">
                Select employee
            </option>

            ${activeMembers
                .map(
                    member => `
                        <option value="${escapeHtml(
                            member.id
                        )}">
                            ${escapeHtml(
                                member.full_name
                            )} — ${escapeHtml(
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


        if (
            activeMembers.some(
                member =>
                    String(member.id) ===
                    String(currentValue)
            )
        ) {

            sourceAssignedMemberInput.value =
                currentValue;

        }

    }


    /* =================================
       RENDER SOURCE RULES
    ================================= */

    function getFilteredRules() {

        const searchValue =
            sourceSearch.value
                .trim()
                .toLowerCase();

        const statusValue =
            sourceStatusFilter.value;


        return sourceRules.filter(
            rule => {

                const searchText = [
                    rule.source_key,
                    rule.display_name,
                    rule.assignment_mode,
                    rule.default_service,
                    rule.default_priority,
                    rule.default_status
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !searchValue ||
                    searchText.includes(
                        searchValue
                    );


                const matchesStatus =
                    statusValue === "all" ||
                    (
                        statusValue ===
                            "enabled" &&
                        rule.is_enabled
                    ) ||
                    (
                        statusValue ===
                            "disabled" &&
                        !rule.is_enabled
                    );


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );

    }


    function renderSourceRules() {

        const filteredRules =
            getFilteredRules();


        rulesLoading.hidden =
            true;


        if (
            filteredRules.length === 0
        ) {

            rulesEmpty.hidden =
                false;

            rulesTableWrapper.hidden =
                true;

            rulesTableBody.innerHTML =
                "";

            return;

        }


        rulesEmpty.hidden =
            true;

        rulesTableWrapper.hidden =
            false;


        rulesTableBody.innerHTML =
            filteredRules
                .map(
                    rule => {

                        const fixedMember =
                            getMemberById(
                                rule.assigned_member_id
                            );


                        const assignmentText =
                            rule.assignment_mode ===
                                "round_robin"
                                ? "Round Robin"
                                : rule.assignment_mode ===
                                    "fixed"
                                    ? "Fixed Employee"
                                    : "Keep Unassigned";


                        const assignedMemberText =
                            rule.assignment_mode ===
                                "fixed"
                                ? (
                                    fixedMember
                                        ?.full_name ||
                                    "Employee not selected"
                                )
                                : rule.assignment_mode ===
                                    "round_robin"
                                    ? "Active employees"
                                    : "-";


                        return `
                            <tr>

                                <td>

                                    <div class="source-name-cell">

                                        <div class="source-icon">
                                            ${escapeHtml(
                                                getSourceIcon(
                                                    rule.source_key
                                                )
                                            )}
                                        </div>

                                        <div>
                                            <strong>
                                                ${escapeHtml(
                                                    rule.display_name
                                                )}
                                            </strong>
                                            <span>
                                                ${escapeHtml(
                                                    rule.source_key
                                                )}
                                            </span>
                                        </div>

                                    </div>

                                </td>

                                <td>
                                    <span
                                        class="source-status-badge ${
                                            rule.is_enabled
                                                ? "enabled"
                                                : "disabled"
                                        }"
                                    >
                                        ${
                                            rule.is_enabled
                                                ? "Enabled"
                                                : "Disabled"
                                        }
                                    </span>
                                </td>

                                <td>
                                    <span
                                        class="source-mode-badge ${escapeHtml(
                                            rule.assignment_mode
                                        )}"
                                    >
                                        ${escapeHtml(
                                            assignmentText
                                        )}
                                    </span>
                                </td>

                                <td>
                                    ${escapeHtml(
                                        assignedMemberText
                                    )}
                                </td>

                                <td>
                                    <div class="source-defaults">
                                        <span>
                                            ${escapeHtml(
                                                formatLabel(
                                                    rule.default_service ||
                                                    "Incoming Service"
                                                )
                                            )}
                                        </span>
                                        <span>
                                            ${escapeHtml(
                                                formatLabel(
                                                    rule.default_priority
                                                )
                                            )}
                                        </span>
                                        <span>
                                            ${escapeHtml(
                                                formatLabel(
                                                    rule.default_status
                                                )
                                            )}
                                        </span>
                                    </div>
                                </td>

                                <td>
                                    ${escapeHtml(
                                        rule.default_followup_days ===
                                            0
                                            ? "No automatic date"
                                            : `${rule.default_followup_days} day(s)`
                                    )}
                                </td>

                                <td>

                                    <div class="source-actions">

                                        <button
                                            type="button"
                                            class="source-edit-btn"
                                            data-source-action="edit"
                                            data-source-rule-id="${escapeHtml(
                                                rule.id
                                            )}"
                                        >
                                            Edit
                                        </button>

                                        <button
                                            type="button"
                                            class="source-toggle-btn ${
                                                rule.is_enabled
                                                    ? "disable"
                                                    : "enable"
                                            }"
                                            data-source-action="toggle"
                                            data-source-rule-id="${escapeHtml(
                                                rule.id
                                            )}"
                                            data-next-enabled="${
                                                rule.is_enabled
                                                    ? "false"
                                                    : "true"
                                            }"
                                        >
                                            ${
                                                rule.is_enabled
                                                    ? "Disable"
                                                    : "Enable"
                                            }
                                        </button>

                                    </div>

                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");

    }


    /* =================================
       RENDER LOGS
    ================================= */

    function renderIntakeLogs() {

        logsLoading.hidden =
            true;


        if (
            intakeLogs.length === 0
        ) {

            logsEmpty.hidden =
                false;

            logsTableWrapper.hidden =
                true;

            logsTableBody.innerHTML =
                "";

            return;

        }


        logsEmpty.hidden =
            true;

        logsTableWrapper.hidden =
            false;


        logsTableBody.innerHTML =
            intakeLogs
                .map(
                    log => {

                        const leadLink =
                            log.lead_id
                                ? `
                                    <a
                                        href="edit-lead.html?id=${encodeURIComponent(
                                            log.lead_id
                                        )}"
                                        class="intake-lead-link"
                                    >
                                        #${escapeHtml(
                                            log.lead_id
                                        )}
                                    </a>
                                `
                                : "-";


                        return `
                            <tr>

                                <td>
                                    ${escapeHtml(
                                        formatDateTime(
                                            log.created_at
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        formatLabel(
                                            log.source_key
                                        )
                                    )}
                                </td>

                                <td>
                                    <span
                                        class="intake-outcome-badge ${escapeHtml(
                                            log.outcome
                                        )}"
                                    >
                                        ${escapeHtml(
                                            formatLabel(
                                                log.outcome
                                            )
                                        )}
                                    </span>
                                </td>

                                <td>
                                    ${leadLink}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        log.source_reference ||
                                        "-"
                                    )}
                                </td>

                                <td>
                                    <div class="intake-log-message">
                                        ${escapeHtml(
                                            log.message ||
                                            "-"
                                        )}
                                    </div>
                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");

    }


    /* =================================
       LOAD DATA
    ================================= */

    async function loadSourceData() {

        clearPageMessage();

        refreshPageButton.disabled =
            true;

        refreshPageButton.textContent =
            "Refreshing...";

        rulesLoading.hidden =
            false;

        rulesLoading.textContent =
            "Loading source rules...";

        rulesLoading.style.color =
            "";

        logsLoading.hidden =
            false;

        logsLoading.textContent =
            "Loading intake activity...";

        logsLoading.style.color =
            "";


        const weekStart =
            new Date(
                Date.now() -
                7 * 24 * 60 * 60 * 1000
            ).toISOString();


        const [
            rulesResult,
            membersResult,
            logsResult,
            weekResult
        ] =
            await Promise.all([

                supabaseClient
                    .from("lead_source_rules")
                    .select(`
                        id,
                        source_key,
                        display_name,
                        is_enabled,
                        assignment_mode,
                        assigned_member_id,
                        last_assigned_member_id,
                        default_service,
                        default_priority,
                        default_status,
                        default_followup_days,
                        notify_admin,
                        created_at,
                        updated_at
                    `)
                    .order(
                        "display_name",
                        {
                            ascending: true
                        }
                    ),

                supabaseClient
                    .from("team_members")
                    .select(`
                        id,
                        full_name,
                        email,
                        role,
                        status,
                        created_at
                    `)
                    .order(
                        "created_at",
                        {
                            ascending: true
                        }
                    ),

                supabaseClient
                    .from("lead_intake_logs")
                    .select(`
                        id,
                        source_key,
                        source_reference,
                        lead_id,
                        outcome,
                        message,
                        created_at
                    `)
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    )
                    .limit(50),

                supabaseClient
                    .from("lead_intake_logs")
                    .select(
                        "id",
                        {
                            count: "exact",
                            head: true
                        }
                    )
                    .gte(
                        "created_at",
                        weekStart
                    )

            ]);


        refreshPageButton.disabled =
            false;

        refreshPageButton.textContent =
            "Refresh";


        if (rulesResult.error) {

            console.error(
                "Unable to load source rules:",
                rulesResult.error
            );

            rulesLoading.hidden =
                false;

            rulesLoading.textContent =
                `Unable to load source rules: ${rulesResult.error.message}`;

            rulesLoading.style.color =
                "#dc2626";

            rulesEmpty.hidden =
                true;

            rulesTableWrapper.hidden =
                true;

        } else {

            sourceRules =
                rulesResult.data || [];

        }


        if (membersResult.error) {

            console.error(
                "Unable to load team members:",
                membersResult.error
            );

            teamMembers = [];

        } else {

            teamMembers =
                membersResult.data || [];

        }


        if (logsResult.error) {

            console.error(
                "Unable to load intake logs:",
                logsResult.error
            );

            logsLoading.hidden =
                false;

            logsLoading.textContent =
                `Unable to load intake activity: ${logsResult.error.message}`;

            logsLoading.style.color =
                "#dc2626";

            logsEmpty.hidden =
                true;

            logsTableWrapper.hidden =
                true;

        } else {

            intakeLogs =
                logsResult.data || [];

        }


        if (weekResult.error) {

            console.warn(
                "Unable to load weekly intake count:",
                weekResult.error
            );

        }


        populateMemberOptions();

        updateStatistics(
            weekResult.count || 0
        );


        if (!rulesResult.error) {
            renderSourceRules();
        }


        if (!logsResult.error) {
            renderIntakeLogs();
        }

    }


    /* =================================
       MODAL
    ================================= */

    function updateAssignmentFieldVisibility() {

        const fixedMode =
            sourceAssignmentModeInput.value ===
            "fixed";


        fixedMemberGroup.hidden =
            !fixedMode;


        sourceAssignedMemberInput.required =
            fixedMode;

    }


    function openSourceRuleModal(
        ruleId
    ) {

        const rule =
            sourceRules.find(
                item =>
                    String(item.id) ===
                    String(ruleId)
            );


        if (!rule) {

            showPageMessage(
                "Source rule was not found.",
                "error"
            );

            return;

        }


        currentRuleId =
            rule.id;

        sourceRuleIdInput.value =
            rule.id;

        sourceDisplayNameInput.value =
            rule.display_name || "";

        sourceEnabledInput.value =
            rule.is_enabled
                ? "true"
                : "false";

        sourceAssignmentModeInput.value =
            rule.assignment_mode ||
            "unassigned";

        sourceAssignedMemberInput.value =
            rule.assigned_member_id ||
            "";

        sourceDefaultServiceInput.value =
            rule.default_service ||
            "";

        sourceDefaultPriorityInput.value =
            rule.default_priority ||
            "medium";

        sourceDefaultStatusInput.value =
            rule.default_status ||
            "new";

        sourceFollowupDaysInput.value =
            String(
                rule.default_followup_days ??
                1
            );

        sourceNotifyAdminInput.checked =
            rule.notify_admin !== false;


        sourceModalTitle.textContent =
            `Edit ${rule.display_name}`;


        clearFormMessage();

        updateAssignmentFieldVisibility();


        sourceModal.classList.add(
            "active"
        );

        sourceModal.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.classList.add(
            "source-modal-open"
        );


        window.setTimeout(
            () => {
                sourceDisplayNameInput.focus();
            },
            50
        );

    }


    function closeSourceRuleModal() {

        sourceModal.classList.remove(
            "active"
        );

        sourceModal.setAttribute(
            "aria-hidden",
            "true"
        );

        document.body.classList.remove(
            "source-modal-open"
        );

        sourceRuleForm.reset();

        sourceRuleIdInput.value =
            "";

        currentRuleId =
            null;

        clearFormMessage();

    }


    function setSourceFormBusy(
        isBusy
    ) {

        saveSourceRuleButton.disabled =
            isBusy;

        sourceDisplayNameInput.disabled =
            isBusy;

        sourceEnabledInput.disabled =
            isBusy;

        sourceAssignmentModeInput.disabled =
            isBusy;

        sourceAssignedMemberInput.disabled =
            isBusy;

        sourceDefaultServiceInput.disabled =
            isBusy;

        sourceDefaultPriorityInput.disabled =
            isBusy;

        sourceDefaultStatusInput.disabled =
            isBusy;

        sourceFollowupDaysInput.disabled =
            isBusy;

        sourceNotifyAdminInput.disabled =
            isBusy;


        saveSourceRuleButton.textContent =
            isBusy
                ? "Saving..."
                : "Save Rule";

    }


    async function saveSourceRule(
        event
    ) {

        event.preventDefault();

        clearFormMessage();


        if (!currentRuleId) {

            showFormMessage(
                "Source rule is unavailable.",
                "error"
            );

            return;

        }


        const assignmentMode =
            sourceAssignmentModeInput.value;

        const assignedMemberId =
            sourceAssignedMemberInput.value ||
            null;


        if (
            assignmentMode === "fixed" &&
            !assignedMemberId
        ) {

            showFormMessage(
                "Select an active employee for fixed assignment.",
                "error"
            );

            return;

        }


        const followupDays =
            Number(
                sourceFollowupDaysInput.value
            );


        if (
            !Number.isInteger(followupDays) ||
            followupDays < 0 ||
            followupDays > 365
        ) {

            showFormMessage(
                "Follow-up days must be between 0 and 365.",
                "error"
            );

            return;

        }


        setSourceFormBusy(
            true
        );

        showFormMessage(
            "Saving source rule...",
            "info"
        );


        const {
            error
        } =
            await supabaseClient
                .from("lead_source_rules")
                .update({
                    display_name:
                        sourceDisplayNameInput
                            .value
                            .trim(),
                    is_enabled:
                        sourceEnabledInput.value ===
                        "true",
                    assignment_mode:
                        assignmentMode,
                    assigned_member_id:
                        assignmentMode === "fixed"
                            ? assignedMemberId
                            : null,
                    default_service:
                        sourceDefaultServiceInput.value ||
                        null,
                    default_priority:
                        sourceDefaultPriorityInput.value,
                    default_status:
                        sourceDefaultStatusInput.value,
                    default_followup_days:
                        followupDays,
                    notify_admin:
                        sourceNotifyAdminInput.checked
                })
                .eq(
                    "id",
                    currentRuleId
                );


        if (error) {

            console.error(
                "Unable to save source rule:",
                error
            );

            showFormMessage(
                `Unable to save rule: ${error.message}`,
                "error"
            );

            setSourceFormBusy(
                false
            );

            return;

        }


        closeSourceRuleModal();

        await loadSourceData();

        showPageMessage(
            "Source rule updated successfully.",
            "success"
        );

    }


    /* =================================
       QUICK ENABLE / DISABLE
    ================================= */

    async function toggleSourceRule(
        ruleId,
        nextEnabled,
        button
    ) {

        const rule =
            sourceRules.find(
                item =>
                    String(item.id) ===
                    String(ruleId)
            );


        if (!rule) {
            return;
        }


        const shouldEnable =
            String(nextEnabled) ===
            "true";


        if (!shouldEnable) {

            const confirmed =
                window.confirm(
                    `Disable ${rule.display_name}?\n\n` +
                    "New incoming leads from this source will be rejected."
                );


            if (!confirmed) {
                return;
            }

        }


        button.disabled =
            true;

        const originalText =
            button.textContent;

        button.textContent =
            shouldEnable
                ? "Enabling..."
                : "Disabling...";


        const {
            error
        } =
            await supabaseClient
                .from("lead_source_rules")
                .update({
                    is_enabled:
                        shouldEnable
                })
                .eq(
                    "id",
                    ruleId
                );


        if (error) {

            console.error(
                "Unable to update source status:",
                error
            );

            showPageMessage(
                `Unable to update source: ${error.message}`,
                "error"
            );

            button.disabled =
                false;

            button.textContent =
                originalText;

            return;

        }


        await loadSourceData();

        showPageMessage(
            `${rule.display_name} ${
                shouldEnable
                    ? "enabled"
                    : "disabled"
            } successfully.`,
            "success"
        );

    }


    /* =================================
       TABLE ACTIONS
    ================================= */

    async function handleSourceTableAction(
        event
    ) {

        const actionButton =
            event.target.closest(
                "[data-source-action]"
            );


        if (!actionButton) {
            return;
        }


        const action =
            actionButton.dataset
                .sourceAction;

        const ruleId =
            actionButton.dataset
                .sourceRuleId;


        if (action === "edit") {

            openSourceRuleModal(
                ruleId
            );

            return;

        }


        if (action === "toggle") {

            await toggleSourceRule(
                ruleId,
                actionButton.dataset
                    .nextEnabled,
                actionButton
            );

        }

    }


    /* =================================
       COPY ENDPOINT
    ================================= */

    async function copyIntakeUrl() {

        const url =
            getMasterIntakeUrl();


        try {

            await navigator.clipboard
                .writeText(url);

            copyIntakeUrlButton.textContent =
                "Copied";

            window.setTimeout(
                () => {
                    copyIntakeUrlButton.textContent =
                        "Copy URL";
                },
                1600
            );

        } catch (error) {

            console.error(
                "Unable to copy intake URL:",
                error
            );

            showPageMessage(
                "Unable to copy the webhook URL. Select and copy it manually.",
                "error"
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

            showPageMessage(
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

    refreshPageButton.addEventListener(
        "click",
        loadSourceData
    );

    copyIntakeUrlButton.addEventListener(
        "click",
        copyIntakeUrl
    );

    sourceSearch.addEventListener(
        "input",
        renderSourceRules
    );

    sourceStatusFilter.addEventListener(
        "change",
        renderSourceRules
    );

    rulesTableBody.addEventListener(
        "click",
        handleSourceTableAction
    );

    sourceAssignmentModeInput.addEventListener(
        "change",
        updateAssignmentFieldVisibility
    );

    sourceRuleForm.addEventListener(
        "submit",
        saveSourceRule
    );

    closeSourceModalButton.addEventListener(
        "click",
        closeSourceRuleModal
    );

    modalCloseElements.forEach(
        element => {

            element.addEventListener(
                "click",
                closeSourceRuleModal
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

            if (
                event.key === "Escape" &&
                sourceModal.classList
                    .contains("active")
            ) {

                closeSourceRuleModal();

            }

        }
    );


    /* =================================
       INITIALIZE
    ================================= */

    async function initialiseSourcePage() {

        intakeUrlElement.textContent =
            getMasterIntakeUrl();


        const hasAccess =
            await protectSourcePage();


        if (!hasAccess) {
            return;
        }


        await loadSourceData();

    }


    initialiseSourcePage()
        .finally(() => {

            window.finishCrmPageLoading?.();

        });

})();

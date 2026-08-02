(() => {
    "use strict";

    const supabaseClient = window.mkSupabase;
    const runButton = document.getElementById("system-check-run");
    const exportButton = document.getElementById("system-check-export");
    const logoutButton = document.getElementById("logout-btn");
    const groupsElement = document.getElementById("system-check-groups");
    const messageElement = document.getElementById("system-check-message");
    const passCountElement = document.getElementById("system-check-pass-count");
    const warningCountElement = document.getElementById("system-check-warning-count");
    const failCountElement = document.getElementById("system-check-fail-count");
    const overallElement = document.getElementById("system-check-overall");
    const generatedAtElement = document.getElementById("system-check-generated-at");

    let latestResults = [];
    let generatedAt = null;

    const definitions = [
        {
            group: "Authentication & Access",
            description: "Current user, CRM role and protected route checks.",
            checks: [
                { id: "session", name: "Authenticated session", purpose: "Confirms a valid Supabase login session is available.", run: checkSession },
                { id: "member", name: "Active team member", purpose: "Confirms the signed-in user is mapped to an active CRM member.", run: checkTeamMember },
                { id: "manage", name: "Management permission", purpose: "System Check is restricted to Administrators and Managers.", run: checkManagementAccess },
                { id: "idle", name: "Idle-session protection", purpose: "Confirms automatic warning and logout timing is active.", run: checkIdleProtection },
                { id: "cache", name: "Authenticated page caching", purpose: "Checks that no-store browser hints are present.", run: checkCacheHints }
            ]
        },
        {
            group: "Supabase & CRM Data",
            description: "Read-only connectivity checks through the signed-in browser role.",
            checks: [
                { id: "leads", name: "Leads table", purpose: "Confirms the CRM can read leads through RLS.", run: () => checkReadableTable("Leads") },
                { id: "settings", name: "CRM settings table", purpose: "Confirms business settings can be read by management.", run: () => checkReadableTable("crm_settings") },
                { id: "activities", name: "Lead activities table", purpose: "Confirms lead history is available.", run: () => checkReadableTable("lead_activities") },
                { id: "members", name: "Team members table", purpose: "Confirms team records are accessible to management.", run: () => checkReadableTable("team_members") },
                { id: "rules", name: "Source routing rules", purpose: "Confirms source automation rules are available.", run: () => checkReadableTable("lead_source_rules") },
                { id: "logs", name: "Lead intake logs", purpose: "Confirms master intake history is available.", run: () => checkReadableTable("lead_intake_logs") },
                { id: "rpc", name: "CRM permission RPC", purpose: "Confirms can_manage_crm() executes successfully.", run: checkPermissionRpc },
                { id: "secret", name: "Intake secret browser lock", purpose: "The shared webhook secret hash must not be readable from browser code.", run: checkSecretTableBlocked }
            ]
        },
        {
            group: "Configuration & Deployment",
            description: "Public-key, URL and production readiness checks.",
            checks: [
                { id: "url", name: "Supabase project URL", purpose: "Supabase connections must use HTTPS.", run: checkSupabaseUrl },
                { id: "key", name: "Browser Supabase key", purpose: "Only a publishable/anon key may exist in config.js.", run: checkBrowserKey },
                { id: "webhook", name: "Master intake webhook URL", purpose: "Identifies local-only or insecure production webhook URLs.", run: checkWebhookUrl },
                { id: "origin", name: "Website origin security", purpose: "Production CRM pages should be served through HTTPS.", run: checkPageOrigin },
                { id: "storage", name: "Browser storage", purpose: "Required for cross-tab logout and idle activity tracking.", run: checkBrowserStorage },
                { id: "artifacts", name: "Public setup files", purpose: "SQL, workflow and test-secret files must not be downloadable from website/admin.", run: checkPublicSetupArtifacts }
            ]
        }
    ];

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function result(status, detail, metadata = {}) {
        return { status, detail, metadata };
    }

    function statusSymbol(status) {
        return status === "pass" ? "✓" : status === "warning" ? "!" : status === "fail" ? "×" : "…";
    }

    function showMessage(message, type = "info") {
        messageElement.hidden = false;
        messageElement.className = `system-check-message ${type}`;
        messageElement.textContent = message;
    }

    function renderPending() {
        groupsElement.innerHTML = definitions.map(group => `
            <section class="system-check-group">
                <header class="system-check-group-header">
                    <h2>${escapeHtml(group.group)}</h2>
                    <span>${escapeHtml(group.description)}</span>
                </header>
                <div class="system-check-list">
                    ${group.checks.map(check => `
                        <article class="system-check-row pending" data-check-id="${escapeHtml(check.id)}">
                            <span class="system-check-status-icon">…</span>
                            <div class="system-check-name">
                                <strong>${escapeHtml(check.name)}</strong>
                                <span>${escapeHtml(check.purpose)}</span>
                            </div>
                            <div class="system-check-detail">Waiting to run.</div>
                            <span class="system-check-badge">Pending</span>
                        </article>
                    `).join("")}
                </div>
            </section>
        `).join("");
    }

    function renderResultRow(checkId, checkResult) {
        const row = groupsElement.querySelector(`[data-check-id="${CSS.escape(checkId)}"]`);
        if (!row) return;

        row.className = `system-check-row ${checkResult.status}`;
        row.querySelector(".system-check-status-icon").textContent = statusSymbol(checkResult.status);
        row.querySelector(".system-check-detail").innerHTML = escapeHtml(checkResult.detail);
        row.querySelector(".system-check-badge").textContent = checkResult.status;
    }

    function updateSummary() {
        const pass = latestResults.filter(item => item.status === "pass").length;
        const warning = latestResults.filter(item => item.status === "warning").length;
        const fail = latestResults.filter(item => item.status === "fail").length;

        passCountElement.textContent = String(pass);
        warningCountElement.textContent = String(warning);
        failCountElement.textContent = String(fail);

        if (fail > 0) {
            overallElement.textContent = "Action required";
        } else if (warning > 0) {
            overallElement.textContent = "Ready for local testing";
        } else {
            overallElement.textContent = "All checks passed";
        }

        generatedAtElement.textContent = generatedAt
            ? `Last run: ${generatedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
            : "Run the checks to generate a report.";
    }

    async function checkSession() {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error || !data?.session) return result("fail", error?.message || "No active login session was found.");
        return result("pass", `Signed in as ${data.session.user.email || "authenticated user"}.`);
    }

    async function checkTeamMember() {
        const access = await window.loadCrmAccessContext();
        const member = access?.currentMember;
        if (!member) return result("fail", "No team_members record is linked to this login.");
        if (member.status !== "active") return result("fail", `Team member status is ${member.status || "unknown"}.`);
        return result("pass", `${member.full_name || member.email} is active with role ${member.role}.`);
    }

    async function checkManagementAccess() {
        const { data, error } = await supabaseClient.rpc("can_manage_crm");
        if (error) return result("fail", error.message);
        if (data !== true) return result("fail", "Current user does not have Administrator/Manager access.");
        return result("pass", "Management access confirmed.");
    }

    async function checkIdleProtection() {
        const security = window.crmSecurity;
        if (!security) return result("fail", "security.js did not initialise.");
        if (security.idleMinutes < 10) return result("warning", `Idle timeout is only ${security.idleMinutes} minutes.`);
        return result("pass", `Warning after ${security.idleMinutes - security.warningMinutes} idle minutes; logout at ${security.idleMinutes} minutes.`);
    }

    async function checkCacheHints() {
        const cacheControl = document.head.querySelector('meta[http-equiv="Cache-Control"]')?.content || "";
        if (!/no-store/i.test(cacheControl)) return result("warning", "No-store cache hint is missing from this page.");
        return result("pass", "Authenticated page includes no-store cache hints.");
    }

    async function checkReadableTable(tableName) {
        const { count, error } = await supabaseClient
            .from(tableName)
            .select("*", { count: "exact", head: true });

        if (error) return result("fail", `${tableName}: ${error.message}`);
        return result("pass", `${tableName} is reachable. Visible row count: ${count ?? 0}.`);
    }

    async function checkPermissionRpc() {
        const { data, error } = await supabaseClient.rpc("can_manage_crm");
        if (error) return result("fail", error.message);
        return data === true
            ? result("pass", "can_manage_crm() returned true.")
            : result("fail", "can_manage_crm() returned false.");
    }

    async function checkSecretTableBlocked() {
        const { data, error } = await supabaseClient
            .from("crm_intake_config")
            .select("id, shared_secret_hash")
            .limit(1);

        if (error) return result("pass", "Browser access to crm_intake_config is blocked.");
        if (Array.isArray(data) && data.length === 0) return result("pass", "No intake secret data is visible to the browser role.");
        return result("fail", "The browser role can read crm_intake_config. Revoke access before deployment.");
    }

    async function checkSupabaseUrl() {
        const value = String(window.MK_CONFIG?.SUPABASE_URL || "");
        if (!value) return result("fail", "SUPABASE_URL is missing.");
        try {
            const url = new URL(value);
            if (url.protocol !== "https:") return result("fail", "Supabase URL is not HTTPS.");
            return result("pass", `HTTPS Supabase project configured: ${url.hostname}.`);
        } catch {
            return result("fail", "SUPABASE_URL is not a valid URL.");
        }
    }

    function decodeJwtPayload(token) {
        try {
            const payload = token.split(".")[1];
            if (!payload) return null;
            const normalised = payload.replace(/-/g, "+").replace(/_/g, "/");
            return JSON.parse(atob(normalised));
        } catch {
            return null;
        }
    }

    async function checkBrowserKey() {
        const key = String(window.MK_CONFIG?.SUPABASE_PUBLISHABLE_KEY || "");
        if (!key) return result("fail", "SUPABASE_PUBLISHABLE_KEY is missing.");
        if (key.startsWith("sb_secret_")) return result("fail", "A Supabase secret key is exposed in browser config.");
        if (key.startsWith("sb_publishable_")) return result("pass", "Supabase publishable key is correctly used.");

        const payload = decodeJwtPayload(key);
        if (payload?.role === "service_role") return result("fail", "A service_role key is exposed in browser config.");
        if (payload?.role === "anon") return result("pass", "Legacy anon browser key is in use.");
        return result("warning", "Key type could not be identified. Confirm it is publishable/anon only.");
    }

    async function checkWebhookUrl() {
        const value = String(window.MK_CONFIG?.MASTER_LEAD_INTAKE_WEBHOOK_URL || "");
        if (!value) return result("warning", "Master intake webhook URL is not configured.");

        try {
            const url = new URL(value);
            const isLocal = ["localhost", "127.0.0.1"].includes(url.hostname);
            if (isLocal) return result("warning", "Webhook is local-only. Replace localhost with a public HTTPS n8n URL during deployment.");
            if (url.protocol !== "https:") return result("fail", "Public webhook uses HTTP. Production webhook must use HTTPS.");
            if (url.pathname.includes("webhook-test")) return result("fail", "Webhook Test URL is configured. Use the Production webhook URL.");
            return result("pass", "Public HTTPS production webhook URL is configured.");
        } catch {
            return result("fail", "MASTER_LEAD_INTAKE_WEBHOOK_URL is invalid.");
        }
    }

    async function checkPageOrigin() {
        const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
        if (isLocal) return result("warning", "CRM is running on localhost. HTTPS is required after public deployment.");
        if (window.location.protocol !== "https:") return result("fail", "Public CRM page is not using HTTPS.");
        return result("pass", "CRM is served through HTTPS.");
    }

    async function checkBrowserStorage() {
        try {
            const key = "mk_crm_storage_test";
            localStorage.setItem(key, "ok");
            localStorage.removeItem(key);
            return result("pass", "Browser local storage is available.");
        } catch (error) {
            return result("fail", `Browser storage is unavailable: ${error.message}`);
        }
    }

    async function checkPublicSetupArtifacts() {
        const sensitiveFiles = [
            "MASTER_LEAD_INTAKE_SETUP.sql",
            "CRM_MASTER_LEAD_INTAKE_WORKFLOW.json",
            "TEST_MASTER_INTAKE.ps1",
            "MASTER_INTAKE_TEST_PAYLOAD.json",
            "V4_SETUP_README.txt"
        ];

        const exposed = [];

        for (const fileName of sensitiveFiles) {
            try {
                const response = await fetch(
                    `${fileName}?security_check=${Date.now()}`,
                    { method: "GET", cache: "no-store" }
                );

                if (response.ok) {
                    exposed.push(fileName);
                }
            } catch {
                // Network failure is treated as not publicly readable.
            }
        }

        if (exposed.length) {
            return result(
                "fail",
                `Remove public setup files: ${exposed.join(", ")}. Replace the admin folder instead of merging it.`
            );
        }

        return result("pass", "No known SQL, workflow or test-secret setup files are publicly readable.");
    }

    async function runAllChecks() {
        runButton.disabled = true;
        runButton.textContent = "Running...";
        showMessage("Running safe, read-only CRM checks...", "info");
        renderPending();
        latestResults = [];

        for (const group of definitions) {
            for (const check of group.checks) {
                let checkResult;
                try {
                    checkResult = await check.run();
                } catch (error) {
                    checkResult = result("fail", error?.message || "Unexpected check error.");
                }

                const record = {
                    id: check.id,
                    group: group.group,
                    name: check.name,
                    purpose: check.purpose,
                    ...checkResult
                };

                latestResults.push(record);
                renderResultRow(check.id, record);
            }
        }

        generatedAt = new Date();
        updateSummary();

        const failCount = latestResults.filter(item => item.status === "fail").length;
        const warningCount = latestResults.filter(item => item.status === "warning").length;

        if (failCount > 0) {
            showMessage(`${failCount} check(s) failed. Fix failed items before deployment.`, "error");
        } else if (warningCount > 0) {
            showMessage("Core checks passed. Localhost/HTTP warnings are expected until production deployment.", "success");
        } else {
            showMessage("All security and connectivity checks passed.", "success");
        }

        runButton.disabled = false;
        runButton.textContent = "Run All Checks";
    }

    function exportResults() {
        if (!latestResults.length) {
            showMessage("Run the system checks before exporting results.", "info");
            return;
        }

        const report = {
            format: "MK_CRM_SYSTEM_CHECK_V1",
            generated_at: generatedAt?.toISOString() || new Date().toISOString(),
            page_origin: window.location.origin,
            user: window.crmAccess?.sessionUser?.email || null,
            role: window.crmAccess?.currentMember?.role || null,
            summary: {
                passed: latestResults.filter(item => item.status === "pass").length,
                warnings: latestResults.filter(item => item.status === "warning").length,
                failed: latestResults.filter(item => item.status === "fail").length
            },
            results: latestResults
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `mk-crm-system-check-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        showMessage("System check report downloaded.", "success");
    }

    runButton.addEventListener("click", runAllChecks);
    exportButton.addEventListener("click", exportResults);
    logoutButton.addEventListener("click", () => window.crmSecureSignOut?.("signed-out"));

    async function initialise() {
        const securityContext = await window.crmSecurityReady;
        if (!securityContext) return;
        await window.loadAndApplyCrmSettings();
        renderPending();
        await runAllChecks();
    }

    initialise().finally(() => window.finishCrmPageLoading?.());
})();

(() => {
    "use strict";

    const supabaseClient = window.mkSupabase;

    const refreshButton = document.getElementById("reports-refresh-btn");
    const printButton = document.getElementById("reports-print-btn");
    const exportButton = document.getElementById("reports-export-btn");
    const backupButton = document.getElementById("reports-backup-btn");
    const resetButton = document.getElementById("reports-reset-btn");
    const logoutButton = document.getElementById("logout-btn");
    const messageElement = document.getElementById("reports-message");

    const datePreset = document.getElementById("reports-date-preset");
    const fromDate = document.getElementById("reports-from-date");
    const toDate = document.getElementById("reports-to-date");
    const sourceFilter = document.getElementById("reports-source-filter");
    const serviceFilter = document.getElementById("reports-service-filter");
    const statusFilter = document.getElementById("reports-status-filter");
    const assigneeFilter = document.getElementById("reports-assignee-filter");
    const includeArchived = document.getElementById("reports-include-archived");

    const totalCount = document.getElementById("reports-total-count");
    const convertedCount = document.getElementById("reports-converted-count");
    const conversionRate = document.getElementById("reports-conversion-rate");
    const openCount = document.getElementById("reports-open-count");
    const overdueCount = document.getElementById("reports-overdue-count");
    const highPriorityCount = document.getElementById("reports-high-priority-count");

    const tableBody = document.getElementById("reports-table-body");
    const tableWrapper = document.getElementById("reports-table-wrapper");
    const emptyState = document.getElementById("reports-empty");
    const tableSummary = document.getElementById("reports-table-summary");
    const generatedAt = document.getElementById("reports-generated-at");

    let allLeads = [];
    let filteredLeads = [];
    let teamMembers = [];
    let teamMemberMap = new Map();
    let charts = {};

    const chartColours = [
        "#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444",
        "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#64748b"
    ];

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatLabel(value) {
        if (!value) return "Unknown";
        return String(value)
            .replaceAll("_", " ")
            .replaceAll("-", " ")
            .replace(/\b\w/g, character => character.toUpperCase());
    }

    function formatDate(value, includeTime = false) {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";
        return date.toLocaleString("en-IN", includeTime
            ? { dateStyle: "medium", timeStyle: "short" }
            : { day: "2-digit", month: "short", year: "numeric" });
    }

    function dateInputValue(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function showMessage(message, type = "info") {
        messageElement.hidden = false;
        messageElement.textContent = message;
        messageElement.className = `reports-message ${type}`;
    }

    function clearMessage() {
        messageElement.hidden = true;
        messageElement.textContent = "";
        messageElement.className = "reports-message";
    }

    function setActionBusy(button, busy, busyText) {
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
        button.disabled = busy;
        button.textContent = busy ? busyText : button.dataset.originalText;
    }

    function getDateBounds() {
        const now = new Date();
        const preset = datePreset.value;
        let start = null;
        let end = null;

        if (preset === "custom") {
            if (fromDate.value) {
                start = new Date(`${fromDate.value}T00:00:00`);
            }
            if (toDate.value) {
                end = new Date(`${toDate.value}T23:59:59.999`);
            }
            return { start, end };
        }

        if (preset === "all") return { start, end };

        end = new Date(now);
        end.setHours(23, 59, 59, 999);

        if (["7", "30", "90"].includes(preset)) {
            start = new Date(now);
            start.setHours(0, 0, 0, 0);
            start.setDate(start.getDate() - Number(preset) + 1);
        } else if (preset === "this-month") {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (preset === "last-month") {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        }

        return { start, end };
    }

    function applyPresetDates() {
        const custom = datePreset.value === "custom";
        fromDate.disabled = !custom;
        toDate.disabled = !custom;

        if (custom) return;

        const { start, end } = getDateBounds();
        fromDate.value = start ? dateInputValue(start) : "";
        toDate.value = end ? dateInputValue(end) : "";
    }

    function populateSelect(select, values, allLabel) {
        const currentValue = select.value;
        const sortedValues = [...new Set(values.filter(Boolean))]
            .sort((first, second) => formatLabel(first).localeCompare(formatLabel(second)));

        select.innerHTML = `<option value="all">${escapeHtml(allLabel)}</option>` +
            sortedValues.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(formatLabel(value))}</option>`).join("");

        if ([...select.options].some(option => option.value === currentValue)) {
            select.value = currentValue;
        }
    }

    function populateFilterOptions() {
        populateSelect(sourceFilter, allLeads.map(lead => lead.lead_source), "All Sources");
        populateSelect(serviceFilter, allLeads.map(lead => lead.service), "All Services");

        const currentAssignee = assigneeFilter.value;
        assigneeFilter.innerHTML = `
            <option value="all">All Team Members</option>
            <option value="unassigned">Unassigned</option>
            ${teamMembers
                .filter(member => member.status === "active")
                .map(member => `<option value="${escapeHtml(member.id)}">${escapeHtml(member.full_name)}</option>`)
                .join("")}
        `;
        if ([...assigneeFilter.options].some(option => option.value === currentAssignee)) {
            assigneeFilter.value = currentAssignee;
        }
    }

    function filterReportLeads() {
        const { start, end } = getDateBounds();
        const sourceValue = sourceFilter.value;
        const serviceValue = serviceFilter.value;
        const statusValue = statusFilter.value;
        const assigneeValue = assigneeFilter.value;

        filteredLeads = allLeads.filter(lead => {
            if (!includeArchived.checked && lead.is_archived) return false;

            const createdDate = lead.created_at ? new Date(lead.created_at) : null;
            if (start && (!createdDate || createdDate < start)) return false;
            if (end && (!createdDate || createdDate > end)) return false;

            if (sourceValue !== "all" && String(lead.lead_source || "") !== sourceValue) return false;
            if (serviceValue !== "all" && String(lead.service || "") !== serviceValue) return false;
            if (statusValue !== "all" && String(lead.status || "new") !== statusValue) return false;

            if (assigneeValue === "unassigned" && lead.assigned_to) return false;
            if (!["all", "unassigned"].includes(assigneeValue) && String(lead.assigned_to || "") !== assigneeValue) return false;

            return true;
        }).sort((first, second) => new Date(second.created_at || 0) - new Date(first.created_at || 0));
    }

    function updateStats() {
        const total = filteredLeads.length;
        const converted = filteredLeads.filter(lead => String(lead.status || "new") === "converted").length;
        const open = filteredLeads.filter(lead => String(lead.status || "new") !== "converted").length;
        const highPriority = filteredLeads.filter(lead => String(lead.priority || "medium") === "high").length;
        const now = new Date();
        const overdue = filteredLeads.filter(lead => {
            if (!lead.follow_up_at || String(lead.status || "new") === "converted") return false;
            const followUpDate = new Date(lead.follow_up_at);
            return !Number.isNaN(followUpDate.getTime()) && followUpDate < now;
        }).length;

        totalCount.textContent = String(total);
        convertedCount.textContent = String(converted);
        conversionRate.textContent = `${total > 0 ? (converted / total * 100).toFixed(1) : "0.0"}%`;
        openCount.textContent = String(open);
        overdueCount.textContent = String(overdue);
        highPriorityCount.textContent = String(highPriority);
    }

    function countBy(keyFunction) {
        const counts = new Map();
        filteredLeads.forEach(lead => {
            const key = keyFunction(lead) || "unknown";
            counts.set(key, (counts.get(key) || 0) + 1);
        });
        return [...counts.entries()].sort((first, second) => second[1] - first[1]);
    }

    function destroyChart(name) {
        if (charts[name]) {
            charts[name].destroy();
            charts[name] = null;
        }
    }

    function createDoughnutChart(name, canvasId, entries) {
        destroyChart(name);
        charts[name] = new Chart(document.getElementById(canvasId), {
            type: "doughnut",
            data: {
                labels: entries.map(entry => formatLabel(entry[0])),
                datasets: [{ data: entries.map(entry => entry[1]), backgroundColor: chartColours, borderWidth: 0, hoverOffset: 7 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "62%",
                plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 14, font: { family: "Poppins", size: 10 } } } }
            }
        });
    }

    function createBarChart(name, canvasId, entries, horizontal = true) {
        destroyChart(name);
        charts[name] = new Chart(document.getElementById(canvasId), {
            type: "bar",
            data: {
                labels: entries.map(entry => formatLabel(entry[0])),
                datasets: [{ label: "Leads", data: entries.map(entry => entry[1]), backgroundColor: "#2563eb", borderRadius: 7, borderSkipped: false }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: horizontal ? "y" : "x",
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(148,163,184,.18)" } },
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { display: !horizontal } }
                }
            }
        });
    }

    function createTrendChart() {
        const counts = new Map();
        filteredLeads.forEach(lead => {
            if (!lead.created_at) return;
            const date = new Date(lead.created_at);
            if (Number.isNaN(date.getTime())) return;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            counts.set(key, (counts.get(key) || 0) + 1);
        });

        const entries = [...counts.entries()].sort((first, second) => first[0].localeCompare(second[0]));
        destroyChart("trend");
        charts.trend = new Chart(document.getElementById("reports-trend-chart"), {
            type: "line",
            data: {
                labels: entries.map(entry => {
                    const [year, month] = entry[0].split("-");
                    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
                }),
                datasets: [{
                    label: "Leads",
                    data: entries.map(entry => entry[1]),
                    borderColor: "#2563eb",
                    backgroundColor: "rgba(37,99,235,.12)",
                    fill: true,
                    tension: .35,
                    pointRadius: 4,
                    pointBackgroundColor: "#2563eb"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "rgba(148,163,184,.18)" } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    function renderCharts() {
        createDoughnutChart("source", "reports-source-chart", countBy(lead => lead.lead_source));
        createBarChart("service", "reports-service-chart", countBy(lead => lead.service).slice(0, 10));
        createDoughnutChart("status", "reports-status-chart", countBy(lead => lead.status || "new"));
        createBarChart("assignee", "reports-assignee-chart", countBy(lead => lead.assigned_to ? teamMemberMap.get(String(lead.assigned_to))?.full_name || "Unknown Member" : "Unassigned").slice(0, 10));
        createTrendChart();
    }

    function renderTable() {
        tableSummary.textContent = `${filteredLeads.length} lead${filteredLeads.length === 1 ? "" : "s"} in this report.`;
        generatedAt.textContent = `Generated ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`;

        if (filteredLeads.length === 0) {
            emptyState.hidden = false;
            tableWrapper.hidden = true;
            tableBody.innerHTML = "";
            return;
        }

        emptyState.hidden = true;
        tableWrapper.hidden = false;
        tableBody.innerHTML = filteredLeads.map(lead => {
            const member = lead.assigned_to ? teamMemberMap.get(String(lead.assigned_to)) : null;
            const status = String(lead.status || "new");
            const priority = String(lead.priority || "medium");
            return `
                <tr>
                    <td><span class="reports-lead-name">${escapeHtml(lead.name || "Unnamed Lead")}</span><span class="reports-muted">${escapeHtml(lead.company || "No company")}${lead.is_archived ? " · Archived" : ""}</span></td>
                    <td><span>${escapeHtml(lead.phone || "-")}</span><span class="reports-muted">${escapeHtml(lead.email || "")}</span></td>
                    <td>${escapeHtml(formatLabel(lead.service))}</td>
                    <td><span class="reports-source-pill">${escapeHtml(formatLabel(lead.lead_source))}</span></td>
                    <td><span class="reports-status-pill ${escapeHtml(status)}">${escapeHtml(formatLabel(status))}</span></td>
                    <td><span class="reports-priority-pill ${escapeHtml(priority)}">${escapeHtml(formatLabel(priority))}</span></td>
                    <td><span class="reports-lead-name">${escapeHtml(member?.full_name || "Unassigned")}</span><span class="reports-muted">${escapeHtml(member?.email || "")}</span></td>
                    <td>${escapeHtml(formatDate(lead.created_at))}</td>
                </tr>
            `;
        }).join("");
    }

    function renderReport() {
        filterReportLeads();
        updateStats();
        renderCharts();
        renderTable();
    }

    function csvEscape(value) {
        const text = String(value ?? "");
        return `"${text.replaceAll('"', '""')}"`;
    }

    function downloadFile(filename, content, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    }

    function exportCsv() {
        if (filteredLeads.length === 0) {
            showMessage("No filtered leads are available to export.", "error");
            return;
        }

        const headers = ["id", "name", "phone", "email", "company", "service", "lead_source", "priority", "status", "assigned_to", "assigned_to_email", "follow_up_at", "created_at", "archived"];
        const rows = filteredLeads.map(lead => {
            const member = lead.assigned_to ? teamMemberMap.get(String(lead.assigned_to)) : null;
            return [
                lead.id, lead.name, lead.phone, lead.email, lead.company, lead.service,
                lead.lead_source, lead.priority, lead.status, member?.full_name || "Unassigned",
                member?.email || "", lead.follow_up_at || "", lead.created_at || "", lead.is_archived ? "yes" : "no"
            ];
        });

        const csv = [headers, ...rows].map(row => row.map(csvEscape).join(",")).join("\r\n");
        downloadFile(`mk-crm-report-${dateInputValue(new Date())}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
        showMessage(`${filteredLeads.length} leads exported successfully.`, "success");
    }

    async function downloadBackup() {
        setActionBusy(backupButton, true, "Preparing...");
        showMessage("Preparing complete CRM backup...", "info");

        const tableQueries = {
            leads: supabaseClient.from("Leads").select("*").order("created_at", { ascending: true }),
            team_members: supabaseClient.from("team_members").select("*").order("created_at", { ascending: true }),
            lead_activities: supabaseClient.from("lead_activities").select("*").order("created_at", { ascending: true }),
            crm_settings: supabaseClient.from("crm_settings").select("*").order("updated_at", { ascending: true }),
            lead_source_rules: supabaseClient.from("lead_source_rules").select("*").order("created_at", { ascending: true }),
            lead_intake_logs: supabaseClient.from("lead_intake_logs").select("*").order("created_at", { ascending: true })
        };

        const entries = await Promise.all(Object.entries(tableQueries).map(async ([name, query]) => {
            const { data, error } = await query;
            return [name, { data: data || [], error: error ? { code: error.code, message: error.message } : null }];
        }));

        const backup = {
            format: "MK_AUTOMATION_CRM_BACKUP_V1",
            generated_at: new Date().toISOString(),
            generated_by: window.crmAccess?.sessionUser?.email || null,
            crm_settings: window.crmSettings || null,
            tables: Object.fromEntries(entries)
        };

        downloadFile(`mk-crm-backup-${dateInputValue(new Date())}.json`, JSON.stringify(backup, null, 2), "application/json;charset=utf-8");
        showMessage("CRM backup downloaded successfully. Store it in a secure location.", "success");
        setActionBusy(backupButton, false, "");
    }

    async function protectReportsPage() {
        const { data: sessionData, error } = await supabaseClient.auth.getSession();
        if (error || !sessionData.session) {
            window.location.href = "login.html";
            return false;
        }

        await window.loadAndApplyCrmSettings();
        if (!window.crmAccess?.canManage) {
            window.location.href = "index.html";
            return false;
        }
        return true;
    }

    async function loadReportData() {
        clearMessage();
        setActionBusy(refreshButton, true, "Refreshing...");

        const [leadsResult, membersResult] = await Promise.all([
            supabaseClient.from("Leads").select(`
                id, name, email, phone, company, service, lead_source,
                priority, status, created_at, follow_up_at, is_archived,
                archived_at, assigned_to, assigned_by, assigned_at, message, notes
            `).order("created_at", { ascending: true }),
            supabaseClient.from("team_members").select("id, full_name, email, role, status").order("full_name", { ascending: true })
        ]);

        if (leadsResult.error || membersResult.error) {
            const error = leadsResult.error || membersResult.error;
            showMessage(`Unable to load reports: ${error.message}`, "error");
            setActionBusy(refreshButton, false, "");
            return;
        }

        allLeads = leadsResult.data || [];
        teamMembers = membersResult.data || [];
        teamMemberMap = new Map(teamMembers.map(member => [String(member.id), member]));
        populateFilterOptions();
        renderReport();
        setActionBusy(refreshButton, false, "");
    }

    function resetFilters() {
        datePreset.value = "30";
        sourceFilter.value = "all";
        serviceFilter.value = "all";
        statusFilter.value = "all";
        assigneeFilter.value = "all";
        includeArchived.checked = false;
        applyPresetDates();
        renderReport();
        clearMessage();
    }

    const filterElements = [datePreset, fromDate, toDate, sourceFilter, serviceFilter, statusFilter, assigneeFilter, includeArchived];
    filterElements.forEach(element => {
        element.addEventListener("change", () => {
            if (element === datePreset) applyPresetDates();
            renderReport();
        });
    });

    refreshButton.addEventListener("click", loadReportData);
    resetButton.addEventListener("click", resetFilters);
    exportButton.addEventListener("click", exportCsv);
    backupButton.addEventListener("click", downloadBackup);
    printButton.addEventListener("click", () => window.print());
    logoutButton.addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        window.location.href = "login.html";
    });

    async function initialiseReportsPage() {
        const hasAccess = await protectReportsPage();
        if (!hasAccess) return;
        applyPresetDates();
        await loadReportData();
    }

    initialiseReportsPage().finally(() => window.finishCrmPageLoading?.());
})();

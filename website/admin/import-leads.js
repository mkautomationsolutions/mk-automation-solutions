(() => {

    "use strict";


    /* =================================
       SUPABASE
    ================================= */

    const supabaseClient =
        window.mkSupabase;


    /* =================================
       CONSTANTS
    ================================= */

    const REQUIRED_HEADERS = [
        "name",
        "phone",
        "service",
        "lead_source"
    ];

    const TEMPLATE_HEADERS = [
        "name",
        "phone",
        "email",
        "company",
        "service",
        "lead_source",
        "priority",
        "status",
        "assigned_to_email",
        "follow_up_date",
        "message",
        "notes"
    ];

    const ALLOWED_SERVICES = new Set([
        "ai-automation",
        "ai-agents",
        "workflow-automation",
        "business-automation",
        "whatsapp-automation",
        "chatbot-development",
        "crm-development",
        "api-integration",
        "custom-ai-solutions",
        "website-development",
        "other"
    ]);

    const ALLOWED_SOURCES = new Set([
        "website",
        "facebook",
        "instagram",
        "whatsapp",
        "linkedin",
        "google-ads",
        "referral",
        "existing-customer",
        "upwork",
        "direct-outreach",
        "employee",
        "phone-call",
        "api",
        "other"
    ]);

    const ALLOWED_PRIORITIES = new Set([
        "low",
        "medium",
        "high"
    ]);

    const ALLOWED_STATUSES = new Set([
        "new",
        "contacted",
        "converted"
    ]);

    const MAX_IMPORT_ROWS = 5000;

    const PREVIEW_ROW_LIMIT = 500;


    /* =================================
       DOM ELEMENTS
    ================================= */

    const logoutButton =
        document.getElementById(
            "logout-btn"
        );

    const pageMessage =
        document.getElementById(
            "import-page-message"
        );

    const uploadZone =
        document.getElementById(
            "lead-upload-zone"
        );

    const fileInput =
        document.getElementById(
            "lead-import-file"
        );

    const selectedFileCard =
        document.getElementById(
            "selected-file-card"
        );

    const selectedFileName =
        document.getElementById(
            "selected-file-name"
        );

    const selectedFileSize =
        document.getElementById(
            "selected-file-size"
        );

    const removeFileButton =
        document.getElementById(
            "remove-import-file-btn"
        );

    const duplicateStrategy =
        document.getElementById(
            "duplicate-strategy"
        );

    const defaultAssigneeSelect =
        document.getElementById(
            "default-import-assignee"
        );

    const validateButton =
        document.getElementById(
            "validate-import-btn"
        );

    const clearButton =
        document.getElementById(
            "clear-import-btn"
        );

    const validationSection =
        document.getElementById(
            "validation-section"
        );

    const totalCountElement =
        document.getElementById(
            "validation-total-count"
        );

    const validCountElement =
        document.getElementById(
            "validation-valid-count"
        );

    const duplicateCountElement =
        document.getElementById(
            "validation-duplicate-count"
        );

    const invalidCountElement =
        document.getElementById(
            "validation-invalid-count"
        );

    const updateCountElement =
        document.getElementById(
            "validation-update-count"
        );

    const previewStatusFilter =
        document.getElementById(
            "preview-status-filter"
        );

    const previewRowSummary =
        document.getElementById(
            "preview-row-summary"
        );

    const previewBody =
        document.getElementById(
            "import-preview-body"
        );

    const downloadValidationErrorsButton =
        document.getElementById(
            "download-validation-errors-btn"
        );

    const importValidLeadsButton =
        document.getElementById(
            "import-valid-leads-btn"
        );

    const progressSection =
        document.getElementById(
            "import-progress-section"
        );

    const progressTitle =
        document.getElementById(
            "import-progress-title"
        );

    const progressPercent =
        document.getElementById(
            "import-progress-percent"
        );

    const progressBar =
        document.getElementById(
            "import-progress-bar"
        );

    const progressMessage =
        document.getElementById(
            "import-progress-message"
        );

    const resultSection =
        document.getElementById(
            "import-result-section"
        );

    const resultTitle =
        document.getElementById(
            "import-result-title"
        );

    const resultMessage =
        document.getElementById(
            "import-result-message"
        );

    const resultImportedCount =
        document.getElementById(
            "result-imported-count"
        );

    const resultUpdatedCount =
        document.getElementById(
            "result-updated-count"
        );

    const resultSkippedCount =
        document.getElementById(
            "result-skipped-count"
        );

    const resultFailedCount =
        document.getElementById(
            "result-failed-count"
        );

    const importAnotherFileButton =
        document.getElementById(
            "import-another-file-btn"
        );

    const downloadImportFailuresButton =
        document.getElementById(
            "download-import-failures-btn"
        );


    /* =================================
       STATE
    ================================= */

    let selectedFile = null;

    let parsedRows = [];

    let validatedRows = [];

    let teamMembers = [];

    let teamMemberByEmail =
        new Map();

    let existingLeads = [];

    let existingLeadByPhone =
        new Map();

    let existingLeadByEmail =
        new Map();

    let lastImportFailures = [];

    let isImporting = false;


    /* =================================
       BASIC HELPERS
    ================================= */

    function escapeHtml(value) {

        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    function normalizeText(value) {

        return String(value ?? "")
            .trim();

    }


    function normalizeEmail(value) {

        return normalizeText(value)
            .toLowerCase();

    }


    function normalizePhone(value) {

        return normalizeText(value)
            .replace(/\D/g, "");

    }


    function normalizeSlug(value) {

        return normalizeText(value)
            .toLowerCase()
            .replace(/[_\s]+/g, "-")
            .replace(/-+/g, "-");

    }


    function normalizeHeader(value) {

        const normalized =
            normalizeText(value)
                .toLowerCase()
                .replace(/[\s-]+/g, "_")
                .replace(/[^a-z0-9_]/g, "");


        const headerAliases = {
            full_name: "name",
            customer_name: "name",
            contact_name: "name",
            mobile: "phone",
            mobile_number: "phone",
            phone_number: "phone",
            contact_number: "phone",
            mail: "email",
            email_address: "email",
            business: "company",
            business_name: "company",
            service_name: "service",
            source: "lead_source",
            leadsource: "lead_source",
            assigned_email: "assigned_to_email",
            assignee_email: "assigned_to_email",
            employee_email: "assigned_to_email",
            follow_up: "follow_up_date",
            followup_date: "follow_up_date",
            requirement: "message",
            enquiry: "message",
            enquiry_message: "message"
        };


        return (
            headerAliases[normalized] ||
            normalized
        );

    }


    function formatFileSize(bytes) {

        if (!Number.isFinite(bytes)) {
            return "0 KB";
        }


        if (bytes < 1024) {
            return `${bytes} bytes`;
        }


        if (bytes < 1024 * 1024) {

            return `${(
                bytes / 1024
            ).toFixed(1)} KB`;

        }


        return `${(
            bytes /
            (1024 * 1024)
        ).toFixed(1)} MB`;

    }


    function isValidEmail(email) {

        if (!email) {
            return true;
        }


        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(email);

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


    function csvEscape(value) {

        return `"${String(value ?? "")
            .replaceAll(
                '"',
                '""'
            )}"`;

    }


    function downloadCsv(
        filename,
        headers,
        rows
    ) {

        const content = [
            headers
                .map(csvEscape)
                .join(","),
            ...rows.map(
                row =>
                    row
                        .map(csvEscape)
                        .join(",")
            )
        ].join("\n");


        const blob =
            new Blob(
                ["\uFEFF", content],
                {
                    type:
                        "text/csv;charset=utf-8;"
                }
            );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        link.href = url;

        link.download = filename;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    }


    /* =================================
       PAGE MESSAGES
    ================================= */

    function showPageMessage(
        message,
        type = "info"
    ) {

        pageMessage.hidden = false;

        pageMessage.textContent =
            message;

        pageMessage.className =
            `import-page-message ${type}`;

    }


    function clearPageMessage() {

        pageMessage.hidden = true;

        pageMessage.textContent = "";

        pageMessage.className =
            "import-page-message";

    }


    /* =================================
       AUTHENTICATION / ACCESS
    ================================= */

    async function protectImportPage() {

        if (!supabaseClient) {

            window.location.replace(
                "login.html"
            );

            return false;

        }


        const {
            data: sessionData,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (
            error ||
            !sessionData?.session
        ) {

            window.location.replace(
                "login.html"
            );

            return false;

        }


        await window
            .loadAndApplyCrmSettings();


        if (
            window.crmAccess?.canManage !==
            true
        ) {

            window.alert(
                "Only an Administrator or Manager can import leads."
            );

            window.location.replace(
                "leads.html"
            );

            return false;

        }


        return true;

    }


    /* =================================
       LOAD SUPPORTING DATA
    ================================= */

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
                .eq(
                    "status",
                    "active"
                )
                .order(
                    "full_name",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Unable to load team members:",
                error
            );

            teamMembers = [];

        } else {

            teamMembers =
                data ?? [];

        }


        teamMemberByEmail =
            new Map(
                teamMembers.map(
                    member => [
                        normalizeEmail(
                            member.email
                        ),
                        member
                    ]
                )
            );


        defaultAssigneeSelect.innerHTML = `
            <option value="">
                Keep Unassigned
            </option>

            ${teamMembers
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

    }


    async function loadExistingLeads() {

        const { data, error } =
            await supabaseClient
                .from("Leads")
                .select(`
                    id,
                    name,
                    phone,
                    email,
                    assigned_to,
                    is_archived
                `)
                .eq(
                    "is_archived",
                    false
                );


        if (error) {

            throw new Error(
                `Unable to check existing leads: ${error.message}`
            );

        }


        existingLeads =
            data ?? [];


        existingLeadByPhone =
            new Map();

        existingLeadByEmail =
            new Map();


        existingLeads.forEach(
            lead => {

                const phone =
                    normalizePhone(
                        lead.phone
                    );

                const email =
                    normalizeEmail(
                        lead.email
                    );


                if (
                    phone &&
                    !existingLeadByPhone
                        .has(phone)
                ) {

                    existingLeadByPhone
                        .set(
                            phone,
                            lead
                        );

                }


                if (
                    email &&
                    !existingLeadByEmail
                        .has(email)
                ) {

                    existingLeadByEmail
                        .set(
                            email,
                            lead
                        );

                }

            }
        );

    }


    /* =================================
       FILE PARSING
    ================================= */

    function parseCsvText(text) {

        const rows = [];

        let currentRow = [];

        let currentValue = "";

        let insideQuotes = false;


        for (
            let index = 0;
            index < text.length;
            index += 1
        ) {

            const character =
                text[index];

            const nextCharacter =
                text[index + 1];


            if (character === '"') {

                if (
                    insideQuotes &&
                    nextCharacter === '"'
                ) {

                    currentValue += '"';

                    index += 1;

                } else {

                    insideQuotes =
                        !insideQuotes;

                }

                continue;

            }


            if (
                character === "," &&
                !insideQuotes
            ) {

                currentRow.push(
                    currentValue
                );

                currentValue = "";

                continue;

            }


            if (
                (
                    character === "\n" ||
                    character === "\r"
                ) &&
                !insideQuotes
            ) {

                if (
                    character === "\r" &&
                    nextCharacter === "\n"
                ) {
                    index += 1;
                }


                currentRow.push(
                    currentValue
                );

                currentValue = "";


                if (
                    currentRow.some(
                        value =>
                            normalizeText(value)
                    )
                ) {
                    rows.push(currentRow);
                }


                currentRow = [];

                continue;

            }


            currentValue +=
                character;

        }


        currentRow.push(
            currentValue
        );


        if (
            currentRow.some(
                value =>
                    normalizeText(value)
            )
        ) {
            rows.push(currentRow);
        }


        if (rows.length === 0) {
            return [];
        }


        const headers =
            rows[0].map(
                normalizeHeader
            );


        return rows
            .slice(1)
            .map(
                values => {

                    const row = {};


                    headers.forEach(
                        (header, index) => {

                            if (!header) {
                                return;
                            }


                            row[header] =
                                values[index] ?? "";

                        }
                    );


                    return row;

                }
            );

    }


    function normalizeParsedObject(row) {

        const normalizedRow = {};


        Object.entries(
            row || {}
        ).forEach(
            ([key, value]) => {

                normalizedRow[
                    normalizeHeader(key)
                ] = value;

            }
        );


        return normalizedRow;

    }


    function getWorkbookRows(
        arrayBuffer
    ) {

        if (!window.XLSX) {

            throw new Error(
                "Excel reader did not load. Check your internet connection or upload the CSV template."
            );

        }


        const workbook =
            window.XLSX.read(
                arrayBuffer,
                {
                    type: "array",
                    cellDates: true
                }
            );


        const preferredSheetName =
            workbook.SheetNames.find(
                name =>
                    name.toLowerCase() ===
                    "lead import template"
            ) ||
            workbook.SheetNames[0];


        if (!preferredSheetName) {

            throw new Error(
                "The Excel workbook does not contain a worksheet."
            );

        }


        const worksheet =
            workbook.Sheets[
                preferredSheetName
            ];


        return window.XLSX.utils
            .sheet_to_json(
                worksheet,
                {
                    defval: "",
                    raw: false,
                    dateNF:
                        "yyyy-mm-dd hh:mm"
                }
            )
            .map(
                normalizeParsedObject
            );

    }


    async function parseSelectedFile() {

        if (!selectedFile) {

            throw new Error(
                "Choose a CSV or Excel file first."
            );

        }


        const extension =
            selectedFile.name
                .split(".")
                .pop()
                .toLowerCase();


        let rows = [];


        if (extension === "csv") {

            const text =
                await selectedFile.text();

            rows =
                parseCsvText(text);

        } else if (
            extension === "xlsx" ||
            extension === "xls"
        ) {

            const arrayBuffer =
                await selectedFile
                    .arrayBuffer();

            rows =
                getWorkbookRows(
                    arrayBuffer
                );

        } else {

            throw new Error(
                "Unsupported file type. Upload CSV, XLSX or XLS."
            );

        }


        rows = rows.filter(
            row =>
                Object.values(row)
                    .some(
                        value =>
                            normalizeText(value)
                    )
        );


        if (rows.length === 0) {

            throw new Error(
                "The uploaded file does not contain lead rows."
            );

        }


        if (
            rows.length >
            MAX_IMPORT_ROWS
        ) {

            throw new Error(
                `The file contains ${rows.length} rows. ` +
                `Import a maximum of ${MAX_IMPORT_ROWS} rows at one time.`
            );

        }


        const availableHeaders =
            new Set(
                Object.keys(
                    rows[0] || {}
                )
            );


        const missingHeaders =
            REQUIRED_HEADERS.filter(
                header =>
                    !availableHeaders.has(
                        header
                    )
            );


        if (
            missingHeaders.length > 0
        ) {

            throw new Error(
                `Missing required columns: ${missingHeaders.join(", ")}. ` +
                "Download and use the fixed CRM template."
            );

        }


        return rows;

    }


    /* =================================
       DATE PARSING
    ================================= */

    function parseFollowUpDate(value) {

        const text =
            normalizeText(value);


        if (!text) {

            return {
                iso: null,
                error: ""
            };

        }


        const exactMatch =
            text.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?$/
            );


        let date = null;


        if (exactMatch) {

            const [
                ,
                year,
                month,
                day,
                hour = "10",
                minute = "00"
            ] = exactMatch;


            date = new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hour),
                Number(minute),
                0,
                0
            );


            const dateIsExact =
                date.getFullYear() ===
                    Number(year) &&
                date.getMonth() ===
                    Number(month) - 1 &&
                date.getDate() ===
                    Number(day);


            if (!dateIsExact) {

                return {
                    iso: null,
                    error:
                        "Follow-up date is invalid. Use YYYY-MM-DD or YYYY-MM-DD HH:MM."
                };

            }

        } else {

            date = new Date(text);

        }


        if (
            !date ||
            Number.isNaN(
                date.getTime()
            )
        ) {

            return {
                iso: null,
                error:
                    "Follow-up date is invalid. Use YYYY-MM-DD or YYYY-MM-DD HH:MM."
            };

        }


        return {
            iso: date.toISOString(),
            error: ""
        };

    }


    /* =================================
       VALIDATION
    ================================= */

    function findExistingDuplicate(
        normalizedPhone,
        normalizedEmail
    ) {

        if (
            normalizedPhone &&
            existingLeadByPhone.has(
                normalizedPhone
            )
        ) {

            return existingLeadByPhone.get(
                normalizedPhone
            );

        }


        if (
            normalizedEmail &&
            existingLeadByEmail.has(
                normalizedEmail
            )
        ) {

            return existingLeadByEmail.get(
                normalizedEmail
            );

        }


        return null;

    }


    function validateRows(rows) {

        const filePhoneMap =
            new Map();

        const fileEmailMap =
            new Map();

        const defaultAssigneeId =
            defaultAssigneeSelect.value ||
            null;

        const strategy =
            duplicateStrategy.value;


        return rows.map(
            (sourceRow, index) => {

                const rowNumber =
                    index + 2;

                const name =
                    normalizeText(
                        sourceRow.name
                    );

                const phoneOriginal =
                    normalizeText(
                        sourceRow.phone
                    );

                const phoneNormalized =
                    normalizePhone(
                        sourceRow.phone
                    );

                const email =
                    normalizeEmail(
                        sourceRow.email
                    );

                const company =
                    normalizeText(
                        sourceRow.company
                    );

                const service =
                    normalizeSlug(
                        sourceRow.service
                    );

                const leadSource =
                    normalizeSlug(
                        sourceRow.lead_source
                    );

                const priority =
                    normalizeSlug(
                        sourceRow.priority ||
                        "medium"
                    );

                const status =
                    normalizeSlug(
                        sourceRow.status ||
                        "new"
                    );

                const assignedEmail =
                    normalizeEmail(
                        sourceRow.assigned_to_email
                    );

                const followUpResult =
                    parseFollowUpDate(
                        sourceRow.follow_up_date
                    );

                const message =
                    normalizeText(
                        sourceRow.message
                    );

                const notes =
                    normalizeText(
                        sourceRow.notes
                    );

                const errors = [];


                if (name.length < 2) {
                    errors.push(
                        "Name is required."
                    );
                }


                if (
                    phoneNormalized.length < 8
                ) {
                    errors.push(
                        "Phone must contain at least 8 digits."
                    );
                }


                if (!isValidEmail(email)) {
                    errors.push(
                        "Email format is invalid."
                    );
                }


                if (
                    !ALLOWED_SERVICES.has(
                        service
                    )
                ) {
                    errors.push(
                        `Invalid service: ${service || "blank"}.`
                    );
                }


                if (
                    !ALLOWED_SOURCES.has(
                        leadSource
                    )
                ) {
                    errors.push(
                        `Invalid lead source: ${leadSource || "blank"}.`
                    );
                }


                if (
                    !ALLOWED_PRIORITIES.has(
                        priority
                    )
                ) {
                    errors.push(
                        `Invalid priority: ${priority || "blank"}.`
                    );
                }


                if (
                    !ALLOWED_STATUSES.has(
                        status
                    )
                ) {
                    errors.push(
                        `Invalid status: ${status || "blank"}.`
                    );
                }


                if (followUpResult.error) {
                    errors.push(
                        followUpResult.error
                    );
                }


                let assignedMember = null;

                let assignedTo =
                    defaultAssigneeId;

                let assignmentSpecified =
                    Boolean(
                        defaultAssigneeId
                    );


                if (assignedEmail) {

                    assignedMember =
                        teamMemberByEmail.get(
                            assignedEmail
                        ) || null;


                    if (!assignedMember) {

                        errors.push(
                            `No active team member matches ${assignedEmail}.`
                        );

                    } else {

                        assignedTo =
                            assignedMember.id;

                        assignmentSpecified =
                            true;

                    }

                } else if (assignedTo) {

                    assignedMember =
                        teamMembers.find(
                            member =>
                                String(member.id) ===
                                String(assignedTo)
                        ) || null;

                }


                let fileDuplicateReason = "";


                if (
                    phoneNormalized &&
                    filePhoneMap.has(
                        phoneNormalized
                    )
                ) {

                    fileDuplicateReason =
                        `Phone duplicates uploaded row ${filePhoneMap.get(phoneNormalized)}.`;

                }


                if (
                    !fileDuplicateReason &&
                    email &&
                    fileEmailMap.has(email)
                ) {

                    fileDuplicateReason =
                        `Email duplicates uploaded row ${fileEmailMap.get(email)}.`;

                }


                if (
                    phoneNormalized &&
                    !filePhoneMap.has(
                        phoneNormalized
                    )
                ) {

                    filePhoneMap.set(
                        phoneNormalized,
                        rowNumber
                    );

                }


                if (
                    email &&
                    !fileEmailMap.has(email)
                ) {

                    fileEmailMap.set(
                        email,
                        rowNumber
                    );

                }


                const existingDuplicate =
                    findExistingDuplicate(
                        phoneNormalized,
                        email
                    );


                let validationStatus =
                    "valid";

                let duplicateReason = "";

                let duplicateLeadId = null;


                if (errors.length > 0) {

                    validationStatus =
                        "invalid";

                } else if (fileDuplicateReason) {

                    validationStatus =
                        "duplicate";

                    duplicateReason =
                        fileDuplicateReason;

                } else if (existingDuplicate) {

                    duplicateLeadId =
                        existingDuplicate.id;

                    duplicateReason =
                        `Matches existing lead #${existingDuplicate.id} (${existingDuplicate.name || "Unnamed"}).`;

                    validationStatus =
                        strategy === "update"
                            ? "update"
                            : "duplicate";

                }


                return {
                    rowNumber,
                    sourceRow,
                    name,
                    phone:
                        phoneOriginal ||
                        phoneNormalized,
                    phoneNormalized,
                    email,
                    company,
                    service,
                    lead_source:
                        leadSource,
                    priority,
                    status,
                    assigned_to_email:
                        assignedEmail,
                    assigned_to:
                        assignedTo,
                    assigned_member_name:
                        assignedMember
                            ?.full_name ||
                        "Unassigned",
                    assignmentSpecified,
                    follow_up_at:
                        followUpResult.iso,
                    message,
                    notes,
                    errors,
                    duplicateReason,
                    duplicateLeadId,
                    validationStatus
                };

            }
        );

    }


    function getValidationCounts() {

        const counts = {
            total:
                validatedRows.length,
            valid: 0,
            duplicate: 0,
            invalid: 0,
            update: 0
        };


        validatedRows.forEach(
            row => {

                if (
                    Object.prototype
                        .hasOwnProperty.call(
                            counts,
                            row.validationStatus
                        )
                ) {

                    counts[
                        row.validationStatus
                    ] += 1;

                }

            }
        );


        return counts;

    }


    /* =================================
       VALIDATION UI
    ================================= */

    function renderValidationSummary() {

        const counts =
            getValidationCounts();


        totalCountElement.textContent =
            String(counts.total);

        validCountElement.textContent =
            String(
                counts.valid +
                counts.update
            );

        duplicateCountElement.textContent =
            String(counts.duplicate);

        invalidCountElement.textContent =
            String(counts.invalid);

        updateCountElement.textContent =
            String(counts.update);


        importValidLeadsButton.disabled =
            (
                counts.valid +
                counts.update
            ) === 0;


        downloadValidationErrorsButton.disabled =
            (
                counts.invalid +
                counts.duplicate
            ) === 0;


        importValidLeadsButton.textContent =
            counts.update > 0
                ? `Import ${counts.valid} & Update ${counts.update}`
                : `Import ${counts.valid} Valid Leads`;

    }


    function getPreviewRows() {

        const selectedStatus =
            previewStatusFilter.value;


        if (selectedStatus === "all") {
            return validatedRows;
        }


        return validatedRows.filter(
            row =>
                row.validationStatus ===
                selectedStatus
        );

    }


    function renderPreview() {

        const previewRows =
            getPreviewRows();

        const visibleRows =
            previewRows.slice(
                0,
                PREVIEW_ROW_LIMIT
            );


        previewRowSummary.textContent =
            previewRows.length >
            PREVIEW_ROW_LIMIT
                ? `Showing first ${PREVIEW_ROW_LIMIT} of ${previewRows.length} rows`
                : `${previewRows.length} rows`;


        if (
            visibleRows.length === 0
        ) {

            previewBody.innerHTML = `
                <tr>
                    <td
                        colspan="10"
                        class="import-preview-empty"
                    >
                        No rows match this preview filter.
                    </td>
                </tr>
            `;

            return;

        }


        previewBody.innerHTML =
            visibleRows
                .map(
                    row => {

                        const detailText =
                            row.errors.length > 0
                                ? row.errors.join(" ")
                                : row.duplicateReason ||
                                  "Ready for import.";


                        return `
                            <tr class="import-row-${escapeHtml(
                                row.validationStatus
                            )}">

                                <td>
                                    ${escapeHtml(
                                        row.rowNumber
                                    )}
                                </td>

                                <td>
                                    <span class="import-row-status ${escapeHtml(
                                        row.validationStatus
                                    )}">
                                        ${escapeHtml(
                                            row.validationStatus === "valid"
                                                ? "Ready"
                                                : row.validationStatus
                                        )}
                                    </span>
                                </td>

                                <td>
                                    <span class="import-preview-primary">
                                        ${escapeHtml(
                                            row.name || "-"
                                        )}
                                    </span>
                                    <span class="import-preview-secondary">
                                        ${escapeHtml(
                                            row.company || "No company"
                                        )}
                                    </span>
                                </td>

                                <td>
                                    ${escapeHtml(
                                        row.phone || "-"
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        row.email || "-"
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        formatLabel(
                                            row.service
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        formatLabel(
                                            row.lead_source
                                        )
                                    )}
                                </td>

                                <td>
                                    ${escapeHtml(
                                        formatLabel(
                                            row.priority
                                        )
                                    )}
                                </td>

                                <td>
                                    <span class="import-preview-primary">
                                        ${escapeHtml(
                                            row.assigned_member_name
                                        )}
                                    </span>
                                    <span class="import-preview-secondary">
                                        ${escapeHtml(
                                            row.assigned_to_email ||
                                            ""
                                        )}
                                    </span>
                                </td>

                                <td>
                                    <span class="${
                                        row.validationStatus === "invalid"
                                            ? "import-preview-errors"
                                            : "import-preview-secondary"
                                    }">
                                        ${escapeHtml(
                                            detailText
                                        )}
                                    </span>
                                </td>

                            </tr>
                        `;

                    }
                )
                .join("");

    }


    function showValidationSection() {

        validationSection.hidden =
            false;

        resultSection.hidden =
            true;

        progressSection.hidden =
            true;


        renderValidationSummary();

        renderPreview();


        validationSection
            .scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

    }


    /* =================================
       FILE SELECTION
    ================================= */

    function setSelectedFile(file) {

        clearPageMessage();


        if (!file) {
            clearSelectedFile();
            return;
        }


        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        if (
            !["csv", "xlsx", "xls"]
                .includes(extension)
        ) {

            showPageMessage(
                "Unsupported file type. Upload CSV, XLSX or XLS.",
                "error"
            );

            clearSelectedFile();

            return;

        }


        selectedFile = file;

        parsedRows = [];

        validatedRows = [];


        selectedFileName.textContent =
            file.name;

        selectedFileSize.textContent =
            formatFileSize(
                file.size
            );

        selectedFileCard.hidden =
            false;

        validateButton.disabled =
            false;

        validationSection.hidden =
            true;

        resultSection.hidden =
            true;

        progressSection.hidden =
            true;

    }


    function clearSelectedFile() {

        selectedFile = null;

        parsedRows = [];

        validatedRows = [];

        lastImportFailures = [];

        fileInput.value = "";

        selectedFileCard.hidden =
            true;

        validateButton.disabled =
            true;

        validationSection.hidden =
            true;

        progressSection.hidden =
            true;

        resultSection.hidden =
            true;

        previewBody.innerHTML = "";

        clearPageMessage();

    }


    /* =================================
       VALIDATE FILE
    ================================= */

    async function validateSelectedFile() {

        if (!selectedFile) {

            showPageMessage(
                "Choose a CSV or Excel file first.",
                "error"
            );

            return;

        }


        clearPageMessage();

        validateButton.disabled = true;

        validateButton.textContent =
            "Validating...";

        clearButton.disabled = true;


        try {

            parsedRows =
                await parseSelectedFile();


            await loadExistingLeads();


            validatedRows =
                validateRows(
                    parsedRows
                );


            showValidationSection();


            const counts =
                getValidationCounts();


            showPageMessage(
                `Validation complete: ${counts.valid + counts.update} rows are ready, ` +
                `${counts.duplicate} duplicates and ${counts.invalid} invalid rows.`,
                counts.invalid > 0
                    ? "info"
                    : "success"
            );

        } catch (error) {

            console.error(
                "Unable to validate import file:",
                error
            );


            showPageMessage(
                error.message ||
                "Unable to validate the selected file.",
                "error"
            );

        } finally {

            validateButton.disabled =
                !selectedFile;

            validateButton.textContent =
                "Validate File";

            clearButton.disabled =
                false;

        }

    }


    async function revalidateCurrentRows() {

        if (
            parsedRows.length === 0 ||
            isImporting
        ) {
            return;
        }


        try {

            await loadExistingLeads();

            validatedRows =
                validateRows(
                    parsedRows
                );

            renderValidationSummary();

            renderPreview();

        } catch (error) {

            showPageMessage(
                error.message,
                "error"
            );

        }

    }


    /* =================================
       ERROR REPORTS
    ================================= */

    function getValidationErrorRows() {

        return validatedRows.filter(
            row =>
                row.validationStatus ===
                    "invalid" ||
                row.validationStatus ===
                    "duplicate"
        );

    }


    function downloadValidationErrors() {

        const rows =
            getValidationErrorRows();


        if (rows.length === 0) {
            return;
        }


        const headers = [
            ...TEMPLATE_HEADERS,
            "row_number",
            "validation_status",
            "validation_details"
        ];


        const csvRows =
            rows.map(
                row => [
                    row.name,
                    row.phone,
                    row.email,
                    row.company,
                    row.service,
                    row.lead_source,
                    row.priority,
                    row.status,
                    row.assigned_to_email,
                    row.follow_up_at || "",
                    row.message,
                    row.notes,
                    row.rowNumber,
                    row.validationStatus,
                    row.errors.join(" ") ||
                        row.duplicateReason
                ]
            );


        downloadCsv(
            `lead-import-validation-errors-${new Date().toISOString().slice(0, 10)}.csv`,
            headers,
            csvRows
        );

    }


    function downloadImportFailures() {

        if (
            lastImportFailures.length === 0
        ) {
            return;
        }


        const headers = [
            ...TEMPLATE_HEADERS,
            "row_number",
            "import_error"
        ];


        const rows =
            lastImportFailures.map(
                failure => [
                    failure.row.name,
                    failure.row.phone,
                    failure.row.email,
                    failure.row.company,
                    failure.row.service,
                    failure.row.lead_source,
                    failure.row.priority,
                    failure.row.status,
                    failure.row.assigned_to_email,
                    failure.row.follow_up_at || "",
                    failure.row.message,
                    failure.row.notes,
                    failure.row.rowNumber,
                    failure.error
                ]
            );


        downloadCsv(
            `lead-import-failures-${new Date().toISOString().slice(0, 10)}.csv`,
            headers,
            rows
        );

    }


    /* =================================
       IMPORT PAYLOADS
    ================================= */

    function buildInsertPayload(row) {

        const assignedAt =
            row.assigned_to
                ? new Date()
                    .toISOString()
                : null;


        return {
            name: row.name,
            phone:
                row.phone || null,
            email:
                row.email || null,
            company:
                row.company || null,
            service:
                row.service,
            lead_source:
                row.lead_source,
            priority:
                row.priority,
            status:
                row.status,
            message:
                row.message || null,
            notes:
                row.notes || null,
            follow_up_at:
                row.follow_up_at,
            is_archived: false,
            assigned_to:
                row.assigned_to || null,
            assigned_by:
                row.assigned_to
                    ? window.crmAccess
                        ?.currentMember
                        ?.id || null
                    : null,
            assigned_at:
                assignedAt
        };

    }


    function buildUpdatePayload(row) {

        const payload = {
            name: row.name,
            phone:
                row.phone || null,
            email:
                row.email || null,
            company:
                row.company || null,
            service:
                row.service,
            lead_source:
                row.lead_source,
            priority:
                row.priority,
            status:
                row.status,
            message:
                row.message || null,
            notes:
                row.notes || null,
            follow_up_at:
                row.follow_up_at
        };


        if (row.assignmentSpecified) {

            payload.assigned_to =
                row.assigned_to || null;

            payload.assigned_by =
                row.assigned_to
                    ? window.crmAccess
                        ?.currentMember
                        ?.id || null
                    : null;

            payload.assigned_at =
                row.assigned_to
                    ? new Date()
                        .toISOString()
                    : null;

        }


        return payload;

    }


    /* =================================
       IMPORT PROGRESS
    ================================= */

    function setImportProgress(
        completed,
        total,
        message
    ) {

        const percentage =
            total > 0
                ? Math.min(
                    100,
                    Math.round(
                        completed /
                        total *
                        100
                    )
                )
                : 0;


        progressPercent.textContent =
            `${percentage}%`;

        progressBar.style.width =
            `${percentage}%`;

        progressMessage.textContent =
            message;

    }


    function showImportProgress(
        total
    ) {

        progressSection.hidden =
            false;

        resultSection.hidden =
            true;

        validationSection.hidden =
            false;

        progressTitle.textContent =
            "Saving leads to CRM...";

        setImportProgress(
            0,
            total,
            "Preparing import..."
        );

        progressSection
            .scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

    }


    /* =================================
       DATABASE IMPORT
    ================================= */

    async function insertRowsWithRecovery(
        rows,
        progressState
    ) {

        const successfulRows = [];

        const failures = [];

        const chunkSize = 100;


        for (
            let index = 0;
            index < rows.length;
            index += chunkSize
        ) {

            const chunk =
                rows.slice(
                    index,
                    index + chunkSize
                );

            const payload =
                chunk.map(
                    buildInsertPayload
                );


            const { data, error } =
                await supabaseClient
                    .from("Leads")
                    .insert(payload)
                    .select("id");


            if (!error) {

                successfulRows.push(
                    ...chunk
                );

                progressState.completed +=
                    chunk.length;

                setImportProgress(
                    progressState.completed,
                    progressState.total,
                    `Imported ${progressState.completed} of ${progressState.total} rows...`
                );

                continue;

            }


            console.warn(
                "Bulk insert failed. Retrying rows individually:",
                error
            );


            for (const row of chunk) {

                const {
                    error: rowError
                } =
                    await supabaseClient
                        .from("Leads")
                        .insert(
                            buildInsertPayload(
                                row
                            )
                        );


                if (rowError) {

                    failures.push({
                        row,
                        error:
                            rowError.message
                    });

                } else {

                    successfulRows.push(row);

                }


                progressState.completed += 1;

                setImportProgress(
                    progressState.completed,
                    progressState.total,
                    `Imported ${progressState.completed} of ${progressState.total} rows...`
                );

            }

        }


        return {
            successfulRows,
            failures
        };

    }


    async function updateRows(
        rows,
        progressState
    ) {

        const successfulRows = [];

        const failures = [];

        const concurrentBatchSize = 20;


        for (
            let index = 0;
            index < rows.length;
            index += concurrentBatchSize
        ) {

            const batch =
                rows.slice(
                    index,
                    index + concurrentBatchSize
                );


            const results =
                await Promise.all(
                    batch.map(
                        async row => {

                            const { error } =
                                await supabaseClient
                                    .from("Leads")
                                    .update(
                                        buildUpdatePayload(
                                            row
                                        )
                                    )
                                    .eq(
                                        "id",
                                        row.duplicateLeadId
                                    );


                            return {
                                row,
                                error
                            };

                        }
                    )
                );


            results.forEach(
                result => {

                    if (result.error) {

                        failures.push({
                            row:
                                result.row,
                            error:
                                result.error.message
                        });

                    } else {

                        successfulRows.push(
                            result.row
                        );

                    }

                }
            );


            progressState.completed +=
                batch.length;

            setImportProgress(
                progressState.completed,
                progressState.total,
                `Processed ${progressState.completed} of ${progressState.total} rows...`
            );

        }


        return {
            successfulRows,
            failures
        };

    }


    async function importValidatedLeads() {

        if (isImporting) {
            return;
        }


        const insertRows =
            validatedRows.filter(
                row =>
                    row.validationStatus ===
                    "valid"
            );

        const updateRowsList =
            validatedRows.filter(
                row =>
                    row.validationStatus ===
                    "update"
            );

        const skippedRows =
            validatedRows.filter(
                row =>
                    row.validationStatus ===
                    "duplicate" ||
                    row.validationStatus ===
                    "invalid"
            );

        const totalReady =
            insertRows.length +
            updateRowsList.length;


        if (totalReady === 0) {

            showPageMessage(
                "There are no valid rows to import.",
                "error"
            );

            return;

        }


        const confirmed =
            window.confirm(
                `Import ${insertRows.length} new leads` +
                `${updateRowsList.length > 0 ? ` and update ${updateRowsList.length} existing leads` : ""}?\n\n` +
                `${skippedRows.length} invalid or duplicate rows will not be imported.`
            );


        if (!confirmed) {
            return;
        }


        isImporting = true;

        lastImportFailures = [];

        clearPageMessage();

        importValidLeadsButton.disabled =
            true;

        validateButton.disabled =
            true;

        clearButton.disabled =
            true;

        duplicateStrategy.disabled =
            true;

        defaultAssigneeSelect.disabled =
            true;


        showImportProgress(
            totalReady
        );


        const progressState = {
            completed: 0,
            total: totalReady
        };


        try {

            const insertResult =
                await insertRowsWithRecovery(
                    insertRows,
                    progressState
                );


            const updateResult =
                await updateRows(
                    updateRowsList,
                    progressState
                );


            lastImportFailures = [
                ...insertResult.failures,
                ...updateResult.failures
            ];


            const importedCount =
                insertResult
                    .successfulRows
                    .length;

            const updatedCount =
                updateResult
                    .successfulRows
                    .length;

            const skippedCount =
                skippedRows.length;

            const failedCount =
                lastImportFailures.length;


            setImportProgress(
                totalReady,
                totalReady,
                "Import complete."
            );


            showImportResult({
                importedCount,
                updatedCount,
                skippedCount,
                failedCount
            });


            showPageMessage(
                failedCount > 0
                    ? "Import completed with some failed rows. Download the failure report for details."
                    : "Lead import completed successfully.",
                failedCount > 0
                    ? "info"
                    : "success"
            );

        } catch (error) {

            console.error(
                "Lead import failed:",
                error
            );


            showPageMessage(
                `Lead import failed: ${error.message}`,
                "error"
            );


            progressTitle.textContent =
                "Import stopped";

            progressMessage.textContent =
                error.message;

        } finally {

            isImporting = false;

            validateButton.disabled =
                !selectedFile;

            clearButton.disabled =
                false;

            duplicateStrategy.disabled =
                false;

            defaultAssigneeSelect.disabled =
                false;

            renderValidationSummary();

        }

    }


    function showImportResult({
        importedCount,
        updatedCount,
        skippedCount,
        failedCount
    }) {

        resultSection.hidden =
            false;

        resultTitle.textContent =
            failedCount > 0
                ? "Import completed with warnings"
                : "Leads imported successfully";

        resultMessage.textContent =
            `${importedCount} new leads were created, ` +
            `${updatedCount} existing leads were updated, ` +
            `${skippedCount} rows were skipped and ` +
            `${failedCount} rows failed.`;

        resultImportedCount.textContent =
            String(importedCount);

        resultUpdatedCount.textContent =
            String(updatedCount);

        resultSkippedCount.textContent =
            String(skippedCount);

        resultFailedCount.textContent =
            String(failedCount);

        downloadImportFailuresButton.hidden =
            failedCount === 0;


        resultSection
            .scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

    }


    /* =================================
       EVENT LISTENERS
    ================================= */

    fileInput.addEventListener(
        "change",
        () => {

            setSelectedFile(
                fileInput.files?.[0] ||
                null
            );

        }
    );


    [
        "dragenter",
        "dragover"
    ].forEach(
        eventName => {

            uploadZone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    uploadZone.classList.add(
                        "drag-active"
                    );

                }
            );

        }
    );


    [
        "dragleave",
        "drop"
    ].forEach(
        eventName => {

            uploadZone.addEventListener(
                eventName,
                event => {

                    event.preventDefault();

                    uploadZone.classList.remove(
                        "drag-active"
                    );

                }
            );

        }
    );


    uploadZone.addEventListener(
        "drop",
        event => {

            const file =
                event.dataTransfer
                    ?.files?.[0] ||
                null;


            setSelectedFile(file);

        }
    );


    removeFileButton.addEventListener(
        "click",
        clearSelectedFile
    );


    clearButton.addEventListener(
        "click",
        clearSelectedFile
    );


    validateButton.addEventListener(
        "click",
        validateSelectedFile
    );


    duplicateStrategy.addEventListener(
        "change",
        revalidateCurrentRows
    );


    defaultAssigneeSelect.addEventListener(
        "change",
        revalidateCurrentRows
    );


    previewStatusFilter.addEventListener(
        "change",
        renderPreview
    );


    downloadValidationErrorsButton.addEventListener(
        "click",
        downloadValidationErrors
    );


    importValidLeadsButton.addEventListener(
        "click",
        importValidatedLeads
    );


    importAnotherFileButton.addEventListener(
        "click",
        () => {

            clearSelectedFile();

            uploadZone
                .scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

        }
    );


    downloadImportFailuresButton.addEventListener(
        "click",
        downloadImportFailures
    );


    logoutButton.addEventListener(
        "click",
        async () => {

            const { error } =
                await supabaseClient
                    .auth
                    .signOut();


            if (error) {

                showPageMessage(
                    `Unable to logout: ${error.message}`,
                    "error"
                );

                return;

            }


            window.location.replace(
                "login.html"
            );

        }
    );


    /* =================================
       INITIALISE
    ================================= */

    async function initialiseImportPage() {

        const hasAccess =
            await protectImportPage();


        if (!hasAccess) {
            return;
        }


        try {

            await loadTeamMembers();

        } catch (error) {

            console.error(error);

            showPageMessage(
                "Unable to load active team members. Imported leads can still remain unassigned.",
                "info"
            );

        }

    }


    initialiseImportPage()
        .finally(() => {

            window.finishCrmPageLoading?.();

        });

})();

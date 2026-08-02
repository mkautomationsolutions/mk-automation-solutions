const supabaseClient =
    window.mkSupabase;


const settingsForm =
    document.getElementById(
        "settings-form"
    );

const businessNameInput =
    document.getElementById(
        "business-name"
    );

const adminNameInput =
    document.getElementById(
        "admin-name"
    );

const adminEmailInput =
    document.getElementById(
        "admin-email"
    );

const timezoneInput =
    document.getElementById(
        "timezone"
    );

const followupDaysInput =
    document.getElementById(
        "default-followup-days"
    );

const saveButton =
    document.getElementById(
        "save-settings-btn"
    );

const settingsMessage =
    document.getElementById(
        "settings-message"
    );

const logoutButton =
    document.getElementById(
        "logout-btn"
    );

const headerAdminName =
    document.getElementById(
        "header-admin-name"
    );

const summaryBusinessName =
    document.getElementById(
        "summary-business-name"
    );

const summaryAdminName =
    document.getElementById(
        "summary-admin-name"
    );

const summaryTimezone =
    document.getElementById(
        "summary-timezone"
    );

const summaryFollowupDays =
    document.getElementById(
        "summary-followup-days"
    );

const summaryUpdatedAt =
    document.getElementById(
        "summary-updated-at"
    );


let settingsId = null;


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


function updateSettingsSummary(settings) {

    headerAdminName.textContent =
        settings.admin_name || "Admin";


    summaryBusinessName.textContent =
        settings.business_name || "-";


    summaryAdminName.textContent =
        settings.admin_name || "-";


    summaryTimezone.textContent =
        settings.timezone || "-";


    summaryFollowupDays.textContent =
        `${settings.default_followup_days} days`;


    summaryUpdatedAt.textContent =
        formatDate(
            settings.updated_at
        );

}


function populateSettings(settings) {

    settingsId =
        settings.id;


    businessNameInput.value =
        settings.business_name || "";


    adminNameInput.value =
        settings.admin_name || "";


    adminEmailInput.value =
        settings.admin_email || "";


    timezoneInput.value =
        settings.timezone ||
        "Asia/Kolkata";


    followupDaysInput.value =
        settings.default_followup_days ?? 2;


    updateSettingsSummary(settings);

}


async function protectSettingsPage() {

    const {
        data: { session },
        error
    } =
        await supabaseClient.auth
            .getSession();


    if (error || !session) {

        window.location.replace(
            "login.html?reason=session"
        );

        return false;

    }


    await window.loadAndApplyCrmSettings();


    if (
        window.crmAccess?.canManage !==
        true
    ) {

        window.location.replace(
            "index.html?reason=forbidden"
        );

        return false;

    }


    return true;

}


async function loadSettings() {

    settingsMessage.textContent =
        "Loading settings...";

    settingsMessage.style.color =
        "#2563eb";


    const { data, error } =
        await supabaseClient
            .from("crm_settings")
            .select("*")
            .limit(1)
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to load settings:",
            error
        );


        settingsMessage.textContent =
            `${error.code || "ERROR"}: ${error.message}`;


        settingsMessage.style.color =
            "#dc2626";

        return;

    }


    if (!data) {

        settingsMessage.textContent =
            "No CRM settings row was found.";


        settingsMessage.style.color =
            "#dc2626";

        return;

    }

populateSettings(data);

window.applyCrmSettings(data);

settingsMessage.textContent =
    "Settings updated successfully.";
}


async function saveSettings(event) {

    event.preventDefault();


    if (!settingsId) {

        settingsMessage.textContent =
            "Settings record was not found.";

        settingsMessage.style.color =
            "#dc2626";

        return;

    }


    const defaultFollowupDays =
        Number(
            followupDaysInput.value
        );


    if (
        !Number.isInteger(
            defaultFollowupDays
        ) ||
        defaultFollowupDays < 0 ||
        defaultFollowupDays > 365
    ) {

        settingsMessage.textContent =
            "Default follow-up days must be between 0 and 365.";

        settingsMessage.style.color =
            "#dc2626";

        return;

    }


    saveButton.disabled = true;

    saveButton.textContent =
        "Saving...";


    settingsMessage.textContent =
        "Updating settings...";

    settingsMessage.style.color =
        "#2563eb";


    const { data, error } =
        await supabaseClient
            .from("crm_settings")
            .update({

                business_name:
                    businessNameInput.value
                        .trim(),

                admin_name:
                    adminNameInput.value
                        .trim(),

                admin_email:
                    adminEmailInput.value
                        .trim(),

                timezone:
                    timezoneInput.value,

                default_followup_days:
                    defaultFollowupDays,

                updated_at:
                    new Date()
                        .toISOString()

            })
            .eq(
                "id",
                settingsId
            )
            .select("*")
            .single();


    saveButton.disabled = false;

    saveButton.textContent =
        "Save Settings";


    if (error) {

        console.error(
            "Unable to update settings:",
            error
        );


        settingsMessage.textContent =
            `${error.code || "ERROR"}: ${error.message}`;


        settingsMessage.style.color =
            "#dc2626";

        return;

    }


    populateSettings(data);
    window.applyCrmSettings(data);


    settingsMessage.textContent =
        "Settings updated successfully.";


    settingsMessage.style.color =
        "#047857";

}


settingsForm.addEventListener(
    "submit",
    saveSettings
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


async function initialiseSettings() {

    const isAuthenticated =
        await protectSettingsPage();


    if (!isAuthenticated) {
        return;
    }
    await loadSettings();

}


initialiseSettings()
    .finally(() => {

        window.finishCrmPageLoading?.();

    });
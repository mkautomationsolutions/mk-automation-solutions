if (!window.MK_CONFIG) {

    throw new Error(
        "MK_CONFIG was not loaded. Check config.js."
    );

}


window.mkSupabase =
    supabase.createClient(

        window.MK_CONFIG.SUPABASE_URL,

        window.MK_CONFIG
            .SUPABASE_PUBLISHABLE_KEY

    );


const CRM_SETTINGS_STORAGE_KEY =
    "mk_crm_settings";


window.crmSettings = null;

window.crmAccess = {
    canManage: false,
    currentMember: null,
    sessionUser: null
};


/* ---------------------------------
   HELPERS
---------------------------------- */

function getInitials(name) {

    return String(name || "Admin")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            word =>
                word.charAt(0)
        )
        .join("")
        .toUpperCase();

}


function formatRoleLabel(role) {

    const roleLabels = {
        admin: "Administrator",
        manager: "Manager",
        employee: "Employee"
    };


    return (
        roleLabels[role] ||
        "CRM User"
    );

}



function revealCrmAccessNavigation() {

    document.documentElement
        .classList.remove(
            "crm-access-loading"
        );

}

function revealCrmSettings() {

    document.documentElement
        .classList.remove(
            "crm-settings-loading"
        );

}


/* ---------------------------------
   APPLY SETTINGS
---------------------------------- */

function applyCrmSettings(settings) {

    if (!settings) {

        revealCrmSettings();

        return;

    }


    window.crmSettings =
        settings;


    document
        .querySelectorAll(
            "[data-business-name]"
        )
        .forEach((element) => {

            element.textContent =
                settings.business_name ||
                "MK Automation Solutions";

        });


    document
        .querySelectorAll(
            "[data-admin-name]"
        )
        .forEach((element) => {

            element.textContent =
                settings.admin_name ||
                "Administrator";

        });


    document
        .querySelectorAll(
            "[data-admin-initials]"
        )
        .forEach((element) => {

            element.textContent =
                getInitials(
                    settings.admin_name
                );

        });


    try {

        localStorage.setItem(
            CRM_SETTINGS_STORAGE_KEY,
            JSON.stringify(settings)
        );

    } catch (error) {

        console.warn(
            "Unable to cache CRM settings:",
            error
        );

    }


    revealCrmSettings();

}


function applyCurrentUserProfile(
    member,
    sessionUser
) {

    const displayName =
        member?.full_name ||
        sessionUser?.user_metadata?.full_name ||
        sessionUser?.email ||
        window.crmSettings?.admin_name ||
        "CRM User";


    const roleLabel =
        formatRoleLabel(
            member?.role
        );


    document
        .querySelectorAll(
            "[data-current-user-name]"
        )
        .forEach((element) => {

            element.textContent =
                displayName;

        });


    document
        .querySelectorAll(
            "[data-current-user-initials]"
        )
        .forEach((element) => {

            element.textContent =
                getInitials(
                    displayName
                );

        });


    document
        .querySelectorAll(
            "[data-current-user-role]"
        )
        .forEach((element) => {

            element.textContent =
                roleLabel;

        });

}


function applyManagementVisibility(
    canManage
) {

    document
        .querySelectorAll(
            "[data-manage-only]"
        )
        .forEach((element) => {

            element.hidden =
                !canManage;

        });


    revealCrmAccessNavigation();

}


/* ---------------------------------
   LOAD CACHED SETTINGS IMMEDIATELY
---------------------------------- */

function applyCachedCrmSettings() {

    try {

        const cachedSettings =
            localStorage.getItem(
                CRM_SETTINGS_STORAGE_KEY
            );


        if (!cachedSettings) {
            return false;
        }


        const parsedSettings =
            JSON.parse(
                cachedSettings
            );


        applyCrmSettings(
            parsedSettings
        );


        return true;

    } catch (error) {

        console.warn(
            "Unable to read cached CRM settings:",
            error
        );


        return false;

    }

}


/* ---------------------------------
   LOAD CURRENT ACCESS CONTEXT
---------------------------------- */

async function loadCrmAccessContext() {

    const {
        data: sessionData,
        error: sessionError
    } =
        await window.mkSupabase
            .auth
            .getSession();


    const session =
        sessionData?.session ||
        null;


    if (
        sessionError ||
        !session
    ) {

        window.crmAccess = {
            canManage: false,
            currentMember: null,
            sessionUser: null
        };


        applyManagementVisibility(
            false
        );


        return window.crmAccess;

    }


    const [
        permissionResult,
        memberResult
    ] =
        await Promise.all([

            window.mkSupabase
                .rpc(
                    "can_manage_crm"
                ),

            window.mkSupabase
                .from(
                    "team_members"
                )
                .select(`
                    id,
                    auth_user_id,
                    full_name,
                    email,
                    phone,
                    role,
                    status
                `)
                .eq(
                    "auth_user_id",
                    session.user.id
                )
                .maybeSingle()

        ]);


    if (permissionResult.error) {

        console.warn(
            "Unable to determine CRM management access:",
            permissionResult.error
        );

    }


    if (memberResult.error) {

        console.warn(
            "Unable to load current team member:",
            memberResult.error
        );

    }


    window.crmAccess = {

        canManage:
            permissionResult.data === true,

        currentMember:
            memberResult.data ||
            null,

        sessionUser:
            session.user

    };


    applyManagementVisibility(
        window.crmAccess.canManage
    );


    applyCurrentUserProfile(
        window.crmAccess.currentMember,
        session.user
    );


    return window.crmAccess;

}


/* ---------------------------------
   LOAD SETTINGS FROM SUPABASE
---------------------------------- */

async function loadAndApplyCrmSettings() {

    const { data, error } =
        await window.mkSupabase
            .from("crm_settings")
            .select(`
                id,
                business_name,
                admin_name,
                admin_email,
                timezone,
                default_followup_days,
                updated_at
            `)
            .order(
                "updated_at",
                {
                    ascending: false
                }
            )
            .limit(1)
            .maybeSingle();


    if (error) {

        console.error(
            "Unable to load CRM settings:",
            error
        );

    } else if (!data) {

        console.warn(
            "CRM settings row was not found."
        );

    } else {

        applyCrmSettings(data);

    }


    await loadCrmAccessContext();


    revealCrmSettings();


    return data || null;

}




/* ---------------------------------
   PAGE DATA LOADING LIFECYCLE
---------------------------------- */

let crmPageLoadingSafetyTimer =
    null;


function finishCrmPageLoading() {

    document.documentElement
        .classList.remove(
            "crm-data-loading"
        );


    if (crmPageLoadingSafetyTimer) {

        window.clearTimeout(
            crmPageLoadingSafetyTimer
        );

        crmPageLoadingSafetyTimer =
            null;

    }

}


window.finishCrmPageLoading =
    finishCrmPageLoading;


if (
    document.documentElement
        .classList.contains(
            "crm-data-loading"
        )
) {

    crmPageLoadingSafetyTimer =
        window.setTimeout(
            finishCrmPageLoading,
            15000
        );

}


/* ---------------------------------
   EXPOSE SHARED FUNCTIONS
---------------------------------- */

window.applyCrmSettings =
    applyCrmSettings;


window.loadAndApplyCrmSettings =
    loadAndApplyCrmSettings;


window.loadCrmAccessContext =
    loadCrmAccessContext;


window.getCrmInitials =
    getInitials;


/* Apply saved settings before API call */

applyCachedCrmSettings();

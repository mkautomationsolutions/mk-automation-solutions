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

    const sessionLoading =
        document.getElementById(
            "invite-session-loading"
        );

    const invalidState =
        document.getElementById(
            "invite-invalid-state"
        );

    const invalidMessage =
        document.getElementById(
            "invite-invalid-message"
        );

    const acceptInviteForm =
        document.getElementById(
            "accept-invite-form"
        );

    const invitedUserEmail =
        document.getElementById(
            "invited-user-email"
        );

    const passwordInput =
        document.getElementById(
            "invite-password"
        );

    const confirmPasswordInput =
        document.getElementById(
            "invite-confirm-password"
        );

    const ruleLength =
        document.getElementById(
            "rule-length"
        );

    const ruleLetter =
        document.getElementById(
            "rule-letter"
        );

    const ruleNumber =
        document.getElementById(
            "rule-number"
        );

    const ruleMatch =
        document.getElementById(
            "rule-match"
        );

    const formMessage =
        document.getElementById(
            "invite-form-message"
        );

    const createPasswordButton =
        document.getElementById(
            "create-password-btn"
        );

    const successState =
        document.getElementById(
            "invite-success-state"
        );

    const passwordToggleButtons =
        document.querySelectorAll(
            "[data-password-toggle]"
        );


    /* =================================
       STATE
    ================================= */

    let activeSession =
        null;


    /* =================================
       BASIC HELPERS
    ================================= */

    function getUrlParameters() {

        const queryParameters =
            new URLSearchParams(
                window.location.search
            );


        const hashParameters =
            new URLSearchParams(
                window.location.hash
                    .replace(/^#/, "")
            );


        return {
            queryParameters,
            hashParameters
        };

    }


    function getInvitationUrlError() {

        const {
            queryParameters,
            hashParameters
        } =
            getUrlParameters();


        return (
            queryParameters.get(
                "error_description"
            ) ||
            hashParameters.get(
                "error_description"
            ) ||
            queryParameters.get(
                "error"
            ) ||
            hashParameters.get(
                "error"
            ) ||
            ""
        );

    }


    function hasInvitationCallback() {

        const {
            queryParameters,
            hashParameters
        } =
            getUrlParameters();


        return Boolean(

            queryParameters.get("code") ||

            queryParameters.get(
                "token_hash"
            ) ||

            queryParameters.get("type") ||

            hashParameters.get(
                "access_token"
            ) ||

            hashParameters.get(
                "refresh_token"
            ) ||

            hashParameters.get("type")

        );

    }


    function setInviteFlowMarker() {

        try {

            window.sessionStorage.setItem(
                "mk-crm-invite-flow",
                "active"
            );

        } catch (error) {

            console.warn(
                "Unable to save invite marker:",
                error
            );

        }

    }


    function hasInviteFlowMarker() {

        try {

            return (
                window.sessionStorage.getItem(
                    "mk-crm-invite-flow"
                ) === "active"
            );

        } catch {

            return false;

        }

    }


    function clearInviteFlowMarker() {

        try {

            window.sessionStorage.removeItem(
                "mk-crm-invite-flow"
            );

        } catch (error) {

            console.warn(
                "Unable to remove invite marker:",
                error
            );

        }

    }


    function cleanAuthenticationUrl() {

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    }


    /* =================================
       PAGE STATES
    ================================= */

    function hideAllInviteStates() {

        sessionLoading.hidden =
            true;

        invalidState.hidden =
            true;

        acceptInviteForm.hidden =
            true;

        successState.hidden =
            true;

    }


    function showLoadingState(
        message =
            "Verifying your invitation..."
    ) {

        hideAllInviteStates();

        sessionLoading.hidden =
            false;

        sessionLoading.textContent =
            message;

    }


    function showInvalidState(
        message
    ) {

        hideAllInviteStates();

        invalidMessage.textContent =
            message;

        invalidState.hidden =
            false;

    }


    function showPasswordForm(
        session
    ) {

        hideAllInviteStates();

        invitedUserEmail.textContent =
            session.user.email ||
            "Invited CRM account";

        acceptInviteForm.hidden =
            false;

        passwordInput.focus();

    }


    function showSuccessState() {

        hideAllInviteStates();

        successState.hidden =
            false;

    }


    /* =================================
       FORM MESSAGE
    ================================= */

    function showFormMessage(
        message,
        type = "info"
    ) {

        formMessage.hidden =
            false;

        formMessage.textContent =
            message;

        formMessage.className =
            `invite-form-message ${type}`;

    }


    function clearFormMessage() {

        formMessage.hidden =
            true;

        formMessage.textContent =
            "";

        formMessage.className =
            "invite-form-message";

    }


    /* =================================
       PASSWORD RULES
    ================================= */

    function getPasswordRules() {

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        return {

            hasMinimumLength:
                password.length >= 8,

            hasLetter:
                /[a-zA-Z]/.test(
                    password
                ),

            hasNumber:
                /\d/.test(
                    password
                ),

            passwordsMatch:
                password.length > 0 &&
                password ===
                    confirmPassword

        };

    }


    function updateRuleClass(
        element,
        isValid
    ) {

        element.classList.toggle(
            "valid",
            isValid
        );

    }


    function updatePasswordRules() {

        const rules =
            getPasswordRules();


        updateRuleClass(
            ruleLength,
            rules.hasMinimumLength
        );

        updateRuleClass(
            ruleLetter,
            rules.hasLetter
        );

        updateRuleClass(
            ruleNumber,
            rules.hasNumber
        );

        updateRuleClass(
            ruleMatch,
            rules.passwordsMatch
        );


        return rules;

    }


    function validatePasswordForm() {

        const rules =
            updatePasswordRules();


        if (!rules.hasMinimumLength) {

            return (
                "Password must contain at least " +
                "8 characters."
            );

        }


        if (!rules.hasLetter) {

            return (
                "Password must contain at least " +
                "one letter."
            );

        }


        if (!rules.hasNumber) {

            return (
                "Password must contain at least " +
                "one number."
            );

        }


        if (!rules.passwordsMatch) {

            return (
                "Password and confirm password " +
                "must match."
            );

        }


        return "";

    }


    /* =================================
       PASSWORD VISIBILITY
    ================================= */

    function togglePasswordVisibility(
        button
    ) {

        const inputId =
            button.dataset
                .passwordToggle;


        const input =
            document.getElementById(
                inputId
            );


        if (!input) {
            return;
        }


        const passwordIsVisible =
            input.type === "text";


        input.type =
            passwordIsVisible
                ? "password"
                : "text";


        button.textContent =
            passwordIsVisible
                ? "Show"
                : "Hide";


        button.setAttribute(
            "aria-label",
            passwordIsVisible
                ? "Show password"
                : "Hide password"
        );

    }


    /* =================================
       BUTTON BUSY STATE
    ================================= */

    function setPasswordFormBusy(
        isBusy
    ) {

        passwordInput.disabled =
            isBusy;

        confirmPasswordInput.disabled =
            isBusy;

        createPasswordButton.disabled =
            isBusy;


        passwordToggleButtons.forEach(
            button => {

                button.disabled =
                    isBusy;

            }
        );


        createPasswordButton.textContent =
            isBusy
                ? "Creating Account..."
                : "Create Password & Continue";

    }


    /* =================================
       MANUAL HASH SESSION FALLBACK
    ================================= */

    async function tryHashSessionFallback() {

        const {
            hashParameters
        } =
            getUrlParameters();


        const accessToken =
            hashParameters.get(
                "access_token"
            );


        const refreshToken =
            hashParameters.get(
                "refresh_token"
            );


        if (
            !accessToken ||
            !refreshToken
        ) {

            return {
                session: null,
                error: null
            };

        }


        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .setSession({

                    access_token:
                        accessToken,

                    refresh_token:
                        refreshToken

                });


        return {
            session:
                data.session || null,

            error
        };

    }


    /* =================================
       WAIT FOR AUTH SESSION
    ================================= */

    async function waitForInvitationSession() {

        const {
            data: initialData,
            error: initialError
        } =
            await supabaseClient
                .auth
                .getSession();


        if (initialError) {

            return {
                session: null,
                error: initialError
            };

        }


        if (initialData.session) {

            return {
                session:
                    initialData.session,

                error: null
            };

        }


        const fallbackResult =
            await tryHashSessionFallback();


        if (
            fallbackResult.error ||
            fallbackResult.session
        ) {

            return fallbackResult;

        }


        return new Promise(
            resolve => {

                let completed =
                    false;

                let timeoutId =
                    null;

                let subscription =
                    null;


                function finish(
                    result
                ) {

                    if (completed) {
                        return;
                    }


                    completed =
                        true;


                    if (timeoutId) {

                        window.clearTimeout(
                            timeoutId
                        );

                    }


                    if (subscription) {

                        subscription
                            .unsubscribe();

                    }


                    resolve(result);

                }


                const {
                    data: listenerData
                } =
                    supabaseClient
                        .auth
                        .onAuthStateChange(
                            (
                                event,
                                session
                            ) => {

                                if (session) {

                                    finish({
                                        session,
                                        error: null
                                    });

                                }

                            }
                        );


                subscription =
                    listenerData
                        .subscription;


                timeoutId =
                    window.setTimeout(
                        async () => {

                            const {
                                data,
                                error
                            } =
                                await supabaseClient
                                    .auth
                                    .getSession();


                            finish({

                                session:
                                    data.session ||
                                    null,

                                error

                            });

                        },
                        3000
                    );

            }
        );

    }


    /* =================================
       CREATE PASSWORD + CLAIM INVITE
    ================================= */

    async function completeInvitation(
        event
    ) {

        event.preventDefault();

        clearFormMessage();


        const validationError =
            validatePasswordForm();


        if (validationError) {

            showFormMessage(
                validationError,
                "error"
            );

            return;

        }


        if (
            !activeSession ||
            !activeSession.user
        ) {

            showFormMessage(
                "Your invitation session is unavailable. " +
                "Please reopen the invitation email.",
                "error"
            );

            return;

        }


        setPasswordFormBusy(
            true
        );


        showFormMessage(
            "Creating your secure CRM password...",
            "info"
        );


        const {
            data: updateData,
            error: updateError
        } =
            await supabaseClient
                .auth
                .updateUser({

                    password:
                        passwordInput.value

                });


        if (updateError) {

            console.error(
                "Unable to create password:",
                updateError
            );


            showFormMessage(
                `Unable to create password: ${
                    updateError.message
                }`,
                "error"
            );


            setPasswordFormBusy(
                false
            );

            return;

        }


        showFormMessage(
            "Password created. Connecting your CRM team account...",
            "info"
        );


        const {
            data: claimData,
            error: claimError
        } =
            await supabaseClient
                .rpc(
                    "claim_team_member_invitation"
                );


        if (claimError) {

            console.error(
                "Unable to connect team invitation:",
                claimError
            );


            showFormMessage(
                "Your password was created, but the CRM team " +
                "invitation could not be connected. " +
                `Details: ${claimError.message}`,
                "error"
            );


            setPasswordFormBusy(
                false
            );

            return;

        }


        const claimedMember =
            Array.isArray(claimData)
                ? claimData[0]
                : claimData;


        if (!claimedMember) {

            showFormMessage(
                "No matching CRM team invitation was found.",
                "error"
            );


            setPasswordFormBusy(
                false
            );

            return;

        }


        activeSession = {

            ...activeSession,

            user:
                updateData.user ||
                activeSession.user

        };


        clearInviteFlowMarker();

        clearFormMessage();

        showSuccessState();


        window.setTimeout(
            () => {

                window.location.href =
                    "index.html";

            },
            2200
        );

    }


    /* =================================
       INITIALIZE INVITATION
    ================================= */
async function initialiseInvitationPage() {

    showLoadingState(
        "Verifying your invitation..."
    );


    if (!supabaseClient) {

        showInvalidState(
            "CRM authentication service is unavailable. " +
            "Please contact the administrator."
        );

        return;

    }


    if (
        typeof window
            .loadAndApplyCrmSettings ===
        "function"
    ) {

        try {

            await window
                .loadAndApplyCrmSettings();

        } catch (error) {

            console.warn(
                "Unable to apply CRM settings:",
                error
            );

        }

    }


    const invitationError =
        getInvitationUrlError();


    if (invitationError) {

        clearInviteFlowMarker();


        showInvalidState(
            invitationError
        );

        return;

    }


    /*
    The Supabase client may already have processed
    the callback and removed the authentication
    parameters from the URL.

    Therefore, do not reject the page only because
    code/token parameters are no longer visible.
    */

    if (
        hasInvitationCallback()
    ) {

        setInviteFlowMarker();

    }


    const {
        session,
        error
    } =
        await waitForInvitationSession();


    if (
        error ||
        !session ||
        !session.user
    ) {

        console.error(
            "Invitation session error:",
            error
        );


        clearInviteFlowMarker();


        showInvalidState(
            error?.message ||
            "This invitation link is invalid, expired, " +
            "or has already been used. Ask the administrator " +
            "to send a new invitation."
        );

        return;

    }


    if (!session.user.email) {

        showInvalidState(
            "The invited account email is unavailable. " +
            "Please contact the administrator."
        );

        return;

    }


    activeSession =
        session;


    setInviteFlowMarker();


    cleanAuthenticationUrl();


    showPasswordForm(
        session
    );


    updatePasswordRules();

}


    /* =================================
       EVENT LISTENERS
    ================================= */

    passwordInput.addEventListener(
        "input",
        updatePasswordRules
    );


    confirmPasswordInput.addEventListener(
        "input",
        updatePasswordRules
    );


    passwordToggleButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    togglePasswordVisibility(
                        button
                    );

                }
            );

        }
    );


    acceptInviteForm.addEventListener(
        "submit",
        completeInvitation
    );


    /* =================================
       START
    ================================= */

    initialiseInvitationPage();

})();
const supabaseClient =
    window.mkSupabase;
const loginForm =
    document.getElementById("login-form");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginStatus =
    document.getElementById("login-status");

const submitButton =
    loginForm.querySelector("button");


function showLoginReason() {

    const reason =
        new URLSearchParams(
            window.location.search
        ).get("reason");


    const messages = {
        idle:
            "Your session expired due to inactivity. Please sign in again.",
        session:
            "Please sign in to continue to the CRM.",
        "signed-out":
            "You have been signed out securely.",
        inactive:
            "Your CRM account is inactive. Contact the Administrator.",
        configuration:
            "CRM configuration could not be loaded.",
        "security-error":
            "Security verification failed. Please sign in again."
    };


    if (messages[reason]) {

        loginStatus.textContent =
            messages[reason];

    }

}


showLoginReason();


async function redirectIfAlreadyLoggedIn() {

    const {
        data: { session }
    } =
        await supabaseClient.auth.getSession();

    if (session) {

        window.location.href =
            "index.html";

    }

}


loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        loginStatus.textContent =
            "Signing in...";

        submitButton.disabled = true;


        const { error } =
            await supabaseClient.auth
                .signInWithPassword({

                    email:
                        emailInput.value.trim(),

                    password:
                        passwordInput.value

                });


        if (error) {

            console.error(error);

            loginStatus.textContent =
                "Invalid email or password.";

            submitButton.disabled = false;

            return;

        }


        loginStatus.textContent =
            "Login successful.";

        window.location.href =
            "index.html";

    }
);


redirectIfAlreadyLoggedIn();
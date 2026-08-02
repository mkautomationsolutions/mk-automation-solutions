(() => {
    "use strict";

    if (window.crmSecurityReady) {
        return;
    }

    const supabaseClient = window.mkSupabase;
    const config = window.MK_CONFIG || {};

    const idleMinutes = Math.max(
        10,
        Number(config.SESSION_IDLE_MINUTES) || 60
    );

    const warningMinutes = Math.min(
        Math.max(1, Number(config.SESSION_WARNING_MINUTES) || 5),
        Math.max(1, idleMinutes - 1)
    );

    const idleMilliseconds = idleMinutes * 60 * 1000;
    const warningMilliseconds = warningMinutes * 60 * 1000;

    const LAST_ACTIVITY_KEY = "mk_crm_last_activity_at";
    const SIGNED_OUT_KEY = "mk_crm_signed_out_at";

    let warningModal = null;
    let warningText = null;
    let checkTimer = null;
    let activityWriteLocked = false;
    let isSigningOut = false;

    function addNoCacheHints() {
        const definitions = [
            ["Cache-Control", "no-store, no-cache, must-revalidate"],
            ["Pragma", "no-cache"],
            ["Expires", "0"]
        ];

        definitions.forEach(([httpEquiv, content]) => {
            const existing = document.head.querySelector(
                `meta[http-equiv="${httpEquiv}"]`
            );

            if (existing) {
                existing.setAttribute("content", content);
                return;
            }

            const meta = document.createElement("meta");
            meta.setAttribute("http-equiv", httpEquiv);
            meta.setAttribute("content", content);
            document.head.appendChild(meta);
        });
    }

    function hardenExternalLinks() {
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            const relValues = new Set(
                String(link.getAttribute("rel") || "")
                    .split(/\s+/)
                    .filter(Boolean)
            );

            relValues.add("noopener");
            relValues.add("noreferrer");
            link.setAttribute("rel", [...relValues].join(" "));
        });
    }

    function buildLoginUrl(reason) {
        const url = new URL("login.html", window.location.href);

        if (reason) {
            url.searchParams.set("reason", reason);
        }

        return url.href;
    }

    function redirectToLogin(reason) {
        window.location.replace(buildLoginUrl(reason));
    }

    function readLastActivity() {
        const stored = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
        return Number.isFinite(stored) && stored > 0 ? stored : Date.now();
    }

    function hideWarningModal() {
        if (warningModal) {
            warningModal.hidden = true;
        }
    }

    function markActivity(force = false) {
        const now = Date.now();
        const previous = readLastActivity();

        if (!force && now - previous < 15000) {
            return;
        }

        localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
        hideWarningModal();
    }

    function formatRemaining(milliseconds) {
        const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}:${String(seconds).padStart(2, "0")}`;
    }

    function createWarningModal() {
        if (warningModal) {
            return warningModal;
        }

        const overlay = document.createElement("div");
        overlay.className = "crm-security-overlay";
        overlay.hidden = true;
        overlay.innerHTML = `
            <section class="crm-security-dialog" role="dialog" aria-modal="true" aria-labelledby="crm-security-title">
                <div class="crm-security-icon" aria-hidden="true">🔒</div>
                <div>
                    <p class="crm-security-label">SESSION SECURITY</p>
                    <h2 id="crm-security-title">Your session will expire soon</h2>
                    <p class="crm-security-copy">
                        No CRM activity was detected. You will be signed out in
                        <strong id="crm-security-countdown">5:00</strong>.
                    </p>
                </div>
                <div class="crm-security-actions">
                    <button type="button" class="crm-security-secondary" id="crm-security-logout-now">Logout now</button>
                    <button type="button" class="crm-security-primary" id="crm-security-stay-signed-in">Stay signed in</button>
                </div>
            </section>
        `;

        document.body.appendChild(overlay);
        warningModal = overlay;
        warningText = overlay.querySelector("#crm-security-countdown");

        overlay.querySelector("#crm-security-stay-signed-in")
            .addEventListener("click", () => {
                markActivity(true);
                hideWarningModal();
            });

        overlay.querySelector("#crm-security-logout-now")
            .addEventListener("click", () => {
                secureSignOut("signed-out");
            });

        return overlay;
    }

    function showWarningModal(remaining) {
        const modal = createWarningModal();
        warningText.textContent = formatRemaining(remaining);
        modal.hidden = false;
    }

    async function secureSignOut(reason = "signed-out") {
        if (isSigningOut) {
            return;
        }

        isSigningOut = true;

        try {
            localStorage.setItem(SIGNED_OUT_KEY, String(Date.now()));
            localStorage.removeItem(LAST_ACTIVITY_KEY);
            await supabaseClient?.auth?.signOut();
        } catch (error) {
            console.warn("CRM sign-out encountered an error:", error);
        } finally {
            redirectToLogin(reason);
        }
    }

    window.crmSecureSignOut = secureSignOut;

    async function verifyAuthenticatedAccess() {
        if (!supabaseClient) {
            redirectToLogin("configuration");
            return null;
        }

        const { data, error } = await supabaseClient.auth.getSession();
        const session = data?.session || null;

        if (error || !session) {
            redirectToLogin("session");
            return null;
        }

        let access = window.crmAccess;

        if (typeof window.loadCrmAccessContext === "function") {
            access = await window.loadCrmAccessContext();
        }

        const member = access?.currentMember || null;

        if (member && member.status && member.status !== "active") {
            await secureSignOut("inactive");
            return null;
        }

        const requiredAccess = document.body?.dataset?.crmAccess || "authenticated";

        if (requiredAccess === "manage" && access?.canManage !== true) {
            window.location.replace("index.html?reason=forbidden");
            return null;
        }

        document.documentElement.classList.add("crm-security-ready");
        document.body.dataset.crmSecurityReady = "true";
        markActivity(true);

        return {
            session,
            access,
            idleMinutes,
            warningMinutes
        };
    }

    function checkIdleState() {
        if (document.body?.dataset?.crmSecurityReady !== "true") {
            return;
        }

        const elapsed = Date.now() - readLastActivity();
        const remaining = idleMilliseconds - elapsed;

        if (remaining <= 0) {
            secureSignOut("idle");
            return;
        }

        if (remaining <= warningMilliseconds) {
            showWarningModal(remaining);
        } else {
            hideWarningModal();
        }
    }

    function registerActivityTracking() {
        const events = ["pointerdown", "keydown", "scroll", "touchstart"];

        events.forEach(eventName => {
            window.addEventListener(
                eventName,
                () => {
                    if (activityWriteLocked) {
                        return;
                    }

                    activityWriteLocked = true;
                    markActivity();

                    window.setTimeout(() => {
                        activityWriteLocked = false;
                    }, 1000);
                },
                { passive: true }
            );
        });

        window.addEventListener("storage", event => {
            if (event.key === SIGNED_OUT_KEY && event.newValue) {
                redirectToLogin("signed-out");
            }

            if (event.key === LAST_ACTIVITY_KEY && event.newValue) {
                hideWarningModal();
            }
        });

        supabaseClient.auth.onAuthStateChange(event => {
            if (event === "SIGNED_OUT" && !isSigningOut) {
                localStorage.setItem(SIGNED_OUT_KEY, String(Date.now()));
                redirectToLogin("signed-out");
            }
        });

        checkTimer = window.setInterval(checkIdleState, 1000);

        window.addEventListener("beforeunload", () => {
            if (checkTimer) {
                window.clearInterval(checkTimer);
            }
        });
    }

    addNoCacheHints();
    hardenExternalLinks();
    registerActivityTracking();

    window.crmSecurity = Object.freeze({
        idleMinutes,
        warningMinutes,
        lastActivityStorageKey: LAST_ACTIVITY_KEY
    });

    window.crmSecurityReady = verifyAuthenticatedAccess().catch(error => {
        console.error("CRM security initialisation failed:", error);
        redirectToLogin("security-error");
        return null;
    });
})();

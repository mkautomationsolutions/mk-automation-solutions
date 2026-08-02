(() => {
    "use strict";

    const menuToggle = document.getElementById("menu-toggle");
    const mainNav = document.querySelector(".main-nav");
    const navMenu = document.getElementById("nav-menu");

    function setMenuState(isOpen) {
        if (!menuToggle || !mainNav) {
            return;
        }

        mainNav.classList.toggle("open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
    }

    menuToggle?.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
        setMenuState(!isOpen);
    });

    navMenu?.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenuState(false));
    });

    document.addEventListener("click", (event) => {
        if (!mainNav?.classList.contains("open")) {
            return;
        }

        if (!mainNav.contains(event.target) && !menuToggle?.contains(event.target)) {
            setMenuState(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setMenuState(false);
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 860) {
            setMenuState(false);
        }
    });

    const year = document.getElementById("current-year");
    if (year) {
        year.textContent = String(new Date().getFullYear());
    }

    const contactForm = document.getElementById("contact-form");
    const formStatus = document.getElementById("form-status");
    const submitButton = document.getElementById("submit-button");

    if (!contactForm || !formStatus || !submitButton) {
        return;
    }

    const config = window.MK_SITE_CONFIG || {};
    const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    const webhookUrl = isLocal
        ? config.localContactWebhookUrl
        : config.productionContactWebhookUrl;

    function showStatus(message, type = "info") {
        formStatus.textContent = message;
        formStatus.className = `form-status ${type}`;
    }

    function clearValidation() {
        contactForm
            .querySelectorAll(".invalid")
            .forEach((field) => field.classList.remove("invalid"));
    }

    function validateForm() {
        clearValidation();
        const requiredFields = contactForm.querySelectorAll("[required]");
        let firstInvalid = null;

        requiredFields.forEach((field) => {
            if (!field.checkValidity()) {
                field.classList.add("invalid");
                firstInvalid ||= field;
            }
        });

        firstInvalid?.focus();
        return !firstInvalid;
    }

    function setSubmitting(isSubmitting) {
        submitButton.disabled = isSubmitting;
        submitButton.innerHTML = isSubmitting
            ? "Sending request…"
            : 'Send Request <span aria-hidden="true">→</span>';
    }

    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (document.getElementById("website-field")?.value) {
            contactForm.reset();
            showStatus("Thank you. Your request has been received.", "success");
            return;
        }

        if (!validateForm()) {
            showStatus("Please complete the required fields correctly.", "error");
            return;
        }

        if (!webhookUrl) {
            const email = config.contactEmail || "mkautomationsol.ai@gmail.com";
            showStatus(
                `The online workflow is being connected. Please email your requirement to ${email}.`,
                "error"
            );
            return;
        }

        const payload = {
            name: document.getElementById("name").value.trim(),
            email: document.getElementById("email").value.trim(),
            phone: document.getElementById("phone").value.trim(),
            company: document.getElementById("company").value.trim(),
            service: document.getElementById("service").value,
            message: document.getElementById("message").value.trim(),
            lead_source: "website",
            source: "website",
            duplicate_mode: "skip",
            submitted_page: window.location.href,
            submitted_at: new Date().toISOString()
        };

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 20000);

        setSubmitting(true);
        showStatus("Sending your request…", "info");

        try {
            const response = await fetch(webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            const responseText = await response.text();
            let responseData = null;

            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch {
                responseData = null;
            }

            if (!response.ok || responseData?.success === false) {
                throw new Error(responseData?.message || "Request failed");
            }

            contactForm.reset();
            clearValidation();
            showStatus(
                "Thank you. Your requirement was submitted successfully. We will contact you soon.",
                "success"
            );
        } catch (error) {
            console.error("Contact form submission failed:", error);
            const message = error?.name === "AbortError"
                ? "The request timed out. Please try again or email us directly."
                : "We could not send the request. Please try again or email us directly.";
            showStatus(message, "error");
        } finally {
            window.clearTimeout(timeoutId);
            setSubmitting(false);
        }
    });
})();

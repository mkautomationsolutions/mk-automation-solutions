(() => {
    "use strict";

    const config = window.MK_SITE_CONFIG || {};

    function setText(selector, value) {
        document.querySelectorAll(selector).forEach((element) => {
            if (value) {
                element.textContent = value;
                element.hidden = false;
            }
        });
    }

    function setLink(selector, value) {
        document.querySelectorAll(selector).forEach((element) => {
            if (value) {
                element.href = value;
                element.hidden = false;
            }
        });
    }

    setText("[data-config-email-text]", config.contactEmail);
    setLink("[data-config-email-link]", config.contactEmail ? `mailto:${config.contactEmail}` : "");

    if (config.contactPhoneDisplay && config.contactPhoneHref) {
        setText("[data-config-phone-text]", config.contactPhoneDisplay);
        setLink("[data-config-phone-link]", config.contactPhoneHref);
        document.querySelectorAll("[data-config-phone-row]").forEach((element) => {
            element.hidden = false;
        });
    }

    if (config.businessAddress) {
        setText("[data-config-address-text]", config.businessAddress);
        document.querySelectorAll("[data-config-address-row]").forEach((element) => {
            element.hidden = false;
        });
    }

    const optionalLinks = [
        ["[data-config-whatsapp]", config.whatsappUrl],
        ["[data-config-instagram]", config.instagramUrl],
        ["[data-config-linkedin]", config.linkedinUrl],
        ["[data-config-facebook]", config.facebookUrl],
        ["[data-config-youtube]", config.youtubeUrl],
        ["[data-config-app]", config.appUrl],
        ["[data-config-crm]", config.crmUrl]
    ];

    let hasSocialLink = false;
    optionalLinks.forEach(([selector, value]) => {
        document.querySelectorAll(selector).forEach((element) => {
            if (value) {
                element.href = value;
                element.hidden = false;
                if (selector.includes("whatsapp") || selector.includes("instagram") || selector.includes("linkedin") || selector.includes("facebook") || selector.includes("youtube")) {
                    hasSocialLink = true;
                }
            }
        });
    });

    if (hasSocialLink) {
        document.querySelectorAll("[data-social-links]").forEach((element) => {
            element.hidden = false;
        });
    }

    const serviceSelect = document.getElementById("service");
    const messageField = document.getElementById("message");

    document.querySelectorAll("[data-prefill-service]").forEach((link) => {
        link.addEventListener("click", () => {
            const service = link.dataset.prefillService;
            const message = link.dataset.prefillMessage;

            window.setTimeout(() => {
                if (serviceSelect && service) {
                    serviceSelect.value = service;
                    serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
                }

                if (messageField && message && !messageField.value.trim()) {
                    messageField.value = message;
                }
            }, 150);
        });
    });

    const lightbox = document.getElementById("project-lightbox");
    const lightboxImage = document.getElementById("project-lightbox-image");
    const lightboxCaption = document.getElementById("project-lightbox-caption");
    const lightboxClose = document.getElementById("project-lightbox-close");
    let lastFocusedElement = null;

    function closeLightbox() {
        if (!lightbox || lightbox.hidden) {
            return;
        }

        lightbox.hidden = true;
        document.body.classList.remove("lightbox-open");
        lightboxImage?.removeAttribute("src");
        lastFocusedElement?.focus();
    }

    document.querySelectorAll("[data-lightbox-src]").forEach((trigger) => {
        trigger.addEventListener("click", () => {
            if (!lightbox || !lightboxImage) {
                return;
            }

            lastFocusedElement = trigger;
            lightboxImage.src = trigger.dataset.lightboxSrc;
            lightboxImage.alt = trigger.dataset.lightboxAlt || "Project preview";
            if (lightboxCaption) {
                lightboxCaption.textContent = trigger.dataset.lightboxCaption || "";
            }

            lightbox.hidden = false;
            document.body.classList.add("lightbox-open");
            lightboxClose?.focus();
        });
    });

    lightboxClose?.addEventListener("click", closeLightbox);
    lightbox?.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeLightbox();
        }
    });
})();

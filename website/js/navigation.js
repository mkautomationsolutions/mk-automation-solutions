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

})();

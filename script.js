/* Delta Companies: Construction — shared site JS */

document.addEventListener("DOMContentLoaded", () => {
  // Legacy deep links — both projects used to open in the Projects page
  // modal via these hashes; each now lives on its own case-study page.
  if (location.hash === "#full-interior-transformation") {
    location.replace("full-interior-transformation.html");
    return;
  }
  if (location.hash === "#destroyed-property-restored") {
    location.replace("destroyed-property-restored.html");
    return;
  }

  // Dynamic copyright year (never goes stale)
  document.querySelectorAll(".js-year").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const linksWrap = document.querySelector(".nav-links-wrap");
  if (toggle && linksWrap) {
    toggle.addEventListener("click", () => {
      const open = linksWrap.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    linksWrap.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        linksWrap.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Nav bar scroll state (subtle glass -> solid transition)
  const siteNav = document.querySelector(".site-nav");
  if (siteNav) {
    const updateNavScrollState = () => {
      siteNav.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    updateNavScrollState();
    window.addEventListener("scroll", updateNavScrollState, { passive: true });
  }

  // Before/after drag sliders — initializes any [data-ba-slider] found
  // within `root` (defaults to the whole document). Re-callable so
  // dynamically-injected sliders (e.g. inside the project detail modal)
  // get wired up too.
  const initBaSliders = (root = document) => {
    root.querySelectorAll("[data-ba-slider]:not([data-ba-ready])").forEach((slider) => {
      slider.setAttribute("data-ba-ready", "true");
      const beforeImg = slider.querySelector(".ba-slider-before img");
      const handle = slider.querySelector(".ba-slider-handle");

      const setSliderWidth = () => {
        slider.style.setProperty("--slider-w", `${slider.offsetWidth}px`);
      };

      const setPosition = (pct) => {
        const clamped = Math.min(96, Math.max(4, pct));
        slider.style.setProperty("--pos", `${clamped}%`);
        handle.setAttribute("aria-valuenow", Math.round(clamped));
      };

      const positionFromClientX = (clientX) => {
        const rect = slider.getBoundingClientRect();
        return ((clientX - rect.left) / rect.width) * 100;
      };

      let dragging = false;

      // Prevent the browser's native image drag (ghost thumbnail) from
      // hijacking the interaction — this is what makes the handle "stick".
      slider.addEventListener("dragstart", (e) => e.preventDefault());
      slider.addEventListener("mousedown", (e) => e.preventDefault());
      slider.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });

      slider.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        dragging = true;
        try {
          slider.setPointerCapture(e.pointerId);
        } catch {
          // Ignore — some input types/environments don't support capture;
          // pointermove still works via normal event bubbling.
        }
        setPosition(positionFromClientX(e.clientX));
      });

      slider.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        setPosition(positionFromClientX(e.clientX));
      });

      const stopDrag = (e) => {
        dragging = false;
        if (slider.hasPointerCapture && e && slider.hasPointerCapture(e.pointerId)) {
          slider.releasePointerCapture(e.pointerId);
        }
      };
      slider.addEventListener("pointerup", stopDrag);
      slider.addEventListener("pointercancel", stopDrag);

      slider.addEventListener("keydown", (e) => {
        const current = parseFloat(slider.style.getPropertyValue("--pos")) || 50;
        if (e.key === "ArrowLeft") {
          setPosition(current - 4);
          e.preventDefault();
        } else if (e.key === "ArrowRight") {
          setPosition(current + 4);
          e.preventDefault();
        }
      });

      window.addEventListener("resize", setSliderWidth);
      if (beforeImg.complete) {
        setSliderWidth();
      } else {
        beforeImg.addEventListener("load", setSliderWidth);
      }
      setSliderWidth();
      setPosition(50);
    });
  };

  initBaSliders();

  // Horizontal carousel prev/next controls
  document.querySelectorAll("[data-carousel]").forEach((wrap) => {
    const track = wrap.querySelector(".ba-carousel");
    const prev = wrap.querySelector("[data-carousel-prev]");
    const next = wrap.querySelector("[data-carousel-next]");
    if (!track || !prev || !next) return;
    const scrollAmount = () => track.clientWidth * 0.8;
    prev.addEventListener("click", () => {
      track.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
    });
    next.addEventListener("click", () => {
      track.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    });
  });

  // First-slider drag hint (home page only) — nudges the handle once when
  // it first scrolls into view, to cue that it's draggable. Cancels the
  // instant the user actually interacts, and never plays a second time.
  const hintSlider = document.querySelector("[data-ba-slider][data-ba-hint-target]");
  if (hintSlider) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hintLabel = hintSlider.querySelector(".ba-slider-hint");
    const hintHandle = hintSlider.querySelector(".ba-slider-handle");
    let hintPlayed = false;
    let hintCancelled = false;

    const cancelHint = () => {
      hintCancelled = true;
      hintSlider.classList.remove("is-hinting");
      if (hintLabel) hintLabel.classList.add("is-hidden");
    };

    ["pointerdown", "touchstart", "keydown"].forEach((evt) => {
      hintSlider.addEventListener(evt, cancelHint, { once: true, passive: true });
    });

    const playHint = () => {
      if (hintPlayed || hintCancelled) return;
      hintPlayed = true;

      if (prefersReducedMotion) {
        // Minimal cue only — no motion, just a brief label.
        if (hintLabel) {
          hintLabel.classList.add("is-visible");
          setTimeout(() => hintLabel.classList.add("is-hidden"), 2200);
        }
        return;
      }

      hintSlider.classList.add("is-hinting");
      if (hintLabel) hintLabel.classList.add("is-visible");

      const steps = [38, 62, 46, 54, 50];
      let i = 0;
      const runStep = () => {
        if (hintCancelled || i >= steps.length) {
          hintSlider.classList.remove("is-hinting");
          if (hintLabel) hintLabel.classList.add("is-hidden");
          return;
        }
        hintSlider.style.setProperty("--pos", `${steps[i]}%`);
        if (hintHandle) hintHandle.setAttribute("aria-valuenow", steps[i]);
        i++;
        setTimeout(runStep, 420);
      };
      runStep();
    };

    const hintObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(playHint, 500);
            hintObserver.disconnect();
          }
        });
      },
      { threshold: 0.6 }
    );
    hintObserver.observe(hintSlider);
  }

  // Cards that link out to a dedicated case-study page instead of the
  // modal — the whole card is clickable, except the drag slider and any
  // real links inside it.
  document.querySelectorAll("[data-project-href]").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-ba-slider]")) return;
      if (e.target.closest("a")) return;
      window.location.href = card.getAttribute("data-project-href");
    });
  });

  // Case-study "In This Story" scroll-spy — the sticky TOC "ticks down" as
  // the reader scrolls: the section currently in view becomes the active,
  // accent-highlighted item, and an accent progress fill descends the track
  // to match. IntersectionObserver-driven (no scroll-jank). Clicks keep the
  // native smooth-scroll and re-sync the active state. Shared by both
  // case-study pages via this file; no-ops on pages without the TOC.
  const storyNavList = document.querySelector(".cs-story-nav-list");
  if (storyNavList) {
    const links = Array.from(storyNavList.querySelectorAll('a[href^="#"]'));
    const linkForSection = new Map();
    links.forEach((link) => {
      const id = decodeURIComponent(link.getAttribute("href").slice(1));
      const section = id && document.getElementById(id);
      if (section) linkForSection.set(section, link);
    });
    const sections = Array.from(linkForSection.keys());

    if (sections.length) {
      const updateProgressFill = (link) => {
        // Fill from the top of the track down to the bottom of the active
        // item, so the accent marker lines up with the ticked entry.
        const li = link.parentElement;
        const fill = li.offsetTop + li.offsetHeight;
        storyNavList.style.setProperty("--toc-progress", `${fill}px`);
      };

      const setActive = (link) => {
        if (!link) return;
        if (!link.classList.contains("is-active")) {
          links.forEach((l) => {
            l.classList.remove("is-active");
            l.removeAttribute("aria-current");
          });
          link.classList.add("is-active");
          link.setAttribute("aria-current", "true");
        }
        updateProgressFill(link);
      };

      const visible = new Set();
      const pickActive = () => {
        let active = null;
        if (visible.size) {
          // Topmost section currently within the trigger band.
          active = sections
            .filter((s) => visible.has(s))
            .sort(
              (a, b) =>
                a.getBoundingClientRect().top - b.getBoundingClientRect().top
            )[0];
        } else {
          // Between bands — fall back to the last section above the line.
          const line = window.innerHeight * 0.28;
          sections.forEach((s) => {
            if (s.getBoundingClientRect().top <= line) active = s;
          });
        }
        if (active) setActive(linkForSection.get(active));
      };

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) visible.add(entry.target);
            else visible.delete(entry.target);
          });
          pickActive();
        },
        { rootMargin: "-22% 0px -70% 0px", threshold: 0 }
      );
      sections.forEach((s) => observer.observe(s));

      // Instant feedback on click; the observer then keeps it in sync as the
      // smooth-scroll settles.
      links.forEach((link) => {
        link.addEventListener("click", () => setActive(link));
      });

      // Keep the fill aligned if the list reflows.
      window.addEventListener(
        "resize",
        () => {
          const current = storyNavList.querySelector("a.is-active");
          if (current) updateProgressFill(current);
        },
        { passive: true }
      );

      pickActive();
    }
  }

  // Service area modal (Contact page) — reuses the same .project-modal
  // visual pattern as the project detail views, wired up independently.
  const serviceModal = document.querySelector("[data-service-modal]");
  if (serviceModal) {
    const serviceTrigger = document.querySelector("[data-open-service-modal]");
    let serviceLastFocused = null;

    const openServiceModal = () => {
      serviceLastFocused = document.activeElement;
      serviceModal.classList.add("is-open");
      serviceModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      const closeBtn = serviceModal.querySelector(".project-modal-close");
      if (closeBtn) closeBtn.focus();
    };

    const closeServiceModal = () => {
      if (!serviceModal.classList.contains("is-open")) return;
      serviceModal.classList.remove("is-open");
      serviceModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      if (serviceLastFocused && typeof serviceLastFocused.focus === "function") {
        serviceLastFocused.focus();
      }
    };

    if (serviceTrigger) {
      serviceTrigger.addEventListener("click", openServiceModal);
    }

    serviceModal.querySelectorAll("[data-service-modal-close]").forEach((el) => {
      el.addEventListener("click", closeServiceModal);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeServiceModal();
    });

    const quoteLink = serviceModal.querySelector("[data-service-modal-quote-link]");
    if (quoteLink) {
      quoteLink.addEventListener("click", (e) => {
        e.preventDefault();
        closeServiceModal();
        const target = document.getElementById("quote-form");
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            const firstField = target.querySelector("input, textarea, select");
            if (firstField) firstField.focus({ preventScroll: true });
          }, 50);
        }
      });
    }
  }

  // Form submission via static form service (Formspree-style POST)
  //
  // TODO: Replace FORM_ENDPOINT with your real endpoint, e.g.:
  //   https://formspree.io/f/YOUR_FORM_ID
  // Sign up at https://formspree.io (or Basin, Getform, Netlify Forms, etc.)
  // and paste the endpoint URL below. Nothing else needs to change.
  const FORM_ENDPOINT = "https://formspree.io/f/PLACEHOLDER_FORM_ID";

  document.querySelectorAll("form[data-delta-form]").forEach((form) => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const status = form.querySelector(".form-status");
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = "Sending…";

      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });
        if (res.ok) {
          form.reset();
          status.className = "form-status success";
          status.textContent =
            "Thanks — we received your message and will be in touch soon.";
        } else {
          throw new Error("Request failed");
        }
      } catch {
        status.className = "form-status error";
        status.textContent =
          "Something went wrong. Please call us at 901-568-4128 and we'll help right away.";
      } finally {
        button.disabled = false;
        button.textContent = "Submit";
      }
    });
  });
});

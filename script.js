/* Delta Companies: Construction — shared site JS */

// Project data (Projects page grid + detail modal)
const PROJECTS = {
  "full-interior-transformation": {
    title: "Full Interior Transformation",
    subtitle: "Quince House — Memphis, TN",
    description:
      "Quince House needed new life in every room. From the kitchen to the hallway, our team rebuilt it from the studs out into a home buyers are proud to walk into.",
    cover: null,
    coverDesc: null,
    rooms: [
      {
        name: "Kitchen",
        type: "slider",
        before: "assets/quince-house/kitchen-before.jpg",
        after: "assets/quince-house/kitchen-after.jpg",
        desc: "This kitchen was showing its age and then some — worn linoleum flooring, dated cabinetry, cluttered counters, and visible water staining along the ceiling line pointed to years of deferred maintenance. Our team gutted the space where needed and installed new cabinetry, a subway tile backsplash, and durable wood-look plank flooring throughout. Updated countertops, a new sink and fixtures, and fresh lighting round out a kitchen that's as functional as it is inviting.",
      },
      {
        name: "Bathroom",
        type: "slider",
        before: "assets/quince-house/bathroom-before.jpg",
        after: "assets/quince-house/bathroom-after.jpg",
        desc: "The original bathroom's tile floor and tub surround were original to the home, worn down, and overdue for a full refresh. We replaced the tub surround and flooring with clean, large-format tile, installed a new vanity, toilet, and mirror, and updated the lighting and fixtures throughout. The result is a bright, modern bathroom that makes the most of a compact footprint.",
      },
      {
        name: "Bedroom",
        type: "slider",
        before: "assets/quince-house/bedroom-before.jpg",
        after: "assets/quince-house/bedroom-after.jpg",
        desc: "This bedroom needed the basics done right — the finishes were tired and plain, and the space lacked the clean, cohesive feel the rest of the home now has. Delta refinished the flooring, repainted throughout, and updated the closet doors and hardware to match the home's new standard. It's a simple, confident refresh that makes the room feel new again.",
      },
      {
        name: "Master Bedroom",
        type: "slider",
        before: "assets/quince-house/master-before.jpg",
        after: "assets/quince-house/master-after.jpg",
        desc: "The primary bedroom had taken on serious water damage — a stained, sagging ceiling, ruined carpet, and debris throughout left it unusable in its original state. We repaired the ceiling and structure, installed new flooring, and repainted top to bottom. Fresh trim, updated lighting, and clean, neutral finishes turned a total loss into one of the best rooms in the house.",
      },
      {
        name: "Entry",
        type: "slider",
        before: "assets/quince-house/entry-before.jpg",
        after: "assets/quince-house/entry-after.jpg",
        desc: "The main living area was cluttered and worn, with visible damage along the paneled walls and carpet — not the first impression a home should make. Our team removed the damaged materials, installed new wood-look flooring throughout, repainted the walls and trim, and refreshed the doors connecting to the kitchen and hallway. It's now an open, light-filled space that sets the tone for the rest of the home.",
      },
      {
        name: "Hallway",
        type: "slider",
        before: "assets/quince-house/hallway-before.jpg",
        after: "assets/quince-house/hallway-after.jpg",
        desc: "A dark, narrow hallway with dated wood paneling and worn flooring connected the home's bedrooms, but it did the space no favors. We replaced the flooring, repainted the walls, and updated the lighting fixture to brighten what used to be one of the darkest parts of the house. Small space, same level of care — it now feels like a natural extension of the rest of the renovation.",
      },
    ],
  },
  "destroyed-property-restored": {
    title: "Destroyed Property, Restored!",
    subtitle: "Dorado House — 3701 Dorado, Memphis, TN",
    description:
      "3701 Dorado was left gutted by fire and water damage. We took it down to the studs and rebuilt it into a move-in-ready home from the ground up.",
    cover: "assets/dorado-house/kitchen-a.jpg",
    coverDesc:
      "The kitchen tells the story of this entire renovation — from fire and water damage to a bright, fully rebuilt space. Every room throughout 3701 Dorado received the same level of care.",
    rooms: [
      {
        name: "Kitchen",
        type: "slider",
        before: "assets/dorado-house/kitchen-b.jpg",
        after: "assets/dorado-house/kitchen-a.jpg",
        desc: "Fire and water damage left this kitchen gutted — a bowed, water-stained ceiling, a cabinet barely hanging on, and blackened countertops made it unsalvageable as-is. Delta rebuilt the space from the studs out: new upper and lower cabinetry, updated countertops, a tile backsplash, and durable plank flooring replaced everything that was lost. What was once a total loss is now a bright, move-in-ready kitchen built to last.",
      },
      {
        name: "Bedroom",
        type: "slider",
        before: "assets/dorado-house/bedroom2.jpg",
        after: "assets/dorado-house/bedroom1.jpg",
        desc: "This bedroom's windows were boarded over and its flooring damaged beyond repair, leaving the room dark, closed off, and unusable. We removed the boards and restored the windows, replaced the flooring, and repainted the walls to bring natural light and a clean, neutral finish back into the space. It's a straightforward, thorough rebuild that turned a shuttered room back into a livable bedroom.",
      },
      {
        name: "Hallway",
        type: "slider",
        before: "assets/dorado-house/hallway-b.jpg",
        after: "assets/dorado-house/hallway-a.jpg",
        desc: "The hallway connecting the home's rooms had a hole punched through the drywall, dated wall decor, and flooring well past salvageable. Our team repaired the wall, replaced the flooring throughout, repainted top to bottom, and updated the lighting to connect cleanly with the kitchen at the end of the hall. It's a small stretch of the house, but it now reflects the same quality as everywhere else we touched.",
      },
    ],
  },
};

document.addEventListener("DOMContentLoaded", () => {
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

  // Project detail modal (Projects page grid -> full room-by-room view)
  const modal = document.querySelector("[data-project-modal]");
  if (modal) {
    const modalBody = modal.querySelector(".project-modal-body");
    let lastFocused = null;

    const roomMarkup = (room) => {
      const afterAlt = `${room.name} after renovation by Delta Companies: Construction in Memphis, TN`;
      const beforeAlt = `${room.name} before renovation in Memphis, TN`;
      if (room.type === "slider") {
        return `
          <div class="project-modal-room">
            <p class="room-heading">${room.name}</p>
            <div class="room-slider-wrap">
              <div class="ba-slider" data-ba-slider role="slider" tabindex="0" aria-label="${room.name} before and after slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
                <div class="ba-slider-after"><img src="${room.after}" alt="${afterAlt}" loading="lazy" draggable="false" /></div>
                <div class="ba-slider-before"><img src="${room.before}" alt="${beforeAlt}" loading="lazy" draggable="false" /></div>
                <div class="ba-slider-handle"><span class="ba-slider-handle-btn">&#8596;</span></div>
                <span class="ba-tag ba-tag-before">Before</span>
                <span class="ba-tag ba-tag-after">After</span>
              </div>
            </div>
            <p class="room-desc">${room.desc}</p>
          </div>`;
      }
      return `
        <div class="project-modal-room">
          <p class="room-heading">${room.name}</p>
          <div class="before-after">
            <div class="ba-pane">
              <p class="ba-label">Before</p>
              <img src="${room.before}" alt="${beforeAlt}" loading="lazy" />
            </div>
            <div class="ba-pane">
              <p class="ba-label">After</p>
              <img src="${room.after}" alt="${afterAlt}" loading="lazy" />
            </div>
          </div>
          <p class="room-desc">${room.desc}</p>
        </div>`;
    };

    const openProject = (id, opener) => {
      const project = PROJECTS[id];
      if (!project) return;
      lastFocused = opener || document.activeElement;

      modalBody.innerHTML = `
        <span class="eyebrow">${project.subtitle}</span>
        <h2 id="project-modal-title">${project.title}</h2>
        <p class="lead">${project.description}</p>
        ${
          project.cover
            ? `<img class="project-modal-cover" src="${project.cover}" alt="${project.title} — ${project.subtitle}" loading="lazy" />
               ${project.coverDesc ? `<p class="cover-desc">${project.coverDesc}</p>` : ""}`
            : ""
        }
        <div class="project-modal-rooms">
          ${project.rooms.map(roomMarkup).join("")}
        </div>
      `;

      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      initBaSliders(modalBody);

      const closeBtn = modal.querySelector(".project-modal-close");
      if (closeBtn) closeBtn.focus();

      if (history.replaceState) history.replaceState(null, "", `#${id}`);
    };

    const closeProject = () => {
      if (!modal.classList.contains("is-open")) return;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      modalBody.innerHTML = "";
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
      if (history.replaceState) {
        history.replaceState(null, "", location.pathname + location.search);
      }
    };

    modal.querySelectorAll("[data-modal-close]").forEach((el) => {
      el.addEventListener("click", closeProject);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeProject();
    });

    document.querySelectorAll("[data-open-project]").forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        openProject(trigger.getAttribute("data-open-project"), trigger);
      });
    });

    document.querySelectorAll(".project-card, .ba-tile[data-project]").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("[data-ba-slider]")) return;
        if (e.target.closest("[data-open-project]")) return;
        openProject(card.getAttribute("data-project"), card);
      });
    });

    const hashId = location.hash.replace("#", "");
    if (hashId && PROJECTS[hashId]) {
      openProject(hashId, document.querySelector(`[data-project="${hashId}"]`));
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

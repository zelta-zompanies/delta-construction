/* Delta Construction — shared site JS */

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

  // One focusable slider owns its value; clipping preserves image alignment at
  // every width. Horizontal dragging leaves normal vertical touch scrolling intact.
  const initBaSliders = (root = document) => {
    root.querySelectorAll("[data-ba-slider]:not([data-ba-ready])").forEach((slider) => {
      slider.setAttribute("data-ba-ready", "true");
      slider.setAttribute("aria-orientation", "horizontal");
      const setPosition = (value) => {
        const pct = Math.min(100, Math.max(0, value));
        slider.style.setProperty("--pos", `${pct}%`);
        slider.setAttribute("aria-valuenow", Math.round(pct));
        slider.setAttribute("aria-valuetext", `${Math.round(pct)}% before, ${100 - Math.round(pct)}% after`);
      };
      const fromPointer = (e) => {
        const rect = slider.getBoundingClientRect();
        if (rect.width) setPosition(((e.clientX - rect.left) / rect.width) * 100);
      };
      let pointer = null;
      slider.addEventListener("dragstart", (e) => e.preventDefault());
      slider.addEventListener("pointerdown", (e) => {
        if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
        pointer = e.pointerId;
        slider.focus({ preventScroll: true });
        slider.setPointerCapture(e.pointerId);
        fromPointer(e);
      });
      slider.addEventListener("pointermove", (e) => {
        if (pointer === e.pointerId) fromPointer(e);
      });
      const stop = (e) => {
        if (pointer !== e.pointerId) return;
        pointer = null;
        if (slider.hasPointerCapture(e.pointerId)) slider.releasePointerCapture(e.pointerId);
      };
      slider.addEventListener("pointerup", stop);
      slider.addEventListener("pointercancel", stop);
      slider.addEventListener("lostpointercapture", () => { pointer = null; });
      slider.addEventListener("keydown", (e) => {
        const current = Number(slider.getAttribute("aria-valuenow"));
        const values = {
          ArrowLeft: current - 5, ArrowDown: current - 5,
          ArrowRight: current + 5, ArrowUp: current + 5,
          PageDown: current - 10, PageUp: current + 10, Home: 0, End: 100,
        };
        if (Object.prototype.hasOwnProperty.call(values, e.key)) {
          e.preventDefault();
          setPosition(values[e.key]);
        }
      });
      setPosition(50);
    });
  };
  initBaSliders();

  // A single comparison stays on screen while the next two images load.
  // Requests are serialized and rapid browsing coalesces to the latest choice:
  // at most the displayed pair plus one pending pair, with no bulk preloading.
  document.querySelectorAll("[data-comparison-gallery]").forEach(async (gallery) => {
    const slider = gallery.querySelector("[data-ba-slider]");
    const select = gallery.querySelector("[data-comparison-select]");
    const controls = gallery.querySelector("[data-comparison-controls]");
    const status = gallery.querySelector("[data-comparison-status]");
    const title = gallery.querySelector("[data-comparison-title]");
    const project = gallery.querySelector("[data-comparison-project]");
    const count = gallery.querySelector("[data-comparison-count]");
    const story = gallery.querySelector("[data-comparison-story]");
    let pairs;
    try {
      const response = await fetch("assets/lsa-approved/pairs.json");
      if (!response.ok) throw new Error("Gallery unavailable");
      const data = await response.json();
      pairs = Array.isArray(data) ? data : data.pairs;
      if (!Array.isArray(pairs) || !pairs.length) throw new Error("No comparisons");
    } catch {
      status.textContent = "More comparisons could not load. You can still explore our project stories below.";
      return;
    }
    pairs.forEach((pair, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${pair.project} — ${pair.title}`;
      select.appendChild(option);
    });
    let active = Math.max(0, pairs.findIndex((pair) => pair.id === gallery.dataset.initialPair));
    let requested = active;
    let loading = false;
    const updateDetails = (pair, index) => {
      title.textContent = pair.title;
      project.textContent = pair.project;
      count.textContent = `${index + 1} / ${pairs.length}`;
      select.value = index;
      slider.setAttribute("aria-label", `${pair.project}, ${pair.title}: before and after comparison`);
      slider.style.setProperty("--pos", "50%");
      slider.setAttribute("aria-valuenow", "50");
      slider.setAttribute("aria-valuetext", "50% before, 50% after");
      story.hidden = !pair.story;
      if (pair.story) story.setAttribute("href", pair.story);
    };
    const loadImage = (source, alt) => new Promise((resolve, reject) => {
      const img = new Image();
      img.alt = alt;
      img.draggable = false;
      img.decoding = "async";
      const timer = window.setTimeout(() => { img.src = ""; reject(new Error("Image timeout")); }, 15000);
      img.onload = async () => {
        try {
          await img.decode();
          window.clearTimeout(timer);
          resolve(img);
        } catch {
          window.clearTimeout(timer);
          reject(new Error("Image decoding failed"));
        }
      };
      img.onerror = () => { window.clearTimeout(timer); reject(new Error("Image unavailable")); };
      img.src = source;
    });
    const showRequested = async () => {
      if (loading) return;
      loading = true;
      gallery.setAttribute("aria-busy", "true");
      let failed = false;
      while (requested !== active) {
        const next = requested;
        const pair = pairs[next];
        status.textContent = `Loading ${pair.project}, ${pair.title}…`;
        // allSettled waits for both requests even if one fails, keeping the bound.
        const images = await Promise.allSettled([
          loadImage(pair.before, `${pair.project}, ${pair.title} before renovation`),
          loadImage(pair.after, `${pair.project}, ${pair.title} after renovation`),
        ]);
        if (requested !== next) continue;
        if (images.some((result) => result.status === "rejected")) {
          failed = true;
          requested = active;
          select.value = active;
          status.textContent = "This comparison could not load. Your previous view is still here. Choose another or try again.";
          break;
        }
        slider.querySelector(".ba-slider-before").replaceChildren(images[0].value);
        slider.querySelector(".ba-slider-after").replaceChildren(images[1].value);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        active = next;
        updateDetails(pair, active);
        status.textContent = `${active + 1} of ${pairs.length}: ${pair.project}, ${pair.title}.`;
      }
      if (!failed) status.textContent = `${active + 1} of ${pairs.length}: ${pairs[active].project}, ${pairs[active].title}.`;
      loading = false;
      gallery.removeAttribute("aria-busy");
    };
    updateDetails(pairs[active], active);
    controls.hidden = false;
    gallery.querySelector("[data-comparison-prev]").addEventListener("click", () => {
      requested = (requested - 1 + pairs.length) % pairs.length;
      showRequested();
    });
    gallery.querySelector("[data-comparison-next]").addEventListener("click", () => {
      requested = (requested + 1) % pairs.length;
      showRequested();
    });
    select.addEventListener("change", () => {
      requested = Number(select.value);
      showRequested();
    });
  });

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

  // Use only fixed event metadata. Never send names, contact details, messages,
  // form values, or link destinations to analytics. A lead means an accepted
  // form request, not a qualified lead, completed job, or confirmed notification.
  const trackEvent = (name, parameters) => {
    try {
      if (typeof window.gtag === "function") window.gtag("event", name, parameters);
    } catch {
      // Analytics must never interrupt contact or change a submission result.
    }
  };

  document.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]').forEach((link) => {
    link.addEventListener("click", () => {
      trackEvent("contact_intent", {
        method: link.getAttribute("href").startsWith("tel:") ? "phone" : "email",
      });
    });
  });

  // Netlify detects these static forms at deploy time. Preserve form names,
  // form-name fields and honeypots. Live delivery requires separate verification.
  document.querySelectorAll("form[data-delta-form]").forEach((form) => {
    const status = form.querySelector(".form-status");
    const button = form.querySelector('button[type="submit"]');
    const initialButtonText = button.textContent;
    const fields = Array.from(form.querySelectorAll("input:not([type=hidden]), textarea, select"));
    const initialDisabled = fields.map((field) => field.disabled);
    let state = "idle";

    const validateText = (field) => {
      field.setCustomValidity(field.required && !field.value.trim()
        ? "Please complete this field." : "");
    };
    fields.forEach((field) => {
      field.addEventListener("input", () => validateText(field));
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (state !== "idle") return;
      fields.forEach(validateText);
      if (!form.reportValidity()) return;

      const body = new URLSearchParams(new FormData(form)).toString();
      state = "sending";
      button.disabled = true;
      button.textContent = "Sending…";
      fields.forEach((field) => { field.disabled = true; });
      form.setAttribute("aria-busy", "true");
      status.className = "form-status";
      status.textContent = "Sending your message…";
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 20000);

      try {
        const res = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
          signal: controller.signal,
        });
        if (!res.ok) {
          state = "idle";
          status.className = "form-status error";
          status.textContent = "Your message was not accepted. Your details are still here. Please try again or call 901-568-4128.";
          return;
        }
        state = "sent";
        form.reset();
        status.className = "form-status success";
        status.textContent = "Thanks — your message was submitted. We'll be in touch soon.";
        button.textContent = "Message sent";
        const formId = form.getAttribute("name");
        if (formId === "quote" || formId === "contact") {
          trackEvent("generate_lead", { form_id: formId, method: "netlify_form" });
        }
      } catch {
        // A lost response does not prove the POST failed. Do not automatically
        // retry or invite another submission that could duplicate the request.
        state = "uncertain";
        status.className = "form-status error";
        status.textContent = "We couldn't confirm whether your message was received. Your details are still here. Please call 901-568-4128 before submitting again so we can avoid a duplicate.";
        button.textContent = "Please call to confirm";
      } finally {
        window.clearTimeout(timeout);
        form.removeAttribute("aria-busy");
        fields.forEach((field, index) => { field.disabled = initialDisabled[index]; });
        if (state === "idle") {
          button.disabled = false;
          button.textContent = initialButtonText;
        }
      }
    });
  });

  // Keep Up with Delta: Facebook Page Plugin fallback.
  // The plugin renders an <iframe> inside .fb-page. If it's blocked (privacy
  // extensions, no network to facebook.com, etc.) no iframe appears, leaving an
  // empty gap. If nothing renders within the timeout, reveal the in-frame
  // fallback message so the section still looks intentional.
  const fbEmbed = document.querySelector(".fb-feed-embed");
  if (fbEmbed) {
    const fbPage = fbEmbed.querySelector(".fb-page");
    const fbFallback = fbEmbed.querySelector(".fb-feed-fallback");
    if (fbPage && fbFallback) {
      window.setTimeout(() => {
        if (!fbPage.querySelector("iframe")) {
          fbFallback.hidden = false;
          fbPage.setAttribute("hidden", "");
        }
      }, 4000);
    }
  }
});


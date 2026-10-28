/* Delta Construction — shared site JS */

document.addEventListener("DOMContentLoaded", () => {
  // Preserve bookmarks to the photo collection that previously lived on Projects.
  const redirectLegacyGallery = () => {
    if (/\/projects(?:\.html)?\/?$/.test(location.pathname) &&
        /^#(?:before-and-after|comparison-category-[1-6])$/.test(location.hash)) {
      location.replace(`/gallery.html${location.search}${location.hash}`);
      return true;
    }
    return false;
  };
  if (redirectLegacyGallery()) return;
  window.addEventListener("hashchange", redirectLegacyGallery);

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

  // One feature rotates slowly only while visible and untouched. Manual input,
  // hover, focus, hidden tabs and reduced-motion preference suspend rotation.
  const feature = document.querySelector("[data-work-carousel]");
  if (feature) {
    const slides = [...feature.querySelectorAll("[data-feature-slide]")];
    const viewport = feature.querySelector("[data-feature-viewport]");
    slides.forEach((slide) => {
      const pair = slide.querySelector(".feature-media-pair");
      if (pair) pair.dataset.pairLayout = [...pair.querySelectorAll("img")]
        .every((img) => Number(img.getAttribute("width")) > Number(img.getAttribute("height"))) ? "stack" : "side";
    });
    const pause = feature.querySelector("[data-feature-pause]");
    const count = feature.querySelector("[data-feature-count]");
    const status = feature.querySelector("[data-feature-status]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let current = 0, requested = 0, loading = false, timer = null, automaticRequest = false;
    let direction = 1, animations = [];
    const cancelTransition = () => animations.forEach((animation) => animation.cancel());
    let paused = reduced.matches, hovered = false, focused = false, inView = false, playFromControl = false;
    // Reserve the tallest feature at this width without fetching hidden photos.
    // The image dimensions already describe each photo's natural aspect ratio.
    const sizeViewport = () => {
      viewport.dataset.measuring = "true";
      const hidden = slides.map((slide) => slide.hidden);
      slides.forEach((slide) => { slide.hidden = false; });
      const height = Math.ceil(Math.max(...slides.map((slide) => slide.getBoundingClientRect().height)));
      slides.forEach((slide, index) => { slide.hidden = hidden[index]; });
      delete viewport.dataset.measuring;
      viewport.style.setProperty("--feature-height", `${height}px`);
      viewport.dataset.sized = "true";
    };
    sizeViewport();
    document.fonts.ready.then(sizeViewport);
    let viewportWidth = viewport.clientWidth;
    new ResizeObserver(() => {
      if (viewport.clientWidth !== viewportWidth) {
        viewportWidth = viewport.clientWidth;
        sizeViewport();
      }
    }).observe(viewport);
    const updateRotation = () => {
      window.clearTimeout(timer);
      // Explicit Play may keep keyboard/touch focus on the control. Other focus
      // still pauses rotation, without blurring a control or moving focus.
      const focusPaused = focused && !(playFromControl && document.activeElement === pause);
      if (automaticRequest && (paused || reduced.matches || hovered || focusPaused || !inView || document.hidden)) {
        requested = current;
        automaticRequest = false;
        cancelTransition();
      }
      pause.hidden = reduced.matches;
      pause.textContent = paused ? "Play" : "Pause";
      pause.setAttribute("aria-label", paused ? "Play rotation" : "Pause rotation");
      const running = !paused && !reduced.matches && !hovered && !focusPaused && inView && !document.hidden && !loading;
      feature.dataset.rotation = running ? "running" : "paused";
      if (running) timer = window.setTimeout(() => advance(1, false), 8000);
    };
    const loadPhoto = (img) => new Promise((resolve, reject) => {
      if (img.complete && img.naturalWidth) return resolve();
      const timeout = window.setTimeout(() => { img.removeAttribute("src"); reject(new Error("Feature image timeout")); }, 15000);
      img.onload = async () => {
        try { await img.decode(); window.clearTimeout(timeout); resolve(); }
        catch { window.clearTimeout(timeout); reject(new Error("Feature image unavailable")); }
      };
      img.onerror = () => { window.clearTimeout(timeout); reject(new Error("Feature image unavailable")); };
      if (img.dataset.src) img.src = img.dataset.src;
    });
    const transitionTo = async (next) => {
      const outgoing = slides[current], incoming = slides[next];
      outgoing.classList.add("is-leaving");
      outgoing.inert = true;
      outgoing.setAttribute("aria-hidden", "true");
      incoming.hidden = false;
      incoming.inert = true;
      if (!reduced.matches && viewport.animate) {
        const timing = { duration: 360, easing: "cubic-bezier(.22,.61,.36,1)", fill: "both" };
        animations = [
          outgoing.animate([{ transform: "translateX(0)" }, { transform: `translateX(${-direction * 100}%)` }], timing),
          incoming.animate([{ transform: `translateX(${direction * 100}%)` }, { transform: "translateX(0)" }], timing),
        ];
        await Promise.allSettled(animations.map((animation) => animation.finished));
      }
      const commit = requested === next;
      outgoing.hidden = commit;
      incoming.hidden = !commit;
      outgoing.classList.remove("is-leaving");
      outgoing.inert = false;
      incoming.inert = false;
      outgoing.removeAttribute("aria-hidden");
      cancelTransition();
      animations = [];
      return commit;
    };
    const showRequested = async () => {
      if (loading) return;
      loading = true;
      updateRotation();
      while (requested !== current) {
        const next = requested;
        // Keep the current feature visible until its replacement is decoded.
        const photos = await Promise.allSettled([...slides[next].querySelectorAll("img")].map(loadPhoto));
        if (next !== requested) continue;
        if (photos.some((photo) => photo.status === "rejected")) {
          paused = true;
          status.textContent = "That feature could not load. Use Previous or Next to choose another.";
          break;
        }
        if (!await transitionTo(next)) continue;
        current = next;
        count.textContent = `${current + 1} / ${slides.length}`;
        if (paused) status.textContent = `Feature ${current + 1} of ${slides.length}: ${slides[current].querySelector("h3").textContent}.`;
      }
      loading = false;
      updateRotation();
    };
    const advance = (step, manual = true) => {
      const from = manual && automaticRequest ? current : requested;
      if (manual) { paused = true; playFromControl = false; }
      automaticRequest = !manual;
      direction = step;
      requested = (from + step + slides.length) % slides.length;
      cancelTransition();
      updateRotation();
      showRequested();
    };
    feature.querySelector("[data-feature-controls]").hidden = false;
    feature.querySelector("[data-feature-prev]").addEventListener("click", () => advance(-1));
    feature.querySelector("[data-feature-next]").addEventListener("click", () => advance(1));
    pause.addEventListener("click", () => { paused = !paused; playFromControl = !paused; updateRotation(); });
    feature.addEventListener("pointerenter", (event) => { if (event.pointerType === "mouse") { hovered = true; updateRotation(); } });
    feature.addEventListener("pointerleave", () => { hovered = false; updateRotation(); });
    feature.addEventListener("pointerdown", (event) => {
      if (!event.target.closest("[data-feature-pause]")) { paused = true; playFromControl = false; updateRotation(); }
    });
    feature.addEventListener("focusin", (event) => { focused = true; if (event.target !== pause) playFromControl = false; updateRotation(); });
    feature.addEventListener("focusout", (event) => { focused = feature.contains(event.relatedTarget); updateRotation(); });
    reduced.addEventListener("change", () => { if (reduced.matches) { paused = true; cancelTransition(); } updateRotation(); });
    document.addEventListener("visibilitychange", updateRotation);
    new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; updateRotation(); }, { threshold: .25 }).observe(feature);
    updateRotation();
  }

  // Small previews share one filtered grid. Full photos load only in the dialog,
  // with at most one pending pair; rapid browsing coalesces to the latest choice.
  document.querySelectorAll("[data-comparison-gallery]").forEach(async (gallery) => {
    const dialog = gallery.querySelector("[data-comparison-dialog]");
    const slider = dialog.querySelector("[data-ba-slider]");
    const stage = dialog.querySelector(".comparison-stage");
    const placeholder = stage.querySelector("[data-comparison-placeholder]");
    const placeholderText = stage.querySelector("[data-comparison-placeholder-text]");
    const title = dialog.querySelector("[data-comparison-title]");
    const count = dialog.querySelector("[data-comparison-count]");
    const story = dialog.querySelector("[data-comparison-story]");
    const costStory = dialog.querySelector("[data-comparison-cost-story]");
    const status = dialog.querySelector("[data-comparison-status]");
    const retry = dialog.querySelector("[data-comparison-retry]");
    const featuredIds = (gallery.dataset.featuredPairs || "").split(",").filter(Boolean);
    const categories = ["Kitchens", "Bathrooms", "Living Areas", "Bedrooms", "Hallways and Floors", "Exterior"];
    const projectName = (pair) => pair.project.replace(/\s*-\s*Project\s+\d+$/i, "");
    let projects = [], pairs;
    try {
      const response = await fetch("assets/lsa-approved/pairs.json?v=work-gallery-2");
      if (!response.ok) throw new Error("Gallery unavailable");
      const data = await response.json();
      pairs = data.pairs;
      projects = Array.isArray(data.projects) ? data.projects : [];
      const validImage = (value) => typeof value === "string" && /^assets\/lsa-approved\/(thumbs\/)?comparison-\d{2}-(before|after)\.webp$/.test(value);
      if (!Array.isArray(pairs) || !pairs.length || !pairs.every((pair) =>
        pair && typeof pair.id === "string" && typeof pair.project === "string" &&
        projects.some((entry) => entry.id === pair.projectId && entry.name === pair.project) &&
        typeof pair.title === "string" && categories.includes(pair.category) &&
        ["before", "after"].every((side) => validImage(pair[side]) &&
          pair.dimensions && Array.isArray(pair.dimensions[side]) && pair.dimensions[side].length === 2 &&
          pair.dimensions[side].every((dimension) => Number.isFinite(dimension) && dimension > 0) &&
          pair.thumbnails && pair.thumbnails[side] && validImage(pair.thumbnails[side].src) &&
          pair.thumbnails[side].src.includes("/thumbs/") &&
          Number.isFinite(pair.thumbnails[side].width) && pair.thumbnails[side].width > 0 &&
          Number.isFinite(pair.thumbnails[side].height) && pair.thumbnails[side].height > 0)
      )) throw new Error("Comparison data unavailable");
      if (featuredIds.length) {
        pairs = featuredIds.map((id) => pairs.find((pair) => pair.id === id));
        if (pairs.some((pair) => !pair)) throw new Error("Featured comparisons unavailable");
      }
    } catch {
      gallery.querySelector("[data-gallery-status]").textContent = "The photo gallery could not load. You can still explore our project stories.";
      return;
    }

    let visible = pairs.map((_, index) => index), active = null, requested = 0, loading = false;
    let returnTo = null, returnScroll = { x: 0, y: 0 };
    const setStageState = (state) => {
      stage.dataset.state = state;
      slider.hidden = state !== "ready";
      placeholder.hidden = state === "ready";
      retry.hidden = state !== "error";
      placeholderText.textContent = state === "error"
        ? "These photos couldn't load. Try again or choose another comparison."
        : "Loading photos…";
    };
    const overview = document.createElement("div");
    overview.className = "comparison-overview";
    overview.setAttribute("data-comparison-overview", "");
    const grid = document.createElement("div");
    grid.className = "comparison-preview-grid";
    const buttons = [];
    const openComparison = (index, button) => {
      returnTo = button;
      returnScroll = { x: window.scrollX, y: window.scrollY };
      requested = index;
      updateDetails(pairs[index], index);
      setStageState(active === index ? "ready" : "loading");
      status.textContent = "";
      document.body.classList.add("comparison-open");
      dialog.showModal();
      dialog.querySelector("[data-comparison-close]").focus({ preventScroll: true });
      showRequested();
    };
    pairs.forEach((pair, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "comparison-preview";
      button.id = pair.id;
      button.dataset.comparisonIndex = index;
      button.dataset.pairId = pair.id;
      button.dataset.projectId = pair.projectId;
      button.dataset.category = pair.category;
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-label", `Compare ${pair.title}, ${projectName(pair)}`);
      const photos = document.createElement("span");
      photos.className = "comparison-preview-photos";
      photos.dataset.pairLayout = ["before", "after"].every((side) => pair.dimensions[side][0] > pair.dimensions[side][1]) ? "stack" : "side";
      ["before", "after"].forEach((side) => {
        const pane = document.createElement("span");
        pane.className = "comparison-preview-pane";
        const img = document.createElement("img");
        img.src = pair.thumbnails[side].src;
        img.width = pair.thumbnails[side].width;
        img.height = pair.thumbnails[side].height;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        const label = document.createElement("span");
        label.className = `comparison-preview-label comparison-preview-label--${side}`;
        label.textContent = side;
        pane.append(img, label);
        photos.appendChild(pane);
      });
      button.appendChild(photos);
      button.addEventListener("click", () => openComparison(index, button));
      buttons.push(button);
      grid.appendChild(button);
    });
    if (!featuredIds.length) {
      const filters = document.createElement("div");
      filters.className = "comparison-category-nav";
      filters.setAttribute("role", "group");
      filters.setAttribute("aria-label", "Filter comparisons by room");
      const feedback = gallery.querySelector("[data-gallery-status]");
      const applyFilter = (category) => {
        visible = pairs.map((_, index) => index).filter((index) => category === "All" || pairs[index].category === category);
        buttons.forEach((button, index) => { button.hidden = !visible.includes(index); });
        filters.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.category === category)));
        feedback.textContent = `${visible.length} ${category === "All" ? "comparisons" : category.toLowerCase() + " comparisons"}.`;
      };
      ["All", ...categories].forEach((category, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.category = category;
        if (index) button.id = `comparison-category-${index}`;
        const total = category === "All" ? pairs.length : pairs.filter((pair) => pair.category === category).length;
        button.textContent = `${category} (${total})`;
        button.addEventListener("click", () => applyFilter(category));
        filters.appendChild(button);
      });
      overview.appendChild(filters);
      const legacyCategory = /^#comparison-category-([1-6])$/.exec(location.hash);
      applyFilter(legacyCategory ? categories[Number(legacyCategory[1]) - 1] : "All");
    }
    overview.appendChild(grid);
    gallery.prepend(overview);

    const publishedCostUrl = (pair) => {
      const entry = projects.find((item) => item.id === pair.projectId)?.publishedCostStory;
      if (!entry || entry.published !== true || entry.projectId !== pair.projectId ||
          typeof entry.url !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*\.html$/.test(entry.url) ||
          /draft|preview|unpublished/i.test(entry.url)) return null;
      return entry.url;
    };
    const storyTitles = {
      "six-room-home-renovation.html": "Six Rooms, One Home",
      "full-interior-transformation.html": "Eight Rooms, One Standard",
    };
    const updateDetails = (pair, index) => {
      title.textContent = `${pair.title}, ${projectName(pair)}: before and after`;
      count.textContent = `${visible.indexOf(index) + 1} / ${visible.length}`;
      dialog.dataset.projectId = pair.projectId;
      slider.setAttribute("aria-label", `${pair.title}, ${projectName(pair)}: before and after comparison`);
      slider.style.setProperty("--pos", "50%");
      slider.setAttribute("aria-valuenow", "50");
      slider.setAttribute("aria-valuetext", "50% before, 50% after");
      const projectStory = projects.find((entry) => entry.id === pair.projectId)?.publishedStory;
      const storyTitle = pair.story === projectStory && storyTitles[projectStory];
      story.hidden = !storyTitle;
      if (storyTitle) {
        story.setAttribute("href", projectStory);
        story.textContent = `Explore ${storyTitle} →`;
      } else {
        story.removeAttribute("href");
        story.textContent = "";
      }
      const costUrl = publishedCostUrl(pair);
      costStory.hidden = !costUrl;
      if (costUrl) costStory.setAttribute("href", costUrl);
      else costStory.removeAttribute("href");
      const ratio = Math.max(...["before", "after"].map((side) => pair.dimensions[side][0] / pair.dimensions[side][1]));
      stage.style.setProperty("--photo-ratio", ratio);
    };
    const loadImage = (source, alt) => new Promise((resolve, reject) => {
      const img = new Image();
      img.alt = alt;
      img.draggable = false;
      img.decoding = "async";
      const timer = window.setTimeout(() => { img.src = ""; reject(new Error("Image timeout")); }, 15000);
      img.onload = async () => {
        try { await img.decode(); window.clearTimeout(timer); resolve(img); }
        catch { window.clearTimeout(timer); reject(new Error("Image decoding failed")); }
      };
      img.onerror = () => { window.clearTimeout(timer); reject(new Error("Image unavailable")); };
      img.src = source;
    });
    const showRequested = async () => {
      if (loading) return;
      loading = true;
      dialog.setAttribute("aria-busy", "true");
      retry.hidden = true;
      while (dialog.open && (requested !== active || stage.dataset.state !== "ready")) {
        const next = requested, pair = pairs[next];
        setStageState("loading");
        status.textContent = `Loading ${pair.title}.`;
        const images = await Promise.allSettled([
          loadImage(pair.before, `${pair.title}, ${projectName(pair)}, before renovation`),
          loadImage(pair.after, `${pair.title}, ${projectName(pair)}, after renovation`),
        ]);
        if (!dialog.open) break;
        if (requested !== next) continue;
        if (images.some((result) => result.status === "rejected")) {
          status.textContent = "These photos could not load. Try again, choose another comparison, or close this dialog.";
          setStageState("error");
          break;
        }
        slider.querySelector(".ba-slider-before").replaceChildren(images[0].value);
        slider.querySelector(".ba-slider-after").replaceChildren(images[1].value);
        active = next;
        updateDetails(pair, next);
        setStageState("ready");
        status.textContent = `${pair.title}, comparison ${visible.indexOf(next) + 1} of ${visible.length}.`;
      }
      if (dialog.open && requested === active && stage.dataset.state === "ready") {
        status.textContent = `${pairs[active].title}, comparison ${visible.indexOf(active) + 1} of ${visible.length}.`;
      }
      loading = false;
      dialog.removeAttribute("aria-busy");
    };
    const browse = (direction) => {
      requested = visible[(visible.indexOf(requested) + direction + visible.length) % visible.length];
      setStageState(requested === active ? "ready" : "loading");
      updateDetails(pairs[requested], requested);
      showRequested();
    };
    dialog.querySelector("[data-comparison-prev]").addEventListener("click", () => browse(-1));
    dialog.querySelector("[data-comparison-next]").addEventListener("click", () => browse(1));
    retry.addEventListener("click", () => {
      dialog.querySelector("[data-comparison-close]").focus();
      showRequested();
    });
    dialog.querySelector("[data-comparison-close]").addEventListener("click", () => dialog.close());
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = [...dialog.querySelectorAll('button, a[href], [tabindex="0"]')]
        .filter((element) => !element.disabled && element.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    dialog.addEventListener("click", (event) => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("comparison-open");
      window.scrollTo({ left: returnScroll.x, top: returnScroll.y, behavior: "instant" });
      if (returnTo?.isConnected) returnTo.focus({ preventScroll: true });
    });
    // Homepage highlights link directly to their exact approved comparison.
    const openLinkedComparison = () => {
      const linkedIndex = pairs.findIndex((pair) => location.hash === `#${pair.id}`);
      if (linkedIndex < 0) return;
      if (buttons[linkedIndex].hidden) overview.querySelector('[data-category="All"]').click();
      if (dialog.open) {
        requested = linkedIndex;
        updateDetails(pairs[linkedIndex], linkedIndex);
        setStageState(active === linkedIndex ? "ready" : "loading");
        showRequested();
        return;
      }
      buttons[linkedIndex].scrollIntoView({ block: "center", behavior: "instant" });
      openComparison(linkedIndex, buttons[linkedIndex]);
    };
    window.addEventListener("hashchange", openLinkedComparison);
    openLinkedComparison();
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
      window.deltaMeasurement?.track(name, parameters);
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
    if (form.dataset.deltaFormBound === "true") return;
    form.dataset.deltaFormBound = "true";
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
          status.textContent = `Your message was not accepted. Your details are still here. Please try again or call ${window.deltaAds?.phoneNumber() || "901-568-4128"}.`;
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
          try { window.deltaMeasurement?.conversion(formId); } catch { /* Keep the accepted result. */ }
        }
      } catch {
        // A lost response does not prove the POST failed. Do not automatically
        // retry or invite another submission that could duplicate the request.
        state = "uncertain";
        status.className = "form-status error";
        status.textContent = `We couldn't confirm whether your message was received. Your details are still here. Please call ${window.deltaAds?.phoneNumber() || "901-568-4128"} before submitting again so we can avoid a duplicate.`;
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


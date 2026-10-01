(function () {
  const data = window.PORTFOLIO_DATA;
  const page = document.body.dataset.page;
  document.body.classList.toggle("show-grid", new URLSearchParams(location.search).has("grid"));

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
  const contrastInk = (hex) => {
    const channels = hex.slice(1).match(/.{2}/g).map((value) => parseInt(value, 16) / 255);
    const luminance = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    return luminance > 0.179 ? "#000" : "#fff";
  };
  const socialMarkup = ([label, href]) => href
    ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`
    : `<span class="social-pending" aria-label="${escapeHtml(label)} link coming soon">${escapeHtml(label)}</span>`;
  const metricMarkup = (value) => /^[+~]/.test(value)
    ? `<span class="metric-sign">${escapeHtml(value[0])}</span>${escapeHtml(value.slice(1))}`
    : escapeHtml(value);
  const titleMarkup = (value) => escapeHtml(value).replace(/\./g, ".<wbr>");

  function layoutProject(root) {
    const panel = root.querySelector(".project-panel");
    if (!panel || window.matchMedia("(max-width: 850px)").matches) return;
    const copy = panel.querySelector(".project-panel-copy");
    const hint = panel.querySelector(".project-scroll-hint");
    const summary = copy.querySelector(".project-panel-summary") || copy.querySelector("h2");
    const summaryHeight = summary.getBoundingClientRect().bottom - copy.getBoundingClientRect().top + copy.scrollTop;
    const copyTop = copy.offsetTop;
    const navBottom = panel.querySelector(".project-panel-nav").getBoundingClientRect().bottom - panel.getBoundingClientRect().top;
    const top = Math.max(420, navBottom + 40, copyTop + summaryHeight + 56);
    panel.style.setProperty("--summary-height", `${summaryHeight}px`);
    panel.style.setProperty("--spec-offset", `${top - copyTop}px`);
    panel.style.setProperty("--hint-offset", `${top}px`);
    stackMetrics(copy.querySelector(".project-achievements"));
  }

  function stackMetrics(grid) {
    if (!grid) return;
    grid.classList.remove("metrics-stacked");
    grid.classList.add("metrics-measuring");
    // Count actual wrapped lines, excluding the final short line of a paragraph.
    const crowded = [...grid.querySelectorAll("p")].some((paragraph) => {
      const text = paragraph.firstChild;
      if (!text || text.nodeType !== Node.TEXT_NODE || text.length < 100) return false;
      const lines = new Map();
      for (const match of text.textContent.matchAll(/\S+/g)) {
        const range = document.createRange();
        range.setStart(text, match.index);
        range.setEnd(text, match.index + match[0].length);
        const top = Math.round(range.getBoundingClientRect().top);
        lines.set(top, (lines.get(top) || 0) + 1);
      }
      const counts = [...lines.values()].slice(0, -1);
      return counts.length > 1 && counts.reduce((sum, count) => sum + count, 0) / counts.length < 3;
    });
    grid.classList.remove("metrics-measuring");
    grid.classList.toggle("metrics-stacked", crowded);
  }

  function headerMarkup() {
    return `
      <a class="header-link brand-link ${page === "home" ? "is-active" : ""}" href="index.html">Alex Fox III</a>
      <a class="header-link ${page === "about" ? "is-active" : ""}" href="about.html">About / CV</a>
      <a class="header-link ${page === "projects" || page === "project" ? "is-active" : ""}" href="projects.html">projects</a>
      <a class="header-link" href="#contacts">contacts</a>
      <button class="mobile-menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu"><span></span><span></span><span></span></button>
      <aside class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation" hidden>
        <div class="mobile-menu-bar">
          <button type="button" class="mobile-menu-tab is-active" aria-pressed="true" data-mobile-menu-view="about">About / CV</button>
          <button type="button" class="mobile-menu-tab" aria-pressed="false" data-mobile-menu-view="projects">Projects</button>
          <button type="button" class="mobile-menu-tab" aria-pressed="false" data-mobile-menu-view="contacts">Contacts</button>
        </div>
        <section class="mobile-menu-view is-active" data-mobile-menu-panel="about">
          <img class="mobile-menu-portrait" src="assets/portrait.png" alt="Aleksandr Lisovskiy">
          <p class="mobile-menu-name">aleksandr<br>lisovskiy</p>
          <p class="mobile-menu-about">I’ve <strong>led teams of 10+ specialists</strong> across graphic design, UX/UI, illustration and 3D, setting clear creative direction and turning complex briefs into structured, executable systems. <strong>My role usually spans the full process — from framing the problem</strong> and defining the idea to briefing specialists, aligning the team and guiding the work through <strong>to final implementation.</strong></p>
          <a class="mobile-menu-more" href="about.html">CV and more about me</a>
        </section>
        <section class="mobile-menu-view" data-mobile-menu-panel="projects">
          <nav class="mobile-menu-project-list" aria-label="Projects" data-mobile-menu-projects></nav>
          <div class="mobile-menu-filters" aria-label="Filter projects"><button type="button" class="is-active" aria-pressed="true" data-mobile-menu-filter="all">all</button><button type="button" aria-pressed="false" data-mobile-menu-filter="branding">branding</button><button type="button" aria-pressed="false" data-mobile-menu-filter="ux/ui">ux/ui</button></div>
          <p>Click on any project you like</p>
        </section>
        <section class="mobile-menu-view" data-mobile-menu-panel="contacts">
          <div class="mobile-menu-contact" data-mobile-menu-contact></div>
        </section>
      </aside>`;
  }

  function contactMarkup(projectCopy) {
    const c = data.contact;
    return `
      <div class="brand-mark"><img src="assets/logo.svg" alt="Alex Fox III"></div>
      <div class="contact-copy">
        <h2>${projectCopy ? '<span>Did you like the project?<br>Let’s make yours even better.</span> Reach out via any of the channels below' : "Have a project, team or collaboration in mind?<br>Let's talk"}</h2>
        <div class="contact-direct"><a href="${c.phoneHref}">${c.phone}</a><a href="${c.emailHref}">${c.email}</a></div>
        <nav class="social-links" aria-label="Social links">
          ${c.socials.map(socialMarkup).join("")}
        </nav>
      </div>`;
  }

  function projectNavMarkup(items, active, options = {}) {
    const { includeMore = true, selectable = false } = options;
    return items.map((item) => {
      const name = typeof item === "string" ? item : item.title;
      const slug = typeof item === "string" ? item.toLowerCase() : item.slug;
      return `<button type="button" class="${slug === active ? "is-active" : ""}" ${selectable ? `aria-pressed="${slug === active}"` : ""} ${selectable ? "data-select-project" : "data-project-name"}="${escapeHtml(slug)}">${escapeHtml(name)}</button>`;
    }).join("") + (includeMore ? '<a class="more-projects" href="projects.html">more projects</a>' : "");
  }

  function projectPanelMarkup(project, options = {}) {
    const { context = "home", navItems = data.projects, isTransition = false } = options;
    const role = project.detailRole || (project.role && project.role !== "—" ? project.role : "case in progress");
    const team = project.team?.length ? project.team.map(escapeHtml).join("<br>") : "—";
    const slides = project.slides?.length ? project.slides : (project.image ? [project.image] : []);
    const image = slides.length ? `
      <img class="project-panel-image project-panel-image-${escapeHtml(project.imageFit || "contain")}" src="${escapeHtml(slides[0])}?v=2" alt="${escapeHtml(project.title)} project visual" data-project-asset>
      <span class="project-asset-fallback" aria-hidden="true">${escapeHtml(project.title)}</span>`
      : `<span class="project-panel-placeholder">${escapeHtml(project.title)}</span>`;
    const action = project.href
      ? `<a class="project-more" href="${escapeHtml(project.href)}">more about project</a>`
      : '<span class="project-more is-disabled">more about project</span>';
    const achievements = project.achievements?.length ? `
      <div class="project-achievements">
        ${project.achievements.map(([value, label]) => `<div><strong>${metricMarkup(value)}</strong><p>${escapeHtml(label).replace(/\n/g, "<br>")}</p></div>`).join("")}
      </div>` : "";
    const description = escapeHtml(project.description);
    const panelCopy = context === "projects"
      ? `<h2 class="project-panel-title">${titleMarkup(project.caseTitle || project.title)}</h2><p class="project-panel-summary">${escapeHtml(project.description)}</p>`
      : `<h2 ${project.descriptionLines?.length ? `aria-label="${escapeHtml(project.description)}"` : ""}>${description}</h2>`;

    const meta = `<div><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.category)}</small></div><div><strong>${escapeHtml(project.year)}</strong><small>${escapeHtml(project.role)}</small></div>`;
    const artTag = project.href ? "a" : "div";
    const artAttributes = project.href ? `href="${escapeHtml(project.href)}" aria-label="Open ${escapeHtml(project.title)} case study"` : "";

    return `
      <article class="project-panel ${isTransition ? "is-project-changing" : ""}" id="project-${escapeHtml(project.slug)}" data-header-theme="${context === "home" ? "panel" : "muted"}" style="--panel-color:${escapeHtml(project.color)};--panel-ink:${contrastInk(project.color)}">
        <div class="project-panel-meta project-panel-meta-base" aria-hidden="true">${meta}</div>
        <div class="project-panel-nav-wrap">
          <nav class="project-nav project-panel-nav" aria-label="Projects">${projectNavMarkup(navItems, project.slug, { includeMore: false, selectable: true })}</nav>
          <p class="project-scroll-hint">${context === "projects" ? "click or scroll<br>to switch project" : "click to switch project"}</p>
          ${context === "projects" ? '<button class="project-autoplay-toggle" type="button" data-project-autoplay aria-label="Pause automatic project switching" aria-pressed="false">pause</button>' : ""}
        </div>
        ${context === "projects" ? `<div class="project-filters" aria-label="Filter projects">
          ${["all", "branding", "ux/ui"].map((tag) => `<button type="button" class="${tag === "all" ? "is-active" : ""}" aria-pressed="${tag === "all"}" data-project-filter="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}
        </div>` : ""}
        <div class="project-panel-copy">
          ${panelCopy}
          <div class="project-specs"><div><small>role</small><p>${escapeHtml(role).replace(/\n/g, "<br>")}</p></div><div><small>team</small><p>${team}</p></div></div>
          ${achievements ? '<small class="achievements-label">achievements</small>' : ""}
          ${achievements}
          ${action}
        </div>
        <${artTag} class="project-panel-art ${project.href ? "" : "is-disabled"}" ${artAttributes}>
          <div class="project-panel-meta">${meta}</div>
          ${image}
        </${artTag}>
      </article>`;
  }

  document.querySelector("[data-site-header]").innerHTML = headerMarkup();
  document.querySelectorAll("[data-project-stack]").forEach((root) => {
    const context = root.dataset.projectStack === "full" ? "projects" : "home";
    let filter = "all";
    let activeSlug = data.projects[0].slug;
    let visibleProjects = data.projects;
    let autoplayPaused = false;
    let pointerDownOnAutoplay = false;
    let lastScrollAt = -Infinity;
    let scrollResumeTimer;
    const projectStep = () => Math.max(220, window.innerHeight * 0.45);
    const refreshAutoplay = () => {
      if (context !== "projects") return;
      const rect = root.getBoundingClientRect();
      const visible = rect.top <= 0 && rect.bottom >= window.innerHeight;
      const pointerOnContent = !!root.querySelector(".project-panel-copy:hover, .project-panel-nav-wrap:hover");
      const eligible = window.innerWidth > 850 && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      const running = eligible && visible && !document.hidden && !autoplayPaused && !pointerOnContent && performance.now() - lastScrollAt >= 5000;
      root.classList.toggle("has-autoplay-progress", eligible);
      root.classList.toggle("is-autoplaying", running);
      root.classList.toggle("is-autoplay-paused", !running);
      const toggle = root.querySelector("[data-project-autoplay]");
      if (toggle) {
        toggle.textContent = autoplayPaused ? "play" : "pause";
        toggle.setAttribute("aria-pressed", String(autoplayPaused));
        toggle.setAttribute("aria-label", autoplayPaused ? "Resume automatic project switching" : "Pause automatic project switching");
      }
    };

    const render = (isTransition = false) => {
      visibleProjects = filter === "all" ? data.projects : data.projects.filter((project) => project.tags.includes(filter));
      if (!visibleProjects.some((project) => project.slug === activeSlug)) activeSlug = visibleProjects[0]?.slug;
      const project = visibleProjects.find((item) => item.slug === activeSlug) || visibleProjects[0];
      if (!project) return;
      const navItems = context === "home"
        ? data.homePanelProjectSlugs.map((slug) => data.projects.find((item) => item.slug === slug)).filter(Boolean)
        : visibleProjects;
      const panel = projectPanelMarkup(project, { context, navItems, isTransition });
      if (context === "projects") {
        let track = root.querySelector(".project-scroll-track");
        if (!track) {
          root.innerHTML = '<div class="project-scroll-track"></div>';
          track = root.querySelector(".project-scroll-track");
        }
        track.style.height = window.matchMedia("(max-width: 850px)").matches ? "auto" : `${window.innerHeight + (visibleProjects.length - 1) * projectStep()}px`;
        track.innerHTML = panel;
      } else {
        root.innerHTML = panel;
        document.querySelector("[data-site-header]")?.style.setProperty("--panel-header-ink", contrastInk(project.color));
      }
      root.querySelectorAll("[data-project-filter]").forEach((button) => {
        const active = button.dataset.projectFilter === filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      window.requestAnimationFrame(() => layoutProject(root));
      refreshAutoplay();
    };

    const teleportToProject = (slug) => {
      if (context !== "projects" || window.matchMedia("(max-width: 850px)").matches) return;
      const index = visibleProjects.findIndex((project) => project.slug === slug);
      if (index < 0) return;
      const target = root.getBoundingClientRect().top + window.scrollY + index * projectStep();
      window.requestAnimationFrame(() => {
        const previousScrollBehavior = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo({ top: target, behavior: "auto" });
        document.documentElement.style.scrollBehavior = previousScrollBehavior;
      });
    };

    const updateFromScroll = () => {
      if (context !== "projects" || window.matchMedia("(max-width: 850px)").matches) return;
      const track = root.querySelector(".project-scroll-track");
      if (!track) return;
      const segment = projectStep();
      const trackTop = track.getBoundingClientRect().top + window.scrollY;
      const index = Math.max(0, Math.min(visibleProjects.length - 1, Math.round((window.scrollY - trackTop) / segment)));
      const nextProject = visibleProjects[index];
      if (nextProject && nextProject.slug !== activeSlug) {
        activeSlug = nextProject.slug;
        render(true);
      }
    };

    root.addEventListener("click", (event) => {
      const autoplayButton = event.target.closest("[data-project-autoplay]");
      if (autoplayButton) {
        autoplayPaused = !autoplayPaused;
        refreshAutoplay();
        return;
      }
      const projectButton = event.target.closest("[data-select-project]");
      if (projectButton) {
        event.preventDefault();
        const nextProject = data.projects.find((project) => project.slug === projectButton.dataset.selectProject);
        if (window.matchMedia("(max-width: 850px)").matches && nextProject) {
          window.location.href = nextProject.href || `index.html#project-${nextProject.slug}`;
          return;
        }
        activeSlug = projectButton.dataset.selectProject;
        if (context === "projects" && !visibleProjects.some((project) => project.slug === activeSlug)) filter = "all";
        render(true);
        teleportToProject(activeSlug);
        return;
      }
      const filterButton = event.target.closest("[data-project-filter]");
      if (filterButton) {
        event.preventDefault();
        filter = filterButton.dataset.projectFilter;
        render(true);
        teleportToProject(activeSlug);
        return;
      }
      const dot = event.target.closest("[data-panel-slide]");
      if (dot) {
        event.preventDefault();
        const project = data.projects.find((item) => item.slug === activeSlug);
        const slides = project?.slides || [];
        const image = root.querySelector("[data-project-asset]");
        if (image && slides[Number(dot.dataset.panelSlide)]) image.src = `${slides[Number(dot.dataset.panelSlide)]}?v=2`;
        root.querySelectorAll("[data-panel-slide]").forEach((button) => button.classList.toggle("is-active", button === dot));
      }
    });
    render();
    if (context === "projects") {
      root.addEventListener("animationend", (event) => {
        if (event.animationName !== "project-progress" || !root.classList.contains("is-autoplaying")) return;
        const index = visibleProjects.findIndex((project) => project.slug === activeSlug);
        activeSlug = visibleProjects[(index + 1) % visibleProjects.length].slug;
        render(true);
      });
      root.addEventListener("pointerenter", refreshAutoplay);
      root.addEventListener("pointerleave", refreshAutoplay);
      root.addEventListener("pointerdown", (event) => {
        pointerDownOnAutoplay = !!event.target.closest("[data-project-autoplay]");
      });
      root.addEventListener("pointerup", () => { pointerDownOnAutoplay = false; });
      root.addEventListener("focusin", (event) => {
        if (!event.target.closest("[data-project-autoplay]") || !pointerDownOnAutoplay) autoplayPaused = true;
        refreshAutoplay();
      });
      document.addEventListener("visibilitychange", refreshAutoplay);
      matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", refreshAutoplay);
      window.addEventListener("blur", () => root.classList.add("is-autoplay-paused"));
      window.addEventListener("focus", refreshAutoplay);
    }
    root.addEventListener("wheel", (event) => {
      if (window.matchMedia("(max-width: 850px)").matches || event.ctrlKey) return;
      const panel = root.querySelector(".project-panel");
      const copy = root.querySelector(".project-panel-copy");
      if (!copy || Math.abs(panel.getBoundingClientRect().top) > 1) return;
      const remaining = copy.scrollHeight - copy.clientHeight - copy.scrollTop;
      if ((event.deltaY > 0 && remaining > 1) || (event.deltaY < 0 && copy.scrollTop > 0)) {
        event.preventDefault();
        copy.scrollTop += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? copy.clientHeight : 1);
      }
    }, { passive: false });
    if (context === "projects") {
      window.addEventListener("scroll", () => {
        lastScrollAt = performance.now();
        updateFromScroll();
        refreshAutoplay();
        clearTimeout(scrollResumeTimer);
        scrollResumeTimer = setTimeout(refreshAutoplay, 5000);
      }, { passive: true });
      window.addEventListener("resize", () => { render(); updateFromScroll(); refreshAutoplay(); });
    }
  });
  document.querySelectorAll(".contact-section").forEach((node) => { node.innerHTML = contactMarkup(node.classList.contains("project-contact")); });

  const mobileMenu = document.querySelector(".mobile-menu");
  const mobileToggle = document.querySelector(".mobile-menu-toggle");
  const menuBackground = document.querySelector("main");
  const headerLinks = document.querySelectorAll(".site-header .header-link");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let menuMotion = null;
  const isolateMenu = (open) => {
    menuBackground.inert = open;
    headerLinks.forEach((link) => { link.inert = open; });
  };
  const setMobileMenu = (open, restoreFocus = false, immediate = false) => {
    if (!mobileMenu) return;
    // Reverse from the visible opacity, including an unfinished close.
    const from = mobileMenu.hidden ? 0 : Number(getComputedStyle(mobileMenu).opacity);
    menuMotion?.cancel();
    menuMotion = null;
    mobileToggle?.setAttribute("aria-expanded", String(open));
    mobileToggle?.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (open) {
      mobileMenu.hidden = false;
      document.body.classList.add("mobile-menu-open");
      isolateMenu(true);
      mobileMenu.querySelector(".mobile-menu-tab.is-active")?.focus({ preventScroll: true });
    }
    const finish = () => {
      if (!open) {
        mobileMenu.hidden = true;
        document.body.classList.remove("mobile-menu-open");
        isolateMenu(false);
        if (restoreFocus) mobileToggle?.focus({ preventScroll: true });
      }
    };
    const target = open ? 1 : 0;
    if (immediate || reducedMotion.matches || from === target) {
      finish();
      return;
    }
    const animation = mobileMenu.animate([{ opacity: from }, { opacity: target }], {
      duration: (open ? 280 : 200) * Math.abs(target - from),
      easing: "cubic-bezier(.2, 0, 0, 1)",
      fill: "both"
    });
    menuMotion = animation;
    animation.onfinish = () => {
      if (menuMotion !== animation) return;
      finish();
      menuMotion = null;
      animation.cancel();
    };
  };
  // Navigation and desktop resizing close immediately so their focus can move on.
  const closeMobileMenu = (restoreFocus = false) => setMobileMenu(false, restoreFocus, !restoreFocus);
  mobileToggle?.addEventListener("click", () => setMobileMenu(mobileToggle.getAttribute("aria-expanded") !== "true", true));
  reducedMotion.addEventListener("change", () => { if (reducedMotion.matches) menuMotion?.finish(); });
  document.addEventListener("keydown", (event) => {
    if (mobileMenu?.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileMenu(true);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [mobileToggle, ...mobileMenu.querySelectorAll("button, a[href]")]
      .filter((element) => element.getClientRects().length && !element.disabled);
    const index = focusable.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      focusable.at(-1)?.focus();
    } else if (!event.shiftKey && index === focusable.length - 1) {
      event.preventDefault();
      focusable[0]?.focus();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 850 && mobileMenu && !mobileMenu.hidden) closeMobileMenu();
  });
  mobileMenu?.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-mobile-menu-view]");
    if (!tab) return;
    const view = tab.dataset.mobileMenuView;
    mobileMenu.querySelectorAll("[data-mobile-menu-view]").forEach((button) => {
      const active = button === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    mobileMenu.querySelectorAll("[data-mobile-menu-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.mobileMenuPanel === view));
  });
  const mobileProjects = mobileMenu?.querySelector("[data-mobile-menu-projects]");
  const mobileFilterButtons = mobileMenu?.querySelectorAll("[data-mobile-menu-filter]");
  const renderMobileProjects = (filter = "all") => {
    if (!mobileProjects) return;
    const visible = filter === "all" ? data.projects : data.projects.filter((project) => project.tags.includes(filter));
    mobileProjects.innerHTML = visible.map((project) => `<a href="${escapeHtml(project.href || `index.html#project-${project.slug}`)}">${escapeHtml(project.title)}</a>`).join("");
    mobileFilterButtons?.forEach((button) => {
      const active = button.dataset.mobileMenuFilter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };
  renderMobileProjects();
  mobileFilterButtons?.forEach((button) => button.addEventListener("click", () => renderMobileProjects(button.dataset.mobileMenuFilter)));
  const mobileContact = mobileMenu?.querySelector("[data-mobile-menu-contact]");
  if (mobileContact) {
    const c = data.contact;
    const mobileSocials = [c.socials[2], c.socials[0], c.socials[1]];
    mobileContact.innerHTML = `<h2>Have a project,<br>team or collaboration<br>in mind? Let’s talk!</h2><a href="${c.phoneHref}">${c.phone}</a><a href="${c.emailHref}">${c.email}</a>${mobileSocials.map(socialMarkup).join("")}`;
  }

  document.addEventListener("click", (event) => {
    const disabled = event.target.closest("a.is-disabled");
    if (disabled) event.preventDefault();
  });
  document.addEventListener("error", (event) => {
    if (event.target.matches?.("img[data-project-asset]")) event.target.closest(".project-panel-art")?.classList.add("has-asset-error");
  }, true);

  const header = document.querySelector("[data-site-header]");
  const updateHeaderTheme = () => {
    const y = Math.max(40, window.innerHeight * 0.08);
    const active = [...document.querySelectorAll("[data-header-theme]")].find((section) => { const rect = section.getBoundingClientRect(); return rect.top <= y && rect.bottom > y; });
    header.dataset.theme = active?.dataset.headerTheme || "muted";
  };
  updateHeaderTheme();
  window.addEventListener("scroll", updateHeaderTheme, { passive: true });

  if (page === "home") {
    const hero = document.querySelector(".hero");
    const contact = document.querySelector(".contact-section");
    let mobileLogoFrame = null;
    const updateMobileHomeLogo = () => {
      mobileLogoFrame = null;
      if (!hero || !contact || !window.matchMedia("(max-width: 850px)").matches) {
        header.removeAttribute("data-mobile-home-logo");
        return;
      }
      const logoWidth = 112;
      const logoHeight = 78;
      const gutter = 20;
      const headerX = gutter;
      const headerY = 22;
      const centerX = (window.innerWidth - logoWidth) / 2;
      const centerY = 160;
      const contactProgress = Math.max(0, Math.min(1, (window.innerHeight * 0.4 - contact.getBoundingClientRect().top) / (window.innerHeight * 0.4)));
      const leaveHeader = contactProgress > 0 ? contactProgress : 0;
      const x = headerX + (centerX - headerX) * leaveHeader;
      const y = headerY + (centerY - headerY) * leaveHeader;
      header.dataset.mobileHomeLogo = "true";
      header.style.setProperty("--mobile-logo-x", `${x}px`);
      header.style.setProperty("--mobile-logo-y", `${y}px`);
      const overlaps = [...document.querySelectorAll(".hero-copy, .hero-name, .hero-availability, .contact-copy h2, .contact-direct, .social-links")].some((element) => {
        const rect = element.getBoundingClientRect();
        return x < rect.right + 12 && x + logoWidth > rect.left - 12 && y < rect.bottom + 12 && y + logoHeight > rect.top - 12;
      });
      header.classList.toggle("logo-obstructed", overlaps);
    };
    const requestMobileHomeLogoUpdate = () => {
      if (mobileLogoFrame !== null) return;
      mobileLogoFrame = window.requestAnimationFrame(updateMobileHomeLogo);
    };
    updateMobileHomeLogo();
    window.addEventListener("scroll", requestMobileHomeLogoUpdate, { passive: true });
    window.addEventListener("resize", requestMobileHomeLogoUpdate);
    document.fonts.ready.then(requestMobileHomeLogoUpdate);
  }

  document.querySelectorAll("[data-hero-projects]").forEach((nav) => {
    nav.innerHTML = projectNavMarkup(data.heroProjects);
    nav.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
      const stack = document.querySelector("[data-project-stack]");
      stack?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => stack?.querySelector(`[data-select-project="${CSS.escape(button.dataset.projectName)}"]`)?.click(), 300);
    }));
  });

  function visualProjectMarkup(project) {
    if (!project) return;
    const title = project.href
      ? `<a class="project-title-link" href="${escapeHtml(project.href)}">${escapeHtml(project.title)}</a>`
      : `<span class="project-title-link is-disabled" aria-disabled="true">${escapeHtml(project.title)}</span>`;
    const left = document.querySelector("[data-visual-meta-left]");
    const right = document.querySelector("[data-visual-meta-right]");
    if (left) left.innerHTML = `${title}<small>${escapeHtml(project.category)}</small>`;
    if (right) right.innerHTML = `<span>${escapeHtml(project.year)}</span><small>${escapeHtml(project.role)}</small>`;
  }

  function initSlider({ items, track, prev, next, count, dots }) {
    if (!track || !items.length) return;
    let index = 0;
    let pointerStart = null;
    track.innerHTML = items.map((item, i) => `<div class="slide ${i === 0 ? "is-active" : ""}"><img src="${item.src}?v=2" alt="${item.alt}"></div>`).join("");
    if (dots) dots.innerHTML = items.map((_, i) => `<button type="button" class="${i === 0 ? "is-active" : ""}" aria-label="Go to slide ${i + 1}" aria-current="${i === 0}" data-dot="${i}"></button>`).join("");
    const render = (nextIndex) => {
      index = (nextIndex + items.length) % items.length;
      [...track.children].forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dots && [...dots.children].forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
        dot.setAttribute("aria-current", String(i === index));
      });
      if (count) count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    };
    prev?.addEventListener("click", () => render(index - 1));
    next?.addEventListener("click", () => render(index + 1));
    dots?.addEventListener("click", (event) => { const dot = event.target.closest("[data-dot]"); if (dot) render(Number(dot.dataset.dot)); });
    track.addEventListener("pointerdown", (event) => { pointerStart = event.clientX; });
    track.addEventListener("pointerup", (event) => { if (pointerStart === null) return; const delta = event.clientX - pointerStart; if (Math.abs(delta) > 45) render(index + (delta < 0 ? 1 : -1)); pointerStart = null; });
    track.addEventListener("keydown", (event) => { if (event.key === "ArrowLeft") render(index - 1); if (event.key === "ArrowRight") render(index + 1); });
    track.tabIndex = 0;
  }

  if (page === "home") {
    visualProjectMarkup(data.projects.find((project) => project.slug === data.visualProjectSlug));
    initSlider({ items: data.visualSlides, track: document.querySelector("[data-visual-track]"), prev: document.querySelector("[data-visual-prev]"), next: document.querySelector("[data-visual-next]"), count: document.querySelector("[data-visual-count]") });
    const mobileHomeProjects = document.querySelector("[data-mobile-home-projects]");
    if (mobileHomeProjects) {
      const catalog = document.querySelector("[data-mobile-project-catalog]");
      const carouselProject = data.projects.find((project) => project.slug === data.visualProjectSlug);
      const slides = data.visualSlides;
      let slideIndex = 0;
      let activeProject = null;
      const renderCarousel = () => {
        mobileHomeProjects.innerHTML = `<div class="mobile-feature-carousel"><div class="mobile-feature-track" role="region" aria-roledescription="carousel" tabindex="0" aria-label="Selected project carousel">${slides.map((slide, index) => `<div class="mobile-feature-slide" aria-hidden="${index !== slideIndex}"><img src="${escapeHtml(slide.src)}" alt="${escapeHtml(slide.alt)}"></div>`).join("")}</div><div class="mobile-feature-caption"><a href="index.html#project-${escapeHtml(carouselProject.slug)}">${escapeHtml(carouselProject.caseTitle || carouselProject.title)}</a><p>${escapeHtml(carouselProject.role)} <span>·</span> ${escapeHtml(carouselProject.category)} <span>·</span> ${escapeHtml(carouselProject.year)}</p></div><div class="mobile-feature-dots">${slides.map((_, index) => `<button type="button" data-feature-slide="${index}" aria-label="Show slide ${index + 1}" aria-current="${index === slideIndex}"></button>`).join("")}</div></div>`;
        const track = mobileHomeProjects.querySelector(".mobile-feature-track");
        track.scrollLeft = slideIndex * track.clientWidth;
        track.addEventListener("scroll", () => {
          slideIndex = Math.round(track.scrollLeft / track.clientWidth);
          mobileHomeProjects.querySelectorAll("[data-feature-slide]").forEach((button, index) => button.setAttribute("aria-current", String(index === slideIndex)));
          mobileHomeProjects.querySelectorAll(".mobile-feature-slide").forEach((slide, index) => slide.setAttribute("aria-hidden", String(index !== slideIndex)));
        }, { passive: true });
        track.addEventListener("keydown", (event) => {
          if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
          event.preventDefault();
          const next = Math.max(0, Math.min(slides.length - 1, slideIndex + (event.key === "ArrowRight" ? 1 : -1)));
          track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
        });
      };
      const renderCatalog = () => {
        if (!catalog) return;
        catalog.innerHTML = `<div class="mobile-catalog-list">${data.projects.map((project) => `<a href="${project.href || `index.html#project-${project.slug}`}" data-catalog-project="${escapeHtml(project.slug)}">${escapeHtml(project.title)}</a>`).join("")}</div><div class="mobile-catalog-filters">${["all", "branding", "ux/ui"].map((tag) => `<button type="button" data-catalog-filter="${tag}" aria-pressed="${tag === "all"}">${tag}</button>`).join("")}</div>`;
      };
      const select = () => {
        const project = data.projects.find((item) => location.hash === `#project-${item.slug}`);
        activeProject = project || null;
        if (!project) {
          renderCarousel();
          if (catalog) catalog.hidden = false;
          return;
        }
        closeMobileMenu();
        mobileHomeProjects.innerHTML = mobileProjectMarkup(project);
        initMobileCaseGallery(mobileHomeProjects);
        if (catalog) catalog.hidden = true;
        if (matchMedia("(max-width: 850px)").matches) {
          mobileHomeProjects.scrollIntoView({ block: "start", behavior: "instant" });
          mobileHomeProjects.querySelector("h2").focus({ preventScroll: true });
        }
      };
      renderCatalog();
      select();
      mobileHomeProjects.addEventListener("click", (event) => {
        const dot = event.target.closest("[data-feature-slide]");
        if (dot) mobileHomeProjects.querySelector(".mobile-feature-track")?.scrollTo({ left: Number(dot.dataset.featureSlide) * mobileHomeProjects.querySelector(".mobile-feature-track").clientWidth, behavior: "smooth" });
        if (event.target.closest("[data-next-project]") && activeProject) {
          const index = data.projects.indexOf(activeProject);
          location.hash = `project-${data.projects[(index + 1) % data.projects.length].slug}`;
        }
      });
      catalog?.addEventListener("click", (event) => {
        const filterButton = event.target.closest("[data-catalog-filter]");
        if (!filterButton) return;
        const filter = filterButton.dataset.catalogFilter;
        catalog.querySelectorAll("[data-catalog-filter]").forEach((button) => button.setAttribute("aria-pressed", String(button === filterButton)));
        catalog.querySelectorAll("[data-catalog-project]").forEach((link) => {
          const project = data.projects.find((item) => item.slug === link.dataset.catalogProject);
          link.hidden = filter !== "all" && !project.tags.includes(filter);
        });
      });
      window.addEventListener("hashchange", select);
    }
  }

  function mobileProjectMarkup(project) {
    const metrics = project.achievements || [];
    const gallery = [...new Set([project.image, ...(project.gallery || project.slides?.slice(1) || [])].filter(Boolean))];
    const heading = page === "project" ? "h1" : "h2";
    return `<article class="mobile-case" data-project="${escapeHtml(project.slug)}">
      <section class="mobile-case-gallery" aria-label="${escapeHtml(project.title)} images"><div class="mobile-case-cover" style="--cover-color:${escapeHtml(project.color)};--cover-ink:${contrastInk(project.color)}"><div class="mobile-case-images" role="region" aria-roledescription="carousel" tabindex="0" aria-label="Project image carousel">${gallery.map((src, i) => `<img src="${escapeHtml(src)}" loading="${i === 0 ? "eager" : "lazy"}" alt="${escapeHtml(project.title)} project ${i === 0 ? "cover" : `detail ${i}`}" />`).join("")}</div><${heading} tabindex="-1">${titleMarkup(project.caseTitle || project.title)}</${heading}></div>${gallery.length > 1 ? `<div class="mobile-case-pagination">${gallery.map((_, i) => `<button type="button" data-image-index="${i}" aria-label="Show image ${i + 1}" aria-current="${i === 0}"></button>`).join("")}</div>` : ""}</section>
      <div class="mobile-case-copy">
        <p class="mobile-case-summary">${escapeHtml(project.caseDescription || project.description)}</p>
        <div class="case-details"><div><small>role</small><p>${escapeHtml(project.detailRole || project.role).replace(/\n/g, "<br>")}</p></div><div><small>team</small><p>${project.team?.map(escapeHtml).join("<br>") || "—"}</p></div></div>
        ${metrics.length ? `<small class="metrics-label">achievements</small><div class="case-metrics">${metrics.map(([value, label]) => `<div><strong>${escapeHtml(value)}</strong><p>${escapeHtml(label).replace(/\n/g, "<br>")}</p></div>`).join("")}</div>` : ""}
      </div>
      <nav class="mobile-case-actions" aria-label="Project navigation"><a href="#contacts">Contact me</a><button type="button" data-next-project>Next project &gt;</button></nav>
    </article>`;
  }

  function initMobileCaseGallery(root) {
    const track = root.querySelector(".mobile-case-images");
    if (!track) return;
    const buttons = [...root.querySelectorAll("[data-image-index]")];
    const go = (index) => track.scrollTo({ left: Math.max(0, Math.min(buttons.length - 1, index)) * track.clientWidth, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    buttons.forEach((button, index) => button.addEventListener("click", () => go(index)));
    track.addEventListener("scroll", () => {
      const index = Math.round(track.scrollLeft / track.clientWidth);
      buttons.forEach((button, i) => button.setAttribute("aria-current", String(i === index)));
    }, { passive: true });
    track.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      go(Math.round(track.scrollLeft / track.clientWidth) + (event.key === "ArrowRight" ? 1 : -1));
    });
  }

  if (page === "about") {
    const list = (items, withYear) => items.map((item) => `<div class="resume-row"><div><strong>${item[0]}</strong><small>${item[1]}</small></div>${withYear ? `<time>${item[2]}</time>` : ""}</div>`).join("");
    document.querySelector("[data-experience]").innerHTML = list(data.experience, true);
    document.querySelector("[data-education]").innerHTML = list(data.education, false);
    document.querySelector("[data-achievements]").innerHTML = list(data.achievements, false);
  }

  if (page === "project") {
    document.querySelectorAll(".case-metrics strong").forEach((element) => { element.innerHTML = metricMarkup(element.textContent); });
    const nav = document.querySelector("[data-case-projects]");
    nav.innerHTML = projectNavMarkup(data.projects, "yandex", { includeMore: false });
    nav.querySelectorAll("button").forEach((button) => { button.disabled = button.dataset.projectName !== "yandex"; });
    const yandex = data.projects.find((project) => project.slug === "yandex");
    initSlider({ items: yandex.gallery.map((src, index) => ({ src, alt: `Yandex Education project detail ${index + 1}` })), track: document.querySelector("[data-gallery-track]"), prev: document.querySelector("[data-gallery-prev]"), next: document.querySelector("[data-gallery-next]"), dots: document.querySelector("[data-gallery-dots]") });
    const mobileCase = document.createElement("div");
    mobileCase.className = "mobile-case-page";
    mobileCase.innerHTML = mobileProjectMarkup(yandex);
    document.querySelector("main").prepend(mobileCase);
    initMobileCaseGallery(mobileCase);
    mobileCase.querySelector("[data-next-project]").addEventListener("click", () => { location.href = "index.html#project-everypin"; });
  }
  const refreshLayout = () => {
    document.querySelectorAll("[data-project-stack]").forEach(layoutProject);
    if (window.innerWidth > 850) stackMetrics(document.querySelector(".case-overview .case-metrics"));
    const logo = document.querySelector(".hero .brand-mark");
    const copy = document.querySelector(".hero-copy");
    if (logo && copy && window.innerWidth > 850) {
      const a = logo.getBoundingClientRect();
      const b = copy.getBoundingClientRect();
      logo.style.visibility = a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom ? "hidden" : "visible";
    }
  };
  window.addEventListener("resize", refreshLayout);
  document.fonts.ready.then(refreshLayout);
  refreshLayout();
})();

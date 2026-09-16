(function () {
  const data = window.PORTFOLIO_DATA;
  const page = document.body.dataset.page;

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);

  function headerMarkup() {
    return `
      <a class="header-link brand-link ${page === "home" ? "is-active" : ""}" href="index.html">Alex Fox III</a>
      <a class="header-link ${page === "about" ? "is-active" : ""}" href="about.html">About / CV</a>
      <a class="header-link ${page === "projects" || page === "project" ? "is-active" : ""}" href="projects.html">projects</a>
      <a class="header-link" href="#contacts">contacts</a>`;
  }

  function contactMarkup(projectCopy) {
    const c = data.contact;
    return `
      <div class="brand-mark"><span>alex<br>foxiii</span></div>
      <div class="contact-copy">
        <h2>${projectCopy ? '<span>Did you like the project?<br>Let’s make yours even better.</span> Reach out via any of the channels below' : "Have a project, team or collaboration in mind?<br>Let's talk"}</h2>
        <div class="contact-direct"><a href="${c.phoneHref}">${c.phone}</a><a href="${c.emailHref}">${c.email}</a></div>
        <nav class="social-links" aria-label="Social links">
          ${c.socials.map(([label, href]) => `<a href="${href}" ${href === "#" ? `aria-label="${label} link placeholder"` : 'target="_blank" rel="noopener"'}>${label}</a>`).join("")}
        </nav>
      </div>`;
  }

  function projectNavMarkup(items, active, options = {}) {
    const { includeMore = true, scrollTarget = false } = options;
    return items.map((item) => {
      const name = typeof item === "string" ? item : item.title;
      const slug = typeof item === "string" ? item.toLowerCase() : item.slug;
      return `<button type="button" class="${slug === active ? "is-active" : ""}" ${scrollTarget ? "data-scroll-project" : "data-project-name"}="${escapeHtml(slug)}">${escapeHtml(name)}</button>`;
    }).join("") + (includeMore ? '<span class="more-projects">more projects</span>' : "");
  }

  function projectPanelMarkup(project, index) {
    const role = project.role && project.role !== "—" ? project.role : "case in progress";
    const team = project.team?.length ? project.team.map(escapeHtml).join("<br>") : "—";
    const image = project.image ? `
      <img class="project-panel-image project-panel-image-${escapeHtml(project.imageFit || "contain")}" src="${escapeHtml(project.image)}?v=2" alt="${escapeHtml(project.title)} project visual" data-project-asset>
      <span class="project-asset-fallback" aria-hidden="true">${escapeHtml(project.title)}</span>`
      : `<span class="project-panel-placeholder">${escapeHtml(project.title)}</span>`;
    const action = project.href
      ? `<a class="project-more" href="${escapeHtml(project.href)}">more about project</a>`
      : '<span class="project-more is-disabled">more about project</span>';
    const achievements = project.achievements?.length ? `
      <div class="project-achievements">
        ${project.achievements.map(([value, label]) => `<div><strong>${escapeHtml(value)}</strong><p>${escapeHtml(label).replace(/\n/g, "<br>")}</p></div>`).join("")}
      </div>` : "";

    return `
      <article class="project-panel" id="project-${escapeHtml(project.slug)}" data-header-theme="dark" style="--panel-color:${escapeHtml(project.color)};--stack-index:${index + 1}">
        <div class="project-panel-nav-wrap">
          <nav class="project-nav project-panel-nav" aria-label="Projects">${projectNavMarkup(data.projects, project.slug, { includeMore: false, scrollTarget: true })}</nav>
          <p class="project-scroll-hint">scroll down or click</p>
        </div>
        <div class="project-filters">${project.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="project-panel-copy">
          <h2>${escapeHtml(project.description)}</h2>
          ${action}
          <div class="project-specs"><div><small>role</small><p>${escapeHtml(role)}</p></div><div><small>team</small><p>${team}</p></div></div>
          ${achievements}
        </div>
        <div class="project-panel-dots" aria-hidden="true">${[0, 1, 2, 3].map((dot) => `<i class="${dot === index % 4 ? "is-active" : ""}"></i>`).join("")}</div>
        <a class="project-panel-art ${project.href ? "" : "is-disabled"}" href="${escapeHtml(project.href || "#")}" aria-label="${project.href ? `Open ${escapeHtml(project.title)} case study` : `${escapeHtml(project.title)} case study is not published yet`}">
          <div class="project-panel-meta"><div><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.category)}</small></div><div><strong>${escapeHtml(project.year)}</strong><small>${escapeHtml(project.role)}</small></div></div>
          ${image}
        </a>
      </article>`;
  }

  document.querySelector("[data-site-header]").innerHTML = headerMarkup();
  document.querySelectorAll("[data-project-stack]").forEach((root) => { root.innerHTML = data.projects.map(projectPanelMarkup).join(""); });
  document.querySelectorAll(".contact-section").forEach((node) => { node.innerHTML = contactMarkup(node.classList.contains("project-contact")); });

  document.addEventListener("click", (event) => {
    const disabled = event.target.closest("a.is-disabled");
    if (disabled) event.preventDefault();
    const button = event.target.closest("[data-scroll-project]");
    if (button) button.closest("[data-project-stack]")?.querySelector(`#project-${CSS.escape(button.dataset.scrollProject)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.addEventListener("error", (event) => {
    if (event.target.matches?.("img[data-project-asset]")) event.target.closest(".project-panel-art")?.classList.add("has-asset-error");
  }, true);

  const header = document.querySelector("[data-site-header]");
  const themedSections = [...document.querySelectorAll("[data-header-theme]")];
  const updateHeaderTheme = () => {
    const y = Math.max(40, window.innerHeight * 0.08);
    const active = themedSections.find((section) => { const rect = section.getBoundingClientRect(); return rect.top <= y && rect.bottom > y; });
    header.dataset.theme = active?.dataset.headerTheme || "muted";
  };
  updateHeaderTheme();
  window.addEventListener("scroll", updateHeaderTheme, { passive: true });

  document.querySelectorAll("[data-hero-projects]").forEach((nav) => {
    nav.innerHTML = projectNavMarkup(data.heroProjects);
    nav.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
      document.querySelector(`#project-${CSS.escape(button.dataset.projectName)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    if (dots) dots.innerHTML = items.map((_, i) => `<button type="button" class="${i === 0 ? "is-active" : ""}" aria-label="Go to slide ${i + 1}" data-dot="${i}"></button>`).join("");
    const render = (nextIndex) => {
      index = (nextIndex + items.length) % items.length;
      [...track.children].forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dots && [...dots.children].forEach((dot, i) => dot.classList.toggle("is-active", i === index));
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
  }

  if (page === "about") {
    const list = (items, withYear) => items.map((item) => `<div class="resume-row"><div><strong>${item[0]}</strong><small>${item[1]}</small></div>${withYear ? `<time>${item[2]}</time>` : ""}</div>`).join("");
    document.querySelector("[data-experience]").innerHTML = list(data.experience, true);
    document.querySelector("[data-education]").innerHTML = list(data.education, false);
    document.querySelector("[data-achievements]").innerHTML = list(data.achievements, false);
  }

  if (page === "project") {
    const nav = document.querySelector("[data-case-projects]");
    nav.innerHTML = projectNavMarkup(data.projects, "yandex", { includeMore: false });
    nav.querySelectorAll("button").forEach((button) => { button.disabled = button.dataset.projectName !== "yandex"; });
    initSlider({ items: [{ src: "assets/yandex-gallery-1.png", alt: "Yandex Education interface overview" }, { src: "assets/yandex-gallery-2.png", alt: "Yandex Education lesson screen" }], track: document.querySelector("[data-gallery-track]"), prev: document.querySelector("[data-gallery-prev]"), next: document.querySelector("[data-gallery-next]"), dots: document.querySelector("[data-gallery-dots]") });
  }
})();

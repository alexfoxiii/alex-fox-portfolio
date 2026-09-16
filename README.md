# Alex Fox III portfolio

Static portfolio rebuilt from the supplied Figma file with HTML, CSS and vanilla JavaScript.

## Run locally

Serve `dist/` with any static server, for example:

```sh
python3 -m http.server 8000 --directory dist
```

Then open `http://localhost:8000`.

## Structure

- `dist/index.html` — home page
- `dist/projects.html` — stacked projects index
- `dist/project.html` — Yandex case page
- `dist/about.html` — about/CV page
- `dist/data.js` — centralized project and contact content
- `dist/app-v2.js` — shared rendering and slider behavior
- `dist/styles.css` — desktop-first styling with a mobile-ready breakpoint
- `dist/assets/` — local Figma exports

## Content placeholders

- Project copy and artwork not yet present in Figma remain clearly marked as unpublished.
- CV link remains a placeholder until the PDF is supplied.
- LinkedIn, Telegram and design-channel URLs remain placeholders.

The GitHub Pages workflow publishes the contents of `dist/` without a build step.

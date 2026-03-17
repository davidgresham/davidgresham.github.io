# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Personal academic website for Professor David Gresham (NYU Department of Biology).
Hosted on GitHub Pages at **https://davidgresham.github.io**.

No build step. No npm. Plain HTML, CSS, and vanilla JavaScript. Dependencies loaded from CDN only.

## File Structure

```
index.html          — Home page
research.html       — Research page
publications.html   — Publications page (content rendered from JSON)
contact.html        — Contact page
css/style.css       — All styles (single stylesheet, CSS variables at top)
js/main.js          — Shared JS: mobile nav, active link highlighting, contact form
js/publications.js  — Fetches data/publications.json and renders the publications list
data/publications.json — Publication data (edit this to add/update papers)
images/             — Place headshot and any other images here
```

## Updating Publications

Edit `data/publications.json` only — never edit the hardcoded HTML for publications.
Each entry:
```json
{
  "title":   "Title, <em>italics ok</em>",
  "authors": "Smith J, Jones A, Gresham D",
  "journal": "Journal Name",
  "year":    2025,
  "doi":     "10.1000/xyz123",
  "links": [
    { "label": "DOI",  "url": "https://doi.org/10.1000/xyz123", "icon": "fa-solid fa-file-lines" },
    { "label": "Code", "url": "https://github.com/...",          "icon": "fa-brands fa-github" }
  ]
}
```

- `"Gresham D"` is bolded automatically in the rendered author list
- Year filter buttons are generated from the data — no HTML changes needed
- Papers with `year < 2021` are grouped under "Earlier Publications"
- Links with an empty `url` (`""`) are silently skipped

## Design System

CSS custom properties are defined at the top of `css/style.css`:

| Variable | Value | Usage |
|---|---|---|
| `--nyu-purple` | `#57068c` | Primary brand color |
| `--nyu-purple-dark` | `#3d0466` | Hover states, gradients |
| `--nyu-purple-pale` | `#f3eaf8` | Backgrounds, tags |
| `--max-width` | `1100px` | Page content width |

Fonts: **Inter** (body) and **Playfair Display** (headings) via Google Fonts CDN.
Icons: **Font Awesome 6.5** via jsDelivr CDN.

## Local Development

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

The site must be served over HTTP (not opened as `file://`) because `publications.js`
uses `fetch()` to load the JSON file.

## Deployment

Push to `main` — GitHub Pages deploys automatically (no CI configuration needed).

## What NOT to Do

- Do not add a build system, bundler, or `package.json`
- Do not edit `man/` or auto-generated files (there are none here, but keep it that way)
- Do not hardcode publication entries in `publications.html` — use the JSON file
- Do not edit `css/style.css` class names without checking all four HTML files for usages

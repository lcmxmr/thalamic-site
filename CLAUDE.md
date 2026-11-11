# CLAUDE.md

The website for Thalamic, live at https://thalamic.uk. Plain static HTML/CSS/JS with no build step; README.md maps every file.

## Publishing

- **A push to `main` is a publish.** GitHub Pages deploys every push to `main` within a minute or two (`.github/workflows/pages.yml`). Commit and push when the user asks for a change to go live; don't push half-finished work.
- **Two people edit this repo** (Majid Zamani and Luca Meyer). Run `git pull --rebase` before starting work and again before pushing. Never force-push, and never rewrite history that is already on GitHub.
- **The repo is public.** Nothing private goes in it: no business documents, drafts or credentials.
- After a push, check that the run under the repo's Actions tab succeeded, then confirm the change on https://thalamic.uk.

## Editing

- Preview locally with `python3 -m http.server 8000` and open http://localhost:8000. Check every changed page at phone width (about 390px) as well as desktop: no horizontal scrolling, nothing overlapping.
- Shared styling lives in `site.css` (colour and type tokens at the top) and shared behaviour in `site.js`. Reuse the existing classes; don't add inline `style` attributes.
- The four pages repeat the same header and footer markup. A change to either goes into all four.
- `team.html` makes factual claims about real people. Change a person's entry only when that person has asked for it.
- Portraits in `people/` are 640×640 JPEGs.
- Keep paths relative (`site.css`, not `/site.css`).

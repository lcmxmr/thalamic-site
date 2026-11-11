# Thalamic — spin-out site

Static site ported from the Claude Design project `3d46b62b-b1ae-4324-ad11-a875011c40ea` ("Brain-Computer Interface Startup Design"). No build step: open `index.html`, or serve the directory with any static server.

```
index.html        home        <- ported from Thalamic.dc.html (complete source)
technology.html   Technology  <- ported from Technology.dc.html (TRUNCATED source, see below)
team.html         Team        <- no design source; written in the same design language
careers.html      Careers     <- no design source; written in the same design language
site.css          shared tokens + components (colours, type scale, layout)
site.js           shared behaviour (URL switches + scroll reveal)
hero-signal.js    the hero background field (index only)
image-slot.js     vendored verbatim from the design project
hero-preview.html scratch page comparing the three hero fields (not published) — delete once one is chosen
CLAUDE.md         instructions for Claude Code when it edits this repo
logo/             brand assets (see below)
people/           founder portraits, 640×640 (team.html)
```

## Working on the site

Live at https://thalamic.uk, served by GitHub Pages from this repo. **Every push to `main` goes live** within a minute or two: `.github/workflows/pages.yml` copies the site files and publishes them, whoever pushed. Progress shows under the repo's **Actions** tab.

1. Pull first, so you start from the other editor's latest changes.
2. Edit, and preview locally: `python3 -m http.server 8000` in the repo, then open http://localhost:8000.
3. Commit and push to `main`.

The workflow publishes everything except this README, `CLAUDE.md`, `.github/`, `hero-preview.html` and `logo/make-outlined-lockup.py`. The repo itself is public, so nothing private belongs in it.

## Logo

Nothing is inlined into the markup, so replacing a file in `logo/` updates every page.

```
DELIVERED — geometry is fixed; only the accent colour has been changed
  thalamic-mark-{light,dark}-bg.svg      icon only
  thalamic-lockup-{light,dark}-bg.svg    icon + wordmark
GENERATED from those — all regenerable
  thalamic-lockup-{light,dark}-bg-web.svg  the masthead lockup
  favicon.svg                              browser tab
  apple-touch-icon.png                     180×180, iOS home screen
  make-outlined-lockup.py                  builds the two -web lockups
```

Which file goes where: the **masthead uses `-web` light-bg** at `height:42px` (`.wordmark__lockup`); the **contact footer uses the plain dark-bg mark** at 30px (`.colophon__mark`), since the copyright line beside it already says the name. The site is light-only, so everything else is `-light-bg`.

### Colour

The delivered assets draw the chip frame, the frame ticks and the wordmark's period in lavender `#9184d9`. That was replaced on request by the site accent, so the lockup's period is now exactly the colour of the accent period in the page headlines ("…the signal begins**.**"). Geometry is untouched; only the fill/stroke changed, and the originals are in git history.

The swap follows the same light/dark split the stylesheet uses, because one value cannot serve both grounds — `--accent` at L=0.45 is unreadably dark on the `#1C1C18` footer:

| Colourway | Was | Now | Token |
| --- | --- | --- | --- |
| `-light-bg`, `apple-touch-icon` | `#9184d9` | `#2b4bad` | `--accent`, `oklch(0.45 0.16 266)` |
| `-dark-bg` | `#9184d9` | `#6f94ee` | `--accent-lift`, `oklch(0.68 0.14 266)` |

`favicon.svg` needed one extra change: its frame previously had no `prefers-color-scheme` flip, which was fine for a mid-tone lavender but not for a dark indigo on a dark tab strip. The frame now flips with the trace. The hex values above are the browser's own sRGB resolution of those two `oklch()` tokens, sampled rather than converted by hand — if the accent is ever retuned in `site.css`, re-sample rather than eyeballing a replacement.

### Why the masthead uses a generated lockup

The delivered lockups set "thalamic." as live `<text>` in **Inter Medium**. Inter is not a system font on macOS or Windows and the site does not load it, so as an `<img>` the wordmark silently falls back to Helvetica/Arial — different letterforms, different advance width, different per platform. `make-outlined-lockup.py` converts those glyphs to `<path>` outlines against the real Inter, which makes the file self-contained and identical everywhere. It also trims the viewBox to the ink: the delivered file leaves ~28% of its width as trailing whitespace after the wordmark, which is a layout hazard inside a flex masthead.

The script takes the mark geometry, text position/size/tracking and both colourways from the delivered files unchanged — only `<text>` becomes `<path>`. It needs Inter Medium as a TTF (the Google Fonts URL is in its docstring):

```
cd logo && python make-outlined-lockup.py /path/to/inter500.ttf
```

Verified by rendering the delivered lockup in headless Chrome *with* the real Inter webfont and pixel-diffing it against the generated file: the only difference is a 1px antialiasing hairline at the glyph edges, which is what text-vs-path rasterisation always produces. No positional or kerning shift.

### The two icons

- `favicon.svg` — the mark cropped to its tick bounds with heavier strokes (1.6→2.2, 1.8→2.6). The delivered mark is drawn for display sizes; its 1.6-unit strokes on a 64 viewBox collapse into a purple speck in a 16px tab. An internal `prefers-color-scheme` block flips the trace so it reads on both light and dark tab strips (Chrome/Firefox honour it; Safari takes the light default).
- `apple-touch-icon.png` — iOS ignores transparency and applies its own corner radius, so this is the mark at 134px centred on a 180px `--paper` field. Regenerate with headless Chrome:
  ```
  chrome --headless --window-size=180,180 --force-device-scale-factor=1 \
         --screenshot=logo/apple-touch-icon.png file://<wrapper.html>
  ```

**Don't place the delivered mark below ~28px on a page** — that is where the frame ticks stop resolving, and why `.colophon__mark` is pinned at 30px. Use `favicon.svg` for anything smaller.

## Typography

The delivered lockup sets "thalamic." in **Inter Medium** and cannot be re-cut, while the design project's display face is Instrument Serif — two very different voices sitting 20px apart in the masthead. Since the brand is the fixed point, the page moves. Chosen with `?type=`:

| Setting | Display | Body / nav | Notes |
| --- | --- | --- | --- |
| `?type=unified` *(default)* | Inter | Inter | One face, matching the wordmark exactly. IBM Plex Mono still carries the FIG. captions, spec tables and pipeline, which is where the design's character actually lives. |
| `?type=editorial` | Instrument Serif | Inter | Two voices instead of three: the logo matches the body and nav it sits beside, and the serif becomes a deliberate display accent rather than a competing face. |
| `?type=original` | Instrument Serif | Instrument Sans | The design project as delivered. |

The default is on `<html>` in the markup, so it holds without scripting; `site.js` only overrides it when the query string asks. Display sizing travels with the face (`--dw` / `--dt` / `--dl` / `--tt`): Instrument Serif is a display serif with a small x-height, so Inter Medium at the same nominal size reads ~20% larger and sets ~20% wider. Under `unified` the display steps down (92→78px hero, 84→70px sub-hero, 76→64px contact) and the raster field's mask starts further right to stay clear of the longer lines.

Once a setting is chosen, drop the unused families from the `<link>` in each page's `<head>` — all four are currently loaded so the switch works.

## Hero signal field

The hero has an ambient background canvas, chosen with `?hero=`:

| Variant | What it is |
| --- | --- |
| `?hero=raster` *(default)* | Continuous wideband traces, one per channel, drifting right. At the hairline gate the waveform stops and each spike deflection carries on as a discrete accent tick on the same row — the same event, now a symbol. What crosses the skull is the reduced stream, never the waveform. |
| `?hero=threshold` | One wideband trace against a dashed detection threshold. Each crossing marks the threshold line and drops an event onto the train below. |
| `?hero=lattice` | Orthogonal on-die routing with vias at the bends. The geometry is static; only the accent pulses move. |
| `?hero=off` | No field. |

All three are seeded (identical on every load), masked so they only emerge to the right of the type, hidden below 900px, paused off-screen and in background tabs, and frozen to a single still frame under `prefers-reduced-motion`. To make a variant permanent, change `DEFAULT` at the top of `hero-signal.js` and delete the other two blocks.

## What the port changed

The `.dc.html` files only run inside the Claude Design host: `support.js` is that host's runtime and throws unless `window.React` has been injected, and `<sc-if>` / `DCLogic` are authoring constructs rather than browser features. Copying them verbatim would produce a blank page, so those constructs were resolved into real code — the design's own values (colours, type scale, `clamp()` sizes, spacing) are carried over unchanged.

- `<sc-if>` tone branches → all three hero registers stay in the markup, selected by `data-tone` on `<html>`. Default `quiet`, matching the design's default prop; `?tone=visionary` and `?tone=human` reach the others.
- `showPipeline` prop → `data-pipeline` on `<html>`; `?pipeline=off` hides the FIG. 01 data-path strip.
- `DCLogic.componentDidMount` reveal → a plain `IntersectionObserver` in `site.js`, same 18px / 0.8s motion. The hidden state is applied *from* JS and skipped under `prefers-reduced-motion`, so content stays visible without scripting.
- Inline `style` attributes → classes in `site.css`.

`image-slot.js` is vendored unmodified so the figure placeholders keep their drop-to-fill behaviour. Dropped images persist only inside the design host (they need its sidecar bridge); everywhere else the slot is read-only and shows its placeholder.

## Content provenance

Not everything on these pages came from the design project, and the parts that didn't should be reviewed as copy rather than trusted as design.

- **`index.html`** is a faithful port. Every word is from `Thalamic.dc.html`.
- **`technology.html`** — the design source is **truncated in the project itself**: it ends mid-attribute (`<div style="background:#F7`) partway through the first stats grid, then jumps straight to `</x-dc>`. The hero and section 01 (heading, paragraph) are verbatim. The four stat cells that complete the cut-off grid, and sections 02–04, were written here in the same language, using only figures already stated elsewhere in the design (10,000+ channels, Gb/s raw, single-digit mW thermal budget, ~1000× reduction). Nothing is a measured result — the page says so.
- **`team.html`** — no design source. Section 01 carries the real founders, so it is the one page on the site making factual claims about identifiable people: each founder approves their own entry. Neither entry claims an operational title (CEO/CTO); both read "Co-founder". Portraits live in `people/` at 640×640. The rest of the page (disciplines, joining) is written copy, not sourced.
- **`careers.html`** — no design source. The four listings are role *categories*, not live requisitions.

The email addresses (`hello@`, `partnerships@`, `careers@thalamic.io`) come from the design and are presumably not yet real.

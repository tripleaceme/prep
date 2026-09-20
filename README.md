# Prep — Behind The Data Academy

A realistic voice interview simulator for data and analytics roles. Paste the job description you're actually applying for, answer questions out loud, and find out what you can explain before the interviewer asks.

## Why it exists

Generic interview question lists don't tell you much. Knowing an answer and being able to explain it clearly under pressure are two different skills, and only the second one gets tested in the room. Prep is built to practise the second one.

Instead of a score, a session ends with the concepts you struggled to explain and the areas worth reviewing before you interview for real.

## What it does

- **Practise against a real role** — paste a job description, or build a practice role from a title, company and industry.
- **Business or technical tracks** — business-judgment questions grounded in an industry (fintech, FMCG, e-commerce), or technical questions scoped to the tools and stage of the role.
- **Spoken answers** — questions are answered out loud, the way they will be in the interview.
- **Concept-level feedback** — specific topics to revisit, not a generic study list. Run it again once you've closed the gaps.

## Project structure

```text
index.html            Landing page — what Prep is, who it's for, how it works
app.html              The interview simulator itself

favicon.svg           Logo mark, vector
favicon.ico           16/32/48 raster fallback for older browsers
apple-touch-icon.png  180px, iOS home screen
icon-192.png          PWA icon
icon-512.png          PWA icon / Organization logo
og-image.png          1200×630 social share card
site.webmanifest      Install metadata
robots.txt            Crawl rules
sitemap.xml           Search engine sitemap
```

Two standalone HTML pages. No build step, no bundler, no dependencies to install — all styles and scripts are inline, with fonts loaded from Google Fonts.

### SEO notes

`index.html` is the indexable entry point and carries the full set of meta, Open Graph and Twitter tags plus JSON-LD structured data (`Organization`, `WebSite`, `SoftwareApplication` and `FAQPage`). The FAQ structured data mirrors the visible FAQ copy exactly — if you edit one, edit the other, or the rich result becomes ineligible.

`app.html` is set to `noindex, follow`. It's an app shell with almost no crawlable copy, so the landing page carries the ranking while links from the app still pass crawl equity back. It is deliberately *not* blocked in `robots.txt`, because a crawler has to be able to fetch the page to read the `noindex` tag.

Absolute URLs in the canonical, Open Graph and manifest entries point at `https://prep.behindthedata.tech/`. If the domain changes, update them in both HTML files, `site.webmanifest`, `robots.txt` and `sitemap.xml`.

## Running it locally

Open `index.html` in a browser.

Some browsers restrict microphone access on `file://` pages. If speech input doesn't start, serve the folder over HTTP instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## API key

Prep is bring-your-own-key and talks to the Gemini API directly from the browser. The key is stored in `localStorage` on your own machine — it is never sent anywhere except to Google's API, and no interview content leaves your browser for any server of ours.

Because the key lives client-side, use a key you're comfortable having in the browser and set usage limits on it.

## Installing it as an app

Prep is a PWA, so it can be added to a phone's home screen and opens without browser chrome.

The offer is a slim dismissible strip under the header — the same pattern as the install banner in `session-companion` — rather than a permanent button in the menu, so it costs nothing once someone has installed or said no. `pwa.js` renders it into `#installSlot` on both pages.

It appears only when there is something to offer:

- **Chromium (Android, Chrome, Edge)** — the browser fires `beforeinstallprompt`, so the strip offers a real **Install** button.
- **iOS / Safari** — never fires that event and cannot install programmatically, so the strip offers **How**, which expands to name the two taps it actually takes.
- **Anything else** — a desktop browser that neither fires the event nor has a manual route gets no strip at all.

Dismissal is remembered in `localStorage` under `prep.install-dismissed`, and the strip disappears for good once the app is installed or launched standalone.

`sw.js` precaches the shell so the app opens offline. It deliberately handles **only same-origin GET** requests: the Gemini calls are POSTs and one is an SSE stream, and intercepting those is the usual way a service worker breaks a working app. Anything else falls through to the browser untouched.

HTML is network-first so a deploy is picked up rather than pinned, with the cache as the offline fallback. Other assets are stale-while-revalidate.

**When you change a shell file, bump `CACHE_VERSION` in `sw.js`.** Otherwise installed users keep the old cached copy until it happens to revalidate.

## Languages

Prep runs in English, French and German. The choice is made in the app's sidebar (**Language**, above the API key) or from the selector in the landing page header, and it is stored per browser and shared by both pages.

Picking a language switches everything: the interface, the interviewer's spoken questions, the speech recognition locale and the written feedback. A French session is a French interview, not an English one with translated buttons.

`i18n.js` holds the translations and is the one file shared by both pages. Strings are keyed by their **English source text** rather than by invented keys, which means:

- No `data-i18n` attributes are needed in the markup.
- Anything missing from a dictionary simply stays in English rather than rendering a raw key.
- Brand and product names (Prep, dbt, Snowflake, Airflow) are deliberately absent from the dictionaries, so they pass through untouched.

Content the app renders after load is caught by a `MutationObserver`, and the original English is cached on each node so switching back restores the source text rather than translating a translation.

To add a language: add an entry to `LANGS`, add a dictionary under `DICT`, and add the option to the picker in `app.html` and the `<select>` in `index.html`. Keys must match the English source exactly, punctuation included.

Note that the tier values `Surface`, `Working` and `Strong` are pinned to English in the model's JSON response because the app uses them as keys; only the text shown to the reader is translated.

## Deployment

Deployed on Vercel as a static site at **[prep.behindthedata.tech](https://prep.behindthedata.tech)**. There is no build step — Vercel serves the files as they are, so the Build Command stays empty and the Output Directory is the repository root.

DNS: point `prep` at Vercel with a CNAME to `cname.vercel-dns.com`, then add the domain in the Vercel project settings.

`vercel.json` holds the response headers:

- **Content-Security-Policy** — locked down to what the app actually uses: inline styles and scripts, Google Fonts, `blob:` audio for the interviewer's voice, and `connect-src` limited to the Gemini API. Nothing else can be loaded or called.
- **Permissions-Policy** — `microphone=(self)`, with camera, geolocation, payment and USB switched off.
- Caching: HTML always revalidates so edits appear immediately; icons and images are cached for a day with a week of stale-while-revalidate.
- `/index.html` permanently redirects to `/` so the canonical URL is the only indexed one.

If you change what the app loads — a new font host, an analytics script, a different model endpoint — update the CSP or the browser will silently block it.

## Status

Active development.

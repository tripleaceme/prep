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

## Status

Active development. Deployment target and domain aren't fixed yet.

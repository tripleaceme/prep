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

```
index.html   Landing page — what Prep is, who it's for, how it works
app.html     The interview simulator itself
```

Two standalone HTML files. No build step, no bundler, no dependencies to install — all styles and scripts are inline, with fonts loaded from Google Fonts.

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

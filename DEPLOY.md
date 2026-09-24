# Deploying Prep

Prep runs on two machines, because go54's MySQL can only be reached from inside
go54 and Vercel is a different box:

```
  Vercel                          go54 (cPanel)
┌──────────────────┐            ┌────────────────────────┐
│ Next.js          │  HTTPS     │ api/  (PHP)            │
│ pages, sessions  │ ─────────► │   ↓ localhost only     │
│                  │  signed    │ MySQL                  │
└──────────────────┘            └────────────────────────┘
   prep.behindthedata.tech        api.behindthedata.tech
```

MySQL is never exposed to the internet. **Leave Remote MySQL switched off.**

Work through Part A first — nothing on Vercel works until go54 answers.

---

## Part A — go54 (cPanel)

### A1. Set the PHP version

cPanel → **Software** → **MultiPHP Manager**. Select the domain and set
**PHP 8.1 or newer**. Prep refuses to run on 8.0 and will tell you so plainly
rather than returning a blank error.

### A2. Create the database

cPanel → **Databases** → **MySQL® Databases**.

1. Under *Create New Database*, name it `prep`. cPanel prefixes it with your
   account name, so you end up with something like `behindt_prep`. **Write down
   the full name including the prefix.**
2. Under *MySQL Users → Add New User*, create `prepuser` with a strong
   password. Again the real name will be `behindt_prepuser`. Write it down.
3. Under *Add User To Database*, pick that user and that database, click **Add**,
   tick **ALL PRIVILEGES**, and save.

### A3. Import the schema

cPanel → **Databases** → **phpMyAdmin**.

1. Pick your `..._prep` database in the left sidebar.
2. Click the **Import** tab.
3. Choose the file `db/schema.sql` from this repository and click **Import**.

You should end up with six tables: `users`, `auth_tokens`, `interviews`,
`reports`, `coding_attempts`, `activity_days`.

### A4. Create a home for the API

This is the part that needs deciding, so here is the exact answer.

**Make a subdomain rather than putting it inside the main site.** A subdomain
gets its own folder and its own `.htaccess`, so the API can't collide with
whatever rules the main site already has.

cPanel → **Domains** → **Create A New Domain**:

- Domain: `api.behindthedata.tech`
- **Untick** "Share document root with behindthedata.tech"
- Document root: leave the default, which will be something like
  `/home/behindt/api.behindthedata.tech`

Note that document root path. That folder is where the API goes.

> **If you'd rather not add a subdomain**, you can instead upload into
> `public_html/api/`, and the API will be at `https://behindthedata.tech/api`.
> Both work. The subdomain is cleaner; the folder is fewer steps.

### A5. Upload the API

cPanel → **Files** → **File Manager**. Navigate into the document root from A4
(or `public_html/api`).

First, turn on hidden files — **Settings** (top right) → tick **Show Hidden
Files (dotfiles)** → Save. Without this you cannot see or create `.htaccess`
or `.env`.

**Upload all eleven files, including both folders.** `index.php` on its own
does nothing but crash: its first job is to `require` the files in `lib/` and
`routes/`, and a missing one is a fatal error that returns an empty HTTP 500
with no message explaining why.

When you are finished the folder must look exactly like this:

```
/home/behindt/api.behindthedata.tech/
├── .htaccess
├── index.php
├── lib/
│   ├── .htaccess
│   ├── config.php
│   ├── db.php
│   ├── http.php
│   └── mail.php
└── routes/
    ├── .htaccess
    ├── analytics.php
    ├── auth.php
    ├── interviews.php
    └── profile.php
```

**The reliable way** — File Manager's uploader does not handle folders:

1. On your Mac, open the repo's `api/` folder.
2. Select everything *inside* it (`index.php`, `lib`, `routes`, `.htaccess`) —
   not the `api` folder itself — and compress the selection to a zip.
3. Upload that zip into the document root, then use File Manager's **Extract**.
4. Delete the zip afterwards.

The one thing to check after extracting: `index.php` must sit directly in the
document root. If you end up with
`/home/behindt/api.behindthedata.tech/api/index.php` — an extra `api` level —
move everything up one folder.

> `.htaccess` files are hidden. If you can't see them after extracting, you
> skipped the "Show Hidden Files" step above. Without the top-level one,
> nothing routes and every URL 404s.

### A6. Generate the two secrets

On your Mac, run this twice and keep both values:

```bash
openssl rand -hex 32
```

- The **first** value is `API_SHARED_SECRET`. It goes in *both* the `.env` you
  create in A7 and in Vercel. They must match character for character.
- The **second** value is `SESSION_SECRET`. It goes in Vercel only. Changing it
  later signs everyone out, which is the intended emergency lever.

### A7. Create the `.env` file — OUTSIDE the web root

⚠️ **Do not put this beside `index.php`.** This host runs nginx in front of
Apache, and nginx serves static files itself without ever reading `.htaccess`.
A `.env` inside the web root is readable at `https://api.behindthedata.tech/.env`
— database password and all. The `.htaccess` deny rule does not save you.

In File Manager, go **one level above** the document root — if your API is at
`/home/behindt/api.behindthedata.tech`, that means `/home/behindt`. Create a
folder called `prep-config`, and inside it a file called `.env`:

```
/home/behindt/
├── prep-config/
│   └── .env          ← here: no URL can reach this
└── api.behindthedata.tech/
    ├── index.php
    ├── lib/
    └── routes/
```

The API looks there first and falls back to `api/.env` only if nothing is
found. `/health` and `scripts/check-api.mjs` both fail loudly if it ever finds
the fallback, so this cannot silently regress.

Paste this into that file:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=behindt_prep
DB_USER=behindt_prepuser
DB_PASS=the-password-from-A2
API_SHARED_SECRET=the-first-openssl-value
APP_URL=https://prep.behindthedata.tech
MAIL_FROM="Prep <no-reply@behindthedata.tech>"
RESEND_API_KEY=
```

Replace `behindt_...` with the real prefixed names from A2. Save.

### A8. Email, for resets and confirmations

Two things send email: password resets, and the confirm-your-email link sent
at registration. Deliverability decides whether a locked-out user can ever get
back in, and shared hosts get filtered to spam routinely.

You already have a Resend account from PhD Scout. In Resend, verify
`behindthedata.tech` as a sending domain (it gives you DNS records to add in
go54), then create an API key and put it in `RESEND_API_KEY` above.

If you leave `RESEND_API_KEY` blank the flow still works — it falls back to PHP
`mail()` — but expect resets to land in spam until the domain is verified.

---

## Part B — Vercel

### B1. Deploy

Push this repo to GitHub, then in Vercel → **Add New → Project** → import
`tripleaceme/prep`. Vercel detects Next.js; leave the build settings alone.

### B2. Environment variables

Project → **Settings** → **Environment Variables**. Add these for
*Production, Preview and Development*:

| Name | Value |
|---|---|
| `PREP_API_URL` | `https://api.behindthedata.tech` (no trailing slash) |
| `API_SHARED_SECRET` | the **first** openssl value from A6 |
| `SESSION_SECRET` | the **second** openssl value from A6 |
| `NEXT_PUBLIC_SITE_URL` | `https://prep.behindthedata.tech` |
| `ANALYTICS_USERNAME` | whatever username you want for `/analytics` |
| `ANALYTICS_PASSWORD_HASH` | output of the command in B3 |

If you used `public_html/api` instead of a subdomain, `PREP_API_URL` is
`https://behindthedata.tech/api`.

Redeploy after adding them — Vercel does not pick up new variables on an
existing build.

### B3. Analytics credentials

The analytics dashboard has its own login, entirely separate from user
accounts — there is no admin row in the database, so there is nothing to find
or escalate to. Generate the hash locally:

```bash
node scripts/make-admin-password.mjs 'a-long-password-you-will-remember'
```

It prints the two environment variables to paste into Vercel. The plaintext is
never stored anywhere — not in this repo, not in the database, not in Vercel.
Clear it from your shell history afterwards:

```bash
history -d $(history 1)
```

### B4. Domain

Project → **Settings** → **Domains** → add `prep.behindthedata.tech`.

⚠️ **The gotcha that already bit this domain once**: go54's DNS auto-creates an
`A` record *and* an `SPF TXT` record on `prep`. A `CNAME` cannot coexist with
any other record at the same name, so the Vercel CNAME silently fails to
resolve. In the go54 DNS editor, **delete both the A record and the TXT record
on `prep`** before adding Vercel's CNAME.

---

## Part C — Verify before trusting it

From the `prep/` directory on your Mac, with `.env.local` filled in the same
way as B2:

```bash
node scripts/check-api.mjs
```

A healthy deployment prints:

```
  PHP version   8.2.x
  Database      connected

✓ Everything is wired up correctly.
```

Then open `https://prep.behindthedata.tech/register`, create an account, and
walk through onboarding. If the dashboard loads with your name on it, both
halves are talking to each other.

Finally, open `https://prep.behindthedata.tech/analytics` and sign in with the
credentials from B3. You should see your own signup in the funnel.

---

## Troubleshooting

| What you see | What it means |
|---|---|
| **Empty 500 on every URL, no error text** | `lib/` or `routes/` didn't get uploaded. `index.php` alone cannot run — it `require`s them on its first lines, and a missing one is a fatal error with no output. Re-do A5 and upload all eleven files. Confirm with `api/_diag.php`. |
| `The API returned HTML rather than JSON` | `PREP_API_URL` points at the wrong folder, or `.htaccess` didn't upload. Check hidden files are visible in File Manager. |
| `Unsigned request` | The `X-Prep-*` headers are being stripped. Confirm `.htaccess` is present in the API root and `mod_rewrite` is on. |
| `Bad signature` | `API_SHARED_SECRET` differs between `api/.env` and Vercel. Re-paste both; watch for trailing spaces. |
| `Signature expired` | The go54 server clock is more than 5 minutes off. Raise it with support. |
| `Prep requires PHP 8.1 or newer` | Go back to A1. |
| `Missing tables` | The schema import in A3 didn't run. Re-import `db/schema.sql`. |
| `Database unavailable` | `DB_NAME`/`DB_USER` are missing the cPanel account prefix, or the user wasn't added to the database in A2. |
| Sign-in works, dashboard is blank | Normal if go54 is briefly unreachable — the shell degrades rather than erroring. Run `check-api.mjs`. |

---

## Known gaps

Worth knowing before you open this to the public:

1. **Email confirmation is a soft gate.** An unconfirmed account still works
   in full — it just carries a banner. That is deliberate: blocking the app on
   a delivered email would lock people out whenever mail gets filtered. To make
   it a hard gate, check `profile.verified` in `src/app/(dash)/layout.tsx` and
   redirect instead of rendering the banner.
2. **Analytics starts at registration.** It cannot tell you how many people saw
   the landing page and left without signing up. Switch on Vercel Analytics in
   the project settings for that — no code, free at this scale.
3. **DuckDB loads from jsDelivr.** Coding Problems need that CDN reachable on
   first use. It caches afterwards, but a blocked CDN means no SQL problems.
4. **Password resets depend on Resend being configured.** Without A8 done, they
   fall back to PHP `mail()` and will often be filtered to spam.

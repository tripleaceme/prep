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

Now upload **the contents of this repo's `api/` folder**, keeping the structure:

```
/home/behindt/api.behindthedata.tech/
├── .htaccess
├── index.php
├── lib/
│   ├── .htaccess
│   ├── config.php
│   ├── db.php
│   └── http.php
└── routes/
    ├── .htaccess
    ├── auth.php
    ├── interviews.php
    └── profile.php
```

Upload `api/index.php` to the root of that folder — **not** `api/` itself
inside it. If you end up with `.../api.behindthedata.tech/api/index.php`, move
the files up one level.

The easiest way: zip the *contents* of `api/` locally, upload the zip through
File Manager, then use **Extract**.

### A6. Generate the two secrets

On your Mac, run this twice and keep both values:

```bash
openssl rand -hex 32
```

- The **first** value is `API_SHARED_SECRET`. It goes in *both* `api/.env` on
  go54 and in Vercel. They must match character for character.
- The **second** value is `SESSION_SECRET`. It goes in Vercel only. Changing it
  later signs everyone out, which is the intended emergency lever.

### A7. Create `api/.env`

In File Manager, inside the same folder, click **+ File**, name it `.env`, then
**Edit** it and paste:

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=behindt_prep
DB_USER=behindt_prepuser
DB_PASS=the-password-from-A2
API_SHARED_SECRET=the-first-openssl-value
APP_URL=https://prep.behindthedata.tech
```

Replace `behindt_...` with the real prefixed names from A2. Save.

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

If you used `public_html/api` instead of a subdomain, `PREP_API_URL` is
`https://behindthedata.tech/api`.

Redeploy after adding them — Vercel does not pick up new variables on an
existing build.

### B3. Domain

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

---

## Troubleshooting

| What you see | What it means |
|---|---|
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

1. **No password reset.** A user who forgets their password is locked out and
   has to email you. The `auth_tokens` table is already in the schema for it,
   so adding the flow needs no migration — but it needs a working transactional
   email sender first.
2. **No email verification.** Anyone can register with an address they don't
   own. Fine for a free tool; revisit before there's anything to lose.
3. **No analytics.** There is still no measurement of how many people who land
   on the site actually finish an interview, which is the number that should
   drive the next round of work.
4. **DuckDB loads from jsDelivr.** Coding Problems need that CDN reachable on
   first use. It caches afterwards, but a blocked CDN means no SQL problems.

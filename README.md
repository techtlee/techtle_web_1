# Techtlee - web (Provoz)

Static site. No build step, no dependencies, no framework. Vercel serves the
folder as-is.

```
index.html                 the whole page (CSS is inlined on purpose - see note 3)
assets/darktec.css         @font-face declarations only
assets/i18n.js             CZ/EN toggle + scroll reveal (~1.5 kB)
assets/fonts/*.woff2       Geist + Geist Mono, latin & latin-ext subsets (11 files, 176 kB)
assets/img/*.jpg           portraits (dva.jpg belongs to the archived third person)
assets/favicon.svg         adapts to the visitor's light/dark OS setting
assets/og-image.png        1200x630 social card
assets/apple-touch-icon.png
vercel.json                cache + security headers
robots.txt, sitemap.xml
```

Weight on first load: ~155 kB total, 10 requests, no third-party connections.

---

## 1. Before you deploy: set the hostname

Three files hard-code `https://techtlee.com`. If you are keeping
`techtle-web.vercel.app` (or using anything else), change it first:

```bash
grep -rl 'techtlee.com' index.html robots.txt sitemap.xml \
  | xargs sed -i 's|https://techtlee\.com|https://your-hostname-here|g'
```

On macOS use `sed -i ''` instead of `sed -i`.

This affects the canonical URL, the hreflang tags, the Open Graph URL and image,
and the sitemap. Getting it wrong will not break the page, but Google and
LinkedIn will follow the wrong address.

## 2. Deploy

### Option A - keep the existing project and URL (recommended)

Your current site already lives in a Vercel project (`techtle-web`). Replacing
its contents keeps the URL, the analytics history and any domain already
attached.

```bash
npm i -g vercel
cd techtlee-web          # this folder
vercel login
vercel link              # choose the EXISTING techtle-web project
vercel --prod
```

`vercel link` asks a few questions. Answer:

- **Set up and deploy?** yes
- **Link to existing project?** **yes** -> pick `techtle-web`
- **Framework preset:** Other
- **Build command:** leave empty
- **Output directory:** leave empty (the repo root *is* the output)

### Option B - Git, so you get previews and one-click rollbacks

Better long term: every push gets its own preview URL, and you can roll back
from the dashboard.

```bash
cd techtlee-web
git init && git add -A && git commit -m "New site"
git branch -M main
git remote add origin git@github.com:YOURUSER/techtlee-web.git
git push -u origin main
```

Then in the Vercel dashboard: **Add New -> Project -> Import** the repo.
Framework preset **Other**, no build command, root directory `.`.

### Option C - no CLI, no Git

Vercel dashboard -> **Add New -> Project -> Deploy without Git**, then drag this
folder in. Fine for a one-off, but you lose previews and rollbacks.

## 3. Custom domain

Project -> **Settings -> Domains -> Add**. Enter `techtlee.com` and
`www.techtlee.com`. Vercel then shows you the exact DNS records to create at
your registrar - use the values it displays rather than any you find online,
because they differ depending on whether you point the apex or the subdomain.
Certificates are issued automatically once DNS resolves.

---

## Notes on how this is built

1. **`vercel.json` sets far-future immutable caching on fonts and images only.**
   Their filenames are content-hashed by Google Fonts, so they can never go
   stale. `index.html` deliberately keeps Vercel's default
   `max-age=0, must-revalidate`, so a redeploy is live immediately. Do not add
   immutable caching to the HTML unless you also version its filename.

2. **The security headers are the conservative set** - `nosniff`,
   `strict-origin-when-cross-origin`, `SAMEORIGIN` framing, and a
   `Permissions-Policy` that switches off camera, mic and geolocation. No CSP,
   because a CSP that forbids inline styles would break the inlined `<style>`
   block; if you want one, extract the CSS first (see 3).

3. **The CSS is inlined in `index.html` rather than a separate file.** For a
   single-page site that is one fewer render-blocking request, which is worth
   more than the caching you give up. If the site grows past a couple of pages,
   pull the `<style>` block out into `assets/techtlee.css` and link it.

4. **Fonts are self-hosted, not loaded from Google.** No third-party request, no
   consent-banner question, and nothing breaks if Google Fonts is blocked. All
   four latin + latin-ext subsets are preloaded because Czech needs latin-ext
   from the first paint - otherwise the diacritics arrive in a second wave and
   the text reflows.

5. **`prefers-color-scheme` is deliberately NOT followed.** Dark is the brand, so
   the site opens dark for everyone and the header toggle stores a choice in
   `localStorage`. To follow the visitor's OS instead, change the fallback in
   the small pre-paint script in `<head>`.

---

## Still to do

- **The contact form does not send anything yet.** Its `onsubmit` handler shows
  a success state and stops - a placeholder. It needs a real endpoint before
  launch (a Vercel Function plus a mail provider, or a hosted service such as
  Formspree or Web3Forms). Right now a visitor will believe they have written
  to you when they have not.
- **Portraits are 276-320 px.** They are displayed at 112 px, which is fine, but
  they cannot go larger and they are soft on a high-DPR screen. Re-shoot or
  re-export at 800 px square.
- **Daniel Vecera is archived, not removed** - see the `ARCHIVED 2026-08`
  comment in the people section, plus `assets/img/dva.jpg`.

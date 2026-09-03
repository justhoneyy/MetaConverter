# MetaConverter — Static Site

Plain HTML/CSS/JS site (no build step). Two pages:

- `index.html` — landing / hero / steps screens
- `upload.html` — upload photo & share-to-Instagram page

## File layout

```
index.html
upload.html
css/style.css     ← all styling, minified
js/main.js        ← index.html logic, Base64-encoded + decoded at runtime
js/upload.js      ← upload.html logic, Base64-encoded + decoded at runtime
render.yaml
```

## About the code protection

"View Source" / right-click-inspect on the pages now shows almost nothing —
no inline CSS, no inline JS, just `<link>`/`<script src>` tags. The JS files
themselves are minified and Base64-encoded, decoded and run at load time, so
casual snooping won't turn up readable logic. Right-click and common
DevTools shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U) are also blocked.

**Important — set expectations correctly:** none of this is real security.
A browser has to download and execute the actual code to run your site, so
anyone determined enough (Network tab, `curl`, decoding the Base64 string in
one line of console JS) can still get the original source. This only stops
casual copy-pasting, not a motivated developer. Don't rely on it to protect
anything sensitive — there's no server-side logic or secrets here to expose
either way, it's all cosmetic HTML/CSS/JS.

## Other changes in this build

- **Hero images are non-downloadable.** Both hero images use a `.no-save`
  class (`pointer-events: none`, `-webkit-touch-callout: none`, drag
  disabled) plus `draggable="false"`, so long-press on mobile and
  right-click "Save Image As" on desktop do nothing.
- **"Before You Begin" popup.** Clicking "Convert now" opens the steps
  screen and immediately shows a popup: "Please read all steps carefully
  for the best results," with an OK button, plus a note that video
  conversion support is coming soon. The same "coming soon" note also
  appears as a small badge on the steps screen itself.
- **No emoji anywhere** — all icons are inline SVG (Lucide/Heroicons-style
  line icons), matching the rest of the UI.
- **Social/SEO metadata** was added to both pages: `description`,
  Open Graph, and Twitter Card tags, including a preview image.

## Deploy on Render

**Option A — Blueprint (easiest)**
1. Push this folder to a GitHub/GitLab repo.
2. In Render: New → Blueprint → connect the repo. Render will read `render.yaml` and create the static site automatically.
3. Deploy.

**Option B — Manual Static Site**
1. Push this folder to a repo.
2. In Render: New → Static Site → connect the repo.
3. Settings:
   - Build Command: *(leave empty)*
   - Publish Directory: `.`
4. Create Static Site.

Once deployed, your site will be live at `https://<your-service-name>.onrender.com/`, with `upload.html` reachable at `https://<your-service-name>.onrender.com/upload.html`.

## Local preview

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## If you ever need to edit the code again

Edit the readable `js/main.js` / `js/upload.js` logic in whatever tool you
originally used to generate this build (or ask for updated source), then
re-run the same minify + Base64-wrap step — hand-editing the Base64 blob
directly isn't practical.

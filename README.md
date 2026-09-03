# MetaConverter — Static Site

Plain HTML/CSS/JS site (no build step). Two pages:

- `index.html` — landing / hero / steps screens
- `upload.html` — upload photo & share-to-Instagram page

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

Just open `index.html` in a browser, or serve it locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

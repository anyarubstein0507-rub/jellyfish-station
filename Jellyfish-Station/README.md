# תחנת תצפית מדוזות — Jellyfish Observation Station
### Israel Aquarium × Bezalel Academy

---

## Project Structure

```
/
├── index.html              ← entry point
├── sketch.js               ← p5.js application
├── Abraham-Bold.otf        ← required font
├── Abraham-Regular.otf     ← required font
└── Jellyfish_Assets-01.png ← loading screen jellyfish image
```

All five files must be in the **same folder** / same deployment root.

---

## Deploy to Vercel (via GitHub)

### 1. Create a GitHub repo
```bash
git init
git add .
git commit -m "initial deploy"
gh repo create jellyfish-station --public --push --source=.
```

### 2. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework Preset: **Other** (this is a static site)
4. Root Directory: `/` (default)
5. Click **Deploy**

No build step needed — Vercel serves it as-is.

### 3. Custom domain (optional)
In Vercel dashboard → Settings → Domains → add your domain.

---

## Kiosk Setup (for the aquarium installation)

On the display computer:

1. Open Chrome
2. Navigate to your Vercel URL
3. Press **F11** for fullscreen
4. In Chrome settings, disable the screensaver / sleep mode
5. Consider pinning Chrome to auto-launch on startup

### For offline use
If the aquarium location has unreliable internet, open `index.html`
directly from a USB drive or local folder — it works fully offline
(p5.js CDN link should be swapped for a local copy in that case).

---

## Adding Supabase Persistence (Phase 2)

Currently drawings are stored in browser memory only (lost on refresh).
To persist across sessions:

1. Create a free [Supabase](https://supabase.com) project
2. Create table: `jellyfish_drawings (id, frames jsonb, x float, y float, seed float, speed float, amplitude float, phase_idx int, created_at timestamp)`
3. Replace `addToDatabase()` in sketch.js with a `fetch()` POST to Supabase
4. On `setup()`, fetch all existing rows to pre-populate `database[]`

---

## Notes
- Canvas is 1920×1080 (16:9). The CSS in index.html scales it to any screen size.
- Hebrew and Arabic text is right-aligned (RTL). English is left-aligned.
- Gallery supports up to 20 jellyfish before the grid cycles.

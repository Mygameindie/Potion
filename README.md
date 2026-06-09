# Potion of Everything (PoE)

[![Play on GitHub Pages](https://img.shields.io/badge/%E2%96%B6%20PLAY%20NOW-GitHub%20Pages-2ea44f?style=for-the-badge)](https://mygameindie.github.io/Potion/)
&nbsp;
[![Play via githack](https://img.shields.io/badge/%E2%96%B6%20Play-githack%20(branch)-555?style=for-the-badge)](https://raw.githack.com/Mygameindie/Potion/claude/zip-extract-organize-ediwt4/Main/index.html)

👆 **Click to play instantly in your browser.**

- **PLAY NOW** → clean permanent link: **https://mygameindie.github.io/Potion/**
  (goes live after the Pages workflow runs on `main` — see
  [setup](#-permanent-link-github-pages) below).
- **Play via githack** → works right now from this branch, nothing published.

A small browser game: type any word, brew it into a potion, drink it, and
transform / evolve / meet an ending. Pure static HTML + CSS + JavaScript — no
build step, no server required.

## ▶️ Preview it without publishing

GitHub shows `.html` files as **source text** and won't run the game in the file
viewer (that needs GitHub Pages).

### Option A — Open in github.dev (press `.`)

`github.dev` (and `vscode.dev`) is an in-browser editor with **no server/compute**,
so it can't host the running game by itself. Two ways to preview from inside it:

1. **Live Preview extension (runs the game inside the editor).**
   When you open the repo, github.dev will offer to install the recommended
   **Live Preview** extension (see `.vscode/extensions.json`). Install it, open
   `Main/index.html`, then click the **"Show Preview"** icon (top-right) or run
   *Live Preview: Show Preview* from the Command Palette (`F1`). It serves the
   static files in-browser, so the scripts and images load. *(If your github.dev
   session can't run the extension on the virtual filesystem, use option 2 or a
   Codespace.)*

2. **Simple Browser tab (no extension needed).**
   Command Palette (`F1`) → **"Simple Browser: Show"** → paste the live link
   below. The game opens in a tab right inside github.dev.

### Option B — Live link (works anywhere, no install)

These proxies fetch the files from this branch on demand — nothing is published:

- **raw.githack (recommended)** — serves real files, so all scripts/images load:

  👉 https://raw.githack.com/Mygameindie/Potion/claude/zip-extract-organize-ediwt4/Main/index.html

- **htmlpreview.github.io** (fallback):

  👉 https://htmlpreview.github.io/?https://github.com/Mygameindie/Potion/blob/claude/zip-extract-organize-ediwt4/Main/index.html

If you merge this into `main`, swap `claude/zip-extract-organize-ediwt4` for
`main` in the URLs above.

> Note: progress is saved in the browser's `localStorage`, so each preview
> domain keeps its own separate save.

## 🔗 Permanent link (GitHub Pages)

The repo includes a Pages workflow (`.github/workflows/pages.yml`) that publishes
the `Main/` folder to **https://mygameindie.github.io/Potion/**.

Publishing needs **one manual click that only the repo owner can do** (GitHub
doesn't let an automated action switch Pages on for you):

1. **Settings → Pages → Build and deployment → Source: "GitHub Actions".**
2. Get the workflow onto `main` — merge this branch (e.g. via Pull Request #1).
3. The **Deploy game to GitHub Pages** action runs automatically and the link
   goes live. After that, every push to `main` redeploys it. (You can also
   trigger it manually from the **Actions** tab → *Run workflow*.)

Until then — and as a permanent fallback — use the **githack** button above; it
works immediately with zero setup.

## 💻 Run it locally

Because the app loads several files, open it through a tiny local web server
(opening `index.html` via `file://` can break relative paths in some browsers):

```bash
cd Main
python3 -m http.server 8000
# then open http://localhost:8000/
```

## 📁 Project layout

```
Main/            the game (open Main/index.html)
  index.html     entry point
  style.css / ui.css / animation.css
  data/          keywords, forms, recipes, endings
  src/engine/    save, chain (brew logic), overlays, adapter, validator
  src/ui/        app, brew, codex, settings, animation
  assets/        form / ending images
tests/           manual test notes
docs/            design guideline notes (Thai)
```

## 🎮 How to play

1. Go to the **Brew** tab, type a word (e.g. `fire`, `dragon`, `death`), press **Brew**.
2. Press **Drink** to apply it — your form may transform, evolve, or hit an ending.
3. Chain words together for multi-ingredient recipes.
4. Track everything you've discovered in the **Codex** tab.
</content>

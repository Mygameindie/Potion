# Potion of Everything (PoE)

A small browser game: type any word, brew it into a potion, drink it, and
transform / evolve / meet an ending. Pure static HTML + CSS + JavaScript — no
build step, no server required.

## ▶️ Preview it without publishing

GitHub shows `.html` files as **source text** and won't run the game in the file
viewer (that needs GitHub Pages). To see it actually running straight from this
branch — **without deploying anything** — open one of these live-preview proxies:

- **raw.githack (recommended)** — serves the real files, so all scripts and
  images load correctly:

  👉 https://raw.githack.com/Mygameindie/Potion/claude/zip-extract-organize-ediwt4/Main/index.html

- **htmlpreview.github.io** (fallback):

  👉 https://htmlpreview.github.io/?https://github.com/Mygameindie/Potion/blob/claude/zip-extract-organize-ediwt4/Main/index.html

These services fetch the files from this repo on demand. Nothing is published,
and the links keep working as long as the branch exists. If you merge this into
`main`, swap `claude/zip-extract-organize-ediwt4` for `main` in the URL.

> Note: progress is saved in the browser's `localStorage`, so each preview
> domain keeps its own separate save.

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

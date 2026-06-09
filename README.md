# PoE — Potion of Everything

A small browser game: type keywords, brew potions, drink them, and discover
new **forms**, **evolutions** and **endings**. No build step — it's plain
HTML/CSS/JS and runs by opening `index.html`.

## Run it

Because the scripts are loaded as separate files, open it through a local
server (opening the file directly works in most browsers too):

```bash
# from the repo root
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## Project layout

```
index.html            Entry point. Defines the DOM and the script load order.
style.css / ui.css    Layout & component styling.
animation.css         Keyframes for brew/transform/overlay animations.
test.html             Standalone manual test page (not part of the game).

assets/               Images (forms/, endings/, placeholders).
data/                 Game content (loaded by index.html):
  data_keywords.js      Keywords the player can type.
  data_forms.js         Forms (incl. evolutions, flagged evoOnly).
  data_recipes.js       keyword sequence -> outcome (toForm/toEvo/toEnd).
  data_endings_new.js   Ending definitions + reborn target.
src/
  engine/             Core logic (no DOM rendering):
    save.js             localStorage save/load (key: poe_v45_save).
    chain.js            Buffer + recipe matching + outcome dispatch.
    adapter.js          Normalizes data_recipes.js -> window.RECIPES.
    overlay.js          Evolution/Ending overlays + fade curtain.
    recipe_validator.js Dev-time sanity checks for recipes/forms.
  ui/                 DOM rendering & interaction:
    app.js              Form display, counters, tabs, quick-brew buttons.
    brew.js             Brew/Drink/Discard flow + brewing overlay.
    codex.js            Codex tabs (Keywords / Forms / Endings).
    settings.js         Settings + Hard/Soft reset.
    animation.js        Reusable animation helpers.

tests/                Browser test-runner snippets (paste into devtools).
unused/               Code NOT loaded by index.html — see below.
```

## Script load order

`index.html` loads (with `defer`, so order is preserved): all `data/*`, then
`src/engine/*`, then `src/ui/*`. Engine modules expose globals (`window.Chain`,
`window.overlay`, `window.ensureSave`, …) that the UI layer consumes.

## `unused/` — not wired into the game

These files are kept for reference but are **not** referenced by `index.html`
or any loaded script. They were verified dead before being moved here.

- `unused/data/adapter.js` — duplicate of `src/engine/adapter.js` (superseded).
- `unused/data/data_adapter.js` — alternative `$DATA` adapter layer (legacy).
- `unused/data/index.js` — `__POTION_DATA__` bundle helper (legacy).
- `unused/engine/easter.js` — "Phoenix Shield" easter egg; wraps engine
  functions that the current `Chain`-based engine no longer exposes.
- `unused/data/data_achievement.js` — achievement content (WIP, never wired).
- `unused/data/data_dialogue.js` — dialogue content (WIP; expects a `DLG`
  runtime that doesn't exist yet).

To bring a WIP feature back, add its `<script defer>` to `index.html` after the
relevant dependencies and implement the missing runtime hooks.

## Known content gaps (not bugs in the code)

- Some endings reference images that don't exist yet
  (`assets/endings/fire.png`, `assets/endings/light.png`); only `void.png`
  ships. Missing images simply render blank.
- `chaos_reaper_evo` reuses the same artwork as the other reaper forms.

# 3d-modal

A rotating 3D human head/bust, rendered live as ASCII art, inspired by the
head-turn effect on matthewpetersen.ca.

Built with **Next.js (App Router)**, **three.js**, and **SCSS** — plain
JavaScript, no TypeScript.

## How it works

- `components/AsciiHead.js` builds a low-poly human head + neck/shoulders
  bust out of basic three.js primitives (sphere skull, jaw, nose, eyes,
  brow, ears, neck, shoulder cylinder).
- The scene is rendered through three.js's built-in `AsciiEffect`
  (`three/examples/jsm/effects/AsciiEffect.js`), which converts each
  frame's shading into monospace characters from a ramp
  (`" .:-=+*#%@"`) — this is what gives the "changing ASCII" look, since
  the characters are recomputed every frame as the lighting on the head
  shifts.
- On every `requestAnimationFrame`, the head group's `rotation.y` is
  driven by a sine wave (plus a slower secondary sine for a subtler
  wobble) so it eases left and right like someone glancing around,
  rather than spinning at a constant rate.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Tuning the look

In `components/AsciiHead.js`:

- `RAMP` — the character set used for shading, dark → light.
- `resolution` in the `AsciiEffect` options — lower = coarser/bigger
  characters, higher = finer detail.
- `yaw` / `pitch` formulas inside `animate()` — adjust the multipliers
  to change turn speed and range.
- `buildHead()` / `buildBust()` — swap in a GLTF model here instead of
  primitives if you want a more detailed/realistic head later (use
  `GLTFLoader` from `three/examples/jsm/loaders/GLTFLoader.js`).

## Pushing this to GitHub

This was generated outside of git. From the project folder:

```bash
git init
git add .
git commit -m "Initial commit: ASCII 3D head"
git branch -M main
git remote add origin https://github.com/iffat2002/3d-modal.git
git push -u origin main
```

# KOLOR Design System

This folder contains the design system documentation for KOLOR Studio.

## Files

- **FRAMEWORK.md** — The KOLOR Design Framework v1.0 ("Editorial Software").
  Comprehensive design specification covering color, typography, grid, motion,
  component philosophy, voice/copy tone, and the five signature moves.

## Usage

Any iteration that touches design surfaces (landing page, dashboard, portal,
emails, community) should reference FRAMEWORK.md before writing code.

The framework tokens themselves live in:
- `frontend/src/index.css` — CSS variables under `--kolor-*` namespace
- `frontend/tailwind.config.js` — Tailwind palette under `kolor-*` namespace

## Framework version history

- **v1.0** (added iter 279-docs) — initial framework, drafted July 2026 during
  the KOLOR design session.

## When updating the framework

- Framework revisions ship as new iterations (e.g. iter XXX-framework-update).
- Increment version in FRAMEWORK.md header.
- Add entry to this file's version history.
- Update tokens in index.css / tailwind.config.js if palette or type scale
  changes.

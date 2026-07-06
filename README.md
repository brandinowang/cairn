# CAIRN

A local-first, keyboard-driven to-do app where completed tasks deposit procedurally-generated stones that stack into a growing 3D cairn.

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Build phases

Phases 1–4 are implemented:

1. Scaffold — Vite, React, TypeScript, Tailwind, design tokens
2. Task engine — zustand store, list UI, keyboard map, persistence
3. Generative engine — deterministic RNG, mapping, geometry, materials, tests
4. CAIRN scene — Three.js viewport, stacking, deposit/removal animations

Phases 5–8 (library, Voronoi, demo seed, polish) are pending review.

## Stack

- Vite + React 18 + TypeScript
- Three.js via @react-three/fiber + @react-three/drei
- zustand (persist → localStorage)
- Tailwind CSS
- d3-delaunay (for upcoming Voronoi mode)

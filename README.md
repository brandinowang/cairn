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

## Features

- Offline task list with keyboard-first UX and localStorage persistence
- Deterministic generative forms (cairn stack + Voronoi cluster modes)
- Library with inspector, spec cards, and product suggestions
- STL export (single form + whole structure) and PNG viewport capture
- Demo seed, presentation mode, JSON data import/export

## Deploy

Live on [Vercel](https://vercel.com) — connect the [GitHub repo](https://github.com/brandinowang/cairn) and deploy with default Vite settings (`npm run build`, output `dist`).

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `n` | Focus quick-add |
| `l` | Toggle library |
| `m` | Toggle cairn / voronoi |
| `k` | Lock in (tasks only) |
| `p` | Presentation mode |
| `x` / Space | Complete / uncomplete |
| `1/2/3` | Priority L/M/H |
| `↑/↓` | Navigate tasks |
| `Esc` | Close library / clear focus |

## Stack

- Vite + React 18 + TypeScript
- Three.js via @react-three/fiber + @react-three/drei
- zustand (persist → localStorage)
- d3-delaunay (Voronoi mode)
- Tailwind CSS

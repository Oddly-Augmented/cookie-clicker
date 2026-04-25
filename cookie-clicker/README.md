# Cookie Clicker — Farcaster Mini App

A tiny Cookie Clicker built with HTML, CSS, and JS, packaged as a Farcaster Mini App.

## Requirements
- Node.js 22.11.0 or higher
- npm

## Install & run locally
```bash
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173).

## Build for production
```bash
npm run build
npm run preview
```

## Test inside Farcaster
1. Run `npm run dev` and expose it with a tunnel (e.g. `npx ngrok http 5173`).
2. Open the Farcaster Mini App preview tool and paste your tunnel URL.
3. To publish, host the built `dist/` folder anywhere static (Vercel, Netlify, etc.) and add a `farcaster.json` manifest at `/.well-known/farcaster.json` per the Mini Apps docs.

# Forge3D — AI 3D Generation Studio

A free, open-source 3D model generation app powered by TRELLIS (Microsoft) and Hunyuan3D (Tencent) via Hugging Face. No subscriptions, no per-generation credits.

![Forge3D Studio](https://img.shields.io/badge/3D-Generation-f97316?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-2dd4bf?style=flat-square) ![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square)

## Features

- **Text → 3D** — Describe any object and generate a 3D model
- **Image → 3D** — Upload a photo and convert it to a 3D mesh
- **3 AI Engines** — TRELLIS.2 (Microsoft), Hunyuan3D 2.0 (Tencent), Meshy AI
- **Texture Layer System** — Add Diffuse, Normal, Roughness, Metalness & Emissive maps
- **Live 3D Viewport** — Orbit, zoom, pan with Three.js. Wireframe toggle
- **Export** — Download as GLB or OBJ
- **Free** — Uses Hugging Face free inference tier. No credits system

---

## Quick Start (Local)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/forge3d.git
cd forge3d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Add your API keys

Click **Settings** in the top bar and add:

- **Hugging Face Token** (free) — [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)  
  Required for TRELLIS and Hunyuan3D. Read-only access is enough.

- **Meshy AI Key** (optional, free tier) — [meshy.ai](https://www.meshy.ai)  
  200 free credits/month for the Meshy engine.

Keys are saved to your browser's localStorage only — never sent to any server other than the AI providers.

---

## Deploy to Vercel (Free)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Project → select your repo
3. No environment variables needed (keys are client-side)
4. Deploy — done. Free hosting, auto-deploys on push.

---

## AI Models

| Model | Provider | Best For | License |
|-------|----------|----------|---------|
| TRELLIS.2-4B | Microsoft | Production PBR assets | MIT |
| Hunyuan3D 2.0 | Tencent | High-fidelity textures | Tencent Community |
| Meshy AI | Meshy | Speed & polish | Free tier |

Both TRELLIS and Hunyuan3D run via **Hugging Face Spaces** — no GPU needed on your end.

---

## Texture Layer System

After generating a model, the right panel lets you add PBR texture layers:

| Layer | What it does |
|-------|-------------|
| **Diffuse / Albedo** | Base color of the surface |
| **Normal Map** | Fake surface detail and bumps |
| **Roughness** | How matte or glossy the surface is |
| **Metalness** | Whether the surface looks metallic |
| **Emissive / Glow** | Self-illuminating areas with custom color |

Upload any standard texture map (PNG/JPG) and adjust intensity with the slider.

---

## Tech Stack

- **React 18** + Vite
- **Three.js** + OrbitControls for 3D viewport
- **Hugging Face Inference API** for TRELLIS and Hunyuan3D
- **Space Grotesk + Space Mono** typography

---

## Project Structure

```
src/
├── components/
│   ├── Viewer3D.jsx      # Three.js 3D viewport
│   ├── TextureLayers.jsx # PBR texture layer panel
│   ├── ModelSelector.jsx # AI engine picker
│   └── SettingsPanel.jsx # API key management
├── lib/
│   └── api.js            # HF + Meshy API wrappers
├── App.jsx               # Main studio layout
└── index.css             # Design system / tokens
```

---

## License

MIT — use it, fork it, build on it.

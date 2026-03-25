# Image Background Remover

Online image background remover powered by Remove.bg API, built with Next.js + Tailwind CSS, deployed on Cloudflare.

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS
- **API**: Cloudflare Workers (proxy to Remove.bg)
- **Hosting**: Cloudflare Pages

## Getting Started

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` and add your Remove.bg API key:
   ```
   REMOVEBG_API_KEY=your_api_key_here
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

## Deployment (Cloudflare Pages)

1. Connect your GitHub repo to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `.next`
4. Add environment variable: `REMOVEBG_API_KEY`

## Features

- Drag & drop or click to upload (JPG, PNG, WEBP, max 10MB)
- AI-powered background removal via Remove.bg API
- Side-by-side comparison of original and processed image
- One-click PNG download
- No storage — images processed in memory only
- Mobile responsive

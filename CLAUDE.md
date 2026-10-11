# Miletag: project memory

Read this first. It carries the decisions and state from earlier sessions. The full spec is `docs/PRD.md` (v0.6); Expo-specific coding rules are in `AGENTS.md`.

## Owner and how to work with them
- Owner: Clement, a finance professional. Wants the bottom line first (pyramid style), plain English, short.
- Challenge assumptions; don't just agree. Ask when a decision is genuinely theirs.
- Develop on branch `claude/vigilant-rubin-1e2ult`. Commit and push there. No PR unless asked.

## Product in one paragraph
Miletag turns a race into wall art. Free: live editor and preview, drag the GPX route, photo or one of 5 map backgrounds, 1–6 runners on designs that support it, social-size export with a small "made with miletag" watermark (virality). Paid (physical only): print, frame, Deep Frame with optional 3D raised route and/or one medal slot, delivered. Malaysia first (MYR), global later. iOS + Android + Web from one Expo codebase.

## Locked decisions (don't re-litigate)
- **No subscription. No paid digital products.** Free export is social sizes only (IG Story 1080×1920, IG Post 1080×1350, phone wallpaper); print-res files never leave the server. So no app-store IAP.
- **Sizes:** A4, A3, A2 on 200 gsm premium matte fine-art paper, fade-resistant (pigment) inks.
- **A2 is unframed print only:** no Framed, no Deep Frame, so no medal or 3D on A2.
- **Formats:** Print / Framed / Deep Frame (~3–4 cm gap, a.k.a. shadow box). 3D route and medal slot need the Deep Frame.
- **Medal:** exactly one slot, one medal per frame. Customer inserts their own medal (we never take custody). Kept on A4 (max ~85 mm), A3 (~110 mm).
- **3D route:** flat raised line printed from the user's GPX on a **Bambu Lab P2S** (route bbox cap ~240 mm on A3, ~170 mm on A4). Colours: white, black, signal orange, neon yellow, silver, gold. Paid add-on.
- **Production:** 2D prints by a **third-party fine-art print shop**; Miletag does 3D printing, framing/assembly, QC, shipping in-house. Every print comes back to Miletag before shipping.
- **Volume:** a few orders a week at launch. Production Console is a lite internal web tool.
- **Runners:** user picks 1–6 first; gallery shows only designs that support that count. Medal designs can show 1–6 runners but still one medal slot; crews each order their own copy via a **Crew Copy Link**, and **each copy highlights the buyer's own name** (locked).
- **Bahasa Malaysia:** shortly after launch, not v1. Keep strings i18n-ready.
- **Strava:** optional OAuth; GPX upload must work fully on its own.
- **Map data:** OpenStreetMap via MapLibre. Dev uses free OpenFreeMap tiles; production should self-host (set `EXPO_PUBLIC_MAP_TILES_URL`). Avoid Mapbox/Google for print.
- **App ID:** `app.miletag` (iOS bundle + Android package). Can't change after store publish; owner hasn't objected.
- **UI references:** SmoothUI (smoothui.dev, use its per-component "Copy Markdown" docs / `llms-full.txt`), Bencho (bencho.dev, prompts/code gated behind its free account, not accessible to us), Amicro (amicro.vercel.app blocks bots; GitHub repo `Subhan-code/Amicro--Micro-transitions-` is readable). They're web React + Tailwind + Motion, so port the motion to Reanimated, don't import them.

## Open questions (still the owner's)
1. Crew discount: 10% off when 3+ copies ordered from one link? (default yes)
2. Deep Frames: ready-made (default) or local framer?
3. Which print shop? Need per-size unit prices; all prices in `src/domain/catalog.ts` are placeholders until then.

## What's built (as of this handoff)
- Expo SDK 57 + Expo Router app. Screens: home → runners (1–6) → designs (filtered) → editor → "Get it made" (size/format/frame/3D/medal + live price). `admin/` is a placeholder.
- `src/domain/catalog.ts`: all availability rules above + pricing placeholders. `design-document.ts`: the JSON every render uses (schemaVersion 4). `route/`: GPX parse, 200 m privacy trim, RDP simplify, projection, keeps `geo` lon/lat.
- Map backgrounds: `src/domain/map-styles.ts` (Graphite, Paper, Blueprint, Noir, Terrain w/ hillshade; water/parks/roads toggles). `src/components/map-canvas/` uses `@maplibre/maplibre-react-native` v11 on native and `maplibre-gl` v6 on web; route is a map line layer (geo-locked), camera saved on user gestures.
- Ported SmoothUI components: `animated-tabs.tsx` (segment), `animated-toggle.tsx`, `map-style-carousel.tsx` (coverflow).
- Photo mode uses the Skia `route-canvas` (drag/pinch/rotate) on a placeholder grid; photo upload not built yet.
- Web needs `public/canvaskit.wasm` and `public/maplibre/maplibre-gl-worker.mjs`, copied by `scripts/copy-web-assets.js` on `npm install` (gitignored).
- Verified: typecheck, lint, expo-doctor 21/21, iOS + Android JS bundles compile, web flow tested in headless Chromium. **Not yet run on a real device.**

## Gotchas learned
- Reanimated + React Compiler lint: use `sv.get()` / `sv.set()`, not `.value`.
- maplibre-react-native pins `@maplibre/maplibre-gl-style-spec` 26.2.1; our direct dep is newer, so the native map casts the style (`as unknown as MapProps['mapStyle']`).
- maplibre-gl: import `{ Map as MapLibreMap, setWorkerUrl }`; worker URL must be `/maplibre/maplibre-gl-worker.mjs`.
- Skia on web loads via `WithSkiaWeb` (`route-canvas/index.web.tsx`).
- Playwright: launch with `executablePath: '/opt/pw-browsers/chromium'`; never `playwright install`.

## Next steps
1. **Now:** confirm `EXPO_TOKEN` is set (check `env`, never print it), run `npx eas-cli@latest init` to link the project, then `npx eas-cli@latest build --profile development --platform android` (and iOS if credentials allow). Commit the `extra.eas.projectId` that init writes to `app.json`.
2. Photo backgrounds (expo-image-picker, DPI gate, scrim) + free watermarked social export.
3. Checkout with FPX / DuitNow / e-wallets; then backend (Supabase), Crew Copy Link, server print + 3D file generation, Production Console lite.

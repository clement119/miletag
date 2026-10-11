# Miletag

Turn a race into wall art. Free to design and share; paid prints, frames, 3D raised routes and medal frames, made and delivered in Malaysia.

The product spec lives in [`docs/PRD.md`](docs/PRD.md).

## Stack

- **Expo SDK 57** + Expo Router: iOS, Android and Web from one codebase
- **@shopify/react-native-skia**: poster canvas (same engine planned for the server print render)
- **react-native-gesture-handler + Reanimated**: drag / pinch / rotate route editing on the UI thread

## Run it

```bash
npm install        # also copies Skia's canvaskit.wasm into public/ for web
npm run web        # browser
npm run ios        # iOS (needs a development build: Skia is native code)
npm run android    # Android
```

Checks:

```bash
npm run typecheck
npm run lint
```

## Layout

```
src/app/            screens (Expo Router)
  index.tsx           home
  create/runners      pick 1–6 runners
  create/designs      designs filtered by runner count
  create/editor       GPX import + movable route + race details
  create/format       size / format / 3D route / medal slot + price
  admin/              Production Console (placeholder)
src/domain/         pure logic, no UI
  catalog.ts          sizes, formats, availability rules, designs, pricing
  design-document.ts  the JSON document every render works from
  race.ts             time / pace helpers
  route/              GPX parsing, privacy trim, simplify, projection
src/components/     UI primitives and the route canvas
```

## Not built yet

Strava OAuth, map backgrounds (MapLibre), photo backgrounds, free export with watermark, checkout and payments, Crew Copy Link, backend (Supabase), server print/3D rendering, Production Console.

## EAS

`eas.json` has `development`, `preview` and `production` profiles. Link the project to your Expo account with `npx eas-cli@latest init` (needs `EXPO_TOKEN` or a login), then `npx eas-cli@latest build --profile development`.

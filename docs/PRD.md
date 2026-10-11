# Miletag — Product Requirements Document (v0.1, draft for brainstorm)

> **Status:** Draft v0.1 · **Owner:** Clement · **Date:** 11 Oct 2026
> **Open decisions are marked `⚑ DECISION`** — each has a recommended default so the build is not blocked.

---

## 0. TL;DR

**Miletag turns a race into wall art, and lets the runner see and shape the result before they pay.**

Competitors (e.g. Sprint Finish Studio) take an order, design it by hand in 2–3 working days, and the customer sees the art only once it's made. Miletag's edge is three things:

1. **Live preview editor.** WYSIWYG: what you see is what gets printed. You can drag, pinch and rotate the GPX route on the photo or map.
2. **Map-as-background mode.** Choose from 5 curated map styles in place of a photo.
3. **Physical 3D-printed route add-on.** A raised route relief mounted on the print, which no one in the reference set offers.

It also covers **1–6 runners per print**, with **optional Strava import**, on a **freemium** model: design and preview for free, then pay for a hi-res file or a physical print.

**Business model in one line:** free editor → watermarked preview → paid digital download / print / framed print / 3D-route upgrade.

---

## 1. Problem & opportunity

| Today (competitor flow) | Pain | Miletag answer |
|---|---|---|
| Fill a form, upload a photo + Strava screenshot, then wait 2–3 days | You pay blind and can't see the result | Instant live preview before checkout |
| Designer chooses where the route sits | The route covers faces or misses the landmark | User drags, scales and rotates the route |
| Screenshot of the route | Low fidelity, can't be restyled | GPX/FIT/TCX parsed to vector; Strava OAuth import |
| 1–2 runners | Clubs, families and run crews are left out | 1–6 runners, with layout templates per count |
| Photo backgrounds only | People without a good race photo drop off | 5 curated map styles |
| Manual design labour | Doesn't scale, and margins go to a designer | Automated render pipeline, near-zero marginal design cost |

**Why it matters financially:** the competitor charges about £18 for digital, £22 for a print and £42 framed, with about 2–3 days of human design time per order. Removing the human from the loop is the margin story; the preview is the conversion story.

---

## 2. Goals, non-goals, success metrics

### Goals (v1)
- G1. A user can go from opening the app to a finished preview in **under 3 minutes**.
- G2. The preview matches the print with **no material difference** (same render engine; see §8).
- G3. Free-to-paid conversion is high enough to fund paid acquisition (target below).
- G4. Fulfilment needs zero manual design touch for 95% or more of orders.

### Non-goals (v1)
- Not a social network or a Strava replacement. There are no feeds or follows.
- No arbitrary map styling (we are not building Snazzy Maps). Exactly 5 curated styles.
- No B2B race-organiser portal in v1 (it's a strong v2 candidate; see §14).
- No in-house printing. All printing goes through print-on-demand (POD) partners.

### Success metrics (first 90 days post-launch)
| Metric | Target | Why |
|---|---|---|
| Activation: % of installs that reach a full preview | ≥ 45% | Proves the editor is easy |
| Preview → paid conversion | ≥ 6% | Freemium viability |
| Average order value (AOV) | ≥ £38 | Framed + 3D upsell mix |
| Attach rate of the 3D route add-on | ≥ 15% of physical orders | Validates the differentiator |
| Reprint / complaint rate | ≤ 3% | WYSIWYG fidelity |
| Contribution margin per physical order | ≥ 40% | Unit economics |

> ⚑ **DECISION (metrics):** these targets are placeholders. Replace them with numbers from your own financial model before launch.

---

## 3. Target users & personas

| Persona | Description | Key need |
|---|---|---|
| **The Finisher** (core) | Just ran a marathon or half, emotional peak in the 0–14 days after the race | Commemorate it fast, while the feeling is fresh |
| **The Gifter** | Partner, friend or parent buying for a runner | Easy without the runner's login, and gift-ready |
| **The Crew** | 2–6 people who ran the same race (couple, family, club) | Everyone's name and time on one piece |
| **The Collector** | Majors chaser (Berlin, London, Tokyo, etc.) | A consistent series look across races |

**Insight:** the Gifter often **won't have Strava access** to the runner's account. That's why manual entry and GPX upload must be first-class, not a fallback.

---

## 4. Product scope: feature list & prioritisation

**P0** = MVP launch · **P1** = fast follow (within 8 weeks of launch) · **P2** = later

| # | Feature | Priority |
|---|---|---|
| F1 | Template gallery (photo-based and map-based templates) | P0 |
| F2 | Photo upload, crop and auto-legibility (scrim / tone) | P0 |
| F3 | Route import: GPX/FIT/TCX upload + tutorial | P0 |
| F4 | Route import: Strava OAuth (optional) | P0 |
| F5 | Route manipulation: drag / pinch-scale / rotate / snap | P0 |
| F6 | Race data entry: name, race, date, distance, time, pace (auto-calculated), bib | P0 |
| F7 | Multi-runner, 1–6 people | P0 for 1–2, P1 for 3–6 ⚑ |
| F8 | Map background mode, 5 curated styles | P0 |
| F9 | Live preview + room mock-up ("see it on a wall") | P0 preview, P1 room mock-up |
| F10 | Freemium gating: watermark, export resolution, template access | P0 |
| F11 | Checkout: digital download, print, framed print | P0 |
| F12 | 3D-printed route add-on (physical) | P1 ⚑ (see §7.6) |
| F13 | Share-to-Instagram story export (watermarked = free marketing) | P0 |
| F14 | Race preset library (official course GPX + date for top races) | P1 |
| F15 | Gift flow: send an editable link to the runner, or a gift card | P1 |
| F16 | Collaborative crew invite (each runner adds their own data) | P2 |
| F17 | AR "place on wall" preview | P2 |

---

## 5. Core user flows

### 5.1 Happy path (single runner, Strava)
```
Onboarding (3 swipe cards) → "Create" → choose template
 → Background: [Photo] or [Map]
 → Route: [Connect Strava] → pick activity → route + stats auto-filled
 → Editor: drag/scale/rotate route, edit text, pick colours
 → Preview (full-screen, watermarked) → Share (free) or Buy
 → Choose format: Digital / Print / Framed (+ 3D route add-on)
 → Size → Checkout → Order tracking
```

### 5.2 No Strava (GPX upload)
```
Route step → "Upload GPX" → inline tutorial (per source: Strava web, Garmin Connect,
Apple Health via export app, Coros, Polar, Suunto, Nike Run Club)
 → File picker → parse → if > 1 track: choose segment → editor
```
Fallbacks:
- **Race preset** (P1): pick "London Marathon 2026" and we supply the official course line.
- **Draw it** (P2): trace the route on a map.

### 5.3 Multi-runner (2–6)
```
Template step → choose "Crew" layout → set runner count (1–6)
 → For each runner: name, time, bib, (optional) own GPX or Strava
 → If same race: one shared route line, multiple colour-coded "finish markers" or
   stat blocks. If different routes: overlay lines in distinct colours.
```

### 5.4 Edit after purchase
- A digital purchase allows **unlimited re-export of the same design** for 30 days (typo fixes).
- Physical orders can be edited until the order is **locked for production** (target: 2 hours after payment, shown clearly).

---

## 6. Freemium model

### 6.1 Free vs paid

| Capability | Free | Paid (per design) | Miletag Pro (subscription) ⚑ |
|---|---|---|---|
| Templates | 3 free templates | All | All, plus early access |
| Map styles | 2 of 5 | All 5 | All 5 |
| Runners per design | 1–2 | Up to 6 | Up to 6 |
| Preview | Full, watermarked | Unwatermarked | Unwatermarked |
| Export | 1080px social image, watermarked | Print-res PDF/PNG (300 DPI) | Unlimited hi-res exports |
| Physical print | Purchasable | Purchasable | 15% off prints |

### 6.2 Indicative pricing (GBP, to validate)

| Product | Price | Competitor ref |
|---|---|---|
| Digital download (hi-res) | £12.99 | £18 |
| Unframed print (A3 / A2) | £24 / £34 | £22 |
| Framed print (A3 / A2) | £49 / £69 | £42 |
| 3D route add-on | +£25–35 | n/a (differentiator) |
| Pro subscription | £4.99/mo or £29.99/yr | n/a |

> **Challenge:** a subscription for something people buy 1–3 times a year is a weak fit. My recommendation is **launch without Pro**. Use pay-per-design and physical upsell; only add Pro if data shows repeat creators (collectors, clubs).

### 6.3 Payments: the app store tax (critical)
- **Physical goods** (prints, frames, 3D add-on) **may use Stripe**, not Apple/Google in-app purchase (IAP). There's no 15–30% cut. ✅
- **Digital goods consumed in-app** (hi-res download, template unlocks, Pro) **must use IAP** on iOS and Android, so 15–30% goes to the platform. You can only steer users to web checkout where the law allows it (e.g. US external links after the 2025 Epic ruling, and EU DMA arrangements). Rules vary by region and change often, so verify them at build time.
- **Recommendation:** price digital to absorb IAP (Small Business Program = 15%), and push the **physical** product as the hero. Also ship an Expo **web** build, where digital can go through Stripe at full margin (see §9).

---

## 7. Feature requirements (detail)

### 7.1 Template system
- Templates are **data, not code**: a JSON "design document" (see §8.2) defines the canvas size, layers, text slots, fonts, colour tokens and route slot.
- v1 template set, based on the reference images:
  1. **Poster Classic**: title + date top, map/photo square, name + bib + 3 stats bottom (image 1)
  2. **Duo / Crew Split**: two or more names + times in columns (image 2)
  3. **Big Time**: oversized ghosted finish time, route overlay on the photo (image 3)
  4. **Editorial**: date + race title stacked, stats bar at the bottom (image 4)
  5. **Mono Tech**: B&W photo, neon route, monospace stat line (image 5)
- Each template declares `supportsRunners: [1,2,3,4,5,6]` and a layout per count. If a template can't fit 6 legibly, it doesn't offer 6.

### 7.2 Photo handling
- Inputs: camera roll (expo-image-picker), with a minimum resolution check.
- **Print-quality gate:** the effective DPI at the chosen size is computed live.
  - Green: ≥ 200 DPI
  - Amber: 150–199 DPI, "may look soft"
  - Red: < 150 DPI, with the print blocked or a warning plus acknowledgement ⚑
- Auto-legibility: an adjustable bottom/top scrim, a B&W filter and a contrast slider.
- P1: subject-aware route placement suggestion (avoid faces), using on-device face detection to propose an initial route position.

### 7.3 Route import (GPX + Strava)
- **Formats:** GPX (P0), FIT and TCX (P1). Parsing runs on-device for speed and privacy, with a server fallback for large FIT files.
- **Processing pipeline:**
  1. Parse
  2. Strip a privacy zone (trim the first/last N metres, default 200 m, user-adjustable). This matters for training runs that start at home.
  3. Simplify (Ramer–Douglas–Peucker) to about 500–2,000 points
  4. Project to Web Mercator
  5. Normalise to a unit box
  6. Store as SVG-path-ready coordinates
- **Auto-stats from file:** distance, moving time and pace. These are editable, because official chip time ≠ watch time. Default to **user-entered chip time**.
- **Tutorial:** short, swipeable, per-platform cards with screenshots (Strava web → ⋯ → Export GPX; Garmin Connect → ⚙ → Export to GPX; etc.), plus a "Send me this link by email" option, since export is often easier on desktop.
- **Strava OAuth (optional):**
  - Scopes: `activity:read` (plus `activity:read_all` only if the user opts in to private activities)
  - Pick from the last 50 runs, with races surfaced first (`workout_type = race`)
  - Pull the polyline + stats
- **Strava compliance risks:** see §12. You **must** apply for production rate limits and athlete capacity early. New Strava apps start limited to a single athlete until reviewed.

### 7.4 Route manipulation (the core differentiator)
- **Gestures:**
  - One-finger drag = move
  - Pinch = scale
  - Two-finger twist = rotate
  - Double-tap = reset to auto-fit
- **Controls:** stroke width, colour (template palette + custom), glow/shadow, and start/finish markers on or off.
- **Snapping:** centre, thirds, and safe-area guides (bleed + frame-rabbet margin) with light haptic ticks (expo-haptics).
- **Map mode:** the route is **geo-locked** to the map. The user pans/zooms the map and route together, and the stroke stays geographically correct.
- **Photo mode:** the route floats freely as a graphic.
- **Multi-route:** each runner's route is its own layer, selected via a chip row.
- Performance target: 60 fps gestures on mid-range Android (e.g. a Pixel 6a-class device). Gesture handling uses react-native-gesture-handler + Reanimated shared values, rendering on Skia.

### 7.5 Map background mode (5 curated styles)

| Style | Look | Reference |
|---|---|---|
| **Graphite** | Dark grey streets, white roads, accent route | Image 1 |
| **Paper** | Off-white, thin black streets, minimal | Scandinavian print look |
| **Blueprint** | Navy with fine cyan lines | Technical / architectural |
| **Noir** | Pure black with faint white lines | Gallery look, high contrast |
| **Terrain** | Muted hillshade + contours | Trail / ultra runners |

- The map auto-frames to the route bounds plus padding. The user can then pan/zoom/rotate.
- Water, parks and roads are toggleable per style (within guardrails).
- **Tech and licensing:** see §8.4. This is the biggest hidden cost/legal risk in the product.

### 7.6 3D-printed route add-on ⚑ needs your definition
My working interpretation is a **physical raised relief of the route line**, 3D-printed (PLA/resin) and mounted on the print or the frame glass. Optionally it includes **elevation extrusion**, where the line height follows the elevation profile.

- **Generation:** the server converts the user's exact positioned route into an STL/3MF, scaled to its print position.
- **Production options:**
  - (a) In-house printer farm: best margin, but you own the operations.
  - (b) A partner such as Craftcloud, Shapeways or a local maker: less control, more cost.
- **Assembly is the hard part.** Someone has to align the relief to the print. That breaks the "zero manual touch" goal and needs a jig or registration marks.
- **Recommendation:** launch it as a **P1 "limited drop"**, starting with framed A3 only, one colour and in-house assembly. Measure attach rate before scaling.

### 7.7 Preview & mock-ups
- Full-screen preview at device resolution, from the same render document as the print.
- Room mock-ups (P1): 3–4 lifestyle scenes (a frame leaning on a wall, as in images 1 and 5) with perspective-warped compositing.
- Watermark: diagonal, subtle, non-removable on free exports.

### 7.8 Checkout & fulfilment
- **Formats & sizes (v1):** A3, A2 and 50×70 cm. Frames in black, oak and white. Paper is 200 gsm+ matte fine art.
- **POD partner:** Prodigi or Gelato (global routing, API, framed options). Send a print-ready PDF (300 DPI, 3 mm bleed, CMYK-safe palette) through the partner API.
- **Order states:** Paid → Editable window → Locked → Rendered → Sent to printer → Shipped → Delivered. Push notifications fire on each state change.
- **Digital:** instant download plus an email copy and in-app library storage.

---

## 8. Technical architecture

### 8.1 Stack (recommended)
| Layer | Choice | Why |
|---|---|---|
| App | **Expo (SDK latest) + Expo Router**, TypeScript | iOS + Android + **web** from one codebase |
| Rendering | **@shopify/react-native-skia** | One drawing engine for preview, and also runs in Node for the server render, so WYSIWYG |
| Gestures/anim | react-native-gesture-handler + **Reanimated 3** (+ Moti for declarative transitions) | Native-thread 60 fps |
| Styling | **NativeWind** (Tailwind for RN) | Lets us port the Tailwind-based UI references (see §10) |
| Maps | **MapLibre** (`@maplibre/maplibre-react-native`) with self-hosted vector tiles (OSM / Protomaps) and 5 custom style JSONs | No per-print map licence fees; full style control |
| Backend | **Supabase** (Postgres, Auth, Storage, Edge Functions) | Fast to build, Row Level Security (RLS) for user data |
| Render worker | Node + Skia (or headless Chromium as a fallback) on a queue (e.g. Cloud Run) | Print-res PNG/PDF |
| Payments | **Stripe** (physical + web), **RevenueCat** (wrapper over IAP for digital) | Handles the store-rules split |
| Fulfilment | Prodigi / Gelato API | Global POD |
| Analytics | PostHog | Funnel + feature flags for pricing tests |

### 8.2 The design document (single source of truth)
Every design is one JSON document, rendered identically by the device and the server:
```json
{
  "templateId": "poster-classic",
  "canvas": { "size": "A3", "orientation": "portrait", "bleedMm": 3 },
  "background": { "type": "map", "styleId": "graphite", "center": [2.33, 48.86], "zoom": 12.1, "bearing": 0 }
              /* or { "type": "photo", "assetId": "...", "crop": {...}, "filters": {...} } */,
  "runners": [
    { "name": "Lucien Moreau", "bib": "11344", "time": "04:34:44", "distanceKm": 42.195,
      "routeId": "r_1", "color": "#F5A623" }
  ],
  "routes": [{ "id": "r_1", "geo": "encoded-polyline", "transform": { "x": 0.5, "y": 0.45, "scale": 0.8, "rotation": 0 },
               "stroke": { "width": 2.5, "glow": false }, "markers": true }],
  "text": { "title": "MARATHON DE PARIS", "subtitle": "13 APRIL 2025" },
  "addons": { "route3d": false }
}
```
Versioned (`schemaVersion`) so old orders still re-render after template changes.

### 8.3 Render pipeline
- **Client:** Skia canvas at screen resolution, live.
- **Server:** Skia at the target pixel size (A2 @ 300 DPI ≈ 4961 × 7016 px), then PDF with bleed, then storage, then the POD API.
- **Map layer:** server-side MapLibre Native (headless) renders the map at print resolution with the same style JSON, so map and route align exactly.

### 8.4 Map licensing ⚠️
- **Mapbox / Google** static maps have **restrictive or extra-cost terms for printed commercial products.** Avoid them, or get a written print licence.
- **Recommended:** OpenStreetMap data (ODbL) via Protomaps/OpenMapTiles, self-hosted, rendered with MapLibre. The only obligation is **attribution** ("© OpenStreetMap contributors"), which can sit in small print on the poster edge or back label. Confirm the exact attribution placement for printed works.

### 8.5 Data model (core tables)
`users`, `strava_connections` (encrypted tokens), `designs` (design doc JSONB, status), `assets` (photos, GPX), `routes`, `orders`, `order_items`, `renders`, `templates`, `map_styles`, `race_presets`.

---

## 9. Platforms
- **iOS + Android via Expo** (as requested).
- **⚑ Strong recommendation: also ship Expo Web (same codebase).** Reasons:
  - (1) Gifters and GPX exporters are often on desktop.
  - (2) Web checkout avoids IAP on digital.
  - (3) SEO landing pages per race ("London Marathon 2026 print") are your cheapest acquisition channel.
  - (4) It removes app-install friction on a one-off purchase.

---

## 10. UI / design system

### 10.1 Reality check on the requested references
All three references are **web React + Tailwind + Motion (framer-motion)** libraries:
- **SmoothUI** (educlopez/smoothui): shadcn-style registry. Components include DynamicIsland, ExpandableCards, ScrollableCardStack, AnimatedInput, FluidMorph, DotMorphButton, ButtonCopy, ScrambleHover, TypewriterText.
- **Amicro** (@subhanhq/amicro): micro-transitions. These include fade-in/up, zoom-in, tilt-card, magnetic-button, text-reveal, and card layouts (ARC fan, CoverFlow, Cascade Stagger, Time Machine Stack, Interactive Carousel).
- **Bencho** (bencho.dev): interactive React components & micro-interactions.

**They will not run in a native Expo app as-is** (they rely on the DOM, CSS and framer-motion). The plan:
1. **Port the motion language, not the code.** Re-implement chosen components in **Reanimated 3 + Moti + NativeWind**, keeping the timing/easing curves from the source.
2. On **Expo Web**, the original components can be used directly for marketing pages.
3. Optionally, use Expo DOM components (`'use dom'`) for non-critical, non-gesture screens. **Never** use them in the editor, where performance matters.

### 10.2 Component mapping (where each reference is used)

| App surface | Reference component | Native implementation |
|---|---|---|
| Template gallery | Amicro **CoverFlow Carousel** / SmoothUI **ScrollableCardStack** | Reanimated carousel with 3D perspective |
| Onboarding | Amicro **Time Machine Stack** + **text-reveal** | Stacked cards, swipe to advance |
| Format picker (Digital/Print/Framed) | SmoothUI **ExpandableCards** | Layout animation (Reanimated `LinearTransition`) |
| Order status / render progress | SmoothUI **DynamicIsland** | Top pill that morphs: "Rendering… → Ready" |
| Big CTA buttons | Amicro **magnetic-button**, SmoothUI **DotMorphButton** | Press scale + haptic + morph to spinner/check |
| Race data inputs | SmoothUI **AnimatedInput** | Floating label + focus underline |
| Finish-time reveal on preview | SmoothUI **ScrambleHover** / **TypewriterText** | Digits scramble then settle (on first preview) |
| Template/runner cards | Amicro **tilt-card** | Gyroscope tilt (expo-sensors), subtle |
| Crew (multi-runner) picker | Amicro **ARC / Corner Fan** card layouts | Fanned runner cards, 1–6 |
| Share/copy link | SmoothUI **ButtonCopy** | Icon morph copy → check |
| Screen entrances | Amicro **fade-up / zoom-in** presets | Moti presets, 180–260 ms |

### 10.3 Visual language
- **Tone:** editorial, gallery-like, athletic (matching the reference prints). The UI stays monochrome so the user's art is the colour.
- **Type:** a condensed grotesk for display (DIN-like, as in image 1) + a neutral sans for UI + a mono for stats (as in image 5).
- **Colour:** neutral greyscale with one accent (e.g. signal orange `#F5A623` or neon yellow, as in image 5). Dark mode is the default, since the art pops on dark.
- **Motion rules:** 150–300 ms, spring-based, always interruptible. Respect "Reduce Motion" (OS setting). Use haptics on snap / select / success.

---

## 11. Non-functional requirements
- **Performance:** editor at 60 fps on mid-range devices; preview in under 1 s after any change; print render under 60 s (P95).
- **Fidelity:** pixel-diff between client preview and server render, with automated visual regression tests per template.
- **Privacy:** GPS tracks reveal home addresses, so the privacy-zone trim is on by default. Track data is never shared publicly. GDPR/UK GDPR: export + delete account.
- **Accessibility:** dynamic type in the UI, VoiceOver labels, Reduce Motion support.
- **Offline:** the editor works offline once assets are loaded; checkout requires a connection.

---

## 12. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Strava API terms** (Nov 2024 update: data only displayed to that athlete, no AI/ML use, branding rules; single-athlete limit until review) | Strava import blocked at scale | Apply for review early; GPX upload is first-class anyway; follow "Powered by Strava" brand rules; never train on data |
| **App store IAP rules** for digital goods | 15–30% margin hit | Physical = Stripe; digital priced for IAP; web checkout |
| **Map licensing** for print | Legal / cost | Self-hosted OSM + MapLibre, attribution on the print |
| **Race trademark** ("London Marathon", logos) | Takedown / legal | Use plain text only, no official logos; T&Cs make the user responsible for content; review with a lawyer; consider official race partnerships (v2) |
| **User photo rights** (official race photos are often © of the photography company) | IP claims | Upload checkbox: "I own or have rights to this photo"; block obvious watermarked race-photo uploads (P1 detection) |
| **3D add-on operations** | Breaks automation, slow fulfilment | Limited P1 drop, jig-based assembly, measure before scaling |
| **Preview ≠ print** (colour) | Returns | Soft-proof toggle, CMYK-safe palettes, matte paper disclaimer |
| **Seasonality** (spring/autumn marathon peaks) | Cash-flow lumpiness | Race calendar marketing; gift seasons (Christmas) |

---

## 13. Analytics & experiments
- **Funnel events:** `template_selected` → `background_set` → `route_imported{source}` → `route_adjusted` → `preview_viewed` → `paywall_viewed` → `checkout_started` → `purchased{format,size,addons}`.
- **Key experiments:** watermark intensity; free template count; digital price point; 3D add-on price; bundle (framed + 3D) vs à la carte.

---

## 14. Roadmap

| Phase | Scope | Indicative duration |
|---|---|---|
| **0. Validate** | Landing page + manual-concierge orders using the Figma templates; test willingness to pay and 3D interest | 2–3 wks |
| **1. MVP (P0)** | Editor, 5 templates, photo + map (5 styles), GPX + Strava, 1–2 runners, digital + print + framed, iOS/Android/web | 10–14 wks |
| **2. Fast follow (P1)** | 3–6 runners, 3D add-on drop, race presets, room mock-ups, gift flow | 6–8 wks |
| **3. Scale (P2)** | Crew collaborative invites, AR wall preview, B2B race-organiser partnerships (bulk finisher prints), club bundles | — |

---

## 15. Open questions for brainstorm

1. **3D route: what exactly is it?** A raised line on the print, a separate desk object, or elevation-extruded? Who prints and assembles it?
2. **Who is the buyer?** The runner for themselves, or a gifter? That changes whether Strava or GPX is the hero flow.
3. **Geography at launch:** UK only (like the competitor) or global? This affects POD partner choice, currency and shipping.
4. **Multi-runner semantics:** did the 6 runners run the *same* race (one route, six times) or *different* races (six routes)? Both double the layout work.
5. **Freemium boundary:** is the free tier there for **virality** (shareable social image) or **lead capture** (email for discount)? I recommend virality, since every watermarked story share is an ad.
6. **Brand:** "Miletag" as the consumer name? Check trademark + App Store name availability.
7. **Expo web:** are you OK shipping web alongside native? I strongly recommend yes.
8. **Official race partnerships:** worth pursuing early for course GPX + licensed logos + bulk sales?

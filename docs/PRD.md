# Miletag — Product Requirements Document (v0.2)

> **Status:** Draft v0.2 · **Owner:** Clement · **Date:** 11 Oct 2026
> **Open decisions are marked `⚑ DECISION`.** Each has a recommended default so the build is not blocked.

### Changelog
| Version | Change |
|---|---|
| v0.2 | **Locked:** Malaysia-first launch (global later); free tier = virality with a "made with miletag" mini watermark; **no subscription**; free = digital export, paid = physical print/frame/delivery; **medal display SKUs added**; web ships alongside iOS + Android. Pricing moved to MYR. IAP risk largely removed. |
| v0.1 | First draft for brainstorm. |

---

## 0. TL;DR

**Miletag turns a race into wall art. Designing and exporting is free; you pay when you want it printed, framed (optionally with your medal) and delivered.**

- **Free:** a live editor and preview. You can drag the GPX route anywhere, use a photo or one of 5 curated map backgrounds, and include 1–6 runners. Export for social, with a small "made with miletag" mark.
- **Paid (physical only):** gallery-quality print, frame, **medal display frame**, and the optional **3D-printed route** add-on, delivered to your door.
- **Launch market:** 🇲🇾 Malaysia (MYR, local print partner, local payments). The architecture is ready for global from day one; the launch market is a config switch, not a rebuild.
- **Platforms:** iOS + Android + Web from one Expo codebase.

**Business model in one line:** the free export is the marketing engine (every shared story is an ad), and the physical product is the revenue.

---

## 1. Problem & opportunity

| Today (competitor flow) | Pain | Miletag answer |
|---|---|---|
| Fill a form, upload a photo + Strava screenshot, then wait 2–3 days | You pay blind and can't see the result | Instant live preview, free |
| Designer chooses where the route sits | The route covers faces or misses the landmark | User drags, scales and rotates the route |
| Screenshot of the route | Low fidelity | GPX/FIT/TCX parsed to vector; optional Strava OAuth |
| 1–2 runners | Clubs, families and run crews are left out | 1–6 runners |
| Photo only | People without a good photo drop off | 5 curated map styles |
| Medal sits in a drawer | No place to display it with the story | **Medal display frames** that pair the print with the medal |
| UK-centric players | Malaysian runners pay international shipping and FX | Local MYR pricing, local print, local delivery |

**Why Malaysia first:** a dense race calendar (city marathons, night runs, bridge races, Borneo trail/ultra events), a strong running-crew culture (multi-runner prints), and a competitive gap: no well-known local "race-to-wall-art" brand with a self-serve editor. ⚑ *Validate the market size with race participation numbers before committing marketing spend.*

---

## 2. Goals, non-goals, success metrics

### Goals (v1)
- G1. Open the app to a finished preview in **under 3 minutes**.
- G2. **WYSIWYG:** the preview matches the print, because the same render engine produces both (see §8).
- G3. Free exports drive organic installs (viral loop; see §6.3).
- G4. 95% or more of physical orders need zero manual design touch.

### Non-goals (v1)
- **No subscription.** No paid digital products.
- Not a social network or Strava replacement.
- No arbitrary map styling. Exactly 5 curated styles.
- No in-house printing (partner print-on-demand, or POD). The exceptions are 3D route assembly and medal-frame QC, if done in-house.
- No international shipping at launch (Malaysia only, Peninsular + East Malaysia).

### Success metrics (first 90 days post-launch)
| Metric | Target | Why |
|---|---|---|
| Activation: % of installs reaching a full preview | ≥ 45% | Editor usability |
| Free export rate: % of previewers who export | ≥ 50% | Fuel for the viral loop |
| Viral coefficient (installs from "made with miletag" shares per exporter) | ≥ 0.2 | The free tier is paying for itself |
| Preview → physical order conversion | ≥ 4% | Revenue engine |
| AOV (MYR) | ≥ RM 180 | Framed + medal + 3D mix |
| Medal-frame share of physical orders | ≥ 25% | Validates the medal SKU |
| Reprint / complaint rate | ≤ 3% | Fidelity |
| Contribution margin per physical order | ≥ 40% | Unit economics |

> ⚑ **DECISION (metrics):** placeholders. Replace them with your own model's numbers.

---

## 3. Target users & personas

| Persona | Description | Key need |
|---|---|---|
| **The Finisher** (core) | Just finished a race; emotional peak in the 0–14 days after | Commemorate it fast, show it off |
| **The Medal Hoarder** | Has a drawer of medals and wants them displayed | Medal + story in one frame |
| **The Crew** | 2–6 people from a run club, family or couple | Everyone's name and time on one piece |
| **The Gifter** | Buying for a runner (birthday, Raya, Christmas, or a race finish) | Easy without the runner's Strava login |
| **The Collector** | Chasing majors or a race series | Consistent series look |

---

## 4. Product scope: feature list & prioritisation

**P0** = MVP · **P1** = fast follow (≤ 8 weeks after launch) · **P2** = later

| # | Feature | Priority |
|---|---|---|
| F1 | Template gallery (photo / map / **medal-ready** templates) | P0 |
| F2 | Photo upload, crop, auto-legibility | P0 |
| F3 | Route import: GPX/FIT/TCX upload + tutorial | P0 |
| F4 | Route import: Strava OAuth (optional) | P0 |
| F5 | Route manipulation: drag / pinch / rotate / snap | P0 |
| F6 | Race data entry (pace auto-calculated) | P0 |
| F7 | Multi-runner: 1–2 at P0, 3–6 at P1 ⚑ | P0 / P1 |
| F8 | Map background, 5 curated styles | P0 |
| F9 | Live preview + room mock-up | P0 / P1 |
| F10 | **Free export with "made with miletag" mini watermark** | P0 |
| F11 | Physical checkout: print / framed / **medal frame** | P0 |
| F12 | **Medal placement in editor** (medal zone + preview) | P0 |
| F13 | 3D-printed route add-on | P1 ⚑ |
| F14 | Malaysian race preset library (official course + date) | P1 |
| F15 | Gift flow (send editable link / gift card) | P1 |
| F16 | Crew collaborative invites | P2 |
| F17 | AR wall preview | P2 |
| F18 | Market expansion (SG → wider SEA → global) | P2 |

---

## 5. Core user flows

### 5.1 Happy path (single runner)
```
Onboarding (3 cards) → Create → choose template (filter: Photo / Map / Medal-ready)
 → Background: Photo or Map
 → Route: Connect Strava (optional) or Upload GPX → stats auto-filled
 → Editor: move route, edit text, colours, (medal zone if medal template)
 → Preview
 → [Export free] → share to IG / WhatsApp / save (with mini watermark)
 → [Get it printed] → format: Print / Framed / Medal Frame (+3D route)
   → size → address (MY) → pay (FPX / e-wallet / card) → tracking
```

### 5.2 No Strava (GPX upload)
Inline, swipeable, per-platform tutorial covering Strava web, Garmin Connect, COROS, Polar, Suunto, Apple Health (via an export app) and Huawei Health. It includes an **"Email me these steps"** option, since export is often easier on desktop. Fallbacks:
- **Race preset** (P1): choose a Malaysian race, and we supply the course line.
- **Draw it** (P2).

### 5.3 Multi-runner (2–6)
Choose a Crew layout and set the count. For each runner, enter name, time, bib, and optionally their own route.
- **Same race:** one shared line plus a stat block per runner.
- **Different races:** colour-coded overlay lines.

Medal Crew Frame: one medal slot per runner (see §7.9).

### 5.4 Edit after purchase
Physical orders are editable until **locked for production**, 2 hours after payment by default, with a visible countdown.

---

## 6. Monetisation: free export, paid physical

### 6.1 What's free vs paid

| Capability | Free | Paid (physical order) |
|---|---|---|
| All templates, all 5 maps, 1–6 runners | ✅ | ✅ |
| Live preview | ✅ | ✅ |
| Export | ✅ Social-resolution PNG/JPG with a **"made with miletag"** mini watermark | n/a, they get the physical product |
| Print-resolution file | ❌ | Used internally for production (not delivered) ⚑ |
| Gallery-quality print, framing, medal frame, 3D route, delivery | ❌ | ✅ |

> **Why everything is free in the editor:** you want maximum exports, because exports are distribution. Gating templates or maps would reduce shares without adding revenue, since revenue only comes from physical orders.

### 6.2 ⚠️ Challenge: free export resolution (the cannibalisation risk)
If the free export is **print resolution**, users can take it to a RM 10 print shop, and your paid print loses to a photocopy.

**Recommendation (default):** free exports are limited to **screen/social sizes**:
- IG Story 1080×1920
- IG Post 1080×1350
- Phone wallpaper (device resolution, up to about 1290×2796)

These look perfect on a phone and soft on an A3 wall. Print-resolution files are **never** exported; they're rendered server-side only for production.

⚑ **DECISION:** confirm. The alternative is a paid hi-res digital download, but that brings back IAP (§6.5) and contradicts "no digital sales".

### 6.3 The watermark (viral loop)
- **Placement:** bottom-centre or bottom-right, inside the safe area. **Small** (about 2–3% of image height), 60–70% opacity, and adaptive colour (light on dark, dark on light).
- **Copy:** `made with miletag` + a tiny route-pin glyph. It's optionally followed by `miletag.app` on the Story export (a link sticker can't be added programmatically, so the URL text does that job).
- **Rules:**
  - The watermark can't be removed on free exports. It's baked into the pixels at render time, not overlaid in the UI.
  - **Physical prints carry no watermark.** ⚑ Optionally add a small `miletag` back-label / frame sticker with a QR code, for referral.
- **Referral hook (P1):** the export includes a short code ("Made with miletag · code CLEM10"). New users get a discount on their first print, and the sharer gets credit.

### 6.4 Indicative pricing (MYR, to validate)

| SKU | Size | Price (RM) |
|---|---|---|
| Fine-art print, unframed | A3 / A2 | 79 / 119 |
| Framed print (black / oak / white) | A3 / A2 | 189 / 269 |
| **Medal Shadow Box** (print + medal compartment) | A3 / 40×50 | 289 / 349 |
| **Print + Medal Hanger Bar** | A3 framed + bar | 239 |
| **Crew Medal Box** (2–6 medals) | 50×70 landscape | 449–549 |
| 3D route add-on | Framed / shadow box only | +99 |
| Delivery | Peninsular / East MY | Free over RM 150 / flat fee ⚑ |

> Check: these prices must clear POD + frame + packaging + courier + payment fees + SST at ≥ 40% contribution margin. Build the unit-economics sheet before you finalise them.

### 6.5 Payments (Malaysia)
- **Since there are no digital sales, app store IAP doesn't apply.** Apple and Google allow physical goods to be paid through your own gateway. ✅ This removes the 15–30% platform cut that was the big risk in v0.1.
- **Payment methods expected in Malaysia:**
  - **FPX** (online banking)
  - **DuitNow QR**
  - **e-wallets:** Touch 'n Go eWallet, GrabPay, Boost, ShopeePay
  - cards
  - **BNPL** (Atome / Grab PayLater) for higher-value frames
- **Gateway options:** Stripe (MY supports cards, FPX and GrabPay), or a local aggregator (e.g. Billplz, iPay88, Razer Merchant Services) for wider e-wallet coverage. ⚑ *Pick based on e-wallet coverage + fees; verify current method support.*
- **Tax:** confirm SST treatment (sales tax on goods vs service tax on design/printing services, and the registration threshold) with a Malaysian tax adviser before pricing.

---

## 7. Feature requirements (detail)

### 7.1 Template system
Templates are **data**: a JSON design document (§8.2). The v1 set, based on the reference images:

| Template | Look | Runners | Medal-ready |
|---|---|---|---|
| **Poster Classic** | Title/date top, map/photo square, name + bib + 3 stats | 1–2 | Variant |
| **Crew Split** | Names + times in columns | 2–6 | Variant |
| **Big Time** | Oversized ghosted finish time, route over photo | 1 | — |
| **Editorial** | Stacked date + title, bottom stat bar | 1–2 | — |
| **Mono Tech** | B&W photo, neon route, monospace stats | 1–3 | — |
| **Medal Classic** *(new)* | Print upper ~65%, medal zone lower ~35% | 1 | ✅ |
| **Medal Side** *(new)* | Landscape: print left, medal right | 1 | ✅ |
| **Crew Medal Row** *(new)* | Landscape: shared route top, row of 2–6 medal slots with name/time under each | 2–6 | ✅ |

Each template declares `supportsRunners`, `supportsMedal`, and `compatibleSkus`. The UI only offers combinations that print correctly.

### 7.2 Photo handling
- Live print-quality gate (effective DPI at the chosen size): green ≥ 200, amber 150–199, red < 150 (warn + acknowledge).
- Auto-legibility: adjustable scrim, B&W, contrast.
- P1: face-aware initial route placement.

### 7.3 Route import
- GPX at P0; FIT and TCX at P1. Parsing runs on-device.
- Privacy-zone trim (default 200 m at both ends). Simplify (Ramer–Douglas–Peucker, RDP), project, normalise.
- Auto-stats come from the file but are editable. **Official chip time is the default.**
- **Strava OAuth (optional):**
  - `activity:read` scope
  - races surfaced first (`workout_type = race`)
  - apply for production athlete capacity early (see §12)

### 7.4 Route manipulation (core differentiator)
- **Gestures:**
  - Drag = move
  - Pinch = scale
  - Twist = rotate
  - Double-tap = reset
- **Controls:** stroke width/colour, glow, start/finish markers.
- **Snapping** to centre, thirds and safe areas (bleed, frame rabbet, **medal zone exclusion**), with haptic ticks.
- **Map mode:** the route is geo-locked to the map. **Photo mode:** the route floats freely.
- 60 fps on mid-range Android (Gesture Handler + Reanimated + Skia).

### 7.5 Map backgrounds (5 curated styles)
| Style | Look |
|---|---|
| **Graphite** | Dark grey streets, white roads, accent route (image 1) |
| **Paper** | Off-white, thin black lines, minimal |
| **Blueprint** | Navy with fine cyan lines |
| **Noir** | Black with faint white lines, high contrast |
| **Terrain** | Muted hillshade + contours (Borneo trail / ultra) |

Auto-framed to the route. Self-hosted OpenStreetMap (OSM) tiles + MapLibre (see §8.4).

### 7.6 3D-printed route add-on ⚑ (still needs your definition)
Working interpretation: a raised route relief, optionally elevation-extruded, mounted on the print.
- **Synergy:** the **Medal Shadow Box has the depth to house the 3D relief**, so bundle them as a "Hero Box" (print + medal + 3D route).
- **Launch:** P1 limited drop, framed/shadow box only, assembled in-house with a jig.

### 7.7 Preview & mock-ups
Full-screen preview from the same design document. Room mock-ups (P1) include the shadow-box depth and the medal render.

### 7.8 Checkout & fulfilment (Malaysia)
- **Print partner:** a **local Malaysian fine-art print + framing partner** (Klang Valley), so delivery takes days, not weeks, with no import duty or FX. Requirements:
  - API or reliable SFTP/email order intake
  - 200 gsm+ matte fine-art paper
  - shadow-box capability
  - QC photos per order
  ⚑ *Shortlist 2–3 partners. Run a test print of each SKU.*
- **Courier:** J&T / Pos Laju / Ninja Van / DHL eCommerce MY, with tracking via an aggregator (e.g. EasyParcel). Frames need rigid packaging; **East Malaysia (Sabah / Sarawak) has a different lead time and cost**, so show it at checkout.
- **Order states:** Paid → Editable (2 h) → Locked → Rendered → At printer → QC → Shipped → Delivered, with push notifications.
- **Global later:** keep a `fulfilmentRegion` abstraction. Global POD (Prodigi / Gelato) plugs in per region without app changes.

### 7.9 Medal placement (new)

**Principle: we never take custody of the customer's medal.** Medals are irreplaceable, and shipping them to us creates liability and slows fulfilment. Every medal SKU is built so the **customer inserts their own medal** at home in under 2 minutes.

**SKUs**

| SKU | Construction | Insertion | Notes |
|---|---|---|---|
| **Medal Shadow Box** | Deep box frame (~4–5 cm), print mounted inside, medal zone with a hidden pin/hook + ribbon channel | Opens from the back (turn buttons / hinged back) | Hero SKU; fits the 3D route too |
| **Print + Medal Hanger Bar** | Standard framed print + matching wood/acrylic bar below, laser-engraved with race name/date | Hang the medal on the bar hooks | Lowest operations cost, flat-pack friendly |
| **Crew Medal Box** | Wide landscape shadow box, 2–6 hooks, each labelled with runner name + time | Back opening | For crews; high AOV |

**Editor requirements**
1. A medal template shows a **medal zone** as a dashed placeholder. Text and route snap away from it (exclusion zone).
2. **Medal preview:** the user can (a) **photograph their medal** (on-device background removal, P1) or (b) pick a generic medal silhouette. Preview only; it's never printed.
3. **Fit check:** the user enters the medal diameter (mm) and ribbon width. Typical medals are about 60–100 mm. We warn if it exceeds the slot (e.g. max 110 mm for A3, ribbon up to 40 mm). Show a "how to measure" tooltip.
4. **Ribbon handling:** choose from three options:
   - (a) ribbon hung visible in a channel above the medal
   - (b) ribbon folded behind
   - (c) ribbon removed
   The preview reflects the choice.
5. **Crew Medal Row:** one slot per runner, aligned with each runner's stat block, so the layout auto-distributes for 2–6 runners.
6. Print file: the medal zone is printed as a **subtle backing panel** (colour/texture from the template) with optional engraved-look text ("FINISHER · 42.195 KM"), so it looks intentional even before the medal goes in.

**Fulfilment notes:** shadow boxes are heavier and bulkier, so check courier volumetric weight in pricing. Include a printed insertion card + QR video guide in every box.

---

## 8. Technical architecture

### 8.1 Stack
| Layer | Choice | Why |
|---|---|---|
| App | **Expo + Expo Router** (TypeScript), **iOS + Android + Web** | One codebase, three platforms |
| Rendering | **@shopify/react-native-skia** (runs on native, web via CanvasKit, and Node) | One engine for preview + production render, so WYSIWYG |
| Gestures / anim | Gesture Handler + **Reanimated** + Moti | Native-thread 60 fps |
| Styling | **NativeWind** | Ports the Tailwind-based UI references |
| Maps | **MapLibre** + self-hosted OSM vector tiles (Protomaps), 5 style JSONs | No per-print licence fees |
| Backend | **Supabase** (Postgres, Auth, Storage, Edge Functions); region close to MY (e.g. Singapore) | Latency + data residency |
| Render worker | Node + Skia + headless MapLibre, on a job queue | Print-res PDF |
| Payments | Stripe and/or local gateway (§6.5) | MY payment methods |
| Fulfilment | Local partner adapter → later Prodigi / Gelato adapters | `fulfilmentRegion` abstraction |
| Analytics | PostHog | Funnel, viral loop attribution, feature flags |

> **No RevenueCat / IAP needed** (no digital sales).

### 8.2 Design document (single source of truth)
```json
{
  "schemaVersion": 2,
  "templateId": "medal-classic",
  "sku": { "type": "medal-shadow-box", "size": "A3", "frame": "oak" },
  "canvas": { "orientation": "portrait", "bleedMm": 3 },
  "background": { "type": "map", "styleId": "graphite", "center": [101.69, 3.14], "zoom": 12.3, "bearing": 0 },
  "runners": [{ "name": "Clement", "bib": "21095", "time": "03:58:12", "distanceKm": 42.195,
                "routeId": "r_1", "color": "#F5A623", "medalSlot": 0 }],
  "routes": [{ "id": "r_1", "geo": "encoded-polyline",
               "transform": { "x": 0.5, "y": 0.38, "scale": 0.8, "rotation": 0 },
               "stroke": { "width": 2.5, "glow": false }, "markers": true }],
  "medals": [{ "slot": 0, "diameterMm": 85, "ribbon": "visible", "previewAssetId": "m_1" }],
  "text": { "title": "KL MARATHON", "subtitle": "5 OCTOBER 2026" },
  "export": { "watermark": true },
  "addons": { "route3d": false }
}
```

### 8.3 Render pipeline
- **Client:** Skia live preview. Free exports render **on-device** at social resolution with the watermark baked in, so there's zero server cost for the free tier.
- **Server (paid only):** Skia + headless MapLibre at print size (A2 @ 300 DPI ≈ 4961×7016), then a PDF with bleed (+ medal-zone backing panel), then the partner.
- Visual regression tests compare client and server renders per template.

### 8.4 Map licensing
Self-hosted OSM (ODbL) + MapLibre. Attribution "© OpenStreetMap contributors" goes in small print on the poster edge or back label. Avoid Mapbox/Google static maps for print unless you have a written licence.

### 8.5 Data model
`users`, `strava_connections`, `designs` (JSONB), `assets`, `routes`, `templates`, `map_styles`, `skus` (type, size, frame, medalSlots, maxMedalMm, region availability), `orders`, `order_items`, `renders`, `exports` (for viral attribution), `referral_codes`, `race_presets` (region-tagged), `fulfilment_partners` (region-tagged).

---

## 9. Platforms (locked)
- **iOS, Android, Web** from one Expo codebase, all at launch.
- Web is also the **SEO surface**: one landing page per Malaysian race (e.g. "KL Marathon 2026 poster"), opening straight into the editor with the course preset.
- Feature parity across platforms. On web, gesture editing uses mouse/trackpad equivalents (drag, scroll-zoom, shift-drag rotate).

---

## 10. UI / design system

### 10.1 Reality check on the references
SmoothUI, Amicro and Bencho are **web React + Tailwind + Motion** libraries, so they don't run natively.
- **Native:** port the motion language to Reanimated + Moti + NativeWind.
- **Web:** marketing pages can use the originals directly.
- **Never** use DOM components in the editor.

### 10.2 Component mapping
| App surface | Reference | Native implementation |
|---|---|---|
| Template gallery | Amicro **CoverFlow** / SmoothUI **ScrollableCardStack** | Reanimated 3D carousel |
| Onboarding | Amicro **Time Machine Stack** + **text-reveal** | Swipe stack |
| Format picker (Print / Framed / Medal Box) | SmoothUI **ExpandableCards** | Layout transitions |
| Render / order status | SmoothUI **DynamicIsland** | Morphing top pill |
| CTAs ("Export", "Get it printed") | Amicro **magnetic-button**, SmoothUI **DotMorphButton** | Press scale + haptic + morph to ✓ |
| Inputs | SmoothUI **AnimatedInput** | Floating label |
| Finish-time reveal | SmoothUI **ScrambleHover / TypewriterText** | Digit scramble → settle |
| Template / medal cards | Amicro **tilt-card** | Gyro tilt (subtle) |
| Crew picker (1–6) | Amicro **ARC / Corner Fan** | Fanned runner cards |
| Medal "drop-in" moment | Amicro **zoom-in** + spring | Medal drops into slot on preview |
| Share / copy | SmoothUI **ButtonCopy** | Icon morph |
| Screen entrances | Amicro **fade-up / zoom-in** | Moti presets, 180–260 ms |

### 10.3 Visual language
Editorial, gallery-like, athletic. A monochrome UI, so the user's art is the colour. Condensed grotesk display + neutral UI sans + mono for stats. One accent colour. Dark mode by default. Motion: 150–300 ms springs, interruptible, respects Reduce Motion (OS setting), with haptics on snap/select/success.

---

## 11. Non-functional requirements
- **Performance:**
  - editor at 60 fps on mid-range Android (the dominant Malaysian device segment)
  - preview under 1 s
  - free export under 3 s on-device
  - print render under 60 s (P95)
- **Privacy:**
  - Malaysia PDPA (Personal Data Protection Act 2010, as amended 2024)
  - GDPR-ready, for global expansion later
  - privacy-zone trim on by default
  - account export + delete
- **Localisation:**
  - English at launch; Bahasa Malaysia UI at P1
  - MYR, DD/MM/YYYY, km
- **Accessibility:** dynamic type, screen-reader labels, Reduce Motion.
- **Offline:** the editor and free export work offline once assets are loaded.

---

## 12. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Free export cannibalises prints** | Revenue | Social-res only; print-res never leaves the server (§6.2) |
| **Strava API terms / athlete cap** | Strava import limited | Apply early; GPX first-class; follow brand rules |
| **Medal fit / damage complaints** | Returns, reviews | Fit check in editor; customer inserts the medal; never take custody; clear max-size spec |
| **Shadow-box shipping damage** (esp. East MY) | Margin | Rigid packaging, courier insurance, test drops |
| **Local partner capacity at race peaks** | Delays | 2 partners; production SLA; cap daily orders via queue |
| **Race trademarks** (names/logos) | Takedown | Plain text only, no logos; T&Cs; pursue race partnerships |
| **Race photo copyright** | IP claims | Rights checkbox; detect watermarked race-photo uploads (P1) |
| **SST / tax treatment** | Pricing error | Malaysian tax adviser before launch |
| **Map licensing** | Legal / cost | Self-hosted OSM + attribution |
| **3D add-on operations** | Breaks automation | Limited P1 drop, jig assembly |

---

## 13. Analytics & experiments
- **Funnel:** `template_selected` → `background_set` → `route_imported{source}` → `route_adjusted` → `preview_viewed` → `export_free{format}` / `checkout_started{sku}` → `purchased{sku,size,addons}`.
- **Viral:** `export_shared{channel}`, `install_attributed{referral_code}`, and K-factor per cohort.
- **Experiments:**
  - watermark size/position (shares vs installs)
  - medal SKU pricing
  - "Hero Box" bundle vs à la carte
  - free delivery threshold

---

## 14. Roadmap

| Phase | Scope | Indicative duration |
|---|---|---|
| **0. Validate (MY)** | Landing page + concierge orders via Figma templates at 1–2 Malaysian races; test willingness to pay for framed vs medal box; shortlist + test-print with local partners | 3–4 wks |
| **1. MVP** | iOS + Android + Web; editor; 8 templates incl. 3 medal-ready; photo + 5 maps; GPX + Strava; 1–2 runners; free watermarked export; print / framed / medal shadow box / hanger bar; MY payments + delivery | 12–14 wks |
| **2. Fast follow** | 3–6 runners + Crew Medal Box; 3D route drop ("Hero Box"); MY race presets; referral codes; room mock-ups; BM localisation; medal photo background removal | 6–8 wks |
| **3. Expand** | Singapore → SEA → global (POD adapters per region); race organiser B2B (bulk finisher frames); AR preview | — |

---

## 15. Open questions (remaining)

1. **3D route definition:** a raised line in the frame, a separate object, or elevation-extruded? In-house or partner? *(Default: raised line inside shadow box / framed only, P1.)*
2. **Free export resolution:** confirm social-res only, with no print-res file ever delivered (§6.2). *(Default: yes.)*
3. **Back-label QR on physical prints:** yes or no? *(Default: yes, a small sticker on the back of the frame, not on the art.)*
4. **Multi-runner semantics:** same race vs different races at launch? *(Default: same race.)*
5. **Medal SKUs at MVP:** all three, or Shadow Box + Hanger Bar only? *(Default: Shadow Box + Hanger Bar at P0, Crew Medal Box at P1.)*
6. **Local print partner:** do you already have a printer/framer relationship in Malaysia?
7. **Race partnerships:** approach Malaysian organisers early for course GPX, official logos and bundled finisher frames?

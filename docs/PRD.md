# Miletag — Product Requirements Document (v0.3)

> **Status:** Draft v0.3 · **Owner:** Clement · **Date:** 11 Oct 2026
> **Open decisions are marked `⚑ DECISION`.** Each has a recommended default so the build is not blocked.

### Changelog
| Version | Change |
|---|---|
| v0.3 | **Locked:** 3D route = raised line 3D-printed from the user's GPX, paid add-on; free export = social sizes only; **Miletag prints in-house** (fine-art prints + 3D routes + framing/assembly); runner count (1–6) is a user selection, **supported only by specific designs**; **one medal, one slot** per medal design; **everything ships in v1**. Product range simplified to 3 frame formats. New P0: **Production Console** (internal ops tool). |
| v0.2 | Malaysia-first; free watermarked export; no subscription; physical-only revenue; medal SKUs; web + iOS + Android. |
| v0.1 | First draft. |

---

## 0. TL;DR

**Miletag turns a race into wall art. Designing and exporting is free; you pay when you want it printed, framed, raised in 3D, or framed with your medal. Miletag produces it all in-house and delivers it.**

- **Free:**
  - live editor and preview
  - drag the GPX route anywhere
  - photo or one of 5 curated map backgrounds
  - pick 1–6 runners, where the design supports it
  - social-size export with a small "made with miletag" mark
- **Paid (physical only, made in-house):**
  - fine-art print (unframed or framed)
  - **Deep Frame** with the optional **3D raised route** and/or **one medal slot**
  - delivered to your door
- **Launch market:** 🇲🇾 Malaysia. Global later.
- **Platforms:** iOS + Android + Web (one Expo codebase).
- **v1 scope:** everything above ships in the first version.

---

## 1. Problem & opportunity

| Today (competitor flow) | Pain | Miletag answer |
|---|---|---|
| Fill a form, upload a photo + screenshot, then wait 2–3 days | You pay blind | Instant live preview, free |
| Designer places the route | The route covers faces or misses the landmark | User drags, scales and rotates the route |
| Flat route printed on paper | Looks like every other poster | **3D raised route** you can touch |
| Medal sits in a drawer | No place to display it | **Deep Frame with a medal slot** |
| 1–2 runners | Crews and families are left out | 1–6 runners on crew designs |
| Photo only | No good photo = no product | 5 curated map styles |
| UK-centric players | Malaysian runners pay international shipping + FX | Made and shipped in Malaysia, priced in MYR |

**Why in-house production is a moat (and a risk):** owning print + 3D + assembly gives you margin, quality control and a product (3D raised route) that print-on-demand (POD) competitors can't easily copy. The cost is capex, capacity limits at race peaks, and an operations team, i.e. you. See §7.10 and §12.

---

## 2. Goals, non-goals, success metrics

### Goals (v1)
- G1. Open the app to a finished preview in **under 3 minutes**.
- G2. **WYSIWYG:** the preview matches the print and the 3D route placement (same render engine + same geometry).
- G3. Free exports drive organic installs (viral loop).
- G4. **Every paid order arrives at the Production Console production-ready**: print PDF + 3D model file + assembly sheet, with zero manual design work.

### Non-goals (v1)
- No subscription; no paid digital products; no print-resolution export to users.
- Not a social network or a Strava replacement.
- No arbitrary map styling. Exactly 5 curated styles.
- No international shipping at launch.
- No multi-medal frames. **One medal per frame, maximum.**

### Success metrics (first 90 days post-launch)
| Metric | Target |
|---|---|
| Activation: installs reaching a full preview | ≥ 45% |
| Free export rate: previewers who export | ≥ 50% |
| Viral coefficient (installs per exporter) | ≥ 0.2 |
| Preview → physical order | ≥ 4% |
| AOV | ≥ RM 180 |
| 3D route attach rate (on Deep Frame orders) | ≥ 40% |
| Medal slot attach rate (on Deep Frame orders) | ≥ 30% |
| Order-to-dispatch time (P90) | ≤ 3 working days |
| Reprint / complaint rate | ≤ 3% |
| Contribution margin per order | ≥ 50% (no POD middleman) |

> ⚑ **DECISION (metrics):** placeholders. Replace them with your model's numbers.

---

## 3. Target users & personas

| Persona | Need |
|---|---|
| **The Finisher** (core) | Commemorate a race fast, while the feeling is fresh |
| **The Medal Owner** | Display the medal with the story behind it |
| **The Crew** (2–6) | Everyone's name and time on one piece |
| **The Gifter** | Easy without the runner's Strava login |
| **The Collector** | Consistent series look across races |

---

## 4. Product scope: all P0 (v1)

Everything below ships in v1. The P0 list is long, which is why the build estimate is longer than in v0.2 (see §14).

| # | Feature |
|---|---|
| F1 | Design gallery, **filtered by runner count and capabilities** (photo / map / medal / 3D-ready) |
| F2 | Photo upload, crop, auto-legibility |
| F3 | Route import: GPX/FIT/TCX + per-platform tutorial |
| F4 | Route import: Strava OAuth (optional) |
| F5 | Route manipulation: drag / pinch / rotate / snap |
| F6 | Race data entry (pace auto-calculated) |
| F7 | **Runner count selector (1–6)**, only on designs that support it |
| F8 | Map background, 5 curated styles |
| F9 | Live preview + room mock-up (incl. 3D route and medal rendering) |
| F10 | Free social-size export with "made with miletag" watermark |
| F11 | Physical checkout: Print / Framed / Deep Frame |
| F12 | **3D raised route add-on** (Deep Frame only) |
| F13 | **Medal slot** (medal designs + Deep Frame only, 1 medal) |
| F14 | Malaysian race preset library (course line + date) |
| F15 | Referral codes on exports |
| F16 | **Production Console** (internal): order queue, file downloads, status, labels |
| F17 | Bahasa Malaysia UI ⚑ (default: P1, English-only launch) |

---

## 5. Core user flows

### 5.1 Main flow
```
Onboarding (3 cards)
 → Create → "How many runners?" [1] [2] [3] [4] [5] [6]  (default 1)
 → Design gallery (only designs supporting that count; filter chips: Photo · Map · Medal · 3D-ready)
 → Background: Photo or Map
 → Route: Connect Strava (optional) or Upload GPX → stats auto-filled
 → Editor: move route, edit text, colours (medal zone shown on medal designs)
 → Preview (toggle: "Show 3D route" / "Show medal")
 → [Export free]  → IG Story / IG Post / Wallpaper, with mini watermark
 → [Get it made] → format: Print / Framed / Deep Frame
       → if Deep Frame: [+ 3D raised route]  [+ Medal slot (medal designs)]
       → size → address (MY) → pay (FPX / DuitNow / e-wallet / card / BNPL) → tracking
```

### 5.2 Runner count rules
- The runner count is **chosen first**, and the gallery shows **only designs that support that count**. Users can change the count later in the editor; if the current design doesn't support the new count, they're prompted to switch design.
- **Same race (default):** one shared route line + one stat block per runner (name, time, pace, bib).
- **Different races** ⚑ (default: **not in v1**). One route per design keeps the 3D route to a single line and keeps layouts clean.

### 5.3 No Strava (GPX upload)
Swipeable tutorial cards for Strava web, Garmin Connect, COROS, Polar, Suunto, Apple Health (via an export app) and Huawei Health, plus "Email me these steps". Fallback: **Malaysian race preset**, where the user picks the race and we supply the course line.

### 5.4 Edit after purchase
Editable until **locked for production**, 2 hours after payment by default, with a countdown. After lock, the order enters the Production Console queue.

---

## 6. Monetisation: free export, paid physical

### 6.1 Free vs paid
| | Free | Paid |
|---|---|---|
| All designs, all 5 maps, runner counts | ✅ | ✅ |
| Live preview (incl. 3D + medal preview) | ✅ | ✅ |
| Export | **Social sizes only**, watermarked | n/a |
| Print-resolution file | ❌ Never leaves the server | Used in-house for production |
| Print / frame / 3D route / medal slot / delivery | ❌ | ✅ |

### 6.2 Free export (locked)
- **Sizes:** IG Story 1080×1920, IG Post 1080×1350, phone wallpaper (device resolution).
- **Rendering:** rendered **on-device**, with zero server cost.
- **Watermark:**
  - `made with miletag` + route-pin glyph, bottom safe area
  - about 2–3% of image height, 60–70% opacity, adaptive colour
  - baked into the pixels
  - Story exports add `miletag.app`
- **Referral code on export** (e.g. `CLEM10`): first-print discount for the new user, credit for the sharer.
- **Physical products carry no watermark.** A small QR back-label sits on the frame back, not on the art.

### 6.3 Product range: 3 formats (simplified from v0.2)

| Format | What it is | 3D route | Medal slot |
|---|---|---|---|
| **Print** | Fine-art paper, unframed, shipped rolled or flat | ❌ | ❌ |
| **Framed** | Standard picture frame, glass sits flat on the print | ❌ (glass would crush it) | ❌ |
| **Deep Frame** | A frame with a ~3–4 cm gap between glass and print, so objects can sit inside (a.k.a. "shadow box") | ✅ optional | ✅ optional, medal designs only |

> **Why 3D and medal require the Deep Frame:** both are physical objects that stand off the paper. In a standard frame, the glass presses flat against the print. The Deep Frame is the only format that physically fits them, and it ships safely (the glass protects the relief and medal).

> Dropped from v0.2: the *Hanger Bar* (medal hung on a bar outside the frame) and the *Crew Medal Box* (multiple medals), per the one-medal rule.

### 6.4 Indicative pricing (MYR, to validate with your cost sheet)

| Item | A3 | A2 |
|---|---|---|
| Print (unframed) | RM 79 | RM 119 |
| Framed | RM 189 | RM 269 |
| Deep Frame | RM 249 | RM 339 |
| **+ 3D raised route** | +RM 99 | +RM 139 |
| **+ Medal slot** | +RM 39 | +RM 39 |
| "Hero" (Deep Frame + 3D + medal) | RM 359 *(bundle −RM 28)* | RM 489 *(bundle −RM 28)* |
| Delivery | Free over RM 150 (Peninsular); East MY flat fee ⚑ | |

> These must clear paper + ink + filament + frame + glass + packaging + courier (volumetric weight) + payment fees + SST + **your labour time** at ≥ 50% contribution margin.

### 6.5 Payments (Malaysia)
- **Physical goods only, so no app store in-app purchase (IAP).** Use your own gateway. ✅
- **Methods:** FPX, DuitNow QR, Touch 'n Go eWallet, GrabPay, Boost, ShopeePay, cards, BNPL (Atome / Grab PayLater).
- **Gateway:** Stripe (MY: cards, FPX, GrabPay) or a local aggregator (Billplz / iPay88 / Razer) for wider e-wallet coverage. ⚑ *Verify method support + fees.*
- **Tax:** confirm SST treatment with a Malaysian tax adviser.

---

## 7. Feature requirements (detail)

### 7.1 Design catalogue
Designs are **data** (JSON design documents, §8.2). Each declares what it supports:

```
supportsRunners: [1] | [1,2] | [2,3,4,5,6] ...
supportsMedal:   true | false
supports3D:      true | false
formats:         ["print","framed","deep"]
```

**v1 catalogue**

| Design | Look | Runners | Medal | 3D-ready |
|---|---|---|---|---|
| **Poster Classic** | Title/date top, map/photo square, name + bib + 3 stats (image 1) | 1 | — | ✅ |
| **Big Time** | Ghosted oversized finish time over photo (image 3) | 1 | — | ✅ |
| **Editorial** | Stacked date + title, bottom stat bar (image 4) | 1 | — | ✅ |
| **Mono Tech** | B&W photo, neon route, monospace stats (image 5) | 1 | — | ✅ |
| **Duo** | Two names + times in columns (image 2) | 2 | — | ✅ |
| **Crew Grid** | Shared route top, stat grid below | 3–6 | — | ✅ |
| **Medal Classic** | Print upper ~65%, medal slot lower ~35% (portrait) | 1 | ✅ | ✅ |
| **Medal Side** | Landscape: route/photo left, medal slot right | 1 | ✅ | ✅ |

⚑ **DECISION:** Should a medal design also support 2+ runners? The default is **no**: one medal = one runner's story. A couple with one medal is an edge case.

### 7.2 Photo handling
Live DPI gate (green ≥ 200 / amber 150–199 / red < 150, warn + acknowledge), adjustable scrim, B&W, contrast.

### 7.3 Route import
- GPX, FIT and TCX, parsed on-device.
- Privacy-zone trim (200 m default). Simplify (Ramer–Douglas–Peucker, RDP), project to Web Mercator, normalise.
- Chip time is the default (editable).
- Strava OAuth optional (`activity:read`; races first). Apply early for production athlete capacity.

### 7.4 Route manipulation
- **Gestures:** drag / pinch / twist / double-tap reset.
- **Controls:** stroke width/colour, glow, start/finish markers.
- **Snapping:** centre, thirds and safe areas, plus exclusion of the medal zone and the 3D printable area (§7.7), with haptic ticks.
- **Modes:** map mode is geo-locked; photo mode floats freely.
- 60 fps on mid-range Android.

### 7.5 Map backgrounds (5 styles)
Graphite · Paper · Blueprint · Noir · Terrain. Self-hosted OSM + MapLibre, auto-framed to the route.

### 7.6 Free export
See §6.2.

### 7.7 3D raised route (locked definition)

**What the customer gets:** the route line from **their own GPX**, 3D-printed as a raised relief and mounted on the print **exactly over the printed route position** they chose in the editor, inside a Deep Frame.

**Customer-facing options (v1)**
- **Colour:** 4–6 filament colours matched to the design palettes (e.g. white, black, signal orange, neon yellow, silver, gold) ⚑.
- **Printed line underneath:**
  - on (the relief sits on top of the printed line), or
  - off (the relief stands alone on the background).
  Default: on, which hides small alignment tolerance.
- **Height profile** ⚑:
  - (a) **flat raised line**, uniform height (default, v1)
  - (b) **elevation profile**, where the height follows elevation (v1.1; nice upsell, but harder to mount)

**Editor behaviour**
- Opting in shows a **3D preview toggle**: Skia-rendered bevel/shadow on the route, plus a slight parallax on device tilt.
- **Printable area guard:** the route bounding box must fit within the **3D printer's build plate** (see below). If the user scales the route beyond it, show "Too large for 3D. Scale down or split" (auto-split in v1.1).
- **Simplification for printability:**
  - minimum line width (e.g. 2.5 mm)
  - minimum turn radius / smoothing on hairpin turns
  - remove tiny loops shorter than about 3 mm
  - previewed as the user will receive it

**Model generation (server, on order lock)**
1. Take the route polyline in **print millimetres** (from the design document transform).
2. Smooth, then offset to a ribbon of width *w* (2.5–4 mm, design-dependent).
3. Extrude to height *h* (2–3 mm flat).
4. Boolean union for self-intersections (use a robust geometry library, e.g. Manifold).
5. Add **registration tabs/pins** at start and finish.
6. Export **3MF/STL** + a **1:1 alignment template PDF**.
- Validation: manifold check, minimum feature size, fits bed. Failures route to manual review in the Production Console.

**Production constraints (in-house)** ⚑ *depends on your printer choice*
- **Build plate:** a typical consumer printer bed is about 256×256 mm. A3 is 297×420 mm, so a large route may exceed it. Options:
  - (a) limit the 3D route area to ≤ 250×250 mm (default for v1)
  - (b) buy a large-format printer (e.g. 350×350 mm+)
  - (c) split into keyed segments (v1.1)
- **Print time:** about 30–120 min per relief at these sizes, so a **printer farm** is needed for race-week peaks. Capacity model in §7.10.
- **Mounting:** an alignment jig + registration marks printed on the paper (hidden under the relief) + acid-free adhesive. Target ≤ 10 min of assembly per unit.

### 7.8 Medal slot (locked: one medal, one slot)
- **Available on:** medal designs (Medal Classic, Medal Side) **+ Deep Frame**.
- **Customer inserts their own medal.** We never take custody of medals. The Deep Frame has an **openable back** (turn buttons / hinged), a **pin/hook** at the slot position, and a **ribbon channel**.
- **Editor:**
  1. The medal zone is shown as a dashed placeholder. Text, route and 3D area are excluded from it.
  2. **Medal preview:** photograph your medal (on-device background removal) or pick a generic silhouette. Preview only, never printed.
  3. **Fit check:** enter the medal diameter (mm). The slot supports up to about 110 mm (A3) / 130 mm (A2) ⚑, with a "how to measure" tooltip.
  4. **Ribbon:** visible above the medal / folded behind / removed. The preview reflects the choice.
- **Print file:** the medal zone gets a subtle backing panel + optional text ("FINISHER · 42.195 KM"), so the frame looks intentional before the medal goes in.
- **In the box:** an insertion card + QR video guide.

### 7.9 Checkout & delivery
- **Formats:** Print / Framed / Deep Frame. **Sizes:** A3, A2. **Frame colours:** black / oak / white.
- **Courier:** J&T / Pos Laju / Ninja Van / DHL eCommerce via an aggregator (e.g. EasyParcel) for rates + labels.
- **Delivery:** Deep Frames are bulky, so price by volumetric weight, and East Malaysia gets its own lead time and fee shown at checkout.
- **Order states:**
  - **Customer sees:** Paid → Editable (2 h) → In production → Shipped → Delivered.
  - **Internal states:** Locked → Files ready → Printing → 3D printing → Assembly → QC → Packed → Shipped.

### 7.10 Production Console (new, internal, P0)

Since Miletag *is* the print partner, the app needs a back-office. This is a web-only admin app in the same repo, gated by role.

| Capability | Detail |
|---|---|
| **Order queue** | Kanban by state (Files ready → Printing → 3D → Assembly → QC → Packed → Shipped); filters by format, size, deadline, East/West MY |
| **Job files** | Per order, download the **print PDF** (300 DPI, bleed, crop marks, medal backing panel), the **3D model (3MF/STL)**, the **alignment template PDF**, and an **assembly sheet** (thumbnail, frame colour, filament colour, medal slot yes/no, ribbon option) |
| **Batching** | Group print PDFs by paper size for sheet efficiency; group 3D jobs by filament colour to reduce colour swaps; export a batch to the printer / slicer |
| **QC step** | Checklist + photo upload of the finished piece (photo optionally sent to the customer: "Here's your print before it ships") |
| **Shipping** | Generate a courier label via the aggregator API; tracking number pushed to the customer automatically |
| **Capacity & SLA** | Daily capacity settings (prints/day, 3D units/day, assembly units/day). When the queue exceeds capacity, **checkout shows a longer delivery estimate automatically** (protects reviews at race peaks) |
| **Inventory** | Frames by size/colour, glass, paper, filament by colour, medal hardware, with low-stock alerts |
| **Exceptions** | Failed 3D validation, low-DPI acknowledged orders, address issues, reprints |

**Capacity model (fill with real numbers) ⚑**

| Station | Unit time (est.) | Units/day per station (8 h) |
|---|---|---|
| Fine-art print (large-format pigment printer) | ~5–10 min | ~50–90 |
| 3D route (per printer) | ~30–120 min | ~4–16 |
| Assembly + mounting + QC | ~15–25 min | ~20–30 |

Bottleneck: **3D printing.** Size the printer farm on the race-week peak, not on the average.

---

## 8. Technical architecture

### 8.1 Stack
| Layer | Choice |
|---|---|
| App | **Expo + Expo Router** (TypeScript): iOS + Android + Web |
| Production Console | Same repo, web-only route group (`/(admin)`), role-based access via Supabase |
| Rendering | **@shopify/react-native-skia** (native, web via CanvasKit, Node) |
| Gestures / anim | Gesture Handler + Reanimated + Moti |
| Styling | NativeWind |
| Maps | MapLibre + self-hosted OSM vector tiles, 5 style JSONs |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions), region near MY (Singapore) |
| Render worker | Node + Skia + headless MapLibre → print PDF |
| **3D worker** | Geometry pipeline (e.g. Manifold / JSCAD in Node, or Python trimesh/shapely) → 3MF/STL + alignment PDF |
| Payments | Stripe and/or local gateway |
| Shipping | Courier aggregator API (labels + tracking) |
| Analytics | PostHog |

### 8.2 Design document (single source of truth)
```json
{
  "schemaVersion": 3,
  "designId": "medal-classic",
  "runnerCount": 1,
  "order": { "format": "deep", "size": "A3", "frame": "oak",
             "route3d": { "enabled": true, "color": "gold", "profile": "flat", "printedLineBelow": true },
             "medal":   { "enabled": true, "diameterMm": 85, "ribbon": "visible", "previewAssetId": "m_1" } },
  "background": { "type": "map", "styleId": "graphite", "center": [101.69, 3.14], "zoom": 12.3, "bearing": 0 },
  "runners": [{ "name": "Clement", "bib": "21095", "time": "03:58:12", "distanceKm": 42.195 }],
  "route": { "geo": "encoded-polyline",
             "transform": { "x": 0.5, "y": 0.38, "scale": 0.8, "rotation": 0 },
             "stroke": { "width": 2.5, "color": "#F5A623" }, "markers": true },
  "text": { "title": "KL MARATHON", "subtitle": "5 OCTOBER 2026" },
  "export": { "watermark": true }
}
```
One route per design (same-race rule). The same `route.transform` drives the 2D print position, the 3D model coordinates and the alignment template, which is what guarantees the relief lands on the printed line.

### 8.3 Pipelines
- **Free export:** on-device Skia at social resolution, watermark baked in.
- **Order lock:**
  - Render worker → print PDF
  - 3D worker → 3MF/STL + alignment PDF
  - Assembly sheet
  - All of it lands in the Production Console as "Files ready".
- **Tests:** visual regression tests per design, plus 3D geometry validation tests (manifold, minimum feature size, fits bed).

### 8.4 Map licensing
Self-hosted OSM (ODbL) + MapLibre. Attribution goes on the poster edge or back label. No Mapbox/Google static maps for print without a licence.

### 8.5 Data model
`users`, `strava_connections`, `designs` (catalogue: supportsRunners/Medal/3D), `projects` (user design docs, JSONB), `assets`, `orders`, `order_items`, `production_jobs` (state, station, operator, timestamps), `job_files` (pdf/3mf/alignment/assembly), `qc_records`, `inventory_items`, `capacity_settings`, `shipments`, `exports`, `referral_codes`, `race_presets`, `staff_roles`.

---

## 9. Platforms (locked)
- **Customer app:** iOS, Android and Web from one Expo codebase, all at launch.
- **Production Console:** web only.
- Web also serves SEO pages per Malaysian race, opening directly into the editor with the course preset.

---

## 10. UI / design system

### 10.1 References
SmoothUI, Amicro and Bencho are web React + Tailwind + Motion libraries.
- **Native:** port the motion language to Reanimated + Moti + NativeWind.
- **Web:** marketing pages + the Production Console can use the originals directly.

### 10.2 Component mapping
| App surface | Reference | Implementation |
|---|---|---|
| Runner count selector (1–6) | Amicro **ARC / Corner Fan** | Fanned runner cards; tap to add/remove |
| Design gallery | Amicro **CoverFlow** / SmoothUI **ScrollableCardStack** | 3D carousel |
| Onboarding | Amicro **Time Machine Stack** + **text-reveal** | Swipe stack |
| Format picker (Print / Framed / Deep Frame) | SmoothUI **ExpandableCards** | Expands to show 3D + medal add-ons |
| 3D route toggle | Amicro **tilt-card** | Route bevel + gyro parallax |
| Medal drop-in | Amicro **zoom-in** + spring | Medal drops into slot |
| Order / production status | SmoothUI **DynamicIsland** | "Printing → 3D printing → Assembly → Shipped" |
| CTAs | Amicro **magnetic-button**, SmoothUI **DotMorphButton** | Press + haptic + morph |
| Inputs | SmoothUI **AnimatedInput** | Floating label |
| Finish-time reveal | SmoothUI **ScrambleHover / TypewriterText** | Digit scramble |
| Share / copy referral code | SmoothUI **ButtonCopy** | Icon morph |
| Screen entrances | Amicro **fade-up / zoom-in** | Moti presets, 180–260 ms |

### 10.3 Visual language
- **Tone:** editorial, gallery-like, athletic.
- **Colour:** monochrome UI with one accent; dark mode by default.
- **Type:** condensed grotesk display + neutral sans + mono for stats.
- **Motion:** 150–300 ms springs, interruptible, respects Reduce Motion (OS setting), haptics.

---

## 11. Non-functional requirements
- **Performance:**
  - editor at 60 fps on mid-range Android
  - preview under 1 s
  - free export under 3 s
  - order files ready under 2 min after lock
- **Privacy:** Malaysia PDPA, GDPR-ready, privacy-zone trim, account export/delete.
- **Localisation:** English at launch (BM ⚑), MYR, DD/MM/YYYY, km.
- **Accessibility:** dynamic type, screen-reader labels, Reduce Motion.
- **Offline:** editor + free export work offline once assets are loaded.

---

## 12. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **In-house capacity at race peaks** (3D is the bottleneck) | Late deliveries, bad reviews | Capacity-aware delivery estimates; printer farm sized on peak; pre-race "order early" campaigns |
| **Capex + ops load on the founder** | Cash + time | Start with minimum viable kit; track unit time per station; hire part-time assembly before peak |
| **3D relief misaligned with printed line** | Returns | Registration pins + jig + printed line underneath by default |
| **3D route exceeds printer bed** | Can't fulfil | 250×250 mm guard in the editor (v1); split/large printer later |
| **Relief detaching in transit** | Damage | Adhesive spec + transit drop tests; Deep Frame glass retains it |
| **Medal fit complaints** | Returns | Fit check; clear max size; customer inserts medal |
| **Free export cannibalisation** | Revenue | Social sizes only; print-res stays server-side |
| **Strava API terms / athlete cap** | Import limited | Apply early; GPX first-class |
| **Race trademarks / photo copyright** | Takedown / IP | Plain text, no logos; rights checkbox |
| **SST / tax** | Pricing error | Tax adviser |
| **v1 scope size** | Late launch | See §14: soft-launch gate before public launch |

---

## 13. Analytics & experiments
- **Funnel:** `runner_count_selected` → `design_selected` → `background_set` → `route_imported{source}` → `route_adjusted` → `preview_viewed{3d,medal}` → `export_free{size}` / `checkout_started{format}` → `purchased{format,size,route3d,medal}`.
- **Ops:** time-in-state per station, reprint rate by cause, capacity utilisation.
- **Experiments:** 3D price point, medal add-on price, Hero bundle discount, watermark size vs share rate.

---

## 14. Roadmap

| Phase | Scope | Indicative duration |
|---|---|---|
| **0. Validate + set up the studio** | Buy and test kit (pigment large-format printer, 3D printers, jig, frames); test-produce every format × size; measure real unit times + costs; concierge-sell 20–30 orders at one Malaysian race | 4–6 wks (parallel with build) |
| **1. v1 build** | Everything in §4: customer app (iOS/Android/Web), all 8 designs, runner selector, photo + 5 maps, GPX + Strava, 3D route pipeline, medal slot, free export, MY checkout + shipping, **Production Console** | **16–20 wks** |
| **1b. Soft launch** | Invite-only (run clubs) for 2–3 wks to stress-test production + 3D alignment before opening to the public | 2–3 wks |
| **2. Next** | Elevation-profile 3D, split 3D for large routes, different-race multi-runner, BM localisation, AR preview | — |
| **3. Expand** | Singapore → SEA → global (likely regional print partners, since shipping Deep Frames internationally from MY is costly); race organiser B2B | — |

> **Challenge:** "everything in v1" adds about 4–6 weeks vs v0.2, mostly for the 3D pipeline + Production Console. That's acceptable, but **don't skip the soft launch**. In-house production is where the first 100 orders will break.

---

## 15. Open questions (remaining)

1. **3D height profile in v1:** flat raised line only (default), or elevation profile too?
2. **3D filament colours:** which 4–6? *(Default: white, black, signal orange, neon yellow, silver, gold.)*
3. **3D printer choice:** standard bed (route area ≤ 250×250 mm) or large-format? This sets the editor guard.
4. **Medal designs + multiple runners:** allowed or not? *(Default: medal designs are single-runner.)*
5. **Bahasa Malaysia UI at launch or shortly after?** *(Default: shortly after.)*
6. **Studio capacity:** how many orders/day do you want to support at launch? This sizes the printer farm and capex.

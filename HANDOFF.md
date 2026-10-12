# Clippr — handoff (updated 2026-10-12)

Paste this into a new chat, or say: "Read HANDOFF.md and continue the Clippr project."

## The project

**Clippr** is an iOS-first React Native / Expo app for storing store vouchers and credit notes. It tracks expiry dates, stores vouchers as photos, scores scan quality on-device with ML Kit, and sends local push notifications before vouchers expire.

This is a **feasibility build (v0)**: lean, with **no auth, no backend and no cloud**. AsyncStorage is the whole database, and nothing leaves the device.

- Project folder: `/Users/matanshaviro/Documents/react-native/clipper` (not a git repo yet)
- Status: **design phase is done**, with a clickable HTML prototype. The Expo app itself hasn't been started.

## Architecture (from the user's spec, `~/Downloads/clippr-architecture.jsx`)

Layers:
- **UI:** Home (list, filter, banner), Add voucher (4-step flow), Detail (edit, delete), Alerts (reminders), Settings (defaults)
- **State:** a Zustand store, persisted to AsyncStorage
- **On-device services:** ML Kit (OCR + quality), expo-camera, expo-notifications, expo-haptics. No external API calls.

The main flow, which is the only real flow in v0:
1. **Capture:** the camera opens, or the user picks from the library. The image URI is saved to state.
2. **Analyze:** ML Kit runs on-device. OCR extracts text, a quality score from 0–100 is computed, and fields are filled in automatically.
3. **Fill details:** store name (editable), amount and currency, an expiry date picker, and a category selector.
4. **Set reminders:** toggles for 7d / 3d / 1d / 0d plus a custom day count. expo-notifications schedules them, and the notification IDs are saved on the voucher.
5. **Save:** `addVoucher()` runs, AsyncStorage persists it, the app returns to Home, and the card appears in the list.

Other interactions:
- Tap a card → Detail (read-only, with inline edit)
- Edit → `updateVoucher()` → reschedule notifications
- Delete → `cancelVoucherReminders()` → `deleteVoucher()`
- A notification fires and the user taps it → Detail
- The app reopens → AsyncStorage hydrates Zustand

Planned files (12):

| File | Role |
|---|---|
| `app/(tabs)/index.tsx` | Home: list, filter, banner |
| `app/voucher/new.tsx` | 4-step add flow |
| `app/voucher/[id].tsx` | Detail, edit, delete |
| `app/(tabs)/alerts.tsx` | Scheduled reminders list |
| `app/(tabs)/settings.tsx` | Defaults and currency |
| `lib/store.ts` | Zustand + AsyncStorage persistence |
| `lib/mlkit.ts` | OCR + quality scoring |
| `lib/notifications.ts` | Schedule / cancel reminders |
| `types/voucher.ts` | Voucher, Reminder and Category types |
| `components/VoucherCard.tsx` | "Paper stack" card |
| `tailwind.config.js` | Full design token system |
| `CLAUDE.md` | AI context file |

## Design

**Canvas (source of the design):** https://claude.ai/artifact/JDKwnvyoRZsQWdwFDFdV3F
- A "Design" artifact with 9 iPhone artboards (390×844).
- To edit it, read it first with the Artifact tool (`action: "read"`), then publish changed `project/*.dc.html` files to the same `url`.
- Top row: Home, Home empty, Detail, Alerts, Settings. Bottom row: Capture, Analyze, Details, Reminders.

**Design language:** taken from the Acctual style (https://styles.refero.design/style/aeefc294-a8f7-443d-b76a-538dddc29afe), recolored to the **Iris** theme.

- **Type:** Open Runde is the brand font, but it isn't installed, so the designs use **Inter** (Open Runde is a rounded Inter). Weight 600 for headings, 500 for body.
  - Tracking: −0.03em on 20px+ headings, −0.02em on body, +0.02em on 11px uppercase eyebrows.
  - Caveat 600 for small handwritten notes only.
- **Shapes:** pills (100px radius) for buttons, tags and the nav; 16px for cards and inputs; 20px for images; 32px for large panels and bottom sheets. Nothing under 10px is interactive.
- **Surfaces:** flat. No gradients. Shadows only on "paper" elements (voucher mockups, notification card, floating nav).
- **Signature motif:** vouchers drawn as tilted, stacked paper. List cards have a tinted sheet peeking out behind them.
- **Layout:** 20px side gutter, 58–62px top inset (no fake status bar), bottom bar at 30–34px from the bottom, 44px minimum touch targets.
- **Nav:** a floating white pill tab bar (Home / Alerts / Settings) next to a round + button (action color).

**Iris color roles:**

| Role | Hex | Use |
|---|---|---|
| Action | `#17132E` | Primary buttons, selected pills, + button, switches "on" (never use the accent for buttons) |
| Accent | `#6C56FC` | Dots, rings, check circles, scan highlights only |
| Accent text | `#5541E0` | Small blue-violet text such as eyebrows and dates (≈6:1 contrast) |
| Wash | `#E1E0FC` | Banner, expiry card, "days left" chips |
| Text on wash | `#3D2FB0` | |
| Second wash | `#F6D2F4` | Blush tint for secondary card sheets |
| Ink | `#1B1830` | Main text |
| Muted | `#625E78` | Secondary text |
| Faint | `#8F8AA6` | |
| Surface | `#F8F7FD` | Secondary pills, icon tiles |
| Hairline | `#E7E5F1` | |
| Border | `#D3D0E3` | |
| Paper | `#FFFFFF` | Background |
| Camera background | `#17132E` | |

Shadow and ring colors are based on `rgb(23, 19, 46)`.

**Sample data** (the mock's "today" is Sun 11 Oct 2026):

| Voucher | Category | Amount | Expires | Status |
|---|---|---|---|---|
| Northwind Books | Books | $40 | Sat 17 Oct | 6 days; code NWB-4471-2290; quality 86 |
| Petal & Co. | Fashion | $60 | 22 Oct | |
| Oak & Ember Home | Home | $185 | 14 Nov | |
| Atlas Outdoor | Outdoor | $312.50 | No expiry | |

- Total shown: $1,284.50 across 9 vouchers.
- Categories: Books, Fashion, Home, Beauty, Food, Tech, Other.
- Currencies: USD, EUR, GBP, ILS.

## Clickable prototype (`prototype/`)

| Path | What it is |
|---|---|
| `prototype/screens/*.dc.html` | Screen sources. Same content as the canvas artboards; keep the two in sync. |
| `prototype/static/app.js` | Interaction layer |
| `prototype/static/frame.css` | Phone frame |
| `prototype/static/index.html` | Screen map, with a reset button |
| `prototype/build.py` | Converts the screens into plain HTML in `prototype/dist/` |
| `prototype/serve.mjs` | Node static server on port 4173 |

`app.js` handles:
- filters
- switches
- chips
- the custom-day stepper
- date and time pickers
- inline edit
- delete / mark-as-used sheets
- full-photo view
- toasts
- in-phone scrolling

It also keeps a small amount of state in localStorage (`clippr.*`):
- `state`: full / removed / empty
- `currency`
- `defaults`
- `notifyAt`

Run it from the project folder:

```bash
python3 prototype/build.py
node prototype/serve.mjs
```

Then open http://localhost:4173.

**Server gotchas on this Mac:**
- Python's `http.server` hangs at bind time (its reverse-DNS lookup), so use the Node server.
- The Claude preview launcher (`.claude/launch.json`) can't read the Documents folder (macOS permission), and the sandbox blocks local ports. Start the server from a Bash call with the sandbox disabled, in the background.

The full flow has been QA'd in the browser:
- all 54 links resolve
- every control works
- there were no console errors

## Decisions made

- The code field and the Store voucher / Credit note switch were dropped from the details step, to match the spec.
- Detail keeps a "Mark as used" button next to Delete. It isn't in the spec; the user hasn't decided whether to keep it.
- Home empty replaces an earlier onboarding screen, since the spec has no onboarding.
- Reminder dates that have already passed show as disabled, with "date already passed".

## Build progress

We follow the phase plan from the user's master prompt (`~/Downloads/clippr-claude-code-prompt.md`): **stop after each phase and wait for approval.**

- **Phase 1 — Foundation:** built 2026-10-12, awaiting approval.
  - Expo SDK 57 (`expo` ~57.0.27, RN 0.86, React 19.2, TypeScript 6), Expo Router with routes in `src/app/`
  - NativeWind v4.2.7 + Tailwind v3.4: Iris tokens in `tailwind.config.js`, `inlineRem: 16`
  - Fonts: Inter 400/500/600/700 + Caveat 600 via `@expo-google-fonts`, held behind the splash screen
  - Custom floating pill tab bar (`src/components/TabBar.tsx`) with Home / Alerts / Settings and a + button
  - Types in `src/types/voucher.ts`, placeholder screens for all 5 routes, a route `ErrorBoundary`, `CLAUDE.md`
  - `npx tsc --noEmit` and `npx expo lint` are clean
  - Run it: `npx expo run:ios --device B51E28EB-1377-4D13-B64E-F97977E4DB1D` (development build on the iPhone 16 Pro, iOS 18.2 simulator; ML Kit can't run in Expo Go)
    - Xcode 26.4.1 can't target the iOS 26.4 simulators on this Mac. Use the iOS 18.2 ones.
    - Run it with the sandbox disabled, and `export LANG=en_US.UTF-8` first (CocoaPods needs UTF-8).
  - **Patch:** `patches/@infinitered+react-native-mlkit-text-recognition+5.0.1.patch` fully qualifies `MLKitTextRecognitionCommon.Text`.
    - Without it, the type clashes with SwiftUI's `Text` under Xcode 26 and the iOS build fails.
    - It's re-applied automatically by `"postinstall": "patch-package"`.
  - Verified on the simulator: fonts load, the tabs switch, + opens the full-screen add flow, X closes it, and Detail pushes with its route parameter.
    - The simulator's screenshots lag one frame behind, so take a second one after each tap.
- **Phase 1** was approved 2026-10-12.
- **Phase 2 — Data layer + Home:** built 2026-10-12, awaiting approval.
  - `src/lib/store.ts`: Zustand + `persist` on AsyncStorage (key `clippr-store`)
    - Actions: `addVoucher`, `updateVoucher`, `deleteVoucher`, `markUsed`, `deleteAllVouchers`, `updateSettings`
    - A `hydrated` flag drives the loading state.
    - Seeds the 4 design sample vouchers once (a `seeded` flag), with expiry dates relative to today: +6, +11, +34 days and no expiry.
  - The default currency is **ILS (₪)**. The user didn't pick, so it follows the master prompt. Change `DEFAULT_SETTINGS.defaultCurrency` to switch.
  - Helpers:
    - `src/lib/format.ts`: money, days-until, expiry state, sort
    - `src/lib/categories.ts`: lucide icon per category
    - `src/lib/theme.ts`: JS color and shadow tokens
  - Components:
    - `VoucherCard`: paper stack, with an 80 ms staggered `FadeInDown` entry
    - `ExpiryBadge`
    - `ExpiringBanner`: shown when a voucher expires within 7 days
    - `FilterPills`: All / Expiring (≤30 days) / categories present
    - `EmptyState`
  - Home: the total counts active, non-expired vouchers in the default currency; the list is sorted soonest first, with no-expiry last.
  - Verified on the simulator: the list renders like the canvas, filters work, cards open Detail with the right id, and data survives an app restart without re-seeding.
  - Not yet seen on the simulator: the empty state (nothing can delete vouchers until Phase 4).
  - **NativeWind gotcha, fixed and recorded in CLAUDE.md:** toggling a `shadow-*` class after the first render crashes the app in dev with "Couldn't find a navigation context". Set the shadow through `style` instead.
- **Phase 3:** 4-step add flow with camera, ML Kit analysis and the details form
- **Phase 4:** notifications, Detail screen, Alerts
- **Phase 5:** Settings, haptics, polish, edge cases

### Decisions from merging the master prompt with the design phase

The design phase wins on visuals, and the master prompt wins on stack and behavior unless noted.

**Visuals**
- Iris / Acctual design instead of the prompt's orange "Paper Stack", Playfair and DM Sans.
- Kept the prompt's paper-stack idea as the card motif, using the design's tinted sheet behind each card instead of a folded corner.
- Fonts are loaded via `@expo-google-fonts`, never the system font (from the prompt).

**Data and settings**
- Categories follow the design: books, fashion, home, beauty, food, tech, other.
- Currency is stored as an ISO code (USD / EUR / GBP / ILS), not a symbol.
- The default currency is still to be set in Phase 2: the prompt says ₪, while the design's sample data uses $.
- Data model taken from the prompt, plus:
  - `status: 'active' | 'used'`, for the "Mark as used" button
  - `expiryDate: string | null`, for vouchers that never expire
  - `Reminder.custom`
  - `Settings.notifyAt`

**Packages**
- OCR uses `@infinitered/react-native-mlkit-text-recognition`, not `@react-native-ml-kit/text-recognition`.
  - The prompt's package is flagged "untested on New Architecture", which SDK 57 requires.
  - The Infinite Red one is an Expo module.
  - Neither exposes per-character confidence on iOS, so the quality score will use text coverage and size, block and line counts, amount/date pattern hits, and image resolution.
- Icons use `lucide-react-native` (stroke icons that match the design), not emoji.
- Added for features already in the prompt:
  - `expo-file-system` and `expo-image-manipulator`, to keep photos and thumbnails in app storage
  - `expo-sharing`, for the share button
  - `@react-native-community/datetimepicker`, for the expiry date picker

**Behavior from the prompt, still to build**
- Notes field, share button, photo zoom, expired vouchers greyed out
- Reminder toggles in Alerts
- Long-press quick actions, pull-to-refresh
- Notification permission request on first launch

**Config**
- `userInterfaceStyle` is `light`, because there's no dark theme designed yet.
- The template's `.claude/settings.json` (which enabled an Expo plugin) wasn't added.
- No git repo yet.

## Next steps (suggested)

1. Scaffold the Expo app with Expo Router, TypeScript and NativeWind (Tailwind). Put the Iris tokens in `tailwind.config.js`.
2. Build the types, store and notifications modules, then the screens following the 12-file map.
3. ML Kit OCR + quality scoring. This needs a dev build, not Expo Go.
4. Optionally load the real Open Runde font (OFL, from GitHub). Ask before downloading it.

## User's working rules (from their global CLAUDE rules)

- Use TypeScript with no `any`. Functional React components. Handle loading states. Error boundaries.
- Use Conventional Commits.
- Run `/review`, then `/test`, before committing.
- If a change touches more than 10 files, ask whether to split it into branches.
- Use the context7 MCP to look up library docs.

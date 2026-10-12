# Clippr — handoff (updated 2026-10-12)

Paste into a new chat, or say: "Read HANDOFF.md and continue the Clippr project."

## The project

**Clippr** is an iOS-first React Native / Expo wallet for store vouchers and credit notes. It:
- stores each voucher as a photo
- tracks expiry dates
- reads the voucher and scores scan quality on-device with ML Kit
- sends local notifications before a voucher expires

**Scope:** a feasibility build (v0). No auth, no backend, no cloud. AsyncStorage is the whole database, and nothing leaves the device.

| | |
|---|---|
| Project folder | `/Users/matanshaviro/Documents/react-native/clipper` |
| Repo | https://github.com/matan3sh/clipper (default branch `main`) |
| Status | **Phases 1–2 done** and merged to `main` via [PR #1](https://github.com/matan3sh/clipper/pull/1). Phase 3 (the add-voucher flow) is next and **needs the user's go-ahead**. |

**Original specs from the user:**
- `/Users/matanshaviro/Downloads/clippr-claude-code-prompt.md`: the master prompt, with the phase plan, data model and behavior
- `/Users/matanshaviro/Downloads/clippr-architecture.jsx`: architecture, the main flow and the 12-file map

## Architecture

**Stack**

| Area | Choice |
|---|---|
| Platform | Expo SDK 57 (`expo` ~57.0.27), React Native 0.86, React 19.2, TypeScript 6 (strict) |
| Navigation | Expo Router, with routes in `src/app/` and the `@/` alias pointing at `src/` |
| Styling | NativeWind v4.2.7 + Tailwind v3.4. All tokens are in `tailwind.config.js`; `metro.config.js` sets `inlineRem: 16` |
| State | Zustand 5 + `persist` on `@react-native-async-storage/async-storage` |
| OCR | `@infinitered/react-native-mlkit-text-recognition` 5.0.1 (needs a patch, see Known gotchas) |
| Other | expo-camera, expo-image-picker, expo-notifications, expo-haptics, expo-file-system, expo-image-manipulator, expo-sharing, @react-native-community/datetimepicker, date-fns 4, react-native-reanimated 4, lucide-react-native |
| Fonts | `@expo-google-fonts/inter` and `@expo-google-fonts/caveat` |

**Main flow (v0):**
1. **Capture:** the camera, or a photo from the library
2. **Analyze:** ML Kit OCR, a 0–100 quality score, and fields filled in from the photo
3. **Details:** store name, amount and currency, expiry date picker, category
4. **Reminders:** toggles for 7d / 3d / 1d / on the day, plus a custom day count. They're scheduled with expo-notifications, and the notification IDs are saved on the voucher.
5. **Save:** `addVoucher()`, then back to Home

**Other flows**

| Action | What happens |
|---|---|
| Tap a card | Opens Detail, with inline edit |
| Edit | `updateVoucher()`, then the reminders are rescheduled |
| Delete | `cancelVoucherReminders()`, then `deleteVoucher()` |
| Tap a notification | Opens Detail |

**File map** (✅ = exists, ⏳ = planned)

| File | Status / role |
|---|---|
| `src/app/_layout.tsx` | ✅ Font loading, splash screen, Stack, route `ErrorBoundary` |
| `src/app/(tabs)/_layout.tsx` | ✅ Tabs with the custom `TabBar` |
| `src/app/(tabs)/index.tsx` | ✅ Home: total, banner, filters, list, empty state |
| `src/app/(tabs)/alerts.tsx` | ⏳ placeholder (Phase 4) |
| `src/app/(tabs)/settings.tsx` | ⏳ placeholder (Phase 5) |
| `src/app/voucher/new.tsx` | ⏳ placeholder with a step indicator (Phase 3); opens as a `fullScreenModal` |
| `src/app/voucher/[id].tsx` | ⏳ placeholder showing the route id (Phase 4) |
| `src/lib/store.ts` | ✅ Store, `useHydrated()`, `activeVouchers()`, `newId()`, `defaultReminders()` |
| `src/lib/format.ts` | ✅ Money, `daysUntil`, `expiryState`, chip labels, `byExpiry` sort |
| `src/lib/categories.ts` | ✅ Lucide icon and label per category |
| `src/lib/theme.ts` | ✅ JS mirror of the tokens (icon colors, button shadow) |
| `src/lib/mlkit.ts` | ⏳ Phase 3 |
| `src/lib/notifications.ts` | ⏳ Phase 4 |
| `src/types/voucher.ts` | ✅ Data model, `CATEGORIES`, `CURRENCIES`, `PRESET_REMINDER_DAYS`, `qualityTier()` |
| `src/components/` | ✅ `TabBar`, `VoucherCard`, `ExpiryBadge`, `ExpiringBanner`, `FilterPills`, `EmptyState`, `Placeholder` |
| `CLAUDE.md` / `AGENTS.md` | ✅ AI context (`CLAUDE.md` imports `AGENTS.md`, Expo's own guidance) |

**Data model** (`src/types/voucher.ts`)
- **`Voucher`** fields:
  - `id`, `storeName`, `category`, `amount`
  - `currency` (ISO code)
  - `expiryDate` (`yyyy-MM-dd`, or `null` for no expiry)
  - `photoUri`, `thumbnailUri?`
  - `scanQuality` (0–100), `extractedText?`, `notes?`
  - `status` (`'active'` or `'used'`)
  - `reminders: Reminder[]`
  - `createdAt`, `updatedAt`
- **`Reminder`** fields: `id`, `daysBefore` (0 means on the day), `enabled`, `custom?`, `notificationId?`
- **`Settings`** fields: `defaultReminderDays`, `defaultCurrency`, `notifyAt: {hour, minute}`
- **Quality tiers:** 85–100 Excellent, 65–84 Good, below 65 Rescan recommended

## Design

**Canvas (source of truth for visuals):** https://claude.ai/artifact/JDKwnvyoRZsQWdwFDFdV3F
- A "Design" artifact with 9 artboards of 390×844.
  - Top row: Home, Home empty, Detail, Alerts, Settings
  - Bottom row: Capture, Analyze, Details, Reminders
- To edit it, read it first with the Artifact tool (`action: "read"`), then publish the changed `project/*.dc.html` files to the same `url`.
- `prototype/screens/*.dc.html` holds the same screens. Keep the two in sync.

**Design language:** Acctual (https://styles.refero.design/style/aeefc294-a8f7-443d-b76a-538dddc29afe), recolored to the **Iris** palette.

**Type**
- Inter: 600 for headings and amounts (`font-display`), 500 for body (`font-body`), 700 only for voucher wordmarks (`font-strong`).
- Caveat 600 for short handwritten notes only (`font-hand`).
- Open Runde is the brand font, but it isn't installed. Inter is the stand-in, since Open Runde is a rounded Inter.
- Tracking: −0.03em on 20px+ headings, −0.02em on body, +0.02em on 11px uppercase eyebrows.

**Shapes**

| Token | Radius | Used for |
|---|---|---|
| `rounded-pill` | 100 | Buttons, tags, nav |
| `rounded-card` | 16 | Cards, inputs |
| `rounded-image` | 20 | Photo panels, notification card |
| `rounded-panel` | 32 | Large panels, bottom sheets |

Nothing interactive has a radius under 10.

**Rules**
- Surfaces are flat: no gradients, no emoji.
- Shadows only on "paper": voucher cards, the notification card, the floating nav.
- Signature motif: vouchers drawn as tilted, stacked paper; each list card has a tinted sheet behind it.

**Layout**
- 20px side gutter (`px-gutter`)
- 58px top inset (`pt-safe-top`), with no fake status bar
- 44px minimum touch targets
- Floating white pill tab bar beside a round + button in the action color

**Iris colors** (Tailwind class names)

| Token | Hex | Use |
|---|---|---|
| `action` | `#17132E` | Primary buttons, selected pills, + button, switches "on". Never use the accent for buttons. |
| `accent` | `#6C56FC` | Dots, rings, check circles, scan highlights only |
| `accent-ink` | `#5541E0` | Small accent text: eyebrows, dates |
| `wash` | `#E1E0FC` | Banner, expiry card, "days left" chips |
| `wash-ink` | `#3D2FB0` | Text on wash |
| `wash-muted` | `#4A4566` | Secondary text on wash |
| `blush` | `#F6D2F4` | Secondary card-sheet tint |
| `ink` | `#1B1830` | Main text |
| `muted` | `#625E78` | Secondary text |
| `faint` | `#8F8AA6` | Faint text, decimals |
| `surface` | `#F8F7FD` | Secondary pills, icon tiles |
| `hairline` | `#E7E5F1` | Dividers |
| `border` | `#D3D0E3` | Borders |
| `paper` | `#FFFFFF` | Background |
| `danger` | `#C93C3C` | Expired / rescan text (on `danger-wash` `#FDE6E6`) |
| `warning` | `#8A5A00` | Warning text (on `warning-wash` `#FBEFD6`) |
| `camera` | `#17132E` | Camera viewfinder background |

Shadows (`shadow-paper`, `shadow-paper-ring`, `shadow-button`, `shadow-subtle`) are based on `rgb(23, 19, 46)`.

**Seed data in the app.** The 4 vouchers below are added on first launch only (guarded by a `seeded` flag), in ILS, with expiry dates relative to today:

| Voucher | Category | Amount | Expiry | Notes |
|---|---|---|---|---|
| Northwind Books | books | 40 | today + 6 days | quality 86, has a note |
| Petal & Co. | fashion | 60 | today + 11 days | |
| Oak & Ember Home | home | 185 | today + 34 days | |
| Atlas Outdoor | other | 312.50 | no expiry | quality 62 |

Categories: books, fashion, home, beauty, food, tech, other. Currencies: USD, EUR, GBP, ILS.

## What exists now

**Run the app** (an iOS development build is required, because ML Kit can't run in Expo Go):

```bash
export LANG=en_US.UTF-8
npx expo run:ios --device B51E28EB-1377-4D13-B64E-F97977E4DB1D
```

- That device is the iPhone 16 Pro simulator on iOS 18.2.
- After the first build, Metro stays running and Fast Refresh applies JavaScript changes. Rebuild only when native packages or `app.json` change.
- To relaunch the installed app against a running Metro:

```bash
xcrun simctl openurl B51E28EB-1377-4D13-B64E-F97977E4DB1D "com.clippr.app://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"
```

**Checks** (there's no unit test suite yet, and `npm test` has no script):

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

All three pass on `main` (expo-doctor: 21/21).

**Clickable HTML prototype** (a design reference, not the app):

```bash
python3 prototype/build.py
node prototype/serve.mjs
```

Then open http://localhost:4173. `prototype/static/app.js` is the interaction layer and `prototype/static/index.html` is the screen map, with a reset button.

**Known gotchas on this Mac**
- **Simulators.** Xcode 26.4.1 can't target the iOS 26.4 simulators. Use the iOS 18.2 ones.
- **Sandbox and locale.** Run `expo run:ios`, `npm install` and `git push` with the sandbox disabled. CocoaPods needs `LANG=en_US.UTF-8`.
- **OCR patch.** `patches/@infinitered+react-native-mlkit-text-recognition+5.0.1.patch` fully qualifies `MLKitTextRecognitionCommon.Text`, because ML Kit's `Text` clashes with SwiftUI's `Text` under Xcode 26. It's re-applied by `"postinstall": "patch-package"`.
- **NativeWind v4 shadows.** Never add or remove a `shadow-*` class after the first render. The component remounts and the dev build throws "Couldn't find a navigation context". Toggle shadows with `style={{ boxShadow: ... }}` from `src/lib/theme.ts`. Changing colors, spacing and opacity classes is fine.
- **Store selectors.** `activeVouchers()` builds a new array, so call it inside `useMemo`, never as a `useClipprStore` selector (that loops in Zustand 5).
- **Hydration.** `useHydrated()` reads persist's own flag, which never writes. If the stored data can't be read, the store writes nothing, so a failed read can't overwrite saved vouchers.
- **Simulator screenshots** lag one frame behind, so take a second one after each tap. Taps made during a navigation animation are dropped.
- **Prototype server.** Python's `http.server` hangs at bind time (reverse-DNS lookup), so use `node prototype/serve.mjs`. The Claude preview launcher in `.claude/launch.json` can't read the Documents folder, so start the server from a shell with the sandbox disabled.
- **Push errors.** If `git push` fails with HTTP 400, check the repo-local settings: `git config --local http.version HTTP/1.1` is already set.

**Git state as of 2026-10-12**
- The checkout is on `main`, in sync with GitHub (merge commit `2326be9` for PR #1).
- The merged branch `feature/foundation-and-home` has been deleted locally.
- `HANDOFF.md` is committed on `main`.

## Decisions made

**Visuals**
- **Design wins on visuals.** Iris/Acctual replaces the master prompt's orange "Paper Stack" with Playfair and DM Sans. The paper-stack idea survives as the tinted sheet behind each card.
- **Fonts** always come from `@expo-google-fonts`, never the system font.
- **Icons** are `lucide-react-native` stroke icons. No emoji.

**Data and settings**
- **Categories** follow the design (7, including books and tech).
- **Currency** is stored as an ISO code. The default is **ILS (₪)**: the user didn't choose, so it follows the master prompt. Change `DEFAULT_SETTINGS.defaultCurrency` in `src/lib/store.ts` to switch.
- **Added to the data model:**
  - `status: 'active' | 'used'`, for "Mark as used"
  - `expiryDate: null`, for vouchers that never expire
  - `Reminder.custom`
  - `Settings.notifyAt`
- **"Mark as used"** stays on Detail next to Delete. It isn't in the spec, and the user hasn't decided whether to keep it.
- **No onboarding screen.** The empty Home is the first-run experience.
- **Past reminder dates** show as disabled, with "date already passed".
- **Home's total** counts active, non-expired vouchers in the default currency.
- **Filters:** "Expiring" means 30 days or less. The banner shows when something expires within 7 days.

**Packages and config**
- **OCR package.** Infinite Red's package instead of `@react-native-ml-kit/text-recognition`, which is flagged as untested on the New Architecture.
  - Neither package exposes per-character confidence on iOS.
  - So the Phase 3 quality score will use text coverage and size, block and line counts, amount/date pattern hits, and image resolution.
- **Routes live in `src/app/`** (Expo 57's convention), so the original 12-file map sits under `src/`.
- **NativeWind v4** (stable) rather than v5 (release candidate).
- **Light mode only.** `userInterfaceStyle` is `light`, since no dark theme is designed yet.
- **Not added:**
  - the template's `.claude/settings.json`, which would have enabled an Expo plugin
  - the template's `scripts/reset-project.js`

## Next steps

1. **Sync git.** Run `git checkout main && git pull` before starting new work.
2. **Clean up `package.json`.** It still has a `reset-project` script pointing at the missing `scripts/reset-project.js`. Remove it in the Phase 3 PR.
3. **Phase 3, the add-voucher flow** (wait for the user's go-ahead; work on a new branch such as `feature/add-voucher-flow`):
   - The 4-step flow in `src/app/voucher/new.tsx`, with a step indicator.
   - Capture with expo-camera, plus a library picker (expo-image-picker). The Home empty state already passes `source: 'library'`.
   - `src/lib/mlkit.ts`: `analyzeImage(uri)` returns `{ quality, extractedText, suggestions }`.
     - Amount regex: `/[₪$€£]?\s*\d+(?:[.,]\d{2})?/`
     - Dates: DD/MM/YYYY, DD.MM.YY, or a written month
     - Store name: the largest text block
     - Below 65, offer "Rescan recommended" with a Retake button.
   - Copy photos into the document directory (expo-file-system) and make a thumbnail (expo-image-manipulator).
   - Details form: store name, category pills, amount, currency, native date picker, optional notes. Pre-fill from OCR.
   - Reminder toggles (7/3/1/0 plus custom), then save to the store and go back to Home.
4. **Phase 4:**
   - Notifications in `src/lib/notifications.ts`: `scheduleVoucherReminders` and `cancelVoucherReminders`, with the permission request on first launch.
   - The Detail screen: photo zoom, inline edit, reminders, delete with confirmation, share.
   - The Alerts tab.
5. **Phase 5:**
   - The Settings screen
   - Haptics, pull-to-refresh, long-press quick actions
   - Greying out expired vouchers
   - Handling denied camera or notification permission
6. **Optional:** load the real Open Runde font (OFL, from GitHub). Ask before downloading it.

## User's working rules

- **Phase-gated:** stop after each phase and wait for explicit approval. Don't start Phase 3 without a go-ahead.
- **Git:** work on feature branches with a PR per chunk of work. Use Conventional Commits.
  - Before committing, run `/review`, then `/test`.
  - If a change touches more than 10 files, ask whether to split it into branches.
  - Commit and push only when asked.
  - **`HANDOFF.md` always lives on `main`.** Commit handoff updates straight to `main` as `docs(handoff): …`, with no feature branch or PR. Doing this from a feature branch: stash the file, switch to `main`, pull, pop the stash, commit, push, then switch back.
- **Code:** TypeScript with no `any` (use `unknown` plus type guards). Functional components and hooks. Explicit loading states. Error boundaries.
- **Styling:** NativeWind classes for all styling. Raw hex only in `src/lib/theme.ts`. Zustand for app data, `useState` only for local UI state.
- **Packages:** install with `npx expo install`. Look up library docs with the context7 MCP, and Expo docs at `https://docs.expo.dev/versions/v57.0.0/`.
- **Show it running:** prove changes on the iOS simulator. The user likes to watch in the simulator panel.

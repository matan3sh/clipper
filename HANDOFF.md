# Clippr — handoff (updated 2026-10-12, after the Phase 5 polish merge — v0 feature-complete)

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
| Status | **Phases 1–5 merged** to `main` ([PR #1](https://github.com/matan3sh/clipper/pull/1)–[PR #6](https://github.com/matan3sh/clipper/pull/6)). Phase 5 was two PRs: the Settings/permissions/Used-filter slice ([PR #5](https://github.com/matan3sh/clipper/pull/5)) and the haptics/pull-to-refresh/long-press polish ([PR #6](https://github.com/matan3sh/clipper/pull/6)). **v0 is feature-complete**; what remains is a real-device pass and optional extras. |

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
4. **Reminders:** toggles for 7d / 3d / 1d / on the day, plus a custom day count. Scheduled with expo-notifications on save; each `notificationId` is stored on its reminder.
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
| `src/app/_layout.tsx` | ✅ Font loading, splash screen, Stack, route `ErrorBoundary`; `unstable_settings.anchor = '(tabs)'` |
| `src/app/(tabs)/_layout.tsx` | ✅ Tabs with the custom `TabBar` |
| `src/app/(tabs)/index.tsx` | ✅ Home: total, banner, filters, list, empty state |
| `src/app/(tabs)/alerts.tsx` | ✅ Alerts: next-reminder preview, This week / Later (Phase 4) |
| `src/app/(tabs)/settings.tsx` | ✅ Settings: default reminders, notify-time picker (reschedules on close), currency, permission status, storage count/size, delete-all (Phase 5) |
| `src/hooks/useNotificationStatus.ts` | ✅ Notification permission, re-read on foreground (Phase 5) |
| `src/lib/haptics.ts` | ✅ Fire-and-forget haptic feedback wrapper (Phase 5 polish) |
| `src/hooks/useVoucherActions.ts` + `src/components/VoucherQuickActions.tsx` | ✅ Shared share/mark-used/delete, and Home's long-press menu (Phase 5 polish) |
| `src/app/voucher/new.tsx` | ✅ The 4-step add flow; opens as a `fullScreenModal`. `?source=library` opens the picker on arrival |
| `src/app/voucher/[id].tsx` | ✅ Detail: photo panel + viewer, expiry card, inline edit, share, delete, mark as used (Phase 4) |
| `src/lib/store.ts` | ✅ Store (`addVoucher`, `updateVoucher`, `deleteVoucher`, `markUsed`, …), `useHydrated()`, `activeVouchers()`, `defaultReminders()` |
| `src/lib/format.ts` | ✅ Money, `daysUntil`, `expiryState`, chip labels, `byExpiry` sort |
| `src/lib/categories.ts` | ✅ Lucide icon and label per category |
| `src/lib/theme.ts` | ✅ JS mirror of the tokens (icon colors, button shadow) |
| `src/lib/mlkit.ts` | ✅ `analyzeImage(uri, size)`: runs ML Kit, then `analyzeOcr` |
| `src/lib/voucherParsing.ts` | ✅ Pure parsing (store, amount, currency, expiry) and quality scoring; unit-tested |
| `src/lib/photos.ts` | ✅ `preparePhoto` (EXIF-upright, max 2000px), `persistPhoto` (photo + 360px thumb), `photoFileUri`, `deletePhotos` |
| `src/lib/reminders.ts` | ✅ `reminderDate`, `isReminderPast`, `buildReminders`, `reminderChoice`, `remindersSummary`, `notificationText`, `upcomingReminders` (single source for iOS scheduling and the Alerts tab), `splitByWeek` |
| `src/lib/voucherForm.ts` | ✅ `DraftForm`, `validateForm` |
| `src/lib/navigation.ts` | ✅ `goBackOrHome()`: use for every back/close button |
| `src/lib/ids.ts` | ✅ `newId()` (moved out of the store so pure modules don't pull in AsyncStorage) |
| `src/hooks/useVoucherDraft.ts` | ✅ Flow state: step, photo, analysis, form, reminders, `save()` |
| `src/components/add-voucher/` | ✅ `FlowHeader`, `CaptureStep`, `AnalyzeStep`, `DetailsStep`, `RemindersStep` |
| `src/components/Button.tsx`, `Sheet.tsx` | ✅ Shared pill button (primary/outline) and bottom sheet |
| `src/lib/__tests__/` | ✅ 35 Jest tests (jest-expo) |
| `src/lib/notifications.ts` | ✅ `scheduleVoucherReminders`, `cancelVoucherReminders`, `syncAllReminders` (serialized queue; cancels by stored id and by `data.voucherId` tag; sync caps at 60 for the iOS 64 limit) |
| `src/hooks/useNotificationRouting.ts` | ✅ Sync at launch and on every return to foreground; notification tap (incl. cold start) → Detail |
| `src/hooks/useVoucherEditor.ts` | ✅ Detail's edit mode; save reschedules reminders |
| `src/components/form/` | ✅ `VoucherFields` (Field, Input, AmountField, ExpiryField, CategoryPicker) and `ReminderOptions`, shared by the add flow and Detail |
| `src/components/detail/` | ✅ `VoucherPhoto` (tilted photo or drawn voucher, pinch-zoom viewer), `ExpiryCard` |
| `src/components/ConfirmSheet.tsx` | ✅ Confirmation bottom sheet |
| `src/types/voucher.ts` | ✅ Data model, `CATEGORIES`, `CURRENCIES`, `PRESET_REMINDER_DAYS`, `qualityTier()` |
| `src/components/` | ✅ `TabBar`, `VoucherCard`, `ExpiryBadge`, `ExpiringBanner`, `FilterPills`, `EmptyState`, `Placeholder`, `Button`, `Sheet` |
| `CLAUDE.md` / `AGENTS.md` | ✅ AI context (`CLAUDE.md` imports `AGENTS.md`, Expo's own guidance) |

**Data model** (`src/types/voucher.ts`)
- **`Voucher`** fields:
  - `id`, `storeName`, `category`, `amount`
  - `currency` (ISO code)
  - `expiryDate` (`yyyy-MM-dd`, or `null` for no expiry)
  - `photoUri`, `thumbnailUri?`: empty for the seed vouchers; otherwise paths **relative** to the document directory (`vouchers/<id>.jpg`), because the iOS container path changes between installs. Resolve with `photoFileUri()`
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
| `hairline` | `#E7E5F1` | Divider fills (`bg-hairline`), empty tracks |
| `divider` | `#E7E5F1` | Same value, for borders (`border-divider`) — see gotchas |
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

**Checks:**

```bash
npx tsc --noEmit
npx expo lint
npm test
npx expo-doctor
```

All four pass on `main` (36 tests; expo-doctor 21/21). Tests cover the pure modules in `src/lib/`; there are no UI tests yet.

**Testing the add flow in the Simulator.** There's no camera, so use the library. A test voucher image ("Northwind Books $40.00", valid until 17.10.2026) is already in the Simulator's Photos, and one voucher saved from it (USD, books, reminders 3/2/1 days) is in the app's data alongside the 4 seed vouchers. Injected taps can't reach Apple's photo picker (it runs out of process), so either tap the photo yourself in the panel, or temporarily feed a file straight into `draft.analyze(uri, w, h)` and remove that before committing.

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
- **Simulator tap/swipe coordinates are in DEVICE POINTS** (402×874 on this iPhone 16 Pro), not screenshot pixels. The screenshot tool reports its point space on attach; convert a display-pixel x by ~0.437. Getting this wrong sends taps off-screen and looks like an unresponsive button.
- **Simulator screenshots** lag behind — sometimes several seconds, which can look like a frozen screen. Wait and take another before concluding a tap failed. Taps made during a navigation or modal animation are dropped.
- **Testing notifications.** `xcrun simctl push <udid> com.clippr.app push.json` with `{"aps":{"alert":{...}},"body":{"voucherId":"<id>"}}` delivers a banner whose tap goes through the real routing. Simulator notification permission can't be reset with `simctl privacy`.
- **Fast Refresh mid-edit.** Saving a file that uses a new import before the import is added throws once and can leave the app wedged; relaunch it.
- **Prototype server.** Python's `http.server` hangs at bind time (reverse-DNS lookup), so use `node prototype/serve.mjs`. The Claude preview launcher in `.claude/launch.json` can't read the Documents folder, so start the server from a shell with the sandbox disabled.
- **`border-hairline` is not our color.** NativeWind's preset defines it as a hairline border *width* on all sides, so it draws a box. Use `border-divider` (same hex) for borders; `bg-hairline` and `text-*` are fine.
- **Same-slot conditionals and shadows.** `{a ? <View className="… shadow-paper" /> : <View className="…" />}` reuses one View and adds the shadow after first render, triggering the NativeWind remount crash. Give each branch a `key`.
- **Photo picker.** Present it full screen (the default page sheet hangs in iOS 18 simulators), and never while a modal is still animating in: iOS drops the presentation and the promise never settles. `CaptureStep` waits for `transitionEnd`.
- **Jest preset.** `@react-native/jest-preset` is pinned to the React Native version (0.86.3). Bump it with every RN upgrade, or tests fail with "Could not locate module react-native/setup-env".
- **Back buttons.** Never call bare `router.back()`. A screen opened straight from a link (or a notification) has nothing below it and throws "GO_BACK was not handled". Use `goBackOrHome()`; the root layout also anchors the stack to `(tabs)`.
- **Push errors.** If `git push` fails with HTTP 400, check the repo-local settings: `git config --local http.version HTTP/1.1` is already set.

**Git state as of 2026-10-12**
- The checkout is on `main`, in sync with GitHub (merge commit `9846e70` for PR #6).
- All six merged feature branches are deleted locally and on GitHub; `main` is the only branch.
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
- **Quality score** (no OCR confidence on iOS): Sharp 35% (clean words, text height), Frame 25% (text coverage, resolution), Text 40% (fields found, line count). The Analyze screen shows these three bars; the design's "Light" bar became "Frame", since brightness can't be measured without pixel access.
- **Parsing rules:** amount = a currency-marked number in the largest type (fallback: a decimal next to "value", "balance" and so on); expiry = a date next to "valid", "until" or "exp" (fallback: the latest date), day-first unless impossible; store = the largest block that isn't a price, date, code or stock phrase, title-cased if all caps.
- **Add flow:** category is required (no default); expiry can be "No expiry"; the date picker starts at today. Amount fields show two decimals ("40.00").
- **Reminders saved** are only the enabled, still-upcoming ones (like the seed data). A custom count that repeats a preset is dropped. The footer says "N reminders set"; they're scheduled with iOS on save.
- **Camera failures:** a mount error (or no camera) falls back to the library; a single failed shot shows "Try again" and keeps the camera live.
- **Past reminder dates** show as disabled, with "date already passed".
- **Home's total** counts active, non-expired vouchers in the default currency.
- **Filters:** "Expiring" means 30 days or less. The banner shows when something expires within 7 days.

**Packages and config**
- **OCR package.** Infinite Red's package instead of `@react-native-ml-kit/text-recognition`, which is flagged as untested on the New Architecture.
  - Neither package exposes per-character confidence on iOS.
  - So the quality score uses OCR-derived signals instead (see the quality-score decision above).
- **Routes live in `src/app/`** (Expo 57's convention), so the original 12-file map sits under `src/`.
- **NativeWind v4** (stable) rather than v5 (release candidate).
- **Light mode only.** `userInterfaceStyle` is `light`, since no dark theme is designed yet.
- **Not added:**
  - the template's `.claude/settings.json`, which would have enabled an Expo plugin
  - the template's `scripts/reset-project.js` (its stale `reset-project` script was removed from `package.json` in Phase 3)

## Next steps

v0 is feature-complete. No phase is in flight; wait for the user's direction. Likely next:

1. **Sync git.** Run `git checkout main && git pull` before starting new work.
2. **Real-device pass** (the main gap). Unverified on hardware: camera capture, real reminder delivery at the notify time, haptics (silent in the Simulator), and notification-tap routing from a real push. Also worth checking on a device, since the Simulator couldn't: the Alerts denied-notification notice (`simctl` can't revoke notification permission) and expired-card dimming (no currently-expired seed vouchers).
3. **Known limitation:** per-voucher scheduling still doesn't enforce the 64-notification iOS cap — only the launch/foreground sync trims to 60. Only matters with dozens of vouchers.
4. **Optional extras:** load the real Open Runde font (OFL, from GitHub — ask before downloading); haptics on the add/edit form's category and currency pickers; whatever new direction the user wants (e.g. export/backup, barcode display, more categories).

If the user wants to keep building, treat a new chunk of work as its own phase: branch, `/review`, `/test`, PR.

## User's working rules

- **Phase-gated:** stop after each phase and wait for explicit approval. Don't start the next phase without a go-ahead.
- **Git:** work on feature branches with a PR per chunk of work. Use Conventional Commits.
  - Before committing, run `/review`, then `/test` (`npm test`).
  - If a change touches more than 10 files, ask whether to split it into branches.
  - Commit and push only when asked. When the user says "merge to main", open the PR; Claude Code's auto mode blocks `gh pr merge` ("Merge Without Review"), so the user merges it themselves (PR page or `gh pr merge <n> --merge --delete-branch`). Then verify it merged on GitHub (`gh api repos/matan3sh/clipper/pulls/<n> --jq .merged`) before pulling `main`, deleting the local and remote branch, and updating this file.
  - There's no CI on the repo, so local checks (`tsc`, `lint`, `npm test`, `expo-doctor`) are the gate.
  - **`HANDOFF.md` always lives on `main`.** Commit handoff updates straight to `main` as `docs(handoff): …`, with no feature branch or PR. Doing this from a feature branch: stash the file, switch to `main`, pull, pop the stash, commit, push, then switch back.
- **Code:** TypeScript with no `any` (use `unknown` plus type guards). Functional components and hooks. Explicit loading states. Error boundaries.
- **Styling:** NativeWind classes for all styling. Raw hex only in `src/lib/theme.ts`. Zustand for app data, `useState` only for local UI state.
- **Packages:** install with `npx expo install`. Look up library docs with the context7 MCP, and Expo docs at `https://docs.expo.dev/versions/v57.0.0/`.
- **Show it running:** prove changes on the iOS simulator yourself (screenshots, taps), and check for LogBox error toasts before calling something done. The user likes to watch in the simulator panel.
- **Explanations:** the user is still learning git basics (asked how to see the current branch); give plain commands like `git branch --show-current` when relevant.

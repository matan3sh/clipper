# Clippr — AI context

@AGENTS.md

## What this is
Feasibility build (v0) of Clippr, an iOS-first React Native / Expo voucher and credit-note wallet.
No backend, no auth, no cloud. AsyncStorage is the whole database, and ML Kit runs on-device.
Full project history and decisions are in `HANDOFF.md`.

## Stack
- Expo SDK 57, Expo Router (routes in `src/app/`), TypeScript strict
- NativeWind v4 + Tailwind v3 for styling: all tokens are in `tailwind.config.js`
- Zustand + persist middleware on AsyncStorage
- expo-camera, expo-image-picker, @react-native-ml-kit/text-recognition, expo-notifications,
  expo-haptics, expo-file-system, expo-image-manipulator, expo-sharing, date-fns, lucide-react-native
- ML Kit is a native module: run with a development build (`npx expo run:ios`), not Expo Go

## Design system
Acctual design language in the Iris palette. Canvas: https://claude.ai/artifact/JDKwnvyoRZsQWdwFDFdV3F
Clickable reference prototype: `prototype/` (build with `python3 prototype/build.py`, serve with `node prototype/serve.mjs`).
- Use token classes only (`bg-action`, `text-accent-ink`, `rounded-card`, `shadow-paper`). No raw hex in components,
  except icon `color` props, which can't take classes.
- Fonts are separate families per weight: `font-body` (Inter 500), `font-display` (Inter 600), `font-regular` (400),
  `font-strong` (700, voucher wordmarks only), `font-hand` (Caveat, short notes only). Never use the system font.
- Action color `#17132E` for every primary button and selected state. Iris `#6C56FC` is an accent for dots, rings
  and checks only, never a button fill.
- Radii: pills for buttons, tags and nav; `rounded-card` (16) for cards and inputs; `rounded-image` (20); `rounded-panel` (32).
- Flat surfaces. Shadows only on "paper" (voucher cards, notification card, floating nav). No gradients, no emoji.
- **Never add or remove `shadow-*` classes after the first render** (for example `${active ? 'shadow-button' : ''}`).
  NativeWind v4 remounts the component, and in dev that throws "Couldn't find a navigation context".
  Toggle shadows with `style={{ boxShadow: active ? shadows.button : undefined }}` from `src/lib/theme.ts`.
  Changing colors, opacity and spacing classes is fine.
- **Borders use `border-divider`, never `border-hairline`.** NativeWind's preset defines `border-hairline` as a
  hairline border *width* on all sides, so it draws a box instead of applying our hairline color.
- 20px gutter (`px-gutter`), `pt-safe-top` (58px) top inset, 44px minimum touch targets.

## Build rules
- Phase-gated: STOP after each phase and wait for approval.
- No `any`: use `unknown` plus type guards. Functional components and hooks. Explicit loading states.
- NativeWind for all styling. `StyleSheet.create` only where Reanimated needs it.
- Zustand for all app data. `useState` only for local UI state.
- Install packages with `npx expo install`. Run `npx tsc --noEmit`, `npx expo lint` and `npm test` before calling anything done.
- English only. RTL is not required.

## Current phase
Phase 5 — Settings screen, denied-permission handling, Used filter and dimmed cards: built on `feature/settings-and-polish`, awaiting approval. (Phases 1–4 merged.) Remaining polish (haptics, pull-to-refresh, long-press) is a later branch.

## Key files
- `src/types/voucher.ts`: data model (source of truth)
- `src/lib/store.ts`: Zustand store (Phase 2)
- `src/lib/mlkit.ts`: runs ML Kit OCR on a photo (Phase 3)
- `src/lib/voucherParsing.ts`: pure store/amount/expiry parsing and quality scoring, unit-tested (Phase 3)
- `src/lib/photos.ts`: photo prep, storage as relative paths, thumbnails, `photoFileUri`, `deletePhotos` (Phase 3)
- `src/lib/reminders.ts`: reminder dates and `buildReminders` (Phase 3, reused by Phase 4)
- `src/hooks/useVoucherDraft.ts` + `src/components/add-voucher/`: the 4-step add flow (Phase 3)
- `src/lib/notifications.ts`: schedule/cancel/sync reminders with iOS, serialized; `getNotificationStatus`, `cancelAllReminders` (Phase 4–5)
- `src/app/(tabs)/settings.tsx` + `src/hooks/useNotificationStatus.ts`: Settings screen and the foreground-aware permission hook (Phase 5)
- `src/hooks/useNotificationRouting.ts`: launch + foreground sync, notification tap → Detail (Phase 4)
- `src/hooks/useVoucherEditor.ts` + `src/components/detail/`: Detail's edit mode, photo panel, expiry card (Phase 4)
- `src/components/form/`: voucher fields and reminder options shared by the add flow and Detail (Phase 4)
- `src/components/VoucherCard.tsx`: paper-stack card (Phase 2)
- `tailwind.config.js`: design tokens

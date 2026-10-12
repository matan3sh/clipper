/**
 * Clippr design tokens — Acctual design language, Iris palette.
 * Source of truth for colors, type, radii and elevation. See HANDOFF.md → Design.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: '#ffffff', // page canvas, cards
        surface: '#f8f7fd', // secondary pills, icon tiles, panels
        hairline: '#e7e5f1', // list dividers, empty tracks
        border: '#d3d0e3', // input and outline-button borders
        ink: '#1b1830', // primary text
        muted: '#625e78', // secondary text (6:1 on paper)
        faint: '#8f8aa6', // disabled text, decimals
        action: {
          DEFAULT: '#17132e', // primary buttons, selected pills, + button, switches on
          ring: '#231e40', // 1px ring on filled buttons
        },
        accent: {
          DEFAULT: '#6c56fc', // Iris: dots, rings, check circles, scan highlights only
          ink: '#5541e0', // small accent text: eyebrows, dates
        },
        wash: {
          DEFAULT: '#e1e0fc', // lavender: expiring banner, expiry card, day chips
          ink: '#3d2fb0', // text on wash
          muted: '#4a4566', // secondary text on wash
        },
        blush: '#f6d2f4', // secondary paper-stack sheet tint
        // Status colors — only for scan quality and expired/rescan states
        danger: { DEFAULT: '#c93c3c', wash: '#fde6e6' },
        warning: { DEFAULT: '#8a5a00', wash: '#fbefd6' },
        camera: '#17132e', // camera viewfinder background
      },
      fontFamily: {
        // React Native needs one family per weight, so weights are separate families.
        regular: ['Inter_400Regular'],
        body: ['Inter_500Medium'], // default UI and body text
        display: ['Inter_600SemiBold'], // headings, labels, amounts
        strong: ['Inter_700Bold'], // voucher mockup wordmarks only
        hand: ['Caveat_600SemiBold'], // handwritten notes only
      },
      fontSize: {
        // [size, { lineHeight, letterSpacing }] — px values
        eyebrow: ['11px', { lineHeight: '18px', letterSpacing: '0.22px' }],
        caption: ['13px', { lineHeight: '18px', letterSpacing: '-0.26px' }],
        'body-sm': ['14px', { lineHeight: '20px', letterSpacing: '-0.28px' }],
        body: ['16px', { lineHeight: '24px', letterSpacing: '-0.32px' }],
        title: ['20px', { lineHeight: '28px', letterSpacing: '-0.6px' }],
        subhead: ['24px', { lineHeight: '32px', letterSpacing: '-0.72px' }],
        heading: ['32px', { lineHeight: '40px', letterSpacing: '-0.96px' }],
        display: ['48px', { lineHeight: '56px', letterSpacing: '-1.44px' }],
      },
      borderRadius: {
        card: '16px', // cards, inputs, thumbnails
        image: '20px', // photo panels, notification card
        panel: '32px', // large feature panels, bottom sheets
        pill: '100px', // buttons, tags, nav
      },
      spacing: {
        gutter: '20px', // screen side padding
        'safe-top': '58px', // content inset below the status bar
      },
      boxShadow: {
        // Elevation is reserved for "paper": voucher cards, notification card, floating nav
        paper: '0px 1.78px 8px 0px rgba(0, 0, 0, 0.05), 0px 0.89px 2.67px 0px rgba(0, 0, 0, 0.04)',
        'paper-ring':
          '0px 1.78px 8px 0px rgba(0, 0, 0, 0.05), 0px 0.89px 2.67px 0px rgba(0, 0, 0, 0.04), 0px 0px 0px 1px rgba(23, 19, 46, 0.06)',
        button: '0px 0px 0px 1px rgb(35, 30, 64), 0px 1px 2px 0px rgba(23, 19, 46, 0.48)',
        subtle: '0px 1px 2px 0px rgba(23, 19, 46, 0.06)',
      },
    },
  },
  plugins: [],
};

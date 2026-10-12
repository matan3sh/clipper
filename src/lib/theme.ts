/**
 * JS-side mirror of the tokens in tailwind.config.js, for props that can't take classes
 * (icon colors, ActivityIndicator) and for styles that must change after the first render.
 *
 * NativeWind v4 remounts a component when a shadow class is added or removed after its first render,
 * and in dev that remount throws "Couldn't find a navigation context". Toggle shadows through `style`
 * with these values instead of switching `shadow-*` classes.
 */
export const colors = {
  ink: '#1b1830',
  muted: '#625e78',
  faint: '#8f8aa6',
  action: '#17132e',
  accent: '#6c56fc',
  paper: '#ffffff',
  hairline: '#e7e5f1',
  border: '#d3d0e3',
  washInk: '#3d2fb0',
  danger: '#c93c3c',
} as const;

export const shadows = {
  button: '0px 0px 0px 1px rgb(35, 30, 64), 0px 1px 2px 0px rgba(23, 19, 46, 0.48)',
} as const;

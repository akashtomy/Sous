import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1E1B16',
    textMuted: '#6B645A',
    background: '#FAF8F4',
    card: '#FFFFFF',
    cardAlt: '#F3EFE8',
    border: '#E6E0D6',
    primary: '#2F7D4F',
    primarySoft: '#E3F1E8',
    onPrimary: '#FFFFFF',
    accent: '#C77A12',
    accentSoft: '#FBEFD9',
    danger: '#B93A2A',
    dangerSoft: '#F9E3DF',
    healthy: '#2F7D4F',
    balanced: '#9A6B00',
    indulgent: '#B93A2A',
  },
  dark: {
    text: '#F2EEE7',
    textMuted: '#A69F94',
    background: '#12110F',
    card: '#1C1A17',
    cardAlt: '#25221E',
    border: '#332E28',
    primary: '#5DBB82',
    primarySoft: '#1E3326',
    onPrimary: '#0E1A12',
    accent: '#F0B456',
    accentSoft: '#3A2C14',
    danger: '#F07A68',
    dangerSoft: '#3A1D18',
    healthy: '#5DBB82',
    balanced: '#E2B85A',
    indulgent: '#F07A68',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof Palette;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', mono: 'ui-monospace' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
});

export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const MaxContentWidth = 760;

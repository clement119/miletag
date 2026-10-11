/**
 * Miletag design tokens (PRD §10.3): monochrome UI so the user's art is the colour,
 * one accent, dark by default.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  background: '#0A0A0B',
  surface: '#161618',
  surfaceRaised: '#202023',
  border: '#2C2C30',
  text: '#F5F5F4',
  textSecondary: '#A1A1A6',
  textMuted: '#6B6B70',
  accent: '#F5A623',
  accentText: '#0A0A0B',
  danger: '#FF5A5F',
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  web: { sans: 'var(--font-display)', mono: 'var(--font-mono)' },
  default: { sans: 'normal', mono: 'monospace' },
});

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

/** Motion rules: 150–300 ms, spring-based, interruptible. */
export const Motion = {
  fast: 150,
  base: 220,
  slow: 300,
  spring: { damping: 18, stiffness: 220, mass: 0.9 },
} as const;

export const MaxContentWidth = 720;

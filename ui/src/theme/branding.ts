import { createDarkTheme, createLightTheme, type BrandVariants, type Theme } from '@fluentui/react-components';

export interface Branding {
  appName: string;
  tagline: string;
  primaryColor: string;
  logoText: string; // initials shown in the logo tile when no logo file is uploaded
  logoDataUrl?: string;
  defaultMode: 'light' | 'dark' | 'system';
  reportFooter: string;
  supportContact: string;
}

export const defaultBranding: Branding = {
  appName: 'Sourcing Hub',
  tagline: 'Procurement & strategic sourcing',
  primaryColor: '#0E6F7C',
  logoText: 'SH',
  defaultMode: 'system',
  reportFooter: 'Confidential – for internal use only',
  supportContact: 'procurement-support@contoso.example',
};

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
const mix = (hex: string, target: number, amount: number) => {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (target - r) * amount, g + (target - g) * amount, b + (target - b) * amount);
};

/** Builds the 16-step brand ramp Fluent UI needs from one primary colour (step 80 = the colour itself). */
export function brandRamp(primary: string): BrandVariants {
  const steps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160] as const;
  const out = {} as Record<number, string>;
  for (const s of steps) {
    const t = (s - 80) / 80;
    out[s] = t < 0 ? mix(primary, 0, -t * 0.82) : mix(primary, 255, t * 0.92);
  }
  return out as unknown as BrandVariants;
}

/** WCAG relative-luminance contrast between two colours. */
export function contrast(a: string, b: string) {
  const lum = (hex: string) => {
    const [r, g, bl] = hexToRgb(hex).map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export function makeThemes(primary: string): { light: Theme; dark: Theme } {
  const ramp = brandRamp(primary);
  const light = createLightTheme(ramp);
  const dark = createDarkTheme(ramp);
  dark.colorBrandForeground1 = ramp[110];
  dark.colorBrandForeground2 = ramp[120];
  dark.colorBrandForegroundLink = ramp[120];
  dark.colorCompoundBrandStroke = ramp[110];
  dark.colorCompoundBrandForeground1 = ramp[110];
  return { light, dark };
}

// Categorical chart palette (validated for colour-vision deficiency), fixed order.
export const chartPalette = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
};

export type SchoolBranding = {
  logoUrl?: string | null;
  primary?: string | null;
  secondary?: string | null;
  accent?: string | null;
};

export type BrandingPalette = {
  primary: string;
  secondary: string;
  accent: string;
};

export const DEFAULT_BRANDING: BrandingPalette = {
  primary: "#1f8679",
  secondary: "#f28c28",
  accent: "#ff6b5b",
};

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

function normalizeHex(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!HEX_PATTERN.test(trimmed)) return null;
  const raw = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  if (raw.length === 3) {
    return `#${raw
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`.toLowerCase();
  }
  return `#${raw.toLowerCase()}`;
}

function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const value = normalized.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return { r, g, b };
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / delta + 2;
        break;
      case bNorm:
      default:
        h = (rNorm - gNorm) / delta + 4;
        break;
    }
    h *= 60;
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

function hslString(hsl: Hsl): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

function rgbaString({ r, g, b }: Rgb, alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function setCssVar(name: string, value: string | null) {
  if (!value) return;
  document.documentElement.style.setProperty(name, value);
}

export function applyBranding(branding?: SchoolBranding | null) {
  if (typeof document === "undefined") return;
  const primaryHex = normalizeHex(branding?.primary) ?? DEFAULT_BRANDING.primary;
  const secondaryHex = normalizeHex(branding?.secondary) ?? DEFAULT_BRANDING.secondary;
  const accentHex = normalizeHex(branding?.accent) ?? DEFAULT_BRANDING.accent;

  const primaryRgb = hexToRgb(primaryHex);
  const secondaryRgb = hexToRgb(secondaryHex);
  const accentRgb = hexToRgb(accentHex);

  if (primaryRgb) {
    const primaryHsl = hslString(rgbToHsl(primaryRgb));
    setCssVar("--brand-primary", primaryHsl);
    setCssVar("--primary", primaryHsl);
    setCssVar("--ring", primaryHsl);
    setCssVar("--accent-iris", primaryHsl);
    setCssVar("--canvas-glow-a", rgbaString(primaryRgb, 0.16));
    setCssVar("--shell-glow-a", rgbaString(primaryRgb, 0.24));
  }

  if (secondaryRgb) {
    const secondaryHsl = hslString(rgbToHsl(secondaryRgb));
    setCssVar("--brand-secondary", secondaryHsl);
    setCssVar("--accent-violet", secondaryHsl);
    setCssVar("--canvas-glow-b", rgbaString(secondaryRgb, 0.18));
    setCssVar("--shell-glow-b", rgbaString(secondaryRgb, 0.2));
  }

  if (accentRgb) {
    const accentHsl = hslString(rgbToHsl(accentRgb));
    setCssVar("--brand-accent", accentHsl);
    setCssVar("--accent-flamingo", accentHsl);
    setCssVar("--accent-gold", accentHsl);
    setCssVar("--canvas-glow-c", rgbaString(accentRgb, 0.12));
    setCssVar("--shell-glow-c", rgbaString(accentRgb, 0.16));
  }
}

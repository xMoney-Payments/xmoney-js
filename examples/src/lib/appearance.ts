import type {
  Appearance,
  ApplePayAppearance,
  GooglePayAppearance,
} from "@xmoney/xmoney-js";

/** WidgetShell panel. The SDK iframe uses the same fill so it sits flush on the card. */
export const shellCanvas = {
  light: "#ffffff",
  dark: "#18181b",
} as const;

/**
 * Built-in light and dark, with the form canvas set to the card behind the iframe.
 * `theme: "custom"` is required: a light/dark theme keeps the SDK's own background.
 */
export function sampleAppearance(mode: "light" | "dark"): Appearance {
  return {
    theme: mode,
    variables: {
      colorBackground: "transparent",
      borderRadius: "16px",
      buttonBorderRadius: "99px",
    },
  };
}

export type PlaygroundThemeId = "lavender" | "ocean" | "blush";

export interface PlaygroundTheme {
  id: PlaygroundThemeId;
  label: string;
  swatch: string;
  tint: string;
  pageLight: string;
  pageDark: string;
  surface: string;
  surfaceDark: string;
  cardDark: string;
  panelDark: string;
  text: string;
  textDark: string;
}

/** Accents from payment-link-landing `simulatorModel.ts`. */
export const PLAYGROUND_THEMES: PlaygroundTheme[] = [
  {
    id: "lavender",
    label: "Lavender",
    swatch: "#7C4DFF",
    tint: "#ECE8FB",
    pageLight: "#F7F6F9",
    pageDark: "#0F0E15",
    surface: "#F7F6FF",
    surfaceDark: "#241F33",
    cardDark: "#1C1A26",
    panelDark: "#17151F",
    text: "#7C4DFF",
    textDark: "#B47CFF",
  },
  {
    id: "ocean",
    label: "Ocean",
    swatch: "#2563EB",
    tint: "#E3EBFB",
    pageLight: "#F3F6FC",
    pageDark: "#0B1020",
    surface: "#F2F6FF",
    surfaceDark: "#1A2440",
    cardDark: "#151C2E",
    panelDark: "#10172A",
    text: "#2563EB",
    textDark: "#93B4FF",
  },
  {
    id: "blush",
    label: "Blush",
    swatch: "#DB2777",
    tint: "#F9E6EF",
    pageLight: "#FBF5F8",
    pageDark: "#170C14",
    surface: "#FFF3F8",
    surfaceDark: "#33192B",
    cardDark: "#221520",
    panelDark: "#1C111A",
    text: "#DB2777",
    textDark: "#F9A8D4",
  },
];

export function playgroundTheme(id: PlaygroundThemeId): PlaygroundTheme {
  return (
    PLAYGROUND_THEMES.find((theme) => theme.id === id) ?? PLAYGROUND_THEMES[0]
  );
}

export function playgroundAppearance(
  theme: PlaygroundTheme,
  mode: "light" | "dark",
): Appearance {
  const dark = mode === "dark";
  const text = dark ? "#FAFAFA" : "#16141A";
  const accentText = dark ? theme.textDark : theme.text;
  const canvas = dark ? theme.cardDark : "#FFFFFF";
  const divider = dark ? "rgba(255, 255, 255, 0.12)" : "rgba(22, 20, 26, 0.12)";

  return {
    theme: "custom",
    variables: {
      colorPrimary: theme.swatch,
      colorText: text,
      colorTextSecondary: accentText,
      colorTextPlaceholder: dark
        ? "rgba(255, 255, 255, 0.35)"
        : "rgba(22, 20, 26, 0.35)",
      colorBorder: divider,
      colorBorderHover: divider,
      colorBorderFocus: theme.swatch,
      colorBackground: canvas,
      colorBackgroundInput: canvas,
      colorBackgroundHover: canvas,
      colorBackgroundDisabled: canvas,
      borderRadius: "12px",
      paddingForm: "0px",
    },
    rules: {
      ".xmoney-card-group": { backgroundColor: canvas },
      ".xmoney-input": { backgroundColor: canvas, color: text },
    },
  };
}

export function appleAppearance(mode: "light" | "dark"): ApplePayAppearance {
  return {
    style: mode === "dark" ? "white" : "black",
    type: "pay",
    radius: 999,
    height: 52,
  };
}

export function googleAppearance(mode: "light" | "dark"): GooglePayAppearance {
  return {
    color: mode === "dark" ? "white" : "black",
    type: "pay",
    radius: 999,
    height: 52,
    borderType: "no_border",
  };
}

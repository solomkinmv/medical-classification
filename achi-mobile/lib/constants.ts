import type { ClassifierType } from "./types";

// Header animation constants
export const HEADER_MAX_HEIGHT = 120;
export const HEADER_MIN_HEIGHT = 60;
export const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// Colors
export const colors = {
  sky: {
    500: "#0ea5e9",
    600: "#0284c7",
  },
  emerald: {
    500: "#10b981",
    600: "#059669",
  },
  amber: {
    500: "#f59e0b",
    600: "#d97706",
  },
  violet: {
    500: "#8b5cf6",
    600: "#7c3aed",
  },
  gray: {
    100: "#f3f4f6",
    400: "#9ca3af",
    500: "#6b7280",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
} as const;

// Theme colors for light/dark mode
export const theme = {
  light: {
    background: "#F0F2F5", // slightly darker for more contrast
    card: "#FFFFFF",
    text: "#111827", // gray-900
    textSecondary: "#6b7280", // gray-500
    textMuted: "#9ca3af", // gray-400
  },
  dark: {
    background: "#0A0A0A",
    card: "#1C1C1E",
    text: "#f3f4f6", // gray-100
    textSecondary: "#9ca3af", // gray-400
    textMuted: "#6b7280", // gray-500
  },
} as const;

// Search
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_MAX_RESULTS = 100;
export const RECENT_SEARCHES_MAX_COUNT = 10;

// Layout
export const CONTENT_PADDING_HORIZONTAL = 16;
export const CONTENT_PADDING_BOTTOM = 100;

// Card height for FlatList getItemLayout optimization (categories without subtitle)
export const CARD_HEIGHT_WITHOUT_SUBTITLE = 84;

// Accent bar heights
export const ACCENT_BAR_HEIGHT_WITH_SUBTITLE = 64;
export const ACCENT_BAR_HEIGHT_WITHOUT_SUBTITLE = 48;

// UI feedback delays
export const REFRESH_FEEDBACK_DELAY_MS = 300;

// Classifier-specific accent colors
export function getClassifierColors(classifier: ClassifierType) {
  if (classifier === "mkh10") {
    return {
      accent500: colors.emerald[500],
      accent600: colors.emerald[600],
      iconBackground: "rgba(16, 185, 129, 0.1)",
    };
  }
  return {
    accent500: colors.sky[500],
    accent600: colors.sky[600],
    iconBackground: "rgba(14, 165, 233, 0.1)",
  };
}

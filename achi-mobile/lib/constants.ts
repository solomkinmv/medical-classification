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
    background: "#F0F2F5",    // slightly darker for more contrast
    card: "#FFFFFF",
    text: "#111827",         // gray-900
    textSecondary: "#6b7280", // gray-500
    textMuted: "#9ca3af",     // gray-400
  },
  dark: {
    background: "#0A0A0A",
    card: "#1C1C1E",
    text: "#f3f4f6",          // gray-100
    textSecondary: "#9ca3af", // gray-400
    textMuted: "#6b7280",     // gray-500
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

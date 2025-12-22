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
  },
} as const;

// Search
export const SEARCH_DEBOUNCE_MS = 300;
export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_MAX_RESULTS = 100;

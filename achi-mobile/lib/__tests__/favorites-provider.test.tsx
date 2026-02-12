import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReactNode } from "react";
import type { LeafCode } from "../types";
import { BOOKMARK_LIMIT_FREE } from "../constants";

let mockIsPro = false;

jest.mock("../pro-provider", () => ({
  useProStatus: () => ({
    isPro: mockIsPro,
    isProLoading: false,
    purchasePro: jest.fn(),
    restorePurchases: jest.fn(),
    product: null,
  }),
}));

jest.mock("../classifier-provider", () => ({
  useClassifier: () => ({
    activeClassifier: "achi",
    setActiveClassifier: jest.fn(),
    activeData: { children: {} },
    isReady: true,
  }),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
}));

import { FavoritesProvider, useFavorites } from "../favorites-provider";

function wrapper({ children }: { children: ReactNode }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}

function makeLeafCode(code: string): LeafCode {
  return { code, name_ua: `Name ${code}`, name_en: `EN ${code}` };
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  mockIsPro = false;
});

describe("FavoritesProvider - bookmark limit", () => {
  it("allows adding bookmarks under the limit", async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    const item = makeLeafCode("001");
    let outcome: { limitReached: boolean };
    act(() => {
      outcome = result.current.toggleFavorite(item);
    });

    expect(outcome!.limitReached).toBe(false);
    expect(result.current.favorites).toHaveLength(1);
  });

  it("allows adding up to BOOKMARK_LIMIT_FREE bookmarks", async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    for (let i = 0; i < BOOKMARK_LIMIT_FREE; i++) {
      act(() => {
        result.current.toggleFavorite(makeLeafCode(`00${i}`));
      });
    }

    expect(result.current.favorites).toHaveLength(BOOKMARK_LIMIT_FREE);
  });

  it("blocks adding when at the limit for free users", async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    for (let i = 0; i < BOOKMARK_LIMIT_FREE; i++) {
      act(() => {
        result.current.toggleFavorite(makeLeafCode(`00${i}`));
      });
    }

    let outcome: { limitReached: boolean };
    act(() => {
      outcome = result.current.toggleFavorite(makeLeafCode("extra"));
    });

    expect(outcome!.limitReached).toBe(true);
    expect(result.current.favorites).toHaveLength(BOOKMARK_LIMIT_FREE);
  });

  it("allows Pro users to exceed the limit", async () => {
    mockIsPro = true;
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    for (let i = 0; i < BOOKMARK_LIMIT_FREE + 2; i++) {
      let outcome: { limitReached: boolean };
      act(() => {
        outcome = result.current.toggleFavorite(makeLeafCode(`00${i}`));
      });
      expect(outcome!.limitReached).toBe(false);
    }

    expect(result.current.favorites).toHaveLength(BOOKMARK_LIMIT_FREE + 2);
  });

  it("still allows removing bookmarks when at the limit", async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    const items = Array.from({ length: BOOKMARK_LIMIT_FREE }, (_, i) =>
      makeLeafCode(`00${i}`),
    );
    for (const item of items) {
      act(() => {
        result.current.toggleFavorite(item);
      });
    }

    expect(result.current.favorites).toHaveLength(BOOKMARK_LIMIT_FREE);

    let outcome: { limitReached: boolean };
    act(() => {
      outcome = result.current.toggleFavorite(items[0]);
    });

    expect(outcome!.limitReached).toBe(false);
    expect(result.current.favorites).toHaveLength(BOOKMARK_LIMIT_FREE - 1);
  });

  it("preserves existing bookmarks over the limit loaded from storage", async () => {
    const existingFavorites = Array.from({ length: 5 }, (_, i) =>
      makeLeafCode(`existing${i}`),
    );
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "achi_favorites") {
        return Promise.resolve(JSON.stringify(existingFavorites));
      }
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.favorites).toHaveLength(5);
  });

  it("isFavorite returns true for bookmarked codes", async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.isFavorite("001")).toBe(false);

    act(() => {
      result.current.toggleFavorite(makeLeafCode("001"));
    });

    expect(result.current.isFavorite("001")).toBe(true);
    expect(result.current.isFavorite("002")).toBe(false);

    act(() => {
      result.current.toggleFavorite(makeLeafCode("001"));
    });

    expect(result.current.isFavorite("001")).toBe(false);
  });

  it("handles corrupted storage data gracefully", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "achi_favorites") {
        return Promise.resolve("invalid json{{{");
      }
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useFavorites(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.favorites).toEqual([]);
  });

  it("throws error when useFavorites is used outside FavoritesProvider", () => {
    expect(() => {
      renderHook(() => useFavorites());
    }).toThrow("useFavorites must be used within FavoritesProvider");
  });
});

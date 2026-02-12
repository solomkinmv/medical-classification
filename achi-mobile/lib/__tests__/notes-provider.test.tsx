import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ReactNode } from "react";

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

import { NotesProvider, useNotes } from "../notes-provider";

function wrapper({ children }: { children: ReactNode }) {
  return <NotesProvider>{children}</NotesProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe("NotesProvider", () => {
  it("starts with no notes", async () => {
    const { result } = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.getNote("12345")).toBeNull();
    expect(result.current.hasNote("12345")).toBe(false);
  });

  it("sets a note for a code", async () => {
    const { result } = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.setNote("12345", "Test note");
    });

    expect(result.current.getNote("12345")).toBe("Test note");
    expect(result.current.hasNote("12345")).toBe(true);
  });

  it("persists note to AsyncStorage on set", async () => {
    const { result } = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.setNote("12345", "My note");
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "achi_notes",
      expect.any(String),
    );
    const savedData = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
    );
    expect(savedData).toEqual({ "12345": "My note" });
  });

  it("updates an existing note", async () => {
    const { result } = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.setNote("12345", "First version");
    });

    act(() => {
      result.current.setNote("12345", "Updated version");
    });

    expect(result.current.getNote("12345")).toBe("Updated version");
  });

  it("deletes a note", async () => {
    const { result } = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.setNote("12345", "To delete");
    });

    expect(result.current.hasNote("12345")).toBe(true);

    act(() => {
      result.current.deleteNote("12345");
    });

    expect(result.current.getNote("12345")).toBeNull();
    expect(result.current.hasNote("12345")).toBe(false);
  });

  it("persists after delete", async () => {
    const { result } = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.setNote("12345", "Note");
    });

    act(() => {
      result.current.deleteNote("12345");
    });

    const lastCall = (AsyncStorage.setItem as jest.Mock).mock.calls.at(-1);
    expect(lastCall[0]).toBe("achi_notes");
    const savedData = JSON.parse(lastCall[1]);
    expect(savedData).toEqual({});
  });

  it("supports multiple notes for different codes", async () => {
    const { result } = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.setNote("AAA", "Note A");
      result.current.setNote("BBB", "Note B");
      result.current.setNote("CCC", "Note C");
    });

    expect(result.current.getNote("AAA")).toBe("Note A");
    expect(result.current.getNote("BBB")).toBe("Note B");
    expect(result.current.getNote("CCC")).toBe("Note C");
  });

  it("loads notes from AsyncStorage on mount", async () => {
    const existingNotes = { "001": "Existing note", "002": "Another note" };
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "achi_notes") {
        return Promise.resolve(JSON.stringify(existingNotes));
      }
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.getNote("001")).toBe("Existing note");
    expect(result.current.getNote("002")).toBe("Another note");
    expect(result.current.hasNote("001")).toBe(true);
    expect(result.current.hasNote("002")).toBe(true);
  });

  it("handles corrupted storage data gracefully", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "achi_notes") {
        return Promise.resolve("invalid json{{{");
      }
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.getNote("anything")).toBeNull();
    expect(result.current.hasNote("anything")).toBe(false);
  });

  it("handles non-object stored data gracefully", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "achi_notes") {
        return Promise.resolve(JSON.stringify([1, 2, 3]));
      }
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.getNote("anything")).toBeNull();
  });

  it("deleting a non-existent note is a no-op", async () => {
    const { result } = renderHook(() => useNotes(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.deleteNote("nonexistent");
    });

    expect(result.current.hasNote("nonexistent")).toBe(false);
  });

  it("throws error when useNotes is used outside NotesProvider", () => {
    expect(() => {
      renderHook(() => useNotes());
    }).toThrow("useNotes must be used within NotesProvider");
  });
});

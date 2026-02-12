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

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => `uuid-${Date.now()}-${Math.random()}`),
}));

import { FoldersProvider, useFolders } from "../folders-provider";

function wrapper({ children }: { children: ReactNode }) {
  return <FoldersProvider>{children}</FoldersProvider>;
}

beforeEach(() => {
  jest.clearAllMocks();
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
});

describe("FoldersProvider", () => {
  it("starts with empty folders", async () => {
    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.folders).toHaveLength(0);
  });

  it("creates a folder", async () => {
    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let folder: ReturnType<typeof result.current.createFolder>;
    act(() => {
      folder = result.current.createFolder("My Folder");
    });

    expect(result.current.folders).toHaveLength(1);
    expect(result.current.folders[0].name).toBe("My Folder");
    expect(result.current.folders[0].classifier).toBe("achi");
    expect(result.current.folders[0].codeRefs).toEqual([]);
    expect(folder!.id).toBeDefined();
  });

  it("persists folder to AsyncStorage on create", async () => {
    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.createFolder("Test");
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "achi_folders",
      expect.any(String),
    );
    const savedData = JSON.parse(
      (AsyncStorage.setItem as jest.Mock).mock.calls[0][1],
    );
    expect(savedData).toHaveLength(1);
    expect(savedData[0].name).toBe("Test");
  });

  it("deletes a folder", async () => {
    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let folderId = "";
    act(() => {
      const folder = result.current.createFolder("To Delete");
      folderId = folder.id;
    });

    expect(result.current.folders).toHaveLength(1);

    act(() => {
      result.current.deleteFolder(folderId);
    });

    expect(result.current.folders).toHaveLength(0);
  });

  it("renames a folder", async () => {
    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let folderId = "";
    act(() => {
      const folder = result.current.createFolder("Old Name");
      folderId = folder.id;
    });

    act(() => {
      result.current.renameFolder(folderId, "New Name");
    });

    expect(result.current.folders[0].name).toBe("New Name");
  });

  it("adds a code to a folder", async () => {
    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let folderId = "";
    act(() => {
      const folder = result.current.createFolder("Codes");
      folderId = folder.id;
    });

    act(() => {
      result.current.addToFolder(folderId, "12345");
    });

    expect(result.current.folders[0].codeRefs).toEqual(["12345"]);
  });

  it("does not add duplicate code to a folder", async () => {
    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let folderId = "";
    act(() => {
      const folder = result.current.createFolder("Codes");
      folderId = folder.id;
    });

    act(() => {
      result.current.addToFolder(folderId, "12345");
    });
    act(() => {
      result.current.addToFolder(folderId, "12345");
    });

    expect(result.current.folders[0].codeRefs).toEqual(["12345"]);
  });

  it("removes a code from a folder", async () => {
    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let folderId = "";
    act(() => {
      const folder = result.current.createFolder("Codes");
      folderId = folder.id;
    });

    act(() => {
      result.current.addToFolder(folderId, "12345");
      result.current.addToFolder(folderId, "67890");
    });
    act(() => {
      result.current.removeFromFolder(folderId, "12345");
    });

    expect(result.current.folders[0].codeRefs).toEqual(["67890"]);
  });

  it("getFolderForCode returns the folder containing the code", async () => {
    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    let folderId = "";
    act(() => {
      const folder = result.current.createFolder("My Folder");
      folderId = folder.id;
    });

    act(() => {
      result.current.addToFolder(folderId, "12345");
    });

    expect(result.current.getFolderForCode("12345")?.id).toBe(folderId);
    expect(result.current.getFolderForCode("99999")).toBeNull();
  });

  it("loads folders from AsyncStorage on mount", async () => {
    const existingFolders = [
      {
        id: "existing-1",
        name: "Loaded Folder",
        classifier: "achi",
        codeRefs: ["001", "002"],
      },
    ];
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "achi_folders") {
        return Promise.resolve(JSON.stringify(existingFolders));
      }
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.folders).toHaveLength(1);
    expect(result.current.folders[0].name).toBe("Loaded Folder");
    expect(result.current.folders[0].codeRefs).toEqual(["001", "002"]);
  });

  it("handles corrupted storage data gracefully", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "achi_folders") {
        return Promise.resolve("invalid json{{{");
      }
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.folders).toEqual([]);
  });

  it("supports multiple folders", async () => {
    const { result } = renderHook(() => useFolders(), { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));

    act(() => {
      result.current.createFolder("Folder A");
      result.current.createFolder("Folder B");
      result.current.createFolder("Folder C");
    });

    expect(result.current.folders).toHaveLength(3);
    expect(result.current.folders.map((f) => f.name)).toEqual([
      "Folder A",
      "Folder B",
      "Folder C",
    ]);
  });
});

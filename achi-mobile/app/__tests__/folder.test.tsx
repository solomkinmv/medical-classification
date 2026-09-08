import type { ReactNode } from "react";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { fireEvent, render, screen } from "@testing-library/react-native";
import FolderDetail from "../folder/[id]";

const mockAdd = jest.fn();
const mockRemove = jest.fn();
const mockToggleFavorite = jest.fn();
const mockPush = jest.fn();
const mockUpgrade = jest.fn();
const mockHeader = jest.fn();
let mockIsPro = true;
let mockReady = true;
let mockFolders = [{ id: "teddy", name: "Teddy", codeRefs: [] as string[] }];
let mockFavorites = [
  { code: "100", name_ua: "Тестовий код", name_en: "Test code" },
];

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "teddy" }),
  useRouter: () => ({ push: mockPush }),
  Link: ({ children }: { children: ReactNode }) => children,
  Stack: {
    Screen: ({ options }: { options: NativeStackNavigationOptions }) => {
      mockHeader(options);
      return jest
        .requireActual("@/test-utils/stack-header")
        .renderStackHeader(options);
    },
  },
}));
jest.mock("@react-navigation/elements", () => ({
  HeaderButton: (props: object) => {
    const { Pressable } = jest.requireActual("react-native");
    return <Pressable {...props} />;
  },
}));
jest.mock("@/lib/folders-provider", () => ({
  useFolders: () => ({
    folders: mockFolders,
    isReady: mockReady,
    addToFolder: mockAdd,
    removeFromFolder: mockRemove,
  }),
}));
jest.mock("@/lib/favorites-provider", () => ({
  useFavorites: () => ({
    favorites: mockFavorites,
    isReady: true,
    toggleFavorite: mockToggleFavorite,
  }),
}));
jest.mock("@/lib/classifier-provider", () => ({
  useClassifier: () => ({ activeClassifier: "achi" }),
}));
jest.mock("@/lib/pro-provider", () => ({
  useProStatus: () => ({ isPro: mockIsPro }),
}));
jest.mock("@/lib/useTheme", () => ({
  useTheme: () => ({
    colors: {
      background: "#F0F2F5",
      text: "#111111",
      textSecondary: "#666666",
      card: "#FFFFFF",
    },
  }),
}));
jest.mock("@/lib/useBackgroundColor", () => ({
  useBackgroundColor: () => "transparent",
}));
jest.mock("@/components/UpgradePrompt", () => ({
  showUpgradePrompt: () => mockUpgrade(),
}));
jest.mock("@/components/AccentCard", () => ({
  AccentCard: ({ title }: { title: string }) => {
    const { Text } = jest.requireActual("react-native");
    return <Text>{title}</Text>;
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockReady = true;
  mockIsPro = true;
  mockFolders = [{ id: "teddy", name: "Teddy", codeRefs: [] }];
  mockFavorites = [
    { code: "100", name_ua: "Тестовий код", name_en: "Test code" },
  ];
});

test("empty folder offers a visible add action and consistent navigation chrome", () => {
  render(<FolderDetail />);
  expect(screen.getByTestId("folder.add-empty")).toBeTruthy();
  expect(mockHeader).toHaveBeenCalledWith(
    expect.objectContaining({
      headerBackButtonDisplayMode: "minimal",
    }),
  );
  const options = mockHeader.mock.calls.at(-1)![0];
  expect(options.headerTransparent).not.toBe(false);
  expect(options.headerStyle?.backgroundColor).toBeUndefined();
  expect(options.unstable_headerRightItems).toEqual(expect.any(Function));
  expect(screen.getByTestId("folder.list")).toHaveStyle({
    backgroundColor: "#F0F2F5",
  });
});

test("adds an existing bookmark to the current folder and finishes selection", () => {
  const view = render(<FolderDetail />);
  fireEvent.press(screen.getByTestId("folder.add-empty"));
  fireEvent.press(screen.getByTestId("folder.code.100"));
  expect(mockAdd).toHaveBeenCalledWith("teddy", "100");
  mockFolders = [{ id: "teddy", name: "Teddy", codeRefs: ["100"] }];
  view.rerender(<FolderDetail />);
  expect(screen.getByTestId("folder.code.100")).toBeChecked();
  fireEvent.press(screen.getByTestId("folder.done"));
  expect(screen.queryByTestId("folder.code.100")).toBeNull();
  expect(screen.getByText("Тестовий код")).toBeTruthy();
});

test("removing folder membership never deletes the saved bookmark", () => {
  mockFolders[0].codeRefs = ["100"];
  render(<FolderDetail />);
  fireEvent.press(screen.getByTestId("folder.add"));
  fireEvent.press(screen.getByTestId("folder.code.100"));
  expect(mockRemove).toHaveBeenCalledWith("teddy", "100");
  expect(mockToggleFavorite).not.toHaveBeenCalled();
});

test("guides users without bookmarks to find and save codes", () => {
  mockFavorites = [];
  render(<FolderDetail />);
  fireEvent.press(screen.getByTestId("folder.add-empty"));
  fireEvent.press(screen.getByTestId("folder.explore"));
  expect(mockPush).toHaveBeenCalledWith("/(tabs)/explore");
});

test("gates folder editing behind Pro", () => {
  mockIsPro = false;
  render(<FolderDetail />);
  fireEvent.press(screen.getByTestId("folder.add"));
  expect(mockUpgrade).toHaveBeenCalledTimes(1);
  expect(screen.queryByTestId("folder.code.100")).toBeNull();
});

test("waits for folder storage instead of showing a missing folder", () => {
  mockFolders = [];
  mockReady = false;
  render(<FolderDetail />);
  expect(screen.getByTestId("folder.loading")).toBeTruthy();
  expect(screen.queryByText("Папку не знайдено")).toBeNull();
});

test("does not edit when Pro access disappears during selection", () => {
  const view = render(<FolderDetail />);
  fireEvent.press(screen.getByTestId("folder.add"));
  mockIsPro = false;
  view.rerender(<FolderDetail />);
  fireEvent.press(screen.getByTestId("folder.code.100"));
  expect(mockUpgrade).toHaveBeenCalledTimes(1);
  expect(mockAdd).not.toHaveBeenCalled();
});

test("shows a missing-folder message after storage has loaded", () => {
  mockFolders = [];
  render(<FolderDetail />);
  expect(screen.getByText("Папку не знайдено")).toBeTruthy();
  expect(screen.queryByTestId("folder.add")).toBeNull();
});

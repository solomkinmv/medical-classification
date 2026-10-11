import type { ReactNode } from "react";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { fireEvent, render, screen } from "@testing-library/react-native";
import * as Clipboard from "expo-clipboard";
import FolderDetail from "../folder/[id]";

const mockAdd = jest.fn();
const mockRemove = jest.fn();
const mockToggleFavorite = jest.fn();
const mockPush = jest.fn();
const mockUpgrade = jest.fn();
const mockHeader = jest.fn();
let mockIsPro = true;
let mockReady = true;
type MockFolder = {
  id: string;
  name: string;
  classifier: "achi";
  codeRefs: string[];
};
const folder = (codeRefs: string[] = []): MockFolder => ({
  id: "teddy",
  name: "Teddy",
  classifier: "achi",
  codeRefs,
});
let mockFolders: MockFolder[] = [folder()];
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
    getFolders: (classifier: string) =>
      classifier === "achi" ? mockFolders : [],
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
    isFavorite: () => true,
    isRemoved: () => false,
    getSavedCode: (code: string) =>
      mockFavorites.find((f) => f.code === code) ?? null,
  }),
}));
jest.mock("@/lib/notes-provider", () => ({
  useNotes: () => ({ hasNote: () => false }),
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
  AccentCard: ({
    title,
    onIconPress,
    iconAccessibilityLabel,
  }: {
    title: string;
    onIconPress: () => void;
    iconAccessibilityLabel: string;
  }) => {
    const { Pressable, Text } = jest.requireActual("react-native");
    return (
      <>
        <Text>{title}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={iconAccessibilityLabel}
          onPress={onIconPress}
        />
      </>
    );
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockReady = true;
  mockIsPro = true;
  mockFolders = [folder()];
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
  mockFolders = [folder(["100"])];
  view.rerender(<FolderDetail />);
  expect(screen.getByTestId("folder.code.100")).toBeChecked();
  fireEvent.press(screen.getByTestId("folder.done"));
  expect(screen.queryByTestId("folder.code.100")).toBeNull();
  expect(screen.getByText("Тестовий код")).toBeTruthy();
});

test("removing folder membership never deletes the saved bookmark", () => {
  mockFolders = [folder(["100"])];
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
  expect(mockPush).toHaveBeenCalledWith("/(tabs)/search");
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

test("removes a code from the folder without touching bookmarks", () => {
  mockFolders = [folder(["100"])];
  render(<FolderDetail />);
  fireEvent.press(screen.getByRole("button", { name: "Прибрати з папки" }));
  expect(mockRemove).toHaveBeenCalledWith("teddy", "100");
  expect(mockToggleFavorite).not.toHaveBeenCalled();
});

test("copies the folder as a list for a report", () => {
  mockFolders = [folder(["100"])];
  render(<FolderDetail />);
  fireEvent.press(screen.getByTestId("folder.copy"));
  expect(Clipboard.setStringAsync).toHaveBeenCalledWith("100 — Тестовий код");
});

test("shows folder codes even when they are not bookmarked", () => {
  mockFolders = [folder(["30443-00"])];
  mockFavorites = [];
  render(<FolderDetail />);
  expect(screen.getByText("Холецистектомія")).toBeTruthy();
});

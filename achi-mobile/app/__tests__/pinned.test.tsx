import { fireEvent, render, screen } from "@testing-library/react-native";
import { ActionSheetIOS, Alert } from "react-native";
import PinnedScreen from "../(tabs)/pinned";
const mockCreate = jest.fn(() => ({ id: "new" }));
const mockDelete = jest.fn();
const mockPush = jest.fn();
let mockReady = true;
const mockFolders = [
  { id: "a", name: "A", codeRefs: ["code"] },
  { id: "b", name: "B", codeRefs: ["code"] },
  { id: "c", name: "C", codeRefs: [] },
];
jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children,
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@/components/AccentCard", () => ({ AccentCard: () => null }));
jest.mock("@/components/Card", () => ({
  Card: ({ children }: any) => children,
}));
jest.mock("@/components/EmptyState", () => ({ EmptyState: () => null }));
jest.mock("@/components/SkeletonList", () => ({ SkeletonList: () => null }));
jest.mock("@/lib/prompt-text-input", () => ({
  promptTextInput: ({ onSubmit }: any) => onSubmit("New"),
}));
jest.mock("@/lib/favorites-provider", () => ({
  useFavorites: () => ({
    getFavorites: (classifier: string) =>
      classifier === "achi" ? [{ code: "code", name_ua: "Code" }] : [],
    toggleFavorite: jest.fn(),
    isFavorite: () => true,
    isRemoved: () => false,
    getSavedCode: () => null,
    isLoading: false,
  }),
}));
jest.mock("@/lib/folders-provider", () => ({
  useFolders: () => ({
    allFolders: mockFolders,
    isReady: mockReady,
    createFolder: mockCreate,
    deleteFolder: mockDelete,
    renameFolder: jest.fn(),
  }),
}));
jest.mock("@/lib/notes-provider", () => ({
  useNotes: () => ({ hasNote: () => false }),
}));
jest.mock("@/lib/pro-provider", () => ({
  useProStatus: () => ({ isPro: true }),
}));
jest.mock("@/lib/classifier-provider", () => ({
  useClassifier: () => ({ activeClassifier: "achi" }),
}));
jest.mock("@/lib/useBackgroundColor", () => ({
  useBackgroundColor: () => "white",
}));
jest.mock("@/lib/useTheme", () => ({
  useTheme: () => ({ colors: { text: "black", textSecondary: "gray" } }),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockReady = true;
});
afterEach(() => jest.restoreAllMocks());

test("creating a folder opens it", () => {
  render(<PinnedScreen />);
  expect(screen.getByTestId("pinned.folder.a")).toBeTruthy();
  fireEvent.press(screen.getByTestId("pinned.folder.create"));
  expect(mockCreate).toHaveBeenCalledWith("New");
  expect(mockPush).toHaveBeenCalledWith("/folder/new");
});

test("creation is hidden while folders are unhydrated", () => {
  mockReady = false;
  render(<PinnedScreen />);
  expect(screen.queryByTestId("pinned.folder.create")).toBeNull();
});

test("folder counts include codes that are not bookmarked", () => {
  render(<PinnedScreen />);
  expect(screen.getByLabelText("Папка A, 1 код")).toBeTruthy();
  expect(screen.getByLabelText("Папка C, Порожня")).toBeTruthy();
});

test("the folder menu deletes only after confirmation", () => {
  const sheet = jest
    .spyOn(ActionSheetIOS, "showActionSheetWithOptions")
    .mockImplementation(() => {});
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  render(<PinnedScreen />);
  fireEvent.press(screen.getByTestId("pinned.folder.a.menu"));

  const [options, choose] = sheet.mock.calls[0];
  expect(options.options).toEqual([
    "Перейменувати",
    "Копіювати список кодів",
    "Поділитися списком",
    "Видалити папку",
    "Скасувати",
  ]);
  choose(3);
  expect(mockDelete).not.toHaveBeenCalled();

  const buttons = alert.mock.calls[0][2]!;
  buttons.find((b) => b.text === "Видалити")!.onPress!();
  expect(mockDelete).toHaveBeenCalledWith("a");
});

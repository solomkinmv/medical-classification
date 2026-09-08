import { fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import PinnedScreen from "../(tabs)/pinned";
const mockAdd = jest.fn();
const mockRemove = jest.fn();
const mockCreate = jest.fn();
let mockReady = true;
const mockFolders = [
  { id: "a", name: "A", codeRefs: ["code"] },
  { id: "b", name: "B", codeRefs: ["code"] },
  { id: "c", name: "C", codeRefs: [] },
];
jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children,
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@/components/AccentCard", () => ({ AccentCard: () => null }));
jest.mock("@/components/Card", () => ({
  Card: ({ children }: any) => children,
}));
jest.mock("@/components/ClassifierSwitcher", () => ({
  ClassifierSwitcher: () => null,
}));
jest.mock("@/components/EmptyState", () => ({ EmptyState: () => null }));
jest.mock("@/components/SkeletonList", () => ({ SkeletonList: () => null }));
jest.mock("@/lib/prompt-text-input", () => ({
  promptTextInput: ({ onSubmit }: any) => onSubmit("New"),
}));
jest.mock("@/lib/favorites-provider", () => ({
  useFavorites: () => ({
    favorites: [{ code: "code", name_ua: "Code" }],
    toggleFavorite: jest.fn(),
    isLoading: false,
  }),
}));
jest.mock("@/lib/folders-provider", () => ({
  useFolders: () => ({
    folders: mockFolders,
    isReady: mockReady,
    createFolder: mockCreate,
    deleteFolder: jest.fn(),
    renameFolder: jest.fn(),
    addToFolder: mockAdd,
    removeFromFolder: mockRemove,
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
  useTheme: () => ({ colors: { text: "black" } }),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockReady = true;
});
afterEach(() => jest.restoreAllMocks());

test("folder creation and rows have stable identifiers", () => {
  render(<PinnedScreen />);
  expect(screen.getByTestId("pinned.folder.a")).toBeTruthy();
  fireEvent.press(screen.getByTestId("pinned.folder.create"));
  expect(mockCreate).toHaveBeenCalledWith("New");
});

test("creation is hidden while folders are unhydrated", () => {
  mockReady = false;
  render(<PinnedScreen />);
  expect(screen.queryByTestId("pinned.folder.create")).toBeNull();
});

test("folder menu toggles only the selected membership", () => {
  const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  render(<PinnedScreen />);
  fireEvent(screen.getByTestId("pinned.code.code"), "longPress");
  const buttons = alert.mock.calls[0][2]!;
  buttons.find((b) => b.text === 'Додати в "C"')!.onPress!();
  expect(mockAdd).toHaveBeenCalledWith("c", "code");
  expect(mockRemove).not.toHaveBeenCalled();
  buttons.find((b) => b.text === 'Видалити з "B"')!.onPress!();
  expect(mockRemove).toHaveBeenCalledWith("b", "code");
  expect(mockRemove).toHaveBeenCalledTimes(1);
});

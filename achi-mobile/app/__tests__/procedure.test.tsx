import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Keyboard, ScrollView } from "react-native";
import ProcedureDetail from "../procedure/[code]";

const mockSetNote = jest.fn();
const mockDeleteNote = jest.fn();
const mockToggleFavorite = jest.fn();
const mockHaptic = jest.fn();
const mockUpgrade = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
const mockHeader = jest.fn();
let mockNote: string | null = null;
let mockIsPro = true;
let mockPinned = false;

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 34, left: 0 }),
}));
jest.mock("@expo/vector-icons", () => ({
  Ionicons: (props: object) => {
    const { View } = jest.requireActual("react-native");
    return <View {...props} />;
  },
}));
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ code: "D68.1" }),
  useRouter: () => ({
    back: mockBack,
    push: jest.fn(),
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
  useNavigationContainerRef: () => ({}),
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
  HeaderButton: jest.fn((props) => {
    const { Pressable } = jest.requireActual("react-native");
    return <Pressable {...props} accessibilityRole="button" />;
  }),
}));
jest.mock("@/lib/useHaptics", () => ({
  useHaptics: () => ({ trigger: mockHaptic }),
}));
jest.mock("@/lib/classifier-provider", () => ({
  useClassifier: () => ({
    activeClassifier: "mkh10",
    activeData: {
      children: {
        test: {
          name_ua: "Test category",
          children: [{ code: "D68.1", name_ua: "Test diagnosis" }],
        },
      },
    },
  }),
}));
jest.mock("@/lib/navigation", () => ({ findProcedurePath: () => [] }));
jest.mock("@/lib/favorites-provider", () => ({
  useFavorites: () => ({
    isFavorite: () => mockPinned,
    toggleFavorite: mockToggleFavorite,
  }),
}));
jest.mock("@/lib/notes-provider", () => ({
  useNotes: () => ({
    getNote: () => mockNote,
    setNote: mockSetNote,
    deleteNote: mockDeleteNote,
  }),
}));
jest.mock("@/lib/pro-provider", () => ({
  useProStatus: () => ({ isPro: mockIsPro }),
}));
jest.mock("@/lib/useBackgroundColor", () => ({
  useBackgroundColor: () => "transparent",
}));
jest.mock("@/components/UpgradePrompt", () => ({
  showUpgradePrompt: () => mockUpgrade(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockNote = null;
  mockIsPro = true;
  mockPinned = false;
  mockCanGoBack.mockReturnValue(true);
  mockToggleFavorite.mockReturnValue({ limitReached: false });
});

afterEach(() => jest.restoreAllMocks());

test("adjusts the scroll area for the keyboard and lets action taps through", () => {
  render(<ProcedureDetail />);
  const scroll = screen.UNSAFE_getByType(ScrollView);
  expect(scroll.props.automaticallyAdjustKeyboardInsets).toBe(true);
  expect(scroll.props.keyboardShouldPersistTaps).toBe("handled");
  expect(scroll.props.keyboardDismissMode).toBe("interactive");
});

test("reveals the editor actions after the keyboard opens and removes its listener", () => {
  const scrollToEnd = jest.spyOn(ScrollView.prototype, "scrollToEnd");
  let keyboardDidShow: (() => void) | undefined;
  const remove = jest.fn();
  const addListener = Keyboard.addListener.bind(Keyboard);
  jest.spyOn(Keyboard, "addListener").mockImplementation((event, callback) => {
    const subscription = addListener(event, callback);
    if (event === "keyboardDidShow") {
      keyboardDidShow = callback as () => void;
      const unsubscribe = subscription.remove.bind(subscription);
      subscription.remove = () => {
        remove();
        unsubscribe();
      };
    }
    return subscription;
  });
  render(<ProcedureDetail />);
  fireEvent.press(screen.getByText("Додати нотатку"));
  fireEvent(
    screen.getByTestId("procedure.content"),
    "contentSizeChange",
    400,
    900,
  );
  expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
  scrollToEnd.mockClear();
  expect(keyboardDidShow).toBeDefined();
  act(() => keyboardDidShow?.());
  expect(scrollToEnd).toHaveBeenCalledWith({ animated: true });
  fireEvent.press(screen.getByTestId("procedure.note.cancel"));
  expect(remove).toHaveBeenCalledTimes(1);
});

test("keeps a long note bounded and saves the edited text", () => {
  render(<ProcedureDetail />);
  fireEvent.press(screen.getByText("Додати нотатку"));
  const input = screen.getByTestId("procedure.note.input");
  expect(input).toHaveStyle({ maxHeight: 160 });
  expect(input.props.scrollEnabled).toBe(true);
  fireEvent.changeText(input, "  First line\nSecond line  ");
  fireEvent.press(screen.getByTestId("procedure.note.save"));
  expect(mockSetNote).toHaveBeenCalledWith("D68.1", "First line\nSecond line");
  expect(screen.queryByTestId("procedure.note.input")).toBeNull();
});

test("cancel leaves an existing note unchanged", () => {
  mockNote = "Original note";
  render(<ProcedureDetail />);
  fireEvent.press(screen.getByText("Редагувати"));
  fireEvent.changeText(screen.getByTestId("procedure.note.input"), "Draft");
  fireEvent.press(screen.getByTestId("procedure.note.cancel"));
  expect(mockSetNote).not.toHaveBeenCalled();
  expect(mockDeleteNote).not.toHaveBeenCalled();
  expect(screen.getByText("Original note")).toBeTruthy();
});

test("an empty saved edit deletes the note", () => {
  mockNote = "Original note";
  render(<ProcedureDetail />);
  fireEvent.press(screen.getByText("Редагувати"));
  fireEvent.changeText(screen.getByTestId("procedure.note.input"), "  ");
  fireEvent.press(screen.getByTestId("procedure.note.save"));
  expect(mockDeleteNote).toHaveBeenCalledWith("D68.1");
});

test("bookmark uses one undecorated navigation header action", () => {
  const view = render(<ProcedureDetail />);
  const options = mockHeader.mock.calls.at(-1)![0];
  expect(options.headerRight).toBeUndefined();
  expect(options.unstable_headerRightItems({})[0]).toMatchObject({
    type: "button",
    identifier: "procedure.bookmark",
    icon: { type: "sfSymbol", name: "bookmark" },
  });
  const button = screen.getByTestId("procedure.bookmark");
  expect(button.props.style).toBeUndefined();
  expect(screen.getByRole("button", { name: "Додати закладку" })).toBeTruthy();
  fireEvent.press(button);
  expect(mockToggleFavorite).toHaveBeenCalledTimes(1);
  expect(mockHaptic).toHaveBeenLastCalledWith("medium");
  mockPinned = true;
  view.rerender(<ProcedureDetail />);
  expect(
    mockHeader.mock.calls.at(-1)![0].unstable_headerRightItems({})[0].icon.name,
  ).toBe("bookmark.fill");
  expect(
    screen.getByRole("button", { name: "Видалити закладку" }),
  ).toBeTruthy();
  fireEvent.press(screen.getByTestId("procedure.bookmark"));
  expect(mockHaptic).toHaveBeenLastCalledWith("light");
});

test("Close has a safe destination when opened directly without history", () => {
  mockCanGoBack.mockReturnValue(false);
  render(<ProcedureDetail />);
  fireEvent.press(screen.getByTestId("procedure.close"));
  expect(mockBack).not.toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith("/");
});

test("bookmark limit still opens the upgrade prompt", () => {
  mockToggleFavorite.mockReturnValue({ limitReached: true });
  render(<ProcedureDetail />);
  fireEvent.press(screen.getByTestId("procedure.bookmark"));
  expect(mockUpgrade).toHaveBeenCalledTimes(1);
});

test("notes remain unavailable without Pro", () => {
  mockIsPro = false;
  render(<ProcedureDetail />);
  expect(screen.queryByText("Додати нотатку")).toBeNull();
  expect(screen.getByText("Додайте нотатки до кодів")).toBeTruthy();
});

test("does not replace the native glass header with an opaque editing workaround", () => {
  render(<ProcedureDetail />);
  fireEvent.press(screen.getByTestId("procedure.note.add"));
  const options = mockHeader.mock.calls.at(-1)![0];
  expect(options.headerTransparent).not.toBe(false);
  expect(options.headerStyle?.backgroundColor).toBeUndefined();
  expect(options.unstable_headerLeftItems).toEqual(expect.any(Function));
  expect(options.unstable_headerRightItems).toEqual(expect.any(Function));
});

test("Close dismisses the keyboard before leaving an unsaved note", () => {
  const dismissKeyboard = jest.spyOn(Keyboard, "dismiss");
  mockNote = "Saved note";
  render(<ProcedureDetail />);
  fireEvent.press(screen.getByTestId("procedure.note.edit"));
  fireEvent.changeText(
    screen.getByTestId("procedure.note.input"),
    "Unsaved draft",
  );
  fireEvent.press(screen.getByTestId("procedure.close"));
  expect(dismissKeyboard).toHaveBeenCalledTimes(1);
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(dismissKeyboard.mock.invocationCallOrder[0]).toBeLessThan(
    mockBack.mock.invocationCallOrder[0],
  );
  expect(mockSetNote).not.toHaveBeenCalled();
  expect(mockDeleteNote).not.toHaveBeenCalled();
});

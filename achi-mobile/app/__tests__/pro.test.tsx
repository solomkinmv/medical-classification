import { render, screen, fireEvent } from "@testing-library/react-native";
import ProScreen from "../pro";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  Stack: {
    Screen: () => null,
  },
}));

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock("@/lib/useTheme", () => ({
  useTheme: () => ({
    colorScheme: "light",
    isDark: false,
    colors: {
      background: "#F0F2F5",
      card: "#FFFFFF",
      text: "#111827",
      textSecondary: "#6b7280",
      textMuted: "#9ca3af",
    },
  }),
}));

jest.mock("@/lib/useBackgroundColor", () => ({
  useBackgroundColor: () => "#F0F2F5",
}));

let mockProStatus = {
  isPro: false,
  isProLoading: false,
  purchasePro: jest.fn(),
  restorePurchases: jest.fn(),
  product: null as { id: string; displayPrice: string } | null,
};

jest.mock("@/lib/pro-provider", () => ({
  useProStatus: () => mockProStatus,
}));

jest.mock("@/components/CloseButton", () => ({
  CloseButton: () => null,
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockProStatus = {
    isPro: false,
    isProLoading: false,
    purchasePro: jest.fn(),
    restorePurchases: jest.fn(),
    product: null,
  };
});

describe("ProScreen", () => {
  it("renders loading state when isProLoading is true", () => {
    mockProStatus.isProLoading = true;
    render(<ProScreen />);

    expect(screen.queryByText("Медичні Коди Pro")).toBeNull();
    expect(screen.queryByText("Ви вже маєте Pro!")).toBeNull();
    expect(screen.queryByText("Купити Pro")).toBeNull();
  });

  it("renders already-pro state when isPro is true", () => {
    mockProStatus.isPro = true;
    render(<ProScreen />);

    expect(screen.getByText("Ви вже маєте Pro!")).toBeTruthy();
    expect(screen.getByText("Всі функції розблоковано")).toBeTruthy();
    expect(screen.queryByText("Купити Pro")).toBeNull();
  });

  it("navigates back when close button pressed in already-pro state", () => {
    mockProStatus.isPro = true;
    render(<ProScreen />);

    fireEvent.press(screen.getByLabelText("Закрити"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("renders default purchase state with features", () => {
    render(<ProScreen />);

    expect(screen.getByText("Медичні Коди Pro")).toBeTruthy();
    expect(screen.getByText("Необмежені закладки")).toBeTruthy();
    expect(screen.getByText("Папки")).toBeTruthy();
    expect(screen.getByText("Нотатки")).toBeTruthy();
  });

  it("shows fallback price when product is null", () => {
    render(<ProScreen />);

    expect(screen.getByText("Купити Pro — $2.99")).toBeTruthy();
  });

  it("shows product price when product is available", () => {
    mockProStatus.product = {
      id: "com.solomkinmv.achi-mobile.pro",
      displayPrice: "€3.49",
    };
    render(<ProScreen />);

    expect(screen.getByText("Купити Pro — €3.49")).toBeTruthy();
  });

  it("calls purchasePro when purchase button is pressed", () => {
    render(<ProScreen />);

    fireEvent.press(screen.getByLabelText("Купити Pro за $2.99"));
    expect(mockProStatus.purchasePro).toHaveBeenCalled();
  });

  it("calls restorePurchases when restore button is pressed", () => {
    render(<ProScreen />);

    fireEvent.press(screen.getByLabelText("Відновити покупки"));
    expect(mockProStatus.restorePurchases).toHaveBeenCalled();
  });

  it("shows restore purchases link", () => {
    render(<ProScreen />);

    expect(screen.getByText("Відновити покупки")).toBeTruthy();
  });
});

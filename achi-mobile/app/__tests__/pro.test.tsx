import { render, screen, fireEvent } from "@testing-library/react-native";
import ProScreen from "../pro";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockCanGoBack = jest.fn(() => true);
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: mockCanGoBack,
  }),
  Stack: {
    Screen: ({ options }: { options: NativeStackNavigationOptions }) =>
      jest
        .requireActual("@/test-utils/stack-header")
        .renderStackHeader(options),
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
  productStatus: "loading",
  purchaseStatus: "idle",
  retryStore: jest.fn().mockResolvedValue(undefined),
  purchasePro: jest.fn().mockResolvedValue(undefined),
  restorePurchases: jest.fn().mockResolvedValue(undefined),
  product: null as { id: string; displayPrice: string } | null,
};

jest.mock("@/lib/pro-provider", () => ({
  useProStatus: () => mockProStatus,
}));

jest.mock("@/components/CloseButton", () => ({
  CloseButton: (props: object) => {
    const { Pressable } = jest.requireActual("react-native");
    return <Pressable {...props} />;
  },
}));

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockCanGoBack.mockReturnValue(true);
  mockProStatus = {
    isPro: false,
    isProLoading: false,
    productStatus: "loading",
    purchaseStatus: "idle",
    retryStore: jest.fn().mockResolvedValue(undefined),
    purchasePro: jest.fn().mockResolvedValue(undefined),
    restorePurchases: jest.fn().mockResolvedValue(undefined),
    product: null,
  };
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("ProScreen", () => {
  it("renders loading state when isProLoading is true", () => {
    mockProStatus.isProLoading = true;
    render(<ProScreen />);

    expect(screen.queryByText("Медичні Коди Pro")).toBeNull();
    expect(screen.queryByText("Pro активовано!")).toBeNull();
    expect(screen.queryByText("Купити Pro")).toBeNull();
  });

  it("renders already-pro state when isPro is true", () => {
    mockProStatus.isPro = true;
    render(<ProScreen />);

    expect(screen.getByText("Pro активовано!")).toBeTruthy();
    expect(
      screen.getByTestId("pro.success").props.contentInsetAdjustmentBehavior,
    ).toBe("automatic");
    expect(screen.getByText("Вам доступні всі можливості Pro")).toBeTruthy();
    expect(screen.queryByText("Купити Pro")).toBeNull();
  });

  it("navigates back when close button pressed in already-pro state", () => {
    mockProStatus.isPro = true;
    render(<ProScreen />);

    fireEvent.press(screen.getByTestId("pro.done"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("renders default purchase state with features", () => {
    render(<ProScreen />);

    expect(screen.getByText("Медичні Коди Pro")).toBeTruthy();
    expect(screen.getByText("Необмежені закладки")).toBeTruthy();
    expect(screen.getByText("Папки")).toBeTruthy();
    expect(screen.getByText("Нотатки")).toBeTruthy();
  });

  it("shows loading text when product is null", () => {
    render(<ProScreen />);

    expect(screen.getByText("Завантаження...")).toBeTruthy();
  });

  it("shows product price when product is available", () => {
    mockProStatus.productStatus = "ready";
    mockProStatus.product = {
      id: "com.solomkinmv.achi_mobile.pro",
      displayPrice: "€3.49",
    };
    render(<ProScreen />);

    expect(screen.getByText("Купити Pro — €3.49")).toBeTruthy();
  });

  it("calls purchasePro when purchase button is pressed", () => {
    mockProStatus.productStatus = "ready";
    mockProStatus.product = {
      id: "com.solomkinmv.achi_mobile.pro",
      displayPrice: "$2.99",
    };
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

test.each(["pro.close", "pro.done"])(
  "%s opens home when launched without navigation history",
  (id) => {
    mockCanGoBack.mockReturnValue(false);
    mockProStatus.isPro = true;
    render(<ProScreen />);
    fireEvent.press(screen.getByTestId(id));
    expect(mockReplace).toHaveBeenCalledWith("/");
    expect(mockBack).not.toHaveBeenCalled();
  },
);

test("header close returns to the previous screen when history exists", () => {
  render(<ProScreen />);
  fireEvent.press(screen.getByTestId("pro.close"));
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(mockReplace).not.toHaveBeenCalled();
});

test("unavailable product disables buying and exposes retry", () => {
  mockProStatus.productStatus = "unavailable";
  render(<ProScreen />);
  expect(screen.getByTestId("pro.purchase")).toBeDisabled();
  fireEvent.press(screen.getByTestId("pro.purchase"));
  expect(mockProStatus.purchasePro).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId("pro.retry"));
  expect(mockProStatus.retryStore).toHaveBeenCalledTimes(1);
});
test("pending has feedback and prevents duplicate buying", () => {
  mockProStatus.purchaseStatus = "pending";
  render(<ProScreen />);
  expect(screen.getByTestId("pro.purchase")).toBeDisabled();
  expect(screen.getByTestId("pro.status")).toHaveTextContent(
    /Очікуємо підтвердження/,
  );
  expect(screen.getByTestId("pro.restore")).not.toBeDisabled();
});
test("restore and purchase cannot be started together", () => {
  mockProStatus.purchaseStatus = "purchasing";
  render(<ProScreen />);
  expect(screen.getByTestId("pro.restore")).toBeDisabled();
});
test("successful entitlement transition shows unlocked features until dismissed", () => {
  const view = render(<ProScreen />);
  mockProStatus.isPro = true;
  view.rerender(<ProScreen />);
  expect(mockBack).not.toHaveBeenCalled();
  expect(screen.getByText("Pro активовано!")).toBeTruthy();
  expect(screen.getByText("Необмежені закладки")).toBeTruthy();
  expect(screen.getByText("Папки")).toBeTruthy();
  expect(screen.getByText("Нотатки")).toBeTruthy();
  expect(screen.queryByTestId("pro.purchase")).toBeNull();
  fireEvent.press(screen.getByTestId("pro.done"));
  expect(mockBack).toHaveBeenCalledTimes(1);
});

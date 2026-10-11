import { fireEvent, render, screen } from "@testing-library/react-native";
import AboutScreen from "../(tabs)/about";

const mockPush = jest.fn();
let mockPro = { isPro: false, isProLoading: false };

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@/components/Card", () => ({
  Card: ({ children }: any) => children,
}));
jest.mock("@/lib/pro-provider", () => ({
  useProStatus: () => mockPro,
}));

describe("AboutScreen Pro card", () => {
  beforeEach(() => mockPush.mockClear());

  it("offers Pro to free users and opens the Pro screen", () => {
    mockPro = { isPro: false, isProLoading: false };
    render(<AboutScreen />);

    expect(screen.getByLabelText("Оновити до Pro")).toBeTruthy();
    fireEvent.press(screen.getByTestId("about.pro"));
    expect(mockPush).toHaveBeenCalledWith("/pro");
  });

  it("shows that Pro is active for owners", () => {
    mockPro = { isPro: true, isProLoading: false };
    render(<AboutScreen />);

    expect(screen.getByLabelText("Медичні Коди Pro активовано")).toBeTruthy();
    expect(
      screen.getByText("Активовано: необмежені закладки, папки та нотатки"),
    ).toBeTruthy();
  });

  it("hides the card until the Pro status is known", () => {
    mockPro = { isPro: false, isProLoading: true };
    render(<AboutScreen />);

    expect(screen.queryByTestId("about.pro")).toBeNull();
  });
});

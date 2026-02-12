import { Alert } from "react-native";
import { router } from "expo-router";
import { showUpgradePrompt } from "../UpgradePrompt";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.spyOn(Alert, "alert");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("showUpgradePrompt", () => {
  it("shows alert with correct title and message", () => {
    showUpgradePrompt();

    expect(Alert.alert).toHaveBeenCalledWith(
      "Обмеження безкоштовної версії",
      expect.stringContaining("до 3 закладок"),
      expect.any(Array),
    );
  });

  it("navigates to /pro when upgrade button is pressed", () => {
    showUpgradePrompt();

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const upgradeButton = buttons.find(
      (b: { text: string }) => b.text === "Оновити до Pro",
    );
    upgradeButton.onPress();

    expect(router.push).toHaveBeenCalledWith("/pro");
  });

  it("does not navigate when cancel button is pressed", () => {
    showUpgradePrompt();

    const buttons = (Alert.alert as jest.Mock).mock.calls[0][2];
    const cancelButton = buttons.find(
      (b: { text: string }) => b.text === "Скасувати",
    );

    expect(cancelButton.onPress).toBeUndefined();
    expect(router.push).not.toHaveBeenCalled();
  });
});

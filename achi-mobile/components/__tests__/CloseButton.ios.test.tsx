import { fireEvent, render } from "@testing-library/react-native";
import { Button } from "@expo/ui/swift-ui";
import { HeaderButton } from "@react-navigation/elements";
import { CloseButton } from "../CloseButton.ios";

jest.mock("@expo/ui/swift-ui", () => {
  const { View, Pressable } = jest.requireActual("react-native");
  return {
    Host: View,
    Image: View,
    Button: jest.fn(({ children, onPress }) => (
      <Pressable onPress={onPress}>{children}</Pressable>
    )),
  };
});

jest.mock("@react-navigation/elements", () => {
  const { Pressable } = jest.requireActual("react-native");
  return {
    HeaderButton: jest.fn((props) => (
      <Pressable {...props} accessibilityRole="button" />
    )),
  };
});

test("leaves glass styling to the native header and exposes one close action", () => {
  const onPress = jest.fn();
  const screen = render(
    <CloseButton testID="pro.close" onPress={onPress} color="#111111" />,
  );

  expect(Button).not.toHaveBeenCalled();
  expect(HeaderButton).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Закрити" })).toBeTruthy();
  fireEvent.press(screen.getByTestId("pro.close"));
  expect(onPress).toHaveBeenCalledTimes(1);
});

import { fireEvent, render, screen } from "@testing-library/react-native";
import { Platform } from "react-native";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { headerActionOptions, nativeHeaderOptions } from "../navigation-header";
import { renderStackHeader } from "@/test-utils/stack-header";

jest.mock("expo-glass-effect", () => ({
  isLiquidGlassAvailable: jest.fn(() => true),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));
jest.mock("@react-navigation/elements", () => ({
  HeaderButton: (props: object) => {
    const { Pressable } = jest.requireActual("react-native");
    return <Pressable {...props} />;
  },
}));

afterEach(() => {
  jest.restoreAllMocks();
});
beforeEach(() => {
  jest.mocked(isLiquidGlassAvailable).mockReturnValue(true);
});

test("Liquid Glass uses transparent bars and a native soft top edge, without legacy blur", () => {
  jest.replaceProperty(Platform, "OS", "ios");
  expect(nativeHeaderOptions("#ffffff")).toMatchObject({
    headerTransparent: true,
    headerStyle: { backgroundColor: "transparent" },
    headerLargeStyle: { backgroundColor: "transparent" },
    headerBlurEffect: undefined,
    scrollEdgeEffects: { top: "soft" },
  });
});

test("older iOS keeps the native material fallback without overlapping edge effects", () => {
  jest.replaceProperty(Platform, "OS", "ios");
  jest.mocked(isLiquidGlassAvailable).mockReturnValue(false);
  expect(nativeHeaderOptions("#111111")).toMatchObject({
    headerTransparent: true,
    headerBlurEffect: "systemChromeMaterial",
    scrollEdgeEffects: undefined,
  });
});

test.each(["android", "web"] as const)(
  "%s retains an opaque themed header",
  (os) => {
    jest.replaceProperty(Platform, "OS", os);
    expect(nativeHeaderOptions("#111111")).toMatchObject({
      headerTransparent: false,
      headerStyle: { backgroundColor: "#111111" },
      headerBlurEffect: undefined,
      scrollEdgeEffects: undefined,
    });
  },
);

test.each(["left", "right"] as const)(
  "iOS %s action uses a native symbol, stable ID and independent spoken label",
  (side) => {
    jest.replaceProperty(Platform, "OS", "ios");
    const onPress = jest.fn();
    const options = headerActionOptions(side, {
      id: "example.close",
      label: "Закрити",
      symbol: "xmark",
      fallbackIcon: "close",
      color: "#111111",
      onPress,
    });
    expect(options.headerLeft).toBeUndefined();
    expect(options.headerRight).toBeUndefined();
    const items = (
      side === "left"
        ? options.unstable_headerLeftItems
        : options.unstable_headerRightItems
    )!({ canGoBack: true });
    expect(items).toEqual([
      expect.objectContaining({
        type: "button",
        identifier: "example.close",
        accessibilityLabel: "Закрити",
        icon: { type: "sfSymbol", name: "xmark" },
      }),
    ]);
    render(renderStackHeader(options));
    fireEvent.press(screen.getByTestId("example.close"));
    expect(onPress).toHaveBeenCalledTimes(1);
  },
);

test("Android retains one accessible press target and callback", () => {
  jest.replaceProperty(Platform, "OS", "android");
  const onPress = jest.fn();
  const options = headerActionOptions("right", {
    id: "example.add",
    label: "Додати",
    symbol: "plus",
    fallbackIcon: "add",
    color: "#111111",
    onPress,
  });
  expect(options.unstable_headerRightItems).toBeUndefined();
  render(renderStackHeader(options));
  fireEvent.press(screen.getByTestId("example.add"));
  expect(onPress).toHaveBeenCalledTimes(1);
});

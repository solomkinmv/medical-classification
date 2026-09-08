import { renderHook, act, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, AppState } from "react-native";
import type { ReactNode } from "react";
import * as iap from "expo-iap";
import { ProProvider, useProStatus } from "../pro-provider";
import { PRO_PRODUCT_ID } from "../constants";

test("uses the existing App Store Connect product identifier", () => {
  expect(PRO_PRODUCT_ID).toBe("com.solomkinmv.achi_mobile.pro");
});

let mockUpdate: (purchase: iap.Purchase) => Promise<void> | void;
let mockError: (error: { code: string }) => void;
jest.mock("expo-iap", () => ({
  currentEntitlementIOS: jest.fn(),
  getPendingTransactionsIOS: jest.fn(),
  initConnection: jest.fn(),
  endConnection: jest.fn().mockResolvedValue(undefined),
  fetchProducts: jest.fn(),
  getAvailablePurchases: jest.fn(),
  requestPurchase: jest.fn(),
  finishTransaction: jest.fn(),
  isTransactionVerifiedIOS: jest.fn(),
  syncIOS: jest.fn(),
  purchaseUpdatedListener: jest.fn((cb) => {
    mockUpdate = cb;
    return { remove: jest.fn() };
  }),
  purchaseErrorListener: jest.fn((cb) => {
    mockError = cb;
    return { remove: jest.fn() };
  }),
  ErrorCode: {
    UserCancelled: "user-cancelled",
    DeferredPayment: "deferred-payment",
    Pending: "pending",
  },
}));
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
const item = { id: PRO_PRODUCT_ID, type: "in-app", displayPrice: "$2.99" };
const purchase = {
  id: "transaction-1",
  productId: PRO_PRODUCT_ID,
  purchaseState: "purchased",
} as iap.Purchase;
const mock = <T,>(value: T) => value as jest.Mock;
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};
function wrapper({ children }: { children: ReactNode }) {
  return <ProProvider>{children}</ProProvider>;
}
async function setup() {
  const hook = renderHook(useProStatus, { wrapper });
  await waitFor(() => expect(hook.result.current.productStatus).toBe("ready"));
  await act(async () => {});
  return hook;
}
async function emit(p = purchase) {
  await act(async () => {
    await mockUpdate(p);
  });
}
beforeEach(() => {
  jest.clearAllMocks();
  mock(iap.currentEntitlementIOS).mockResolvedValue(purchase);
  mock(iap.getPendingTransactionsIOS).mockResolvedValue([]);
  mock(iap.initConnection).mockResolvedValue(true);
  mock(iap.fetchProducts).mockResolvedValue([item]);
  mock(iap.getAvailablePurchases).mockResolvedValue([]);
  mock(iap.requestPurchase).mockResolvedValue(undefined);
  mock(iap.finishTransaction).mockResolvedValue(undefined);
  mock(iap.isTransactionVerifiedIOS).mockResolvedValue(true);
  mock(iap.syncIOS).mockResolvedValue(true);
  mock(AsyncStorage.getItem).mockResolvedValue(null);
  mock(AsyncStorage.setItem).mockResolvedValue(undefined);
  mock(AsyncStorage.removeItem).mockResolvedValue(undefined);
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test("fetches real price and starts without Pro", async () => {
  const { result } = await setup();
  expect(result.current.product).toEqual(item);
  expect(result.current.isPro).toBe(false);
  expect(iap.fetchProducts).toHaveBeenCalledWith({
    skus: [PRO_PRODUCT_ID],
    type: "in-app",
  });
});
test("empty catalog is unavailable and retry recovers", async () => {
  mock(iap.fetchProducts).mockResolvedValueOnce([]);
  const { result } = renderHook(useProStatus, { wrapper });
  await waitFor(() => expect(result.current.productStatus).toBe("unavailable"));
  await act(async () => {
    await result.current.purchasePro();
  });
  expect(iap.requestPurchase).not.toHaveBeenCalled();
  await act(async () => {
    await result.current.retryStore();
  });
  expect(result.current.productStatus).toBe("ready");
});
test("connection failure can be retried", async () => {
  mock(iap.initConnection).mockResolvedValueOnce(false);
  const { result } = renderHook(useProStatus, { wrapper });
  await waitFor(() => expect(result.current.productStatus).toBe("unavailable"));
  await act(async () => {
    await result.current.retryStore();
  });
  expect(result.current.productStatus).toBe("ready");
});
test("store error preserves cached offline entitlement", async () => {
  mock(AsyncStorage.getItem).mockResolvedValue("true");
  mock(iap.getAvailablePurchases).mockRejectedValue(new Error("offline"));
  const { result } = await setup();
  expect(result.current.isPro).toBe(true);
});
test("completed matching verified purchase unlocks and finishes once", async () => {
  const { result } = await setup();
  await emit();
  await emit();
  expect(result.current.isPro).toBe(true);
  expect(AsyncStorage.setItem).toHaveBeenCalledWith(
    "iap_pro_purchased",
    "true",
  );
  expect(iap.finishTransaction).toHaveBeenCalledTimes(1);
});
test("unrelated and pending events never grant entitlement", async () => {
  const { result } = await setup();
  await emit({ ...purchase, productId: "unrelated" });
  await emit({ ...purchase, purchaseState: "pending" });
  expect(result.current.isPro).toBe(false);
  expect(result.current.purchaseStatus).toBe("pending");
  expect(iap.finishTransaction).not.toHaveBeenCalled();
  await emit();
  expect(result.current.isPro).toBe(true);
});
test("unverified transactions do not unlock or finish", async () => {
  const { result } = await setup();
  mock(iap.currentEntitlementIOS).mockRejectedValue(new Error("unverified"));
  await emit();
  expect(result.current.isPro).toBe(false);
  expect(iap.finishTransaction).not.toHaveBeenCalled();
});
test("finishing failure retains access and replay retries finish", async () => {
  const { result } = await setup();
  mock(iap.finishTransaction).mockRejectedValueOnce(new Error("offline"));
  await emit();
  expect(result.current.isPro).toBe(true);
  await emit();
  expect(iap.finishTransaction).toHaveBeenCalledTimes(2);
});
test("stale empty query cannot overwrite a newer purchase", async () => {
  const { result } = await setup();
  const query = deferred<iap.Purchase[]>();
  mock(iap.getAvailablePurchases).mockReturnValueOnce(query.promise);
  let refresh!: Promise<void>;
  act(() => {
    refresh = result.current.retryStore();
  });
  await act(async () => {});
  await emit();
  await act(async () => {
    query.resolve([]);
    await refresh;
  });
  expect(result.current.isPro).toBe(true);
});
test("late cache hydration cannot overwrite a purchase", async () => {
  const cache = deferred<string | null>();
  mock(AsyncStorage.getItem).mockReturnValue(cache.promise);
  mock(iap.getAvailablePurchases).mockResolvedValue([purchase]);
  const { result } = renderHook(useProStatus, { wrapper });
  await emit();
  await act(async () => {
    cache.resolve(null);
  });
  expect(result.current.isPro).toBe(true);
});
test("restore synchronizes and returns authoritative owned/not-owned", async () => {
  const { result } = await setup();
  mock(iap.getAvailablePurchases).mockResolvedValueOnce([purchase]);
  await act(async () => {
    expect(await result.current.restorePurchases()).toBe("owned");
  });
  expect(iap.syncIOS).toHaveBeenCalled();
  expect(result.current.isPro).toBe(true);
  await act(async () => {
    expect(await result.current.restorePurchases()).toBe("not-owned");
  });
  expect(result.current.isPro).toBe(false);
});
test("restore sync failure is an error, not no-purchases", async () => {
  const { result } = await setup();
  mock(iap.syncIOS).mockRejectedValue(new Error("offline"));
  await act(async () => {
    expect(await result.current.restorePurchases()).toBe("error");
  });
  expect(result.current.purchaseStatus).toBe("idle");
});
test("duplicate taps submit one purchase; cancellation clears state silently", async () => {
  const { result } = await setup();
  await act(async () => {
    await result.current.purchasePro();
    await result.current.purchasePro();
  });
  expect(iap.requestPurchase).toHaveBeenCalledTimes(1);
  act(() => mockError({ code: "user-cancelled" }));
  expect(result.current.purchaseStatus).toBe("idle");
  expect(Alert.alert).not.toHaveBeenCalled();
});
test("direct rejection resets controls and shows one error", async () => {
  const { result } = await setup();
  mock(iap.requestPurchase).mockRejectedValue({ code: "network-error" });
  await act(async () => {
    await result.current.purchasePro();
  });
  expect(result.current.purchaseStatus).toBe("idle");
  expect(Alert.alert).toHaveBeenCalledTimes(1);
});
test("stalled purchase changes to pending and accepts late completion", async () => {
  const { result } = await setup();
  jest.useFakeTimers();
  await act(async () => {
    await result.current.purchasePro();
  });
  act(() => jest.advanceTimersByTime(15000));
  expect(result.current.purchaseStatus).toBe("pending");
  await emit();
  expect(result.current.isPro).toBe(true);
});
test("stalled product fetch exposes retry instead of endless loading", async () => {
  jest.useFakeTimers();
  mock(iap.fetchProducts).mockReturnValue(new Promise(() => {}));
  const { result } = renderHook(useProStatus, { wrapper });
  await act(async () => {});
  await act(async () => {
    jest.advanceTimersByTime(15000);
  });
  expect(result.current.productStatus).toBe("unavailable");
});
test("foreground refresh reconciles revocation without deleting user content", async () => {
  let foreground!: (state: import("react-native").AppStateStatus) => void;
  jest.spyOn(AppState, "addEventListener").mockImplementation((_, cb) => {
    foreground = cb;
    return { remove: jest.fn() };
  });
  const { result } = await setup();
  await emit();
  await act(async () => {
    foreground("active");
  });
  expect(result.current.isPro).toBe(false);
  expect(AsyncStorage.removeItem).toHaveBeenLastCalledWith("iap_pro_purchased");
});

test("unfinished native transactions are delivered and finished on startup", async () => {
  mock(iap.getPendingTransactionsIOS).mockResolvedValue([purchase]);
  const { result } = await setup();
  expect(result.current.isPro).toBe(true);
  expect(iap.finishTransaction).toHaveBeenCalledTimes(1);
});
test("historical transaction without current entitlement does not unlock", async () => {
  const { result } = await setup();
  mock(iap.currentEntitlementIOS).mockResolvedValue(null);
  await emit();
  expect(result.current.isPro).toBe(false);
});

test("late verification after unmount does not grant or finish", async () => {
  const { unmount } = await setup();
  const verification = deferred<iap.PurchaseIOS | null>();
  mock(iap.currentEntitlementIOS).mockReturnValueOnce(verification.promise);
  act(() => {
    void mockUpdate(purchase);
  });
  unmount();
  await act(async () => {
    verification.resolve(purchase as iap.PurchaseIOS);
  });
  expect(iap.finishTransaction).not.toHaveBeenCalled();
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

test("a local timeout recovers after an empty authoritative restore", async () => {
  const { result } = await setup();
  jest.useFakeTimers();
  await act(async () => {
    await result.current.purchasePro();
  });
  act(() => jest.advanceTimersByTime(15000));
  await act(async () => {
    expect(await result.current.restorePurchases()).toBe("not-owned");
  });
  expect(result.current.purchaseStatus).toBe("idle");
  await act(async () => {
    await result.current.purchasePro();
  });
  expect(iap.requestPurchase).toHaveBeenCalledTimes(2);
});

test("confirmed deferred purchases remain pending after an empty restore", async () => {
  const { result } = await setup();
  await emit({ ...purchase, purchaseState: "pending" });
  await act(async () => {
    await result.current.restorePurchases();
  });
  expect(result.current.purchaseStatus).toBe("pending");
});

test("failed pending verification cannot release a timed-out purchase", async () => {
  const { result } = await setup();
  jest.useFakeTimers();
  await act(async () => {
    await result.current.purchasePro();
  });
  act(() => jest.advanceTimersByTime(15000));
  mock(iap.getPendingTransactionsIOS).mockRejectedValue(new Error("offline"));
  await act(async () => {
    expect(await result.current.restorePurchases()).toBe("error");
  });
  expect(result.current.purchaseStatus).toBe("pending");
});

test("a matching unfinished transaction prevents timeout recovery", async () => {
  const { result } = await setup();
  jest.useFakeTimers();
  await act(async () => {
    await result.current.purchasePro();
  });
  act(() => jest.advanceTimersByTime(15000));
  mock(iap.getPendingTransactionsIOS).mockResolvedValue([purchase]);
  await act(async () => {
    await result.current.restorePurchases();
  });
  expect(result.current.purchaseStatus).toBe("pending");
});

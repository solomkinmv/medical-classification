import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { Alert, AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  initConnection,
  endConnection,
  fetchProducts,
  getAvailablePurchases,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  isTransactionVerifiedIOS,
  currentEntitlementIOS,
  getPendingTransactionsIOS,
  syncIOS,
  ErrorCode,
  type Product,
  type Purchase,
} from "expo-iap";
import { PRO_PRODUCT_ID, PRO_STORAGE_KEY } from "./constants";

export type ProductStatus = "loading" | "ready" | "unavailable";
export type PurchaseStatus = "idle" | "purchasing" | "pending" | "restoring";
interface ProContextType {
  isPro: boolean;
  isProLoading: boolean;
  product: Product | null;
  productStatus: ProductStatus;
  purchaseStatus: PurchaseStatus;
  retryStore: () => Promise<void>;
  purchasePro: () => Promise<void>;
  restorePurchases: () => Promise<"owned" | "not-owned" | "error">;
}
const ProContext = createContext<ProContextType | null>(null);
const STORE_TIMEOUT = 15000;

// Time out reads, never a transaction: the store can complete a purchase later.
async function storeRead<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("store-timeout")),
          STORE_TIMEOUT,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
function logStoreError(operation: string, error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "unknown";
  console.warn(`[IAP] ${operation}: ${PRO_PRODUCT_ID} (${code})`);
}

export function ProProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [isProLoading, setIsProLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [productStatus, setProductStatus] = useState<ProductStatus>("loading");
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>("idle");
  const mounted = useRef(false);
  const connected = useRef(false);
  const activity = useRef<PurchaseStatus>("idle");
  const owned = useRef(false);
  const revision = useRef(0);
  const queryId = useRef(0);
  const loadingStore = useRef(false);
  const persistence = useRef<Promise<unknown>>(Promise.resolve());
  const processing = useRef(new Set<string>());
  const finished = useRef(new Set<string>());
  const purchaseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const setActivity = useCallback((status: PurchaseStatus) => {
    activity.current = status;
    if (mounted.current) setPurchaseStatus(status);
    if (status !== "purchasing") clearTimeout(purchaseTimer.current);
  }, []);
  const applyEntitlement = useCallback(async (value: boolean) => {
    owned.current = value;
    if (mounted.current) setIsPro(value);
    // Preserve write order across cache hydration, revocation, and purchase events.
    const write = persistence.current.then(() =>
      value
        ? AsyncStorage.setItem(PRO_STORAGE_KEY, "true")
        : AsyncStorage.removeItem(PRO_STORAGE_KEY),
    );
    persistence.current = write.catch(() => undefined);
    await write;
  }, []);

  const reconcile = useCallback(async () => {
    const requestId = ++queryId.current;
    const startRevision = revision.current;
    const purchases = await storeRead(
      getAvailablePurchases({
        onlyIncludeActiveItemsIOS: true,
        alsoPublishToEventListenerIOS: false,
      }),
    );
    let entitled = purchases.some(
      (p) => p.productId === PRO_PRODUCT_ID && p.purchaseState === "purchased",
    );
    if (entitled && Platform.OS === "ios") {
      entitled = await storeRead(isTransactionVerifiedIOS(PRO_PRODUCT_ID));
    }
    if (
      mounted.current &&
      requestId === queryId.current &&
      processing.current.size === 0 &&
      startRevision === revision.current
    ) {
      revision.current++;
      await applyEntitlement(entitled);
      if (entitled && activity.current === "pending") setActivity("idle");
    } else if (!owned.current) {
      throw new Error("entitlement-query-superseded");
    }
    return owned.current;
  }, [applyEntitlement, setActivity]);

  const deliver = useCallback(
    async (purchase: Purchase) => {
      if (!mounted.current || purchase.productId !== PRO_PRODUCT_ID) return;
      if (purchase.purchaseState === "pending") {
        setActivity("pending");
        return;
      }
      if (purchase.purchaseState !== "purchased") return;
      const key = purchase.id;
      if (processing.current.has(key) || finished.current.has(key)) return;
      processing.current.add(key);
      revision.current++;
      try {
        if (
          Platform.OS === "ios" &&
          !(await storeRead(currentEntitlementIOS(PRO_PRODUCT_ID)))
        ) {
          throw new Error("unverified-transaction");
        }
        if (!mounted.current) return;
        // Invalidate reads that began while signature verification was in flight.
        revision.current++;
        await applyEntitlement(true);
        await storeRead(finishTransaction({ purchase, isConsumable: false }));
        finished.current.add(key);
      } catch (error) {
        logStoreError("deliver", error);
        // Leave unfinished transactions available for StoreKit replay on reconnect.
        if (!owned.current && mounted.current) {
          Alert.alert(
            "Помилка покупки",
            "Не вдалося підтвердити покупку. Спробуйте відновити покупки.",
          );
        }
      } finally {
        processing.current.delete(key);
        setActivity("idle");
      }
    },
    [applyEntitlement, setActivity],
  );

  const handlePurchaseError = useCallback(
    (error: { code?: string; productId?: string | null }) => {
      if (!mounted.current) return;
      if (error.productId && error.productId !== PRO_PRODUCT_ID) return;
      // Delivery owns its verification/finish errors; native APIs also emit them.
      if (processing.current.size > 0) return;
      if (
        error.code === ErrorCode.DeferredPayment ||
        error.code === ErrorCode.Pending
      ) {
        setActivity("pending");
        return;
      }
      const wasPurchasing =
        activity.current === "purchasing" || activity.current === "pending";
      if (!wasPurchasing) return;
      setActivity("idle");
      if (wasPurchasing && error.code !== ErrorCode.UserCancelled) {
        logStoreError("purchase", error);
        Alert.alert(
          "Помилка покупки",
          "Не вдалося завершити покупку. Спробуйте ще раз або відновіть покупки.",
        );
      }
    },
    [setActivity],
  );

  const retryStore = useCallback(async () => {
    if (loadingStore.current || !mounted.current) return;
    loadingStore.current = true;
    setProductStatus("loading");
    try {
      if (!connected.current)
        connected.current = await storeRead(initConnection());
      if (!connected.current) throw new Error("store-disconnected");
      const products = await storeRead(
        fetchProducts({ skus: [PRO_PRODUCT_ID], type: "in-app" }),
      );
      const match = products?.find(
        (p) => p.id === PRO_PRODUCT_ID && p.type === "in-app",
      ) as Product | undefined;
      if (mounted.current) {
        setProduct(match ?? null);
        setProductStatus(match ? "ready" : "unavailable");
      }
      await reconcile();
      if (Platform.OS === "ios") {
        const unfinished = await storeRead(getPendingTransactionsIOS());
        for (const purchase of unfinished) await deliver(purchase);
      }
    } catch (error) {
      logStoreError("refresh", error);
      // A failed entitlement read does not invalidate a price already fetched.
      if (mounted.current)
        setProductStatus((status) =>
          status === "ready" ? status : "unavailable",
        );
    } finally {
      loadingStore.current = false;
    }
  }, [reconcile, deliver]);

  useEffect(() => {
    mounted.current = true;
    const updates = purchaseUpdatedListener((purchase) => {
      void deliver(purchase);
    });
    const errors = purchaseErrorListener(handlePurchaseError);
    const cacheRevision = revision.current;
    void storeRead(AsyncStorage.getItem(PRO_STORAGE_KEY))
      .then((value) => {
        if (mounted.current && revision.current === cacheRevision) {
          owned.current = value === "true";
          setIsPro(owned.current);
        }
      })
      .catch((error) => logStoreError("cache", error))
      .finally(() => {
        if (mounted.current) {
          setIsProLoading(false);
          void retryStore();
        }
      });
    const foreground = AppState.addEventListener("change", (state) => {
      if (state === "active") void retryStore();
    });
    return () => {
      mounted.current = false;
      updates.remove();
      errors.remove();
      foreground.remove();
      clearTimeout(purchaseTimer.current);
      connected.current = false;
      void endConnection().catch((error) => logStoreError("disconnect", error));
    };
  }, [deliver, handlePurchaseError, retryStore]);

  const purchasePro = useCallback(async () => {
    if (activity.current !== "idle" || owned.current) return;
    if (!connected.current || !product || productStatus !== "ready") return;
    setActivity("purchasing");
    purchaseTimer.current = setTimeout(() => {
      if (activity.current === "purchasing") setActivity("pending");
    }, STORE_TIMEOUT);
    try {
      await requestPurchase({
        request: {
          apple: { sku: PRO_PRODUCT_ID },
          google: { skus: [PRO_PRODUCT_ID] },
        },
        type: "in-app",
      });
      // Completion is delivered by the listener, not by resolving requestPurchase.
    } catch (error) {
      handlePurchaseError(error as { code?: string });
    }
  }, [product, productStatus, setActivity, handlePurchaseError]);

  const restorePurchases = useCallback(async (): Promise<
    "owned" | "not-owned" | "error"
  > => {
    if (activity.current === "purchasing" || activity.current === "restoring")
      return "error";
    const previous = activity.current;
    setActivity("restoring");
    try {
      if (!connected.current) throw new Error("store-disconnected");
      if (Platform.OS === "ios") await storeRead(syncIOS());
      return (await reconcile()) ? "owned" : "not-owned";
    } catch (error) {
      logStoreError("restore", error);
      if (mounted.current)
        Alert.alert(
          "Помилка",
          "Не вдалося відновити покупки. Перевірте з’єднання та спробуйте ще раз.",
        );
      return "error";
    } finally {
      setActivity(
        previous === "pending" && !owned.current ? "pending" : "idle",
      );
    }
  }, [reconcile, setActivity]);

  return (
    <ProContext.Provider
      value={{
        isPro,
        isProLoading,
        product,
        productStatus,
        purchaseStatus,
        retryStore,
        purchasePro,
        restorePurchases,
      }}
    >
      {children}
    </ProContext.Provider>
  );
}
export function useProStatus(): ProContextType {
  const context = useContext(ProContext);
  if (!context) throw new Error("useProStatus must be used within ProProvider");
  return context;
}

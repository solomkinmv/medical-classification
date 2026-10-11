import { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { headerActionOptions } from "@/components/navigation-header";
import { Ionicons } from "@expo/vector-icons";
import { CodeCard } from "@/components/CodeCard";
import { showUpgradePrompt } from "@/components/UpgradePrompt";
import { useFolders } from "@/lib/folders-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { useProStatus } from "@/lib/pro-provider";
import { useFolderActions, useFolderCodes } from "@/lib/useFolderActions";
import { useTheme } from "@/lib/useTheme";
import { CLASSIFIERS, findCode, getCodeContext } from "@/lib/code-index";
import {
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  getClassifierColors,
} from "@/lib/constants";

export default function FolderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getFolders,
    addToFolder,
    removeFromFolder,
    isReady: foldersReady,
  } = useFolders();
  const { favorites, isReady: favoritesReady } = useFavorites();
  const { isPro } = useProStatus();
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const { colors: t } = useTheme();
  const { showMenu, copyList } = useFolderActions();
  const getFolderCodes = useFolderCodes();
  const backgroundColor = t.background;

  const folder = useMemo(
    () => CLASSIFIERS.flatMap(getFolders).find((f) => f.id === id) ?? null,
    [getFolders, id],
  );
  const codes = useMemo(
    () => (folder ? getFolderCodes(folder) : []),
    [folder, getFolderCodes],
  );

  const headerOptions = {
    headerBackButtonDisplayMode: "minimal" as const,
    contentStyle: { backgroundColor },
  };

  if (!foldersReady || !favoritesReady) {
    return (
      <>
        <Stack.Screen options={{ ...headerOptions, title: "Папка" }} />
        <View
          testID="folder.loading"
          style={{ flex: 1, backgroundColor, justifyContent: "center" }}
        >
          <ActivityIndicator color={colors.violet[500]} />
        </View>
      </>
    );
  }

  if (!folder) {
    return (
      <>
        <Stack.Screen
          options={{ ...headerOptions, title: "Папку не знайдено" }}
        />
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor }}
        >
          <Text style={{ color: t.textSecondary }}>Папку не знайдено</Text>
        </View>
      </>
    );
  }

  const classifierColors = getClassifierColors(folder.classifier);

  const startSelecting = () => {
    if (!isPro) return showUpgradePrompt();
    setSelecting(true);
  };

  const toggleMembership = (code: string) => {
    if (!isPro) return showUpgradePrompt();
    if (folder.codeRefs.includes(code)) removeFromFolder(folder.id, code);
    else addToFolder(folder.id, code);
  };

  return (
    <>
      <Stack.Screen
        options={{
          ...headerOptions,
          title: folder.name,
          ...headerActionOptions(
            "right",
            selecting
              ? {
                  id: "folder.done",
                  label: "Готово",
                  symbol: "checkmark",
                  fallbackIcon: "checkmark",
                  color: t.text,
                  onPress: () => setSelecting(false),
                }
              : [
                  {
                    id: "folder.add",
                    label: "Додати коди",
                    symbol: "plus",
                    fallbackIcon: "add",
                    color: t.text,
                    onPress: startSelecting,
                  },
                  {
                    id: "folder.menu",
                    label: "Дії з папкою",
                    symbol: "ellipsis",
                    fallbackIcon: "ellipsis-horizontal",
                    color: t.text,
                    onPress: () => showMenu(folder, () => router.back()),
                  },
                ],
          ),
        }}
      />
      <FlatList
        testID="folder.list"
        data={selecting ? favorites : codes}
        keyExtractor={(item) => item.code}
        style={{ flex: 1, backgroundColor }}
        contentContainerStyle={{
          paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
          paddingBottom: CONTENT_PADDING_BOTTOM,
          paddingTop: 16,
          flexGrow: 1,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          selecting ? (
            favorites.length > 0 ? (
              <Text
                style={{
                  color: t.textSecondary,
                  fontSize: 15,
                  marginBottom: 20,
                }}
              >
                Оберіть закладки для цієї папки. Будь-який інший код можна
                додати з його картки, розділ «Папки».
              </Text>
            ) : null
          ) : codes.length > 0 ? (
            <Pressable
              testID="folder.copy"
              accessibilityRole="button"
              accessibilityHint="Копіює коди з назвами, по одному в рядку"
              onPress={() => copyList(folder)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                minHeight: 48,
                borderRadius: 12,
                backgroundColor: classifierColors.accent500,
                marginBottom: 16,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Ionicons name="copy-outline" size={18} color="#ffffff" />
              <Text
                style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}
              >
                Копіювати список для звіту
              </Text>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <View
            testID="folder.empty"
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(139, 92, 246, 0.15)",
              }}
            >
              <Ionicons
                name={selecting ? "bookmark-outline" : "folder-open-outline"}
                size={36}
                color={colors.violet[500]}
              />
            </View>
            <Text
              style={{
                color: t.text,
                fontSize: 22,
                fontWeight: "600",
                textAlign: "center",
                marginTop: 20,
              }}
            >
              {selecting ? "Ще немає закладок" : "Папка порожня"}
            </Text>
            <Text
              style={{
                color: t.textSecondary,
                fontSize: 16,
                textAlign: "center",
                marginTop: 10,
              }}
            >
              {selecting
                ? "Знайдіть потрібний код і додайте його до папки в розділі «Папки» на картці коду."
                : "Додайте коди із закладок або відкрийте будь-який код і оберіть цю папку в розділі «Папки»."}
            </Text>
            <Pressable
              testID={selecting ? "folder.explore" : "folder.add-empty"}
              accessibilityRole="button"
              onPress={
                selecting ? () => router.push("/(tabs)/search") : startSelecting
              }
              style={{
                marginTop: 24,
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                backgroundColor: colors.violet[500],
              }}
            >
              <Text
                style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}
              >
                {selecting ? "Знайти коди" : "Додати із закладок"}
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => {
          if (selecting) {
            const checked = folder.codeRefs.includes(item.code);
            return (
              <Pressable
                testID={`folder.code.${item.code}`}
                accessibilityRole="checkbox"
                accessibilityLabel={`${item.code}: ${item.name_ua}`}
                accessibilityState={{ checked }}
                onPress={() => toggleMembership(item.code)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  backgroundColor: t.card,
                  padding: 16,
                  borderRadius: 14,
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name={checked ? "checkmark-circle" : "ellipse-outline"}
                  size={26}
                  color={colors.violet[500]}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: classifierColors.accent600,
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {item.code}
                  </Text>
                  <Text style={{ color: t.text, fontSize: 16, marginTop: 4 }}>
                    {item.name_ua}
                  </Text>
                </View>
              </Pressable>
            );
          }
          const entry = findCode(item.code);
          return (
            <View testID={`folder.item.${item.code}`}>
              <CodeCard
                code={item}
                classifier={folder.classifier}
                context={
                  entry ? getCodeContext(entry.leaf, entry.path) : undefined
                }
                onRemove={() => removeFromFolder(folder.id, item.code)}
                removeLabel="Прибрати з папки"
              />
            </View>
          );
        }}
      />
    </>
  );
}

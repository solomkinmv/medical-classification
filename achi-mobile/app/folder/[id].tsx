import { useMemo, useState, memo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack, Link } from "expo-router";
import { headerActionOptions } from "@/components/navigation-header";
import { Ionicons } from "@expo/vector-icons";
import { AccentCard } from "@/components/AccentCard";
import { showUpgradePrompt } from "@/components/UpgradePrompt";
import { useFolders } from "@/lib/folders-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { useClassifier } from "@/lib/classifier-provider";
import { useProStatus } from "@/lib/pro-provider";
import { useTheme } from "@/lib/useTheme";
import {
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  getClassifierColors,
} from "@/lib/constants";
import type { LeafCode } from "@/lib/types";

export default function FolderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    folders,
    addToFolder,
    removeFromFolder,
    isReady: foldersReady,
  } = useFolders();
  const { favorites, toggleFavorite, isReady: favoritesReady } = useFavorites();
  const { isPro } = useProStatus();
  const router = useRouter();
  const [selecting, setSelecting] = useState(false);
  const { activeClassifier } = useClassifier();
  const { colors: t } = useTheme();
  const backgroundColor = t.background;
  const classifierColors = getClassifierColors(activeClassifier);

  const folder = useMemo(
    () => folders.find((f) => f.id === id) ?? null,
    [folders, id],
  );

  const codes = useMemo(() => {
    if (!folder) return [];
    return folder.codeRefs
      .map((code) => favorites.find((f) => f.code === code))
      .filter((item): item is LeafCode => item != null);
  }, [folder, favorites]);

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
          ...headerActionOptions("right", {
            id: selecting ? "folder.done" : "folder.add",
            label: selecting ? "Готово" : "Додати коди",
            symbol: selecting ? "checkmark" : "plus",
            fallbackIcon: selecting ? "checkmark" : "add",
            color: t.text,
            onPress: selecting ? () => setSelecting(false) : startSelecting,
          }),
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
          selecting && favorites.length > 0 ? (
            <Text
              style={{ color: t.textSecondary, fontSize: 15, marginBottom: 20 }}
            >
              Оберіть збережені коди для цієї папки. Зміни зберігаються
              автоматично.
            </Text>
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
              {selecting ? "Ще немає збережених кодів" : "Папка порожня"}
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
                ? "Спочатку збережіть потрібні коди за допомогою кнопки закладки, а потім додайте їх до папки."
                : "Додайте сюди потрібні коди зі збережених."}
            </Text>
            <Pressable
              testID={selecting ? "folder.explore" : "folder.add-empty"}
              accessibilityRole="button"
              onPress={
                selecting
                  ? () => router.push("/(tabs)/explore")
                  : startSelecting
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
                {selecting ? "Знайти коди" : "Додати коди"}
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) =>
          selecting ? (
            <Pressable
              testID={`folder.code.${item.code}`}
              accessibilityRole="checkbox"
              accessibilityLabel={`${item.code}: ${item.name_ua}`}
              accessibilityState={{
                checked: folder.codeRefs.includes(item.code),
              }}
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
                name={
                  folder.codeRefs.includes(item.code)
                    ? "checkmark-circle"
                    : "ellipse-outline"
                }
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
          ) : (
            <FolderCodeCard
              item={item}
              accentColor={classifierColors.accent500}
              badgeColor={classifierColors.accent600}
              toggleFavorite={toggleFavorite}
            />
          )
        }
      />
    </>
  );
}

interface FolderCodeCardProps {
  item: LeafCode;
  accentColor: string;
  badgeColor: string;
  toggleFavorite: (item: LeafCode) => { limitReached: boolean };
}

const FolderCodeCard = memo(function FolderCodeCard({
  item,
  accentColor,
  badgeColor,
  toggleFavorite,
}: FolderCodeCardProps) {
  return (
    <Link href={`/procedure/${item.code}` as any} asChild>
      <AccentCard
        accentColor={accentColor}
        badge={item.code}
        badgeColor={badgeColor}
        title={item.name_ua}
        subtitle={item.name_en}
        icon="bookmark"
        iconColor={colors.amber[500]}
        iconBackground="rgba(245, 158, 11, 0.15)"
        iconSize={18}
        onIconPress={() => {
          const { limitReached } = toggleFavorite(item);
          if (limitReached) showUpgradePrompt();
        }}
        isBookmarked={true}
        iconAccessibilityLabel="Видалити закладку"
        accessibilityLabel={`${item.code}: ${item.name_ua}`}
        accessibilityHint="Відкрити деталі"
      />
    </Link>
  );
});

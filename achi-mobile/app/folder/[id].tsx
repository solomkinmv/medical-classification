import { useMemo, memo } from "react";
import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams, Stack, Link } from "expo-router";
import { AccentCard } from "@/components/AccentCard";
import { EmptyState } from "@/components/EmptyState";
import { showUpgradePrompt } from "@/components/UpgradePrompt";
import { useFolders } from "@/lib/folders-provider";
import { useFavorites } from "@/lib/favorites-provider";
import { useClassifier } from "@/lib/classifier-provider";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
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
  const { folders } = useFolders();
  const { favorites, toggleFavorite } = useFavorites();
  const { activeClassifier } = useClassifier();
  const backgroundColor = useBackgroundColor();
  const { colors: t } = useTheme();
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

  if (!folder) {
    return (
      <>
        <Stack.Screen options={{ title: "Папку не знайдено" }} />
        <View
          className="flex-1 items-center justify-center"
          style={{ backgroundColor }}
        >
          <Text style={{ color: t.textSecondary }}>Папку не знайдено</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: folder.name }} />
      <FlatList
        data={codes}
        keyExtractor={(item) => item.code}
        style={{ flex: 1, backgroundColor }}
        contentContainerStyle={{
          paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
          paddingBottom: CONTENT_PADDING_BOTTOM,
          flexGrow: 1,
        }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open"
            iconColor={colors.violet[500]}
            iconBackgroundColor="rgba(139, 92, 246, 0.15)"
            title="Папка порожня"
            message="Додайте коди до цієї папки з екрану збережених"
          />
        }
        renderItem={({ item }) => (
          <FolderCodeCard
            item={item}
            accentColor={classifierColors.accent500}
            badgeColor={classifierColors.accent600}
            toggleFavorite={toggleFavorite}
          />
        )}
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

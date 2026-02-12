import { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AccentCard } from "@/components/AccentCard";
import { Card } from "@/components/Card";
import { ClassifierSwitcher } from "@/components/ClassifierSwitcher";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonList";
import { useFavorites } from "@/lib/favorites-provider";
import { useFolders } from "@/lib/folders-provider";
import { useProStatus } from "@/lib/pro-provider";
import { useClassifier } from "@/lib/classifier-provider";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import { useTheme } from "@/lib/useTheme";
import {
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
  REFRESH_FEEDBACK_DELAY_MS,
} from "@/lib/constants";
import type { LeafCode, Folder } from "@/lib/types";

export default function PinnedScreen() {
  const { favorites, toggleFavorite, isLoading } = useFavorites();
  const {
    folders,
    createFolder,
    deleteFolder,
    renameFolder,
    addToFolder,
    removeFromFolder,
  } = useFolders();
  const { isPro } = useProStatus();
  const { activeClassifier } = useClassifier();
  const backgroundColor = useBackgroundColor();
  const { colors: t } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), REFRESH_FEEDBACK_DELAY_MS);
  }, []);

  const handleCreateFolder = useCallback(() => {
    Alert.prompt(
      "Нова папка",
      "Введіть назву папки",
      [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Створити",
          onPress: (name: string | undefined) => {
            if (name?.trim()) {
              createFolder(name.trim());
            }
          },
        },
      ],
      "plain-text",
    );
  }, [createFolder]);

  const handleFolderLongPress = useCallback(
    (folder: Folder) => {
      Alert.alert(folder.name, undefined, [
        { text: "Скасувати", style: "cancel" },
        {
          text: "Перейменувати",
          onPress: () => {
            Alert.prompt(
              "Перейменувати папку",
              "Введіть нову назву",
              [
                { text: "Скасувати", style: "cancel" },
                {
                  text: "Зберегти",
                  onPress: (name: string | undefined) => {
                    if (name?.trim()) {
                      renameFolder(folder.id, name.trim());
                    }
                  },
                },
              ],
              "plain-text",
              folder.name,
            );
          },
        },
        {
          text: "Видалити",
          style: "destructive",
          onPress: () => deleteFolder(folder.id),
        },
      ]);
    },
    [renameFolder, deleteFolder],
  );

  if (isLoading) {
    return <SkeletonList count={5} hasSubtitle={true} />;
  }

  const hasFolders = isPro && folders.length > 0;
  const isEmpty = favorites.length === 0 && !hasFolders;

  if (isEmpty) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ClassifierSwitcher />
        {isPro && (
          <Pressable
            onPress={handleCreateFolder}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 12,
              marginBottom: 8,
            }}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={colors.violet[500]}
            />
            <Text
              style={{
                color: colors.violet[500],
                fontWeight: "600",
                fontSize: 15,
                marginLeft: 6,
              }}
            >
              Нова папка
            </Text>
          </Pressable>
        )}
        <EmptyState
          icon="bookmark"
          iconColor={colors.amber[500]}
          iconBackgroundColor="rgba(245, 158, 11, 0.15)"
          title="Немає збережених"
          message={
            activeClassifier === "mkh10"
              ? "Натисніть на закладку біля діагнозу, щоб зберегти його тут"
              : "Натисніть на закладку біля процедури, щоб зберегти її тут"
          }
        />
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={favorites}
      keyExtractor={(item) => item.code}
      style={{ flex: 1, backgroundColor }}
      contentContainerStyle={{
        paddingHorizontal: CONTENT_PADDING_HORIZONTAL,
        paddingBottom: CONTENT_PADDING_BOTTOM,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      ListHeaderComponent={
        <>
          <ClassifierSwitcher />
          {isPro && (
            <FoldersSection
              folders={folders}
              onCreateFolder={handleCreateFolder}
              onFolderLongPress={handleFolderLongPress}
              onFolderPress={(folder) =>
                router.push(`/folder/${folder.id}` as never)
              }
              themeColors={t}
            />
          )}
        </>
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.amber[500]}
        />
      }
      renderItem={({ item }) => (
        <PinnedCard
          procedure={item}
          toggleFavorite={toggleFavorite}
          isPro={isPro}
          folders={folders}
          onAddToFolder={(folderId: string) =>
            addToFolder(folderId, item.code)
          }
          onRemoveFromFolder={(folderId: string) =>
            removeFromFolder(folderId, item.code)
          }
        />
      )}
    />
  );
}

interface FoldersSectionProps {
  folders: Folder[];
  onCreateFolder: () => void;
  onFolderLongPress: (folder: Folder) => void;
  onFolderPress: (folder: Folder) => void;
  themeColors: { text: string; textSecondary: string; textMuted: string };
}

function FoldersSection({
  folders,
  onCreateFolder,
  onFolderLongPress,
  onFolderPress,
  themeColors,
}: FoldersSectionProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: themeColors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          Папки
        </Text>
        <Pressable
          onPress={onCreateFolder}
          hitSlop={8}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Ionicons
            name="add-circle-outline"
            size={18}
            color={colors.violet[500]}
          />
          <Text
            style={{
              color: colors.violet[500],
              fontWeight: "600",
              fontSize: 13,
              marginLeft: 4,
            }}
          >
            Нова папка
          </Text>
        </Pressable>
      </View>
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          onPress={() => onFolderPress(folder)}
          onLongPress={() => onFolderLongPress(folder)}
          themeColors={themeColors}
        />
      ))}
    </View>
  );
}

interface FolderCardProps {
  folder: Folder;
  onPress: () => void;
  onLongPress: () => void;
  themeColors: { text: string; textSecondary: string };
}

const FolderCard = memo(function FolderCard({
  folder,
  onPress,
  onLongPress,
  themeColors,
}: FolderCardProps) {
  const count = folder.codeRefs.length;
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} className="mb-3">
      <Card>
        <View className="flex-row items-center p-4">
          <View
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
          >
            <Ionicons name="folder" size={18} color={colors.violet[500]} />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-semibold"
              style={{ color: themeColors.text }}
              numberOfLines={1}
            >
              {folder.name}
            </Text>
            <Text
              className="text-xs mt-0.5"
              style={{ color: themeColors.textSecondary }}
            >
              {count === 0
                ? "Порожня"
                : `${count} ${count === 1 ? "код" : count < 5 ? "коди" : "кодів"}`}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={themeColors.textSecondary}
          />
        </View>
      </Card>
    </Pressable>
  );
});

interface PinnedCardProps {
  procedure: LeafCode;
  toggleFavorite: (item: LeafCode) => { limitReached: boolean };
  isPro: boolean;
  folders: Folder[];
  onAddToFolder: (folderId: string) => void;
  onRemoveFromFolder: (folderId: string) => void;
}

const PinnedCard = memo(function PinnedCard({
  procedure,
  toggleFavorite,
  isPro,
  folders,
  onAddToFolder,
  onRemoveFromFolder,
}: PinnedCardProps) {
  const handleLongPress = useCallback(() => {
    if (!isPro || folders.length === 0) return;

    const currentFolder = folders.find((f) =>
      f.codeRefs.includes(procedure.code),
    );

    const buttons: {
      text: string;
      onPress?: () => void;
      style?: "cancel" | "destructive";
    }[] = [{ text: "Скасувати", style: "cancel" }];

    if (currentFolder) {
      buttons.push({
        text: `Видалити з "${currentFolder.name}"`,
        style: "destructive",
        onPress: () => onRemoveFromFolder(currentFolder.id),
      });
    }

    for (const folder of folders) {
      if (folder.id === currentFolder?.id) continue;
      buttons.push({
        text: folder.name,
        onPress: () => {
          if (currentFolder) {
            onRemoveFromFolder(currentFolder.id);
          }
          onAddToFolder(folder.id);
        },
      });
    }

    Alert.alert("Додати в папку", undefined, buttons);
  }, [isPro, folders, procedure.code, onAddToFolder, onRemoveFromFolder]);

  return (
    <Pressable
      onLongPress={isPro && folders.length > 0 ? handleLongPress : undefined}
    >
      <Link href={`/procedure/${procedure.code}` as any} asChild>
        <AccentCard
          accentColor={colors.amber[500]}
          badge={procedure.code}
          badgeColor={colors.amber[600]}
          title={procedure.name_ua}
          subtitle={procedure.name_en}
          icon="bookmark"
          iconColor={colors.amber[500]}
          iconBackground="rgba(245, 158, 11, 0.15)"
          iconSize={18}
          onIconPress={() => toggleFavorite(procedure)}
          isBookmarked={true}
          iconAccessibilityLabel="Видалити закладку"
          accessibilityLabel={`${procedure.code}: ${procedure.name_ua}`}
          accessibilityHint="Відкрити деталі"
        />
      </Link>
    </Pressable>
  );
});

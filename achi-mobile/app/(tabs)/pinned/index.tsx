import { memo, useCallback } from "react";
import { View, Text, FlatList, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { promptTextInput } from "@/lib/prompt-text-input";
import { Card } from "@/components/Card";
import { ClassifierSwitcher } from "@/components/ClassifierSwitcher";
import { CodeCard } from "@/components/CodeCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/SkeletonList";
import { useFavorites } from "@/lib/favorites-provider";
import { useFolders } from "@/lib/folders-provider";
import { useProStatus } from "@/lib/pro-provider";
import { useClassifier } from "@/lib/classifier-provider";
import { useFolderActions } from "@/lib/useFolderActions";
import { useBackgroundColor } from "@/lib/useBackgroundColor";
import { useTheme } from "@/lib/useTheme";
import { findCode, getCodeContext } from "@/lib/code-index";
import {
  BOOKMARK_LIMIT_FREE,
  colors,
  CONTENT_PADDING_HORIZONTAL,
  CONTENT_PADDING_BOTTOM,
} from "@/lib/constants";
import type { ClassifierType, Folder, LeafCode } from "@/lib/types";

function pluralizeCodes(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;
  if (lastTwo >= 11 && lastTwo <= 19) return "кодів";
  if (lastOne === 1) return "код";
  if (lastOne >= 2 && lastOne <= 4) return "коди";
  return "кодів";
}

export default function PinnedScreen() {
  const { favorites, isLoading } = useFavorites();
  const { folders, isReady: foldersReady, createFolder } = useFolders();
  const { isPro } = useProStatus();
  const { activeClassifier } = useClassifier();
  const backgroundColor = useBackgroundColor();
  const { colors: t } = useTheme();
  const router = useRouter();

  const handleCreateFolder = useCallback(() => {
    promptTextInput({
      title: "Нова папка",
      message: "Наприклад, «Планові операції» або «Звіт за місяць»",
      submitText: "Створити",
      onSubmit: (name) => {
        const folder = createFolder(name);
        router.push(`/folder/${folder.id}`);
      },
    });
  }, [createFolder, router]);

  if (isLoading) {
    return <SkeletonList count={5} hasSubtitle={true} />;
  }

  if (!foldersReady) {
    return (
      <Text
        testID="pinned.folders-unavailable"
        style={{ color: t.textSecondary, padding: 24 }}
      >
        Папки ще недоступні. Якщо завантаження не завершиться, відкрийте додаток
        знову.
      </Text>
    );
  }

  const hasFolders = isPro && folders.length > 0;

  if (favorites.length === 0 && !hasFolders) {
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
        {isPro && <NewFolderButton onPress={handleCreateFolder} />}
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
      ListHeaderComponent={
        <>
          <ClassifierSwitcher />
          {isPro && (
            <FoldersSection
              folders={folders}
              onCreateFolder={handleCreateFolder}
              onOpenFolder={(folder) => router.push(`/folder/${folder.id}`)}
            />
          )}
          {favorites.length > 0 && (
            <SectionHeader
              title="Закладки"
              detail={
                isPro
                  ? `${favorites.length}`
                  : `${favorites.length} з ${BOOKMARK_LIMIT_FREE}`
              }
            />
          )}
        </>
      }
      renderItem={({ item }) => (
        <BookmarkCard code={item} classifier={activeClassifier} />
      )}
    />
  );
}

const BookmarkCard = memo(function BookmarkCard({
  code,
  classifier,
}: {
  code: LeafCode;
  classifier: ClassifierType;
}) {
  const entry = findCode(code.code);
  return (
    <View testID={`pinned.code.${code.code}`}>
      <CodeCard
        code={code}
        classifier={classifier}
        context={entry ? getCodeContext(entry.leaf, entry.path) : undefined}
      />
    </View>
  );
});

function SectionHeader({ title, detail }: { title: string; detail?: string }) {
  const { colors: t } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="header"
      style={{
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: t.textSecondary,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {title}
      </Text>
      {detail && (
        <Text style={{ fontSize: 13, color: t.textSecondary }}>{detail}</Text>
      )}
    </View>
  );
}

function NewFolderButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      testID="pinned.folder.create"
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: colors.violet[500],
        marginBottom: 12,
      }}
    >
      <Ionicons name="add" size={18} color={colors.violet[600]} />
      <Text
        style={{
          color: colors.violet[600],
          fontWeight: "600",
          fontSize: 15,
          marginLeft: 6,
        }}
      >
        Нова папка
      </Text>
    </Pressable>
  );
}

interface FoldersSectionProps {
  folders: Folder[];
  onCreateFolder: () => void;
  onOpenFolder: (folder: Folder) => void;
}

function FoldersSection({
  folders,
  onCreateFolder,
  onOpenFolder,
}: FoldersSectionProps) {
  const { showMenu } = useFolderActions();

  return (
    <View style={{ marginBottom: 20 }}>
      <SectionHeader title="Папки" />
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          folder={folder}
          onPress={() => onOpenFolder(folder)}
          onMenu={() => showMenu(folder)}
        />
      ))}
      <NewFolderButton onPress={onCreateFolder} />
    </View>
  );
}

interface FolderCardProps {
  folder: Folder;
  onPress: () => void;
  onMenu: () => void;
}

const FolderCard = memo(function FolderCard({
  folder,
  onPress,
  onMenu,
}: FolderCardProps) {
  const { colors: t } = useTheme();
  const count = folder.codeRefs.length;
  const countLabel =
    count === 0 ? "Порожня" : `${count} ${pluralizeCodes(count)}`;

  return (
    <View className="mb-3">
      <Card>
        <View className="flex-row items-center">
          <Pressable
            testID={`pinned.folder.${folder.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Папка ${folder.name}, ${countLabel}`}
            accessibilityActions={[{ name: "menu", label: "Дії з папкою" }]}
            onAccessibilityAction={onMenu}
            onPress={onPress}
            onLongPress={onMenu}
            className="flex-1 flex-row items-center p-4"
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
            >
              <Ionicons name="folder" size={18} color={colors.violet[500]} />
            </View>
            <View className="flex-1">
              <Text
                className="text-base font-semibold"
                style={{ color: t.text }}
                numberOfLines={1}
              >
                {folder.name}
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: t.textSecondary }}
              >
                {countLabel}
              </Text>
            </View>
          </Pressable>
          <Pressable
            testID={`pinned.folder.${folder.id}.menu`}
            accessibilityRole="button"
            accessibilityLabel={`Дії з папкою ${folder.name}`}
            onPress={onMenu}
            className="w-11 h-11 items-center justify-center mr-2"
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={20}
              color={t.textSecondary}
            />
          </Pressable>
        </View>
      </Card>
    </View>
  );
});

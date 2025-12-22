import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="explore">
        <Icon sf="safari" />
        <Label>Огляд</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="pinned">
        <Icon sf="bookmark" />
        <Label>Збережені</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="about">
        <Icon sf="info.circle" />
        <Label>Про додаток</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role="search">
        <Label>Пошук</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

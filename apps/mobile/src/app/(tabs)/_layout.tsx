import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface TabDef {
  name: string;
  title: string;
  icon: IoniconName;
  iconActive: IoniconName;
}

const TABS: TabDef[] = [
  { name: "index", title: "Agent", icon: "sparkles-outline", iconActive: "sparkles" },
  { name: "inbox", title: "Inbox", icon: "mail-outline", iconActive: "mail" },
  { name: "calendar", title: "Calendar", icon: "calendar-outline", iconActive: "calendar" },
  { name: "settings", title: "Settings", icon: "settings-outline", iconActive: "settings" },
];

export default function TabsLayout() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.ink3,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500", marginBottom: 2 },
      }}
    >
      {TABS.map(({ name, title, icon, iconActive }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? iconActive : icon} size={22} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

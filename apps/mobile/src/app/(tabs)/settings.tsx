import { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";

interface RowProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value?: string;
  danger?: boolean;
  onPress?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colors: any;
}

function Row({ icon, label, value, danger, onPress, colors }: RowProps) {
  const s = rowStyles(colors);
  return (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.ink2} style={s.icon} />
      <Text style={[s.label, danger && s.danger]}>{label}</Text>
      {value && <Text style={s.value}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={14} color={colors.ink3} />}
    </TouchableOpacity>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rowStyles = (c: any) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[4],
      gap: Spacing[3],
    },
    icon: { width: 22 },
    label: { flex: 1, color: c.ink, fontSize: 15 },
    danger: { color: c.danger },
    value: { color: c.ink3, fontSize: 14 },
  });

export default function SettingsScreen() {
  const colors = useTheme();
  const { signOut } = useAuth();
  const { user } = useUser();
  const clearAuth = useAuthStore((s) => s.signOut);

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          clearAuth();
          await signOut();
        },
      },
    ]);
  }, [signOut, clearAuth]);

  const s = styles(colors);
  const displayName = user?.fullName ?? user?.firstName ?? "Account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Settings</Text>
      </View>

      {/* Profile card */}
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(displayName[0] ?? "?").toUpperCase()}</Text>
        </View>
        <View>
          <Text style={s.profileName}>{displayName}</Text>
          <Text style={s.profileEmail}>{email}</Text>
        </View>
      </View>

      {/* Account section */}
      <Text style={s.sectionLabel}>Account</Text>
      <View style={s.section}>
        <Row colors={colors} icon="mail-outline" label="Email" value={email} />
        <View style={s.sep} />
        <Row colors={colors} icon="logo-google" label="Gmail" value="Connected" />
        <View style={s.sep} />
        <Row colors={colors} icon="calendar-outline" label="Google Calendar" value="Connected" />
      </View>

      {/* App section */}
      <Text style={s.sectionLabel}>App</Text>
      <View style={s.section}>
        <Row colors={colors} icon="moon-outline" label="Appearance" value="System" />
        <View style={s.sep} />
        <Row colors={colors} icon="information-circle-outline" label="Version" value="1.0.0" />
      </View>

      {/* Sign out */}
      <View style={s.section}>
        <Row
          colors={colors}
          icon="log-out-outline"
          label="Sign out"
          danger
          onPress={handleSignOut}
        />
      </View>
    </SafeAreaView>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles = (c: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bgSecondary },
    header: {
      height: 52,
      paddingHorizontal: Spacing[5],
      justifyContent: "center",
      backgroundColor: c.panel,
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    headerTitle: { color: c.ink, fontSize: 16, fontWeight: "600", letterSpacing: -0.3 },
    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[4],
      margin: Spacing[4],
      padding: Spacing[4],
      backgroundColor: c.panel,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: c.line,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: Radius.full,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: c.accentInk, fontSize: 18, fontWeight: "700" },
    profileName: { color: c.ink, fontSize: 15, fontWeight: "600" },
    profileEmail: { color: c.ink3, fontSize: 13, marginTop: 2 },
    sectionLabel: {
      color: c.ink3,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginLeft: Spacing[5],
      marginBottom: Spacing[2],
    },
    section: {
      backgroundColor: c.panel,
      borderRadius: Radius.lg,
      marginHorizontal: Spacing[4],
      marginBottom: Spacing[5],
      borderWidth: 1,
      borderColor: c.line,
      overflow: "hidden",
    },
    sep: { height: 1, backgroundColor: c.line, marginLeft: 54 },
  });

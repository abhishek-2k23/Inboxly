import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { disconnectIntegration, getIntegrationStatus, getSubscription, WEB_URL } from "@/lib/api";
import type {
  GoogleIntegrationPlugin,
  IntegrationStatusResponse,
  SubscriptionResponse,
} from "@/types";

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

const INTEGRATIONS: { plugin: GoogleIntegrationPlugin; label: string; icon: RowProps["icon"] }[] = [
  { plugin: "gmail", label: "Gmail", icon: "mail-outline" },
  { plugin: "googlecalendar", label: "Google Calendar", icon: "calendar-outline" },
];

function IntegrationRow({
  plugin,
  label,
  icon,
  connected,
  busy,
  onConnect,
  onDisconnect,
  colors,
}: {
  plugin: GoogleIntegrationPlugin;
  label: string;
  icon: RowProps["icon"];
  connected: boolean;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colors: any;
}) {
  const s = rowStyles(colors);
  return (
    <View style={s.row}>
      <Ionicons name={icon} size={18} color={colors.ink2} style={s.icon} />
      <View style={{ flex: 1 }}>
        <Text style={s.label}>{label}</Text>
        <Text
          style={{ color: connected ? colors.success : colors.ink3, fontSize: 12, marginTop: 2 }}
        >
          {connected ? "Connected" : "Not connected"}
        </Text>
      </View>
      {busy ? (
        <ActivityIndicator size="small" color={colors.ink2} />
      ) : connected ? (
        <TouchableOpacity onPress={onDisconnect} hitSlop={6}>
          <Text style={{ color: colors.danger, fontSize: 13, fontWeight: "600" }}>Disconnect</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={onConnect} hitSlop={6}>
          <Text style={{ color: colors.accent, fontSize: 13, fontWeight: "600" }}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function Meter({
  label,
  used,
  limit,
  color,
  colors,
}: {
  label: string;
  used: number;
  limit: number;
  color: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colors: any;
}) {
  const unlimited = limit < 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const atLimit = !unlimited && used >= limit;
  return (
    <View style={{ paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], gap: Spacing[2] }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: colors.ink, fontSize: 14 }}>{label}</Text>
        <Text style={{ color: colors.ink2, fontSize: 13, fontWeight: "600" }}>
          {used}
          {unlimited ? " · Unlimited" : ` / ${limit}`}
        </Text>
      </View>
      {!unlimited && (
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.surface,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 6,
              width: `${pct}%`,
              borderRadius: 3,
              backgroundColor: atLimit ? colors.danger : color,
            }}
          />
        </View>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useTheme();
  const { signOut } = useAuth();
  const { user } = useUser();
  const clearAuth = useAuthStore((st) => st.signOut);
  const setIntegrations = useAuthStore((st) => st.setIntegrations);

  const [status, setStatus] = useState<IntegrationStatusResponse | null>(null);
  const [sub, setSub] = useState<SubscriptionResponse | null>(null);
  const [busy, setBusy] = useState<GoogleIntegrationPlugin | null>(null);

  const refresh = useCallback(() => {
    getIntegrationStatus()
      .then((st) => {
        setStatus(st);
        setIntegrations(st.gmail === "connected", st.googlecalendar === "connected");
      })
      .catch(() => {});
    getSubscription()
      .then(setSub)
      .catch(() => {});
  }, [setIntegrations]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleConnect = useCallback(async () => {
    // The connect endpoint relies on the Clerk session cookie, which the native
    // app doesn't carry — hand the user to the web dashboard to authorize.
    await WebBrowser.openBrowserAsync(`${WEB_URL}/dashboard/settings`);
    // Re-check status when they return.
    setTimeout(refresh, 500);
  }, [refresh]);

  const handleDisconnect = useCallback(
    (plugin: GoogleIntegrationPlugin) => {
      Alert.alert("Disconnect", `Disconnect ${plugin === "gmail" ? "Gmail" : "Google Calendar"}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            setBusy(plugin);
            try {
              const next = await disconnectIntegration(plugin);
              setStatus(next);
              setIntegrations(next.gmail === "connected", next.googlecalendar === "connected");
            } catch {
              Alert.alert("Couldn't disconnect", "Please try again.");
            } finally {
              setBusy(null);
            }
          },
        },
      ]);
    },
    [setIntegrations],
  );

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
  const plan = sub?.subscriptionType ?? "free";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Profile card */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(displayName[0] ?? "?").toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{displayName}</Text>
            <Text style={s.profileEmail} numberOfLines={1}>
              {email}
            </Text>
          </View>
          <View style={[s.planBadge, plan === "pro" && s.planBadgePro]}>
            <Text style={[s.planText, plan === "pro" && s.planTextPro]}>
              {plan === "pro" ? "Pro" : "Free"}
            </Text>
          </View>
        </View>

        {/* Integrations */}
        <Text style={s.sectionLabel}>Integrations</Text>
        <View style={s.section}>
          {INTEGRATIONS.map(({ plugin, label, icon }, i) => (
            <View key={plugin}>
              {i > 0 && <View style={s.sep} />}
              <IntegrationRow
                plugin={plugin}
                label={label}
                icon={icon}
                connected={status?.[plugin] === "connected"}
                busy={busy === plugin}
                onConnect={handleConnect}
                onDisconnect={() => handleDisconnect(plugin)}
                colors={colors}
              />
            </View>
          ))}
        </View>

        {/* Usage */}
        <Text style={s.sectionLabel}>Usage</Text>
        <View style={s.section}>
          {sub ? (
            <>
              <Meter
                label="Chats"
                used={sub.usage.chats}
                limit={sub.limits.chats}
                color={colors.accent}
                colors={colors}
              />
              <View style={s.sep} />
              <Meter
                label="Conversations"
                used={sub.usage.conversations}
                limit={sub.limits.conversations}
                color="#8b7cff"
                colors={colors}
              />
              <View style={s.sep} />
              <Meter
                label="Email syncs"
                used={sub.usage.emailSyncs}
                limit={sub.limits.emailSyncs}
                color="#14b8a6"
                colors={colors}
              />
            </>
          ) : (
            <View style={{ padding: Spacing[5], alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          )}
        </View>

        {/* App */}
        <Text style={s.sectionLabel}>App</Text>
        <View style={s.section}>
          <Row colors={colors} icon="mail-outline" label="Email" value={email} />
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
      </ScrollView>
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
    scroll: { paddingBottom: Spacing[8] },
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
    planBadge: {
      paddingHorizontal: Spacing[3],
      paddingVertical: 4,
      borderRadius: Radius.full,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
    },
    planBadgePro: { backgroundColor: c.accent, borderColor: c.accent },
    planText: { color: c.ink2, fontSize: 12, fontWeight: "700" },
    planTextPro: { color: c.accentInk },
    sectionLabel: {
      color: c.ink3,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginLeft: Spacing[5],
      marginBottom: Spacing[2],
      marginTop: Spacing[2],
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
    sep: { height: 1, backgroundColor: c.line, marginLeft: Spacing[4] },
  });

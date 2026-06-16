import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import { useEmailStore } from "@/stores/email-store";
import type { EmailSummary } from "@/types";

type Category = "All" | "Primary" | "Urgent" | "Updates" | "Promotions";
const CATEGORIES: Category[] = ["All", "Primary", "Urgent", "Updates", "Promotions"];

function isUnread(e: EmailSummary) {
  return (e.labelIds ?? []).includes("UNREAD");
}
function priority(e: EmailSummary) {
  const l = e.labelIds ?? [];
  if (l.includes("IMPORTANT")) return "urgent";
  if (l.includes("CATEGORY_PERSONAL") || l.includes("CATEGORY_PRIMARY")) return "medium";
  return "low";
}
function senderName(from?: string) {
  if (!from) return "Unknown";
  const m = from.match(/^\s*"?([^"<]+?)"?\s*</);
  return m?.[1]?.trim() ?? from.split("@")[0] ?? from;
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}
const AVATAR_PALETTE = ["#1d9e75", "#3a7bd5", "#9b59b6", "#e08e3c", "#c0504d", "#2c8c84"];
function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]!;
}
function relTime(internalDate?: string | null) {
  if (!internalDate) return "";
  const ts = Number(internalDate);
  if (!isFinite(ts)) return "";
  const diff = Date.now() - ts;
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function matchCategory(e: EmailSummary, cat: Category) {
  const l = e.labelIds ?? [];
  if (cat === "All") return true;
  if (cat === "Primary") return l.includes("CATEGORY_PERSONAL") || l.includes("CATEGORY_PRIMARY");
  if (cat === "Urgent") return l.includes("IMPORTANT");
  if (cat === "Updates") return l.includes("CATEGORY_UPDATES") || l.includes("CATEGORY_FORUMS");
  if (cat === "Promotions")
    return l.includes("CATEGORY_PROMOTIONS") || l.includes("CATEGORY_SOCIAL");
  return true;
}

const PRIO_COLOR: Record<string, string> = {
  urgent: "#d97706",
  medium: "#6366f1",
  low: "#16a34a",
};

export default function InboxScreen() {
  const colors = useTheme();
  const { emails, loaded, loadEmails } = useEmailStore();
  const [category, setCategory] = useState<Category>("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return emails.filter((e) => {
      if (!matchCategory(e, category)) return false;
      if (!q) return true;
      return (
        senderName(e.from).toLowerCase().includes(q) || (e.subject ?? "").toLowerCase().includes(q)
      );
    });
  }, [emails, category, search]);

  const unread = useMemo(() => emails.filter(isUnread).length, [emails]);
  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Inbox</Text>
        {unread > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{unread > 99 ? "99+" : unread}</Text>
          </View>
        )}
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={colors.ink3} style={s.searchIcon} />
        <TextInput
          style={s.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search emails…"
          placeholderTextColor={colors.ink3}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.ink3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filters */}
      <View style={s.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.filterChip, category === cat && s.filterChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[s.filterChipText, category === cat && s.filterChipTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {!loaded ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="mail-outline" size={36} color={colors.ink3} />
              <Text style={s.emptyText}>
                {search ? `No results for "${search}"` : "Your inbox is empty"}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const name = senderName(item.from);
            const unreadItem = isUnread(item);
            const prio = priority(item);
            return (
              <TouchableOpacity style={s.row} activeOpacity={0.7}>
                {/* Priority bar */}
                {prio !== "low" && (
                  <View style={[s.prioBar, { backgroundColor: PRIO_COLOR[prio] }]} />
                )}
                {/* Avatar */}
                <View style={[s.avatar, { backgroundColor: avatarColor(name) }]}>
                  <Text style={s.avatarText}>{initials(name)}</Text>
                </View>
                {/* Content */}
                <View style={s.rowContent}>
                  <View style={s.rowTop}>
                    <Text style={[s.sender, unreadItem && s.senderUnread]} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={s.time}>{relTime(item.internalDate)}</Text>
                  </View>
                  <Text style={[s.subject, unreadItem && s.subjectUnread]} numberOfLines={1}>
                    {item.subject ?? "(no subject)"}
                  </Text>
                  <Text style={s.snippet} numberOfLines={1}>
                    {item.snippet ?? ""}
                  </Text>
                </View>
                {/* Unread dot */}
                {unreadItem && <View style={s.unreadDot} />}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles = (c: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[2],
      height: 52,
      paddingHorizontal: Spacing[5],
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    headerTitle: { color: c.ink, fontSize: 16, fontWeight: "600", letterSpacing: -0.3 },
    badge: {
      backgroundColor: c.accent,
      borderRadius: Radius.full,
      minWidth: 20,
      height: 18,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    badgeText: { color: c.accentInk, fontSize: 10, fontWeight: "700" },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      margin: Spacing[4],
      paddingHorizontal: Spacing[4],
      backgroundColor: c.surface,
      borderRadius: Radius.full,
      borderWidth: 1,
      borderColor: c.line,
      height: 40,
      gap: Spacing[2],
    },
    searchIcon: { marginRight: -Spacing[1] },
    search: { flex: 1, color: c.ink, fontSize: 14 },
    filterRow: {
      flexDirection: "row",
      paddingHorizontal: Spacing[4],
      gap: Spacing[2],
      paddingBottom: Spacing[3],
    },
    filterChip: {
      paddingHorizontal: Spacing[3],
      paddingVertical: Spacing[1],
      borderRadius: Radius.full,
      backgroundColor: c.surface,
    },
    filterChipActive: { backgroundColor: c.accent },
    filterChipText: { color: c.ink3, fontSize: 12, fontWeight: "500" },
    filterChipTextActive: { color: c.accentInk },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 80,
      gap: Spacing[3],
    },
    emptyText: { color: c.ink3, fontSize: 14 },
    sep: { height: 1, backgroundColor: c.line, marginLeft: 64 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[4],
      gap: Spacing[3],
    },
    prioBar: {
      position: "absolute",
      left: 0,
      top: "25%",
      bottom: "25%",
      width: 2,
      borderRadius: 2,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: Radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
    rowContent: { flex: 1, gap: 2 },
    rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
    sender: { color: c.ink2, fontSize: 13, fontWeight: "500", flex: 1 },
    senderUnread: { color: c.ink, fontWeight: "700" },
    time: { color: c.ink3, fontSize: 11 },
    subject: { color: c.ink2, fontSize: 13 },
    subjectUnread: { color: c.ink, fontWeight: "600" },
    snippet: { color: c.ink3, fontSize: 12 },
    unreadDot: { width: 6, height: 6, borderRadius: Radius.full, backgroundColor: c.accent },
  });

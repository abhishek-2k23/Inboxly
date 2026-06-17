import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import { archiveEmail, getEmail } from "@/lib/api";
import { useEmailStore } from "@/stores/email-store";
import {
  avatarColor,
  fullDate,
  htmlToText,
  initials,
  senderEmail,
  senderName,
} from "@/lib/email-format";
import type { EmailSummary } from "@/types";

export default function EmailDetailScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const cached = useEmailStore((s) => s.emails.find((e) => e.id === id));
  const [email, setEmail] = useState<EmailSummary | undefined>(cached);
  const [loading, setLoading] = useState(!cached?.body && !cached?.bodyHtml);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getEmail(id)
      .then(({ email: full }) => {
        if (active) setEmail(full);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function handleArchive() {
    if (!id || archiving) return;
    setArchiving(true);
    try {
      await archiveEmail(id);
      // Drop it from the cached inbox list so it disappears on back.
      useEmailStore.setState((st) => ({ emails: st.emails.filter((e) => e.id !== id) }));
      router.back();
    } catch {
      setArchiving(false);
    }
  }

  function handleReply() {
    if (!email) return;
    router.push({
      pathname: "/compose",
      params: {
        to: senderEmail(email.from),
        subject: email.subject ? `Re: ${email.subject}` : "",
        replyToEmailId: email.id,
      },
    });
  }

  const s = styles(colors);
  const name = senderName(email?.from);
  const body = email?.body?.trim() || htmlToText(email?.bodyHtml) || email?.snippet || "";

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={s.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={s.headerSpacer} />
        <TouchableOpacity onPress={handleReply} hitSlop={8} style={s.headerBtn}>
          <Ionicons name="arrow-undo-outline" size={20} color={colors.ink2} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleArchive}
          hitSlop={8}
          style={s.headerBtn}
          disabled={archiving}
        >
          {archiving ? (
            <ActivityIndicator size="small" color={colors.ink2} />
          ) : (
            <Ionicons name="archive-outline" size={20} color={colors.ink2} />
          )}
        </TouchableOpacity>
      </View>

      {loading && !email ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : !email ? (
        <View style={s.center}>
          <Ionicons name="mail-outline" size={36} color={colors.ink3} />
          <Text style={s.muted}>Couldn&apos;t load this email</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={s.subject}>{email.subject ?? "(no subject)"}</Text>

          <View style={s.fromRow}>
            <View style={[s.avatar, { backgroundColor: avatarColor(name) }]}>
              <Text style={s.avatarText}>{initials(name)}</Text>
            </View>
            <View style={s.fromInfo}>
              <Text style={s.fromName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={s.fromEmail} numberOfLines={1}>
                {senderEmail(email.from)}
              </Text>
            </View>
            <Text style={s.date}>{fullDate(email.internalDate)}</Text>
          </View>

          <View style={s.divider} />

          <Text style={s.body} selectable>
            {body}
          </Text>
        </ScrollView>
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
      height: 52,
      paddingHorizontal: Spacing[3],
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    headerBtn: {
      width: 38,
      height: 38,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    headerSpacer: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing[3] },
    muted: { color: c.ink3, fontSize: 14 },
    scroll: { padding: Spacing[5], gap: Spacing[4] },
    subject: { color: c.ink, fontSize: 20, fontWeight: "700", letterSpacing: -0.4, lineHeight: 26 },
    fromRow: { flexDirection: "row", alignItems: "center", gap: Spacing[3] },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: Radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#fff", fontSize: 13, fontWeight: "700" },
    fromInfo: { flex: 1 },
    fromName: { color: c.ink, fontSize: 14, fontWeight: "600" },
    fromEmail: { color: c.ink3, fontSize: 12, marginTop: 1 },
    date: { color: c.ink3, fontSize: 11, textAlign: "right", maxWidth: 90 },
    divider: { height: 1, backgroundColor: c.line },
    body: { color: c.ink2, fontSize: 15, lineHeight: 23 },
  });

import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import { sendEmail } from "@/lib/api";

export default function ComposeScreen() {
  const colors = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ to?: string; subject?: string; replyToEmailId?: string }>();

  const [to, setTo] = useState(params.to ?? "");
  const [subject, setSubject] = useState(params.subject ?? "");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = to.trim().length > 0 && body.trim().length > 0 && !sending;

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      await sendEmail({
        to: to.trim(),
        subject: subject.trim() || "(no subject)",
        body: body.trim(),
        replyToEmailId: params.replyToEmailId,
      });
      router.back();
    } catch {
      setError("Couldn't send. Check the recipient and try again.");
      setSending(false);
    }
  }

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.kav}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={s.headerBtn}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{params.replyToEmailId ? "Reply" : "New message"}</Text>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.accentInk} />
            ) : (
              <>
                <Ionicons name="send" size={14} color={colors.accentInk} />
                <Text style={s.sendBtnText}>Send</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.field}>
            <Text style={s.label}>To</Text>
            <TextInput
              style={s.input}
              value={to}
              onChangeText={setTo}
              placeholder="recipient@example.com"
              placeholderTextColor={colors.ink3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Subject</Text>
            <TextInput
              style={s.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Subject"
              placeholderTextColor={colors.ink3}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Message</Text>
            <TextInput
              style={[s.input, s.bodyInput]}
              value={body}
              onChangeText={setBody}
              placeholder="Write your message…"
              placeholderTextColor={colors.ink3}
              multiline
              textAlignVertical="top"
            />
          </View>

          {error && <Text style={s.error}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles = (c: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    kav: { flex: 1 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: 56,
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
    headerTitle: { color: c.ink, fontSize: 16, fontWeight: "600" },
    sendBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.accent,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing[4],
      height: 34,
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendBtnText: { color: c.accentInk, fontSize: 14, fontWeight: "600" },
    scroll: { padding: Spacing[5], gap: Spacing[4] },
    field: { gap: Spacing[1] },
    label: { color: c.ink2, fontSize: 13, fontWeight: "500" },
    input: {
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
      color: c.ink,
      fontSize: 15,
      backgroundColor: c.surface,
    },
    bodyInput: { minHeight: 220 },
    error: { color: c.danger, fontSize: 13 },
  });

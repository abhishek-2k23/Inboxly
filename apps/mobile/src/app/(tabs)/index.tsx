import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import { CAPABILITIES, SUGGESTIONS } from "@/constants/agent";
import { useChatStore } from "@/stores/chat-store";
import type { ChatMessage } from "@/types";

export default function AgentScreen() {
  const colors = useTheme();
  const { user } = useUser();
  const [input, setInput] = useState("");
  const flatRef = useRef<FlatList<ChatMessage>>(null);

  const activeMessages = useChatStore((s) => s.activeMessages());
  const sending = useChatStore((s) => s.sending);
  const send = useChatStore((s) => s.sendMessage);
  const newChat = useChatStore((s) => s.newChat);

  const chatMode = activeMessages.length > 0;
  const firstName = user?.firstName?.trim();

  const handleSend = useCallback(
    async (override?: string) => {
      const text = (override ?? input).trim();
      if (!text || sending) return;
      setInput("");
      try {
        await send(text);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
      } catch {
        setInput(text);
      }
    },
    [input, sending, send],
  );

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.kav}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Agent</Text>
          <TouchableOpacity
            style={s.newChatBtn}
            onPress={() => {
              newChat();
              setInput("");
            }}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={20} color={colors.ink2} />
          </TouchableOpacity>
        </View>

        {chatMode ? (
          <FlatList
            ref={flatRef}
            data={activeMessages}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={s.msgList}
            renderItem={({ item }) => (
              <View style={[s.bubble, item.role === "user" ? s.userBubble : s.aiBubble]}>
                <Text style={item.role === "user" ? s.userText : s.aiText}>{item.content}</Text>
              </View>
            )}
            ListFooterComponent={
              sending ? (
                <View style={[s.bubble, s.aiBubble, s.typing]}>
                  <ActivityIndicator size="small" color={colors.ink3} />
                </View>
              ) : null
            }
          />
        ) : (
          <ScrollView contentContainerStyle={s.welcomeScroll} keyboardShouldPersistTaps="handled">
            <View style={s.welcomeHead}>
              <View style={s.logoBadge}>
                <Ionicons name="sparkles" size={22} color={colors.accent} />
              </View>
              <Text style={s.welcomeTitle}>Welcome back{firstName ? `, ${firstName}` : ""}</Text>
              <Text style={s.welcomeSub}>Let&apos;s clear the clutter today.</Text>
            </View>

            {/* Capability grid */}
            <View style={s.grid}>
              {CAPABILITIES.map((cap) => (
                <TouchableOpacity
                  key={cap.title}
                  style={s.card}
                  activeOpacity={0.8}
                  onPress={() => setInput(cap.prompt)}
                >
                  <Ionicons name={cap.icon} size={18} color={colors.accent} />
                  <Text style={s.cardTitle}>{cap.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Suggestion chips */}
            <View style={s.chips}>
              {SUGGESTIONS.map((sug) => (
                <TouchableOpacity
                  key={sug}
                  style={s.chip}
                  activeOpacity={0.8}
                  onPress={() => handleSend(sug)}
                >
                  <Text style={s.chipText}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything…"
            placeholderTextColor={colors.ink3}
            multiline
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color={colors.accentInk} size="small" />
            ) : (
              <Ionicons name="arrow-up" size={18} color={colors.accentInk} />
            )}
          </TouchableOpacity>
        </View>
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
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: c.line,
      paddingHorizontal: Spacing[5],
    },
    headerTitle: { color: c.ink, fontSize: 16, fontWeight: "600", letterSpacing: -0.3 },
    newChatBtn: {
      width: 34,
      height: 34,
      borderRadius: Radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    welcomeScroll: {
      flexGrow: 1,
      justifyContent: "center",
      paddingHorizontal: Spacing[5],
      paddingVertical: Spacing[8],
      gap: Spacing[6],
    },
    welcomeHead: { alignItems: "center", gap: Spacing[2] },
    logoBadge: {
      width: 52,
      height: 52,
      borderRadius: Radius.lg,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing[2],
    },
    welcomeTitle: {
      color: c.ink,
      fontSize: 24,
      fontWeight: "700",
      letterSpacing: -0.5,
      textAlign: "center",
    },
    welcomeSub: { color: c.ink2, fontSize: 14, textAlign: "center" },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing[3] },
    card: {
      width: "47%",
      flexGrow: 1,
      backgroundColor: c.panel,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: Radius.lg,
      padding: Spacing[4],
      gap: Spacing[2],
      minHeight: 88,
    },
    cardTitle: { color: c.ink, fontSize: 13, fontWeight: "600", lineHeight: 18 },
    chips: { gap: Spacing[2] },
    chip: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
      alignSelf: "flex-start",
    },
    chipText: { color: c.ink2, fontSize: 13 },
    msgList: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[4], gap: Spacing[3] },
    bubble: {
      maxWidth: "82%",
      borderRadius: Radius.lg,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    userBubble: { alignSelf: "flex-end", backgroundColor: c.accent },
    aiBubble: {
      alignSelf: "flex-start",
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.line,
    },
    typing: { paddingVertical: 14, paddingHorizontal: 18 },
    userText: { color: c.accentInk, fontSize: 14, lineHeight: 20 },
    aiText: { color: c.ink, fontSize: 14, lineHeight: 20 },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: Spacing[2],
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
      borderTopWidth: 1,
      borderTopColor: c.line,
      backgroundColor: c.bg,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: Radius.xl,
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
      color: c.ink,
      fontSize: 15,
      backgroundColor: c.surface,
      maxHeight: 120,
    },
    sendBtn: {
      width: 38,
      height: 38,
      borderRadius: Radius.full,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: { opacity: 0.4 },
  });

import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import { useChatStore } from "@/stores/chat-store";
import type { ChatMessage } from "@/types";

export default function AgentScreen() {
  const colors = useTheme();
  const [input, setInput] = useState("");
  const flatRef = useRef<FlatList<ChatMessage>>(null);

  const activeMessages = useChatStore((s) => s.activeMessages());
  const sending = useChatStore((s) => s.sending);
  const send = useChatStore((s) => s.sendMessage);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    try {
      await send(text);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // error already handled in store
    }
  }, [input, sending, send]);

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.kav}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>AI Agent</Text>
        </View>

        {/* Messages */}
        {activeMessages.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="sparkles" size={36} color={colors.accent} />
            <Text style={s.emptyTitle}>Inboxly AI</Text>
            <Text style={s.emptySub}>
              Ask me to summarize your inbox, schedule a meeting, or draft a reply.
            </Text>
          </View>
        ) : (
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
          />
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
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
            onPress={handleSend}
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
      borderBottomWidth: 1,
      borderBottomColor: c.line,
      paddingHorizontal: Spacing[5],
      justifyContent: "center",
    },
    headerTitle: { color: c.ink, fontSize: 16, fontWeight: "600", letterSpacing: -0.3 },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing[8],
      gap: Spacing[3],
    },
    emptyTitle: { color: c.ink, fontSize: 18, fontWeight: "600", textAlign: "center" },
    emptySub: { color: c.ink3, fontSize: 14, textAlign: "center", lineHeight: 20 },
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

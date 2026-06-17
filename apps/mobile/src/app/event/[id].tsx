import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import { deleteCalendarEvent, getCalendarEvent } from "@/lib/api";
import { useCalendarStore } from "@/stores/calendar-store";
import { calendarColor, eventStart, formatDay, formatRange, isAllDay } from "@/lib/calendar-format";
import type { CalendarEventSummary } from "@/types";

function InfoRow({
  icon,
  children,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  children: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colors: any;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Spacing[3] }}>
      <Ionicons name={icon} size={18} color={colors.ink3} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export default function EventDetailScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const cached = useCalendarStore((st) => st.events.find((e) => e.id === id));
  const [event, setEvent] = useState<CalendarEventSummary | undefined>(cached);
  const [loading, setLoading] = useState(!cached);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getCalendarEvent(id)
      .then(({ event: full }) => {
        if (active) setEvent(full);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  function confirmDelete() {
    Alert.alert("Delete event", "Remove this event from your calendar?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    if (!id || deleting) return;
    setDeleting(true);
    try {
      await deleteCalendarEvent(id);
      useCalendarStore.setState((st) => ({ events: st.events.filter((e) => e.id !== id) }));
      router.back();
    } catch {
      setDeleting(false);
      Alert.alert("Couldn't delete", "Please try again.");
    }
  }

  const s = styles(colors);
  const start = event ? eventStart(event) : null;
  const color = calendarColor(event?.calendarId);
  const attendees = (event?.attendees ?? []).filter((a) => a.email);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={s.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={s.headerSpacer} />
        <TouchableOpacity
          onPress={confirmDelete}
          hitSlop={8}
          style={s.headerBtn}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.danger} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          )}
        </TouchableOpacity>
      </View>

      {loading && !event ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : !event ? (
        <View style={s.center}>
          <Ionicons name="calendar-outline" size={36} color={colors.ink3} />
          <Text style={s.muted}>Couldn&apos;t load this event</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          <View style={s.titleRow}>
            <View style={[s.dot, { backgroundColor: color }]} />
            <Text style={s.title}>{event.summary ?? "Untitled event"}</Text>
          </View>

          <View style={s.card}>
            <InfoRow icon="time-outline" colors={colors}>
              <Text style={s.infoPrimary}>{start ? formatDay(start) : "—"}</Text>
              <Text style={s.infoSecondary}>
                {isAllDay(event) ? "All day" : formatRange(event)}
              </Text>
            </InfoRow>

            {event.location ? (
              <>
                <View style={s.divider} />
                <InfoRow icon="location-outline" colors={colors}>
                  <Text style={s.infoPrimary}>{event.location}</Text>
                </InfoRow>
              </>
            ) : null}

            {event.hangoutLink ? (
              <>
                <View style={s.divider} />
                <InfoRow icon="videocam-outline" colors={colors}>
                  <TouchableOpacity onPress={() => Linking.openURL(event.hangoutLink!)}>
                    <Text style={s.link}>Join video call</Text>
                  </TouchableOpacity>
                </InfoRow>
              </>
            ) : null}

            {attendees.length > 0 ? (
              <>
                <View style={s.divider} />
                <InfoRow icon="people-outline" colors={colors}>
                  <Text style={s.infoPrimary}>
                    {attendees.length} guest{attendees.length === 1 ? "" : "s"}
                  </Text>
                  {attendees.slice(0, 6).map((a) => (
                    <Text key={a.email} style={s.infoSecondary} numberOfLines={1}>
                      {a.displayName ?? a.email}
                    </Text>
                  ))}
                </InfoRow>
              </>
            ) : null}
          </View>

          {event.description ? (
            <View style={s.card}>
              <Text style={s.sectionLabel}>Description</Text>
              <Text style={s.description} selectable>
                {event.description}
              </Text>
            </View>
          ) : null}
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
    titleRow: { flexDirection: "row", alignItems: "center", gap: Spacing[3] },
    dot: { width: 12, height: 12, borderRadius: 6 },
    title: { flex: 1, color: c.ink, fontSize: 20, fontWeight: "700", letterSpacing: -0.4 },
    card: {
      backgroundColor: c.panel,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: Radius.lg,
      padding: Spacing[4],
      gap: Spacing[3],
    },
    divider: { height: 1, backgroundColor: c.line },
    infoPrimary: { color: c.ink, fontSize: 14, fontWeight: "500" },
    infoSecondary: { color: c.ink3, fontSize: 13, marginTop: 1 },
    link: { color: c.accent, fontSize: 14, fontWeight: "500" },
    sectionLabel: {
      color: c.ink3,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    description: { color: c.ink2, fontSize: 14, lineHeight: 21 },
  });

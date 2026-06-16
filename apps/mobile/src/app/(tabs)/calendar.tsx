import { useEffect, useMemo } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import { useCalendarStore } from "@/stores/calendar-store";
import type { CalendarEventSummary } from "@/types";

const ACCENT_PALETTE = ["#3a7bd5", "#1d9e75", "#6366f1", "#e08e3c", "#9b59b6", "#2c8c84"];

function calendarColor(calendarId?: string) {
  if (!calendarId) return ACCENT_PALETTE[0]!;
  let h = 0;
  for (let i = 0; i < calendarId.length; i++) h = (h * 31 + calendarId.charCodeAt(i)) | 0;
  return ACCENT_PALETTE[Math.abs(h) % ACCENT_PALETTE.length]!;
}

function eventStart(e: CalendarEventSummary): Date | null {
  const raw = e.start?.dateTime ?? e.start?.date;
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function formatRange(e: CalendarEventSummary): string {
  const start = eventStart(e);
  if (!start) return "";
  if (e.start?.date && !e.start?.dateTime) return "All day";
  const endRaw = e.end?.dateTime ?? e.end?.date;
  const startStr = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (!endRaw) return startStr;
  const end = new Date(endRaw);
  const endStr = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${startStr} – ${endStr}`;
}

function groupByDay(
  events: CalendarEventSummary[],
): { title: string; data: CalendarEventSummary[] }[] {
  const map = new Map<string, CalendarEventSummary[]>();
  for (const e of events) {
    const s = eventStart(e);
    if (!s) continue;
    const key = s.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 14) // show next 2 weeks
    .map(([title, data]) => ({ title, data }));
}

export default function CalendarScreen() {
  const colors = useTheme();
  const { events, loaded, loadEvents } = useCalendarStore();

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const groups = useMemo(() => {
    const today = new Date().toDateString();
    const upcoming = events.filter((e) => {
      const s = eventStart(e);
      return s && s.getTime() >= new Date().setHours(0, 0, 0, 0);
    });
    return groupByDay(upcoming);
  }, [events]);

  const today = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Calendar</Text>
        <Text style={s.headerSub}>{today}</Text>
      </View>

      {!loaded ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : groups.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="calendar-outline" size={36} color={colors.ink3} />
          <Text style={s.emptyText}>No upcoming events</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.title}
          contentContainerStyle={s.list}
          renderItem={({ item: group }) => (
            <View>
              <Text style={s.dayLabel}>{group.title}</Text>
              {group.data.map((event) => {
                const color = calendarColor(event.calendarId);
                return (
                  <View key={event.id} style={s.eventCard}>
                    <View style={[s.accentBar, { backgroundColor: color }]} />
                    <View style={s.eventBody}>
                      <Text style={s.eventTitle} numberOfLines={1}>
                        {event.summary ?? "Untitled event"}
                      </Text>
                      <Text style={s.eventTime}>{formatRange(event)}</Text>
                      {(event.hangoutLink || event.location) && (
                        <View style={s.eventMeta}>
                          <Ionicons
                            name={event.hangoutLink ? "videocam-outline" : "location-outline"}
                            size={12}
                            color={colors.ink3}
                          />
                          <Text style={s.eventMetaText} numberOfLines={1}>
                            {event.hangoutLink ? "Video call" : event.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
      paddingHorizontal: Spacing[5],
      paddingVertical: Spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    headerTitle: { color: c.ink, fontSize: 16, fontWeight: "600", letterSpacing: -0.3 },
    headerSub: { color: c.ink3, fontSize: 13, marginTop: 2 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing[3] },
    emptyText: { color: c.ink3, fontSize: 14 },
    list: { padding: Spacing[4], gap: Spacing[2] },
    dayLabel: {
      color: c.ink2,
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: Spacing[4],
      marginBottom: Spacing[2],
    },
    eventCard: {
      flexDirection: "row",
      backgroundColor: c.surface,
      borderRadius: Radius.md,
      marginBottom: Spacing[2],
      overflow: "hidden",
    },
    accentBar: { width: 3, borderRadius: 2 },
    eventBody: { flex: 1, padding: Spacing[3], gap: 3 },
    eventTitle: { color: c.ink, fontSize: 13, fontWeight: "600" },
    eventTime: { color: c.ink3, fontSize: 12 },
    eventMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    eventMetaText: { color: c.ink3, fontSize: 11, flex: 1 },
  });

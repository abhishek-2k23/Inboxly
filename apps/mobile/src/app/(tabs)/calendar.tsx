import { useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import { useCalendarStore } from "@/stores/calendar-store";
import { calendarColor, eventStart, formatDay, formatRange } from "@/lib/calendar-format";
import type { CalendarEventSummary } from "@/types";

function groupByDay(
  events: CalendarEventSummary[],
): { title: string; data: CalendarEventSummary[] }[] {
  const map = new Map<string, { date: Date; data: CalendarEventSummary[] }>();
  for (const e of events) {
    const s = eventStart(e);
    if (!s) continue;
    const key = formatDay(s);
    if (!map.has(key)) map.set(key, { date: s, data: [] });
    map.get(key)!.data.push(e);
  }
  return Array.from(map.entries())
    .sort(([, a], [, b]) => a.date.getTime() - b.date.getTime())
    .slice(0, 14)
    .map(([title, { data }]) => ({ title, data }));
}

export default function CalendarScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { events, loaded, loadEvents } = useCalendarStore();

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const groups = useMemo(() => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const upcoming = events.filter((e) => {
      const s = eventStart(e);
      return s && s.getTime() >= startOfToday;
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
    <SafeAreaView style={s.safe} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerText}>
          <Text style={s.headerTitle}>Calendar</Text>
          <Text style={s.headerSub}>{today}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push("/event/new")} hitSlop={6}>
          <Ionicons name="add" size={22} color={colors.accentInk} />
        </TouchableOpacity>
      </View>

      {!loaded ? (
        <View style={s.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : groups.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="calendar-outline" size={36} color={colors.ink3} />
          <Text style={s.emptyText}>No upcoming events</Text>
          <TouchableOpacity style={s.emptyCta} onPress={() => router.push("/event/new")}>
            <Text style={s.emptyCtaText}>Create an event</Text>
          </TouchableOpacity>
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
                  <TouchableOpacity
                    key={event.id}
                    style={s.eventCard}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({ pathname: "/event/[id]", params: { id: event.id } })
                    }
                  >
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
                  </TouchableOpacity>
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
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing[5],
      paddingVertical: Spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: c.line,
    },
    headerText: { flex: 1 },
    headerTitle: { color: c.ink, fontSize: 16, fontWeight: "600", letterSpacing: -0.3 },
    headerSub: { color: c.ink3, fontSize: 13, marginTop: 2 },
    addBtn: {
      width: 36,
      height: 36,
      borderRadius: Radius.full,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing[3] },
    emptyText: { color: c.ink3, fontSize: 14 },
    emptyCta: {
      marginTop: Spacing[2],
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[2],
    },
    emptyCtaText: { color: c.accent, fontSize: 14, fontWeight: "500" },
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
      backgroundColor: c.panel,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: Radius.md,
      marginBottom: Spacing[2],
      overflow: "hidden",
    },
    accentBar: { width: 3 },
    eventBody: { flex: 1, padding: Spacing[3], gap: 3 },
    eventTitle: { color: c.ink, fontSize: 13, fontWeight: "600" },
    eventTime: { color: c.ink3, fontSize: 12 },
    eventMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
    eventMetaText: { color: c.ink3, fontSize: 11, flex: 1 },
  });

import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";
import { createCalendarEvent } from "@/lib/api";
import { useCalendarStore } from "@/stores/calendar-store";

const pad = (n: number) => String(n).padStart(2, "0");

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Next top of the hour, as HH:MM. */
function nextHour(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function plusHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (h === undefined || m === undefined) return time;
  const d = new Date();
  d.setHours(h + 1, m, 0, 0);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Builds an RFC3339 timestamp with the device's UTC offset. */
function toRfc3339(dateStr: string, timeStr: string): string | null {
  const dm = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const tm = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!dm || !tm) return null;
  const [, y, mo, d] = dm.map(Number);
  const [, hh, mm] = tm.map(Number);
  if (hh! > 23 || mm! > 59) return null;
  const local = new Date(y!, mo! - 1, d!, hh!, mm!);
  if (isNaN(local.getTime())) return null;
  const off = -local.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const offH = pad(Math.floor(Math.abs(off) / 60));
  const offM = pad(Math.abs(off) % 60);
  return `${dateStr}T${pad(hh!)}:${pad(mm!)}:00${sign}${offH}:${offM}`;
}

export default function NewEventScreen() {
  const colors = useTheme();
  const router = useRouter();
  const loadEvents = useCalendarStore((st) => st.loadEvents);

  const defaultStart = useMemo(nextHour, []);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayStr());
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(plusHour(defaultStart));
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [addMeet, setAddMeet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const canSave = title.trim().length > 0 && !saving;

  async function handleSave() {
    if (!canSave) return;
    const startIso = toRfc3339(date, startTime);
    const endIso = toRfc3339(date, endTime);
    if (!startIso || !endIso) {
      setError("Use date YYYY-MM-DD and time HH:MM (24h).");
      return;
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setError("End time must be after the start time.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createCalendarEvent({
        summary: title.trim(),
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        start: { dateTime: startIso, timeZone: tz },
        end: { dateTime: endIso, timeZone: tz },
        addMeetLink: addMeet,
      });
      await loadEvents();
      router.back();
    } catch {
      setError("Couldn't create the event. Please try again.");
      setSaving(false);
    }
  }

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.kav}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={s.headerBtn}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>New event</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            style={[s.saveBtn, !canSave && s.saveBtnDisabled]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.accentInk} />
            ) : (
              <Text style={s.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.field}>
            <Text style={s.label}>Title</Text>
            <TextInput
              style={s.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              placeholderTextColor={colors.ink3}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Date</Text>
            <TextInput
              style={s.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.ink3}
              autoCapitalize="none"
            />
          </View>

          <View style={s.row}>
            <View style={[s.field, s.flex1]}>
              <Text style={s.label}>Start</Text>
              <TextInput
                style={s.input}
                value={startTime}
                onChangeText={(t) => {
                  setStartTime(t);
                  setEndTime(plusHour(t));
                }}
                placeholder="HH:MM"
                placeholderTextColor={colors.ink3}
              />
            </View>
            <View style={[s.field, s.flex1]}>
              <Text style={s.label}>End</Text>
              <TextInput
                style={s.input}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:MM"
                placeholderTextColor={colors.ink3}
              />
            </View>
          </View>

          <View style={s.field}>
            <Text style={s.label}>Location</Text>
            <TextInput
              style={s.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Add a location"
              placeholderTextColor={colors.ink3}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Description</Text>
            <TextInput
              style={[s.input, s.bodyInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add details"
              placeholderTextColor={colors.ink3}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={s.toggleRow}>
            <View style={s.toggleText}>
              <Ionicons name="videocam-outline" size={18} color={colors.ink2} />
              <Text style={s.toggleLabel}>Add Google Meet link</Text>
            </View>
            <Switch
              value={addMeet}
              onValueChange={setAddMeet}
              trackColor={{ true: colors.accent, false: colors.lineStrong }}
              thumbColor="#fff"
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
    saveBtn: {
      backgroundColor: c.accent,
      borderRadius: Radius.full,
      paddingHorizontal: Spacing[5],
      height: 34,
      minWidth: 64,
      alignItems: "center",
      justifyContent: "center",
    },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { color: c.accentInk, fontSize: 14, fontWeight: "600" },
    scroll: { padding: Spacing[5], gap: Spacing[4] },
    row: { flexDirection: "row", gap: Spacing[3] },
    flex1: { flex: 1 },
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
    bodyInput: { minHeight: 110 },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.panel,
      borderWidth: 1,
      borderColor: c.line,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing[4],
      paddingVertical: Spacing[3],
    },
    toggleText: { flexDirection: "row", alignItems: "center", gap: Spacing[2] },
    toggleLabel: { color: c.ink, fontSize: 14 },
    error: { color: c.danger, fontSize: 13 },
  });

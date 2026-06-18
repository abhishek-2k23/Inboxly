import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing } from "@/constants/theme";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const colors = useTheme();
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (!isLoaded || loading) return;
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed. Check your credentials.";
      Alert.alert("Sign in failed", msg);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, loading, signIn, email, password, setActive, router]);

  const handleGoogleSignIn = useCallback(async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      const redirectUrl = Linking.createURL("/");
      const { createdSessionId, setActive: sa } = await startOAuthFlow({ redirectUrl });
      if (createdSessionId && sa) {
        await sa({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google sign in failed.";
      Alert.alert("Google sign in failed", msg);
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLoading, startOAuthFlow, router]);

  const s = styles(colors);

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.kav}>
        <View style={s.container}>
          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.logoBox}>
              <Text style={s.logoIcon}>✉</Text>
            </View>
            <Text style={s.logoText}>Inboxly</Text>
          </View>

          <Text style={s.heading}>Welcome back</Text>
          <Text style={s.sub}>Sign in to your workspace</Text>

          {/* Email */}
          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.ink3}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.ink3}
              secureTextEntry
            />
          </View>

          {/* Sign in button */}
          <TouchableOpacity style={s.primaryBtn} onPress={handleSignIn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.accentInk} />
            ) : (
              <Text style={s.primaryBtnText}>Sign in</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Google */}
          <TouchableOpacity
            style={s.googleBtn}
            onPress={handleGoogleSignIn}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.ink} />
            ) : (
              <Text style={s.googleBtnText}>Continue with Google</Text>
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
    container: {
      flex: 1,
      paddingHorizontal: Spacing[6],
      paddingTop: Spacing[8],
      gap: Spacing[4],
    },
    logoWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[2],
      marginBottom: Spacing[4],
    },
    logoBox: {
      width: 32,
      height: 32,
      borderRadius: Radius.sm,
      backgroundColor: c.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    logoIcon: { color: c.accentInk, fontSize: 16 },
    logoText: { color: c.ink, fontSize: 18, fontWeight: "600", letterSpacing: -0.3 },
    heading: { color: c.ink, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
    sub: { color: c.ink2, fontSize: 15, marginTop: -Spacing[2] },
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
    primaryBtn: {
      backgroundColor: c.accent,
      borderRadius: Radius.md,
      paddingVertical: Spacing[4],
      alignItems: "center",
      marginTop: Spacing[2],
    },
    primaryBtnText: { color: c.accentInk, fontSize: 15, fontWeight: "600" },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing[3],
      marginVertical: Spacing[1],
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: c.line },
    dividerText: { color: c.ink3, fontSize: 13 },
    googleBtn: {
      borderWidth: 1,
      borderColor: c.lineStrong,
      borderRadius: Radius.md,
      paddingVertical: Spacing[4],
      alignItems: "center",
    },
    googleBtnText: { color: c.ink, fontSize: 15, fontWeight: "500" },
  });

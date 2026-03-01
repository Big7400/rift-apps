import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import { router } from "expo-router";
import { useSelfCareStore } from "../../store/selfcare";

const PEACH = "#FF8C69";
const CREAM = "#FFF8F0";
const BROWN = "#4A2C2A";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setUser = useSelfCareStore((s) => s.setUser);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const API = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Login failed");
      setUser(data.user);
      router.replace("/(tabs)/home");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🐾</Text>
        <Text style={styles.title}>Welcome back!</Text>
        <Text style={styles.sub}>Your puppy missed you.</Text>

        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#B8957E" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#B8957E" />

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Logging in..." : "Log In"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={styles.link}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CREAM },
  content: { flex: 1, padding: 28, justifyContent: "center", gap: 14 },
  emoji: { fontSize: 60, textAlign: "center" },
  title: { fontSize: 28, fontWeight: "800", color: BROWN, textAlign: "center" },
  sub: { fontSize: 15, color: "#7A5C58", textAlign: "center", marginBottom: 8 },
  input: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, color: BROWN, borderWidth: 1.5, borderColor: "#F0CEBA" },
  btn: { backgroundColor: PEACH, borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { textAlign: "center", color: PEACH, fontWeight: "600", marginTop: 8 },
});

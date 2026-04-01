import { StatusBar } from "expo-status-bar";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  getSupabaseClient,
  isSupabaseConfigured,
  type InquiryStatus,
  type InquiryRow,
} from "./src/lib/supabase";

const DEFAULT_ADMIN_EMAIL = "odipex986@gmail.com";

const supabase = isSupabaseConfigured ? getSupabaseClient() : null;

function formatTimestamp(timestamp: string) {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}

function trimMessage(message: string) {
  if (message.length <= 120) {
    return message;
  }

  return `${message.slice(0, 117)}...`;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "warm" | "success";
}) {
  return (
    <View
      style={[
        styles.badge,
        tone === "warm" ? styles.badgeWarm : null,
        tone === "success" ? styles.badgeSuccess : null,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          tone === "warm" ? styles.badgeWarmText : null,
          tone === "success" ? styles.badgeSuccessText : null,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateDescription}>{description}</Text>
    </View>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRow | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<InquiryStatus | null>(null);

  async function loadInquiries(showSpinner = true) {
    if (!supabase) {
      return;
    }

    if (showSpinner) {
      setLoadingInquiries(true);
    }

    setListError(null);

    const { data, error } = await supabase
      .from("contact_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setListError(
        "Could not load inquiries. Check your admin access policy and sign in with an allowed admin email.",
      );
      console.error("Failed to load inquiries", error);
    } else {
      setInquiries(data ?? []);
    }

    if (showSpinner) {
      setLoadingInquiries(false);
    }
  }

  useEffect(() => {
    if (!supabase) {
      setBooting(false);
      return;
    }

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) {
          return;
        }

        if (error) {
          setAuthError(error.message);
        }

        setSession(data.session ?? null);
        setBooting(false);

        if (data.session) {
          void loadInquiries();
        }
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setAuthError(
          error instanceof Error ? error.message : "Could not restore the admin session.",
        );
        setBooting(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSelectedInquiry(null);

      if (nextSession) {
        void loadInquiries();
      } else {
        setInquiries([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignIn() {
    if (!supabase) {
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthError(error.message);
    }

    setAuthLoading(false);
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Sign out failed", error.message);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadInquiries(false);
    setRefreshing(false);
  }

  async function handleStatusChange(nextStatus: InquiryStatus) {
    if (!supabase || !selectedInquiry) {
      return;
    }

    setUpdatingStatus(nextStatus);

    const { data, error } = await supabase
      .from("contact_inquiries")
      .update({ status: nextStatus })
      .eq("id", selectedInquiry.id)
      .select("*")
      .single();

    if (error) {
      Alert.alert("Update failed", error.message);
      setUpdatingStatus(null);
      return;
    }

    setInquiries((current) =>
      current.map((inquiry) => (inquiry.id === data.id ? data : inquiry)),
    );
    setSelectedInquiry(data);
    setUpdatingStatus(null);
  }

  async function openLink(url: string) {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert("Unavailable", "This action is not available on this device.");
      return;
    }

    await Linking.openURL(url);
  }

  const newCount = inquiries.filter((inquiry) => inquiry.status === "new").length;
  const contactedCount = inquiries.filter(
    (inquiry) => inquiry.status === "contacted",
  ).length;

  if (!isSupabaseConfigured) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.screen}>
          <View style={styles.heroCard}>
            <Badge label="Setup required" tone="warm" />
            <Text style={styles.heroTitle}>Heartha Admin</Text>
            <Text style={styles.heroSubtitle}>
              Add the mobile env vars before launching the app.
            </Text>
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>Required env vars</Text>
              <Text style={styles.calloutCode}>EXPO_PUBLIC_SUPABASE_URL</Text>
              <Text style={styles.calloutCode}>
                EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (booting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.loadingScreen}>
          <ActivityIndicator color="#d9b06f" size="large" />
          <Text style={styles.loadingText}>Opening Heartha Admin...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={styles.loginScreen}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <Badge label="Admin access" tone="warm" />
            <Text style={styles.heroTitle}>Heartha Admin</Text>
            <Text style={styles.heroSubtitle}>
              Sign in with an approved Supabase admin account to review contact inquiries.
            </Text>

            <View style={styles.formCard}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="admin@example.com"
                placeholderTextColor="#8f8b84"
                style={styles.input}
                value={email}
              />

              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                onChangeText={setPassword}
                placeholder="Your admin password"
                placeholderTextColor="#8f8b84"
                secureTextEntry
                style={styles.input}
                value={password}
              />

              {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

              <Pressable
                disabled={authLoading}
                onPress={() => void handleSignIn()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed ? styles.primaryButtonPressed : null,
                  authLoading ? styles.buttonDisabled : null,
                ]}
              >
                {authLoading ? (
                  <ActivityIndicator color="#1a1510" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </Pressable>

              <Text style={styles.helperText}>
                Create this admin user in Supabase Auth first, then run the admin access SQL so only your approved email can read inquiries.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        <FlatList
          contentContainerStyle={styles.listContent}
          data={inquiries}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              onRefresh={() => void handleRefresh()}
              refreshing={refreshing}
              tintColor="#d9b06f"
            />
          }
          ListEmptyComponent={
            loadingInquiries ? (
              <View style={styles.loadingBlock}>
                <ActivityIndicator color="#d9b06f" size="large" />
                <Text style={styles.loadingText}>Loading inquiries...</Text>
              </View>
            ) : (
              <EmptyState
                title="No inquiries yet"
                description="New website leads will appear here as soon as someone submits the contact form."
              />
            )
          }
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <View style={styles.headerRow}>
                <View>
                  <Text style={styles.dashboardEyebrow}>Live inbox</Text>
                  <Text style={styles.dashboardTitle}>Heartha Admin</Text>
                  <Text style={styles.dashboardSubtitle}>
                    Signed in as {session.user.email ?? "admin"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => void handleSignOut()}
                  style={({ pressed }) => [
                    styles.ghostButton,
                    pressed ? styles.ghostButtonPressed : null,
                  ]}
                >
                  <Text style={styles.ghostButtonText}>Sign Out</Text>
                </Pressable>
              </View>

              <View style={styles.statRow}>
                <StatCard label="Total" value={String(inquiries.length)} />
                <StatCard label="New" value={String(newCount)} />
                <StatCard label="Contacted" value={String(contactedCount)} />
              </View>

              {listError ? <Text style={styles.errorText}>{listError}</Text> : null}
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedInquiry(item)}
              style={({ pressed }) => [
                styles.inquiryCard,
                pressed ? styles.inquiryCardPressed : null,
              ]}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.cardTitleWrap}>
                  <Text style={styles.cardTitle}>{item.full_name}</Text>
                  <Text style={styles.cardMeta}>{item.email}</Text>
                </View>
                <Badge
                  label={item.status}
                  tone={item.status === "contacted" ? "success" : "warm"}
                />
              </View>

              <View style={styles.cardTagRow}>
                <Badge label={item.project_type} />
                <Text style={styles.cardMeta}>{formatTimestamp(item.created_at)}</Text>
              </View>

              <Text style={styles.cardMessage}>{trimMessage(item.message)}</Text>
            </Pressable>
          )}
        />
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setSelectedInquiry(null)}
        transparent
        visible={selectedInquiry !== null}
      >
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {selectedInquiry?.full_name ?? "Inquiry"}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedInquiry ? formatTimestamp(selectedInquiry.created_at) : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedInquiry(null)}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed ? styles.closeButtonPressed : null,
                  ]}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </Pressable>
              </View>

              {selectedInquiry ? (
                <>
                  <View style={styles.detailGrid}>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailLabel}>Email</Text>
                      <Text style={styles.detailValue}>{selectedInquiry.email}</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailLabel}>Project</Text>
                      <Text style={styles.detailValue}>
                        {selectedInquiry.project_type}
                      </Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailLabel}>Company</Text>
                      <Text style={styles.detailValue}>
                        {selectedInquiry.company || "Not provided"}
                      </Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text style={styles.detailValue}>{selectedInquiry.status}</Text>
                    </View>
                  </View>

                  <View style={styles.messageBlock}>
                    <Text style={styles.detailLabel}>Message</Text>
                    <Text style={styles.messageText}>{selectedInquiry.message}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      onPress={() =>
                        void openLink(`mailto:${encodeURIComponent(selectedInquiry.email)}`)
                      }
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        pressed ? styles.secondaryButtonPressed : null,
                      ]}
                    >
                      <Text style={styles.secondaryButtonText}>Email Client</Text>
                    </Pressable>

                    <Pressable
                      disabled={updatingStatus === "contacted"}
                      onPress={() => void handleStatusChange("contacted")}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        styles.flexButton,
                        pressed ? styles.primaryButtonPressed : null,
                        updatingStatus === "contacted" ? styles.buttonDisabled : null,
                      ]}
                    >
                      {updatingStatus === "contacted" ? (
                        <ActivityIndicator color="#1a1510" />
                      ) : (
                        <Text style={styles.primaryButtonText}>Mark Contacted</Text>
                      )}
                    </Pressable>
                  </View>

                  <Pressable
                    disabled={updatingStatus === "new"}
                    onPress={() => void handleStatusChange("new")}
                    style={({ pressed }) => [
                      styles.linkButton,
                      pressed ? styles.linkButtonPressed : null,
                      updatingStatus === "new" ? styles.buttonDisabled : null,
                    ]}
                  >
                    <Text style={styles.linkButtonText}>Move back to new</Text>
                  </Pressable>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f0d0a",
  },
  screen: {
    flex: 1,
    backgroundColor: "#0f0d0a",
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
    backgroundColor: "#0f0d0a",
  },
  loadingBlock: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 48,
  },
  loadingText: {
    color: "#f3eee6",
    fontSize: 15,
  },
  loginScreen: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#0f0d0a",
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#29231a",
    backgroundColor: "#17130f",
    padding: 24,
    gap: 20,
    shadowColor: "#000000",
    shadowOpacity: 0.24,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
  },
  heroTitle: {
    color: "#f7f1e8",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -1,
  },
  heroSubtitle: {
    color: "#b9b0a3",
    fontSize: 15,
    lineHeight: 24,
  },
  formCard: {
    gap: 12,
  },
  inputLabel: {
    color: "#e9ddca",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#342c21",
    backgroundColor: "#110f0b",
    color: "#f7f1e8",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorText: {
    color: "#ff9783",
    fontSize: 14,
    lineHeight: 20,
  },
  helperText: {
    color: "#9b9489",
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#d9b06f",
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonPressed: {
    opacity: 0.88,
  },
  primaryButtonText: {
    color: "#1a1510",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#3a3126",
    backgroundColor: "#1b1711",
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonPressed: {
    opacity: 0.88,
  },
  secondaryButtonText: {
    color: "#f7f1e8",
    fontSize: 15,
    fontWeight: "600",
  },
  ghostButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#342c21",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ghostButtonPressed: {
    opacity: 0.82,
  },
  ghostButtonText: {
    color: "#f7f1e8",
    fontSize: 13,
    fontWeight: "600",
  },
  headerBlock: {
    gap: 18,
    marginBottom: 10,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  dashboardEyebrow: {
    color: "#d9b06f",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  dashboardTitle: {
    color: "#f7f1e8",
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -1,
  },
  dashboardSubtitle: {
    color: "#b9b0a3",
    fontSize: 14,
    marginTop: 6,
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2c251c",
    backgroundColor: "#17130f",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  statValue: {
    color: "#f7f1e8",
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    color: "#a69f93",
    fontSize: 12,
    marginTop: 6,
    textTransform: "uppercase",
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 12,
  },
  inquiryCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2d261d",
    backgroundColor: "#17130f",
    marginBottom: 12,
    padding: 18,
    gap: 14,
  },
  inquiryCardPressed: {
    opacity: 0.88,
  },
  cardTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitleWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: "#f7f1e8",
    fontSize: 18,
    fontWeight: "700",
  },
  cardMeta: {
    color: "#a69f93",
    fontSize: 13,
  },
  cardTagRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  cardMessage: {
    color: "#ddd2c1",
    fontSize: 14,
    lineHeight: 21,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3b3329",
    backgroundColor: "#211b14",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeWarm: {
    borderColor: "#684f22",
    backgroundColor: "#2f2414",
  },
  badgeSuccess: {
    borderColor: "#3b5e4d",
    backgroundColor: "#15231d",
  },
  badgeText: {
    color: "#d8cdc0",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  badgeWarmText: {
    color: "#f1c16f",
  },
  badgeSuccessText: {
    color: "#8ed0ae",
  },
  emptyState: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2d261d",
    backgroundColor: "#17130f",
    padding: 24,
    gap: 10,
  },
  emptyStateTitle: {
    color: "#f7f1e8",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyStateDescription: {
    color: "#a69f93",
    fontSize: 14,
    lineHeight: 22,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(8, 6, 4, 0.68)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "85%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "#2d261d",
    backgroundColor: "#17130f",
  },
  modalContent: {
    padding: 22,
    gap: 18,
  },
  modalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  modalTitle: {
    color: "#f7f1e8",
    fontSize: 24,
    fontWeight: "700",
  },
  modalSubtitle: {
    color: "#9f978a",
    fontSize: 13,
    marginTop: 6,
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3a3126",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  closeButtonPressed: {
    opacity: 0.82,
  },
  closeButtonText: {
    color: "#f7f1e8",
    fontSize: 13,
    fontWeight: "600",
  },
  detailGrid: {
    gap: 12,
  },
  detailCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2c251c",
    backgroundColor: "#110f0b",
    padding: 16,
    gap: 6,
  },
  detailLabel: {
    color: "#d9b06f",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  detailValue: {
    color: "#f7f1e8",
    fontSize: 16,
    lineHeight: 22,
  },
  messageBlock: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2c251c",
    backgroundColor: "#110f0b",
    padding: 18,
    gap: 10,
  },
  messageText: {
    color: "#e3d8c7",
    fontSize: 15,
    lineHeight: 24,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
  linkButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  linkButtonPressed: {
    opacity: 0.8,
  },
  linkButtonText: {
    color: "#b9b0a3",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  callout: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2d261d",
    backgroundColor: "#110f0b",
    padding: 18,
    gap: 10,
  },
  calloutTitle: {
    color: "#f7f1e8",
    fontSize: 16,
    fontWeight: "700",
  },
  calloutCode: {
    color: "#d9b06f",
    fontFamily: "monospace",
    fontSize: 13,
  },
});

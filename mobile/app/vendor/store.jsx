import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Typography } from "../../src/components/ui/Typography";
import { apiClient } from "../../src/api/client";
import { Save, Store, Lock, FileText, Wallet } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function VendorStoreScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [activeTab, setActiveTab] = useState("profile");

  const [form, setForm] = useState({
    storeName: "",
    description: "",
    phone: "",
    address: "",
    slug: "",
    gst: "",
    pan: "",
    payoutAccount: {
      accountName: "",
      accountNumber: "",
      bankName: "",
      ifsc: "",
    },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/vendor/profile");
        const data = response.data;
        setForm({
          storeName: data.storeName || "",
          description: data.description || "",
          phone: data.phone || "",
          address: data.address || "",
          slug: data.slug || "",
          gst: data.gst || "",
          pan: data.pan || "",
          payoutAccount: {
            accountName: data.payoutAccount?.accountName || "",
            accountNumber: data.payoutAccount?.accountNumber || "",
            bankName: data.payoutAccount?.bankName || "",
            ifsc: data.payoutAccount?.ifsc || "",
          },
        });
      } catch (e) {
        if (
          e.response?.status === 404 &&
          (e.response?.data?.detail?.includes("Vendor account not found") ||
            e.response?.data?.message?.includes("Vendor account not found"))
        ) {
          router.replace("/vendor/apply");
          return;
        }
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await apiClient.put("/vendor/profile", form);
      setSuccessMsg("Profile updated successfully");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message,
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await apiClient.put("/auth/vendor/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setSuccessMsg("Password updated successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message,
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Typography style={styles.title}>Store Settings</Typography>
        <Typography style={styles.subtitle}>
          Manage your vendor profile and security.
        </Typography>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          <TouchableOpacity
            style={[styles.tab, activeTab === "profile" && styles.tabActive]}
            onPress={() => setActiveTab("profile")}
          >
            <Store
              size={16}
              color={activeTab === "profile" ? "#1A1918" : "#8E8A85"}
            />
            <Typography
              style={[
                styles.tabText,
                activeTab === "profile" && styles.tabTextActive,
              ]}
            >
              Profile
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "business" && styles.tabActive]}
            onPress={() => setActiveTab("business")}
          >
            <FileText
              size={16}
              color={activeTab === "business" ? "#1A1918" : "#8E8A85"}
            />
            <Typography
              style={[
                styles.tabText,
                activeTab === "business" && styles.tabTextActive,
              ]}
            >
              Business Info
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "bank" && styles.tabActive]}
            onPress={() => setActiveTab("bank")}
          >
            <Wallet
              size={16}
              color={activeTab === "bank" ? "#1A1918" : "#8E8A85"}
            />
            <Typography
              style={[
                styles.tabText,
                activeTab === "bank" && styles.tabTextActive,
              ]}
            >
              Bank Details
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "security" && styles.tabActive]}
            onPress={() => setActiveTab("security")}
          >
            <Lock
              size={16}
              color={activeTab === "security" ? "#1A1918" : "#8E8A85"}
            />
            <Typography
              style={[
                styles.tabText,
                activeTab === "security" && styles.tabTextActive,
              ]}
            >
              Security
            </Typography>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorBox}>
            <Typography style={styles.errorText}>{error}</Typography>
          </View>
        )}
        {successMsg && (
          <View style={styles.successBox}>
            <Typography style={styles.successText}>{successMsg}</Typography>
          </View>
        )}

        {activeTab === "profile" && (
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>STORE NAME</Typography>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={form.storeName}
                  onChangeText={(val) => setForm({ ...form, storeName: val })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>
                STORE SLUG (Public URL)
              </Typography>
              <View style={styles.inputWrapper}>
                <Typography style={{ color: "#8E8A85" }}>
                  tryvia.com/store/
                </Typography>
                <TextInput
                  style={styles.input}
                  value={form.slug}
                  onChangeText={(val) =>
                    setForm({
                      ...form,
                      slug: val.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>
                STORE DESCRIPTION
              </Typography>
              <View
                style={[
                  styles.inputWrapper,
                  { height: 100, alignItems: "flex-start", paddingTop: 12 },
                ]}
              >
                <TextInput
                  style={[styles.input, { textAlignVertical: "top" }]}
                  value={form.description}
                  onChangeText={(val) => setForm({ ...form, description: val })}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={16} color="#FFFFFF" />
                  <Typography style={styles.saveBtnText}>
                    Save Profile
                  </Typography>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "business" && (
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>PHONE NUMBER</Typography>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={form.phone}
                  onChangeText={(val) => setForm({ ...form, phone: val })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>
                BUSINESS ADDRESS
              </Typography>
              <View
                style={[
                  styles.inputWrapper,
                  { height: 80, alignItems: "flex-start", paddingTop: 12 },
                ]}
              >
                <TextInput
                  style={[styles.input, { textAlignVertical: "top" }]}
                  value={form.address}
                  onChangeText={(val) => setForm({ ...form, address: val })}
                  multiline
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>GST NUMBER</Typography>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={form.gst}
                  onChangeText={(val) => setForm({ ...form, gst: val })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>PAN NUMBER</Typography>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={form.pan}
                  onChangeText={(val) => setForm({ ...form, pan: val })}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={16} color="#FFFFFF" />
                  <Typography style={styles.saveBtnText}>
                    Save Business Info
                  </Typography>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "bank" && (
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>
                ACCOUNT HOLDER NAME
              </Typography>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={form.payoutAccount.accountName}
                  onChangeText={(val) =>
                    setForm({
                      ...form,
                      payoutAccount: {
                        ...form.payoutAccount,
                        accountName: val,
                      },
                    })
                  }
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>
                BANK ACCOUNT NUMBER
              </Typography>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={form.payoutAccount.accountNumber}
                  onChangeText={(val) =>
                    setForm({
                      ...form,
                      payoutAccount: {
                        ...form.payoutAccount,
                        accountNumber: val,
                      },
                    })
                  }
                  secureTextEntry={form.payoutAccount.accountNumber.includes(
                    "XXXX",
                  )}
                  onFocus={() =>
                    setForm({
                      ...form,
                      payoutAccount: {
                        ...form.payoutAccount,
                        accountNumber: "",
                      },
                    })
                  }
                />
              </View>
              <Typography
                style={{
                  fontFamily: "Inter_500Medium",
                  fontSize: 11,
                  color: "#8E8A85",
                  marginTop: 4,
                }}
              >
                This will be securely masked upon saving.
              </Typography>
            </View>

            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>BANK NAME</Typography>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={form.payoutAccount.bankName}
                  onChangeText={(val) =>
                    setForm({
                      ...form,
                      payoutAccount: { ...form.payoutAccount, bankName: val },
                    })
                  }
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>IFSC CODE</Typography>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={form.payoutAccount.ifsc}
                  onChangeText={(val) =>
                    setForm({
                      ...form,
                      payoutAccount: { ...form.payoutAccount, ifsc: val },
                    })
                  }
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={16} color="#FFFFFF" />
                  <Typography style={styles.saveBtnText}>
                    Save Bank Details
                  </Typography>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeTab === "security" && (
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>
                CURRENT PASSWORD
              </Typography>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={passwordForm.currentPassword}
                  onChangeText={(val) =>
                    setPasswordForm({ ...passwordForm, currentPassword: val })
                  }
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>NEW PASSWORD</Typography>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={passwordForm.newPassword}
                  onChangeText={(val) =>
                    setPasswordForm({ ...passwordForm, newPassword: val })
                  }
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Typography style={styles.inputLabel}>
                CONFIRM NEW PASSWORD
              </Typography>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={passwordForm.confirmPassword}
                  onChangeText={(val) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: val })
                  }
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: "#D9383A" }]}
              onPress={handlePasswordChange}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Lock size={16} color="#FFFFFF" />
                  <Typography style={styles.saveBtnText}>
                    Update Password
                  </Typography>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: { padding: 16, paddingBottom: 16 },
  title: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 28,
    color: "#1A1918",
    marginBottom: 4,
  },
  subtitle: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#8E8A85" },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ECE7E1",
    marginBottom: 20,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginRight: 20,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#1A1918" },
  tabText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#8E8A85" },
  tabTextActive: { color: "#1A1918" },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ECE7E1",
  },
  inputGroup: { marginBottom: 16 },
  inputLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10.5,
    color: "#8E8A85",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF8F5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ECE7E1",
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#1A1918",
  },
  errorBox: {
    backgroundColor: "#FDECEC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F8B4B4",
    marginBottom: 16,
  },
  errorText: { color: "#D9383A", fontFamily: "Inter_500Medium", fontSize: 14 },
  successBox: {
    backgroundColor: "#E9F5EF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A3D9B8",
    marginBottom: 16,
  },
  successText: {
    color: "#318C59",
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1918",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 12,
  },
  saveBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});

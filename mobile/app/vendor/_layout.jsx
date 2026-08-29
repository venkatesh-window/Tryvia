import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Modal,
  SafeAreaView,
} from "react-native";
import { Stack, useRouter, usePathname, Redirect } from "expo-router";
import { useAuthStore } from "../../src/store/useAuthStore";
import { Typography } from "../../src/components/ui/Typography";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Store,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react-native";

export default function VendorLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isLoginRoute = pathname.includes("/vendor/login");

  // In a real implementation, we would check if the user is a vendor
  // For Phase 1, we just ensure they are logged in or redirect to /vendor/login
  if (!isAuthenticated && !isLoginRoute) {
    return <Redirect href="/vendor/login" />;
  }

  if (!isAuthenticated && !isLoginRoute) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  const navigateTo = (path) => {
    setIsSidebarOpen(false);
    router.push(path);
  };

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/vendor/dashboard" },
    { name: "Products", icon: Package, path: "/vendor/products" },
    { name: "Orders", icon: ShoppingBag, path: "/vendor/orders" },
    { name: "Store Profile", icon: Store, path: "/vendor/store" },
  ];

  const currentRoute = pathname;

  const SidebarContent = () => (
    <>
      <View style={styles.sidebarHeader}>
        <View style={styles.brandRow}>
          <Typography style={styles.brandTitle}>TryVia</Typography>
          {isMobile && (
            <TouchableOpacity
              onPress={() => setIsSidebarOpen(false)}
              style={styles.closeBtn}
            >
              <X size={24} color="#1A1918" />
            </TouchableOpacity>
          )}
        </View>
        <Typography style={styles.brandSubtitle}>VENDOR PORTAL</Typography>
      </View>

      <View style={styles.navMenu}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.path;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => navigateTo(item.path)}
            >
              <Icon size={20} color={isActive ? "#CB6D73" : "#8E8A85"} />
              <Typography
                style={[styles.navText, isActive && styles.navTextActive]}
              >
                {item.name}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sidebarFooter}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigateTo("/vendor/settings")}
        >
          <Settings size={20} color="#8E8A85" />
          <Typography style={styles.navText}>Settings</Typography>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setIsSidebarOpen(false);
            router.replace("/");
          }}
        >
          <LogOut size={20} color="#8E8A85" />
          <Typography style={styles.navText}>Logout</Typography>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Sidebar for Desktop / Tablet */}
        {!isLoginRoute && !isMobile && (
          <View style={styles.sidebar}>
            <SidebarContent />
          </View>
        )}

        {/* Mobile Header */}
        {!isLoginRoute && isMobile && (
          <View style={styles.mobileHeader}>
            <TouchableOpacity
              onPress={() => setIsSidebarOpen(true)}
              style={styles.menuBtn}
            >
              <Menu size={24} color="#1A1918" />
            </TouchableOpacity>
            <Typography style={styles.mobileBrandTitle}>
              TryVia Vendor
            </Typography>
            <View style={{ width: 24 }} /> {/* Spacer for centering */}
          </View>
        )}

        {/* Mobile Overlay Sidebar */}
        {!isLoginRoute && isMobile && (
          <Modal
            visible={isSidebarOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsSidebarOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={styles.modalDismiss}
                onPress={() => setIsSidebarOpen(false)}
              />
              <View style={styles.mobileSidebar}>
                <SidebarContent />
              </View>
            </View>
          </Modal>
        )}

        {/* Main Content Area */}
        <View
          style={[
            styles.mainContent,
            isLoginRoute && { backgroundColor: "#FAF8F5" },
          ]}
        >
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF8F5",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF8F5",
  },
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FAF8F5",
  },
  sidebar: {
    width: 260,
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderRightColor: "#ECE7E1",
    display: "flex",
    flexDirection: "column",
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeBtn: {
    padding: 4,
  },
  sidebarHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#ECE7E1",
  },
  brandTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 28,
    color: "#1A1918",
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#CB6D73",
    letterSpacing: 2,
    marginTop: 4,
  },
  navMenu: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: "#FCEEF0",
  },
  navText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#8E8A85",
  },
  navTextActive: {
    fontFamily: "Inter_600SemiBold",
    color: "#1A1918",
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#ECE7E1",
    gap: 8,
  },
  mainContent: {
    flex: 1,
    backgroundColor: "#FAF8F5",
    overflow: "hidden", // prevent scrolling issues
  },
  mobileHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ECE7E1",
    zIndex: 10,
  },
  menuBtn: {
    padding: 8,
    marginLeft: -8,
  },
  mobileBrandTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 20,
    color: "#1A1918",
  },
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalDismiss: {
    flex: 1,
  },
  mobileSidebar: {
    width: 280,
    backgroundColor: "#FFFFFF",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});

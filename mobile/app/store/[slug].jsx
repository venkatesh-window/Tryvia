import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Typography } from "../../src/components/ui/Typography";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Store, ArrowLeft } from "lucide-react-native";

export default function PublicVendorStoreScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const response = await fetch(
          `https://tryvia-ta57.onrender.com/api/v1/products/store/${slug}`,
        );
        if (!response.ok) {
          throw new Error("Store not found");
        }
        const data = await response.json();
        setVendor(data.vendor);
        setProducts(data.products);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchStore();
  }, [slug]);

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

  if (error || !vendor) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Store size={48} color="#ECE7E1" style={{ marginBottom: 16 }} />
        <Typography
          style={{
            color: "#1A1918",
            fontFamily: "Inter_600SemiBold",
            fontSize: 18,
          }}
        >
          Store Not Found
        </Typography>
        <Typography style={{ color: "#8E8A85", marginTop: 8 }}>
          {error || "This store is currently unavailable."}
        </Typography>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
          style={{
            marginTop: 24,
            padding: 12,
            backgroundColor: "#1A1918",
            borderRadius: 8,
          }}
        >
          <Typography style={{ color: "#FFFFFF" }}>Go Back</Typography>
        </TouchableOpacity>
      </View>
    );
  }

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.9}
      onPress={() => router.push(`/product/${item.numericId}`)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Typography style={styles.productBrand}>
          {item.brand?.name || vendor.storeName}
        </Typography>
        <Typography style={styles.productName} numberOfLines={2}>
          {item.name}
        </Typography>
        <Typography style={styles.productPrice}>
          ${item.fullPrice.toFixed(2)}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.bannerContainer}>
          {vendor.banner ? (
            <Image source={{ uri: vendor.banner }} style={styles.bannerImage} />
          ) : (
            <View style={styles.bannerPlaceholder} />
          )}

          <TouchableOpacity
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color="#1A1918" />
          </TouchableOpacity>
        </View>

        <View style={styles.storeHeader}>
          <View style={styles.logoContainer}>
            {vendor.logo ? (
              <Image source={{ uri: vendor.logo }} style={styles.logoImage} />
            ) : (
              <Store size={32} color="#8E8A85" />
            )}
          </View>

          <View style={styles.storeTitleContainer}>
            <Typography style={styles.storeName}>{vendor.storeName}</Typography>
            <Typography style={styles.storeMemberSince}>
              TRYVIA Partner since {new Date(vendor.createdAt).getFullYear()}
            </Typography>
          </View>
        </View>

        {vendor.description && (
          <View style={styles.descriptionContainer}>
            <Typography style={styles.descriptionText}>
              {vendor.description}
            </Typography>
          </View>
        )}

        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Typography style={styles.sectionTitle}>All Products</Typography>
            <Typography style={styles.sectionCount}>
              {products.length} items
            </Typography>
          </View>

          {products.length === 0 ? (
            <View style={styles.emptyState}>
              <Typography style={styles.emptyText}>
                This store hasn't added any products yet.
              </Typography>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {products.map((p) => (
                <View key={p._id} style={styles.gridItem}>
                  {renderProduct({ item: p })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  bannerContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: "#ECE7E1",
  },
  bannerImage: { width: "100%", height: "100%" },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#ECE7E1",
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    marginTop: -40,
    marginBottom: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#FAF8F5",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  logoImage: { width: "100%", height: "100%" },
  storeTitleContainer: { flex: 1, marginLeft: 16, paddingBottom: 4 },
  storeName: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 28,
    color: "#1A1918",
  },
  storeMemberSince: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: "#8E8A85",
    marginTop: 2,
  },
  descriptionContainer: { paddingHorizontal: 24, marginBottom: 32 },
  descriptionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#4A4846",
    lineHeight: 22,
  },
  productsSection: { paddingHorizontal: 24, paddingBottom: 60 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: "#1A1918",
  },
  sectionCount: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#8E8A85",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: { width: "48%", marginBottom: 20 },
  productCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  productImage: { width: "100%", height: 160, backgroundColor: "#F8F6F3" },
  productInfo: { padding: 12 },
  productBrand: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#8E8A85",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productName: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#1A1918",
    marginBottom: 8,
    height: 36,
  },
  productPrice: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#1A1918" },
  emptyState: { paddingVertical: 60, alignItems: "center" },
  emptyText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#8E8A85",
    fontStyle: "italic",
  },
});

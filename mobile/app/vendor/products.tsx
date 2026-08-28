import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { Typography } from '../../src/components/ui/Typography';
import { Search, Plus, Filter, MoreVertical } from 'lucide-react-native';
import { apiClient } from '../../src/api/client';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

export default function VendorProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiClient.get('/vendor/products');
        setProducts(response.data);
      } catch (err: any) {
        if (err.response?.status === 404 && (err.response?.data?.detail?.includes('Vendor account not found') || err.response?.data?.message?.includes('Vendor account not found'))) {
          router.replace('/vendor/apply');
          return;
        }
        setError(err.response?.data?.detail || err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Typography style={styles.title}>Products</Typography>
          <Typography style={styles.subtitle}>Manage your catalog</Typography>
        </View>
        <TouchableOpacity 
          style={styles.addBtn} 
          activeOpacity={0.8}
          onPress={() => router.push('/vendor/products/new')}
        >
          <Plus size={16} color="#FFFFFF" />
          <Typography style={styles.addBtnText}>Add Product</Typography>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={{ marginBottom: 16 }}>
          <Typography style={{ color: '#D9383A' }}>{error}</Typography>
        </View>
      )}

      <View style={styles.controlsBar}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#8E8A85" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#B0AAA2"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={18} color="#1A1918" />
          <Typography style={styles.filterText}>Filter</Typography>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Typography style={styles.emptyText}>No products yet</Typography>
            <Typography style={styles.emptySubtext}>Add your first product to start selling on TRYVIA.</Typography>
            <TouchableOpacity 
              style={[styles.addBtn, { marginTop: 16 }]} 
              activeOpacity={0.8}
              onPress={() => router.push('/vendor/products/new')}
            >
              <Plus size={16} color="#FFFFFF" />
              <Typography style={styles.addBtnText}>Add Product</Typography>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.productsList}>
            {filteredProducts.map((product, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={styles.productCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/vendor/products/${product._id}` as any)}
              >
                <View style={styles.productImageContainer}>
                  {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productImagePlaceholder} />
                  )}
                </View>
                
                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <Typography style={styles.productName} numberOfLines={2}>{product.name}</Typography>
                    <View style={[
                      styles.statusBadge,
                      product.status === 'ACTIVE' ? styles.statusActive : 
                      product.status === 'OUT_OF_STOCK' ? styles.statusOutOfStock : styles.statusInactive
                    ]}>
                      <Typography style={[
                        styles.statusText,
                        product.status === 'ACTIVE' ? styles.statusTextActive : 
                        product.status === 'OUT_OF_STOCK' ? styles.statusTextOutOfStock : styles.statusTextInactive
                      ]}>
                        {product.status || 'ACTIVE'}
                      </Typography>
                    </View>
                  </View>
                  
                  <Typography style={styles.productCategory}>
                    {product.category?.name || 'Uncategorized'}
                  </Typography>
                  
                  <View style={styles.productFooter}>
                    <Typography style={styles.productPrice}>${product.fullPrice.toFixed(2)}</Typography>
                    <Typography style={styles.productStock}>Stock: {product.stockFull}</Typography>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'CormorantGaramond_700Bold',
    fontSize: 28,
    color: '#1A1918',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#8E8A85',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1918',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  addBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  controlsBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1A1918',
    height: '100%',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECE7E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  filterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1A1918',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1A1918',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#8E8A85',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  productsList: {
    gap: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    overflow: 'hidden',
    padding: 12,
    gap: 16,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F8F6F3',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ECE7E1',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  productName: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#1A1918',
    lineHeight: 20,
  },
  productCategory: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#8E8A85',
    marginTop: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#1A1918',
  },
  productStock: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#8E8A85',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  statusActive: { backgroundColor: '#E9F5EF' },
  statusTextActive: { color: '#318C59' },
  statusOutOfStock: { backgroundColor: '#FDECEC' },
  statusTextOutOfStock: { color: '#D9383A' },
  statusInactive: { backgroundColor: '#F0ECE6' },
  statusTextInactive: { color: '#8E8A85' },
  editText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#CB6D73',
  },
});

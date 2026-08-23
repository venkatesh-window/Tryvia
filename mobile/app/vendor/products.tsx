import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { Typography } from '../../src/components/ui/Typography';
import { Search, Plus, Filter } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';

export default function VendorProductsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/vendor/products', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const json = await response.json();
        setProducts(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [token]);

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
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Typography style={[styles.tableHeaderCell, { flex: 4 }]}>Product</Typography>
              <Typography style={[styles.tableHeaderCell, { flex: 2 }]}>Category</Typography>
              <Typography style={[styles.tableHeaderCell, { flex: 2 }]}>Price</Typography>
              <Typography style={[styles.tableHeaderCell, { flex: 2 }]}>Stock</Typography>
              <Typography style={[styles.tableHeaderCell, { flex: 2 }]}>Status</Typography>
              <Typography style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Action</Typography>
            </View>
            
            {filteredProducts.map((product, idx) => (
              <View key={idx} style={styles.tableRow}>
                <View style={[styles.tableCell, { flex: 4, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                  {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.productImagePlaceholder} />
                  ) : (
                    <View style={styles.productImagePlaceholder} />
                  )}
                  <Typography style={styles.productName}>{product.name}</Typography>
                </View>
                <Typography style={[styles.tableCell, { flex: 2, color: '#8E8A85' }]}>
                  {product.category?.name || 'Uncategorized'}
                </Typography>
                <Typography style={[styles.tableCell, { flex: 2 }]}>${product.fullPrice.toFixed(2)}</Typography>
                <Typography style={[styles.tableCell, { flex: 2 }]}>{product.stockFull}</Typography>
                <View style={[styles.tableCell, { flex: 2 }]}>
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
                <TouchableOpacity 
                  style={[styles.tableCell, { flex: 1, alignItems: 'flex-end' }]}
                  onPress={() => router.push(`/vendor/products/${product._id}` as any)}
                >
                  <Typography style={styles.editText}>Edit</Typography>
                </TouchableOpacity>
              </View>
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
    padding: 24,
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
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECE7E1',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F6F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE7E1',
  },
  tableHeaderCell: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#8E8A85',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECE7E1',
  },
  tableCell: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: '#1A1918',
  },
  productImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#F0ECE6',
  },
  productName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1A1918',
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

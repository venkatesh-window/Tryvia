import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Typography } from '../../../src/components/ui/Typography';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, XCircle, MapPin, Mail, Phone, ShoppingBag } from 'lucide-react-native';
import { useAuthStore } from '../../../src/store/useAuthStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';

export default function VendorOrderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { token } = useAuthStore();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/vendor/orders/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to fetch order');
      const json = await response.json();
      setOrder(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id, token]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/vendor/orders/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      // Refresh order to show new status history
      await fetchOrder();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Typography style={{ color: '#D9383A' }}>{error || 'Order not found'}</Typography>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Typography style={{ color: '#1A1918' }}>Go Back</Typography>
        </TouchableOpacity>
      </View>
    );
  }

  const orderStatuses = [
    { value: 'PENDING', label: 'Pending', icon: Clock },
    { value: 'PROCESSING', label: 'Processing', icon: Package },
    { value: 'SHIPPED', label: 'Shipped', icon: Truck },
    { value: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
    { value: 'CANCELLED', label: 'Cancelled', icon: XCircle }
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#1A1918" />
          </TouchableOpacity>
          <View>
            <Typography style={styles.title}>Order #{order.id}</Typography>
            <Typography style={styles.subtitle}>
              Placed on {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}
            </Typography>
          </View>
        </View>
        
        <View style={[
          styles.statusBadge,
          order.status === 'PENDING' || order.status === 'PAID' ? styles.statusPending : 
          order.status === 'PROCESSING' ? styles.statusProcessing :
          order.status === 'SHIPPED' ? styles.statusShipped : 
          order.status === 'DELIVERED' ? styles.statusDelivered :
          styles.statusCancelled
        ]}>
          <Typography style={[
            styles.statusText,
            order.status === 'PENDING' || order.status === 'PAID' ? styles.statusTextPending : 
            order.status === 'PROCESSING' ? styles.statusTextProcessing :
            order.status === 'SHIPPED' ? styles.statusTextShipped : 
            order.status === 'DELIVERED' ? styles.statusTextDelivered :
            styles.statusTextCancelled
          ]}>
            {order.status}
          </Typography>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.row}>
          <View style={[styles.column, { flex: 2 }]}>
            
            <View style={styles.card}>
              <Typography style={styles.cardTitle}>Update Status</Typography>
              <Typography style={styles.helperText}>Move the order forward in your fulfillment pipeline.</Typography>
              
              <View style={styles.statusButtonsContainer}>
                {orderStatuses.map((s, idx) => {
                  const Icon = s.icon;
                  const isActive = order.status === s.value;
                  return (
                    <TouchableOpacity 
                      key={idx}
                      style={[styles.actionBtn, isActive && styles.actionBtnActive]}
                      onPress={() => updateStatus(s.value)}
                      disabled={updating || isActive}
                    >
                      <Icon size={16} color={isActive ? '#FFFFFF' : '#8E8A85'} />
                      <Typography style={[styles.actionBtnText, isActive && styles.actionBtnTextActive]}>
                        {s.label}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {updating && <ActivityIndicator size="small" color="#CB6D73" style={{ marginTop: 12 }} />}
            </View>

            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <ShoppingBag size={20} color="#1A1918" />
                <Typography style={styles.cardTitle}>Products in Order</Typography>
              </View>
              
              {order.items.map((item: any, idx: number) => (
                <View key={idx} style={styles.productRow}>
                  {item.product?.imageUrl ? (
                    <Image source={{ uri: item.product.imageUrl }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productImagePlaceholder} />
                  )}
                  <View style={styles.productDetails}>
                    <Typography style={styles.productName}>{item.product?.name}</Typography>
                    <Typography style={styles.productType}>Type: {item.itemType === 'full' ? 'FULL SIZE' : 'TESTER'}</Typography>
                  </View>
                  <View style={styles.productPriceCol}>
                    <Typography style={styles.productPrice}>${item.unitPrice.toFixed(2)}</Typography>
                    <Typography style={styles.productQty}>Qty: {item.quantity}</Typography>
                  </View>
                  <Typography style={styles.productTotal}>${item.totalPrice.toFixed(2)}</Typography>
                </View>
              ))}
              
              <View style={styles.summaryRow}>
                <Typography style={styles.summaryLabel}>Vendor Subtotal</Typography>
                <Typography style={styles.summaryValue}>${order.total.toFixed(2)}</Typography>
              </View>
            </View>
            
          </View>
          
          <View style={[styles.column, { flex: 1 }]}>
            <View style={styles.card}>
              <Typography style={styles.cardTitle}>Customer Delivery Info</Typography>
              
              <View style={styles.infoRow}>
                <Typography style={styles.infoLabel}>NAME</Typography>
                <Typography style={styles.infoValue}>{order.customer?.fullName || 'N/A'}</Typography>
              </View>
              
              <View style={styles.infoRow}>
                <Typography style={styles.infoLabel}>EMAIL</Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} color="#8E8A85" />
                  <Typography style={styles.infoValue}>{order.customer?.email || 'N/A'}</Typography>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Typography style={styles.infoLabel}>PHONE</Typography>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} color="#8E8A85" />
                  <Typography style={styles.infoValue}>{order.customer?.phone || 'N/A'}</Typography>
                </View>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Typography style={styles.infoLabel}>SHIPPING ADDRESS</Typography>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
                  <MapPin size={14} color="#8E8A85" style={{ marginTop: 2 }} />
                  <Typography style={[styles.infoValue, { lineHeight: 20 }]}>
                    {order.shippingAddress || 'Address not provided'}
                  </Typography>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Typography style={styles.cardTitle}>Status History</Typography>
              {order.history && order.history.length > 0 ? (
                <View style={styles.historyTimeline}>
                  {order.history.map((event: any, idx: number) => (
                    <View key={idx} style={styles.historyEvent}>
                      <View style={styles.historyDot} />
                      {idx !== order.history.length - 1 && <View style={styles.historyLine} />}
                      <View style={styles.historyContent}>
                        <Typography style={styles.historyStatus}>{event.status}</Typography>
                        <Typography style={styles.historyDate}>
                          {new Date(event.changedAt).toLocaleString()}
                        </Typography>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Typography style={styles.helperText}>No history available.</Typography>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#ECE7E1', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 24, color: '#1A1918' },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#8E8A85' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 20 },
  column: { gap: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#ECE7E1' },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: '#1A1918' },
  helperText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#8E8A85', marginBottom: 16 },
  statusButtonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F6F3', borderWidth: 1, borderColor: '#ECE7E1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, gap: 8 },
  actionBtnActive: { backgroundColor: '#1A1918', borderColor: '#1A1918' },
  actionBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#8E8A85' },
  actionBtnTextActive: { color: '#FFFFFF' },
  productRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#ECE7E1' },
  productImage: { width: 48, height: 48, borderRadius: 8 },
  productImagePlaceholder: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#F0ECE6' },
  productDetails: { flex: 1, marginLeft: 16 },
  productName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1A1918', marginBottom: 4 },
  productType: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#8E8A85', letterSpacing: 0.5 },
  productPriceCol: { alignItems: 'flex-end', width: 80, marginRight: 24 },
  productPrice: { fontFamily: 'Inter_500Medium', fontSize: 13, color: '#1A1918', marginBottom: 4 },
  productQty: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#8E8A85' },
  productTotal: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: '#1A1918', width: 80, textAlign: 'right' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, marginTop: 4 },
  summaryLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#8E8A85' },
  summaryValue: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1A1918' },
  infoRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#ECE7E1' },
  infoLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: '#8E8A85', letterSpacing: 0.5, marginBottom: 6 },
  infoValue: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#1A1918' },
  historyTimeline: { marginTop: 8 },
  historyEvent: { flexDirection: 'row', marginBottom: 20 },
  historyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CB6D73', marginTop: 4 },
  historyLine: { position: 'absolute', left: 4.5, top: 14, width: 1, height: 40, backgroundColor: '#ECE7E1' },
  historyContent: { marginLeft: 16 },
  historyStatus: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1A1918', marginBottom: 2 },
  historyDate: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#8E8A85' },
  
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  statusPending: { backgroundColor: '#FDECEC' },
  statusTextPending: { color: '#D9383A' },
  statusProcessing: { backgroundColor: '#FEF0DB' },
  statusTextProcessing: { color: '#D9985F' },
  statusShipped: { backgroundColor: '#EBF3FF' },
  statusTextShipped: { color: '#3A7BD9' },
  statusDelivered: { backgroundColor: '#E9F5EF' },
  statusTextDelivered: { color: '#318C59' },
  statusCancelled: { backgroundColor: '#F0ECE6' },
  statusTextCancelled: { color: '#8E8A85' },
});

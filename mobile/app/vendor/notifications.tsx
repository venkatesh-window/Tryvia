import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Typography } from '../../src/components/ui/Typography';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Bell, Package, Wallet, ArrowLeftRight, CheckCircle2 } from 'lucide-react-native';

export default function VendorNotificationsScreen() {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      setNotifications(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`http://localhost:8000/api/v1/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('http://localhost:8000/api/v1/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <Package size={20} color="#D9985F" />;
      case 'PAYOUT': return <Wallet size={20} color="#318C59" />;
      case 'RETURN': return <ArrowLeftRight size={20} color="#D9383A" />;
      default: return <Bell size={20} color="#8E8A85" />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CB6D73" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Typography style={styles.title}>Notifications</Typography>
          <Typography style={styles.subtitle}>Recent alerts and updates.</Typography>
        </View>
        <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
          <CheckCircle2 size={16} color="#8E8A85" />
          <Typography style={styles.markAllText}>Mark all read</Typography>
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={40} color="#ECE7E1" style={{ marginBottom: 16 }} />
            <Typography style={styles.emptyText}>No notifications.</Typography>
          </View>
        ) : (
          notifications.map((n: any, idx: number) => (
            <TouchableOpacity 
              key={idx} 
              style={[styles.notificationCard, !n.read && styles.unreadCard]}
              onPress={() => !n.read && markAsRead(n._id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconWrap, !n.read && styles.unreadIconWrap]}>
                {getIcon(n.type)}
              </View>
              <View style={{ flex: 1 }}>
                <Typography style={[styles.cardTitle, !n.read && styles.unreadText]}>{n.title}</Typography>
                <Typography style={styles.cardDesc}>{n.description}</Typography>
                <Typography style={styles.cardDate}>{new Date(n.createdAt).toLocaleString()}</Typography>
              </View>
              {!n.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 24, paddingBottom: 16 },
  title: { fontFamily: 'CormorantGaramond_700Bold', fontSize: 28, color: '#1A1918', marginBottom: 4 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#8E8A85' },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#EBE6E0', borderRadius: 20 },
  markAllText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: '#8E8A85' },
  list: { paddingHorizontal: 24, paddingBottom: 40 },
  notificationCard: { flexDirection: 'row', gap: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#ECE7E1' },
  unreadCard: { backgroundColor: '#FFFAF0', borderColor: '#F5E4C3' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FAF8F5', alignItems: 'center', justifyContent: 'center' },
  unreadIconWrap: { backgroundColor: '#FFFFFF' },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#4A4846', marginBottom: 4 },
  unreadText: { color: '#1A1918' },
  cardDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#8E8A85', marginBottom: 8, lineHeight: 20 },
  cardDate: { fontFamily: 'Inter_500Medium', fontSize: 11, color: '#B0AAA2' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CB6D73', marginTop: 6 },
  emptyState: { padding: 60, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#ECE7E1' },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#8E8A85' },
});

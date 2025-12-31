import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { transactionAPI } from '../services/api';
import { clearAuth, getAuth } from '../utils/auth';
import {
  registerForPushNotifications,
  setupNotificationListener,
} from '../services/NotificationListener';
import type { Transaction, User } from '../types';

interface HomeScreenProps {
  onLogout: () => void;
}

const categoryColors: Record<string, string> = {
  food: '#f97316',
  transport: '#3b82f6',
  shopping: '#a855f7',
  entertainment: '#ec4899',
  bills: '#ef4444',
  health: '#10b981',
  other: '#6b7280',
};

export default function HomeScreen({ onLogout }: HomeScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUser();
    loadTransactions();
    setupNotifications();
  }, []);

  const loadUser = async () => {
    const { user } = await getAuth();
    setUser(user);
  };

  const loadTransactions = async () => {
    try {
      const data = await transactionAPI.getAll();
      setTransactions(data);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load transactions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupNotifications = async () => {
    try {
      const token = await registerForPushNotifications();
      console.log('Push notification token:', token);
      setupNotificationListener();
    } catch (error) {
      console.error('Notification setup error:', error);
    }
  };

  const handleLogout = async () => {
    await clearAuth();
    onLogout();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadTransactions();
  };

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionMerchant}>{item.merchant}</Text>
        <Text style={styles.transactionAmount}>${item.amount.toFixed(2)}</Text>
      </View>
      <View style={styles.transactionFooter}>
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: categoryColors[item.category] || categoryColors.other },
          ]}
        >
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.transactionSource}>{item.source === 'manual' ? '✍️' : '📱'}</Text>
      </View>
      <Text style={styles.transactionDescription}>{item.description}</Text>
      <Text style={styles.transactionDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Financial Tracker</Text>
          <Text style={styles.headerSubtitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Spent</Text>
        <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
        <Text style={styles.totalCount}>{transactions.length} transactions</Text>
      </View>

      <View style={styles.notificationInfo}>
        <Text style={styles.infoText}>
          📱 Notification monitoring is active. Banking notifications will be automatically
          tracked.
        </Text>
        <Text style={styles.infoSubtext}>
          Note: Full notification access requires native implementation
        </Text>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Add transactions on the web app or wait for banking notifications
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#0ea5e9',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0f2fe',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#0ea5e9',
    fontWeight: '600',
  },
  totalCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  totalCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  notificationInfo: {
    backgroundColor: '#dbeafe',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  infoSubtext: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  transactionCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionMerchant: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  transactionSource: {
    fontSize: 16,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

// Balloo Messenger — Mobile Contacts Screen
// Contacts list with search, tabs (contacts/groups/blocked), contact detail card

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';
import Avatar from '../components/Avatar';

interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  status?: string;
  online?: boolean;
  unreadCount?: number;
  missedCalls?: number;
}

type ContactsTab = 'contacts' | 'groups' | 'blocked';

interface ContactsScreenProps {
  navigation: any;
}

export default function ContactsScreen({ navigation }: ContactsScreenProps) {
  const [activeTab, setActiveTab] = useState<ContactsTab>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<Contact[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);

  const fetchContacts = useCallback(async () => {
    try {
      const data = await api.getContacts();
      setContacts(data || []);
    } catch (error: any) {
      // Silent fail — use mock data for demo
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBlocked = useCallback(async () => {
    try {
      const data = await api.getBlockedUsers();
      setBlockedUsers(data || []);
    } catch {
      // Silent fail
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
      fetchBlocked();
    }, [fetchContacts, fetchBlocked])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchContacts(), fetchBlocked()]);
    setRefreshing(false);
  };

  const handleContactPress = (contact: Contact) => {
    navigation.navigate('ChatView', {
      chatId: contact.id,
      chatName: contact.displayName || contact.username,
    });
  };

  const handleCall = (type: 'audio' | 'video') => {
    Alert.alert('Звонок', `${type === 'audio' ? 'Аудио' : 'Видео'}звонок...`);
  };

  const handleUnblock = async (userId: string) => {
    try {
      await api.unblockUser(userId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      Alert.alert('Готово', 'Пользователь разблокирован');
    } catch (error: any) {
      Alert.alert('Ошибка', error.message);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.displayName || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q) ||
      (c.bio || '').toLowerCase().includes(q)
    );
  });

  const filteredBlocked = blockedUsers.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (u.displayName || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q);
  });

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={[styles.contactItem, { borderBottomColor: colors.border }]}
      onPress={() => handleContactPress(item)}
      activeOpacity={0.7}
    >
      <Avatar
        name={item.displayName || item.username}
        avatarUrl={item.avatarUrl}
        size="md"
        status={item.online ? 'online' : 'offline'}
        bordered
      />
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.displayName || item.username}
        </Text>
        <Text style={[styles.contactStatus, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.online ? 'в сети' : item.status || 'офлайн'}
        </Text>
      </View>
      <View style={styles.contactMeta}>
        {(item.unreadCount || 0) > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.unread }]}>
            <Text style={styles.badgeText}>{item.unreadCount}</Text>
          </View>
        )}
        {(item.missedCalls || 0) > 0 && (
          <View style={[styles.callBadge, { backgroundColor: colors.danger }]}>
            <Text style={styles.badgeText}>📞 {item.missedCalls}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderBlockedItem = ({ item }: { item: Contact }) => (
    <View style={[styles.contactItem, { borderBottomColor: colors.border }]}>
      <Avatar
        name={item.displayName || item.username}
        avatarUrl={item.avatarUrl}
        size="md"
        bordered
      />
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.displayName || item.username}
        </Text>
        <Text style={[styles.contactStatus, { color: colors.danger }]}>Заблокирован</Text>
      </View>
      <TouchableOpacity
        style={[styles.unblockBtn, { borderColor: colors.accent }]}
        onPress={() => handleUnblock(item.id)}
      >
        <Text style={[styles.unblockBtnText, { color: colors.accent }]}>Разблок.</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContactsTab = () => (
    <>
      {/* Detail card */}
      {contacts.length > 0 && (
        <View style={styles.detailCard}>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Avatar
                name={contacts[0].displayName || contacts[0].username}
                avatarUrl={contacts[0].avatarUrl}
                size="lg"
                status={contacts[0].online ? 'online' : 'offline'}
                bordered
                context="contact"
              />
              <View style={styles.cardInfo}>
                <Text style={[styles.cardName, { color: colors.textPrimary }]}>
                  {contacts[0].displayName || contacts[0].username}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  {contacts[0].bio || 'Нет информации'}
                </Text>
                <Text style={[styles.cardStatus, { color: colors.textTertiary }]}>
                  🟢 {contacts[0].online ? 'В сети' : 'Офлайн'}
                </Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.accent }]}
                onPress={() => handleContactPress(contacts[0])}
              >
                <Text style={styles.actionBtnText}>💬 Написать</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.bgTertiary }]}
                onPress={() => handleCall('audio')}
              >
                <Text style={styles.iconBtnText}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: colors.bgTertiary }]}
                onPress={() => handleCall('video')}
              >
                <Text style={styles.iconBtnText}>📹</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Contacts list */}
      <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
        {filteredContacts.length} контактов
      </Text>
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'Ничего не найдено' : 'Нет контактов'}
            </Text>
          </View>
        }
      />

      {/* Invite button */}
      <View style={styles.inviteSection}>
        <TouchableOpacity
          style={[styles.inviteBtn, { backgroundColor: colors.accent }]}
          onPress={() => Alert.alert('Пригласить', 'Ссылка-приглашение скопирована')}
        >
          <Text style={styles.inviteBtnText}>📨 Пригласить друга</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderGroupsTab = () => (
    <View style={styles.emptyState}>
      <Text style={[styles.emptyIcon]}>👥</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Группы появятся здесь
      </Text>
      <TouchableOpacity
        style={[styles.createGroupBtn, { backgroundColor: colors.accent }]}
        onPress={() => navigation.navigate('CreateGroup')}
      >
        <Text style={styles.createGroupBtnText}>➕ Создать группу</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBlockedTab = () => (
    <FlatList
      data={filteredBlocked}
      keyExtractor={(item) => item.id}
      renderItem={renderBlockedItem}
      scrollEnabled={false}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon]}>🚫</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery ? 'Ничего не найдено' : 'Нет заблокированных пользователей'}
          </Text>
        </View>
      }
    />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'contacts': return renderContactsTab();
      case 'groups': return renderGroupsTab();
      case 'blocked': return renderBlockedTab();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Search */}
      <View style={[styles.searchSection, { borderBottomColor: colors.border }]}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.bgTertiary, color: colors.textPrimary }]}
          placeholder="🔍 Поиск контактов..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contacts' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('contacts')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'contacts' ? colors.accent : colors.textSecondary }]}>
            Контакты
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'groups' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'groups' ? colors.accent : colors.textSecondary }]}>
            👥 Группы
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'blocked' && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('blocked')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'blocked' ? colors.accent : colors.textSecondary }]}>
            🚫 Чёрный список
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchInput: {
    padding: 10,
    fontSize: 13,
    borderRadius: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  scrollContent: { paddingBottom: 20 },
  detailCard: { padding: 12, paddingBottom: 4 },
  card: { padding: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: '700' },
  cardSubtitle: { fontSize: 11, marginTop: 2 },
  cardStatus: { fontSize: 10, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  iconBtnText: { fontSize: 18 },
  sectionCount: { fontSize: 11, paddingHorizontal: 12, paddingVertical: 6 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: '600' },
  contactStatus: { fontSize: 11, marginTop: 2 },
  contactMeta: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  callBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unblockBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
  },
  unblockBtnText: { fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  inviteSection: { padding: 12, paddingTop: 8 },
  inviteBtn: { padding: 12, alignItems: 'center', borderRadius: 6 },
  inviteBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  createGroupBtn: { padding: 12, alignItems: 'center', borderRadius: 6, marginTop: 16 },
  createGroupBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
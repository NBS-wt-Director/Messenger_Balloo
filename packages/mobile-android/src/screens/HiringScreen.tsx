// Balloo Messenger — Mobile Hiring Screen
// Vacancies list, filters by department, apply form

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getThemeColors } from '../styles/theme';
import { useUIStore } from '../store/uiStore';
import { api } from '../services/api';

interface Vacancy {
  id: string;
  title: string;
  description: string;
  requirements: string;
  salary?: string;
  departmentId: string;
  departmentName?: string;
  status: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

interface HiringScreenProps {
  navigation: any;
}

export default function HiringScreen({ navigation }: HiringScreenProps) {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeDepartment, setActiveDepartment] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedVacancy, setSelectedVacancy] = useState<Vacancy | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const theme = useUIStore((s) => s.theme);
  const colors = getThemeColors(theme);

  const fetchData = useCallback(async () => {
    try {
      const [vacanciesData, departmentsData] = await Promise.all([
        api.getVacancies(),
        api.getDepartments(),
      ]);
      setVacancies(vacanciesData || []);
      setDepartments(departmentsData || []);
    } catch (error: any) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleVacancyPress = (vacancy: Vacancy) => {
    setSelectedVacancy(vacancy);
  };

  const handleApply = () => {
    if (!selectedVacancy) return;
    setCoverLetter('');
    setShowApplyModal(true);
  };

  const submitApplication = async () => {
    if (!selectedVacancy) return;
    setSubmitting(true);
    try {
      await api.applyVacancy(selectedVacancy.id, {
        coverLetter: coverLetter.trim(),
        resumeUrl: '',
      });
      Alert.alert('Отправлено', 'Ваш отклик отправлен!');
      setShowApplyModal(false);
      setSelectedVacancy(null);
    } catch (error: any) {
      Alert.alert('Ошибка', error.message || 'Не удалось отправить отклик');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVacancies = activeDepartment
    ? vacancies.filter((v) => v.departmentId === activeDepartment)
    : vacancies;

  const renderVacancyItem = ({ item }: { item: Vacancy }) => (
    <TouchableOpacity
      style={[styles.vacancyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
      onPress={() => handleVacancyPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.vacancyHeader}>
        <Text style={[styles.vacancyTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        {item.salary && (
          <Text style={[styles.vacancySalary, { color: colors.accent }]}>{item.salary}</Text>
        )}
      </View>
      {item.departmentName && (
        <Text style={[styles.vacancyDept, { color: colors.accent }]}>{item.departmentName}</Text>
      )}
      <Text style={[styles.vacancyDesc, { color: colors.textSecondary }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.vacancyFooter}>
        <Text style={[styles.vacancyStatus, { color: colors.textTertiary }]}>
          {item.status === 'open' ? '🟢 Открыта' : item.status === 'closed' ? '🔴 Закрыта' : item.status}
        </Text>
        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: colors.accent }]}
          onPress={() => {
            setSelectedVacancy(item);
            setCoverLetter('');
            setShowApplyModal(true);
          }}
        >
          <Text style={styles.applyBtnText}>Откликнуться</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderDepartmentChip = ({ item }: { item: Department }) => (
    <TouchableOpacity
      style={[
        styles.deptChip,
        {
          backgroundColor: activeDepartment === item.id ? colors.accentLight : colors.bgTertiary,
          borderColor: activeDepartment === item.id ? colors.accent : colors.border,
        },
      ]}
      onPress={() => setActiveDepartment(activeDepartment === item.id ? null : item.id)}
    >
      <Text
        style={[
          styles.deptChipText,
          { color: activeDepartment === item.id ? colors.accent : colors.textSecondary },
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      {/* Departments strip */}
      {departments.length > 0 && (
        <View style={[styles.deptsStrip, { borderBottomColor: colors.border }]}>
          <FlatList
            horizontal
            data={departments}
            keyExtractor={(item) => item.id}
            renderItem={renderDepartmentChip}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.deptsList}
            ListHeaderComponent={
              <TouchableOpacity
                style={[
                  styles.deptChip,
                  {
                    backgroundColor: activeDepartment === null ? colors.accentLight : colors.bgTertiary,
                    borderColor: activeDepartment === null ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setActiveDepartment(null)}
              >
                <Text
                  style={[
                    styles.deptChipText,
                    { color: activeDepartment === null ? colors.accent : colors.textSecondary },
                  ]}
                >
                  Все
                </Text>
              </TouchableOpacity>
            }
          />
        </View>
      )}

      {/* Vacancies list */}
      <FlatList
        data={filteredVacancies}
        keyExtractor={(item) => item.id}
        renderItem={renderVacancyItem}
        contentContainerStyle={styles.vacanciesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💼</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Нет открытых вакансий
            </Text>
          </View>
        }
      />

      {/* Vacancy detail modal */}
      <Modal visible={!!selectedVacancy && !showApplyModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgPrimary }]}>
            {selectedVacancy && (
              <ScrollView>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {selectedVacancy.title}
                </Text>
                {selectedVacancy.salary && (
                  <Text style={[styles.modalSalary, { color: colors.accent }]}>
                    {selectedVacancy.salary}
                  </Text>
                )}
                {selectedVacancy.departmentName && (
                  <Text style={[styles.modalDept, { color: colors.accent }]}>
                    {selectedVacancy.departmentName}
                  </Text>
                )}
                <Text style={[styles.modalSectionTitle, { color: colors.textPrimary }]}>
                  Описание
                </Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  {selectedVacancy.description}
                </Text>
                <Text style={[styles.modalSectionTitle, { color: colors.textPrimary }]}>
                  Требования
                </Text>
                <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                  {selectedVacancy.requirements}
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.accent }]}
                    onPress={handleApply}
                  >
                    <Text style={styles.modalBtnText}>Откликнуться</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: colors.bgTertiary }]}
                    onPress={() => setSelectedVacancy(null)}
                  >
                    <Text style={[styles.modalBtnText, { color: colors.textPrimary }]}>Закрыть</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Apply modal */}
      <Modal visible={showApplyModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgPrimary }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Отклик на вакансию
            </Text>
            {selectedVacancy && (
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {selectedVacancy.title}
              </Text>
            )}
            <Text style={[styles.label, { color: colors.textSecondary, marginTop: 12 }]}>
              Сопроводительное письмо
            </Text>
            <TextInput
              style={[styles.textarea, { backgroundColor: colors.bgTertiary, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Расскажите о себе..."
              placeholderTextColor={colors.textTertiary}
              value={coverLetter}
              onChangeText={setCoverLetter}
              multiline
              numberOfLines={5}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.accent, opacity: submitting ? 0.7 : 1 }]}
                onPress={submitApplication}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalBtnText}>Отправить</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.bgTertiary }]}
                onPress={() => setShowApplyModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.textPrimary }]}>Отмена</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  deptsStrip: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  deptsList: { paddingHorizontal: 12, gap: 8 },
  deptChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  deptChipText: { fontSize: 13, fontWeight: '600' },
  vacanciesList: { padding: 12, gap: 10 },
  vacancyCard: { padding: 14, borderWidth: 1, borderRadius: 8, gap: 8 },
  vacancyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vacancyTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  vacancySalary: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  vacancyDept: { fontSize: 11, fontWeight: '600' },
  vacancyDesc: { fontSize: 13, lineHeight: 18 },
  vacancyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  vacancyStatus: { fontSize: 11 },
  applyBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
  applyBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, marginBottom: 8 },
  modalSalary: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  modalDept: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  modalSectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 4 },
  modalText: { fontSize: 13, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 8 },
  modalBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  textarea: { padding: 12, fontSize: 13, borderWidth: 1, borderRadius: 6, minHeight: 100, textAlignVertical: 'top' },
});
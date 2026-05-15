import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable, Image, Modal, ScrollView, useWindowDimensions, TouchableWithoutFeedback } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RenderHtml from 'react-native-render-html';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { colors, radius, shadows, spacing } from '../../theme';
import { applicationService } from '../../services/api/applicationService';
import { useAuthStore } from '../../stores/useAuthStore';
import { Application } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  PENDING: { icon: 'clock', color: colors.warning, label: 'Đang chờ' },
  REVIEWING: { icon: 'eye', color: colors.info, label: 'Đang xem xét' },
  INTERVIEWING: { icon: 'calendar', color: colors.primary, label: 'Phỏng vấn' },
  ACCEPTED: { icon: 'check-circle', color: colors.success, label: 'Chấp nhận' },
  REJECTED: { icon: 'x-circle', color: colors.danger, label: 'Từ chối' },
};

function CompanyLogo({ uri, size = 48 }: { uri?: string; size?: number }) {
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.surfaceAlt }} resizeMode="cover" />;
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.25, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name="briefcase" color={colors.primary} size={size * 0.45} />
    </View>
  );
}

export function ApplicationsScreen() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();

  // Interview Modal State
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [interviewHtml, setInterviewHtml] = useState<string>('');
  const [isModalVisible, setModalVisible] = useState(false);
  const [isModalLoading, setModalLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchApps = async () => {
        if (!user?.profileId) return;
        setIsLoading(true);
        try {
          const data = await applicationService.getApplicationsByJobSeeker(user.profileId);
          setApplications(data || []);
        } catch (e) {
        } finally {
          setIsLoading(false);
        }
      };
      fetchApps();
    }, [user?.profileId])
  );

  const handleViewSchedule = async (app: Application) => {
    setSelectedAppId(app.applicationId);
    setModalVisible(true);
    setModalLoading(true);
    setInterviewHtml('');
    try {
      const detail = await applicationService.getApplicationDetail(app.applicationId);
      let html = detail.interviewDetailsHtml || '<p>Không có thông tin lịch hẹn cụ thể.</p>';
      
      // Replace template placeholders
      const candidateName = user?.fullName || 'Ứng viên';
      const jobTitle = app.job?.title || 'Vị trí';
      const companyName = app.job?.companyName || 'Công ty';
      
      html = html.replace(/\{\{\s*name\s*\}\}/g, candidateName);
      html = html.replace(/\{\{\s*jobTitle\s*\}\}/g, jobTitle);
      html = html.replace(/\{\{\s*companyName\s*\}\}/g, companyName);
      
      setInterviewHtml(html);
    } catch (e) {
      setInterviewHtml('<p>Không thể tải thông tin lịch hẹn. Vui lòng thử lại sau.</p>');
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Feather name="briefcase" color={colors.primary} size={28} />
        <AppText variant="h1">Ứng tuyển</AppText>
      </View>
      <AppText variant="bodySm" color="textSecondary" style={styles.subtitle}>
        Theo dõi trạng thái các công việc bạn đã nộp hồ sơ.
      </AppText>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.applicationId.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="briefcase" color={colors.textMuted} size={48} />
              <AppText variant="h3" color="textMuted" style={styles.emptyTitle}>
                Chưa có ứng tuyển nào
              </AppText>
              <AppText variant="bodySm" color="textMuted" style={styles.emptySubtitle}>
                Khi bạn nộp hồ sơ xin việc, trạng thái sẽ được cập nhật tại đây.
              </AppText>
            </View>
          }
          renderItem={({ item }) => {
            const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;

            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate('JobDetail', { jobId: item.job?.jobId })}
              >
                <View style={styles.cardTop}>
                  <CompanyLogo uri={item.job?.companyLogo} />
                  <View style={styles.cardInfo}>
                    <AppText variant="body" style={{ fontWeight: '600' }} numberOfLines={2}>
                      {item.job?.title || 'Công việc'}
                    </AppText>
                    <AppText variant="caption" color="textSecondary" numberOfLines={1}>
                      {item.job?.companyName || ''}
                    </AppText>
                  </View>
                  <Feather name="chevron-right" color={colors.textMuted} size={18} style={{ marginTop: spacing.xs }} />
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
                      <Feather name={config.icon as any} color={config.color} size={14} />
                      <AppText variant="caption" style={{ color: config.color, fontWeight: '600' }}>
                        {config.label}
                      </AppText>
                    </View>
                    <View style={styles.dateWrap}>
                      <Feather name="calendar" color={colors.textMuted} size={12} />
                      <AppText variant="caption" color="textMuted">
                        {formatDate(item.appliedAt)}
                      </AppText>
                    </View>
                  </View>
                  {item.status === 'INTERVIEWING' && (
                    <Pressable
                      style={styles.interviewBtn}
                      onPress={() => handleViewSchedule(item)}
                    >
                      <Feather name="calendar" color={colors.primary} size={14} />
                      <AppText variant="caption" color="primary" style={{ fontWeight: '600' }}>Xem lịch hẹn</AppText>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Interview Schedule Modal */}
      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>
        <View style={styles.modalContent} pointerEvents="box-none">
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <AppText variant="h3">Lịch hẹn phỏng vấn</AppText>
              <Pressable onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {isModalLoading ? (
                <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <RenderHtml
                  contentWidth={width - spacing.lg * 2 - 48} // modal padding
                  source={{ html: interviewHtml }}
                  tagsStyles={{
                    p: { color: colors.textSecondary, marginBottom: 12, fontSize: 15, lineHeight: 24 },
                    h2: { color: colors.textPrimary, marginTop: 16, marginBottom: 8, fontSize: 18 },
                    strong: { color: colors.textPrimary },
                    ul: { paddingLeft: 20, marginBottom: 12 },
                    li: { color: colors.textSecondary, marginBottom: 8, fontSize: 15 },
                  }}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: spacing['3xl'] },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border, ...shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardInfo: { flex: 1, gap: 2 },
  cardBottom: {
    flexDirection: 'column', gap: spacing.md, marginTop: spacing.md,
    paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  dateWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  interviewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.primarySoft, paddingVertical: spacing.sm, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  emptyState: { alignItems: 'center', paddingTop: spacing['3xl'], gap: spacing.md },
  emptyTitle: { marginTop: spacing.sm },
  emptySubtitle: { textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: {
    backgroundColor: colors.surface, width: '100%', maxHeight: '80%',
    borderRadius: radius.xl, overflow: 'hidden', ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalCloseBtn: { padding: spacing.xs, margin: -spacing.xs },
  modalBody: { padding: spacing.lg },
});

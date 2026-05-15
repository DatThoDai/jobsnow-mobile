import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable, Alert, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, radius, shadows, spacing } from '../../theme';
import { resumeService } from '../../services/api/resumeService';
import { useAuthStore } from '../../stores/useAuthStore';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ResumeListScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuthStore();
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResumes = useCallback(async () => {
    if (!user?.profileId) return;
    try {
      const data = await resumeService.getResumesByProfile(user.profileId);
      setResumes(data || []);
    } catch (e) {} finally { setIsLoading(false); }
  }, [user?.profileId]);

  useFocusEffect(useCallback(() => { fetchResumes(); }, [fetchResumes]));

  const [showCreateOptions, setShowCreateOptions] = useState(false);

  const handleCreateManual = async () => {
    setShowCreateOptions(false);
    if (!user?.profileId) return;
    try {
      await resumeService.initResume(user.profileId, { resumeName: `Hồ sơ ${resumes.length + 1}` } as any);
      fetchResumes();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message || 'Không thể tạo hồ sơ');
    }
  };

  const handleCreateAI = () => {
    setShowCreateOptions(false);
    Alert.alert('Tính năng AI', 'Công cụ tạo CV bằng AI hiện đang được tối ưu hóa cho phiên bản Web. Vui lòng truy cập website JobsNow để trải nghiệm tốt nhất!');
  };

  const handleUpload = () => {
    setShowCreateOptions(false);
    Alert.alert('Tải lên CV', 'Tính năng tải lên tệp tin trực tiếp từ điện thoại sẽ được cập nhật trong phiên bản tới. Hiện tại bạn có thể tạo hồ sơ trực tiếp trên app.');
  };

  const handleDelete = (resumeId: number) => {
    Alert.alert('Xóa Hồ Sơ', 'Bạn có chắc chắn muốn xóa hồ sơ này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await resumeService.deleteResume(resumeId);
            setResumes((prev) => prev.filter((r) => r.resumeId !== resumeId));
          } catch (e) {}
        },
      },
    ]);
  };

  const handleSetPrimary = async (resumeId: number) => {
    if (!user?.profileId) return;
    try {
      await resumeService.setPrimary(resumeId, user.profileId);
      fetchResumes();
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.headerBtn}>
            <Feather name="arrow-left" color={colors.white} size={22} />
          </Pressable>
          <AppText variant="h2" color="white">Hồ sơ xin việc</AppText>
          <Pressable onPress={() => setShowCreateOptions(true)} style={styles.addBtn}>
            <Feather name="plus" color={colors.primary} size={20} />
          </Pressable>
        </View>
        <AppText variant="bodySm" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Quản lý các mẫu CV của bạn để ứng tuyển nhanh chóng.
        </AppText>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={resumes}
          keyExtractor={(item) => item.resumeId.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIconWrap}>
                <Feather name="file-text" color={colors.primary} size={48} />
              </View>
              <AppText variant="h3" color="textPrimary" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>Chưa có hồ sơ nào</AppText>
              <AppText variant="bodySm" color="textSecondary" style={{ textAlign: 'center', marginBottom: spacing.lg, paddingHorizontal: spacing.xl }}>
                Tạo một hồ sơ chuyên nghiệp để bắt đầu hành trình tìm kiếm việc làm của bạn.
              </AppText>
              <PrimaryButton title="Tạo hồ sơ đầu tiên" onPress={() => setShowCreateOptions(true)} style={{ width: 200 }} />
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('ResumeDetail', { resumeId: item.resumeId })}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <Feather name="file-text" color={item.isPrimary ? colors.accent : colors.primary} size={24} />
                </View>
                <View style={styles.cardContent}>
                  <AppText variant="h3" style={{ fontSize: 18, marginBottom: 2 }} numberOfLines={1}>{item.resumeName || item.title}</AppText>
                  <AppText variant="caption" color="textSecondary">Cập nhật gần đây</AppText>
                </View>
                <Pressable onPress={() => handleDelete(item.resumeId)} style={styles.deleteBtn}>
                  <Feather name="trash-2" color={colors.danger} size={18} />
                </Pressable>
              </View>

              <View style={styles.cardBottom}>
                {item.isPrimary ? (
                  <View style={styles.primaryBadge}>
                    <Feather name="star" color={colors.accent} size={14} style={{ fill: colors.accent }} />
                    <AppText variant="caption" style={{ color: colors.accent, fontWeight: '600' }}>Hồ sơ chính</AppText>
                  </View>
                ) : (
                  <Pressable onPress={() => handleSetPrimary(item.resumeId)} style={styles.setPrimaryBtn}>
                    <AppText variant="caption" color="primary" style={{ fontWeight: '600' }}>Đặt làm hồ sơ chính</AppText>
                  </Pressable>
                )}
              </View>
            </Pressable>
          )}
        />
      )}

      {/* Creation Options Modal */}
      <Modal visible={showCreateOptions} transparent animationType="slide" onRequestClose={() => setShowCreateOptions(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreateOptions(false)} />
        <View style={styles.optionsContainer}>
          <View style={styles.optionsHeader}>
            <View style={styles.modalHandle} />
            <AppText variant="h3" style={{ textAlign: 'center', marginTop: spacing.md }}>Tạo hồ sơ xin việc</AppText>
          </View>
          <View style={styles.optionsBody}>
            <OptionItem 
              icon="edit-3" 
              title="Tạo thủ công" 
              subtitle="Nhập thông tin từng bước để tạo CV chuẩn" 
              onPress={handleCreateManual} 
            />
            <OptionItem 
              icon="zap" 
              title="Tạo bằng AI (Beta)" 
              subtitle="Tự động tạo nội dung CV dựa trên vị trí mong muốn" 
              onPress={handleCreateAI} 
              color={colors.accent}
            />
            <OptionItem 
              icon="upload" 
              title="Tải lên tệp tin" 
              subtitle="Sử dụng file PDF hoặc Word có sẵn từ máy" 
              onPress={handleUpload} 
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function OptionItem({ icon, title, subtitle, onPress, color = colors.primary }: any) {
  return (
    <Pressable style={styles.optionItem} onPress={onPress}>
      <View style={[styles.optionIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon} color={color} size={22} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="body" style={{ fontWeight: '600' }}>{title}</AppText>
        <AppText variant="caption" color="textMuted">{subtitle}</AppText>
      </View>
      <Feather name="chevron-right" color={colors.textMuted} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerGradient: {
    paddingTop: 50, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: radius['3xl'], borderBottomRightRadius: radius['3xl'],
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  listContent: { padding: spacing.lg },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardIcon: { width: 50, height: 50, borderRadius: radius.lg, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  cardContent: { flex: 1 },
  deleteBtn: { padding: spacing.sm },
  cardBottom: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'flex-end' },
  primaryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accent + '15', paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  setPrimaryBtn: { paddingHorizontal: spacing.md, paddingVertical: 4 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  optionsContainer: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius['3xl'], borderTopRightRadius: radius['3xl'],
    paddingBottom: 40, ...shadows.lg,
  },
  optionsHeader: { paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.border },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center' },
  optionsBody: { padding: spacing.lg },
  optionItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.border,
  },
  optionIcon: { width: 48, height: 48, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
});

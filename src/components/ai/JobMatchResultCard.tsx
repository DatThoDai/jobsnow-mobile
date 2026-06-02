import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../AppText';
import { ScoreRing, getScoreColor, getScoreLabel } from './ScoreRing';
import { colors, radius, spacing } from '../../theme';
import type { JobMatchResponse } from '../../services/api/aiService';

function getQuickInsight(result: JobMatchResponse): string {
  const missing = result.missingSkills ?? [];
  if (result.aiFeedback?.trim()) return result.aiFeedback.trim();
  if (result.skillMatchScore >= 80 && result.aiSemanticScore < 50) {
    return 'CV khớp nhiều kỹ năng từ khóa, nhưng mô tả kinh nghiệm chưa đủ rõ nên AI đánh giá thấp.';
  }
  if (missing.length > 0) {
    const list = missing.slice(0, 3).join(', ');
    return `Bạn còn thiếu một số kỹ năng: ${list}${missing.length > 3 ? '...' : ''}.`;
  }
  if (result.aiSemanticScore < 60) {
    return 'Nên làm rõ thành tựu và kết quả đo lường để tăng điểm AI phân tích.';
  }
  return 'Hồ sơ tương đối phù hợp, có thể tối ưu thêm phần mô tả thành tựu.';
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const barColor = getScoreColor(score);
  return (
    <View style={styles.barWrap}>
      <View style={styles.barLabelRow}>
        <AppText variant="caption" color="textSecondary">{label}</AppText>
        <AppText variant="caption" style={{ fontWeight: '700', color: barColor }}>{score}%</AppText>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.min(score, 100)}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

export function JobMatchResultCard({ result }: { result: JobMatchResponse }) {
  const matchedSkills = result.matchedSkills ?? [];
  const missingSkills = result.missingSkills ?? [];
  const recommendations = result.recommendations ?? [];
  const insight = getQuickInsight(result);
  const gap = result.ruleBasedScore - result.aiSemanticScore;
  const overallColor = getScoreColor(result.overallScore);

  return (
    <View style={styles.card}>
      <View style={styles.heroCard}>
        <ScoreRing score={result.overallScore} size={100} />
        <View style={styles.heroText}>
          <View style={[styles.badge, { backgroundColor: overallColor + '18', borderColor: overallColor + '40' }]}>
            <AppText variant="caption" style={{ color: overallColor, fontWeight: '700' }}>
              {getScoreLabel(result.overallScore)}
            </AppText>
          </View>
          <AppText variant="bodyMedium" style={{ fontWeight: '700', marginTop: spacing.xs }}>
            {result.jobTitle}
          </AppText>
          <AppText variant="caption" color="textSecondary">{result.companyName}</AppText>
        </View>
      </View>

      <ScoreBar score={result.skillMatchScore} label="Kỹ năng" />
      <ScoreBar score={result.experienceMatchScore} label="Kinh nghiệm" />
      <ScoreBar score={result.educationMatchScore} label="Học vấn" />
      <ScoreBar score={result.aiSemanticScore} label="AI phân tích" />

      <View style={styles.insightBox}>
        <AppText variant="caption" style={{ fontWeight: '700', color: colors.primary }}>Nhận xét nhanh</AppText>
        <AppText variant="bodySm" color="textSecondary" style={{ marginTop: 4, lineHeight: 20 }}>
          {insight}
        </AppText>
        {gap >= 30 ? (
          <AppText variant="caption" color="textMuted" style={{ marginTop: 6 }}>
            Điểm AI thấp hơn tổng hợp {gap} điểm — cần làm rõ kinh nghiệm theo ngữ cảnh công việc.
          </AppText>
        ) : null}
      </View>

      {matchedSkills.length > 0 ? (
        <View style={styles.tagSection}>
          <AppText variant="caption" style={{ color: colors.success, fontWeight: '600', marginBottom: 6 }}>
            Kỹ năng khớp
          </AppText>
          <View style={styles.tagRow}>
            {matchedSkills.slice(0, 10).map((s, i) => (
              <View key={i} style={[styles.tag, styles.tagMatch]}>
                <AppText variant="caption" style={{ color: colors.success }}>{s}</AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {missingSkills.length > 0 ? (
        <View style={styles.tagSection}>
          <AppText variant="caption" style={{ color: colors.danger, fontWeight: '600', marginBottom: 6 }}>
            Kỹ năng còn thiếu
          </AppText>
          <View style={styles.tagRow}>
            {missingSkills.slice(0, 10).map((s, i) => (
              <View key={i} style={[styles.tag, styles.tagMissing]}>
                <AppText variant="caption" style={{ color: colors.danger }}>{s}</AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {recommendations.length > 0 ? (
        <View style={styles.recBox}>
          <AppText variant="caption" style={{ fontWeight: '700' }}>Gợi ý ưu tiên</AppText>
          {recommendations.slice(0, 5).map((r, i) => (
            <AppText key={i} variant="bodySm" color="textSecondary" style={{ marginTop: 6, lineHeight: 20 }}>
              {i + 1}. {r}
            </AppText>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  heroText: { flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  barWrap: { marginTop: 6 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barTrack: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  insightBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  tagSection: { marginTop: spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  tagMatch: { backgroundColor: '#DCFCE7' },
  tagMissing: { backgroundColor: '#FEE2E2' },
  recBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { colors, radius, shadows, spacing } from '../../theme';
import { handbookService } from '../../services/api/handbookService';
import { HandbookPost } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { getHandbookCategoryLabel } from '../../constants/handbookCategories';

const CARD_WIDTH = 260;

type Nav = NativeStackNavigationProp<RootStackParamList>;

function HandbookTeaserCard({ post, onPress }: { post: HandbookPost; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      {post.featuredImageUrl ? (
        <Image source={{ uri: post.featuredImageUrl }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Feather name="book-open" size={28} color={colors.primary} />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardBadge}>
          <AppText variant="caption" style={styles.badgeText}>
            {getHandbookCategoryLabel(post.categoryKey || '').toUpperCase()}
          </AppText>
        </View>
        <AppText variant="body" numberOfLines={2} style={[styles.cardTitle, { color: colors.white }]}>
          {post.title}
        </AppText>
      </LinearGradient>
    </Pressable>
  );
}

export function HomeHandbookSection() {
  const navigation = useNavigation<Nav>();
  const [posts, setPosts] = useState<HandbookPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    handbookService
      .getFeatured(8)
      .then((data) => setPosts(data || []))
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && posts.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Feather name="book-open" size={20} color={colors.primary} />
          <AppText variant="h3">Cẩm nang tìm việc</AppText>
        </View>
        <Pressable onPress={() => navigation.navigate('Handbook')}>
          <AppText variant="caption" color="primary" style={{ fontWeight: '600' }}>
            Xem tất cả
          </AppText>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {posts.map((post) => (
            <HandbookTeaserCard
              key={post.postId}
              post={post}
              onPress={() => navigation.navigate('HandbookDetail', { slug: post.slug })}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    marginHorizontal: -spacing.xl,
    paddingVertical: spacing.lg,
    paddingLeft: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.xl,
    marginBottom: spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  scrollContent: { paddingRight: spacing.xl, gap: spacing.md },
  card: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: '700' },
  cardTitle: { fontWeight: '700', lineHeight: 22 },
});

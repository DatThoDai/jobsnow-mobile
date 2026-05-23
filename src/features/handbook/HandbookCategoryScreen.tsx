import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { colors, radius, shadows, spacing } from '../../theme';
import { handbookService } from '../../services/api/handbookService';
import { HandbookPost } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { getHandbookCategoryLabel } from '../../constants/handbookCategories';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HandbookCategoryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'HandbookCategory'>>();
  const navigation = useNavigation<Nav>();
  const categoryKey = route.params.categoryKey;
  const [posts, setPosts] = useState<HandbookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const label = getHandbookCategoryLabel(categoryKey);

  const load = useCallback(
    async (pageNum: number, append = false) => {
      try {
        const data = await handbookService.getList(pageNum, 15, categoryKey === 'all' ? undefined : categoryKey);
        const items = data?.items ?? (Array.isArray(data) ? data : []);
        setPosts((prev) => (append ? [...prev, ...items] : items));
        setHasMore(pageNum < (data?.totalPages ?? 1));
      } catch {
        if (!append) setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [categoryKey]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      load(1, false);
    }, [load])
  );

  const loadMore = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    load(next, true);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.primarySoft, colors.primary]} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={colors.textPrimary} size={22} />
        </Pressable>
        <AppText variant="h2" color="textPrimary">Cẩm nang: {label}</AppText>
      </LinearGradient>

      {loading && posts.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.postId.toString()}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText variant="body" color="textMuted">Chưa có bài viết trong danh mục này.</AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('HandbookDetail', { slug: item.slug })}
            >
              {item.featuredImageUrl ? (
                <Image source={{ uri: item.featuredImageUrl }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                  <Feather name="book-open" color={colors.primary} size={24} />
                </View>
              )}
              <View style={styles.cardBody}>
                <AppText variant="caption" color="primary" style={{ textTransform: 'uppercase' }}>
                  {getHandbookCategoryLabel(item.categoryKey || categoryKey)}
                </AppText>
                <AppText variant="body" numberOfLines={2} style={{ fontWeight: '600', marginTop: 4 }}>
                  {item.title}
                </AppText>
                <AppText variant="caption" color="textMuted" style={{ marginTop: 4 }}>
                  {item.companyName} · {formatDate(item.publishedAt)}
                </AppText>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius['2xl'],
    borderBottomRightRadius: radius['2xl'],
  },
  backBtn: { marginBottom: spacing.md, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  list: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  thumb: { width: 100, height: 100 },
  thumbPlaceholder: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, padding: spacing.md },
});

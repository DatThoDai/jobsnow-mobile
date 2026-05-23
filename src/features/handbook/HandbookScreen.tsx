import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Pressable,
  Image,
  TextInput,
  ScrollView,
  Animated,
  Modal,
  FlatList,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '../../components/AppText';
import { colors, radius, shadows, spacing } from '../../theme';
import { handbookService } from '../../services/api/handbookService';
import { HandbookPost } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';
import {
  HANDBOOK_SCROLL_CATEGORIES,
  HANDBOOK_MORE_CATEGORIES,
  getHandbookCategoryLabel,
} from '../../constants/handbookCategories';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HandbookScreen() {
  const [posts, setPosts] = useState<HandbookPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('');
  const [moreModalVisible, setMoreModalVisible] = useState(false);
  const navigation = useNavigation<Nav>();

  const scrollY = useRef(new Animated.Value(0)).current;

  const loadPosts = useCallback(async (categorySlug: string) => {
    setIsLoading(true);
    try {
      if (!categorySlug) {
        const data = await handbookService.getFeatured(30);
        setPosts(data || []);
      } else {
        const data = await handbookService.getList(1, 30, categorySlug);
        setPosts(data?.items ?? []);
      }
    } catch {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPosts(activeTab);
    }, [activeTab, loadPosts])
  );

  const handleTabPress = (slug: string) => {
    setActiveTab(slug);
  };

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const renderFeatured = (post: HandbookPost) => (
    <Pressable
      style={s.featuredCard}
      onPress={() => navigation.navigate('HandbookDetail', { slug: post.slug })}
    >
      <Image source={{ uri: post.featuredImageUrl }} style={s.featuredImg} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={s.featuredOverlay}>
        <View style={s.featuredInfo}>
          <View style={s.trendingBadge}>
            <Feather name="zap" size={12} color={colors.white} />
            <AppText variant="caption" color="white" style={{ fontWeight: '700', marginLeft: 4 }}>
              THỊNH HÀNH
            </AppText>
          </View>
          <AppText variant="h1" color="white" numberOfLines={2} style={s.featuredTitle}>
            {post.title}
          </AppText>
          <View style={s.metaRow}>
            <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {post.companyName} · {formatDate(post.publishedAt)}
            </AppText>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );

  return (
    <View style={s.container}>
      <View style={s.headerContainer}>
        <LinearGradient
          colors={[colors.primarySoft, colors.primary]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={s.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={s.iconBtn}>
            <Feather name="arrow-left" color={colors.textPrimary} size={24} />
          </Pressable>
          <AppText variant="h3" color="textPrimary" style={{ fontWeight: '700' }}>
            Cẩm nang nghề nghiệp
          </AppText>
          <View style={{ width: 44 }} />
        </View>
        <View style={s.searchBox}>
          <Feather name="search" color={colors.textSecondary} size={18} />
          <TextInput
            placeholder="Tìm kiếm bài viết..."
            placeholderTextColor={colors.textMuted}
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={s.body}>
        <View style={s.catContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catList}>
            {HANDBOOK_SCROLL_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.slug || 'all'}
                onPress={() => handleTabPress(cat.slug)}
                style={[s.catChip, activeTab === cat.slug && s.catChipActive]}
              >
                <Feather
                  name={cat.slug === '' ? 'grid' : 'book-open'}
                  size={16}
                  color={activeTab === cat.slug ? colors.white : colors.textMuted}
                />
                <AppText variant="bodySm" style={[s.catText, activeTab === cat.slug && s.catTextActive]}>
                  {cat.label}
                </AppText>
              </Pressable>
            ))}
            <Pressable onPress={() => setMoreModalVisible(true)} style={s.catChip}>
              <Feather name="more-horizontal" size={16} color={colors.textMuted} />
              <AppText variant="bodySm" style={s.catText}>
                Thêm
              </AppText>
            </Pressable>
          </ScrollView>
        </View>

        {isLoading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <Animated.FlatList
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: false,
            })}
            data={filteredPosts}
            keyExtractor={(item) => item.postId.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.listContent}
            ListHeaderComponent={
              activeTab === '' && search === '' && filteredPosts.length > 0
                ? renderFeatured(filteredPosts[0])
                : null
            }
            ListEmptyComponent={
              <View style={s.emptyState}>
                <Feather name="book-open" size={48} color={colors.border} />
                <AppText variant="h3" style={{ marginTop: 20 }}>
                  Không tìm thấy kết quả
                </AppText>
                <AppText variant="bodySm" color="textMuted" style={{ textAlign: 'center', marginTop: 8 }}>
                  Vui lòng thử tìm kiếm bằng từ khóa khác
                </AppText>
              </View>
            }
            renderItem={({ item, index }) => {
              if (activeTab === '' && search === '' && index === 0) return null;
              return (
                <Pressable
                  style={s.postCard}
                  onPress={() => navigation.navigate('HandbookDetail', { slug: item.slug })}
                >
                  <Image source={{ uri: item.featuredImageUrl }} style={s.postImg} />
                  <View style={s.postInfo}>
                    <AppText variant="caption" color="primary" style={s.postCat}>
                      {getHandbookCategoryLabel(item.categoryKey || '')}
                    </AppText>
                    <AppText variant="body" numberOfLines={2} style={s.postTitle}>
                      {item.title}
                    </AppText>
                    <View style={s.postFooter}>
                      {item.companyLogoUrl ? (
                        <Image source={{ uri: item.companyLogoUrl }} style={s.miniLogo} />
                      ) : (
                        <View style={s.dot} />
                      )}
                      <AppText variant="caption" color="textMuted">
                        {item.companyName} · {formatDate(item.publishedAt)}
                      </AppText>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>

      <Modal visible={moreModalVisible} transparent animationType="slide">
        <Pressable style={s.modalOverlay} onPress={() => setMoreModalVisible(false)}>
          <Pressable style={s.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={s.modalHandle} />
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>
              Danh mục khác
            </AppText>
            <FlatList
              data={HANDBOOK_MORE_CATEGORIES}
              keyExtractor={(item) => item.slug}
              renderItem={({ item }) => (
                <Pressable
                  style={s.moreItem}
                  onPress={() => {
                    setMoreModalVisible(false);
                    navigation.navigate('HandbookCategory', { categoryKey: item.slug });
                  }}
                >
                  <AppText variant="body">{item.label}</AppText>
                  <Feather name="chevron-right" size={18} color={colors.textMuted} />
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerContainer: {
    paddingTop: 50,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 40,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  body: { flex: 1, marginTop: 0 },
  catContainer: { backgroundColor: 'transparent', paddingVertical: spacing.md },
  catList: { paddingHorizontal: spacing.lg, gap: 12 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark, ...shadows.md },
  catText: { color: colors.textMuted, fontWeight: '600' },
  catTextActive: { color: colors.white },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.lg, paddingBottom: 100 },
  featuredCard: {
    height: 260,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 30,
    ...shadows.lg,
    elevation: 8,
  },
  featuredImg: { width: '100%', height: '100%' },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: spacing.xl },
  featuredInfo: { gap: 8 },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredTitle: { fontSize: 20, lineHeight: 28, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  postCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: 16,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  postImg: { width: 90, height: 90, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt },
  postInfo: { flex: 1, marginLeft: spacing.md, gap: 4 },
  postCat: { textTransform: 'uppercase', letterSpacing: 1, fontWeight: '800', fontSize: 10, marginBottom: 2 },
  postTitle: { lineHeight: 20, fontWeight: '700', fontSize: 15 },
  postFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  miniLogo: { width: 16, height: 16, borderRadius: 8, marginRight: 6, backgroundColor: colors.surfaceAlt },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginRight: 6 },
  emptyState: { alignItems: 'center', paddingVertical: 80 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing.lg,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  moreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});

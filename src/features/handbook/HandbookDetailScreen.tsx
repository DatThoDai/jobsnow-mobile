import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, ActivityIndicator, Pressable, useWindowDimensions, Image, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RenderHtml from 'react-native-render-html';
import { AppText } from '../../components/AppText';
import { ScreenOverlayHeader, HeaderOverlayButton } from '../../components/ScreenOverlayHeader';
import { colors, radius, shadows, spacing } from '../../theme';
import { handbookService } from '../../services/api/handbookService';
import { HandbookDetail } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';
import { LinearGradient } from 'expo-linear-gradient';
import {
  buildHandbookShareUrl,
  openFacebookShare,
  openLinkedInShare,
  shareNative,
} from '../../utils/share';

type RouteProps = RouteProp<RootStackParamList, 'HandbookDetail'>;

export function HandbookDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { width } = useWindowDimensions();
  const [post, setPost] = useState<HandbookDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const load = async () => {
      try {
        const data = await handbookService.getBySlug(route.params.slug);
        setPost(data);
      } catch (e) {
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [route.params.slug]);

  if (isLoading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!post) {
    return (
      <View style={s.centered}>
        <AppText variant="h3">Không tìm thấy bài viết</AppText>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: spacing.md }}>
          <AppText color="primary">Quay lại</AppText>
        </Pressable>
      </View>
    );
  }

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: [1.2, 1, 1],
    extrapolate: 'clamp',
  });

  // Extract content carefully
  const htmlContent = post.contentHtml || (post as any).content || (post as any).body || '<p>Nội dung bài viết hiện chưa có sẵn.</p>';

  return (
    <View style={s.container}>
      <ScreenOverlayHeader
        onBack={() => navigation.goBack()}
        right={
          <HeaderOverlayButton
            onPress={() => shareNative(post.title, buildHandbookShareUrl(post.slug))}
          >
            <Feather name="share-2" color={colors.white} size={20} />
          </HeaderOverlayButton>
        }
      />

      <Animated.ScrollView
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.imageContainer}>
          <Animated.Image 
            source={{ uri: post.featuredImageUrl }} 
            style={[s.image, { transform: [{ scale: imageScale }] }]} 
          />
          <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.8)']} style={s.imageOverlay} />
          <View style={s.imageContent}>
            <View style={s.categoryBadge}>
              <AppText variant="caption" color="white" style={{ fontWeight: '700' }}>{post.categoryKey || 'Cẩm nang'}</AppText>
            </View>
            <AppText variant="h1" color="white" style={s.title}>{post.title}</AppText>
          </View>
        </View>

        <View style={s.contentCard}>
          <View style={s.authorRow}>
            {post.companyLogoUrl ? (
              <Image source={{ uri: post.companyLogoUrl }} style={s.authorAvatarImg} />
            ) : (
              <View style={s.authorAvatar}>
                <Feather name="user" size={20} color={colors.primary} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <AppText variant="body" style={{ fontWeight: '600' }}>{post.companyName || 'JobsNow Editor'}</AppText>
              <AppText variant="caption" color="textMuted">{new Date(post.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}</AppText>
            </View>
          </View>

          <View style={s.htmlContainer}>
            <RenderHtml
              contentWidth={width - spacing.lg * 2}
              source={{ html: htmlContent }}
              tagsStyles={{
                p: { color: colors.textPrimary, marginBottom: 16, fontSize: 16, lineHeight: 26, textAlign: 'justify' },
                h2: { color: colors.textPrimary, marginTop: 32, marginBottom: 12, fontSize: 22, fontWeight: '700' },
                h3: { color: colors.textPrimary, marginTop: 24, marginBottom: 10, fontSize: 18, fontWeight: '700' },
                img: { borderRadius: radius.lg, marginVertical: 16 },
                li: { color: colors.textPrimary, fontSize: 16, lineHeight: 24, marginBottom: 8 },
                strong: { fontWeight: '700', color: colors.primaryDark },
                a: { color: colors.primary, textDecorationLine: 'none', fontWeight: '600' },
              }}
            />
          </View>

          <View style={s.footer}>
            <AppText variant="bodySm" color="textMuted" style={{ textAlign: 'center', fontStyle: 'italic' }}>
              Hy vọng bài viết này mang lại giá trị cho bạn trong hành trình sự nghiệp!
            </AppText>
            <View style={s.tagRow}>
              <View style={s.tag}><AppText variant="caption" color="textSecondary">#Tuyển dụng</AppText></View>
              <View style={s.tag}><AppText variant="caption" color="textSecondary">#Sự nghiệp</AppText></View>
              <View style={s.tag}><AppText variant="caption" color="textSecondary">#Tips</AppText></View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { height: 350, width: '100%', position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  imageContent: { position: 'absolute', bottom: 40, left: spacing.lg, right: spacing.lg },
  categoryBadge: {
    alignSelf: 'flex-start', backgroundColor: colors.primary,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, marginBottom: 10,
  },
  title: { lineHeight: 36, fontWeight: '800' },
  contentCard: {
    backgroundColor: colors.background, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    padding: spacing.lg, paddingTop: 30, minHeight: 500,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 30, paddingBottom: 20, borderBottomWidth: 1, borderColor: colors.border },
  authorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  authorAvatarImg: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  htmlContainer: { paddingBottom: 40 },
  footer: { marginTop: 40, paddingVertical: 30, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' },
  tagRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 20 },
  tag: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
});

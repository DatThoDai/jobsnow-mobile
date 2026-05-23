import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable, Image, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import { colors, radius, spacing, fontFamilies } from '../../theme';
import { companyService } from '../../services/api/companyService';
import { Company } from '../../services/api/models';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function CompanyListingScreen() {
  const navigation = useNavigation<Nav>();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filtered, setFiltered] = useState<Company[]>([]);
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    companyService
      .getAllCompanies()
      .then((list) => {
        setCompanies(list);
        setFiltered(list);
      })
      .catch(() => {
        setCompanies([]);
        setFiltered([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) {
      setFiltered(companies);
      return;
    }
    setFiltered(
      companies.filter(
        (c) =>
          c.companyName.toLowerCase().includes(q) ||
          (c.industry?.toLowerCase().includes(q) ?? false) ||
          (c.address?.toLowerCase().includes(q) ?? false)
      )
    );
  }, [keyword, companies]);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={colors.textPrimary} size={22} />
        </Pressable>
        <AppText variant="h2">Danh sách công ty</AppText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" color={colors.textMuted} size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm công ty..."
          placeholderTextColor={colors.textMuted}
          value={keyword}
          onChangeText={setKeyword}
        />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.companyId.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <AppText variant="body" color="textMuted">Không tìm thấy công ty.</AppText>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('CompanyDetail', { companyId: item.companyId })}
            >
              {item.logoUrl ? (
                <Image source={{ uri: item.logoUrl }} style={styles.logo} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Feather name="briefcase" color={colors.primary} size={22} />
                </View>
              )}
              <View style={styles.info}>
                <AppText variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
                  {item.companyName}
                </AppText>
                <AppText variant="caption" color="textMuted" numberOfLines={1}>
                  {item.industry || item.address || 'Việt Nam'}
                </AppText>
              </View>
              <Feather name="chevron-right" color={colors.textMuted} size={18} />
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    height: 46,
  },
  searchInput: { flex: 1, fontFamily: fontFamilies.body, fontSize: 16, color: colors.textPrimary },
  center: { alignItems: 'center', paddingTop: spacing['3xl'] },
  list: { paddingBottom: spacing['3xl'] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: { width: 48, height: 48, borderRadius: 12 },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
});

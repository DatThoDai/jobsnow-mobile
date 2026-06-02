import React, { useCallback, useState } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Pressable, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/AppText';
import {colors, radius, spacing, zIndex } from '../../theme';

import { companyService, FollowedCompanyItem } from '../../services/api/companyService';
import { RootStackParamList } from '../../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FollowedCompaniesScreen() {
  const navigation = useNavigation<Nav>();
  const [companies, setCompanies] = useState<FollowedCompanyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setIsLoading(true);
        try {
          const page = await companyService.getMyFollowedCompanies(0, 50);
          setCompanies(page.content ?? []);
        } catch {
          setCompanies([]);
        } finally {
          setIsLoading(false);
        }
      };
      load();
    }, [])
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" color={colors.textPrimary} size={22} />
        </Pressable>
        <AppText variant="h2">Công ty đang theo dõi</AppText>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={companies}
          keyExtractor={(item) => item.companyId.toString()}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="heart" color={colors.textMuted} size={48} />
              <AppText variant="body" color="textMuted" style={{ marginTop: spacing.md }}>
                Bạn chưa theo dõi công ty nào.
              </AppText>
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
                {item.address ? (
                  <AppText variant="caption" color="textMuted" numberOfLines={1}>
                    {item.address}
                  </AppText>
                ) : null}
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
    marginBottom: spacing.lg,
  },
  backBtn: {
    zIndex: zIndex.overlayHeader,
    elevation: zIndex.overlayHeader,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing['3xl'] },
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

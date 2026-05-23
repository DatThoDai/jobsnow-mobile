import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

import { useAuthStore } from '../stores/useAuthStore';
import { JobDetailScreen } from '../features/jobs/JobDetailScreen';
import { CompanyDetailScreen } from '../features/company/CompanyDetailScreen';
import { CompanyListingScreen } from '../features/company/CompanyListingScreen';
import { FollowedCompaniesScreen } from '../features/company/FollowedCompaniesScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { ResumeListScreen } from '../features/resume/ResumeListScreen';
import { ResumeDetailScreen } from '../features/resume/ResumeDetailScreen';
import { ResumeEditScreen } from '../features/resume/ResumeEditScreen';
import { CVImproveScreen } from '../features/resume/CVImproveScreen';
import { CVBuilderWebViewScreen } from '../features/resume/CVBuilderWebViewScreen';
import { HandbookScreen } from '../features/handbook/HandbookScreen';
import { HandbookDetailScreen } from '../features/handbook/HandbookDetailScreen';
import { HandbookCategoryScreen } from '../features/handbook/HandbookCategoryScreen';
import { ChatListScreen } from '../features/chat/ChatListScreen';
import { ChatScreen } from '../features/chat/ChatScreen';
import { EditProfileScreen } from '../features/profile/EditProfileScreen';
import { PublicCVPreviewScreen } from '../features/profile/PublicCVPreviewScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { PricingScreen } from '../features/pricing/PricingScreen';
import { PaymentResultScreen } from '../features/pricing/PaymentResultScreen';
import { colors } from '../theme';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  JobDetail: { jobId: number };
  CompanyDetail: { companyId: number };
  CompanyListing: undefined;
  FollowedCompanies: undefined;
  Notifications: undefined;
  ResumeList: undefined;
  ResumeDetail: { resumeId: number };
  ResumeEdit: { resumeId: number };
  CVImprove: undefined;
  CVBuilder: undefined;
  Handbook: undefined;
  HandbookDetail: { slug: string };
  HandbookCategory: { categoryKey: string };
  ChatList: undefined;
  Chat: { conversationId: number; otherUserName: string; otherUserAvatar?: string };
  EditProfile: undefined;
  Settings: undefined;
  Dashboard: undefined;
  Pricing: undefined;
  PaymentResult: { status?: string; txnRef?: string; flow?: string };
  PublicCVPreview: { profileId: number; resumeId?: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isHydrating, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (isHydrating) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="JobDetail" component={JobDetailScreen} />
          <Stack.Screen name="CompanyDetail" component={CompanyDetailScreen} />
          <Stack.Screen name="CompanyListing" component={CompanyListingScreen} />
          <Stack.Screen name="FollowedCompanies" component={FollowedCompaniesScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="ResumeList" component={ResumeListScreen} />
          <Stack.Screen name="ResumeDetail" component={ResumeDetailScreen} />
          <Stack.Screen name="ResumeEdit" component={ResumeEditScreen} />
          <Stack.Screen name="CVImprove" component={CVImproveScreen} />
          <Stack.Screen name="CVBuilder" component={CVBuilderWebViewScreen} />
          <Stack.Screen name="Handbook" component={HandbookScreen} />
          <Stack.Screen name="HandbookDetail" component={HandbookDetailScreen} />
          <Stack.Screen name="HandbookCategory" component={HandbookCategoryScreen} />
          <Stack.Screen name="ChatList" component={ChatListScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Pricing" component={PricingScreen} />
          <Stack.Screen name="PaymentResult" component={PaymentResultScreen} />
          <Stack.Screen name="PublicCVPreview" component={PublicCVPreviewScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}

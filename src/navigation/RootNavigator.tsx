import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStack } from './AuthStack';
import { MainTabs } from './MainTabs';

import { useAuthStore } from '../stores/useAuthStore';
import { JobDetailScreen } from '../features/jobs/JobDetailScreen';
import { CompanyDetailScreen } from '../features/company/CompanyDetailScreen';
import { NotificationsScreen } from '../features/notifications/NotificationsScreen';
import { ResumeListScreen } from '../features/resume/ResumeListScreen';
import { ResumeDetailScreen } from '../features/resume/ResumeDetailScreen';
import { HandbookScreen } from '../features/handbook/HandbookScreen';
import { HandbookDetailScreen } from '../features/handbook/HandbookDetailScreen';
import { ChatListScreen } from '../features/chat/ChatListScreen';
import { ChatScreen } from '../features/chat/ChatScreen';
import { EditProfileScreen } from '../features/profile/EditProfileScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  JobDetail: { jobId: number };
  CompanyDetail: { companyId: number };
  Notifications: undefined;
  ResumeList: undefined;
  ResumeDetail: { resumeId: number };
  Handbook: undefined;
  HandbookDetail: { slug: string };
  ChatList: undefined;
  Chat: { conversationId: number; otherUserName: string; otherUserAvatar?: string };
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="JobDetail" component={JobDetailScreen} />
          <Stack.Screen name="CompanyDetail" component={CompanyDetailScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="ResumeList" component={ResumeListScreen} />
          <Stack.Screen name="ResumeDetail" component={ResumeDetailScreen} />
          <Stack.Screen name="Handbook" component={HandbookScreen} />
          <Stack.Screen name="HandbookDetail" component={HandbookDetailScreen} />
          <Stack.Screen name="ChatList" component={ChatListScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}

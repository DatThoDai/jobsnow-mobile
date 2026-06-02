import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { resumeService } from '../services/api/resumeService';
import { getApiErrorMessage } from '../utils/apiError';
import { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function useResumeCreation(profileId: number | undefined, _resumeCount = 0) {
  const navigation = useNavigation<Nav>();

  const ensureProfile = useCallback(() => {
    if (!profileId) {
      Alert.alert('Yêu cầu đăng nhập', 'Vui lòng đăng nhập và hoàn thiện hồ sơ.');
      return false;
    }
    return true;
  }, [profileId]);

  const createManual = useCallback(() => {
    if (!ensureProfile()) return;
    navigation.navigate('ManualCVCreate');
  }, [ensureProfile, navigation]);

  const uploadFile = useCallback(async () => {
    if (!ensureProfile() || !profileId) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const uploadResult = await resumeService.uploadResume(
        profileId,
        {
          uri: asset.uri,
          name: asset.name ?? 'CV.pdf',
          mimeType: asset.mimeType ?? 'application/pdf',
        },
        asset.name?.replace(/\.[^.]+$/, '') ?? 'CV'
      );
      if (uploadResult.parseStatus === 'SUCCESS') {
        Alert.alert('Thành công', 'Đã tải lên và phân tích CV.');
      } else if (uploadResult.parseStatus === 'PARTIAL') {
        Alert.alert('Đã tải lên', 'CV đã lưu; một số mục cần kiểm tra lại.');
      } else if (uploadResult.parseStatus === 'FAILED') {
        Alert.alert('Đã tải lên', 'File đã lưu; nội dung có thể cần chỉnh tay.');
      } else {
        Alert.alert('Thành công', 'Đã tải lên CV thành công.');
      }
      navigation.navigate('ResumeList');
    } catch (e: unknown) {
      Alert.alert('Lỗi', getApiErrorMessage(e, 'Không thể tải lên CV'));
    }
  }, [ensureProfile, profileId, navigation]);

  const openImprove = useCallback(
    (resumeId?: number) => {
      if (resumeId) {
        navigation.navigate('CVImprove', { resumeId, autoRun: true });
      } else {
        navigation.navigate('CVImprove');
      }
    },
    [navigation]
  );

  const openAiGenerate = useCallback(() => {
    navigation.navigate('CVGenerateAI');
  }, [navigation]);

  return { createManual, uploadFile, openImprove, openAiGenerate, ensureProfile };
}

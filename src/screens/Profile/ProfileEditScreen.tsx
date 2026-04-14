import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Theme } from '../../constants/Theme';
import ScreenHeader from '../../components/ScreenHeader';
import { useAuth } from '../../store/AuthContext';
import { UserService } from '../../services/api';

const avatars = ['😊', '🌞', '❓', '👓', '🔥', '❤️', '📚', '💪', '⭐', '🐾', '🌸', '🍃'];

export default function ProfileEditScreen({ navigation }: any) {
  const { user, profile, updateUser, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // 基本信息
  const [selectedAvatar, setSelectedAvatar] = useState<string>(user?.avatarEmoji || '😊');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(profile?.bio || '');
  
  // 身体数据
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(profile?.gender || 'male');
  const [heightCm, setHeightCm] = useState(profile?.heightCm?.toString() || '');
  const [weightKg, setWeightKg] = useState(profile?.weightKg?.toString() || '');
  const [targetWeightKg, setTargetWeightKg] = useState(profile?.targetWeightKg?.toString() || '');
  const [birthDate, setBirthDate] = useState(profile?.birthDate || '');
  const [showDatePicker, setShowDatePicker] = useState(false);


  // 加载现有数据
  useEffect(() => {
    if (user) {
      setSelectedAvatar(user.avatarEmoji || '😊');
      setAvatarUrl(user.avatarUrl || '');
      setNickname(user.nickname || '');
    }
    if (profile) {
      setBio(profile.bio || '');
      setGender(profile.gender || 'male');
      setHeightCm(profile.heightCm?.toString() || '');
      setWeightKg(profile.weightKg?.toString() || '');
      setTargetWeightKg(profile.targetWeightKg?.toString() || '');
      setBirthDate(profile.birthDate || '');

    }
  }, [user, profile]);

  const handleSave = async () => {
    if (!nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }
    
    setIsSaving(true);
    try {
      // 保存用户信息
      const userUpdate: any = {};
      if (nickname !== user?.nickname) userUpdate.nickname = nickname.trim();
      if (selectedAvatar !== user?.avatarEmoji) userUpdate.avatarEmoji = selectedAvatar;
      if (avatarUrl !== user?.avatarUrl) userUpdate.avatarUrl = avatarUrl;
      
      if (Object.keys(userUpdate).length > 0) {
        await updateUser(userUpdate);
      }
      
      // 保存用户画像
      const profileData: any = {};
      if (bio !== profile?.bio) profileData.bio = bio.trim();
      if (gender !== profile?.gender) profileData.gender = gender;
      if (heightCm) profileData.heightCm = parseFloat(heightCm);
      if (weightKg) profileData.weightKg = parseFloat(weightKg);
      if (targetWeightKg) profileData.targetWeightKg = parseFloat(targetWeightKg);
      if (birthDate) profileData.birthDate = birthDate;
      
      if (Object.keys(profileData).length > 0) {
        await updateProfile(profileData);
      }
      
      Alert.alert('保存成功', '您的个人画像已更新');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('保存失败', error.message || '请检查网络连接');
    } finally {
      setIsSaving(false);
    }
  };

  // 选择图片并上传
  const handlePickImage = async () => {
    try {
      console.log('[头像上传] 开始选择图片...');
      
      // 请求权限
      const permissionResult = await (ImagePicker as any).requestMediaLibraryPermissionsAsync();
      console.log('[头像上传] 权限结果:', permissionResult.status);
      if (permissionResult.status !== 'granted') {
        Alert.alert('提示', '需要访问相册权限才能选择头像');
        return;
      }

      // 选择图片 - 用户自己裁剪
      console.log('[头像上传] 打开图片选择器...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      } as any);
      console.log('[头像上传] 选择结果:', result.canceled ? '取消' : '已选择');

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const selectedAsset = result.assets[0];
      console.log('[头像上传] 选择的图片 URI:', selectedAsset.uri.substring(0, 50) + '...');
      setIsUploading(true);

      // 压缩图片
      console.log('[头像上传] 开始压缩图片...');
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        selectedAsset.uri,
        [{ resize: { width: 800, height: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('[头像上传] 压缩后 URI:', manipulatedImage.uri.substring(0, 50) + '...');

      // 获取上传URL
      console.log('[头像上传] 获取上传 URL...');
      const uploadRes = await UserService.getAvatarUploadUrl(`${Date.now()}.jpg`);
      console.log('[头像上传] 上传 URL 响应:', uploadRes.code === 0 ? '成功' : '失败');
      if (uploadRes.code !== 0) {
        throw new Error(uploadRes.message || '获取上传地址失败');
      }

      const { uploadUrl, avatarUrl: newAvatarUrl } = uploadRes.data;
      console.log('[头像上传] 预签名 URL:', uploadUrl.substring(0, 60) + '...');

      // 读取文件
      console.log('[头像上传] 读取文件...');
      const fileInfo = await FileSystem.getInfoAsync(manipulatedImage.uri);
      console.log('[头像上传] 文件信息:', fileInfo);
      
      // 使用 FileSystem.uploadAsync 上传（更稳定）
      console.log('[头像上传] 开始上传...');
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, manipulatedImage.uri, {
        httpMethod: 'PUT',
        headers: {
          'Content-Type': 'image/jpeg',
        },
        uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
      });
      console.log('[头像上传] 上传结果状态:', uploadResult.status);

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`上传失败: HTTP ${uploadResult.status}`);
      }

      // 更新本地状态
      console.log('[头像上传] 上传成功，更新状态...');
      setAvatarUrl(newAvatarUrl);
      Alert.alert('上传成功', '头像已更新，请保存修改');
    } catch (error: any) {
      console.error('[头像上传] 失败:', error);
      Alert.alert('上传失败', error.message || '请重试');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <ScreenHeader title="个人画像" subtitle="完善您的个人信息" />

        {/* 头像选择 */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handlePickImage}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="large" color={Theme.colors.primary} />
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={{ fontSize: 40 }}>{selectedAvatar}</Text>
            )}
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>点击更换头像</Text>
        </View>

        {/* 表情选择器 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择头像</Text>
          <View style={styles.avatarGrid}>
            {avatars.map((iconName, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.avatarOption,
                  selectedAvatar === iconName && styles.avatarOptionSelected
                ]}
                onPress={() => {
                  setSelectedAvatar(iconName)
                  setAvatarUrl('')
                }}
              >
                <Text style={{ fontSize: 24, color: selectedAvatar === iconName ? Theme.colors.primary : Theme.colors.textSecondary }}>{iconName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>昵称</Text>
              <TextInput 
                style={styles.input}
                value={nickname}
                onChangeText={setNickname}
                placeholder="输入您的昵称"
                placeholderTextColor={Theme.colors.textMuted}
                editable={!isSaving}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>用户ID</Text>
              <TextInput 
                style={[styles.input, styles.inputDisabled]}
                value={user?.id?.slice(0, 8) || ''}
                editable={false}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>个性签名</Text>
              <TextInput 
                style={styles.input}
                value={bio}
                onChangeText={setBio}
                placeholder="输入个性签名"
                multiline
                numberOfLines={2}
                editable={!isSaving}
              />
            </View>
          </View>
        </View>

        {/* 身体数据 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>身体数据</Text>
          <View style={styles.card}>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>身高 (cm)</Text>
                <TextInput 
                  style={styles.input}
                  value={heightCm}
                  onChangeText={setHeightCm}
                  placeholder="170"
                placeholderTextColor={Theme.colors.textMuted}
                  keyboardType="numeric"
                  editable={!isSaving}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>体重 (kg)</Text>
                <TextInput 
                  style={styles.input}
                  value={weightKg}
                  onChangeText={setWeightKg}
                  placeholder="65"
                placeholderTextColor={Theme.colors.textMuted}
                  keyboardType="numeric"
                  editable={!isSaving}
                />
              </View>
            </View>
            
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>目标体重 (kg)</Text>
                <TextInput 
                  style={styles.input}
                  value={targetWeightKg}
                  onChangeText={setTargetWeightKg}
                  placeholder="60"
                placeholderTextColor={Theme.colors.textMuted}
                  keyboardType="numeric"
                  editable={!isSaving}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>出生日期</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                  disabled={isSaving}
                >
                  <Text style={birthDate ? styles.dateText : styles.datePlaceholder}>
                    {birthDate || '选择出生日期'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={Theme.colors.textMuted} />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={birthDate ? new Date(birthDate) : new Date(1999, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setBirthDate(selectedDate.toISOString().split('T')[0]);
                      }
                    }}
                  />
                )}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>性别</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity 
                  style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
                  onPress={() => setGender('male')}
                  disabled={isSaving}
                >
                  <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>男</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
                  onPress={() => setGender('female')}
                  disabled={isSaving}
                >
                  <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>女</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.genderBtn, gender === 'other' && styles.genderBtnActive]}
                  onPress={() => setGender('other')}
                  disabled={isSaving}
                >
                  <Text style={[styles.genderText, gender === 'other' && styles.genderTextActive]}>其他</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveBtnText}>保存修改</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarEmoji: {
    width: 96,
    height: 96,
    backgroundColor: Theme.colors.primary,
    borderRadius: 48,
    textAlign: 'center',
    lineHeight: 96,
    fontSize: 48,
    color: 'white',
    ...Theme.shadows.button,
  },
  avatarHint: {
    marginTop: Theme.spacing.compact,
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.compact,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.compact,
  },
  avatarOption: {
    width: 48,
    height: 48,
    backgroundColor: Theme.colors.cream,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOptionSelected: {
    backgroundColor: Theme.colors.primaryLight,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
  },
  avatarOptionText: {
    fontSize: 24,
  },
  card: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    padding: Theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
  },
  inputLabel: {
    fontSize: Theme.typography.sizes.body,
    color: Theme.colors.textSecondary,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    backgroundColor: Theme.colors.cream,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.compact,
    fontSize: Theme.typography.sizes.h3,
    color: Theme.colors.text,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.cream,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.compact,
  },
  dateText: {
    fontSize: Theme.typography.sizes.h3,
    color: Theme.colors.text,
  },
  datePlaceholder: {
    fontSize: Theme.typography.sizes.h3,
    color: Theme.colors.textMuted,
  },
  inputDisabled: {
    color: Theme.colors.textSecondary,
    backgroundColor: Theme.colors.border,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.compact,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: Theme.colors.cream,
    paddingVertical: Theme.spacing.compact,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  genderText: {
    fontSize: Theme.typography.sizes.h3,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.typography.weights.medium,
  },
  genderTextActive: {
    color: 'white',
  },
  goalContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.compact,
  },
  goalBtn: {
    flex: 1,
    backgroundColor: Theme.colors.cream,
    paddingVertical: Theme.spacing.compact,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
  },
  goalBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  goalText: {
    fontSize: Theme.typography.sizes.h3,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.typography.weights.medium,
  },
  goalTextActive: {
    color: 'white',
  },
  saveBtn: {
    margin: Theme.spacing.lg,
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.lg,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    ...Theme.shadows.button,
  },
  saveBtnText: {
    color: 'white',
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.bold,
  },
});

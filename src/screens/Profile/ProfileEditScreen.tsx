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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '../../constants/Colors';
import { useAuth } from '../../store/AuthContext';
import { UserService } from '../../services/api';

const avatars = ['😊', '😄', '🤔', '😎', '🤬', '😍', '🤓', '💪', '🌟', '🐼', '🌸', '🍎'];

export default function ProfileEditScreen({ navigation }: any) {
  const { user, profile, updateUser, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // 基本信息
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatarEmoji || '😊');
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
      if (nickname !== user?.nickname || selectedAvatar !== user?.avatarEmoji) {
        await updateUser({
          nickname: nickname.trim(),
          avatarEmoji: selectedAvatar,
        });
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* 头像选择 */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{selectedAvatar}</Text>
          </View>
          <Text style={styles.avatarHint}>点击头像更换</Text>
        </View>

        {/* 表情选择器 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>选择头像</Text>
          <View style={styles.avatarGrid}>
            {avatars.map((emoji, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.avatarOption,
                  selectedAvatar === emoji && styles.avatarOptionSelected
                ]}
                onPress={() => setSelectedAvatar(emoji)}
              >
                <Text style={styles.avatarOptionText}>{emoji}</Text>
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
                placeholderTextColor={Colors.textMuted}
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
                placeholderTextColor={Colors.textMuted}
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
                placeholderTextColor={Colors.textMuted}
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
                placeholderTextColor={Colors.textMuted}
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
                  <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
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
    backgroundColor: Colors.background,
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
    padding: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarEmoji: {
    width: 96,
    height: 96,
    backgroundColor: Colors.primary,
    borderRadius: 48,
    textAlign: 'center',
    lineHeight: 96,
    fontSize: 48,
    color: 'white',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarHint: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarOption: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOptionSelected: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarOptionText: {
    fontSize: 24,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 15,
    color: Colors.text,
  },
  datePlaceholder: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  inputDisabled: {
    color: Colors.textSecondary,
    backgroundColor: '#E5E7EB',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: Colors.primary,
  },
  genderText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  genderTextActive: {
    color: 'white',
  },
  goalContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  goalBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  goalBtnActive: {
    backgroundColor: Colors.primary,
  },
  goalText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  goalTextActive: {
    color: 'white',
  },
  saveBtn: {
    margin: 16,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

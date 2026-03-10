import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { useAuth } from '../../store/AuthContext';

const avatars = ['😊', '😄', '🤔', '😎', '🤬', '😍', '🤓', '💪', '🌟', '🐼', '🌸', '🍎'];

export default function ProfileEditScreen({ navigation }: any) {
  const { user, profile, updateProfile } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_emoji || '😊');
  const [nickname, setNickname] = useState(user?.nickname || 'User');
  const [bio, setBio] = useState('记录饮食，养成健康习惯');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

  const handleSave = async () => {
    // 模拟保存
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* 头像选择 */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>{selectedAvatar}</Text>
            <TouchableOpacity style={styles.cameraBtn}>
              <Ionicons name="camera" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
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
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>用户ID</Text>
              <TextInput 
                style={[styles.input, styles.inputDisabled]}
                value="12345678"
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
                  value="170"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>体重 (kg)</Text>
                <TextInput 
                  style={styles.input}
                  value="65"
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>性别</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity 
                  style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
                  onPress={() => setGender('male')}
                >
                  <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>男</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
                  onPress={() => setGender('female')}
                >
                  <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>女</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>年龄</Text>
              <TextInput 
                style={styles.input}
                value="25"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>保存修改</Text>
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
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
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
  inputDisabled: {
    color: Colors.textMuted,
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
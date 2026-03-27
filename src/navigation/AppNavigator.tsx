import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';
import { useAuth } from '../store/AuthContext';

// 导入页面
import HomeScreen from '../screens/Home/HomeScreen';
import RecordScreen from '../screens/Record/RecordScreen';
import CameraScreen from '../screens/Record/CameraScreen';
import FoodSearchScreen from '../screens/Record/FoodSearchScreen';
import FoodAIInputScreen from '../screens/Record/FoodAIInputScreen';
import VoiceRecordScreen from '../screens/Record/VoiceRecordScreen';
import AnalyticsScreen from '../screens/Analytics/AnalyticsScreen';
import ConsultScreen from '../screens/Consult/ConsultScreen';
import ChatScreen from '../screens/Consult/ChatScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ProfileEditScreen from '../screens/Profile/ProfileEditScreen';
import MealPlanScreen from '../screens/MealPlan/MealPlanScreen';
import MealPlanDetailScreen from '../screens/MealPlan/MealPlanDetailScreen';
import AIGeneratePlanInputScreen from '../screens/MealPlan/AIGeneratePlanInputScreen';
import AIGeneratePlanPreviewScreen from '../screens/MealPlan/AIGeneratePlanPreviewScreen';
import HistoryMealPlanListScreen from '../screens/MealPlan/HistoryMealPlanListScreen';
import HistoryMealPlanDetailScreen from '../screens/MealPlan/HistoryMealPlanDetailScreen';
import NotificationSettings from '../screens/Settings/NotificationSettings';
import FeedbackScreen from '../screens/Settings/FeedbackScreen';
import AboutScreen from '../screens/Settings/AboutScreen';
import AchievementsScreen from '../screens/Profile/AchievementsScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();

// 底部Tab导航器
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home';
          
          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'AnalyticsTab':
              iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              break;
            case 'RecordTab':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case 'ConsultTab':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        headerShown: false,
        tabBarStyle: {
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 4,
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ tabBarLabel: '首页' }}
      />
      <Tab.Screen 
        name="AnalyticsTab" 
        component={AnalyticsScreen} 
        options={{ tabBarLabel: '分析' }}
      />
      <Tab.Screen 
        name="RecordTab" 
        component={RecordScreen} 
        options={{ 
          tabBarLabel: '记录',
          tabBarIcon: ({ color }) => (
            <View style={{
              width: 56,
              height: 56,
              backgroundColor: Colors.primary,
              borderRadius: 28,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: -20,
              borderWidth: 4,
              borderColor: Colors.background,
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <Ionicons name="add" size={32} color="white" />
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="ConsultTab" 
        component={ConsultScreen} 
        options={{ tabBarLabel: '咨询' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ tabBarLabel: '我的' }}
      />
    </Tab.Navigator>
  );
}

// 认证导航器
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// 主应用导航器（包含所有页面）
function AppStackNavigator() {
  return (
    <MainStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background }
      }}
    >
      {/* Tab主界面 */}
      <MainStack.Screen name="Main" component={MainTabNavigator} />
      
      {/* 记录相关页面 */}
      <MainStack.Screen 
        name="Camera" 
        component={CameraScreen} 
        options={{ 
          headerShown: false,
          presentation: 'fullScreenModal'
        }}
      />
      <MainStack.Screen 
        name="FoodSearch" 
        component={FoodSearchScreen}
        options={{ headerShown: true, title: '搜索食物' }}
      />
      <MainStack.Screen 
        name="FoodAIInput" 
        component={FoodAIInputScreen}
        options={{ headerShown: true, title: 'AI 智能分析' }}
      />
      <MainStack.Screen 
        name="VoiceRecord" 
        component={VoiceRecordScreen}
        options={{ headerShown: false }}
      />
      
      {/* 咨询页面 */}
      <MainStack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ headerShown: true, title: 'AI营养顾问' }}
      />
      
      {/* 个人资料页面 */}
      <MainStack.Screen 
        name="ProfileEdit" 
        component={ProfileEditScreen} 
        options={{ headerShown: true, title: '个人画像' }}
      />
      
      {/* 食谱管理页面 */}
      <MainStack.Screen 
        name="MealPlan" 
        component={MealPlanScreen} 
        options={{ headerShown: true, title: '我的食谱' }}
      />
      <MainStack.Screen 
        name="MealPlanDetail" 
        component={MealPlanDetailScreen}
        options={{ headerShown: true, title: '食谱详情' }}
      />
      <MainStack.Screen 
        name="AIGeneratePlanInput" 
        component={AIGeneratePlanInputScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="AIGeneratePlanPreview" 
        component={AIGeneratePlanPreviewScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="HistoryMealPlanList" 
        component={HistoryMealPlanListScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="HistoryMealPlanDetail" 
        component={HistoryMealPlanDetailScreen}
        options={{ headerShown: false }}
      />
      
      {/* 设置页面 */}
      <MainStack.Screen 
        name="NotificationSettings" 
        component={NotificationSettings} 
        options={{ headerShown: true, title: '提醒设置' }}
      />
      <MainStack.Screen 
        name="Feedback" 
        component={FeedbackScreen}
        options={{ headerShown: true, title: '意见反馈' }}
      />
      <MainStack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ headerShown: true, title: '关于膳智' }}
      />
      
      {/* 成就页面 */}
      <MainStack.Screen 
        name="Achievements" 
        component={AchievementsScreen}
        options={{ headerShown: true, title: '我的成就' }}
      />
    </MainStack.Navigator>
  );
}

// 根导航器
export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  // 加载中显示加载界面
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: Colors.background 
      }}>
        <View style={{
          width: 80,
          height: 80,
          backgroundColor: Colors.primaryLight,
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 40 }}>🥗</Text>
        </View>
        <Text style={{ 
          fontSize: 20, 
          fontWeight: 'bold',
          color: Colors.text,
          marginBottom: 16 
        }}>
          膳智 DietWise
        </Text>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStackNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

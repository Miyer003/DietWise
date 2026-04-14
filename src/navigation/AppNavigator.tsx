import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/Theme';
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
import FeedbackScreen from '../screens/Settings/FeedbackScreen';
import MyFeedbacksScreen from '../screens/Settings/MyFeedbacksScreen';
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
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textSecondary,
        headerShown: false,
        // 自定义 tabBarButton 移除默认的圆形水波纹/阴影点击效果
        tabBarButton: (props: any) => (
          <Pressable
            {...props}
            android_ripple={null}
            style={props.style}
          />
        ),
        tabBarStyle: {
          height: 56,
          paddingBottom: 4,
          paddingTop: 4,
          backgroundColor: Theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: Theme.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: Theme.typography.sizes.small,
          marginTop: 2,
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
              width: 40,
              height: 40,
              backgroundColor: Theme.colors.primary,
              borderRadius: Theme.radius.none,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Ionicons name="add" size={24} color={Theme.colors.textInverse} />
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
        cardStyle: { backgroundColor: Theme.colors.background },
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
        cardStyle: { backgroundColor: Theme.colors.background }
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
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="FoodAIInput" 
        component={FoodAIInputScreen}
        options={{ headerShown: false }}
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
        options={{ headerShown: false }}
      />
      
      {/* 个人资料页面 */}
      <MainStack.Screen 
        name="ProfileEdit" 
        component={ProfileEditScreen} 
        options={{ headerShown: false }}
      />
      
      {/* 食谱管理页面 */}
      <MainStack.Screen 
        name="MealPlan" 
        component={MealPlanScreen} 
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="MealPlanDetail" 
        component={MealPlanDetailScreen}
        options={{ headerShown: false }}
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
        name="Feedback" 
        component={FeedbackScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="MyFeedbacks" 
        component={MyFeedbacksScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="About" 
        component={AboutScreen}
        options={{ headerShown: false }}
      />
      
      {/* 成就页面 */}
      <MainStack.Screen 
        name="Achievements" 
        component={AchievementsScreen}
        options={{ headerShown: false }}
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
        backgroundColor: Theme.colors.background 
      }}>
        <View style={{
          width: 64,
          height: 64,
          backgroundColor: Theme.colors.card,
          borderRadius: Theme.radius.none,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 16,
          borderWidth: 1,
          borderColor: Theme.colors.border,
        }}>
          <Text style={{ fontSize: 40 }}>🥗</Text>
        </View>
        <Text style={{ 
          fontSize: Theme.typography.sizes.h1, 
          fontWeight: Theme.typography.weights.semibold,
          color: Theme.colors.text,
          marginBottom: 16 
        }}>
          膳智 DietWise
        </Text>
        <ActivityIndicator size="small" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStackNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

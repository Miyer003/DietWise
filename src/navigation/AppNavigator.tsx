import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

// 导入页面
import HomeScreen from '../screens/Home/HomeScreen';
import RecordScreen from '../screens/Record/RecordScreen';
import AnalyticsScreen from '../screens/Analytics/AnalyticsScreen';
import ConsultScreen from '../screens/Consult/ConsultScreen';
import ChatScreen from '../screens/Consult/ChatScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ProfileEditScreen from '../screens/Profile/ProfileEditScreen';
import MealPlanScreen from '../screens/MealPlan/MealPlanScreen';
import NotificationSettings from '../screens/Settings/NotificationSettings';
import TipLibraryScreen from '../screens/Settings/TipLibraryScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 底部Tab配置
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
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

// 根导航器（包含所有页面）
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: Colors.background }
        }}
      >
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ headerShown: true, title: 'AI营养顾问' }}
        />
        <Stack.Screen 
          name="ProfileEdit" 
          component={ProfileEditScreen} 
          options={{ headerShown: true, title: '个人画像' }}
        />
        <Stack.Screen 
          name="MealPlan" 
          component={MealPlanScreen} 
          options={{ headerShown: true, title: '我的食谱' }}
        />
        <Stack.Screen 
          name="NotificationSettings" 
          component={NotificationSettings} 
          options={{ headerShown: true, title: '提醒设置' }}
        />
        <Stack.Screen 
          name="TipLibrary" 
          component={TipLibraryScreen} 
          options={{ headerShown: true, title: '个性化提示库' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
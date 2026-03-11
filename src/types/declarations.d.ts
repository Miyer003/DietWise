// 模块类型声明

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    multiSet(keyValuePairs: [string, string][]): Promise<void>;
    multiRemove(keys: string[]): Promise<void>;
    clear(): Promise<void>;
  };
  export default AsyncStorage;
}

declare module '@expo/vector-icons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';
  
  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }
  
  export class Ionicons extends Component<IconProps> {}
  export class MaterialIcons extends Component<IconProps> {}
  export class FontAwesome extends Component<IconProps> {}
}

declare module 'expo-camera' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';
  
  interface CameraProps extends ViewProps {
    facing?: 'front' | 'back';
    flashMode?: 'auto' | 'on' | 'off';
    zoom?: number;
    ref?: React.RefObject<CameraView>;
  }
  
  interface CameraPictureOptions {
    quality?: number;
    base64?: boolean;
    exif?: boolean;
  }
  
  interface CameraPictureResult {
    uri: string;
    width: number;
    height: number;
    base64?: string;
    exif?: any;
  }
  
  export class CameraView extends Component<CameraProps> {
    takePictureAsync(options?: CameraPictureOptions): Promise<CameraPictureResult | undefined>;
  }
  
  export function useCameraPermissions(): [
    { granted: boolean } | null,
    () => Promise<void>
  ];
}

declare module 'expo-image-picker' {
  export interface ImagePickerAsset {
    uri: string;
    width: number;
    height: number;
    type?: 'image' | 'video';
    fileName?: string;
    fileSize?: number;
  }
  
  export interface ImagePickerResult {
    canceled: boolean;
    assets?: ImagePickerAsset[];
  }
  
  export interface ImagePickerOptions {
    mediaTypes?: any;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }
  
  export function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
  export function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
  
  export const MediaTypeOptions: {
    Images: any;
    Videos: any;
    All: any;
  };
}

declare module 'expo-notifications' {
  export function setNotificationHandler(handler: any): void;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function getPermissionsAsync(): Promise<{ status: string }>;
  export function scheduleNotificationAsync(notification: any): Promise<string>;
  export function cancelScheduledNotificationAsync(identifier: string): Promise<void>;
  export function setNotificationChannelAsync(channelId: string, channel: any): Promise<void>;
  export function addNotificationReceivedListener(listener: (event: any) => void): { remove: () => void };
  export function addNotificationResponseReceivedListener(listener: (event: any) => void): { remove: () => void };
}

declare module 'expo-status-bar' {
  export function StatusBar(props: { style?: 'auto' | 'light' | 'dark' }): JSX.Element;
}

declare module 'react-native-svg' {
  import { Component } from 'react';
  
  interface SvgProps {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    style?: any;
    children?: React.ReactNode;
  }
  
  interface CircleProps {
    cx?: number | string;
    cy?: number | string;
    r?: number | string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
    strokeDasharray?: number | string;
    strokeDashoffset?: number | string;
    strokeLinecap?: 'butt' | 'round' | 'square';
  }
  
  interface PolygonProps {
    points?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
  }
  
  interface TextProps {
    x?: number | string;
    y?: number | string;
    textAnchor?: 'start' | 'middle' | 'end';
    fill?: string;
    fontSize?: number | string;
    fontWeight?: string;
    children?: React.ReactNode;
  }
  
  export default class Svg extends Component<SvgProps> {}
  export class Circle extends Component<CircleProps> {}
  export class Polygon extends Component<PolygonProps> {}
  export class Text extends Component<TextProps> {}
}

declare module 'date-fns' {
  export function format(date: Date | number | string, format: string, options?: any): string;
  export function parseISO(dateString: string): Date;
  export function isValid(date: any): boolean;
  export function addDays(date: Date | number, amount: number): Date;
  export function subDays(date: Date | number, amount: number): Date;
  export function startOfWeek(date: Date | number, options?: any): Date;
  export function endOfWeek(date: Date | number, options?: any): Date;
  export function startOfMonth(date: Date | number): Date;
  export function endOfMonth(date: Date | number): Date;
  export function isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean;
  export function differenceInDays(dateLeft: Date | number, dateRight: Date | number): number;
}

declare module 'date-fns/locale' {
  export const zhCN: any;
  export const enUS: any;
}

declare module '@react-navigation/native' {
  export * from '@react-navigation/core';
  export function NavigationContainer(props: { children: React.ReactNode; theme?: any }): JSX.Element;
  export function useNavigation(): any;
  export function useRoute(): any;
}

declare module '@react-navigation/bottom-tabs' {
  export function createBottomTabNavigator(): any;
}

declare module '@react-navigation/stack' {
  export function createStackNavigator(): any;
}

declare module 'react-native-safe-area-context' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';
  
  export class SafeAreaView extends Component<ViewProps> {}
  export class SafeAreaProvider extends Component<{ children: React.ReactNode }> {}
  export function useSafeAreaInsets(): { top: number; right: number; bottom: number; left: number };
}

declare module 'react-native-gesture-handler' {
  export { GestureHandlerRootView } from 'react-native-gesture-handler';
}

declare module 'react-native-reanimated' {
  export * from 'react-native-reanimated';
}

declare module 'react-native-screens' {
  export function enableScreens(enable?: boolean): void;
}

declare module 'react-native-chart-kit' {
  import { Component } from 'react';
  
  interface ChartProps {
    data: any;
    width: number;
    height: number;
    chartConfig: any;
    accessor?: string;
    backgroundColor?: string;
    paddingLeft?: string;
    center?: [number, number];
    absolute?: boolean;
  }
  
  export class PieChart extends Component<ChartProps> {}
  export class BarChart extends Component<ChartProps> {}
  export class LineChart extends Component<ChartProps> {}
}

// 全局类型
declare global {
  interface Window {
    EventSource: any;
  }
}

// 声明图片等资源模块
declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const value: any;
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}

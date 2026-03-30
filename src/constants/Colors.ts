// 简约高级配色方案 - 参考 Claude、Kimi 设计风格
export default {
  // 主色调 - 深蓝紫色系（高级感）
  primary: '#4F46E5',        // 主色：靛蓝
  primaryDark: '#4338CA',    // 深色：深靛蓝
  primaryLight: '#EEF2FF',   // 浅色：极淡蓝紫
  
  // 辅助色
  secondary: '#0EA5E9',      // 次要：天蓝
  accent: '#8B5CF6',         // 强调：紫罗兰
  
  // 背景色
  background: '#F8FAFC',     // 页面背景：极浅灰蓝
  surface: '#FFFFFF',        // 卡片表面：纯白
  card: '#FFFFFF',           // 卡片背景（兼容旧代码）
  elevated: '#F1F5F9',       //  elevated 背景
  
  // 文字色
  text: '#0F172A',           // 主文字：深 slate
  textSecondary: '#475569',  // 次要文字：中 slate
  textMuted: '#94A3B8',      // 辅助文字：浅 slate
  textInverse: '#FFFFFF',    // 反色文字：白
  
  // 边框与分割线
  border: '#E2E8F0',         // 边框
  divider: '#F1F5F9',        // 分割线
  
  // 功能色
  success: '#10B981',        // 成功：翠绿
  warning: '#F59E0B',        // 警告：琥珀
  danger: '#EF4444',         // 错误：红
  info: '#3B82F6',           // 信息：蓝
  
  // 透明度变体（用于微妙效果）
  alpha: {
    primary10: 'rgba(79, 70, 229, 0.1)',
    primary20: 'rgba(79, 70, 229, 0.2)',
    text5: 'rgba(15, 23, 42, 0.05)',
    text10: 'rgba(15, 23, 42, 0.1)',
    text20: 'rgba(15, 23, 42, 0.2)',
    text50: 'rgba(15, 23, 42, 0.5)',
  },
  
  // 渐变配色
  gradient: {
    primary: ['#4F46E5', '#7C3AED'],    // 靛蓝到紫
    surface: ['#FFFFFF', '#F8FAFC'],     // 白到浅灰
    subtle: ['#F1F5F9', '#E2E8F0'],     // 微妙渐变
  }
};

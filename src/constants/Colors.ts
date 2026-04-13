// 治愈系奶油燕麦 + 薄荷绿配色方案
// 参考网络推荐的奶油风/自然健康UI配色，护眼不疲劳
export default {
  // 主色调 - 沉稳薄荷绿（健康、清新、不过于轻佻）
  primary: '#5A8F7B',        // 薄荷绿
  primaryDark: '#4A7A68',    // 深薄荷绿
  primaryLight: '#E8F0EC',   // 极淡薄荷
  
  // 辅助色
  secondary: '#7AA897',      // 淡薄荷
  accent: '#C4A574',         // 暖沙金（强调、点缀）
  
  // 背景色
  background: '#FDFCF9',     // 页面背景：极淡奶油白
  surface: '#F5F2EB',        // 卡片表面：燕麦奶色
  card: '#F5F2EB',           // 卡片背景（兼容旧代码）
  highlight: '#EDF3EF',      // 高亮卡片：淡薄荷奶绿
  elevated: '#EDE9E0',       // elevated 背景
  cream: '#FDFCF9',          // 奶油白
  
  // 文字色（暖调炭灰，不刺眼）
  text: '#3D3B36',           // 主文字：深炭褐
  textSecondary: '#7A756C',  // 次要文字：暖灰褐
  textMuted: '#A8A39A',      // 辅助文字：浅暖灰
  textInverse: '#FFFFFF',    // 反色文字：白
  
  // 边框与分割线
  border: '#E8E4DB',         // 边框：暖燕麦灰
  divider: '#F0EDE6',        // 分割线
  
  // 功能色（柔和低饱和版）
  success: '#5A8F7B',        // 成功：薄荷绿
  warning: '#C4A574',        // 警告：暖沙金
  danger: '#B56B5E',         // 错误：陶土玫瑰
  info: '#7A9CA8',           // 信息：雾蓝灰
  
  // 透明度变体（用于微妙效果）
  alpha: {
    primary10: 'rgba(90, 143, 123, 0.1)',
    primary20: 'rgba(90, 143, 123, 0.2)',
    text5: 'rgba(61, 59, 54, 0.05)',
    text10: 'rgba(61, 59, 54, 0.1)',
    text20: 'rgba(61, 59, 54, 0.2)',
    text50: 'rgba(61, 59, 54, 0.5)',
  },
  
  // 渐变配色
  gradient: {
    primary: ['#5A8F7B', '#7AA897'],    // 薄荷绿渐变
    surface: ['#F5F2EB', '#FDFCF9'],     // 燕麦到奶油
    subtle: ['#EDF3EF', '#E8F0EC'],     // 淡薄荷渐变
  }
};

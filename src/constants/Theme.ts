/**
 * DietWise 设计主题系统 v3
 * 方向：极致线条美学 · 去装饰化 · 扁平典雅
 * 核心：取消圆角与投影，以 1px 细线和留白组织内容
 */

// ============================================
// 颜色系统
// ============================================
const colors = {
  // 核心色
  primary: '#78716C',
  secondary: '#A8A29E',
  primaryDark: '#57514D',
  primaryLight: '#F5F5F4',
  accent: '#78716C',

  // 背景层 - 加大对比度
  background: '#EBE9E6',      // 页面背景：明显深于卡片
  surface: '#FFFFFF',          // 卡片/行表面
  card: '#FFFFFF',
  elevated: '#FFFFFF',
  subtle: '#F5F3F0',
  highlight: '#EBE9E6',        // 选中态背景与页面背景同级，明显区分于纯白卡片
  cream: '#F5F5F4',

  // 文字色
  text: '#1C1917',
  textSecondary: '#57514D',
  textMuted: '#A8A29E',
  textInverse: '#FFFFFF',
  textSubtle: '#C4C0BC',

  // 边框与分割线 - 稍加深，让上下线条更优雅
  border: '#C8C4C0',
  divider: '#D8D4D0',
  borderActive: '#78716C',

  // 功能色
  success: '#6B7A6B',
  warning: '#A8946B',
  danger: '#8B6B6B',
  info: '#6B7A8B',

  // 透明度变体
  alpha: {
    primary5: 'rgba(120, 113, 108, 0.05)',
    primary10: 'rgba(120, 113, 108, 0.1)',
    primary15: 'rgba(120, 113, 108, 0.15)',
    primary20: 'rgba(120, 113, 108, 0.2)',
    text5: 'rgba(28, 25, 23, 0.05)',
    text8: 'rgba(28, 25, 23, 0.08)',
    text10: 'rgba(28, 25, 23, 0.1)',
    text15: 'rgba(28, 25, 23, 0.15)',
    text20: 'rgba(28, 25, 23, 0.2)',
  },

  // 渐变
  gradient: {
    primary: ['#78716C', '#A8A29E'],
    surface: ['#FAFAF9', '#FFFFFF'],
    subtle: ['#F5F3F0', '#FFFFFF'],
    selected: ['rgba(120, 113, 108, 0.08)', 'rgba(120, 113, 108, 0.02)'],
  },
} as const;

// ============================================
// 圆角系统 - 几乎取消圆角，回归直线
// ============================================
const radius = {
  xl: 2,
  lg: 2,
  md: 1,
  sm: 0,
  xs: 0,
  xxs: 0,
  none: 0,
} as const;

// ============================================
// 阴影系统 - 全部取消投影，纯扁平
// ============================================
const shadows = {
  card: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardPressed: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardSelected: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  innerSelected: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  search: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  button: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  tabBar: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

// ============================================
// 间距系统
// ============================================
const spacing = {
  page: 20,
  section: 24,
  content: 16,
  compact: 12,
  tight: 8,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

// ============================================
// 字体系统
// ============================================
const typography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  sizes: {
    h1: 22,
    h2: 17,
    h3: 15,
    body: 15,
    caption: 13,
    small: 11,
    tiny: 10,
  },
  weights: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    tight: 1.3,
    body: 1.5,
    relaxed: 1.6,
    description: 1.8,
  },
} as const;

// ============================================
// 动画系统
// ============================================
const animation = {
  duration: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    default: 'ease' as const,
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)' as const,
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)' as const,
  },
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  press: {
    scale: 0.97,
    translateY: 1,
  },
  selected: {
    scale: 1,
    translateY: 0,
  },
} as const;

// ============================================
// 通用样式片段 - 平直线条美学
// ============================================
const commonStyles = {
  // 页面容器
  pageContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // 滚动容器
  scrollContent: {
    paddingHorizontal: spacing.page,
    paddingBottom: spacing.section * 2,
  },

  // 大卡片 - 仅上下细线，无左右边框
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  cardSelected: {
    backgroundColor: colors.highlight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },

  cardMd: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  cardSm: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  cardSmSelected: {
    backgroundColor: colors.highlight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },

  // ==========================================
  // 列表系统 - 关键：去卡片化，用底边框分隔
  // ==========================================

  /** 平直列表行 - 无圆角无背景，只有底边框 */
  listRow: {
    backgroundColor: colors.card,
    paddingVertical: spacing.content,
    paddingHorizontal: spacing.page,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  /** 基础列表项 - 仅上下细线 */
  listItem: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.content,
    marginBottom: spacing.compact,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  listItemSelected: {
    backgroundColor: colors.highlight,
    borderRadius: radius.md,
    padding: spacing.content,
    marginBottom: spacing.compact,
    borderTopWidth: 1,
    borderTopColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },

  listItemAlt: {
    backgroundColor: colors.subtle,
    borderRadius: radius.md,
    padding: spacing.content,
    marginBottom: spacing.compact,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // ==========================================
  // 页面顶部标题栏 - 统一主页问候区风格
  // ==========================================

  screenHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.page,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  screenHeaderTitle: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.light,
    letterSpacing: 2,
    color: colors.text,
  },

  screenHeaderSubtitle: {
    fontSize: typography.sizes.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },

  // ==========================================
  // 图标系统
  // ==========================================

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.subtle,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  iconContainerSelected: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.alpha.primary15,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  // ==========================================
  // 按钮系统 - 扁平直角
  // ==========================================

  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    height: 48,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  primaryButtonPressed: {
    backgroundColor: colors.secondary,
    transform: [{ scale: 0.97 }, { translateY: 1 }],
  },
  primaryButtonText: {
    color: colors.textInverse,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    letterSpacing: 0.5,
  },

  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    height: 48,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  secondaryButtonPressed: {
    backgroundColor: colors.alpha.primary5,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    letterSpacing: 0.5,
  },

  ghostButton: {
    backgroundColor: 'transparent',
    borderRadius: radius.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  ghostButtonText: {
    color: colors.primary,
    fontSize: typography.sizes.caption,
    fontWeight: typography.weights.semibold,
  },

  // ==========================================
  // 输入系统 - 极简直角
  // ==========================================

  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xxs,
    height: 48,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: typography.sizes.body,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },

  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchBarFocused: {
    borderColor: colors.borderActive,
  },

  // ==========================================
  // 分割线
  // ==========================================

  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.compact,
  },

  dividerStrong: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },

  // ==========================================
  // 标签/徽章
  // ==========================================

  tag: {
    backgroundColor: colors.subtle,
    borderRadius: radius.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.medium,
  },

  tagSelected: {
    backgroundColor: colors.primary,
    borderRadius: radius.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  tagSelectedText: {
    color: colors.textInverse,
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.medium,
  },

  // ==========================================
  // 底部导航 - 只留上边框细线
  // ==========================================

  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  tabItem: {
    color: colors.textMuted,
  },

  tabItemSelected: {
    color: colors.primary,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    marginTop: -2,
  },

  tabIcon: {
    fontSize: 22,
    marginBottom: 4,
  },

  tabLabel: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
  },
} as const;

// ============================================
// 图表主题
// ============================================
const chartTheme = {
  backgroundColor: colors.background,
  backgroundGradientFrom: colors.background,
  backgroundGradientTo: colors.background,
  color: (opacity = 1) => `rgba(120, 113, 108, ${opacity})`,
  secondaryColor: (opacity = 1) => `rgba(87, 81, 77, ${opacity})`,
  tertiaryColor: (opacity = 1) => `rgba(168, 162, 158, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(87, 81, 77, ${opacity})`,
  strokeWidth: 2.5,
  barPercentage: 0.65,
  useShadowColorFromDataset: false,
  palette: [
    '#78716C',
    '#57514D',
    '#A8A29E',
    '#8B7355',
    '#6B7A6B',
    '#6B7A8B',
  ],
  lineFill: 'rgba(120, 113, 108, 0.12)',
  gridColor: colors.divider,
  gridOpacity: 0.5,
} as const;

// ============================================
// 导出
// ============================================
export const Theme = {
  colors,
  radius,
  shadows,
  spacing,
  typography,
  animation,
  commonStyles,
  chartTheme,
} as const;

export default Theme;

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../constants/Theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightIcon?: React.ComponentProps<typeof Ionicons>['name'];
  onRightPress?: () => void;
  rightElement?: React.ReactNode;
}

export default function ScreenHeader({
  title,
  subtitle,
  rightIcon,
  onRightPress,
  rightElement,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement ? (
        <View>{rightElement}</View>
      ) : rightIcon ? (
        <TouchableOpacity onPress={onRightPress} style={styles.rightBtn}>
          <Ionicons name={rightIcon} size={24} color={Theme.colors.text} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.page,
    paddingVertical: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  left: {
    flex: 1,
  },
  title: {
    fontSize: Theme.typography.sizes.h1,
    fontWeight: Theme.typography.weights.light,
    letterSpacing: 2,
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.xs,
  },
  rightBtn: {
    padding: Theme.spacing.xs,
  },
});

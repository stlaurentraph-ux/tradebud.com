import { PropsWithChildren, useState } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Card, CardContent } from '@/components/ui/card';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Brand, Spacing, Radius } from '@/constants/theme';

export function Collapsible({ 
  children, 
  title 
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const borderColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <Card variant="outlined" style={styles.container}>
      <Pressable
        style={[styles.heading, { borderBottomColor: isOpen ? borderColor : 'transparent' }]}
        onPress={() => setIsOpen((value) => !value)}
      >
        <View style={styles.headingContent}>
          <Ionicons name="help-circle-outline" size={20} color={Brand.primary} />
          <ThemedText type="defaultSemiBold">{title}</ThemedText>
        </View>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={iconColor}
        />
      </Pressable>
      {isOpen && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  headingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});

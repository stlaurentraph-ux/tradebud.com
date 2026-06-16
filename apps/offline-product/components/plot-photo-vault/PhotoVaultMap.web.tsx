import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function PhotoVaultMap() {
  return (
    <View
      style={{
        height: 120,
        borderRadius: 14,
        backgroundColor: '#E8F5EF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
      }}
    >
      <ThemedText type="caption" style={{ textAlign: 'center' }}>
        Field map preview is available in the mobile app.
      </ThemedText>
    </View>
  );
}

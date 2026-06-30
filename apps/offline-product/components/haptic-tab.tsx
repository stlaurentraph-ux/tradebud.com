import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

type HapticTabProps = BottomTabBarButtonProps & { testID?: string };

export function HapticTab(props: HapticTabProps) {
  const { testID, accessibilityLabel, ...rest } = props;
  return (
    <PlatformPressable
      {...rest}
      testID={testID}
      accessibilityLabel={accessibilityLabel ?? testID}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}

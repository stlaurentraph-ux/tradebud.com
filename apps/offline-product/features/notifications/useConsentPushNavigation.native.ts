import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

function openScreenFromNotification(
  response: Notifications.NotificationResponse | null | undefined,
): void {
  const data = response?.notification.request.content.data ?? {};
  const screen = typeof data.screen === 'string' ? data.screen : '';
  const plotId = typeof data.plotId === 'string' ? data.plotId.trim() : '';
  const clientPlotId = typeof data.clientPlotId === 'string' ? data.clientPlotId.trim() : '';

  if (screen === 'data-sharing') {
    router.push('/data-sharing');
    return;
  }

  if (screen === 'plots' || screen === 'field-operations') {
    if (plotId) {
      router.push(`/plot/${encodeURIComponent(plotId)}`);
      return;
    }
    if (clientPlotId) {
      router.push(`/(tabs)/explore?plotId=${encodeURIComponent(clientPlotId)}`);
      return;
    }
    router.push('/(tabs)/explore');
  }
}

export function useConsentPushNavigation(): void {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openScreenFromNotification(response);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    void Notifications.getLastNotificationResponseAsync().then(openScreenFromNotification);
  }, []);
}

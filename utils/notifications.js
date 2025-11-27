import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getNotificationSettings } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }
  
  // token = (await Notifications.getExpoPushTokenAsync()).data;
  // console.log(token);

  return token;
}

export async function scheduleDailyNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 從儲存的設定中取得通知時間
  const settings = await getNotificationSettings();
  
  if (!settings.enabled) {
    console.log('Notifications are disabled');
    return;
  }

  const enabledTimes = settings.times.filter(t => t.enabled);

  for (const time of enabledTimes) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "心情紀錄時間到囉！",
        body: "請花一點時間記錄您現在的心情。",
      },
      trigger: {
        hour: time.hour,
        minute: time.minute,
        repeats: true,
      },
    });
  }
  
  console.log(`Scheduled ${enabledTimes.length} daily notifications`);
}

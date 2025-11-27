import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import SurveyScreen from "../components/SurveyScreen";
import { registerForPushNotificationsAsync, scheduleDailyNotifications } from "../../utils/notifications";

export default function HomeScreen() {
  useEffect(() => {
    registerForPushNotificationsAsync();
    scheduleDailyNotifications();
  }, []);

  return (
    <View style={styles.container}>
      <SurveyScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});

/**
 * @fileoverview Push notification handling with Expo Notifications
 * Provides hooks for registering, receiving, and managing push notifications.
 * @module hooks/useNotifications
 */

import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

import { useNotificationStore } from "@/stores/notificationStore";

// Configure how notifications should be handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Hook for managing push notifications.
 * Handles registration, receiving, and responding to notifications.
 *
 * @returns Object with notification management functions
 *
 * @example
 * ```tsx
 * function App() {
 *   const {
 *     registerForPushNotifications,
 *     scheduleLocalNotification,
 *     setBadgeCount,
 *   } = useNotifications();
 *
 *   useEffect(() => {
 *     // Register for push notifications on mount
 *     registerForPushNotifications();
 *   }, []);
 *
 *   const handleReminder = () => {
 *     scheduleLocalNotification(
 *       'Reminder',
 *       'Don\'t forget to check your tasks!',
 *       { screen: 'tasks' },
 *       { seconds: 60 } // Trigger in 1 minute
 *     );
 *   };
 *
 *   return <Button onPress={handleReminder}>Set Reminder</Button>;
 * }
 * ```
 */
export function useNotifications() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const { setPushToken, setLastNotification } = useNotificationStore();

  useEffect(() => {
    // Listen for incoming notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setLastNotification(notification);
      });

    // Listen for notification interactions
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        handleNotificationPress(data);
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const handleNotificationPress = (data: Record<string, unknown>) => {
    // TODO: Handle notification navigation based on data
    // Example: router.push(data.screen as string);
    console.log("Notification pressed with data:", data);
  };

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) {
      console.log("Push notifications require a physical device");
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission not granted");
      return null;
    }

    // Get the push token
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      setPushToken(token.data);

      // Configure Android channel
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#3b82f6",
        });
      }

      return token.data;
    } catch (error) {
      console.error("Failed to get push token:", error);
      return null;
    }
  };

  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, unknown>,
    trigger?: Notifications.NotificationTriggerInput
  ) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: trigger || null, // null = immediate
    });
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  const getBadgeCount = async () => {
    return Notifications.getBadgeCountAsync();
  };

  const setBadgeCount = async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
  };

  return {
    registerForPushNotifications,
    scheduleLocalNotification,
    cancelAllNotifications,
    getBadgeCount,
    setBadgeCount,
  };
}

/// Notifications are deliberately inactive while recipient scope and secure
/// device registration are unresolved. This service performs no platform calls,
/// network requests, token registration, subscriptions or polling.
class NotificationService {
  static const bool isEnabled = false;
  static String? get fcmToken => null;
  static Future<void> initialize() async {}
  static void startRealtimeListener() {}
  static void stopRealtimeListener() {}
  static Future<bool> requestPermission() async => false;
  static Future<void> showBookingAlert({
    required String title,
    required String body,
    String? payload,
  }) async {}
  static Future<void> testNotification() async {}
}

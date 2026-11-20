import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Handling FCM background message: ${message.messageId}');
}

class NotificationService {
  static final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  static const String _channelId = 'clinic_bookings_channel_v2';
  static const String _channelName = 'حجوزات عيادة د. محمد العطار';
  static const String _channelDescription =
      'إشعارات وتنبيهات فورية عند وصول حجز كشف جديد بالعيادة';

  static RealtimeChannel? _realtimeChannel;
  static bool _isInitialized = false;
  static String? fcmToken;

  static Future<void> initialize() async {
    if (_isInitialized) return;

    // 1. Initialize Local Notifications Plugin
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
    );

    try {
      await _notificationsPlugin.initialize(
        initSettings,
        onDidReceiveNotificationResponse: (response) {
          debugPrint('Notification clicked: ${response.payload}');
        },
      );

      // Create Android Notification Channel with max importance, sound & vibration
      const AndroidNotificationChannel channel = AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: _channelDescription,
        importance: Importance.max,
        playSound: true,
        enableVibration: true,
      );

      final androidPlugin = _notificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();
      if (androidPlugin != null) {
        await androidPlugin.createNotificationChannel(channel);
        await androidPlugin.requestNotificationsPermission();
      }
    } catch (e) {
      debugPrint('Local notifications initialization notice: $e');
    }

    // 2. Initialize Firebase Cloud Messaging (FCM)
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      final fcm = FirebaseMessaging.instance;

      // Request permission on iOS / Android 13+
      final settings = await fcm.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      debugPrint('FCM Authorization status: ${settings.authorizationStatus}');

      // Subscribe to clinic bookings topic for instant broadcast
      await fcm.subscribeToTopic('clinic_bookings');
      await fcm.subscribeToTopic('all_staff');
      debugPrint('Subscribed to FCM topic: clinic_bookings');

      // Get FCM device registration token
      // ignore: deprecated_member_use
      fcmToken = await fcm.getToken();
      debugPrint('FCM Token: $fcmToken');
      if (fcmToken != null) {
        _registerTokenWithSupabase(fcmToken!);
      }

      // Listen for token refresh
      // ignore: deprecated_member_use
      fcm.onTokenRefresh.listen((newToken) {
        fcmToken = newToken;
        _registerTokenWithSupabase(newToken);
      });

      // Handle foreground messages with local sound and banner
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('FCM Foreground message received: ${message.data}');
        final notification = message.notification;
        final title = notification?.title ?? message.data['title'] ?? 'حجز كشف جديد بالعيادة! 🔔';
        final body = notification?.body ?? message.data['body'] ?? 'لديك حجز جديد في جدول العيادة';
        showBookingAlert(
          title: title,
          body: body,
          payload: message.data['bookingId']?.toString(),
        );
      });

      // Handle notification open event
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('FCM Notification tapped to open app: ${message.data}');
      });

    } catch (e) {
      debugPrint('Firebase FCM initialization notice: $e');
    }

    _isInitialized = true;
    debugPrint('NotificationService full initialization completed');
  }

  static Future<void> _registerTokenWithSupabase(String token) async {
    try {
      final settings = await SupabaseService.getClinicSettings();
      if (settings != null) {
        final existingTokens = List<dynamic>.from(settings['deviceTokens'] ?? []);
        final alreadyExists = existingTokens.any((t) => t is Map && t['token'] == token);
        if (!alreadyExists) {
          existingTokens.add({
            'id': 'tok-${DateTime.now().millisecondsSinceEpoch}',
            'token': token,
            'role': 'all',
            'devicePlatform': 'android',
            'lastActive': DateTime.now().toUtc().toIso8601String(),
            'createdAt': DateTime.now().toUtc().toIso8601String(),
          });
          settings['deviceTokens'] = existingTokens;
          await SupabaseService.saveClinicSettings(settings);
          debugPrint('Device token saved to Supabase successfully.');
        }
      }
    } catch (e) {
      debugPrint('Error saving FCM token to Supabase: $e');
    }
  }

  static Future<bool> requestPermission() async {
    try {
      final androidPlugin = _notificationsPlugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();
      if (androidPlugin != null) {
        final granted = await androidPlugin.requestNotificationsPermission();
        return granted ?? false;
      }
    } catch (e) {
      debugPrint('Error requesting notification permission: $e');
    }
    return false;
  }

  static void startRealtimeListener() {
    try {
      if (_realtimeChannel != null) return;

      _realtimeChannel = Supabase.instance.client
          .channel('public:appointments_realtime_alerts')
          .onPostgresChanges(
            event: PostgresChangeEvent.insert,
            schema: 'public',
            table: 'appointments',
            callback: (payload) {
              final newRecord = payload.newRecord;
              final patientName =
                  newRecord['patient_name']?.toString() ?? 'مريض جديد';
              final date = newRecord['appointment_date']?.toString() ?? '';
              final time = newRecord['appointment_time']?.toString() ?? '';
              final notes = newRecord['notes']?.toString() ?? '';
              final service = notes.contains('الخدمة:')
                  ? notes.split('|')[0].replaceAll('الخدمة:', '').trim()
                  : '';

              final details = <String>[];
              if (date.isNotEmpty) {
                details.add('الموعد: $date ${time.isNotEmpty ? "($time)" : ""}');
              }
              if (service.isNotEmpty) {
                details.add('الخدمة: $service');
              }

              showBookingAlert(
                title: 'حجز كشف جديد بالعيادة! 🔔',
                body: 'المريض: $patientName\n${details.join('\n')}',
                payload: newRecord['id']?.toString(),
              );
            },
          )
          .subscribe();

      debugPrint('Realtime booking notifications listener subscribed successfully');
    } catch (e) {
      debugPrint('Error starting realtime notifications listener: $e');
    }
  }

  static Future<void> showBookingAlert({
    required String title,
    required String body,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: _channelDescription,
      importance: Importance.max,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      playSound: true,
      enableVibration: true,
      styleInformation: BigTextStyleInformation(''),
    );

    const NotificationDetails details =
        NotificationDetails(android: androidDetails);

    try {
      await _notificationsPlugin.show(
        DateTime.now().millisecondsSinceEpoch ~/ 1000,
        title,
        body,
        details,
        payload: payload,
      );
    } catch (e) {
      debugPrint('Error displaying notification: $e');
    }
  }

  static Future<void> testNotification() async {
    await showBookingAlert(
      title: 'تجربة الإشعارات والتنبيه الفوري 🔔',
      body: 'تم تفعيل التنبيهات السحابية بنجاح! ستصلك التنبيهات حتى والتطبيق مغلق.',
      payload: 'test_notification',
    );
  }
}

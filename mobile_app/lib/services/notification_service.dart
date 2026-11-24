import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  debugPrint('FCM background message received: ${message.messageId}');

  final notification = message.notification;
  final title = notification?.title ?? message.data['title'] ?? 'حجز كشف جديد بالعيادة! 🔔';
  final body = notification?.body ?? message.data['body'] ?? 'لديك حجز جديد في جدول العيادة';

  await NotificationService.showBookingAlert(
    title: title,
    body: body,
    payload: message.data['bookingId']?.toString(),
  );
}

class NotificationService {
  static final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  static const String _channelId = 'clinic_bookings_channel_v2';
  static const String _channelName = 'حجوزات عيادة د. محمد العطار';
  static const String _channelDescription =
      'إشعارات وتنبيهات فورية عند وصول حجز كشف جديد بالعيادة';

  static RealtimeChannel? _realtimeChannel;
  static Timer? _syncTimer;
  static bool _isInitialized = false;
  static String? fcmToken;
  static final Set<String> _knownAppointmentIds = {};

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
        showBadge: true,
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
      await fcm.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      // Subscribe to clinic bookings topic for instant broadcast
      try {
        await fcm.subscribeToTopic('clinic_bookings');
        await fcm.subscribeToTopic('all_staff');
      } catch (e) {
        debugPrint('FCM topic subscribe notice: $e');
      }

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
    _startPeriodicSync();
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

  static void stopRealtimeListener() {
    try {
      final channel = _realtimeChannel;
      _realtimeChannel = null;
      if (channel != null) {
        Supabase.instance.client.removeChannel(channel);
      }
    } catch (_) {}
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

  /// Starts the live booking-alert listener. Requires a signed-in staff
  /// session: the backend only streams appointment changes to authorized
  /// staff, so this is called after login/session restore, not at app start.
  static void startRealtimeListener() {
    try {
      if (_realtimeChannel != null) return;
      final session = Supabase.instance.client.auth.currentSession;
      if (session == null) return;
      Supabase.instance.client.realtime.setAuth(session.accessToken);

      _realtimeChannel = Supabase.instance.client
          .channel('public:appointments_realtime_alerts')
          .onPostgresChanges(
            event: PostgresChangeEvent.insert,
            schema: 'public',
            table: 'appointments',
            callback: (payload) {
              final newRecord = payload.newRecord;
              final recId = newRecord['id']?.toString() ?? '';
              if (recId.isNotEmpty) {
                _knownAppointmentIds.add(recId);
              }

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
                payload: recId,
              );

              // Silent refresh of cached appointments
              SupabaseService.getAppointments(forceRefresh: true);
            },
          )
          .subscribe();

      debugPrint('Realtime booking notifications listener subscribed successfully');
    } catch (e) {
      debugPrint('Error starting realtime notifications listener: $e');
    }
  }

  static void _startPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(const Duration(seconds: 25), (timer) async {
      try {
        final appointments = await SupabaseService.getAppointments(forceRefresh: true);
        if (_knownAppointmentIds.isEmpty) {
          for (final a in appointments) {
            _knownAppointmentIds.add(a.id);
          }
          return;
        }

        // Check for newly added pending appointments
        for (final a in appointments) {
          if (!_knownAppointmentIds.contains(a.id)) {
            _knownAppointmentIds.add(a.id);
            if (a.status == 'pending') {
              showBookingAlert(
                title: 'حجز كشف جديد بالعيادة! 🔔',
                body: 'المريض: ${a.patientName}\nالموعد: ${a.appointmentDate} (${a.appointmentTime})',
                payload: a.id,
              );
            }
          }
        }
      } catch (_) {}
    });
  }

  static Future<void> showBookingAlert({
    required String title,
    required String body,
    String? payload,
  }) async {
    final Int64List vibrationPattern = Int64List(4);
    vibrationPattern[0] = 0;
    vibrationPattern[1] = 400;
    vibrationPattern[2] = 200;
    vibrationPattern[3] = 400;

    final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: _channelDescription,
      importance: Importance.max,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      playSound: true,
      enableVibration: true,
      vibrationPattern: vibrationPattern,
      category: AndroidNotificationCategory.reminder,
      visibility: NotificationVisibility.public,
      styleInformation: BigTextStyleInformation(body),
    );

    final NotificationDetails details =
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
      body: 'تم تفعيل التنبيهات بنجاح! ستصلك التنبيهات الفورية حتى والتطبيق مغلق.',
      payload: 'test_notification',
    );
  }
}

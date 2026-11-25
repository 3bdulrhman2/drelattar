import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'clinic_firebase_options.dart';

/// Staff opt-in only. Initialization never prompts, registers or sends.
class NotificationService {
  static const bool isEnabled = true;
  static String? fcmToken;
  static bool _ready = false;
  static const _optInKey = 'clinic_staff_push_opt_in';
  static const _ownerKey = 'clinic_staff_push_owner';
  static final _local = FlutterLocalNotificationsPlugin();
  static StreamSubscription<RemoteMessage>? _foreground;
  static Future<void> _receive(RemoteMessage message) async {
    try {
      final c = Supabase.instance.client,
          id = Supabase.instance.client.auth.currentUser?.id;
      if (id == null) return;
      final member = await c
          .from('clinic_staff')
          .select('role,is_active')
          .eq('user_id', id)
          .maybeSingle();
      if (member?['is_active'] != true ||
          !['admin', 'secretary'].contains(member?['role']))
        return;
      if (message.data['type'] != 'staff_manual') return;
      final n = message.notification;
      if (n == null) return;
      await _local.show(
        DateTime.now().millisecondsSinceEpoch.remainder(2147483647),
        n.title,
        n.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'clinic_staff_manual',
            'إشعارات فريق العيادة',
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
      );
    } catch (_) {}
  }

  static StreamSubscription<String>? _refresh;
  static Future<void> initialize() async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) return;
    try {
      await Firebase.initializeApp(options: clinicAndroidFirebase);
      await FirebaseMessaging.instance.setAutoInitEnabled(false);
      await _local.initialize(
        const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        ),
      );
      _ready = true;
    } catch (_) {
      _ready = false;
    }
  }

  static void startRealtimeListener() {
    _resumeOptIn();
  }

  static Future<void> _resumeOptIn() async {
    if (!_ready) return;
    try {
      final p = await SharedPreferences.getInstance();
      final id = Supabase.instance.client.auth.currentUser?.id;
      if (id != null &&
          p.getBool(_optInKey) == true &&
          p.getString(_ownerKey) == id)
        await requestPermission();
    } catch (_) {}
  } // Reception owns its patient-free sync.

  static void stopRealtimeListener() {}
  static Future<void> _register(String token) async {
    final c = Supabase.instance.client;
    if (c.auth.currentSession == null) throw StateError('Not signed in');
    final r = await c.functions.invoke(
      'staff-devices',
      body: {'action': 'register', 'token': token, 'platform': 'android'},
    );
    if (r.status != 200) throw StateError('Device registration failed');
    fcmToken = token;
  }

  static Future<bool> requestPermission() async {
    if (!_ready) return false;
    try {
      final c = Supabase.instance.client;
      final id = c.auth.currentUser?.id;
      if (id == null) return false;
      final staff = await c
          .from('clinic_staff')
          .select('role,is_active')
          .eq('user_id', id)
          .maybeSingle();
      if (staff?['is_active'] != true ||
          !['admin', 'secretary'].contains(staff?['role']))
        return false;
      final settings = await FirebaseMessaging.instance.requestPermission();
      if (settings.authorizationStatus != AuthorizationStatus.authorized)
        return false;
      await FirebaseMessaging.instance.setAutoInitEnabled(true);
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return false;
      await _register(token);
      final preferences = await SharedPreferences.getInstance();
      await preferences.setBool(_optInKey, true);
      await preferences.setString(_ownerKey, id);
      await _foreground?.cancel();
      _foreground = FirebaseMessaging.onMessage.listen(_receive);
      await _refresh?.cancel();
      _refresh = FirebaseMessaging.instance.onTokenRefresh.listen((t) {
        _register(t).catchError((_) {});
      });
      return true;
    } catch (_) {
      try {
        await FirebaseMessaging.instance.setAutoInitEnabled(false);
        await FirebaseMessaging.instance.deleteToken();
      } catch (_) {}
      return false;
    }
  }

  static Future<bool> unregisterBeforeLogout() async {
    await _refresh?.cancel();
    _refresh = null;
    await _foreground?.cancel();
    _foreground = null;
    if (_ready) {
      try {
        await FirebaseMessaging.instance.setAutoInitEnabled(false);
      } catch (_) {}
    }
    if (!_ready) return true;
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool(_optInKey) != true && fcmToken == null) return true;
    String? token;
    try {
      token = fcmToken ?? await FirebaseMessaging.instance.getToken();
    } catch (_) {
      return false;
    }
    if (token == null) return true;
    bool removed = false, invalidated = false;
    try {
      if (Supabase.instance.client.auth.currentSession != null) {
        final r = await Supabase.instance.client.functions.invoke(
          'staff-devices',
          body: {'action': 'unregister', 'token': token},
        );
        removed = r.status == 200;
      }
    } catch (_) {}
    try {
      await FirebaseMessaging.instance.deleteToken();
      invalidated = true;
    } catch (_) {}
    if (removed || invalidated) {
      fcmToken = null;
      await prefs.remove(_optInKey);
      await prefs.remove(_ownerKey);
      await _local.cancelAll();
      return true;
    }
    // Do not silently leave a shared device receiving the previous user's pushes.
    return false;
  }

  /// Local-only phone notification (nothing is sent through the server) that
  /// tells the signed-in user a background save failed and was rolled back.
  static Future<void> showSaveFailure(String body) async {
    if (!_ready) return;
    try {
      await _local
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >()
          ?.requestNotificationsPermission();
      await _local.show(
        DateTime.now().millisecondsSinceEpoch.remainder(2147483647),
        'تعذر حفظ التغيير',
        body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'clinic_save_failures',
            'تنبيهات فشل الحفظ',
            importance: Importance.high,
            priority: Priority.high,
          ),
        ),
      );
    } catch (_) {}
  }

  static Future<void> showBookingAlert({
    required String title,
    required String body,
    String? payload,
  }) async {} // Automatic booking push is out of scope.
  static Future<void>
  testNotification() async {} // Real trial requires exact text/device approval.
}

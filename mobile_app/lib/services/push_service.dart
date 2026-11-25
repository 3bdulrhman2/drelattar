import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

/// Sends a staff broadcast push notification through the clinic's backend
/// (Supabase Edge Function). The backend verifies the caller is active staff
/// and delivers to staff devices only.
///
/// The function URL is injected at build time:
///   --dart-define=PUSH_FUNCTION_URL=https://<project>.supabase.co/functions/v1/staff-push
/// When not configured, [isConfigured] is false and the UI should say push is
/// not set up yet instead of pretending a send happened.
class PushService {
  static const String functionUrl =
      String.fromEnvironment('PUSH_FUNCTION_URL', defaultValue: '');

  static bool get isConfigured => functionUrl.isNotEmpty;

  /// Returns null on success, or an error message to show.
  static Future<String?> sendStaffBroadcast({
    required String title,
    required String body,
  }) async {
    if (!isConfigured) return 'إرسال الإشعارات للأجهزة غير مُعد بعد';
    String? token;
    try {
      token = Supabase.instance.client.auth.currentSession?.accessToken;
    } catch (_) {}
    if (token == null) return 'سجّل الدخول أولاً';
    try {
      final response = await http.post(
        Uri.parse(functionUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'title': title, 'body': body}),
      );
      if (response.statusCode == 200) return null;
      debugPrint('Push send failed: ${response.statusCode} ${response.body}');
      return 'تعذر إرسال الإشعار (رمز ${response.statusCode})';
    } catch (e) {
      debugPrint('Push send error: $e');
      return 'تعذر إرسال الإشعار، تحقق من الاتصال';
    }
  }
}

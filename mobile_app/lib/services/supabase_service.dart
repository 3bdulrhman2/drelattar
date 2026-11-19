import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/appointment.dart';
import '../models/clinic_holiday.dart';
import '../models/clinic_announcement.dart';
import '../models/secretary_account.dart';
import '../models/social_review.dart';

class SupabaseService {
  static const String supabaseUrl = 'https://jpamutyomblwobwntoky.supabase.co';
  static const String anonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwYW11dHlvbWJsd29id250b2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUwNDgxNzIsImV4cCI6MjExMDYyNDE3Mn0.SKV19QKCDGZSbOK5HQExWqULwfakEXvzkzI8YJPOayw';

  static Map<String, String> get _headers => {
        'apikey': anonKey,
        'Authorization': 'Bearer $anonKey',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };

  // ---------------- APPOINTMENTS ----------------

  static Future<List<Appointment>> getAppointments() async {
    try {
      final response = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/appointments?select=*&order=created_at.desc'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Appointment.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Error loading appointments: $e');
    }
    return [];
  }

  static Future<bool> updateAppointmentStatus(String id, String status) async {
    try {
      final response = await http.patch(
        Uri.parse('$supabaseUrl/rest/v1/appointments?id=eq.$id'),
        headers: _headers,
        body: jsonEncode({'status': status}),
      );
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      debugPrint('Error updating appointment status: $e');
      return false;
    }
  }

  // ---------------- CLINIC SETTINGS ----------------

  static Future<Map<String, dynamic>?> getClinicSettings() async {
    try {
      final response = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/clinic_settings?key=eq.main_settings&select=*'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        if (data.isNotEmpty && data[0]['content'] != null) {
          return data[0]['content'] as Map<String, dynamic>;
        }
      }
    } catch (e) {
      debugPrint('Error loading clinic settings: $e');
    }
    return null;
  }

  static Future<bool> saveClinicSettings(Map<String, dynamic> content) async {
    try {
      final response = await http.post(
        Uri.parse('$supabaseUrl/rest/v1/clinic_settings'),
        headers: {
          ..._headers,
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: jsonEncode({
          'key': 'main_settings',
          'content': content,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        }),
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error saving clinic settings: $e');
      return false;
    }
  }

  // ---------------- CLOSURES & HOLIDAYS ----------------

  static Future<bool> toggleCloseToday(bool isClosed, [String? reason]) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(settings['bookingSettings'] ?? {});
    bookingSettings['isClosedToday'] = isClosed;
    if (reason != null) {
      bookingSettings['closedTodayReason'] = reason;
    }
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  static Future<bool> toggleCloseDate(String dateStr, bool isClosed) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(settings['bookingSettings'] ?? {});
    final List<dynamic> currentClosed = List.from(bookingSettings['closedDates'] ?? []);

    if (isClosed) {
      if (!currentClosed.contains(dateStr)) {
        currentClosed.add(dateStr);
      }
    } else {
      currentClosed.remove(dateStr);
    }

    bookingSettings['closedDates'] = currentClosed;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  static Future<bool> addHoliday(ClinicHoliday holiday) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(settings['bookingSettings'] ?? {});
    final List<dynamic> currentHolidays = List.from(bookingSettings['holidays'] ?? []);
    currentHolidays.insert(0, holiday.toJson());

    bookingSettings['holidays'] = currentHolidays;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  static Future<bool> deleteHoliday(String id) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(settings['bookingSettings'] ?? {});
    final List<dynamic> currentHolidays = List.from(bookingSettings['holidays'] ?? []);
    currentHolidays.removeWhere((h) => h['id'] == id);

    bookingSettings['holidays'] = currentHolidays;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  // ---------------- ANNOUNCEMENTS ----------------

  static Future<bool> addAnnouncement(ClinicAnnouncement announcement) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(settings['bookingSettings'] ?? {});
    final List<dynamic> currentAnnouncements = List.from(bookingSettings['announcements'] ?? []);
    currentAnnouncements.insert(0, announcement.toJson());

    bookingSettings['announcements'] = currentAnnouncements;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  static Future<bool> deleteAnnouncement(String id) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(settings['bookingSettings'] ?? {});
    final List<dynamic> currentAnnouncements = List.from(bookingSettings['announcements'] ?? []);
    currentAnnouncements.removeWhere((a) => a['id'] == id);

    bookingSettings['announcements'] = currentAnnouncements;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  // ---------------- SECRETARY ACCOUNTS ----------------

  static Future<List<SecretaryAccount>> getSecretaryAccounts() async {
    final settings = await getClinicSettings();
    if (settings == null) return [];

    final List<dynamic> list = settings['secretaryAccounts'] ?? [];
    return list.map((json) => SecretaryAccount.fromJson(json)).toList();
  }

  static Future<bool> addSecretaryAccount(SecretaryAccount account) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final List<dynamic> list = List.from(settings['secretaryAccounts'] ?? []);
    list.insert(0, account.toJson());
    settings['secretaryAccounts'] = list;

    return await saveClinicSettings(settings);
  }

  static Future<bool> updateSecretaryAccount(String id, Map<String, dynamic> updates) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final List<dynamic> list = List.from(settings['secretaryAccounts'] ?? []);
    for (int i = 0; i < list.length; i++) {
      if (list[i]['id'] == id) {
        final item = Map<String, dynamic>.from(list[i]);
        item.addAll(updates);
        list[i] = item;
        break;
      }
    }
    settings['secretaryAccounts'] = list;

    return await saveClinicSettings(settings);
  }

  static Future<bool> deleteSecretaryAccount(String id) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final List<dynamic> list = List.from(settings['secretaryAccounts'] ?? []);
    list.removeWhere((item) => item['id'] == id);
    settings['secretaryAccounts'] = list;

    return await saveClinicSettings(settings);
  }

  // ---------------- REVIEWS ----------------

  static Future<List<SocialReview>> getSocialReviews() async {
    final settings = await getClinicSettings();
    if (settings == null) return [];

    final List<dynamic> list = settings['socialReviewImages'] ?? [];
    return list.map((json) => SocialReview.fromJson(json)).toList();
  }

  static Future<bool> addSocialReview(SocialReview review) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final List<dynamic> list = List.from(settings['socialReviewImages'] ?? []);
    list.insert(0, review.toJson());
    settings['socialReviewImages'] = list;

    return await saveClinicSettings(settings);
  }

  static Future<bool> updateSocialReview(SocialReview review) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final List<dynamic> list = List.from(settings['socialReviewImages'] ?? []);
    for (int i = 0; i < list.length; i++) {
      if (list[i]['id'] == review.id) {
        list[i] = review.toJson();
        break;
      }
    }
    settings['socialReviewImages'] = list;

    return await saveClinicSettings(settings);
  }

  static Future<bool> deleteSocialReview(String id) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final List<dynamic> list = List.from(settings['socialReviewImages'] ?? []);
    list.removeWhere((item) => item['id'] == id);
    settings['socialReviewImages'] = list;

    return await saveClinicSettings(settings);
  }
}

import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/appointment.dart';
import '../models/clinic_holiday.dart';
import '../models/clinic_announcement.dart';
import '../models/secretary_account.dart';
import '../models/social_review.dart';

class SupabaseService {
  // Supabase credentials are injected at build time via --dart-define flags.
  // Build command example:
  //   flutter build apk \
  //     --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  //     --dart-define=SUPABASE_ANON_KEY=your-anon-key
  // No hardcoded values here — credentials must come from the build environment.
  static const String supabaseUrl =
      String.fromEnvironment('SUPABASE_URL', defaultValue: '');
  static const String anonKey =
      String.fromEnvironment('SUPABASE_ANON_KEY', defaultValue: '');

  static Map<String, String> get _headers => {
        'apikey': anonKey,
        'Authorization': 'Bearer $anonKey',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };

  static const String _prefsKeySettings = 'cached_clinic_settings_v2';
  static const String _prefsKeyAppointments = 'cached_appointments_v2';

  // In-memory cache for native 0ms instantaneous UI switches
  static Map<String, dynamic>? cachedSettings;
  static List<Appointment> cachedAppointments = [];
  static List<SocialReview> cachedReviews = [];
  static List<SecretaryAccount> cachedSecretaries = [];

  /// Loads cached appointments and clinic settings from device local flash storage (SharedPreferences)
  /// so that upon app startup, all data is in RAM in <5ms with 0.0s waiting time.
  static Future<void> initLocalCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // 1. Settings
      final settingsJsonStr = prefs.getString(_prefsKeySettings);
      if (settingsJsonStr != null) {
        final decoded = jsonDecode(settingsJsonStr);
        if (decoded is Map<String, dynamic>) {
          cachedSettings = decoded;
          _syncSubCaches(cachedSettings!);
        }
      }

      // 2. Appointments
      final apptsJsonStr = prefs.getString(_prefsKeyAppointments);
      if (apptsJsonStr != null) {
        final List<dynamic> decodedList = jsonDecode(apptsJsonStr);
        cachedAppointments = decodedList.map((j) => Appointment.fromJson(j)).toList();
      }

      debugPrint('Local disk cache loaded: ${cachedAppointments.length} appointments, settings=${cachedSettings != null}');
    } catch (e) {
      debugPrint('Error initializing local disk cache: $e');
    }
  }

  static void _persistSettingsToDisk(Map<String, dynamic> settings) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefsKeySettings, jsonEncode(settings));
    } catch (_) {}
  }

  static void _persistAppointmentsToDisk(List<Appointment> appointments) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        _prefsKeyAppointments,
        jsonEncode(appointments.map((a) => a.toJson()).toList()),
      );
    } catch (_) {}
  }

  // ---------------- APPOINTMENTS ----------------

  static Future<List<Appointment>> getAppointments({bool forceRefresh = false}) async {
    if (!forceRefresh && cachedAppointments.isNotEmpty) {
      // Fetch in background silently
      _fetchAppointmentsBackground();
      return cachedAppointments;
    }

    try {
      final response = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/appointments?select=*&order=created_at.desc'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        cachedAppointments = data.map((json) => Appointment.fromJson(json)).toList();
        _persistAppointmentsToDisk(cachedAppointments);
        return cachedAppointments;
      }
    } catch (e) {
      debugPrint('Error loading appointments: $e');
    }
    return cachedAppointments;
  }

  static void _fetchAppointmentsBackground() async {
    try {
      final response = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/appointments?select=*&order=created_at.desc'),
        headers: _headers,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        cachedAppointments = data.map((json) => Appointment.fromJson(json)).toList();
        _persistAppointmentsToDisk(cachedAppointments);
      }
    } catch (_) {}
  }

  static Future<bool> updateAppointmentStatus(String id, String status) async {
    // Optimistic update
    for (int i = 0; i < cachedAppointments.length; i++) {
      if (cachedAppointments[i].id == id) {
        cachedAppointments[i] = cachedAppointments[i].copyWith(status: status);
        break;
      }
    }
    _persistAppointmentsToDisk(cachedAppointments);

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

  static Future<Map<String, dynamic>?> getClinicSettings({bool forceRefresh = false}) async {
    if (!forceRefresh && cachedSettings != null) {
      _fetchSettingsBackground();
      return cachedSettings;
    }

    try {
      final response = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/clinic_settings?key=eq.main_settings&select=*'),
        headers: _headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        if (data.isNotEmpty && data[0]['content'] != null) {
          cachedSettings = Map<String, dynamic>.from(data[0]['content'] as Map<String, dynamic>);
          _syncSubCaches(cachedSettings!);
          _persistSettingsToDisk(cachedSettings!);
          return cachedSettings;
        }
      }
    } catch (e) {
      debugPrint('Error loading clinic settings: $e');
    }
    return cachedSettings;
  }

  static void _fetchSettingsBackground() async {
    try {
      final response = await http.get(
        Uri.parse('$supabaseUrl/rest/v1/clinic_settings?key=eq.main_settings&select=*'),
        headers: _headers,
      );
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        if (data.isNotEmpty && data[0]['content'] != null) {
          cachedSettings = Map<String, dynamic>.from(data[0]['content'] as Map<String, dynamic>);
          _syncSubCaches(cachedSettings!);
          _persistSettingsToDisk(cachedSettings!);
        }
      }
    } catch (_) {}
  }

  static void _syncSubCaches(Map<String, dynamic> settings) {
    if (settings['socialReviewImages'] is List) {
      cachedReviews = (settings['socialReviewImages'] as List)
          .map((json) => SocialReview.fromJson(json))
          .toList();
    }
    if (settings['secretaryAccounts'] is List) {
      cachedSecretaries = (settings['secretaryAccounts'] as List)
          .map((json) => SecretaryAccount.fromJson(json))
          .toList();
    }
  }

  static Future<bool> saveClinicSettings(Map<String, dynamic> content) async {
    // 1. Instant optimistic in-memory update & disk persistence
    cachedSettings = Map<String, dynamic>.from(content);
    _syncSubCaches(cachedSettings!);
    _persistSettingsToDisk(cachedSettings!);

    try {
      // 2. PATCH targeting existing main_settings record to prevent unique constraint 23505
      final patchResponse = await http.patch(
        Uri.parse('$supabaseUrl/rest/v1/clinic_settings?key=eq.main_settings'),
        headers: _headers,
        body: jsonEncode({
          'content': content,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        }),
      );

      if (patchResponse.statusCode == 200 || patchResponse.statusCode == 204) {
        debugPrint('Clinic settings saved via PATCH successfully.');
        return true;
      }

      // 3. Fallback to POST only if record does not exist
      final postResponse = await http.post(
        Uri.parse('$supabaseUrl/rest/v1/clinic_settings'),
        headers: _headers,
        body: jsonEncode({
          'key': 'main_settings',
          'content': content,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        }),
      );
      return postResponse.statusCode == 200 || postResponse.statusCode == 201;
    } catch (e) {
      debugPrint('Error saving clinic settings: $e');
      return false;
    }
  }

  // ---------------- BOOKING INTERVAL & RULES SHORTCUTS ----------------

  static Future<bool> updateSlotDuration(int minutes) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(settings['bookingSettings'] ?? {});
    bookingSettings['slotDurationMinutes'] = minutes;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  static Future<bool> updateClinicWorkingHours({
    required String hoursRegular,
    required String hoursFriday,
    String? startTime,
    String? endTime,
    String? startTimeFriday,
    String? endTimeFriday,
  }) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final clinic = Map<String, dynamic>.from(settings['clinic'] ?? {});
    clinic['hoursRegular'] = hoursRegular;
    clinic['hoursFriday'] = hoursFriday;
    settings['clinic'] = clinic;

    final bookingSettings = Map<String, dynamic>.from(settings['bookingSettings'] ?? {});
    if (startTime != null) bookingSettings['startTime'] = startTime;
    if (endTime != null) bookingSettings['endTime'] = endTime;
    if (startTimeFriday != null) bookingSettings['startTimeFriday'] = startTimeFriday;
    if (endTimeFriday != null) bookingSettings['endTimeFriday'] = endTimeFriday;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  static Future<bool> updateBookingRules({
    int? minAdvanceHours,
    int? maxAdvanceDays,
    List<String>? allowedDays,
    bool? enableFutureBooking,
  }) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(settings['bookingSettings'] ?? {});
    if (minAdvanceHours != null) bookingSettings['minAdvanceHours'] = minAdvanceHours;
    if (maxAdvanceDays != null) bookingSettings['maxAdvanceDays'] = maxAdvanceDays;
    if (allowedDays != null) bookingSettings['allowedDays'] = allowedDays;
    if (enableFutureBooking != null) bookingSettings['enableFutureBooking'] = enableFutureBooking;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
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

  static Future<List<SecretaryAccount>> getSecretaryAccounts({bool forceRefresh = false}) async {
    if (!forceRefresh && cachedSecretaries.isNotEmpty) {
      return cachedSecretaries;
    }

    final settings = await getClinicSettings(forceRefresh: forceRefresh);
    if (settings == null) return [];

    final List<dynamic> list = settings['secretaryAccounts'] ?? [];
    cachedSecretaries = list.map((json) => SecretaryAccount.fromJson(json)).toList();
    return cachedSecretaries;
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

  static Future<List<SocialReview>> getSocialReviews({bool forceRefresh = false}) async {
    if (!forceRefresh && cachedReviews.isNotEmpty) {
      return cachedReviews;
    }

    final settings = await getClinicSettings(forceRefresh: forceRefresh);
    if (settings == null) return [];

    final List<dynamic> list = settings['socialReviewImages'] ?? [];
    cachedReviews = list.map((json) => SocialReview.fromJson(json)).toList();
    return cachedReviews;
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

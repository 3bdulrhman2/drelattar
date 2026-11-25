import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/appointment.dart';
import '../models/clinic_holiday.dart';
import '../models/clinic_announcement.dart';
import '../models/secretary_account.dart';
import '../models/social_review.dart';
import 'notification_service.dart';

class SupabaseService {
  static final appointmentChanges = ValueNotifier<int>(0);
  /// Bumped when cached clinic settings change outside a screen's own setState
  /// (for example a rollback after a failed background save).
  static final settingsChanges = ValueNotifier<int>(0);

  // ---- Instant (optimistic) changes ----
  // A change is applied to the screen and the on-device cache immediately.
  // The backend save runs in the background. Refreshes never bring back the
  // old value while a save is still running. If the save fails, the change is
  // rolled back and the user gets an in-app message and a phone notification.
  static final GlobalKey<ScaffoldMessengerState> messengerKey =
      GlobalKey<ScaffoldMessengerState>();
  static const String _prefsKeyPending = 'sync_pending_v1';
  static final Map<String, String> _pendingStatus = {};
  static final Set<String> _pendingDeletes = {};
  static Map<String, dynamic>? _confirmedSettings;
  static int _settingsInFlight = 0;
  static int _settingsEpoch = 0;
  static Future<void> _settingsQueue = Future.value();
  static bool unsavedFromLastSession = false;
  // Bumped on sign-out: results of saves/fetches started by a previous session
  // are dropped so they can never touch the next user's data or notices.
  static int _session = 0;
  // Bumped when a save starts or ends: a fetch that began before then carries
  // older server data and is discarded instead of overwriting newer state.
  static int _apptGen = 0;
  static int _settingsGen = 0;
  static Future<void> _apptQueue = Future.value();

  /// Clears cached clinic data and every pending change. Called on sign-out.
  static Future<void> resetForLogout() async {
    _session++;
    _apptGen++;
    _settingsGen++;
    _settingsEpoch++;
    _pendingStatus.clear();
    _pendingDeletes.clear();
    _settingsInFlight = 0;
    _settingsQueue = Future.value();
    _apptQueue = Future.value();
    _confirmedSettings = null;
    cachedSettings = null;
    cachedAppointments = [];
    cachedReviews = [];
    cachedSecretaries = [];
    unsavedFromLastSession = false;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_prefsKeyPending);
      await prefs.remove(_prefsKeySettings);
      await prefs.remove(_prefsKeyAppointments);
    } catch (_) {}
    appointmentChanges.value++;
    settingsChanges.value++;
  }

  @visibleForTesting
  static void seedConfirmedForTest(Map<String, dynamic>? settings) {
    _confirmedSettings = settings == null ? null : _deepCopy(settings);
    _pendingStatus.clear();
    _pendingDeletes.clear();
    _settingsQueue = Future.value();
    _apptQueue = Future.value();
    _settingsInFlight = 0;
  }

  static Map<String, dynamic> _deepCopy(Map<String, dynamic> m) =>
      Map<String, dynamic>.from(jsonDecode(jsonEncode(m)) as Map);

  static List<Appointment> _applyPending(List<Appointment> list) => list
      .where((a) => !_pendingDeletes.contains(a.id))
      .map(
        (a) => _pendingStatus.containsKey(a.id)
            ? a.copyWith(status: _pendingStatus[a.id])
            : a,
      )
      .toList();

  static Future<void> _setPendingFlag(bool on) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (on) {
        await prefs.setBool(_prefsKeyPending, true);
      } else {
        await prefs.remove(_prefsKeyPending);
      }
    } catch (_) {}
  }

  static bool get _anyInFlight =>
      _settingsInFlight > 0 ||
      _pendingStatus.isNotEmpty ||
      _pendingDeletes.isNotEmpty;

  static Future<void> _maybeClearPendingFlag() async {
    if (!_anyInFlight) await _setPendingFlag(false);
  }

  /// Shows the failure inside the app and as a phone notification.
  static void reportSaveFailure(String message) {
    try {
      final m = messengerKey.currentState;
      m?.clearSnackBars();
      m?.showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.red.shade700,
          duration: const Duration(seconds: 10),
          showCloseIcon: true,
        ),
      );
    } catch (_) {}
    NotificationService.showSaveFailure(message);
  }
  // Supabase credentials are injected at build time via --dart-define flags.
  // Build command example:
  //   flutter build apk \
  //     --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  //     --dart-define=SUPABASE_ANON_KEY=your-anon-key
  // No hardcoded values here — credentials must come from the build environment.
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );
  static const String anonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: '',
  );

  /// Uses the signed-in staff member's session token when available so the
  /// backend row-level security sees the real caller (same model as the
  /// website dashboards). Falls back to the anonymous publishable key only
  /// for public reads (e.g. clinic settings) before sign-in.
  static Map<String, String> get _headers {
    var token = anonKey;
    try {
      final session = Supabase.instance.client.auth.currentSession;
      if (session != null) token = session.accessToken;
    } catch (_) {}
    return {
      'apikey': anonKey,
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
  }

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
      unsavedFromLastSession = prefs.getBool(_prefsKeyPending) == true;
      if (unsavedFromLastSession) await prefs.remove(_prefsKeyPending);

      // 1. Settings
      final settingsJsonStr = prefs.getString(_prefsKeySettings);
      if (settingsJsonStr != null) {
        final decoded = jsonDecode(settingsJsonStr);
        if (decoded is Map) decoded.remove('secretaryAccounts');
        if (decoded is Map<String, dynamic>) {
          cachedSettings = decoded;
          _syncSubCaches(cachedSettings!);
          _confirmedSettings = _deepCopy(decoded);
        }
      }

      // 2. Appointments
      final apptsJsonStr = prefs.getString(_prefsKeyAppointments);
      if (apptsJsonStr != null) {
        final List<dynamic> decodedList = jsonDecode(apptsJsonStr);
        cachedAppointments = decodedList
            .map((j) => Appointment.fromJson(j))
            .toList();
      }

      debugPrint(
        'Local disk cache loaded: ${cachedAppointments.length} appointments, settings=${cachedSettings != null}',
      );
    } catch (e) {
      debugPrint('Error initializing local disk cache: $e');
    }
  }

  static void _persistSettingsToDisk(Map<String, dynamic> settings) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final safe = Map<String, dynamic>.from(settings)
        ..remove('secretaryAccounts');
      await prefs.setString(_prefsKeySettings, jsonEncode(safe));
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

  static Future<List<Appointment>> getAppointments({
    bool forceRefresh = false,
  }) async {
    if (!forceRefresh && cachedAppointments.isNotEmpty) {
      // Fetch in background silently
      _fetchAppointmentsBackground();
      return cachedAppointments;
    }

    try {
      final gen = _apptGen, sess = _session;
      final response = await http.get(
        Uri.parse(
          '$supabaseUrl/rest/v1/appointments?select=*&order=created_at.desc',
        ),
        headers: _headers,
      );
      if (gen != _apptGen || sess != _session) return cachedAppointments;

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        cachedAppointments = _applyPending(
          data.map((json) => Appointment.fromJson(json)).toList(),
        );
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
      final gen = _apptGen, sess = _session;
      final response = await http.get(
        Uri.parse(
          '$supabaseUrl/rest/v1/appointments?select=*&order=created_at.desc',
        ),
        headers: _headers,
      );
      if (gen != _apptGen || sess != _session) return;
      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        cachedAppointments = _applyPending(
          data.map((json) => Appointment.fromJson(json)).toList(),
        );
        _persistAppointmentsToDisk(cachedAppointments);
      }
    } catch (_) {}
  }

  /// Shows the new status at once, then saves it in the background.
  /// Returns true right away (change accepted); a failed save rolls it back
  /// and reports the failure. Appointment saves run one after another.
  static Future<bool> updateAppointmentStatus(String id, String status) async {
    _pendingStatus[id] = status;
    _apptGen++;
    await _setPendingFlag(true);
    cachedAppointments = _applyPending(cachedAppointments);
    _persistAppointmentsToDisk(cachedAppointments);
    appointmentChanges.value++;
    final headers = _headers, sess = _session;
    _apptQueue = _apptQueue.then((_) => _saveStatus(id, status, headers, sess));
    return true;
  }

  static Future<void> _saveStatus(
    String id,
    String status,
    Map<String, String> headers,
    int sess,
  ) async {
    if (sess != _session) return;
    var ok = false;
    try {
      final response = await http.patch(
        Uri.parse('$supabaseUrl/rest/v1/appointments?id=eq.$id'),
        headers: headers,
        body: jsonEncode({'status': status}),
      );
      final rows = response.statusCode == 200
          ? jsonDecode(response.body)
          : null;
      ok =
          rows is List &&
          rows.length == 1 &&
          rows.first['id'] == id &&
          rows.first['status'] == status;
    } catch (e) {
      debugPrint('Error updating appointment status: $e');
    }
    if (sess != _session) return;
    // Only drop our own pending value; a newer change to the same booking stays.
    final newerPending =
        _pendingStatus.containsKey(id) && _pendingStatus[id] != status;
    if (!newerPending) _pendingStatus.remove(id);
    _apptGen++;
    await getAppointments(forceRefresh: true);
    appointmentChanges.value++;
    if (!ok) {
      reportSaveFailure(
        'لم يتم حفظ تغيير حالة الحجز، رجعناه كما كان. حاول مرة أخرى.',
      );
    }
    await _maybeClearPendingFlag();
  }

  static Future<bool> deleteAppointment(String id) async {
    _pendingDeletes.add(id);
    _apptGen++;
    await _setPendingFlag(true);
    cachedAppointments = _applyPending(cachedAppointments);
    _persistAppointmentsToDisk(cachedAppointments);
    appointmentChanges.value++;
    final headers = _headers, sess = _session;
    _apptQueue = _apptQueue.then((_) => _saveDelete(id, headers, sess));
    return true;
  }

  static Future<void> _saveDelete(
    String id,
    Map<String, String> headers,
    int sess,
  ) async {
    if (sess != _session) return;
    var ok = false;
    try {
      final response = await http.delete(
        Uri.parse('$supabaseUrl/rest/v1/appointments?id=eq.$id'),
        headers: headers,
      );
      ok = response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      debugPrint('Error deleting appointment: $e');
    }
    if (sess != _session) return;
    _pendingDeletes.remove(id);
    _apptGen++;
    await getAppointments(forceRefresh: true);
    appointmentChanges.value++;
    if (!ok) {
      reportSaveFailure('لم يتم حذف الحجز، رجع كما كان. حاول مرة أخرى.');
    }
    await _maybeClearPendingFlag();
  }

  // ---------------- CLINIC SETTINGS ----------------

  static Future<Map<String, dynamic>?> getClinicSettings({
    bool forceRefresh = false,
  }) async {
    // While a save is running the local copy is the newest truth: never
    // replace it with an older server copy.
    if (_settingsInFlight > 0 && cachedSettings != null) return cachedSettings;
    if (!forceRefresh && cachedSettings != null) {
      _fetchSettingsBackground();
      return cachedSettings;
    }

    try {
      final gen = _settingsGen, sess = _session;
      final response = await http.get(
        Uri.parse(
          '$supabaseUrl/rest/v1/clinic_settings?key=eq.main_settings&select=*',
        ),
        headers: _headers,
      );

      if (response.statusCode == 200 &&
          _settingsInFlight == 0 &&
          gen == _settingsGen &&
          sess == _session) {
        final List<dynamic> data = jsonDecode(response.body);
        if (data.isNotEmpty && data[0]['content'] != null) {
          cachedSettings = Map<String, dynamic>.from(
            data[0]['content'] as Map<String, dynamic>,
          );
          _confirmedSettings = _deepCopy(cachedSettings!);
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
    if (_settingsInFlight > 0) return;
    try {
      final gen = _settingsGen, sess = _session;
      final response = await http.get(
        Uri.parse(
          '$supabaseUrl/rest/v1/clinic_settings?key=eq.main_settings&select=*',
        ),
        headers: _headers,
      );
      if (response.statusCode == 200 &&
          _settingsInFlight == 0 &&
          gen == _settingsGen &&
          sess == _session) {
        final List<dynamic> data = jsonDecode(response.body);
        if (data.isNotEmpty && data[0]['content'] != null) {
          cachedSettings = Map<String, dynamic>.from(
            data[0]['content'] as Map<String, dynamic>,
          );
          _confirmedSettings = _deepCopy(cachedSettings!);
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
    settings.remove('secretaryAccounts');
  }

  /// Applies the settings on screen and on the device at once, then saves them
  /// in the background. Returns true right away (change accepted). If the save
  /// fails, every unsaved settings change is rolled back to the last saved
  /// state and the failure is reported.
  static Future<bool> saveClinicSettings(Map<String, dynamic> content) async {
    final snapshot = _deepCopy(content);
    cachedSettings = Map<String, dynamic>.from(content);
    _syncSubCaches(cachedSettings!);
    _persistSettingsToDisk(cachedSettings!);
    _settingsInFlight++;
    _settingsGen++;
    final epoch = _settingsEpoch, sess = _session;
    final headers = _headers;
    await _setPendingFlag(true);
    _settingsQueue = _settingsQueue.then(
      (_) => _runSettingsSave(snapshot, epoch, headers, sess),
    );
    return true;
  }

  static Future<void> _runSettingsSave(
    Map<String, dynamic> content,
    int epoch,
    Map<String, String> headers,
    int sess,
  ) async {
    if (sess != _session) return;
    var ok = false;
    if (epoch == _settingsEpoch) ok = await _sendSettings(content, headers);
    if (sess != _session) return;
    _settingsGen++;
    if (ok) {
      _confirmedSettings = _deepCopy(content);
    } else if (epoch == _settingsEpoch) {
      // First failure of this batch: later queued saves must not re-send it.
      _settingsEpoch++;
      reportSaveFailure(
        'لم يتم حفظ التغيير على السيرفر، رجعناه كما كان. حاول مرة أخرى.',
      );
    }
    _settingsInFlight--;
    if (_settingsInFlight == 0 && !ok) {
      final good = _confirmedSettings;
      if (good != null) {
        cachedSettings = _deepCopy(good);
        _syncSubCaches(cachedSettings!);
        _persistSettingsToDisk(cachedSettings!);
      }
      settingsChanges.value++;
      await getClinicSettings(forceRefresh: true);
      settingsChanges.value++;
    } else if (_settingsInFlight == 0 && epoch != _settingsEpoch) {
      settingsChanges.value++;
    }
    await _maybeClearPendingFlag();
  }

  static Future<bool> _sendSettings(
    Map<String, dynamic> content,
    Map<String, String> headers,
  ) async {
    try {
      final patchResponse = await http.patch(
        Uri.parse('$supabaseUrl/rest/v1/clinic_settings?key=eq.main_settings'),
        headers: headers,
        body: jsonEncode({
          'content': content,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        }),
      );
      if (patchResponse.statusCode == 204) return true;
      if (patchResponse.statusCode == 200) {
        final rows = jsonDecode(patchResponse.body);
        // A 200 with no row means nothing was saved (no permission or no record).
        if (rows is List && rows.isNotEmpty) return true;
      }

      // Fallback to POST only if the record does not exist.
      final postResponse = await http.post(
        Uri.parse('$supabaseUrl/rest/v1/clinic_settings'),
        headers: headers,
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

    final bookingSettings = Map<String, dynamic>.from(
      settings['bookingSettings'] ?? {},
    );
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

    final bookingSettings = Map<String, dynamic>.from(
      settings['bookingSettings'] ?? {},
    );
    if (startTime != null) bookingSettings['startTime'] = startTime;
    if (endTime != null) bookingSettings['endTime'] = endTime;
    if (startTimeFriday != null)
      bookingSettings['startTimeFriday'] = startTimeFriday;
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

    final bookingSettings = Map<String, dynamic>.from(
      settings['bookingSettings'] ?? {},
    );
    if (minAdvanceHours != null)
      bookingSettings['minAdvanceHours'] = minAdvanceHours;
    if (maxAdvanceDays != null)
      bookingSettings['maxAdvanceDays'] = maxAdvanceDays;
    if (allowedDays != null) bookingSettings['allowedDays'] = allowedDays;
    if (enableFutureBooking != null)
      bookingSettings['enableFutureBooking'] = enableFutureBooking;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  // ---------------- CLOSURES & HOLIDAYS ----------------

  static Future<bool> toggleCloseToday(bool isClosed, [String? reason]) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(
      settings['bookingSettings'] ?? {},
    );
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

    final bookingSettings = Map<String, dynamic>.from(
      settings['bookingSettings'] ?? {},
    );
    final List<dynamic> currentClosed = List.from(
      bookingSettings['closedDates'] ?? [],
    );

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

    final bookingSettings = Map<String, dynamic>.from(
      settings['bookingSettings'] ?? {},
    );
    final List<dynamic> currentHolidays = List.from(
      bookingSettings['holidays'] ?? [],
    );
    currentHolidays.insert(0, holiday.toJson());

    bookingSettings['holidays'] = currentHolidays;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  static Future<bool> deleteHoliday(String id) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(
      settings['bookingSettings'] ?? {},
    );
    final List<dynamic> currentHolidays = List.from(
      bookingSettings['holidays'] ?? [],
    );
    currentHolidays.removeWhere((h) => h['id'] == id);

    bookingSettings['holidays'] = currentHolidays;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  // ---------------- ANNOUNCEMENTS ----------------

  static Future<bool> addAnnouncement(ClinicAnnouncement announcement) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(
      settings['bookingSettings'] ?? {},
    );
    final List<dynamic> currentAnnouncements = List.from(
      bookingSettings['announcements'] ?? [],
    );
    currentAnnouncements.insert(0, announcement.toJson());

    bookingSettings['announcements'] = currentAnnouncements;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  static Future<bool> deleteAnnouncement(String id) async {
    final settings = await getClinicSettings();
    if (settings == null) return false;

    final bookingSettings = Map<String, dynamic>.from(
      settings['bookingSettings'] ?? {},
    );
    final List<dynamic> currentAnnouncements = List.from(
      bookingSettings['announcements'] ?? [],
    );
    currentAnnouncements.removeWhere((a) => a['id'] == id);

    bookingSettings['announcements'] = currentAnnouncements;
    settings['bookingSettings'] = bookingSettings;

    return await saveClinicSettings(settings);
  }

  // ---------------- SECRETARY ACCOUNTS ----------------

  static Future<Map<String, dynamic>> _staffRequest(
    Map<String, dynamic> body,
  ) async {
    if (supabaseUrl.isEmpty) throw StateError('خدمة الحسابات غير متاحة الآن');
    final response = await http.post(
      Uri.parse('$supabaseUrl/functions/v1/clinic-staff'),
      headers: _headers,
      body: jsonEncode(body),
    );
    if (response.statusCode != 200)
      throw StateError(
        'تعذر إتمام العملية. تأكد من الاتصال وتفعيل خدمة حسابات الفريق.',
      );
    return Map<String, dynamic>.from(jsonDecode(response.body));
  }

  static Future<List<SecretaryAccount>> getSecretaryAccounts({
    bool forceRefresh = false,
  }) async {
    final result = await _staffRequest({'action': 'list'});
    cachedSecretaries = (result['accounts'] as List)
        .map((e) => SecretaryAccount.fromJson(e))
        .toList();
    return List.of(cachedSecretaries);
  }

  static Future<bool> createSecretaryAccount({
    required String email,
    required String password,
    required String name,
    String? phone,
  }) async {
    await _staffRequest({
      'action': 'create',
      'email': email,
      'password': password,
      'name': name,
      'phone': phone,
    });
    return true;
  }

  static Future<bool> updateSecretaryAccount(
    String id,
    Map<String, dynamic> updates,
  ) async {
    await _staffRequest({'action': 'update', 'id': id, ...updates});
    return true;
  }

  static Future<bool> deleteSecretaryAccount(String id) async {
    await _staffRequest({'action': 'delete', 'id': id});
    return true;
  }

  // ---------------- REVIEWS ----------------

  static Future<List<SocialReview>> getSocialReviews({
    bool forceRefresh = false,
  }) async {
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

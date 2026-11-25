import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../models/appointment.dart';
import '../models/reception_entry.dart';
import '../utils/clinic_time.dart';

/// Feeds the two Android home-screen widgets (current visit, next booking).
/// Only a first-names-and-time summary for today leaves the app cache: no
/// phone numbers, notes or ids. Failures never affect the app.
class WidgetService {
  static const _channel = MethodChannel('clinic/widget');
  static List<ReceptionEntry> walkIns = const [];

  static String _short(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    return parts.take(2).join(' ');
  }

  static String _day(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  /// Builds the payload. [now] is injectable for tests.
  static Map<String, dynamic> build(
    List<Appointment> appointments,
    List<ReceptionEntry> walk, {
    DateTime? now,
  }) {
    final n = now ?? DateTime.now();
    final today = _day(n);
    Map<String, dynamic>? current;
    final upcoming = <Map<String, dynamic>>[];
    for (final a in appointments) {
      if (a.appointmentDate != today) continue;
      if (a.status == 'in_consultation') {
        current = {'name': _short(a.patientName)};
      } else if (a.status == 'pending' ||
          a.status == 'confirmed' ||
          a.status == 'arrived') {
        final m = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(a.appointmentTime);
        if (m == null) continue;
        upcoming.add({
          'name': _short(a.patientName),
          'm': int.parse(m.group(1)!) * 60 + int.parse(m.group(2)!),
          't': clinicTime(a.appointmentTime),
        });
      }
    }
    for (final w in walk) {
      if (_day(w.arrivedAt) != today) continue;
      if (w.status == 'in_consultation') {
        current ??= {'name': _short(w.name)};
      }
    }
    upcoming.sort((a, b) => (a['m'] as int).compareTo(b['m'] as int));
    return {
      'day': today,
      'current': current,
      'upcoming': upcoming,
      'updated': n.millisecondsSinceEpoch,
    };
  }

  static Future<void> pushAppointments(List<Appointment> appointments) async {
    try {
      final json = jsonEncode(build(appointments, walkIns));
      await _channel.invokeMethod('update', json);
    } catch (e) {
      debugPrint('Widget update skipped: $e');
    }
  }

  static Future<void> clear() async {
    walkIns = const [];
    try {
      await _channel.invokeMethod('clear');
    } catch (_) {}
  }
}

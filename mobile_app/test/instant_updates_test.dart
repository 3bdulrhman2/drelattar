import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:my_clinic/models/appointment.dart';
import 'package:my_clinic/screens/admin/admin_holidays_tab.dart';
import 'package:my_clinic/services/supabase_service.dart';
import 'package:my_clinic/theme/app_theme.dart';
import 'package:shared_preferences/shared_preferences.dart';

Map<String, dynamic> _settings() => {
  'bookingSettings': {
    'closedDates': ['2026-12-05'],
    'holidays': [],
  },
};

Appointment _appt(String status) => Appointment(
  id: 'a1',
  patientName: 'Test Patient',
  patientPhone: '01000000000',
  appointmentDate: '2026-12-01',
  appointmentTime: '10:00',
  status: status,
  createdAt: '2026-11-25T10:00:00Z',
);

class _Server {
  final patch = Completer<http.Response>();
  List<dynamic> settingsRows = [
    {'content': _settings()},
  ];
  List<dynamic> apptRows = [_appt('pending').toJson()];
  late final client = MockClient((r) async {
    if (r.method == 'PATCH') return patch.future;
    if (r.method == 'DELETE') return patch.future;
    if (r.method == 'POST') return http.Response('conflict', 409);
    if (r.url.path.contains('clinic_settings')) {
      return http.Response(jsonEncode(settingsRows), 200);
    }
    return http.Response(jsonEncode(apptRows), 200);
  });
}

Future<void> _app(WidgetTester t, Widget home) => t.pumpWidget(
  MaterialApp(
    scaffoldMessengerKey: SupabaseService.messengerKey,
    theme: AppTheme.lightTheme,
    locale: const Locale('ar', 'EG'),
    supportedLocales: const [Locale('ar', 'EG')],
    localizationsDelegates: const [
      GlobalMaterialLocalizations.delegate,
      GlobalWidgetsLocalizations.delegate,
      GlobalCupertinoLocalizations.delegate,
    ],
    home: Scaffold(body: home),
  ),
);

void main() {
  setUpAll(() async {
    await (FontLoader('MaterialIcons')
          ..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf')))
        .load();
  });
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    SupabaseService.cachedSettings = _settings();
    SupabaseService.seedConfirmedForTest(_settings());
    SupabaseService.cachedAppointments = [_appt('pending')];
  });

  testWidgets('closed day removed: instant, stays after refresh, saved', (t) async {
    final s = _Server();
    await http.runWithClient(() async {
      t.view.physicalSize = const Size(800, 2400);
      t.view.devicePixelRatio = 1;
      addTearDown(t.view.resetPhysicalSize);
      await _app(t, AdminHolidaysTab());
      await t.pump();
      expect(find.text('2026-12-05'), findsOneWidget);
      await t.tap(find.byIcon(Icons.close).first);
      await t.pump();
      expect(find.text('2026-12-05'), findsNothing, reason: 'instant, save still running');
      // Refresh while backend save is still processing: server copy is old.
      await t.runAsync(() => SupabaseService.getClinicSettings(forceRefresh: true));
      await t.pump();
      expect(find.text('2026-12-05'), findsNothing, reason: 'refresh must not bring it back');
      await t.pump(const Duration(milliseconds: 50));
      s.patch.complete(http.Response('', 204));
      await t.runAsync(() => Future.delayed(const Duration(milliseconds: 50)));
      await t.pump(const Duration(milliseconds: 50));
      await t.pump();
      expect(find.text('2026-12-05'), findsNothing);
      expect(find.byType(SnackBar), findsNothing);
    }, () => s.client);
  });

  testWidgets('closed day removal fails: rolls back and warns', (t) async {
    final s = _Server();
    await http.runWithClient(() async {
      t.view.physicalSize = const Size(800, 2400);
      t.view.devicePixelRatio = 1;
      addTearDown(t.view.resetPhysicalSize);
      await _app(t, AdminHolidaysTab());
      await t.pump();
      await t.tap(find.byIcon(Icons.close).first);
      await t.pump();
      expect(find.text('2026-12-05'), findsNothing);
      await t.pump(const Duration(milliseconds: 50));
      s.patch.complete(http.Response('boom', 500));
      for (var i = 0; i < 8; i++) {
        await t.runAsync(() => Future.delayed(const Duration(milliseconds: 20)));
        await t.pump(const Duration(milliseconds: 100));
      }
      expect(find.text('2026-12-05'), findsOneWidget, reason: 'rolled back');
      expect(find.textContaining('لم يتم حفظ التغيير'), findsOneWidget);
    }, () => s.client);
  });

  test('booking confirm: instant, survives refresh, rolls back on failure', () async {
    final ok = _Server();
    await http.runWithClient(() async {
      expect(await SupabaseService.updateAppointmentStatus('a1', 'confirmed'), isTrue);
      expect(SupabaseService.cachedAppointments.single.status, 'confirmed');
      final refreshed = await SupabaseService.getAppointments(forceRefresh: true);
      expect(refreshed.single.status, 'confirmed', reason: 'server still says pending');
      ok.apptRows = [_appt('confirmed').toJson()];
      ok.patch.complete(http.Response(jsonEncode([_appt('confirmed').toJson()]), 200));
      await Future.delayed(const Duration(milliseconds: 50));
      expect(SupabaseService.cachedAppointments.single.status, 'confirmed');
    }, () => ok.client);

    SupabaseService.cachedAppointments = [_appt('pending')];
    final bad = _Server();
    await http.runWithClient(() async {
      await SupabaseService.updateAppointmentStatus('a1', 'confirmed');
      expect(SupabaseService.cachedAppointments.single.status, 'confirmed');
      bad.patch.complete(http.Response('boom', 500));
      await Future.delayed(const Duration(milliseconds: 100));
      expect(SupabaseService.cachedAppointments.single.status, 'pending');
    }, () => bad.client);
  });

  test('sign-out drops pending saves: no stale rollback or notice for next user', () async {
    final srv = _Server();
    await http.runWithClient(() async {
      await SupabaseService.updateAppointmentStatus('a1', 'confirmed');
      await SupabaseService.resetForLogout();
      expect(SupabaseService.cachedAppointments, isEmpty);
      expect(SupabaseService.cachedSettings, isNull);
      srv.patch.complete(http.Response('boom', 500));
      await Future.delayed(const Duration(milliseconds: 100));
      expect(SupabaseService.cachedAppointments, isEmpty, reason: 'old session result ignored');
    }, () => srv.client);
  });

  test('fetch that started before a save finished is discarded (no flip-back)', () async {
    final fetchGate = Completer<http.Response>();
    final patch = Completer<http.Response>();
    final client = MockClient((r) async {
      if (r.method == 'PATCH') return patch.future;
      return fetchGate.future; // stale server copy, answers late
    });
    await http.runWithClient(() async {
      final late = SupabaseService.getAppointments(forceRefresh: true);
      await SupabaseService.updateAppointmentStatus('a1', 'confirmed');
      patch.complete(http.Response(jsonEncode([_appt('confirmed').toJson()]), 200));
      await Future.delayed(const Duration(milliseconds: 50));
      fetchGate.complete(http.Response(jsonEncode([_appt('pending').toJson()]), 200));
      await late;
      expect(SupabaseService.cachedAppointments.single.status, 'confirmed');
    }, () => client);
  });
}

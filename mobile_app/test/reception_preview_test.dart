import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_clinic/screens/reception_tab.dart';
import 'package:my_clinic/models/appointment.dart';
import 'package:my_clinic/theme/app_theme.dart';

void main() {
  setUpAll(() async {
    await (FontLoader('ClinicArabic')
          ..addFont(rootBundle.load('assets/fonts/Arabic-Regular.ttf'))
          ..addFont(rootBundle.load('assets/fonts/Arabic-Bold.ttf')))
        .load();
    await (FontLoader(
      'MaterialIcons',
    )..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();
  });
  for (final width in [320.0, 390.0]) {
    testWidgets('read-only reception preview $width', (t) async {
      final n = DateTime.now();
      final d =
          '${n.year}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')}';
      t.view.physicalSize = Size(width, 844);
      t.view.devicePixelRatio = 1;
      addTearDown(t.view.resetPhysicalSize);
      addTearDown(t.view.resetDevicePixelRatio);
      final a = Appointment(
        id: 'synthetic',
        patientName: 'اسم تجريبي',
        patientPhone: '',
        appointmentDate: d,
        appointmentTime: '16:00',
        status: 'pending',
        createdAt: n.toIso8601String(),
      );
      await t.pumpWidget(
        MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          locale: const Locale('ar', 'EG'),
          supportedLocales: const [Locale('ar', 'EG')],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          home: Scaffold(
            body: SafeArea(child: ReceptionTab(previewAppointments: [a])),
          ),
        ),
      );
      await t.pumpAndSettle();
      expect(find.text('اسم تجريبي'), findsOneWidget);
      expect(find.textContaining('في انتظار التأكيد'), findsNWidgets(2));
      expect(
        t.widget<FilledButton>(find.byType(FilledButton).first).onPressed,
        isNull,
      );
      expect(t.takeException(), isNull);
      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('reception/preview-$width.png'),
      );
    });
  }
}

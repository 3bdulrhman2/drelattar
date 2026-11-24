import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_clinic/screens/reception_tab.dart';
import 'package:my_clinic/models/reception_entry.dart';
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
    for (final dark in [false, true]) {
      for (final active in [false, true]) {
        testWidgets('reception design $width $dark $active', (t) async {
          final n = DateTime(2026, 11, 25, 16);
          final entries = [
            ReceptionEntry(
              id: 'synthetic-done',
              name: 'مريض انتهى الكشف',
              status: 'completed',
              arrivedAt: n.subtract(const Duration(minutes: 30)),
            ),
            if (active)
              ReceptionEntry(
                id: 'synthetic-current',
                name: 'أحمد محمود',
                status: 'in_consultation',
                arrivedAt: n.subtract(const Duration(minutes: 10)),
                startedAt: n,
              ),
            ...List.generate(
              3,
              (i) => ReceptionEntry(
                id: 'synthetic-$i',
                name: ['منى عبد الرحمن', 'خالد إبراهيم', 'سارة محمد'][i],
                status: 'waiting',
                arrivedAt: n.add(Duration(minutes: i)),
              ),
            ),
          ];
          t.view.physicalSize = Size(width, 844);
          t.view.devicePixelRatio = 1;
          addTearDown(t.view.resetPhysicalSize);
          addTearDown(t.view.resetDevicePixelRatio);
          await t.pumpWidget(
            MaterialApp(
              debugShowCheckedModeBanner: false,
              theme: dark ? AppTheme.darkTheme : AppTheme.lightTheme,
              locale: const Locale('ar', 'EG'),
              supportedLocales: const [Locale('ar', 'EG')],
              localizationsDelegates: const [
                GlobalMaterialLocalizations.delegate,
                GlobalWidgetsLocalizations.delegate,
                GlobalCupertinoLocalizations.delegate,
              ],
              home: Scaffold(
                appBar: AppBar(
                  title: Row(
                    children: [
                      Image.asset(
                        'assets/images/clinic_logo.png',
                        width: 36,
                        height: 36,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'عيادة د. محمد السيد العطار',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                body: SafeArea(
                  child: ReceptionTab(
                    previewAppointments: const [],
                    previewSnapshot: ReceptionSnapshot(n, entries),
                    previewSettings: const {
                      'bookingSettings': {
                        'startTime': '16:00',
                        'endTime': '23:00',
                      },
                    },
                  ),
                ),
              ),
            ),
          );
          await t.pumpAndSettle();
          expect(find.text('إضافة مريض'), findsOneWidget);
          expect(find.text('استدعاء الدور التالي'), findsOneWidget);
          expect(find.text('منى عبد الرحمن'), findsOneWidget);
          expect(t.takeException(), isNull);
          await t.scrollUntilVisible(find.text('تم الكشف (١)'), 100);
          await t.ensureVisible(find.text('تم الكشف (١)'));
          await t.pumpAndSettle();
          expect(find.text('مريض انتهى الكشف'), findsNothing);
          await t.tap(find.text('تم الكشف (١)'));
          await t.pumpAndSettle();
          expect(find.text('مريض انتهى الكشف'), findsOneWidget);
          await t.ensureVisible(find.text('مريض انتهى الكشف'));
          await t.pumpAndSettle();
          await expectLater(
            find.byType(MaterialApp),
            matchesGoldenFile('reception/completed-$width-$dark-$active.png'),
          );
          await t.tap(find.text('تم الكشف (١)'));
          await t.pumpAndSettle();
          await t.drag(find.byType(ListView), const Offset(0, 1500));
          await t.pumpAndSettle();
          await expectLater(
            find.byType(MaterialApp),
            matchesGoldenFile('reception/revised-$width-$dark-$active.png'),
          );
        });
      }
    }
  }
}

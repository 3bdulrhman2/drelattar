import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:my_clinic/theme/app_theme.dart';
import 'package:my_clinic/models/appointment.dart';
import 'package:my_clinic/screens/admin/admin_home_tab.dart';
import 'package:my_clinic/screens/admin/admin_bookings_tab.dart';

void main() {
  setUpAll(() async {
    await initializeDateFormatting('ar');
    final loader = FontLoader('ClinicArabic')
      ..addFont(rootBundle.load('assets/fonts/Arabic-Regular.ttf'))
      ..addFont(rootBundle.load('assets/fonts/Arabic-Bold.ttf'));
    await loader.load();
    final icons = FontLoader('MaterialIcons')
      ..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'));
    await icons.load();
  });
  List<Appointment> data() {
    final n = DateTime.now();
    final d =
        '${n.year}-${n.month.toString().padLeft(2, '0')}-${n.day.toString().padLeft(2, '0')}';
    return List.generate(
      4,
      (i) => Appointment(
        id: 'synthetic-$i',
        patientName: [
          'أحمد محمود',
          'منى عبد الرحمن',
          'خالد إبراهيم',
          'سارة محمد',
        ][i],
        patientPhone: '01000000000',
        appointmentDate: d,
        appointmentTime: ['17:30', '18:00', '18:30', '19:00'][i],
        status: i.isEven ? 'pending' : 'confirmed',
        createdAt: n.toIso8601String(),
      ),
    );
  }

  Widget shell(Widget child, bool dark) => MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: AppTheme.lightTheme,
    darkTheme: AppTheme.darkTheme,
    themeMode: dark ? ThemeMode.dark : ThemeMode.light,
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
            Image.asset('assets/images/clinic_logo.png', width: 40, height: 40),
            const SizedBox(width: 8),
            const Expanded(
              child: Text(
                'عيادة د. محمد السيد العطار',
                style: TextStyle(fontSize: 12),
              ),
            ),
          ],
        ),
      ),
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            label: 'الرئيسية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_month_outlined),
            label: 'الحجوزات',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.more_horiz),
            label: 'المزيد',
          ),
        ],
      ),
    ),
  );
  for (final dark in [false, true]) {
    testWidgets('home ${dark ? 'dark' : 'light'} fits and renders', (t) async {
      t.view.physicalSize = const Size(390, 844);
      t.view.devicePixelRatio = 1;
      addTearDown(t.view.resetPhysicalSize);
      addTearDown(t.view.resetDevicePixelRatio);
      await t.pumpWidget(
        shell(
          AdminHomeTab(
            previewAppointments: data(),
            onNavigateToBookings: () {},
            onNavigateToWebsite: () {},
          ),
          dark,
        ),
      );
      await t.pumpAndSettle();
      expect(
        find.text(dark ? 'غرفة التحكم' : 'كل العيادة في نظرة'),
        findsOneWidget,
      );
      expect(t.takeException(), isNull);
      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/home-${dark ? 'dark' : 'light'}.png'),
      );
    });
    testWidgets('agenda ${dark ? 'dark' : 'light'} filters and actions', (
      t,
    ) async {
      t.view.physicalSize = const Size(390, 844);
      t.view.devicePixelRatio = 1;
      addTearDown(t.view.resetPhysicalSize);
      addTearDown(t.view.resetDevicePixelRatio);
      await t.pumpWidget(
        shell(AdminBookingsTab(previewAppointments: data()), dark),
      );
      await t.pumpAndSettle();
      expect(find.text('جدول اليوم'), findsOneWidget);
      expect(t.takeException(), isNull);
      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('goldens/agenda-${dark ? 'dark' : 'light'}.png'),
      );
      await t.enterText(find.byType(TextField), 'أحمد');
      await t.pumpAndSettle();
      expect(find.text('أحمد محمود'), findsOneWidget);
      expect(find.text('منى عبد الرحمن'), findsNothing);
      await t.tap(find.byIcon(Icons.close).first);
      await t.pumpAndSettle();
      await t.tap(find.text('مؤكد').first);
      await t.pumpAndSettle();
      expect(find.text('أحمد محمود'), findsNothing);
      expect(find.text('منى عبد الرحمن'), findsOneWidget);
      expect(t.takeException(), isNull);
    });
  }
  test('night mode persists across reload', () async {
    SharedPreferences.setMockInitialValues({});
    await Appearance.load();
    expect(Appearance.mode.value, ThemeMode.light);
    await Appearance.toggle();
    expect(Appearance.mode.value, ThemeMode.dark);
    await Appearance.load();
    expect(Appearance.mode.value, ThemeMode.dark);
    await Appearance.toggle();
  });
}

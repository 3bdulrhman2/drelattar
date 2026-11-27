import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:my_clinic/theme/app_theme.dart';
import 'package:my_clinic/screens/admin/admin_main_screen.dart';
import 'package:my_clinic/services/supabase_service.dart';
import 'package:my_clinic/models/appointment.dart';

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
    await (FontLoader('packages/font_awesome_flutter/FontAwesomeBrands')..addFont(rootBundle.load('packages/font_awesome_flutter/lib/fonts/Font-Awesome-7-Brands-Regular-400.otf'))).load();
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

  for (final width in [320.0, 390.0]) {
    testWidgets('actual shell $width navigation theme menu', (t) async {
      SharedPreferences.setMockInitialValues({});
      await Appearance.load();
      SupabaseService.cachedAppointments = data();
      SupabaseService.cachedSettings = {};
      t.view.physicalSize = Size(width, 844);
      t.view.devicePixelRatio = 1;
      addTearDown(t.view.resetPhysicalSize);
      addTearDown(t.view.resetDevicePixelRatio);
      await t.pumpWidget(
        ValueListenableBuilder<ThemeMode>(
          valueListenable: Appearance.mode,
          builder: (context, mode, _) => MaterialApp(
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: mode,
            locale: const Locale('ar', 'EG'),
            supportedLocales: const [Locale('ar', 'EG')],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: const AdminMainScreen(),
          ),
        ),
      );
      await t.pumpAndSettle();
      await t.runAsync(() async { await precacheImage(const AssetImage('assets/images/clinic_logo.png'),t.element(find.byType(AdminMainScreen))); });
      await t.pumpAndSettle();
      expect(find.byType(BottomNavigationBar), findsOneWidget);
      expect(
        t
            .widget<BottomNavigationBar>(find.byType(BottomNavigationBar))
            .items
            .length,
        5,
      );
      expect(find.byType(Image), findsWidgets);
      expect(find.byTooltip('الوضع الليلي'), findsOneWidget);
      expect(t.takeException(), isNull);
      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('baselines/integrated_test/home-light-$width.png'),
      );
      await t.tap(find.byTooltip('الوضع الليلي'));
      await t.pumpAndSettle();
      expect(Appearance.mode.value, ThemeMode.dark);
      await Appearance.load();
      expect(Appearance.mode.value, ThemeMode.dark);
      expect(find.byTooltip('الوضع النهاري'), findsOneWidget);
      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('baselines/integrated_test/home-dark-$width.png'),
      );
      await t.tap(find.text('الحجوزات').last);
      await t.pumpAndSettle();
      expect(
        t
            .widget<BottomNavigationBar>(find.byType(BottomNavigationBar))
            .currentIndex,
        1,
      );
      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('baselines/integrated_test/agenda-dark-$width.png'),
      );
      await t.ensureVisible(find.byTooltip('تفاصيل وإجراءات الحجز').first);
      await t.tap(find.byTooltip('تفاصيل وإجراءات الحجز').first);
      await t.pumpAndSettle();
      expect(find.text('اتصال هاتفي'), findsOneWidget);
      expect(find.text('تم الكشف').last, findsOneWidget);
      expect(find.text('حذف الحجز'), findsOneWidget);
      await expectLater(
        find.byType(MaterialApp),
        matchesGoldenFile('baselines/integrated_test/menu-dark-$width.png'),
      );
      await t.tapAt(const Offset(5, 90));
      await t.pumpAndSettle();
      for (final item in ['الاستقبال', 'المواعيد', 'المزيد']) {
        await t.tap(find.text(item).last);
        await t.pumpAndSettle();
        expect(t.takeException(), isNull);
        await expectLater(find.byType(MaterialApp),matchesGoldenFile('baselines/integrated_test/tab-$item-$width.png'));
      }
      await t.pumpWidget(const SizedBox());
      await t.pumpAndSettle();
    });
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_clinic/screens/admin/admin_home_tab.dart';
import 'package:my_clinic/screens/secretary/secretary_main_screen.dart';
import 'package:my_clinic/services/supabase_service.dart';
import 'package:my_clinic/theme/app_theme.dart';
void main(){
 setUpAll(()async{await (FontLoader('ClinicArabic')..addFont(rootBundle.load('assets/fonts/Arabic-Regular.ttf'))..addFont(rootBundle.load('assets/fonts/Arabic-Bold.ttf'))).load();await (FontLoader('MaterialIcons')..addFont(rootBundle.load('fonts/MaterialIcons-Regular.otf'))).load();});
 for(final width in [320.0,390.0]){for(final dark in [false,true]){ 
 testWidgets('secretary visual parity keeps admin controls hidden $dark $width',(t)async{
  SupabaseService.cachedSettings={};SupabaseService.cachedAppointments=[];
  t.view.physicalSize=Size(width,844);t.view.devicePixelRatio=1;addTearDown(t.view.resetPhysicalSize);addTearDown(t.view.resetDevicePixelRatio);
  await t.pumpWidget(MaterialApp(debugShowCheckedModeBanner:false,theme:AppTheme.lightTheme,darkTheme:AppTheme.darkTheme,themeMode:dark?ThemeMode.dark:ThemeMode.light,locale:const Locale('ar','EG'),supportedLocales:const [Locale('ar','EG')],localizationsDelegates:const [GlobalMaterialLocalizations.delegate,GlobalWidgetsLocalizations.delegate,GlobalCupertinoLocalizations.delegate],home:const SecretaryMainScreen()));
  await t.pumpAndSettle();
  await t.runAsync(()async{await precacheImage(const AssetImage('assets/images/clinic_logo.png'),t.element(find.byType(SecretaryMainScreen)));});
  await t.pumpAndSettle();
  expect(find.byTooltip('تسجيل الخروج'),findsOneWidget);
  expect(find.byType(AdminHomeTab),findsOneWidget);expect(find.text('إعلان الموقع'),findsNothing);expect(find.text('الموقع'),findsNothing);expect(find.text('المزيد'),findsNothing);expect(find.byTooltip(dark?'الوضع النهاري':'الوضع الليلي'),findsOneWidget);expect(t.takeException(),isNull);
  await expectLater(find.byType(MaterialApp),matchesGoldenFile('parity/secretary-$dark-$width.png'));
  await t.tap(find.byTooltip('تسجيل الخروج'));await t.pumpAndSettle();
  expect(find.text('هل تريد تسجيل الخروج من حساب السكرتير؟'),findsOneWidget);
  await expectLater(find.byType(MaterialApp),matchesGoldenFile('parity/secretary-logout-$dark-$width.png'));
  await t.tap(find.text('إلغاء'));await t.pumpAndSettle();
  expect(find.byType(SecretaryMainScreen),findsOneWidget);expect(t.takeException(),isNull);
 });}}
}

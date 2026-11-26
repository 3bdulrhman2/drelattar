import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_clinic/screens/staff_push_screen.dart';
import 'package:my_clinic/services/auth_service.dart';
import 'package:my_clinic/theme/app_theme.dart';
void main(){
 setUpAll(()async{await(FontLoader('ClinicArabic')..addFont(rootBundle.load('assets/fonts/Arabic-Regular.ttf'))..addFont(rootBundle.load('assets/fonts/Arabic-Bold.ttf'))).load();});
 for(final role in UserRole.values){for(final width in [320.0,390.0]){
 testWidgets('manual staff push safe gates $role $width',(t)async{
  AuthService.currentUser=AppUser(name:'Synthetic',identifier:'synthetic',role:role);
  t.view.physicalSize=Size(width,2400);t.view.devicePixelRatio=1;addTearDown(t.view.resetPhysicalSize);addTearDown(t.view.resetDevicePixelRatio);addTearDown(()=>AuthService.currentUser=null);
  await t.pumpWidget(MaterialApp(debugShowCheckedModeBanner:false,theme:AppTheme.lightTheme,locale:const Locale('ar','EG'),supportedLocales:const[Locale('ar','EG')],localizationsDelegates:const[GlobalMaterialLocalizations.delegate,GlobalWidgetsLocalizations.delegate,GlobalCupertinoLocalizations.delegate],home:const StaffPushScreen()));await t.pumpAndSettle();
  expect(find.byType(TextField),role==UserRole.admin?findsNWidgets(3):findsNothing);
  expect(t.widget<FilledButton>(find.widgetWithText(FilledButton,'تفعيل الاستقبال على هذا الجهاز')).onPressed,isNotNull); if(role==UserRole.admin)expect(t.widget<FilledButton>(find.widgetWithText(FilledButton,'مراجعة وإرسال')).onPressed,isNull);
  expect(find.textContaining('الإرسال غير مفعّل'),findsOneWidget);expect(t.takeException(),isNull);
 });}}
}
